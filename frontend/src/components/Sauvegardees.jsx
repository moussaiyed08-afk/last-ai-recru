import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFetch, useSavedJobs } from '../hooks';
import JobCard from './JobCard';
import Layout from './Layout';
import { CardsSkeleton, EmptyState, ErrorState, PageHeader } from './ui';

export default function Sauvegardees() {
  const { data, loading, error, reload } = useFetch('/api/jobs');
  const saved = useSavedJobs();
  const jobs = useMemo(() => (data || []).filter((j) => saved.isSaved(j.id)), [data, saved]);

  return (
    <Layout activeKey="saved">
      <PageHeader title="Offres sauvegardées" subtitle="Retrouvez ici les offres que vous avez mises de côté." />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <CardsSkeleton count={3} />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title="Aucune offre sauvegardée"
          text="Utilisez le marque-page d'une offre pour la retrouver ici. Les offres clôturées disparaissent automatiquement."
          action={<Link to="/" className="btn btn-primary">Parcourir les offres</Link>}
        />
      ) : (
        <div className="jobs-grid">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} saved onToggleSave={saved.toggle} />
          ))}
        </div>
      )}
    </Layout>
  );
}
