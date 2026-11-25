import React, { useState, useEffect } from 'react';
import { X } from './Icons';
import {
  supabaseSignIn,
  supabaseSignUp,
  isSupabaseConfigured
} from '../supabase';

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  initialRole = 'citizen',
  currentUser = null
}) {
  const [tab, setTab] = useState('login'); // 'login' | 'signup'
  const [role, setRole] = useState(initialRole); // 'citizen' | 'admin'
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (initialRole) setRole(initialRole);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  // 1-Click Quick Sandbox Login
  const handleQuickDemo = async (demoRole) => {
    const demoUser = {
      name: demoRole === 'admin' ? 'Officer Sharma (Municipal GIS)' : 'Ananya Sen (Citizen Reporter)',
      email: demoRole === 'admin' ? 'sharma.gis@civisense.gov' : 'ananya.citizen@civisense.net',
      role: demoRole
    };
    onLoginSuccess(demoUser);
    onClose();
  };

  // Handle Form Submission (Login / Register via Supabase)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    const configured = isSupabaseConfigured();

    if (configured) {
      try {
        if (tab === 'signup') {
          const res = await supabaseSignUp({
            email,
            password,
            fullName,
            role
          });
          setSuccessMsg('Account created successfully!');
          setTimeout(() => {
            onLoginSuccess(res.user);
            onClose();
          }, 600);
        } else {
          const res = await supabaseSignIn({
            email,
            password
          });
          onLoginSuccess(res.user);
          onClose();
        }
      } catch (err) {
        console.error('Supabase Auth error:', err);
        setErrorMsg(err.message || 'Authentication error with Supabase.');
      } finally {
        setLoading(false);
      }
    } else {
      // Local mode fallback if Supabase credentials are not yet added to .env
      setTimeout(() => {
        const newUser = {
          name: fullName || email.split('@')[0] || 'CiviSense User',
          email: email || 'user@civisense.org',
          role
        };
        onLoginSuccess(newUser);
        onClose();
        setLoading(false);
      }, 300);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="modal-header">
          <h3 className="modal-title">
            {tab === 'login' ? 'Access CiviSense Platform' : 'Create Civic Account'}
          </h3>
          <p className="modal-subtitle">
            {tab === 'login'
              ? 'Sign in to access GIS Radar, live incident tracking, and dispatch.'
              : 'Register as a Citizen Reporter or Municipal GIS Admin.'}
          </p>
        </div>

        {/* Existing Signed In Session Quick Resume */}
        {currentUser && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            border: '1px solid rgba(14, 165, 233, 0.25)',
            marginBottom: '16px',
            fontSize: '12px'
          }}>
            <div>
              <span>Active session: <strong>{currentUser.name}</strong> ({currentUser.role === 'admin' ? 'GIS Admin' : 'Citizen'})</span>
            </div>
            <button
              type="button"
              className="btn-pill-primary"
              style={{ padding: '4px 12px', fontSize: '11.5px' }}
              onClick={() => {
                onLoginSuccess(currentUser);
                onClose();
              }}
            >
              Continue to App →
            </button>
          </div>
        )}

        {/* Tab Switcher: Sign In vs Register */}
        <div className="auth-tabs">
          <button
            className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
            onClick={() => { setTab('login'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Sign In
          </button>
          <button
            className={`auth-tab-btn ${tab === 'signup' ? 'active' : ''}`}
            onClick={() => { setTab('signup'); setErrorMsg(''); setSuccessMsg(''); }}
          >
            Sign Up
          </button>
        </div>

        {/* Quick Sandbox 1-Click Login */}
        <div className="demo-login-box">
          <div className="demo-login-title">Quick 1-Click Sandbox Login</div>
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

        {errorMsg && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: '#EF4444',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '12px',
            marginBottom: '14px',
            fontWeight: 600
          }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            color: '#10B981',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            fontSize: '12px',
            marginBottom: '14px',
            fontWeight: 600
          }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Full Name field on Signup */}
          {tab === 'signup' && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Officer Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          {/* Role selector (Admin vs Citizen) */}
          <div className="form-group">
            <label className="form-label">Role ({tab === 'signup' ? 'Select registration tier' : 'Target view'})</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`btn-demo-role ${role === 'citizen' ? 'active' : ''}`}
                style={
                  role === 'citizen'
                    ? { backgroundColor: 'var(--accent-cyan)', color: 'white', borderColor: 'var(--accent-cyan)' }
                    : {}
                }
                onClick={() => setRole('citizen')}
              >
                👤 Citizen Reporter
              </button>
              <button
                type="button"
                className={`btn-demo-role ${role === 'admin' ? 'active' : ''}`}
                style={
                  role === 'admin'
                    ? { backgroundColor: 'var(--accent-cyan)', color: 'white', borderColor: 'var(--accent-cyan)' }
                    : {}
                }
                onClick={() => setRole('admin')}
              >
                🏛️ Municipal Admin (GIS)
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              className="form-input"
              placeholder={role === 'admin' ? 'officer.gis@civisense.gov' : 'citizen@civisense.net'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="form-input"
              placeholder="•••••••••••• (min 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn-auth-submit" disabled={loading}>
            {loading
              ? 'Verifying...'
              : (tab === 'login' ? 'Sign In to Console' : 'Complete Registration')}
          </button>
        </form>
      </div>
    </div>
  );
}
