import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { fullName } from '../utils';
import Icon from './Icons';
import { Avatar } from './ui';
import '../styles/Layout.css';

const NAV_CONFIG = {
  RECRUTEUR: [
    { key: 'jobs', label: 'Mes offres', icon: 'jobs', path: '/' },
    { key: 'candidats', label: 'Candidats', icon: 'people', path: '/candidats' },
    { key: 'rapports', label: 'Rapports', icon: 'chart', path: '/rapports' },
  ],
  CANDIDAT: [
    { key: 'jobs', label: 'Offres', icon: 'jobs', path: '/' },
    { key: 'saved', label: 'Sauvegardées', icon: 'bookmark', path: '/candidat/sauvegardees' },
    { key: 'applications', label: 'Mes candidatures', icon: 'file', path: '/candidat/candidatures' },
  ],
};

export function Sidebar({ role, activeKey, open, onNavigate }) {
  return (
    <aside className={`sidebar${open ? ' sidebar-open' : ''}`}>
      <Link to="/" className="sidebar-brand" onClick={onNavigate}>
        <span className="sidebar-brand-icon">
          <Icon name="check" size={16} strokeWidth={2.2} />
        </span>
        JobBoard
      </Link>
      <nav className="sidebar-nav" aria-label="Navigation principale">
        {NAV_CONFIG[role].map((item) => (
          <Link
            key={item.key}
            to={item.path}
            onClick={onNavigate}
            className={`nav-item${activeKey === item.key ? ' nav-item-active' : ''}`}
            aria-current={activeKey === item.key ? 'page' : undefined}
          >
            <Icon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function TopBar({ searchValue, onSearchChange, searchPlaceholder, onMenu }) {
  const { user, logout } = useAuth();
  return (
    <header className="topbar">
      <button className="topbar-menu" onClick={onMenu} aria-label="Ouvrir le menu">
        <Icon name="menu" size={20} />
      </button>

      {onSearchChange ? (
        <label className="topbar-search">
          <Icon name="search" size={16} />
          <input
            type="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder || 'Rechercher...'}
            aria-label="Rechercher"
          />
        </label>
      ) : (
        <span />
      )}

      <div className="topbar-user">
        <Avatar first={user?.prenom} last={user?.nom} />
        <div className="topbar-user-info">
          <span className="topbar-user-name">{fullName(user)}</span>
          <span className="topbar-user-role">
            {user?.role === 'RECRUTEUR' ? user.entreprise || 'Recruteur' : 'Candidat'}
          </span>
        </div>
        <button className="topbar-logout" onClick={logout} title="Se déconnecter" aria-label="Se déconnecter">
          <Icon name="logout" size={18} />
        </button>
      </div>
    </header>
  );
}

export function StatCard({ value, label, accent = 'var(--brand)', hint }) {
  return (
    <div className="stat-card" style={{ '--accent': accent }}>
      <span className="stat-card-value">{value}</span>
      <span className="stat-card-label">{label}</span>
      {hint && <span className="stat-card-hint">{hint}</span>}
    </div>
  );
}

export default function Layout({ activeKey, searchValue, onSearchChange, searchPlaceholder, children }) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar role={user.role} activeKey={activeKey} open={menuOpen} onNavigate={() => setMenuOpen(false)} />
      {menuOpen && <div className="sidebar-overlay" onClick={() => setMenuOpen(false)} />}
      <div className="app-main">
        <TopBar
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchPlaceholder={searchPlaceholder}
          onMenu={() => setMenuOpen(true)}
        />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
