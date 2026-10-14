import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useFetch } from '../hooks';
import { useToast } from '../toast';
import { CANDIDATURE_STATUS, formatDate } from '../utils';
import Icon from './Icons';
import Layout from './Layout';
import { Avatar, EmptyState, ErrorState, PageHeader, ScorePill } from './ui';

export default function Candidats() {
  const { id: jobParam } = useParams();
  const toast = useToast();
  const { data, loading, error, reload, setData } = useFetch('/api/recruteur/candidatures');
  const list = useMemo(() => data || [], [data]);

  const [jobFilter, setJobFilter] = useState(jobParam || 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('score');
  const [search, setSearch] = useState('');

  // Offres présentes dans les candidatures (pour le filtre)
  const jobs = useMemo(() => {
    const map = new Map();
    list.forEach((c) => map.set(String(c.job.id), c.job.title));
    return [...map.entries()];
  }, [list]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list
      .filter((c) => jobFilter === 'all' || String(c.job.id) === String(jobFilter))
      .filter((c) => statusFilter === 'all' || c.status === statusFilter)
      .filter((c) => {
        if (!q) return true;
        const name = `${c.candidat?.prenom || ''} ${c.candidat?.nom || ''} ${c.candidat?.email || ''} ${c.job.title}`.toLowerCase();
        return name.includes(q);
      })
      .sort((a, b) =>
        sort === 'score'
          ? (b.score ?? -1) - (a.score ?? -1)
          : new Date(b.createdAt) - new Date(a.createdAt)
      );
  }, [list, jobFilter, statusFilter, sort, search]);

  const changeStatus = async (candidature, status) => {
    const previous = candidature.status;
    setData((items) => items.map((c) => (c.id === candidature.id ? { ...c, status } : c)));
    try {
      await api(`/api/recruteur/candidatures/${candidature.id}`, { method: 'PATCH', body: { status } });
    } catch (err) {
      setData((items) => items.map((c) => (c.id === candidature.id ? { ...c, status: previous } : c)));
      toast(err.message, 'error');
    }
  };

  // Le CV est protégé par le token : on le télécharge puis on l'ouvre dans un nouvel onglet
  const openCv = async (candidature) => {
    const tab = window.open('', '_blank');
    try {
      const res = await api(`/api/recruteur/candidatures/${candidature.id}/cv`, { raw: true });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (tab) tab.location.href = url;
      else window.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      if (candidature.status === 'nouveau') {
        setData((items) => items.map((c) => (c.id === candidature.id ? { ...c, status: 'vu' } : c)));
      }
    } catch (err) {
      if (tab) tab.close();
      toast(err.message, 'error');
    }
  };

  return (
    <Layout activeKey="candidats" searchValue={search} onSearchChange={setSearch} searchPlaceholder="Rechercher un candidat…">
      <PageHeader title="Candidats" subtitle="Les candidatures reçues, classées par score de correspondance." />

      <div className="filters-row">
        <select className="select-sm" value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} aria-label="Filtrer par offre">
          <option value="all">Toutes les offres</option>
          {jobs.map(([jobId, title]) => <option key={jobId} value={jobId}>{title}</option>)}
        </select>
        <select className="select-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filtrer par statut">
          <option value="all">Tous les statuts</option>
          {Object.entries(CANDIDATURE_STATUS).map(([key, v]) => <option key={key} value={key}>{v.recruiter}</option>)}
        </select>
        <select className="select-sm" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Trier">
          <option value="score">Meilleur score d'abord</option>
          <option value="date">Plus récentes d'abord</option>
        </select>
        <span className="list-meta" style={{ margin: '0 0 0 auto' }}>
          {visible.length} candidature{visible.length > 1 ? 's' : ''}
        </span>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="card table-skeleton skeleton" />
      ) : list.length === 0 ? (
        <EmptyState
          icon="people"
          title="Aucune candidature pour le moment"
          text="Dès qu'un candidat postule à l'une de vos offres, il apparaît ici avec son score."
          action={<Link to="/" className="btn btn-primary">Voir mes offres</Link>}
        />
      ) : visible.length === 0 ? (
        <EmptyState icon="search" title="Aucun résultat" text="Modifiez les filtres ou la recherche." />
      ) : (
        <div className="card table-card">
          <div className="cand-row cand-head" role="row">
            <span>Candidat</span><span>Offre</span><span>Score</span><span>Reçue le</span><span>Statut</span><span />
          </div>
          {visible.map((c) => (
            <div key={c.id} className="cand-row" role="row">
              <div className="cand-person">
                <Avatar first={c.candidat?.prenom} last={c.candidat?.nom} />
                <div>
                  <strong>{c.candidat ? `${c.candidat.prenom} ${c.candidat.nom}` : 'Candidat inconnu'}</strong>
                  <small>{c.candidat?.email || c.fileName}</small>
                </div>
              </div>
              <span className="cand-job" data-label="Offre" title={c.job.title}>{c.job.title}</span>
              <span data-label="Score"><ScorePill score={c.score} /></span>
              <span className="cand-date" data-label="Reçue le">{formatDate(c.createdAt)}</span>
              <span data-label="Statut">
                <select
                  className={`status-select badge-tone-${CANDIDATURE_STATUS[c.status]?.tone || 'brand'}`}
                  value={c.status}
                  onChange={(e) => changeStatus(c, e.target.value)}
                  aria-label="Statut de la candidature"
                >
                  {Object.entries(CANDIDATURE_STATUS).map(([key, v]) => <option key={key} value={key}>{v.recruiter}</option>)}
                </select>
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => openCv(c)}>
                <Icon name="file" size={15} /> Voir le CV
              </button>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
