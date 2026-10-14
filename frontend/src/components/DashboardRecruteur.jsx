import { useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { useFetch } from '../hooks';
import { useToast } from '../toast';
import { isNewJob, timeAgo } from '../utils';
import Icon from './Icons';
import Layout, { StatCard } from './Layout';
import { CardsSkeleton, ConfirmModal, EmptyState, ErrorState, JobStateBadge, NewBadge, PageHeader } from './ui';

const TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'live', label: 'En ligne' },
  { key: 'draft', label: 'Brouillons' },
  { key: 'closed', label: 'Clôturées' },
];

// Action de statut proposée selon l'état de l'offre
const STATUS_ACTION = {
  live: { label: 'Clôturer', next: 'closed', done: 'Offre clôturée' },
  draft: { label: 'Publier', next: 'live', done: 'Offre publiée' },
  closed: { label: 'Rouvrir', next: 'live', done: 'Offre rouverte' },
};

export default function DashboardRecruteur() {
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const { data, loading, error, reload, setData } = useFetch('/api/recruteur/jobs');
  const jobs = useMemo(() => data || [], [data]);

  const [activeTab, setActiveTab] = useState(location.state?.tab || 'all');
  const [search, setSearch] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  const counts = useMemo(
    () => ({
      all: jobs.length,
      live: jobs.filter((j) => j.status === 'live').length,
      draft: jobs.filter((j) => j.status === 'draft').length,
      closed: jobs.filter((j) => j.status === 'closed').length,
    }),
    [jobs]
  );
  const applicants = useMemo(() => jobs.reduce((sum, j) => sum + (j.applicantsCount || 0), 0), [jobs]);

  const visibleJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter(
      (j) =>
        (activeTab === 'all' || j.status === activeTab) &&
        (!q || j.title.toLowerCase().includes(q) || (j.location || '').toLowerCase().includes(q))
    );
  }, [jobs, activeTab, search]);

  const changeStatus = async (job) => {
    const action = STATUS_ACTION[job.status];
    try {
      const res = await api(`/api/jobs/${job.id}`, { method: 'PUT', body: { status: action.next } });
      setData((list) => list.map((j) => (j.id === job.id ? { ...j, ...res.updatedJob } : j)));
      toast(action.done);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await api(`/api/jobs/${toDelete.id}`, { method: 'DELETE' });
      setData((list) => list.filter((j) => j.id !== toDelete.id));
      toast('Offre supprimée');
      setToDelete(null);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Layout activeKey="jobs" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Rechercher une offre ou un lieu…">
      <PageHeader
        title={`Bonjour ${user.prenom || ''}`.trim()}
        subtitle="Publiez vos offres et suivez les candidatures reçues."
        action={
          <Link to="/create-job" className="btn btn-primary">
            <Icon name="plus" size={16} strokeWidth={2} /> Nouvelle offre
          </Link>
        }
      />

      <div className="stats-row">
        <StatCard value={counts.all} label="Offres créées" accent="var(--brand)" />
        <StatCard value={counts.live} label="Offres en ligne" accent="var(--new)" />
        <StatCard value={counts.draft} label="Brouillons" accent="#e0a13a" />
        <StatCard value={applicants} label="Candidatures reçues" accent="var(--ok)" />
      </div>

      <div className="tabs-row" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`tab-btn${activeTab === tab.key ? ' tab-btn-active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label} <span className="tab-count">{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <CardsSkeleton />
      ) : jobs.length === 0 ? (
        <EmptyState
          icon="jobs"
          title="Aucune offre pour le moment"
          text="Publiez votre première offre pour commencer à recevoir des candidatures."
          action={<Link to="/create-job" className="btn btn-primary">Nouvelle offre</Link>}
        />
      ) : visibleJobs.length === 0 ? (
        <EmptyState icon="search" title="Aucune offre ne correspond" text="Essayez un autre onglet ou une autre recherche." />
      ) : (
        <div className="jobs-grid">
          {visibleJobs.map((job) => {
            const action = STATUS_ACTION[job.status];
            const count = job.applicantsCount || 0;
            return (
              <article key={job.id} className="job-card">
                <div className="job-card-top">
                  <span className="job-card-icon"><Icon name="jobs" size={18} /></span>
                  {isNewJob(job) ? <NewBadge /> : <JobStateBadge status={job.status} />}
                </div>

                <div>
                  <h3 className="job-card-title">{job.title}</h3>
                  <div className="job-card-meta" style={{ marginTop: 6 }}>
                    {job.location && <span><Icon name="pin" size={14} />{job.location}</span>}
                    <span><Icon name="clock" size={14} />{timeAgo(job.publishedAt || job.createdAt)}</span>
                  </div>
                </div>

                <p className="job-card-desc">{job.description}</p>

                <div className="job-card-tags">
                  {job.type && <span className="tag">{job.type}</span>}
                  {job.contract && <span className="tag">{job.contract}</span>}
                </div>

                <div className="job-card-actions">
                  <Link to={`/job/${job.id}/candidatures`} className="btn btn-ghost btn-sm">
                    {count} candidature{count > 1 ? 's' : ''}
                  </Link>
                  <span className="spacer" />
                  <Link to={`/edit-job/${job.id}`} className="btn-icon" title="Modifier" aria-label={`Modifier ${job.title}`}>
                    <Icon name="edit" size={17} />
                  </Link>
                  <button className="btn btn-secondary btn-sm" onClick={() => changeStatus(job)}>{action.label}</button>
                  <button className="btn-icon btn-icon-danger" title="Supprimer" aria-label={`Supprimer ${job.title}`} onClick={() => setToDelete(job)}>
                    <Icon name="trash" size={17} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {toDelete && (
        <ConfirmModal
          title="Supprimer cette offre ?"
          text={`« ${toDelete.title} » et ses ${toDelete.applicantsCount || 0} candidature(s) seront définitivement supprimées.`}
          confirmLabel="Supprimer"
          busy={busy}
          onConfirm={confirmDelete}
          onCancel={() => !busy && setToDelete(null)}
        />
      )}
    </Layout>
  );
}
