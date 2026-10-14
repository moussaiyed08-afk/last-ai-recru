import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useToast } from '../toast';
import Icon from './Icons';
import JobForm from './JobForm';
import Layout from './Layout';
import { PageHeader } from './ui';

export default function CreateJob() {
  const navigate = useNavigate();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  const handleSubmit = async (values, intent) => {
    setSubmitting(true);
    setServerErrors({});
    try {
      const status = intent === 'draft' ? 'draft' : 'live';
      const data = await api('/api/jobs', { method: 'POST', body: { ...values, status } });
      toast(status === 'live' ? 'Offre publiée' : 'Brouillon enregistré');
      navigate('/', { state: { tab: status === 'live' ? 'live' : 'draft' } });
      return data;
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
      <PageHeader title="Nouvelle offre" subtitle="Publiez-la tout de suite ou gardez-la en brouillon pour la terminer plus tard." />
      <JobForm mode="create" submitting={submitting} serverErrors={serverErrors} onSubmit={handleSubmit} />
    </Layout>
  );
}
