import { useMemo, useState } from 'react';
import { useAuth } from '../auth';
import { useFetch, useSavedJobs } from '../hooks';
import { isNewJob } from '../utils';
import JobCard from './JobCard';
import Layout, { StatCard } from './Layout';
import { CardsSkeleton, EmptyState, ErrorState, PageHeader } from './ui';

export default function DashboardCandidat() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/api/jobs');
  const jobs = useMemo(() => data || [], [data]);
  const saved = useSavedJobs();

  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [type, setType] = useState('all');

  const stats = useMemo(
    () => ({
      total: jobs.length,
      fresh: jobs.filter(isNewJob).length,
      saved: jobs.filter((j) => saved.isSaved(j.id)).length,
      applied: jobs.filter((j) => j.applied).length,
    }),
    [jobs, saved]
  );

  const types = useMemo(() => [...new Set(jobs.map((j) => j.type).filter(Boolean))], [jobs]);

  const visibleJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter(
      (j) =>
        (activeTab === 'all' || isNewJob(j)) &&
        (type === 'all' || j.type === type) &&
        (!q ||
          j.title.toLowerCase().includes(q) ||
          (j.company || '').toLowerCase().includes(q) ||
          (j.location || '').toLowerCase().includes(q))
    );
  }, [jobs, activeTab, type, search]);

  return (
    <Layout activeKey="jobs" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Poste, entreprise ou ville…">
      <PageHeader title={`Bonjour ${user.prenom || ''}`.trim()} subtitle="Voici les offres ouvertes en ce moment." />

      <div className="stats-row">
        <StatCard value={stats.total} label="Offres disponibles" accent="var(--brand)" />
        <StatCard value={stats.fresh} label="Nouvelles (24 h)" accent="var(--new)" />
        <StatCard value={stats.saved} label="Sauvegardées" accent="#8e6bb0" />
        <StatCard value={stats.applied} label="Candidatures envoyées" accent="var(--ok)" />
      </div>

      <div className="tabs-row" role="tablist">
        {[
          ['all', 'Toutes les offres', stats.total],
          ['new', 'Nouvelles', stats.fresh],
        ].map(([key, label, count]) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeTab === key}
            className={`tab-btn${activeTab === key ? ' tab-btn-active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {label} <span className="tab-count">{count}</span>
          </button>
        ))}
      </div>

      {types.length > 1 && (
        <div className="chips" role="group" aria-label="Type de contrat">
          {['all', ...types].map((t) => (
            <button key={t} className={`chip${type === t ? ' chip-active' : ''}`} onClick={() => setType(t)} aria-pressed={type === t}>
              {t === 'all' ? 'Tous les contrats' : t}
            </button>
          ))}
        </div>
      )}

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <CardsSkeleton />
      ) : visibleJobs.length === 0 ? (
        <EmptyState
          icon="search"
          title={jobs.length === 0 ? "Aucune offre ouverte pour l'instant" : 'Aucune offre ne correspond'}
          text={jobs.length === 0 ? 'Revenez bientôt : de nouvelles offres sont publiées régulièrement.' : 'Essayez un autre mot-clé ou un autre type de contrat.'}
        />
      ) : (
        <div className="jobs-grid">
          {visibleJobs.map((job) => (
            <JobCard key={job.id} job={job} saved={saved.isSaved(job.id)} onToggleSave={saved.toggle} />
          ))}
        </div>
      )}
    </Layout>
  );
}
