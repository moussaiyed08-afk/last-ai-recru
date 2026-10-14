import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { useFetch, useSavedJobs } from '../hooks';
import { useToast } from '../toast';
import { MIN_SCORE, isNewJob, timeAgo } from '../utils';
import Icon from './Icons';
import Layout from './Layout';
import { CompanyMark, ErrorState, JobStateBadge, NewBadge, ScoreRing, Spinner } from './ui';

const MAX_SIZE = 5 * 1024 * 1024;

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Lecture du fichier impossible'));
    reader.readAsDataURL(file);
  });

// Panneau "Postuler" : choix du CV, analyse, envoi
function ApplyPanel({ job, onApplied }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [cv, setCv] = useState(null); // { name, dataUrl }
  const [score, setScore] = useState(null);
  const [step, setStep] = useState('idle'); // idle | analyzing | scored | sending
  const [error, setError] = useState('');

  if (job.status === 'closed') {
    return (
      <div className="apply-card">
        <h3>Offre clôturée</h3>
        <p className="apply-text">Cette offre n'accepte plus de candidatures.</p>
      </div>
    );
  }

  if (job.applied) {
    return (
      <div className="apply-card apply-done">
        <span className="apply-done-icon"><Icon name="check" size={22} strokeWidth={2.2} /></span>
        <h3>Candidature envoyée</h3>
        <p className="apply-text">Le recruteur a reçu votre CV. Suivez sa réponse dans votre espace.</p>
        <Link to="/candidat/candidatures" className="btn btn-secondary btn-block">Mes candidatures</Link>
      </div>
    );
  }

  const pickFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setError('');

    if (!/\.(pdf|docx)$/i.test(file.name)) return setError('Format non pris en charge : utilisez un PDF ou un fichier Word (.docx).');
    if (file.size > MAX_SIZE) return setError('Ce fichier dépasse 5 Mo.');

    setStep('analyzing');
    setScore(null);
    try {
      const dataUrl = await readAsDataUrl(file);
      const res = await api(`/api/jobs/${job.id}/analyze`, { method: 'POST', body: { cvBase64: dataUrl, fileName: file.name } });
      setCv({ name: file.name, dataUrl });
      setScore(res.score);
      setStep('scored');
    } catch (err) {
      setError(err.message);
      setStep('idle');
    }
  };

  const send = async () => {
    setStep('sending');
    setError('');
    try {
      await api(`/api/apply/${job.id}`, { method: 'POST', body: { cvBase64: cv.dataUrl, fileName: cv.name } });
      toast('Candidature envoyée');
      onApplied();
    } catch (err) {
      setError(err.message);
      setStep('scored');
    }
  };

  const good = score >= MIN_SCORE;

  return (
    <div className="apply-card">
      <input ref={inputRef} type="file" accept=".pdf,.docx" onChange={pickFile} hidden />

      {step === 'analyzing' && (
        <div className="apply-state">
          <Spinner />
          <strong>Analyse de votre CV…</strong>
          <p className="apply-text">Nous le comparons à l'offre, cela prend quelques secondes.</p>
        </div>
      )}

      {(step === 'scored' || step === 'sending') && (
        <div className="apply-state">
          <ScoreRing value={score} />
          <strong>{good ? 'Très bon profil pour ce poste' : 'Profil partiellement adapté'}</strong>
          <p className="apply-text">
            {good
              ? `Votre CV « ${cv.name} » correspond bien à l'offre.`
              : `Il faut au moins ${MIN_SCORE} pour postuler. Adaptez votre CV aux compétences demandées, puis relancez l'analyse.`}
          </p>
          {good && (
            <button className="btn btn-primary btn-block" onClick={send} disabled={step === 'sending'}>
              {step === 'sending' ? <Spinner /> : <Icon name="send" size={16} />} Envoyer ma candidature
            </button>
          )}
          <button className="btn btn-ghost btn-block" onClick={() => inputRef.current.click()} disabled={step === 'sending'}>
            Analyser un autre CV
          </button>
        </div>
      )}

      {step === 'idle' && (
        <>
          <h3>Postuler à cette offre</h3>
          <p className="apply-text">Votre CV est comparé à l'offre avant l'envoi : vous voyez votre score avant de postuler.</p>
          <button className="dropzone" onClick={() => inputRef.current.click()}>
            <Icon name="upload" size={22} />
            <strong>Choisir mon CV</strong>
            <small>PDF ou Word (.docx), 5 Mo maximum</small>
          </button>
        </>
      )}

      {error && <p className="apply-error" role="alert">{error}</p>}
    </div>
  );
}

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: job, loading, error, reload, setData } = useFetch(`/api/jobs/${id}`);
  const saved = useSavedJobs();
  const isCandidate = user.role === 'CANDIDAT';

  return (
    <Layout activeKey="jobs">
      <button className="back-link" onClick={() => navigate(-1)}>
        <Icon name="arrowLeft" size={16} /> Retour
      </button>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="card table-skeleton skeleton" />
      ) : (
        <div className="details-layout">
          <article className="card details-main">
            <div className="details-head">
              <CompanyMark name={job.company} size={56} />
              <div>
                <h1 className="details-title">{job.title}</h1>
                <p className="details-company">{job.company}</p>
              </div>
              {isNewJob(job) ? <NewBadge /> : <JobStateBadge status={job.status} />}
            </div>

            <div className="job-card-tags">
              {job.type && <span className="tag">{job.type}</span>}
              {job.contract && <span className="tag">{job.contract}</span>}
              {job.location && <span className="tag"><Icon name="pin" size={12} /> {job.location}</span>}
              <span className="tag">Publiée {timeAgo(job.publishedAt || job.createdAt)}</span>
            </div>

            <h2 className="details-h2">Description du poste</h2>
            <p className="details-description">{job.description}</p>
          </article>

          <aside className="details-side">
            {isCandidate ? (
              <>
                <ApplyPanel job={job} onApplied={() => setData((j) => ({ ...j, applied: true }))} />
                <button
                  className={`btn btn-secondary btn-block${saved.isSaved(job.id) ? ' btn-save-on' : ''}`}
                  onClick={() => saved.toggle(job.id)}
                >
                  <Icon name="bookmark" size={16} filled={saved.isSaved(job.id)} />
                  {saved.isSaved(job.id) ? 'Offre sauvegardée' : 'Sauvegarder l\'offre'}
                </button>
              </>
            ) : (
              <div className="apply-card">
                <h3>Aperçu recruteur</h3>
                <p className="apply-text">Voici l'offre telle que les candidats la voient.</p>
                <Link to={`/edit-job/${job.id}`} className="btn btn-secondary btn-block">Modifier l'offre</Link>
                <Link to={`/job/${job.id}/candidatures`} className="btn btn-ghost btn-block">Voir les candidatures</Link>
              </div>
            )}
          </aside>
        </div>
      )}
    </Layout>
  );
}
