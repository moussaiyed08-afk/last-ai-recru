import { Link } from 'react-router-dom';
import { useFetch } from '../hooks';
import { formatDate } from '../utils';
import Layout from './Layout';
import { CandidatureBadge, CompanyMark, EmptyState, ErrorState, PageHeader, ScorePill } from './ui';

export default function MesCandidatures() {
  const { data, loading, error, reload } = useFetch('/api/candidat/candidatures');

  return (
    <Layout activeKey="applications">
      <PageHeader title="Mes candidatures" subtitle="Suivez l'état de chacune de vos candidatures." />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="card table-skeleton skeleton" />
      ) : data.length === 0 ? (
        <EmptyState
          icon="send"
          title="Vous n'avez pas encore postulé"
          text="Choisissez une offre, envoyez votre CV et suivez la réponse du recruteur ici."
          action={<Link to="/" className="btn btn-primary">Parcourir les offres</Link>}
        />
      ) : (
        <div className="card app-list">
          {data.map((c) => (
            <Link key={c.id} to={`/job/${c.job.id}`} className="app-item">
              <CompanyMark name={c.job.company} size={42} />
              <div className="app-item-main">
                <strong>{c.job.title}</strong>
                <small>{c.job.company}, envoyée le {formatDate(c.createdAt)}</small>
              </div>
              <ScorePill score={c.score} />
              <CandidatureBadge status={c.status} view="candidate" />
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}
