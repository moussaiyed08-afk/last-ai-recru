import { useFetch } from '../hooks';
import { useAuth } from '../auth';
import Layout, { StatCard } from './Layout';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, JobStateBadge, PageHeader, ScorePill } from './ui';
import { CANDIDATURE_STATUS } from '../utils';

const STATUS_COLORS = {
  nouveau: 'var(--brand)',
  vu: '#8b97a8',
  entretien: '#e0a13a',
  accepte: 'var(--ok)',
  refuse: 'var(--bad)',
};

function DayChart({ days }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div className="day-chart" role="img" aria-label="Candidatures reçues sur les 14 derniers jours">
      {days.map((d, i) => {
        const date = new Date(d.date);
        return (
          <div key={d.date} className="day-col" title={`${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} : ${d.count}`}>
            <span className="day-value">{d.count || ''}</span>
            <span className="day-bar-wrap">
              <span className="day-bar" style={{ height: `${(d.count / max) * 100}%` }} data-empty={d.count === 0} />
            </span>
            <span className="day-label">{i % 2 === 0 || i === days.length - 1 ? date.getDate() : ''}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function Rapports() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/api/recruteur/rapports');

  return (
    <Layout activeKey="rapports">
      <PageHeader title="Rapports" subtitle={`Activité de recrutement de ${user.entreprise || 'votre entreprise'}.`} />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="card table-skeleton skeleton" />
      ) : data.totals.candidatures === 0 ? (
        <EmptyState
          icon="chart"
          title="Pas encore de données"
          text="Les rapports se remplissent dès que vous recevez des candidatures."
          action={<Link to="/" className="btn btn-primary">Voir mes offres</Link>}
        />
      ) : (
        <>
          <div className="stats-row">
            <StatCard value={data.totals.candidatures} label="Candidatures reçues" accent="var(--brand)" />
            <StatCard value={data.totals.avgScore !== null ? `${data.totals.avgScore}%` : '–'} label="Score moyen" accent="var(--ok)" />
            <StatCard value={data.totals.interviews} label="Entretiens et acceptés" accent="#e0a13a" />
            <StatCard value={`${data.totals.liveJobs}/${data.totals.jobs}`} label="Offres en ligne" accent="var(--new)" />
          </div>

          <div className="report-grid">
            <section className="card report-card report-wide">
              <h3>Candidatures des 14 derniers jours</h3>
              <DayChart days={data.perDay} />
            </section>

            <section className="card report-card">
              <h3>Qualité des profils</h3>
              <div className="bars">
                {data.scoreBuckets.map((b) => {
                  const total = Math.max(1, data.totals.candidatures - data.unscored);
                  return (
                    <div key={b.label} className="bar-line">
                      <span>{b.label}</span>
                      <i><b className={`bar-${b.tone}`} style={{ width: `${(b.count / total) * 100}%` }} /></i>
                      <em>{b.count}</em>
                    </div>
                  );
                })}
              </div>
              {data.unscored > 0 && <p className="field-hint" style={{ marginTop: 12 }}>{data.unscored} candidature(s) sans score.</p>}
            </section>

            <section className="card report-card">
              <h3>Suivi des candidatures</h3>
              <div className="funnel">
                {Object.entries(CANDIDATURE_STATUS).map(([key, v]) => (
                  <div key={key} className="funnel-line">
                    <span className="funnel-dot" style={{ background: STATUS_COLORS[key] }} />
                    <span>{v.recruiter}</span>
                    <strong>{data.statuses[key] || 0}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="card report-card report-wide">
              <h3>Offres les plus suivies</h3>
              <div className="top-jobs">
                {data.topJobs.map((job) => (
                  <Link key={job.id} to={`/job/${job.id}/candidatures`} className="top-job">
                    <span className="top-job-title">{job.title} <JobStateBadge status={job.status} /></span>
                    <span className="top-job-count">{job.count} candidature{job.count > 1 ? 's' : ''}</span>
                    <ScorePill score={job.avgScore} />
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </>
      )}
    </Layout>
  );
}
