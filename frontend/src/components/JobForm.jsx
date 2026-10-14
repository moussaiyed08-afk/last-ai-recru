import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { JOB_MODES, JOB_TYPES } from '../utils';
import { Spinner } from './ui';

function validate(values) {
  const errors = {};
  if (values.title.trim().length < 3) errors.title = 'Le titre doit contenir au moins 3 caractères';
  if (!values.company.trim()) errors.company = "Indiquez le nom de l'entreprise";
  if (values.description.trim().length < 20) errors.description = 'Décrivez le poste en au moins 20 caractères';
  return errors;
}

// Formulaire partagé par "Nouvelle offre" et "Modifier l'offre"
export default function JobForm({ initial, mode, submitting, serverErrors = {}, onSubmit }) {
  const { user } = useAuth();
  const [values, setValues] = useState({
    title: initial?.title ?? '',
    company: initial?.company ?? user?.entreprise ?? '',
    location: initial?.location ?? '',
    type: initial?.type ?? 'CDI',
    contract: initial?.contract ?? 'Temps plein',
    description: initial?.description ?? '',
  });
  const [errors, setErrors] = useState({});

  const set = (field) => (e) => setValues({ ...values, [field]: e.target.value });
  const fieldError = (name) => errors[name] || serverErrors[name];

  // intent : "live" (publier), "draft" (brouillon) ou "save" (enregistrer sans changer le statut)
  const submit = (intent) => (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    onSubmit(values, intent);
  };

  const isDraft = initial?.status === 'draft';

  return (
    <form className="card job-form" onSubmit={submit(mode === 'create' ? 'live' : 'save')} noValidate>
      <div className={`field${fieldError('title') ? ' field-invalid' : ''}`}>
        <label htmlFor="title">Intitulé du poste</label>
        <input id="title" value={values.title} onChange={set('title')} placeholder="Ex. Développeur React confirmé" maxLength={120} />
        {fieldError('title') && <span className="field-error">{fieldError('title')}</span>}
      </div>

      <div className="form-grid">
        <div className={`field${fieldError('company') ? ' field-invalid' : ''}`}>
          <label htmlFor="company">Entreprise</label>
          <input id="company" value={values.company} onChange={set('company')} maxLength={120} />
          {fieldError('company') && <span className="field-error">{fieldError('company')}</span>}
        </div>
        <div className="field">
          <label htmlFor="location">Lieu</label>
          <input id="location" value={values.location} onChange={set('location')} placeholder="Ex. Tunis" maxLength={120} />
        </div>
        <div className="field">
          <label htmlFor="type">Type de contrat</label>
          <select id="type" value={values.type} onChange={set('type')}>
            {JOB_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="contract">Organisation du travail</label>
          <select id="contract" value={values.contract} onChange={set('contract')}>
            {JOB_MODES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className={`field${fieldError('description') ? ' field-invalid' : ''}`}>
        <label htmlFor="description">Description du poste</label>
        <textarea
          id="description"
          value={values.description}
          onChange={set('description')}
          placeholder="Missions, compétences recherchées, avantages…"
          maxLength={10000}
        />
        <div className="field-foot">
          {fieldError('description') ? <span className="field-error">{fieldError('description')}</span> : <span className="field-hint">Plus l'offre est précise, plus le score de correspondance est pertinent.</span>}
          <span className="field-hint">{values.description.length} caractères</span>
        </div>
      </div>

      <div className="form-actions">
        <Link to="/" className="btn btn-ghost">Annuler</Link>
        <span className="spacer" />
        {(mode === 'create' || isDraft) && (
          <button type="button" className="btn btn-secondary" disabled={submitting} onClick={submit(mode === 'create' ? 'draft' : 'save')}>
            Enregistrer en brouillon
          </button>
        )}
        {mode === 'create' && (
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting && <Spinner />} Publier l'offre
          </button>
        )}
        {mode === 'edit' && isDraft && (
          <button type="button" className="btn btn-primary" disabled={submitting} onClick={submit('live')}>
            {submitting && <Spinner />} Publier l'offre
          </button>
        )}
        {mode === 'edit' && !isDraft && (
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting && <Spinner />} Enregistrer les modifications
          </button>
        )}
      </div>
    </form>
  );
}
