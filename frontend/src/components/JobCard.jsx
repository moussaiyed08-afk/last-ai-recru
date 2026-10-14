import { Link } from 'react-router-dom';
import { isNewJob, timeAgo } from '../utils';
import Icon from './Icons';
import { CompanyMark, NewBadge } from './ui';

// Carte d'offre côté candidat
export default function JobCard({ job, saved, onToggleSave }) {
  const company = job.company || job.recruiter?.entreprise || 'Entreprise';
  return (
    <article className="job-card">
      <div className="job-card-top">
        <div className="job-card-head">
          <CompanyMark name={company} />
          <div>
            <h3 className="job-card-title">{job.title}</h3>
            <p className="job-card-company">{company}</p>
          </div>
        </div>
        {isNewJob(job) && <NewBadge />}
      </div>

      <div className="job-card-tags">
        {job.type && <span className="tag">{job.type}</span>}
        {job.contract && <span className="tag">{job.contract}</span>}
      </div>

      <div className="job-card-meta">
        {job.location && <span><Icon name="pin" size={14} />{job.location}</span>}
        <span><Icon name="clock" size={14} />{timeAgo(job.publishedAt || job.createdAt)}</span>
      </div>

      <div className="job-card-actions">
        {job.applied ? (
          <span className="badge badge-tone-ok"><Icon name="check" size={13} strokeWidth={2.2} /> Postulé</span>
        ) : (
          <Link to={`/job/${job.id}`} className="btn btn-primary btn-sm">Voir l'offre</Link>
        )}
        {job.applied && <Link to={`/job/${job.id}`} className="btn btn-ghost btn-sm">Détails</Link>}
        <span className="spacer" />
        <button
          className={`btn-icon btn-save${saved ? ' btn-save-on' : ''}`}
          onClick={() => onToggleSave(job.id)}
          aria-pressed={saved}
          title={saved ? 'Retirer des sauvegardes' : 'Sauvegarder'}
          aria-label={saved ? `Retirer ${job.title} des sauvegardes` : `Sauvegarder ${job.title}`}
        >
          <Icon name="bookmark" size={18} filled={saved} />
        </button>
      </div>
    </article>
  );
}
