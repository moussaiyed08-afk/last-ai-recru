require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OpenAI } = require('openai');
const nodemailer = require('nodemailer');
const { parseDataUrl, extractCvText } = require('./cvText');

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'mon_secret_tres_securise';
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET absent du .env : une valeur par défaut est utilisée (à changer en production).');
}

const JOB_TYPES = ['CDI', 'CDD', 'Stage', 'Freelance', 'Alternance'];
const JOB_MODES = ['Temps plein', 'Temps partiel', 'Hybride', 'Télétravail'];
const JOB_STATUSES = ['live', 'draft', 'closed'];
const CANDIDATURE_STATUSES = ['nouveau', 'vu', 'entretien', 'accepte', 'refuse'];
const MAX_CV_BYTES = 5 * 1024 * 1024;

// Configuration du transporteur Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================
// OUTILS
// ============================================================

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function requireAuth(...roles) {
  return (req, res, next) => {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentification requise' });
    }
    try {
      const payload = jwt.verify(header.slice(7), JWT_SECRET);
      if (roles.length && !roles.includes(payload.role)) {
        return res.status(403).json({ error: 'Accès refusé pour ce rôle' });
      }
      req.auth = payload;
      next();
    } catch {
      return res.status(401).json({ error: 'Session expirée, reconnectez-vous' });
    }
  };
}

function authOptional(req, _res, next) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    try {
      req.auth = jwt.verify(header.slice(7), JWT_SECRET);
    } catch {
      /* token invalide : on continue comme visiteur */
    }
  }
  next();
}

function parseId(value) {
  const id = parseInt(value, 10);
  return Number.isNaN(id) ? null : id;
}

async function getOwnedJob(req, res) {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'Identifiant invalide' });
    return null;
  }
  const job = await prisma.job.findUnique({ where: { id } });
  if (!job || job.recruiterId !== req.auth.userId) {
    res.status(404).json({ error: 'Offre introuvable' });
    return null;
  }
  return job;
}

function cleanJobInput(body, { partial = false } = {}) {
  const errors = {};
  const data = {};
  const has = (key) => body[key] !== undefined;
  const text = (key) => String(body[key] ?? '').trim();

  if (!partial || has('title')) {
    const title = text('title');
    if (title.length < 3) errors.title = 'Le titre doit contenir au moins 3 caractères';
    else data.title = title.slice(0, 120);
  }
  if (!partial || has('description')) {
    const description = text('description');
    if (description.length < 20) errors.description = 'La description doit contenir au moins 20 caractères';
    else data.description = description.slice(0, 10000);
  }
  if (!partial || has('company')) {
    const company = text('company');
    if (!company) errors.company = "Indiquez le nom de l'entreprise";
    else data.company = company.slice(0, 120);
  }
  if (has('location')) data.location = text('location').slice(0, 120);
  if (has('type')) {
    if (!JOB_TYPES.includes(body.type)) errors.type = 'Type de contrat invalide';
    else data.type = body.type;
  }
  if (has('contract')) {
    if (!JOB_MODES.includes(body.contract)) errors.contract = 'Organisation du travail invalide';
    else data.contract = body.contract;
  }
  if (has('status')) {
    if (!JOB_STATUSES.includes(body.status)) errors.status = 'Statut invalide';
    else data.status = body.status;
  }
  return { data, errors };
}

// ============================================================
// SCORE IA
// ============================================================
async function calculateScore(jobDescription, cvText) {
  const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1',
  });

  // Utilisation des modèles actifs sur Groq
  const modelsToTry = [
    'openai/gpt-oss-20b',
    'openai/gpt-oss-120b'
  ];

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: 'Expert recruteur. Réponds uniquement avec un nombre entier entre 0 et 100.' },
          {
            role: 'user',
            content: `Offre: ${jobDescription.substring(0, 2000)}\n\nCV: ${cvText.substring(0, 8000)}\n\nDonne le score:`,
          },
        ],
        temperature: 0.1,
        max_tokens: 5,
      });

      const score = parseInt(completion.choices[0].message.content.replace(/[^0-9]/g, ''), 10);
      if (!Number.isNaN(score)) {
        return Math.max(0, Math.min(100, score));
      }
    } catch (err) {
      lastError = err;
      console.warn(`[Groq] Le modèle ${model} n'a pas répondu (${err.message}). Essai du suivant...`);
    }
  }

  throw new Error(`Aucun modèle IA disponible. Dernière erreur : ${lastError?.message || 'Inconnue'}`);
}

async function readCvOrFail(req, res) {
  const { cvBase64, fileName } = req.body || {};
  if (!cvBase64 || !fileName) {
    res.status(400).json({ error: 'CV manquant' });
    return null;
  }
  const parsed = parseDataUrl(cvBase64);
  if (!parsed) {
    res.status(400).json({ error: 'Format de CV invalide' });
    return null;
  }
  if (parsed.buffer.length > MAX_CV_BYTES) {
    res.status(413).json({ error: 'CV trop volumineux (5 Mo maximum)' });
    return null;
  }
  const text = await extractCvText(cvBase64, fileName);
  if (text.length < 50) {
    res.status(422).json({
      error: "Impossible de lire le texte de ce CV. Utilisez un PDF ou un fichier Word (.docx) qui n'est pas une image scannée.",
    });
    return null;
  }
  return text;
}

// ============================================================
// AUTHENTIFICATION
// ============================================================
app.post('/api/auth/register', wrap(async (req, res) => {
  const { nom, prenom, email, password, role, entreprise, enChomage } = req.body || {};

  if (!nom?.trim() || !prenom?.trim()) return res.status(400).json({ error: 'Nom et prénom obligatoires' });
  if (!/^\S+@\S+\.\S+$/.test(email || '')) return res.status(400).json({ error: 'Adresse email invalide' });
  if (!password || password.length < 6) return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
  if (!['CANDIDAT', 'RECRUTEUR'].includes(role)) return res.status(400).json({ error: 'Rôle invalide' });
  if (role === 'RECRUTEUR' && !entreprise?.trim()) return res.status(400).json({ error: "Le nom de l'entreprise est obligatoire pour un recruteur" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role,
        entreprise: role === 'RECRUTEUR' ? entreprise.trim() : null,
        enChomage: role === 'CANDIDAT' ? Boolean(enChomage) : null,
      },
    });
    res.status(201).json({ message: 'Utilisateur créé avec succès' });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Cette adresse email est déjà utilisée' });
    console.error('Erreur inscription :', error);
    res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
}));

app.post('/api/auth/login', wrap(async (req, res) => {
  const { email, password } = req.body || {};
  const user = await prisma.user.findUnique({ where: { email: String(email || '').trim().toLowerCase() } });
  if (!user || !(await bcrypt.compare(String(password || ''), user.password))) {
    return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
  }
  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      nom: user.nom,
      prenom: user.prenom,
      entreprise: user.entreprise,
    },
  });
}));

// ============================================================
// OFFRES : partie publique (candidats)
// ============================================================
const PUBLIC_RECRUITER = { select: { entreprise: true } };

app.get('/api/jobs', authOptional, wrap(async (req, res) => {
  const jobs = await prisma.job.findMany({
    where: { status: 'live' },
    include: { recruiter: PUBLIC_RECRUITER },
  });
  jobs.sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));

  let appliedIds = new Set();
  if (req.auth?.role === 'CANDIDAT') {
    const applied = await prisma.candidature.findMany({
      where: { candidatId: req.auth.userId, jobId: { in: jobs.map((j) => j.id) } },
      select: { jobId: true },
    });
    appliedIds = new Set(applied.map((c) => c.jobId));
  }
  res.json(jobs.map((job) => ({ ...job, applied: appliedIds.has(job.id) })));
}));

app.get('/api/jobs/:id', authOptional, wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (id === null) return res.status(400).json({ error: 'Identifiant invalide' });

  const job = await prisma.job.findUnique({ where: { id }, include: { recruiter: PUBLIC_RECRUITER } });
  const isOwner = job && req.auth?.userId === job.recruiterId;

  if (!job || (job.status === 'draft' && !isOwner)) {
    return res.status(404).json({ error: 'Offre non trouvée' });
  }

  let applied = false;
  if (req.auth?.role === 'CANDIDAT') {
    const existing = await prisma.candidature.findFirst({ where: { jobId: id, candidatId: req.auth.userId } });
    applied = Boolean(existing);
  }
  res.json({ ...job, applied });
}));

// ============================================================
// OFFRES : partie recruteur
// ============================================================
app.get('/api/recruteur/jobs', requireAuth('RECRUTEUR'), wrap(async (req, res) => {
  const jobs = await prisma.job.findMany({
    where: { recruiterId: req.auth.userId },
    include: { _count: { select: { candidatures: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(jobs.map(({ _count, ...job }) => ({ ...job, applicantsCount: _count.candidatures })));
}));

app.post('/api/jobs', requireAuth('RECRUTEUR'), wrap(async (req, res) => {
  const recruiter = await prisma.user.findUnique({ where: { id: req.auth.userId } });
  const body = { ...req.body, company: String(req.body?.company ?? '').trim() || recruiter?.entreprise || '' };
  const { data, errors } = cleanJobInput(body);
  if (Object.keys(errors).length) {
    return res.status(400).json({ error: Object.values(errors)[0], errors });
  }

  const status = data.status === 'draft' ? 'draft' : 'live';
  const job = await prisma.job.create({
    data: {
      ...data,
      status,
      publishedAt: status === 'live' ? new Date() : null,
      recruiterId: req.auth.userId,
    },
  });
  res.status(201).json({ message: status === 'live' ? 'Offre publiée' : 'Brouillon enregistré', job });
}));

app.put('/api/jobs/:id', requireAuth('RECRUTEUR'), wrap(async (req, res) => {
  const job = await getOwnedJob(req, res);
  if (!job) return;

  const { data, errors } = cleanJobInput(req.body || {}, { partial: true });
  if (Object.keys(errors).length) {
    return res.status(400).json({ error: Object.values(errors)[0], errors });
  }

  if (data.status === 'live' && job.status !== 'live') data.publishedAt = new Date();

  const updatedJob = await prisma.job.update({ where: { id: job.id }, data });
  res.json({ message: 'Offre mise à jour avec succès', updatedJob });
}));

app.delete('/api/jobs/:id', requireAuth('RECRUTEUR'), wrap(async (req, res) => {
  const job = await getOwnedJob(req, res);
  if (!job) return;

  await prisma.$transaction([
    prisma.candidature.deleteMany({ where: { jobId: job.id } }),
    prisma.job.delete({ where: { id: job.id } }),
  ]);
  res.json({ message: 'Offre et candidatures supprimées avec succès' });
}));

// ============================================================
// CANDIDATURES : partie candidat
// ============================================================
app.post('/api/jobs/:id/analyze', requireAuth('CANDIDAT'), wrap(async (req, res) => {
  const jobId = parseId(req.params.id);
  const job = jobId === null ? null : await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.status === 'draft') return res.status(404).json({ error: 'Offre introuvable' });
  if (job.status === 'closed') return res.status(409).json({ error: 'Cette offre est clôturée' });

  const cvText = await readCvOrFail(req, res);
  if (cvText === null) return;

  try {
    const score = await calculateScore(job.description, cvText);
    res.json({ score });
  } catch (err) {
    console.error("Erreur d'analyse IA :", err.message);
    res.status(502).json({ error: "Le service d'analyse est momentanément indisponible. Réessayez dans un instant." });
  }
}));

app.post('/api/apply/:id', requireAuth('CANDIDAT'), wrap(async (req, res) => {
  const jobId = parseId(req.params.id);
  const job = jobId === null ? null : await prisma.job.findUnique({ where: { id: jobId }, include: { recruiter: true } });
  if (!job || job.status === 'draft') return res.status(404).json({ error: 'Offre introuvable' });
  if (job.status === 'closed') return res.status(409).json({ error: 'Cette offre est clôturée' });

  const already = await prisma.candidature.findFirst({ where: { jobId, candidatId: req.auth.userId } });
  if (already) return res.status(409).json({ error: 'Vous avez déjà postulé à cette offre' });

  const cvText = await readCvOrFail(req, res);
  if (cvText === null) return;

  let score = null;
  try {
    score = await calculateScore(job.description, cvText);
  } catch (err) {
    console.error('Score IA indisponible, candidature enregistrée sans score :', err.message);
  }

  let candidature;
  try {
    candidature = await prisma.candidature.create({
      data: { fileName: req.body.fileName, cvContent: req.body.cvBase64, jobId, score, candidatId: req.auth.userId },
    });
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'Vous avez déjà postulé à cette offre' });
    throw err;
  }

  if (job.recruiter?.email) {
    const candidat = await prisma.user.findUnique({ where: { id: req.auth.userId } });
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: job.recruiter.email,
        subject: `Nouvelle candidature pour : ${job.title}`,
        text:
          `Bonjour, ${candidat?.prenom || 'un candidat'} ${candidat?.nom || ''} a postulé pour votre offre "${job.title}".\n\n` +
          `Score de correspondance : ${score !== null ? `${score}%` : 'non disponible'}.\nFichier : ${req.body.fileName}`,
      });
      console.log('✅ Email envoyé avec succès !');
    } catch (mailError) {
      console.error("❌ ERREUR LORS DE L'ENVOI DU MAIL :", mailError.message);
    }
  }

  res.status(201).json({ message: 'Candidature envoyée', score, candidatureId: candidature.id });
}));

app.get('/api/candidat/candidatures', requireAuth('CANDIDAT'), wrap(async (req, res) => {
  const list = await prisma.candidature.findMany({
    where: { candidatId: req.auth.userId },
    select: {
      id: true,
      score: true,
      status: true,
      createdAt: true,
      job: { select: { id: true, title: true, company: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(list);
}));

// ============================================================
// CANDIDATURES : partie recruteur
// ============================================================
app.get('/api/recruteur/candidatures', requireAuth('RECRUTEUR'), wrap(async (req, res) => {
  const list = await prisma.candidature.findMany({
    where: { job: { recruiterId: req.auth.userId } },
    select: {
      id: true,
      fileName: true,
      score: true,
      status: true,
      createdAt: true,
      job: { select: { id: true, title: true } },
      candidat: { select: { nom: true, prenom: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(list);
}));

async function getOwnedCandidature(req, res) {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: 'Identifiant invalide' });
    return null;
  }
  const candidature = await prisma.candidature.findUnique({ where: { id }, include: { job: true } });
  if (!candidature || candidature.job.recruiterId !== req.auth.userId) {
    res.status(404).json({ error: 'Candidature introuvable' });
    return null;
  }
  return candidature;
}

app.patch('/api/recruteur/candidatures/:id', requireAuth('RECRUTEUR'), wrap(async (req, res) => {
  const candidature = await getOwnedCandidature(req, res);
  if (!candidature) return;
  if (!CANDIDATURE_STATUSES.includes(req.body?.status)) return res.status(400).json({ error: 'Statut invalide' });

  const updated = await prisma.candidature.update({
    where: { id: candidature.id },
    data: { status: req.body.status },
    select: { id: true, status: true },
  });
  res.json(updated);
}));

app.get('/api/recruteur/candidatures/:id/cv', requireAuth('RECRUTEUR'), wrap(async (req, res) => {
  const candidature = await getOwnedCandidature(req, res);
  if (!candidature) return;

  const parsed = parseDataUrl(candidature.cvContent);
  if (!parsed) return res.status(404).json({ error: 'CV illisible' });

  if (candidature.status === 'nouveau') {
    await prisma.candidature.update({ where: { id: candidature.id }, data: { status: 'vu' } });
  }
  res.set({
    'Content-Type': parsed.mime,
    'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(candidature.fileName)}`,
  });
  res.send(parsed.buffer);
}));

// ============================================================
// RAPPORTS (recruteur)
// ============================================================
app.get('/api/recruteur/rapports', requireAuth('RECRUTEUR'), wrap(async (req, res) => {
  const recruiterId = req.auth.userId;
  const [jobs, candidatures] = await Promise.all([
    prisma.job.findMany({ where: { recruiterId }, select: { id: true, title: true, status: true } }),
    prisma.candidature.findMany({
      where: { job: { recruiterId } },
      select: { id: true, score: true, status: true, createdAt: true, jobId: true },
    }),
  ]);

  const perDay = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    perDay.push({ date: d.toISOString(), count: 0, start: d.getTime() });
  }
  candidatures.forEach((c) => {
    const t = new Date(c.createdAt).getTime();
    for (let i = perDay.length - 1; i >= 0; i--) {
      if (t >= perDay[i].start) {
        perDay[i].count += 1;
        break;
      }
    }
  });

  const scored = candidatures.filter((c) => c.score !== null);
  const bucket = (min, max) => scored.filter((c) => c.score >= min && c.score <= max).length;

  const statuses = Object.fromEntries(CANDIDATURE_STATUSES.map((s) => [s, 0]));
  candidatures.forEach((c) => {
    statuses[c.status] = (statuses[c.status] || 0) + 1;
  });

  const topJobs = jobs
    .map((job) => {
      const list = candidatures.filter((c) => c.jobId === job.id);
      const withScore = list.filter((c) => c.score !== null);
      return {
        id: job.id,
        title: job.title,
        status: job.status,
        count: list.length,
        avgScore: withScore.length ? Math.round(withScore.reduce((s, c) => s + c.score, 0) / withScore.length) : null,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  res.json({
    totals: {
      jobs: jobs.length,
      liveJobs: jobs.filter((j) => j.status === 'live').length,
      candidatures: candidatures.length,
      avgScore: scored.length ? Math.round(scored.reduce((s, c) => s + c.score, 0) / scored.length) : null,
      interviews: statuses.entretien + statuses.accepte,
    },
    perDay: perDay.map(({ date, count }) => ({ date, count })),
    scoreBuckets: [
      { label: '80 à 100', count: bucket(80, 100), tone: 'ok' },
      { label: '60 à 79', count: bucket(60, 79), tone: 'brand' },
      { label: '40 à 59', count: bucket(40, 59), tone: 'warn' },
      { label: '0 à 39', count: bucket(0, 39), tone: 'bad' },
    ],
    unscored: candidatures.length - scored.length,
    statuses,
    topJobs,
  });
}));

// ============================================================
// DIVERS
// ============================================================
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api', (_req, res) => res.status(404).json({ error: 'Route introuvable' }));

// Gestion centralisée des erreurs
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Fichier trop volumineux' });
  console.error('Erreur serveur :', err);
  res.status(500).json({ error: 'Erreur serveur' });
});

app.listen(PORT, () => console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`));