import { useState } from 'react';
import { api } from './api';
import { useAuth } from './auth';
import Icon from './components/Icons';
import { Spinner } from './components/ui';
import './styles/Login.css';

const EMPTY = { nom: '', prenom: '', email: '', password: '', role: 'CANDIDAT', entreprise: '', enChomage: false };

const MATCH_ROWS = [
  { label: 'Compétences techniques', value: 94 },
  { label: 'Expérience', value: 88 },
  { label: 'Langues', value: 100 },
];

// Panneau de gauche : montre ce que fait la plateforme (un CV comparé à une offre)
function MatchPreview() {
  const size = 92;
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <div className="match-preview" aria-hidden="true">
      <div className="preview-job">
        <span className="preview-mark">T</span>
        <div>
          <strong>Développeur Full-Stack</strong>
          <small>TechCorp Tunisia, Tunis</small>
        </div>
        <span className="preview-tag">CDI</span>
      </div>

      <div className="preview-score">
        <div className="preview-ring">
          <svg width={size} height={size} viewBox="0 0 92 92">
            <circle cx="46" cy="46" r={r} fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="8" />
            <circle
              cx="46" cy="46" r={r} fill="none" stroke="#5fd9a0" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={c * 0.08} transform="rotate(-90 46 46)"
              style={{ '--ring-from': c }}
            />
          </svg>
          <span><b>92</b>%</span>
        </div>
        <div className="preview-rows">
          <p>Correspondance avec votre CV</p>
          {MATCH_ROWS.map((row) => (
            <div key={row.label} className="preview-row">
              <span>{row.label}</span>
              <i><b style={{ width: `${row.value}%` }} /></i>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const { login } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const switchMode = (register) => {
    setIsRegister(register);
    setError('');
    setNotice('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');

    try {
      if (isRegister) {
        await api('/api/auth/register', { method: 'POST', body: formData });
        setIsRegister(false);
        setFormData({ ...EMPTY, email: formData.email });
        setNotice('Compte créé. Connectez-vous avec votre mot de passe.');
      } else {
        const data = await api('/api/auth/login', {
          method: 'POST',
          body: { email: formData.email, password: formData.password },
        });
        login(data.user, data.token);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-illustration">
        <div className="auth-brand">
          <span className="auth-brand-icon"><Icon name="check" size={16} strokeWidth={2.2} /></span>
          JobBoard
        </div>

        <div className="auth-copy">
          <h1>Le bon profil, repéré en quelques secondes.</h1>
          <p>Chaque CV est comparé à l'offre pour faire ressortir les meilleurs candidats.</p>
        </div>

        <MatchPreview />
      </aside>

      <main className="auth-panel">
        <form onSubmit={handleSubmit} className="auth-form" noValidate={false}>
          <div className="auth-heading">
            <h2>{isRegister ? 'Créer un compte' : 'Bon retour'}</h2>
            <p>{isRegister ? 'Quelques informations suffisent pour commencer.' : 'Connectez-vous pour accéder à votre espace.'}</p>
          </div>

          {notice && <p className="auth-alert auth-alert-ok" role="status">{notice}</p>}
          {error && <p className="auth-alert auth-alert-error" role="alert">{error}</p>}

          {isRegister && (
            <div className="segmented" role="radiogroup" aria-label="Type de compte">
              {[
                ['CANDIDAT', 'Je cherche un emploi'],
                ['RECRUTEUR', 'Je recrute'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={formData.role === value}
                  className={formData.role === value ? 'segmented-active' : ''}
                  onClick={() => setFormData({ ...formData, role: value })}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {isRegister && (
            <div className="field-row">
              <div className="field">
                <label htmlFor="prenom">Prénom</label>
                <input id="prenom" value={formData.prenom} onChange={set('prenom')} autoComplete="given-name" required />
              </div>
              <div className="field">
                <label htmlFor="nom">Nom</label>
                <input id="nom" value={formData.nom} onChange={set('nom')} autoComplete="family-name" required />
              </div>
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Adresse email</label>
            <input id="email" type="email" value={formData.email} onChange={set('email')} autoComplete="email" placeholder="vous@exemple.com" required />
          </div>

          <div className="field">
            <label htmlFor="password">Mot de passe</label>
            <div className="password-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={set('password')}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                minLength={isRegister ? 6 : undefined}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>
            {isRegister && <span className="field-hint">6 caractères minimum.</span>}
          </div>

          {isRegister && formData.role === 'RECRUTEUR' && (
            <div className="field">
              <label htmlFor="entreprise">Entreprise</label>
              <input id="entreprise" value={formData.entreprise} onChange={set('entreprise')} autoComplete="organization" required />
            </div>
          )}

          {isRegister && formData.role === 'CANDIDAT' && (
            <label className="check-line">
              <input
                type="checkbox"
                checked={formData.enChomage}
                onChange={(e) => setFormData({ ...formData, enChomage: e.target.checked })}
              />
              Je suis actuellement en recherche d'emploi
            </label>
          )}

          <button type="submit" className="btn btn-primary btn-block auth-submit" disabled={loading}>
            {loading ? <Spinner /> : null}
            {isRegister ? 'Créer mon compte' : 'Se connecter'}
          </button>

          <p className="switch-mode">
            {isRegister ? 'Vous avez déjà un compte ?' : "Vous n'avez pas encore de compte ?"}{' '}
            <button type="button" className="link-strong" onClick={() => switchMode(!isRegister)}>
              {isRegister ? 'Se connecter' : "S'inscrire gratuitement"}
            </button>
          </p>
        </form>
      </main>
    </div>
  );
}
