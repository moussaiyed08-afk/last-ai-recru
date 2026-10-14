import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import { useFetch } from '../hooks';
import { useToast } from '../toast';
import Icon from './Icons';
import JobForm from './JobForm';
import Layout from './Layout';
import { ErrorState, JobStateBadge, PageHeader } from './ui';

export default function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: job, loading, error, reload } = useFetch(`/api/jobs/${id}`);
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  const handleSubmit = async (values, intent) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      const body = intent === 'live' ? { ...values, status: 'live' } : values;
      await api(`/api/jobs/${id}`, { method: 'PUT', body });
      toast(intent === 'live' ? 'Offre publiée' : 'Modifications enregistrées');
      navigate('/');
    } catch (err) {
      setServerErrors(err.fields || {});
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout activeKey="jobs">
      <Link to="/" className="back-link"><Icon name="arrowLeft" size={16} /> Mes offres</Link>
      <PageHeader
        title="Modifier l'offre"
        subtitle={job ? job.title : undefined}
        action={job && <JobStateBadge status={job.status} />}
      />
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading ? (
        <div className="card job-form skeleton" style={{ minHeight: 420 }} />
      ) : (
        <JobForm mode="edit" initial={job} submitting={submitting} serverErrors={serverErrors} onSubmit={handleSubmit} />
      )}
    </Layout>
  );
}
