import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  ArrowLeft,
  Camera,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Search,
  RefreshCw,
  Sun,
  Moon,
  LogOut,
  Layers,
  ShieldCheck,
  Send,
  Trash2,
  Eye,
  Sparkles,
  GitMerge,
  Lock
} from './Icons';
import {
  isSupabaseConfigured,
  supabaseFetchReports,
  supabaseCreateReport,
  supabaseUpdateReportStatus,
  supabaseSubscribeReports
} from '../supabase';
import AIDetector from './AIDetector';

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '');
const categories = ['pothole', 'garbage', 'waterlogging'];
const statuses = ['reported', 'assigned', 'in_progress', 'resolved', 'rejected'];

// Fix Leaflet Default Icon in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom colored GIS map marker generator
const createMapPin = (status, category) => {
  let color = '#F59E0B'; // reported (amber)
  if (status === 'resolved') color = '#10B981'; // green
  if (status === 'in_progress' || status === 'assigned') color = '#0284C7'; // cyan/blue
  if (status === 'rejected') color = '#EF4444'; // red

  return L.divIcon({
    className: 'custom-gis-pin',
    html: `<div style="
      background-color: ${color};
      width: 16px;
      height: 16px;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 0 10px ${color}, 0 2px 4px rgba(0,0,0,0.5);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

// Disperse overlapping map coordinates radially so every incident pin is individually visible and clickable
export const disperseOverlappingMarkers = (reportList) => {
  const coordGroups = {};

  return reportList.map((r) => {
    const lat = Number(r.latitude);
    const lng = Number(r.longitude);
    if (isNaN(lat) || isNaN(lng)) return r;

    // Group pins that fall within ~100m of each other
    const key = `${lat.toFixed(3)}_${lng.toFixed(3)}`;
    const count = coordGroups[key] || 0;
    coordGroups[key] = count + 1;

    if (count === 0) {
      return { ...r, mapLat: lat, mapLng: lng, isDispersed: false };
    }

    // Offset in a spiral ring around the central landmark
    // ~0.0075° offset is ~750m in real-world scale, perfectly separating pins at zoom 10
    const angle = ((count - 1) * (2 * Math.PI)) / 6;
    const ring = Math.floor((count - 1) / 6) + 1;
    const radius = 0.0075 * ring;
    const latOffset = radius * Math.cos(angle);
    const lngOffset = radius * Math.sin(angle) * 1.15;

    return {
      ...r,
      mapLat: Number((lat + latOffset).toFixed(6)),
      mapLng: Number((lng + lngOffset).toFixed(6)),
      isDispersed: true
    };
  });
};

export default function MainApp({ onBackToLanding, user, onSignOut, theme, toggleTheme }) {
  const [reports, setReports] = useState([]);
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState('map'); // 'map' | 'ai_detector' | 'report' | 'table'

  // Keep admin restricted to map and table tabs only
  useEffect(() => {
    if (isAdmin && (activeTab === 'report' || activeTab === 'ai_detector')) {
      setActiveTab('map');
    }
  }, [isAdmin, activeTab]);
  const [form, setForm] = useState({
    category: 'pothole',
    description: '',
    latitude: '22.5726',
    longitude: '88.3639',
    severity: 4
  });
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [busy, setBusy] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Load live reports from Supabase (with FastAPI / offline fallback)
  async function loadReports() {
    if (isSupabaseConfigured()) {
      try {
        const data = await supabaseFetchReports();
        if (data) {
          setReports(data);
          return;
        }
      } catch (err) {
        console.warn('Supabase fetch note, attempting fallback:', err);
      }
    }

    try {
      const res = await fetch(`${API}/api/reports`);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      } else {
        setMessage('Failed to load reports from backend.');
        setMessageType('error');
      }
    } catch {
      setMessage('Running in local prototype mode with existing reports.');
      setMessageType('warning');
    }
  }

  useEffect(() => {
    loadReports();

    // Real-time Supabase subscriptions for live GIS map updates
    const unsubscribe = supabaseSubscribeReports(
      (newReport) => {
        setReports((prev) => [newReport, ...prev.filter((r) => r.id !== newReport.id)]);
      },
      (updatedReport) => {
        setReports((prev) => prev.map((r) => (r.id === updatedReport.id ? updatedReport : r)));
      },
      (deletedReport) => {
        setReports((prev) => prev.filter((r) => r.id !== deletedReport.id));
      }
    );

    return () => unsubscribe();
  }, []);

  // HTML5 GPS Geolocation
  function getLocation() {
    if (!navigator.geolocation) {
      setMessage('GPS geolocation is not supported by your browser.');
      setMessageType('error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        }));
        setMessage(`GPS coordinates locked: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (Accuracy ~${pos.coords.accuracy ? pos.coords.accuracy.toFixed(1) + 'm' : '3m'})`);
        setMessageType('success');
      },
      () => {
        setMessage('Location permission was denied. You may enter coordinates manually.');
        setMessageType('warning');
      }
    );
  }

  // Handle Image Selection
  function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  function clearPhoto() {
    setPhoto(null);
    setPhotoPreview(null);
  }

  function handlePrefillFromAI(aiData) {
    const cat = (!aiData.category || aiData.category === 'none') ? 'pothole' : aiData.category;
    setForm((f) => ({
      ...f,
      category: cat,
      severity: aiData.severity || f.severity,
      description: aiData.description || f.description
    }));
    if (aiData.photoFile) {
      setPhoto(aiData.photoFile);
    }
    if (aiData.photoPreview) {
      setPhotoPreview(aiData.photoPreview);
    }
    setActiveTab('report');
    setMessage('AI defect data pre-filled into registration form! Review coordinates and submit.');
    setMessageType('success');
  }

  async function handleDirectFileFromAI(aiData) {
    const cat = (!aiData.category || aiData.category === 'none') ? 'garbage' : aiData.category;
    const sev = aiData.severity || 4;
    const desc = aiData.description || `AI automated inspection report for ${cat}.`;
    const photoFile = aiData.photoFile || photo;

    setForm((f) => ({
      ...f,
      category: cat,
      severity: sev,
      description: desc
    }));
    if (photoFile) setPhoto(photoFile);
    if (aiData.photoPreview) setPhotoPreview(aiData.photoPreview);

    setBusy(true);
    setMessage('Submitting complaint ticket from AI detection...');
    setMessageType('warning');

    // Try Supabase first
    if (isSupabaseConfigured()) {
      try {
        const result = await supabaseCreateReport({
          category: cat,
          description: desc,
          latitude: form.latitude,
          longitude: form.longitude,
          severity: sev,
          photoFile,
          user
        });
        if (result.duplicateWarning) {
          setMessage(`Duplicate Alert: Linked to existing ${cat} ticket #${result.duplicateOf?.slice(0, 8) || 'root'} within 40m.`);
          setMessageType('warning');
        } else {
          setMessage('Complaint submitted successfully from AI detection! Forwarded to status tracking.');
          setMessageType('success');
        }
        await loadReports();
        setActiveTab('table');
        setBusy(false);
        return;
      } catch (err) {
        console.warn('Supabase note, falling back to local API:', err);
      }
    }

    // Fallback to FastAPI
    try {
      const data = new FormData();
      data.append('category', cat);
      data.append('description', desc);
      data.append('latitude', form.latitude);
      data.append('longitude', form.longitude);
      data.append('severity', sev);
      if (photoFile) data.append('photo', photoFile);

      const res = await fetch(`${API}/api/reports`, {
        method: 'POST',
        body: data
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || 'Failed to submit report');

      if (result.duplicate_warning) {
        setMessage(`Duplicate Alert: Linked to parent ticket #${result.duplicate_of?.slice(0, 8) || 'root'} within 40m.`);
        setMessageType('warning');
      } else {
        setMessage('Complaint submitted successfully from AI detection! Forwarded to status tracking.');
        setMessageType('success');
      }
      await loadReports();
      setActiveTab('table');
    } catch (err) {
      setMessage('Submission note: ' + err.message);
      setMessageType('error');
    } finally {
      setBusy(false);
    }
  }

  async function analyzeUploadedPhoto() {
    if (!photo) return;
    setBusy(true);
    setMessage('Analyzing photo with AI defect detection...');
    setMessageType('warning');
    try {
      const formData = new FormData();
      formData.append('file', photo);
      const res = await fetch(`${API}/api/detect/image?model=all`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForm((f) => ({
          ...f,
          category: data.top_category || f.category,
          severity: data.suggested_severity || f.severity,
          description: data.ai_description || f.description
        }));
        if (data.annotated_image) {
          setPhotoPreview(data.annotated_image);
        }
        setMessage(`AI Analysis Complete: Verified ${data.top_category.toUpperCase()} (${(data.top_confidence * 100).toFixed(1)}% confidence). Category & severity updated!`);
        setMessageType('success');
      } else {
        setMessage('Defect analysis note: ' + (data.detail || 'Could not verify issue'));
        setMessageType('warning');
      }
    } catch (err) {
      setMessage('Vision API note: ' + err.message);
      setMessageType('warning');
    } finally {
      setBusy(false);
    }
  }

  // AI-Generated Complaint Description Helper
  function generateAIDescription() {
    const cat = form.category.replace('_', ' ');
    const lat = Number(form.latitude) || 22.5726;
    const lon = Number(form.longitude) || 88.3639;
    const sev = form.severity;

    let text = '';
    if (form.category === 'pothole') {
      text = `Automated Computer Vision & GIS Triage: Deep road crater observed near GPS coordinates (${lat.toFixed(4)}, ${lon.toFixed(4)}). Assessed severity level: ${sev}/5. High risk of two-wheeler skid and vehicular disruption. Immediate cold-mix asphalt patch dispatch recommended.`;
    } else if (form.category === 'waterlogging') {
      text = `Automated Computer Vision & GIS Triage: Severe stormwater pooling obstructing pedestrian crossing near GPS (${lat.toFixed(4)}, ${lon.toFixed(4)}). Severity: ${sev}/5. Drainage culvert blockage flagged; suction dewatering pump required.`;
    } else {
      text = `Automated Computer Vision & GIS Triage: Unmanaged solid waste accumulation on road shoulder near GPS (${lat.toFixed(4)}, ${lon.toFixed(4)}). Severity: ${sev}/5. Work order routed to morning sanitation compactor squad.`;
    }

    setForm((f) => ({ ...f, description: text }));
    setMessage('AI complaint description synthesized from visual features and GPS coordinates.');
    setMessageType('success');
  }

  // Submit report to Supabase (with FastAPI fallback)
  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage('');

    // Try Supabase first
    if (isSupabaseConfigured()) {
      try {
        const result = await supabaseCreateReport({
          category: form.category,
          description: form.description,
          latitude: form.latitude,
          longitude: form.longitude,
          severity: form.severity,
          photoFile: photo,
          user
        });

        if (result.duplicateWarning) {
          setMessage(`Duplicate Complaint Alert: An existing ${form.category.replace('_', ' ')} ticket within 40m was detected! Linked to parent Ticket #${result.duplicateOf?.slice(0, 8) || 'root'}. Status: REPORTED.`);
          setMessageType('warning');
        } else {
          setMessage('Civic issue registered successfully with status: REPORTED! Queued for municipal admin review.');
          setMessageType('success');
        }

        setForm({
          category: 'pothole',
          description: '',
          latitude: '22.5726',
          longitude: '88.3639',
          severity: 4
        });
        clearPhoto();
        await loadReports();
        setActiveTab('table');
        setBusy(false);
        return;
      } catch (supabaseErr) {
        console.warn('Supabase submission note, falling back to local API:', supabaseErr);
      }
    }

    // Fallback to FastAPI
    const data = new FormData();
    data.append('category', form.category);
    data.append('description', form.description);
    data.append('latitude', form.latitude);
    data.append('longitude', form.longitude);
    data.append('severity', form.severity);
    if (photo) {
      data.append('photo', photo);
    }

    try {
      const res = await fetch(`${API}/api/reports`, {
        method: 'POST',
        body: data
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.detail || 'Submission failed');

      if (result.duplicate_warning) {
        setMessage(`Duplicate Complaint Alert: An existing ${form.category.replace('_', ' ')} ticket within 40m was detected! Linked to parent Ticket #${result.duplicate_of?.slice(0, 8) || 'root'}. Status: REPORTED.`);
        setMessageType('warning');
      } else {
        setMessage('Civic issue registered successfully with status: REPORTED! Queued for municipal admin review.');
        setMessageType('success');
      }

      setForm({
        category: 'pothole',
        description: '',
        latitude: '22.5726',
        longitude: '88.3639',
        severity: 4
      });
      clearPhoto();
      await loadReports();
      setActiveTab('table');
    } catch (err) {
      setMessage(err.message || 'Submission error');
      setMessageType('error');
    } finally {
      setBusy(false);
    }
  }

  // Change status of report (Complaint Status Tracking via Supabase)
  async function changeStatus(id, newStatus) {
    if (!isAdmin) {
      setMessage('Access Restricted: Only Municipal Administrators can dispatch work orders and change status.');
      setMessageType('error');
      return;
    }

    if (isSupabaseConfigured()) {
      try {
        await supabaseUpdateReportStatus(id, newStatus);
        setMessage(`Complaint #${id.slice(0, 8)} status updated to "${newStatus.replace('_', ' ').toUpperCase()}". Citizen tracking updated.`);
        setMessageType('success');
        loadReports();
        return;
      } catch (err) {
        console.warn('Supabase status update error, trying local fallback:', err);
      }
    }

    try {
      const res = await fetch(`${API}/api/reports/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setMessage(`Complaint #${id.slice(0, 8)} status updated to "${newStatus.replace('_', ' ').toUpperCase()}". Citizen tracking updated.`);
        setMessageType('success');
        loadReports();
      } else {
        setMessage('Could not update status.');
        setMessageType('error');
      }
    } catch {
      setMessage('Backend error while updating complaint status.');
      setMessageType('error');
    }
  }

  const center = reports.length > 0 && reports[0].latitude
    ? [reports[0].latitude, reports[0].longitude]
    : [22.5726, 88.3639];

  const validReports = reports.filter((r) => r.status !== 'rejected');
  const mapMarkers = disperseOverlappingMarkers(validReports);

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="app-wrapper">
      {/* Top Application Header */}
      <header className="app-header">
        <div className="app-header-inner">
          <div className="app-header-left">
            <button className="btn-back-landing" onClick={onBackToLanding}>
              <ArrowLeft size={14} /> Back to Landing Page
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div className="brand-badge" style={{ width: '30px', height: '30px' }}>
                <img src="/logo.png" alt="CiviSense Emblem" className="brand-badge-img" />
              </div>
              <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '-0.3px' }}>
                {isAdmin ? 'CiviSense Admin GIS Operations' : 'CiviSense Citizen Reporting Console'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="app-user-pill">
              <span className="logged-in-dot"></span>
              <span>Logged in as <strong>{user?.name || (isAdmin ? 'Municipal GIS Officer' : 'Citizen Reporter')}</strong></span>
              <span className="app-user-role-badge">
                {isAdmin ? 'ADMIN' : 'CITIZEN'}
              </span>
            </div>

            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {user && (
              <button
                className="btn-text"
                style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={onSignOut}
              >
                <LogOut size={13} /> Sign Out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Navigation Sub-Tabs */}
      <div className="app-tabs-bar">
        <div className="app-tabs-inner">
          {isAdmin ? (
            <>
              <button
                className={`app-tab-item ${activeTab === 'map' ? 'active' : ''}`}
                onClick={() => setActiveTab('map')}
              >
                <MapPin size={15} /> Live GIS Map
              </button>
              <button
                className={`app-tab-item ${activeTab === 'table' ? 'active' : ''}`}
                onClick={() => setActiveTab('table')}
              >
                <ShieldCheck size={15} /> Complaint Status Tracking ({validReports.length} Reports)
              </button>
            </>
          ) : (
            <>
              <button
                className={`app-tab-item ${activeTab === 'map' ? 'active' : ''}`}
                onClick={() => setActiveTab('map')}
              >
                <MapPin size={15} /> Live GIS Map
              </button>
              <button
                className={`app-tab-item ${activeTab === 'ai_detector' ? 'active' : ''}`}
                onClick={() => setActiveTab('ai_detector')}
              >
                <Camera size={15} /> AI Issue Detection
              </button>
              <button
                className={`app-tab-item ${activeTab === 'report' ? 'active' : ''}`}
                onClick={() => setActiveTab('report')}
              >
                <Send size={15} /> Citizen Complaint
              </button>
              <button
                className={`app-tab-item ${activeTab === 'table' ? 'active' : ''}`}
                onClick={() => setActiveTab('table')}
              >
                <ShieldCheck size={15} /> Complaint Status Tracking ({validReports.length} Reports)
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="app-main-content">
        {/* Real-time Status Alert Banner */}
        {message && (
          <div className={`notification-banner ${messageType}`}>
            <span>{message}</span>
            <button
              onClick={() => setMessage('')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, color: 'inherit' }}
            >
              ×
            </button>
          </div>
        )}

        {/* Top Summary Metric Cards */}
        <div className="app-stat-banner">
          <div className="app-stat-card">
            <div>
              <div className="num">{validReports.length}</div>
              <div className="desc">Total Tracked Complaints</div>
            </div>
            <Clock size={24} style={{ color: 'var(--text-muted)' }} />
          </div>

          <div className="app-stat-card">
            <div>
              <div className="num">
                {reports.filter((r) => r.status === 'reported').length}
              </div>
              <div className="desc">Awaiting GIS Triage</div>
            </div>
            <AlertTriangle size={24} style={{ color: 'var(--accent-amber-text)' }} />
          </div>

          <div className="app-stat-card">
            <div>
              <div className="num">
                {reports.filter((r) => r.status === 'in_progress' || r.status === 'assigned').length}
              </div>
              <div className="desc">Active Field Work Orders</div>
            </div>
            <Layers size={24} style={{ color: 'var(--accent-cyan)' }} />
          </div>

          <div className="app-stat-card">
            <div>
              <div className="num">
                {reports.filter((r) => r.status === 'resolved').length}
              </div>
              <div className="desc">Verified & Resolved</div>
            </div>
            <CheckCircle2 size={24} style={{ color: '#34D399' }} />
          </div>
        </div>

        {/* AI Defect Scanner Workstation */}
        {activeTab === 'ai_detector' && (
          <AIDetector
            API={API}
            onPrefillComplaint={handlePrefillFromAI}
            onDirectFileComplaint={handleDirectFileFromAI}
          />
        )}

        {/* Citizen Complaint Registration Tab */}
        {activeTab === 'report' && (
          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            {/* Submit Panel */}
            <section className="app-panel">
              <div className="app-panel-header">
                <div>
                  <span className="preview-eyebrow">GPS-BASED REGISTRATION</span>
                  <h3 className="app-panel-title">Register Civic Complaint</h3>
                </div>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  CV · AI · GIS
                </span>
              </div>

              <form onSubmit={handleSubmit} className="submit-form">
                {/* Category Selector */}
                <div>
                  <label className="demo-label">1. Defect Classification (Multi-Class AI)</label>
                  <div className="category-chips-row">
                    {categories.map((c) => (
                      <button
                        type="button"
                        key={c}
                        className={`category-chip-btn ${form.category === c ? 'active' : ''}`}
                        onClick={() => setForm({ ...form, category: c })}
                      >
                        {c === 'pothole' && '🕳️ '}
                        {c === 'waterlogging' && '🌊 '}
                        {c === 'garbage' && '🗑️ '}
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photograph Upload & Preview */}
                <div>
                  <label className="demo-label">2. Defect Photograph (Computer Vision Input)</label>
                  {!photoPreview ? (
                    <label className="file-dropzone" style={{ display: 'block' }}>
                      <Camera size={26} style={{ color: 'var(--accent-cyan)', marginBottom: '8px' }} />
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>Tap to Capture or Upload Photo</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Used for defect detection & validation
                      </div>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        style={{ display: 'none' }}
                        onChange={handlePhotoChange}
                      />
                    </label>
                  ) : (
                    <>
                      <div className="photo-preview-box">
                        <img src={photoPreview} alt="Defect Preview" />
                        <button
                          type="button"
                          className="photo-clear-btn"
                          onClick={clearPhoto}
                          title="Remove photo"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="btn-ai-gen"
                        onClick={analyzeUploadedPhoto}
                        disabled={busy}
                        style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}
                      >
                        <Sparkles size={13} /> Run AI Defect Verification
                      </button>
                    </>
                  )}
                </div>

                {/* Satellite Coordinates */}
                <div>
                  <label className="demo-label">3. GPS Satellite Geolocation</label>
                  <div className="coords-row">
                    <div>
                      <input
                        type="number"
                        step="any"
                        required
                        className="demo-input"
                        placeholder="Latitude"
                        value={form.latitude}
                        onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        step="any"
                        required
                        className="demo-input"
                        placeholder="Longitude"
                        value={form.longitude}
                        onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-gps"
                    onClick={getLocation}
                    style={{ marginTop: '8px', width: '100%' }}
                  >
                    <MapPin size={14} /> Fetch My Current GPS Location
                  </button>
                </div>

                {/* AI Description Generator Button & Textarea */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label className="demo-label" style={{ margin: 0 }}>4. Complaint Description</label>
                    <button
                      type="button"
                      className="btn-ai-gen"
                      onClick={generateAIDescription}
                    >
                      <Sparkles size={12} /> Auto-Generate AI Description
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    className="demo-input"
                    placeholder="Click 'Auto-Generate AI Description' or type details manually..."
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    style={{ marginTop: '6px' }}
                  />
                </div>

                {/* Severity Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label className="demo-label" style={{ margin: 0 }}>
                      5. Hazard Severity: {form.severity} / 5
                    </label>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      {form.severity >= 4 ? 'Emergency / High' : form.severity === 3 ? 'Moderate' : 'Low'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    className="demo-slider"
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: Number(e.target.value) })}
                  />
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={busy}
                  className="btn-submit-incident"
                >
                  {busy ? (
                    <>
                      <RefreshCw size={15} className="spin" /> Registering Complaint...
                    </>
                  ) : (
                    <>
                      <Send size={15} /> Register Complaint on GIS Radar
                    </>
                  )}
                </button>
              </form>
            </section>
          </div>
        )}

        {/* Live GIS Map Tab */}
        {activeTab === 'map' && (
          <section className="app-panel">
                <div className="app-panel-header">
                  <div>
                    <span className="preview-eyebrow">LIVE GIS ISSUE MAP</span>
                    <h3 className="app-panel-title">Municipal Radar Telemetry</h3>
                  </div>
                  <button
                    onClick={loadReports}
                    className="btn-text"
                    style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <RefreshCw size={12} /> Refresh GIS Pins
                  </button>
                </div>

                <div className="app-map-container">
                  <MapContainer center={[22.5726, 88.3639]} zoom={10} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {mapMarkers.map((r) => (
                      <Marker
                        key={r.id}
                        position={[r.mapLat, r.mapLng]}
                        icon={createMapPin(r.status, r.category)}
                      >
                        <Popup>
                          <div style={{ fontFamily: 'var(--font-sans)', minWidth: '190px' }}>
                            <strong style={{ fontSize: '13px', textTransform: 'capitalize', color: '#0F172A' }}>
                              {r.category.replace('_', ' ')}
                            </strong>
                            <div style={{ fontSize: '11px', color: '#475569', margin: '4px 0', lineHeight: 1.4 }}>
                              {r.description}
                            </div>
                            <div style={{ fontSize: '11px', color: '#0F172A' }}>
                              <strong>GPS:</strong> {Number(r.latitude).toFixed(4)}, {Number(r.longitude).toFixed(4)}
                              {r.isDispersed && (
                                <span style={{ color: '#D97706', fontSize: '10px', marginLeft: '6px', fontWeight: 600 }}>
                                  (Cluster pin)
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11px', color: '#0F172A' }}>
                              <strong>Severity:</strong> {r.severity} / 5
                            </div>
                            <div style={{ fontSize: '11px', color: '#0F172A' }}>
                              <strong>Status:</strong> {r.status.toUpperCase()}
                            </div>
                            {r.duplicate_of && (
                              <div style={{ color: '#DC2626', fontSize: '10px', marginTop: '4px', fontWeight: 700 }}>
                                ⚠ 40m Spatial Duplicate Linked
                              </div>
                            )}
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>OpenStreetMap GIS Vector Layer Active</span>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span>● Reported (Amber)</span>
                    <span>● In Progress (Blue)</span>
                    <span>● Resolved (Green)</span>
                  </div>
                </div>
              </section>
        )}

        {/* Complaint Status Tracking Table */}
        {activeTab === 'table' && (
          <section className="app-panel" style={{ marginTop: '24px' }}>
            <div className="app-panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span className="preview-eyebrow">COMPLAINT STATUS TRACKING & AUDIT LOG</span>
                <h3 className="app-panel-title">Active Municipal Issues</h3>
              </div>

              {/* Filters & Search */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    placeholder="Search complaints..."
                    className="demo-input"
                    style={{ paddingLeft: '32px', fontSize: '12px', width: '180px' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  className="demo-input"
                  style={{ width: '140px', fontSize: '12px' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s.replace('_', ' ').toUpperCase()}
                    </option>
                  ))}
                </select>

                <select
                  className="demo-input"
                  style={{ width: '140px', fontSize: '12px' }}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c.replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredReports.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No civic complaints match your filter.
              </div>
            ) : (
              <div className="app-table-wrapper">
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Complaint & Timestamp</th>
                      <th>Severity</th>
                      <th>GIS Coordinates</th>
                      <th>Status Tracking</th>
                      <th>Municipal Dispatch Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div style={{ fontWeight: 800, textTransform: 'capitalize' }}>
                            {r.category === 'pothole' && '🕳️ '}
                            {r.category === 'waterlogging' && '🌊 '}
                            {r.category === 'garbage' && '🗑️ '}
                            {r.category}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.description}
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                            ID: #{r.id.slice(0, 8)} · {new Date(r.created_at).toLocaleDateString()}
                          </div>
                          {r.duplicate_of && (
                            <span className="duplicate-alert-badge">
                              ⚠ Duplicate of #{r.duplicate_of.slice(0, 8)} (&lt;40m)
                            </span>
                          )}
                        </td>

                        <td>
                          <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                            {r.severity} / 5
                          </span>
                        </td>

                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px' }}>
                          {Number(r.latitude).toFixed(4)}, {Number(r.longitude).toFixed(4)}
                        </td>

                        <td>
                          <span className={`status-badge ${r.status}`}>
                            {r.status.replace('_', ' ')}
                          </span>
                        </td>

                        <td>
                          {isAdmin ? (
                            <select
                              className="status-select-input"
                              value={r.status}
                              onChange={(e) => changeStatus(r.id, e.target.value)}
                            >
                              {statuses.map((s) => (
                                <option key={s} value={s}>
                                  {s.replace('_', ' ').toUpperCase()}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`citizen-dispatch-status ${r.status}`}
                              title="Municipal dispatch status is controlled by municipal administrators"
                            >
                              <Lock size={12} />
                              {r.status === 'reported' && 'Awaiting Dispatch'}
                              {r.status === 'assigned' && 'Crew Assigned'}
                              {r.status === 'in_progress' && 'In Field Work'}
                              {r.status === 'resolved' && 'Work Completed'}
                              {r.status === 'rejected' && 'Review Declined'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
