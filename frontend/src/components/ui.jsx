import { useEffect } from 'react';
import Icon from './Icons';
import { CANDIDATURE_STATUS, JOB_STATUS, initials, scoreTone } from '../utils';

const MARK_COLORS = [
  ['#e3eefa', '#185fa5'],
  ['#e5f5ee', '#17795a'],
  ['#fdf1df', '#a9690a'],
  ['#efe9fb', '#6246b0'],
  ['#fbe9ee', '#b03358'],
  ['#e4f4f6', '#17727e'],
];

// Pastille de l'entreprise (initiale colorée, couleur stable selon le nom)
export function CompanyMark({ name = '?', size = 40 }) {
  const hash = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const [bg, fg] = MARK_COLORS[hash % MARK_COLORS.length];
  return (
    <span
      className="company-mark"
      style={{ width: size, height: size, background: bg, color: fg, fontSize: size * 0.42 }}
      aria-hidden="true"
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  );
}

export function Avatar({ first, last, size = 36 }) {
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden="true">
      {initials(first, last) || '?'}
    </span>
  );
}

// Badge "New" (point rouge qui pulse) : affiché 24 h après la mise en ligne
export function NewBadge() {
  return (
    <span className="badge badge-new">
      <span className="pulse-dot" /> New
    </span>
  );
}

// Badge d'état d'une offre (brouillon / clôturée). Les offres en ligne n'ont pas de badge fixe.
export function JobStateBadge({ status }) {
  if (status !== 'draft' && status !== 'closed') return null;
  return <span className={`badge badge-${status}`}>{JOB_STATUS[status]}</span>;
}

export function CandidatureBadge({ status, view = 'recruiter' }) {
  const config = CANDIDATURE_STATUS[status] || CANDIDATURE_STATUS.nouveau;
  return <span className={`badge badge-tone-${config.tone}`}>{config[view]}</span>;
}

export function ScorePill({ score }) {
  if (score === null || score === undefined) return <span className="score-pill score-neutral">Non évalué</span>;
  return <span className={`score-pill score-${scoreTone(score)}`}>{score}%</span>;
}

// Anneau de score animé
export function ScoreRing({ value, size = 120 }) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - value / 100);
  return (
    <div className={`score-ring score-${scoreTone(value)}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className="ring-value"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ '--ring-from': circumference }}
        />
      </svg>
      <span className="score-ring-text">
        <strong>{value}</strong>
        <small>/ 100</small>
      </span>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon = 'file', title, text, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={22} />
      </span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="empty-state empty-error" role="alert">
      <span className="empty-icon">
        <Icon name="alert" size={22} />
      </span>
      <h3>Chargement impossible</h3>
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          Réessayer
        </button>
      )}
    </div>
  );
}

export function CardsSkeleton({ count = 6 }) {
  return (
    <div className="jobs-grid" aria-busy="true" aria-label="Chargement">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="job-card skeleton" />
      ))}
    </div>
  );
}

export function Spinner() {
  return <span className="spinner" aria-hidden="true" />;
}

export function ConfirmModal({ title, text, confirmLabel, busy, onConfirm, onCancel }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="modal-title" onClick={(e) => e.stopPropagation()}>
        <h3 id="modal-title">{title}</h3>
        <p>{text}</p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            Annuler
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={busy} autoFocus>
            {busy ? 'Suppression…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
