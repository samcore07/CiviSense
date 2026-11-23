import React, { useState } from 'react';
import { X } from './Icons';

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  const [role, setRole] = useState('citizen'); // 'citizen' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleQuickDemo = (demoRole) => {
    const demoUser = {
      name: demoRole === 'admin' ? 'Officer Sharma (Municipal GIS)' : 'Ananya Sen (Citizen Reporter)',
      email: demoRole === 'admin' ? 'sharma.gis@civisense.gov' : 'ananya.citizen@civisense.net',
      role: demoRole
    };
    onLoginSuccess(demoUser);
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newUser = {
      name: email.split('@')[0] || 'CiviSense User',
      email: email || 'user@civisense.org',
      role
    };
    onLoginSuccess(newUser);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="modal-header">
          <h3 className="modal-title">
            {tab === 'login' ? 'Access CiviSense Platform' : 'Register Civic Account'}
          </h3>
          <p className="modal-subtitle">
            {tab === 'login'
              ? 'Computer Vision + AI + GIS for Smarter Civic Governance.'
              : 'Join citizens and municipal engineers in reporting and tracking civic issues.'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => setTab('login')}
          >
            Sign In
          </button>
          <button
            className={`auth-tab-btn ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => setTab('signup')}
          >
            Register
          </button>
        </div>

        {/* Quick Sandbox Login */}
        <div className="demo-login-box">
          <div className="demo-login-title">Instant 1-Click Sandbox Login</div>
          <div className="demo-buttons-row">
            <button
              className="btn-demo-role"
              onClick={() => handleQuickDemo('citizen')}
              type="button"
            >
              👤 Citizen Demo
            </button>
            <button
              className="btn-demo-role"
              onClick={() => handleQuickDemo('admin')}
              type="button"
            >
              🏛️ GIS Admin Officer
            </button>
          </div>
        </div>

        <div className="divider-text">Or enter credentials</div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Role</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`btn-demo-role ${role === 'citizen' ? 'active' : ''}`}
                style={role === 'citizen' ? { backgroundColor: 'var(--accent-cyan)', color: 'white', borderColor: 'var(--accent-cyan)' } : {}}
                onClick={() => setRole('citizen')}
              >
                Citizen Reporter
              </button>
              <button
                type="button"
                className={`btn-demo-role ${role === 'admin' ? 'active' : ''}`}
                style={role === 'admin' ? { backgroundColor: 'var(--accent-cyan)', color: 'white', borderColor: 'var(--accent-cyan)' } : {}}
                onClick={() => setRole('admin')}
              >
                Municipal Admin (GIS)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="officer@municipality.gov"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              className="form-input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-auth-submit">
            {tab === 'login' ? 'Sign In to Console' : 'Complete Registration'}
          </button>
        </form>
      </div>
    </div>
  );
}
