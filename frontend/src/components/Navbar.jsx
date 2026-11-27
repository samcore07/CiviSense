import React from 'react';
import { Moon, Sun, ArrowRight } from './Icons';

export default function Navbar({
  currentView,
  setCurrentView,
  theme,
  toggleTheme,
  user,
  onOpenAuth,
  onSignOut,
  activeNav,
  setActiveNav,
  onNavClick
}) {
  const navItems = [
    { id: 'preface', label: 'Preface' },
    { id: 'features', label: 'Features' },
    { id: 'workflow', label: 'Workflow' },
    { id: 'tutorial', label: 'Tutorial' }
  ];

  const handleNavClick = (id) => {
    if (id === 'app') {
      setCurrentView('app');
      return;
    }
    if (onNavClick) {
      onNavClick(id);
    } else {
      setActiveNav(id);
      if (currentView !== 'landing') {
        setCurrentView('landing');
      }
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 20);
    }
  };

  return (
    <header className="navbar-wrapper">
      <div className="container">
        <nav className="navbar" aria-label="Main Navigation">
          {/* Brand Logo & Title */}
          <div className="nav-brand" onClick={() => setCurrentView('landing')}>
            <div className="brand-badge" title="CiviSense CV·AI·GIS">
              CS
            </div>
            <div className="brand-info">
              <span className="brand-title">CIVI<span>SENSE</span></span>
              <span className="brand-subtitle">Mapping the Future of Cities</span>
            </div>
          </div>

          {/* Navigation Pill Items */}
          {currentView === 'landing' && (
            <div className="nav-pills">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  className={`nav-pill-btn ${activeNav === item.id ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* Right Action Controls */}
          <div className="nav-actions">
            {/* Dark / Light Mode Switch */}
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label="Toggle visual theme"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  className="btn-pill-primary"
                  onClick={() => setCurrentView('app')}
                >
                  Open App <ArrowRight size={14} />
                </button>
                <button
                  className="btn-text"
                  onClick={onSignOut}
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                className="btn-pill-primary"
                onClick={onOpenAuth}
              >
                Login
              </button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
