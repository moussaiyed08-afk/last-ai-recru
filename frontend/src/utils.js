export const DAY_MS = 24 * 60 * 60 * 1000;

// Score minimal pour pouvoir envoyer sa candidature
export const MIN_SCORE = 70;

export const JOB_TYPES = ['CDI', 'CDD', 'Stage', 'Freelance', 'Alternance'];
export const JOB_MODES = ['Temps plein', 'Temps partiel', 'Hybride', 'Télétravail'];

export const JOB_STATUS = {
  live: 'En ligne',
  draft: 'Brouillon',
  closed: 'Clôturée',
};

// Libellés d'une candidature : vue recruteur / vue candidat
export const CANDIDATURE_STATUS = {
  nouveau: { recruiter: 'Nouveau', candidate: 'Envoyée', tone: 'brand' },
  vu: { recruiter: 'CV consulté', candidate: 'Consultée', tone: 'neutral' },
  entretien: { recruiter: 'Entretien', candidate: 'Entretien prévu', tone: 'warn' },
  accepte: { recruiter: 'Accepté', candidate: 'Acceptée', tone: 'ok' },
  refuse: { recruiter: 'Refusé', candidate: 'Refusée', tone: 'bad' },
};

// Une offre est "New" pendant 24 h après sa mise en ligne
export function isNewJob(job) {
  if ((job.status || 'live') !== 'live') return false;
  const since = new Date(job.publishedAt || job.createdAt).getTime();
  return Date.now() - since < DAY_MS;
}

export function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  return formatDate(date);
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function scoreTone(score) {
  if (score === null || score === undefined) return 'neutral';
  if (score >= MIN_SCORE) return 'ok';
  if (score >= 40) return 'warn';
  return 'bad';
}

export function initials(...parts) {
  return parts
    .filter(Boolean)
    .map((p) => p.trim().charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function fullName(user) {
  return [user?.prenom, user?.nom].filter(Boolean).join(' ') || user?.email || '';
}
