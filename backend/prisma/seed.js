const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  console.log('Début du seeding... 🌱');

  const password = await bcrypt.hash('password123', 10);

  const recruiter = await prisma.user.upsert({
    where: { email: 'recruteur@demo.tn' },
    update: {},
    create: { email: 'recruteur@demo.tn', password, role: 'RECRUTEUR', nom: 'Ben Salah', prenom: 'Sami', entreprise: 'TechCorp Tunisia' },
  });
  await prisma.user.upsert({
    where: { email: 'candidat@demo.tn' },
    update: {},
    create: { email: 'candidat@demo.tn', password, role: 'CANDIDAT', nom: 'Trabelsi', prenom: 'Amel', enChomage: true },
  });

  // On nettoie les offres de démonstration du recruteur avant de les recréer
  const old = await prisma.job.findMany({ where: { recruiterId: recruiter.id }, select: { id: true } });
  await prisma.candidature.deleteMany({ where: { jobId: { in: old.map((j) => j.id) } } });
  await prisma.job.deleteMany({ where: { recruiterId: recruiter.id } });

  const now = new Date();
  const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

  await prisma.job.createMany({
    data: [
      {
        title: 'Développeur Full-Stack React/Express',
        company: 'TechCorp Tunisia',
        description: "Nous recherchons un développeur passionné pour faire évoluer notre plateforme de recrutement IA. React, Node.js, PostgreSQL. Télétravail partiel possible.",
        type: 'CDI', contract: 'Hybride', location: 'Tunis', status: 'live',
        publishedAt: now, recruiterId: recruiter.id,
      },
      {
        title: 'Ingénieur IA / NLP',
        company: 'TechCorp Tunisia',
        description: "Rejoignez notre équipe pour travailler sur l'intégration de modèles de langage et le scoring automatique de CV.",
        type: 'CDI', contract: 'Temps plein', location: 'Sousse', status: 'live',
        publishedAt: daysAgo(5), createdAt: daysAgo(5), recruiterId: recruiter.id,
      },
      {
        title: 'Stage PFE – Développement web',
        company: 'TechCorp Tunisia',
        description: "Stage de fin d'études de 6 mois au sein de l'équipe produit : conception et développement de nouvelles fonctionnalités.",
        type: 'Stage', contract: 'Temps plein', location: 'Tunis', status: 'draft',
        recruiterId: recruiter.id,
      },
      {
        title: 'Designer UI/UX',
        company: 'TechCorp Tunisia',
        description: "Mission freelance de 3 mois pour la refonte de l'interface de notre application candidat.",
        type: 'Freelance', contract: 'Télétravail', location: 'À distance', status: 'closed',
        publishedAt: daysAgo(30), createdAt: daysAgo(30), recruiterId: recruiter.id,
      },
    ],
  });

  console.log('Seed terminé. Comptes de démo (mot de passe : password123) :');
  console.log(' - recruteur@demo.tn');
  console.log(' - candidat@demo.tn');
}

main()
  .catch((e) => {
    console.error('Erreur lors du seeding :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
