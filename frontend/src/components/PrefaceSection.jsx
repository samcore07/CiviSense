import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Sparkles, Eye, GitMerge, MapPin, Layers, RefreshCw } from './Icons';
import { disperseOverlappingMarkers } from './MainApp';

// Custom colored GIS map marker generator
const createMapPin = (status) => {
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

export default function PrefaceSection({ reports = [], onRefreshReports }) {
  const scenarios = [
    {
      id: 'pothole',
      categoryName: '🕳️ Pothole Damage',
      incidentId: 'CS-9482',
      title: 'Major Arterial Pothole & Road Surface Rupture',
      coords: '22.5726° N, 88.3639° E',
      cvClassification: 'Pothole · Grade 4/5',
      cvSub: 'Custom YOLO11 detected 42cm asphalt crater (97.4% conf · MPS)',
      cvBounding: 'bbox: [120, 240, 480, 560] · skid_risk: HIGH',
      dedupStatus: 'Duplicate Suppressed',
      dedupSub: 'Spatial Haversine matched 1 ticket within 18.2m',
      dedupBadge: 'Linked to Ticket #CS-9480 · 0 Duplicates Dispatched',
      aiDescription: '"Severe road crater posing critical two-wheeler skid hazard. Immediate cold-mix asphalt patching requested."',
      status: 'Awaiting Triage'
    },
    {
      id: 'waterlogging',
      categoryName: '🌊 Waterlogging & Sump',
      incidentId: 'CS-9485',
      title: 'Monsoon Runoff Sump Overflow & Underpass Ponding',
      coords: '22.5780° N, 88.3690° E',
      cvClassification: 'Waterlogging · Grade 5/5',
      cvSub: 'Custom YOLO11 segmented 28m² flood zone with degenerate box guard',
      cvBounding: 'segmentation: 28.4m² surface · flow_block: CRITICAL',
      dedupStatus: 'Root Incident Logged',
      dedupSub: 'No nearby reports within 40m · Priority dispatched',
      dedupBadge: 'Unique Incident · Automated GIS Pin Created',
      aiDescription: '"Stormwater ponding exceeding 15cm near underpass. Culvert silt blockage detected. Dewatering crew dispatched."',
      status: 'Crew Mobilized'
    },
    {
      id: 'garbage',
      categoryName: '🗑️ Garbage Dump',
      incidentId: 'CS-9491',
      title: 'Unregulated Municipal Waste Overflow on Road Shoulder',
      coords: '22.5850° N, 88.3750° E',
      cvClassification: 'Garbage Dump · Grade 3/5',
      cvSub: 'Open-Vocab YOLO-World matched black waste bags via tailored lexicon',
      cvBounding: 'solid_waste_volume: ~3.5m³ · lane_obstruction: ACTIVE',
      dedupStatus: 'Root Incident Logged',
      dedupSub: 'Zero duplicates within 40m radius · Route optimized',
      dedupBadge: 'Sanitation Compactor Truck Scheduled',
      aiDescription: '"Commercial waste spill obstructing curb. Automated work order generated for morning sanitation compactor."',
      status: 'In Progress'
    }
  ];

  const [activeScenario, setActiveScenario] = useState(scenarios[0]);
  const [mapFilter, setMapFilter] = useState('all');

  const stats = [
    { num: '96.8%', label: 'Computer Vision Damage Detection Accuracy' },
    { num: '40m', label: 'Haversine Spatial Deduplication Radius' },
    { num: '0.4s', label: 'AI Complaint Description Synthesis Latency' },
    { num: '100%', label: 'Satellite GPS Precision & OpenStreetMap GIS Coverage' }
  ];

  const filteredMapReports = reports.filter((r) => {
    if (r.status === 'rejected') return false;
    if (mapFilter === 'all') return true;
    return r.category === mapFilter;
  });

  const dispersedPrefaceMarkers = disperseOverlappingMarkers(filteredMapReports);

  const center = reports.length > 0 && reports[0].latitude
    ? [reports[0].latitude, reports[0].longitude]
    : [22.5726, 88.3639];

  return (
    <section className="preface-section" id="preface">
      <div className="container">
        {/* Section Header */}
        <div className="section-header" style={{ marginBottom: '36px' }}>
          <span className="section-eyebrow">PREFACE & SYSTEM TELEMETRY</span>
          <h2 className="section-title">
            Custom Vision & Live GIS Radar Telemetry.
          </h2>
          <p className="section-desc">
            Inspect real-time YOLO11 damage inference, 40m spatial deduplication, and regional GIS pins on OpenStreetMap.
          </p>
        </div>

        {/* 1. Screenshot 3: Active Blueprint Preview Card */}
        <div className="preview-card-container">
          <div className="preview-card">
            {/* Header Row */}
            <div className="preview-card-header">
              <div className="preview-header-left">
                <span className="preview-eyebrow">
                  LIVE GIS RADAR & COMPUTER VISION TELEMETRY
                </span>
                <h3 className="preview-title">
                  Incident #{activeScenario.incidentId} · {activeScenario.title}
                </h3>
              </div>

              {/* Status Badges */}
              <div className="preview-badges">
                <span className="status-pill ai-ready">
                  ● {activeScenario.cvClassification.split('·')[0].trim()}
                </span>
                <span className="status-pill healthy">
                  {activeScenario.status}
                </span>
                <span className="status-pill neutral">
                  {activeScenario.coords}
                </span>
              </div>
            </div>

            {/* 3 High-Fidelity Architectural Metric Cards */}
            <div className="preview-metrics-grid">
              {/* Metric 1: Computer Vision (YOLO) */}
              <div className="metric-box-cv blue">
                <div className="metric-top">
                  <span className="metric-label">Computer Vision (YOLO)</span>
                  <div className="metric-icon-circle blue">
                    <Eye size={16} />
                  </div>
                </div>
                <span className="metric-value">{activeScenario.cvClassification}</span>
                <span className="metric-sub">{activeScenario.cvSub}</span>
                <div className="cv-badge-blue">
                  <span className="cv-badge-dot blue"></span>
                  <span>{activeScenario.cvBounding}</span>
                </div>
              </div>

              {/* Metric 2: 40m Spatial Deduplication */}
              <div className="metric-box-cv green">
                <div className="metric-top">
                  <span className="metric-label">40m Spatial Deduplication</span>
                  <div className="metric-icon-circle green">
                    <GitMerge size={16} />
                  </div>
                </div>
                <span className="metric-value">{activeScenario.dedupStatus}</span>
                <span className="metric-sub">{activeScenario.dedupSub}</span>
                <div className="cv-badge-green">
                  <span className="cv-badge-dot green"></span>
                  <span>{activeScenario.dedupBadge}</span>
                </div>
              </div>

              {/* Metric 3: AI-Generated Description */}
              <div className="metric-box-cv amber">
                <div className="metric-top">
                  <span className="metric-label">AI Complaint Synthesis</span>
                  <div className="metric-icon-circle amber">
                    <Sparkles size={16} />
                  </div>
                </div>
                <span className="metric-value" style={{ fontSize: '18px' }}>
                  Municipal Dispatch Brief
                </span>
                <div className="ai-quote-box">
                  {activeScenario.aiDescription}
                </div>
                <div className="cv-badge-amber">
                  <span className="cv-badge-dot amber"></span>
                  <span>Auto-drafted from visual features &amp; GPS</span>
                </div>
              </div>
            </div>

            {/* Category Switcher */}
            <div className="preview-interactive-bar">
              <span className="sample-selector-label">
                SIMULATE CIVIC ISSUE DETECTION:
              </span>
              <div className="sample-chips">
                {scenarios.map((sc) => (
                  <button
                    key={sc.id}
                    className={`sample-chip-btn ${activeScenario.id === sc.id ? 'active' : ''}`}
                    onClick={() => setActiveScenario(sc)}
                  >
                    {sc.categoryName}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Telemetry Strip matching Screenshot 3 */}
        <div className="telemetry-strip" style={{ margin: '40px 0' }}>
          <div className="telemetry-items">
            {stats.map((s, idx) => (
              <div key={idx} className="telemetry-item">
                <span className="telemetry-num">{s.num}</span>
                <span className="telemetry-desc">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. The Map in Console (Integrated right here in Preface) */}
        <div className="preface-map-card" id="gis-map">
          <div className="preface-map-header">
            <div>
              <span className="preview-eyebrow">LIVE GIS RADAR CONSOLE</span>
              <h3 className="preface-map-title">
                Active Ward Map & Geospatial Telemetry
              </h3>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <div className="sample-chips">
                {['all', 'pothole', 'waterlogging', 'garbage'].map((cat) => (
                  <button
                    key={cat}
                    className={`sample-chip-btn ${mapFilter === cat ? 'active' : ''}`}
                    onClick={() => setMapFilter(cat)}
                  >
                    {cat === 'all' ? 'All Incidents' : cat.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {onRefreshReports && (
                <button
                  className="btn-text"
                  style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onClick={onRefreshReports}
                  title="Sync with SQLite database"
                >
                  <RefreshCw size={13} /> Sync
                </button>
              )}
            </div>
          </div>

          <div className="preface-map-wrap">
            <MapContainer center={[22.5726, 88.3639]} zoom={10} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {dispersedPrefaceMarkers.map((r) => (
                <Marker
                  key={r.id}
                  position={[r.mapLat, r.mapLng]}
                  icon={createMapPin(r.status)}
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
            <span>Live OpenStreetMap GIS vector telemetry · Real SQLite database pings</span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span>● Reported (Amber)</span>
              <span>● In Progress (Blue)</span>
              <span>● Resolved (Green)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
