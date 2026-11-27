import React, { useState } from 'react';
import { ArrowRight, Sparkles, MapPin, GitMerge, Eye, CheckCircle2 } from './Icons';

export default function InteractiveDemo({ onLaunchApp }) {
  const [category, setCategory] = useState('pothole');
  const [severity, setSeverity] = useState(4);
  const [zone, setZone] = useState('arterial'); // 'arterial' | 'residential' | 'market'

  // Dynamic AI Description Generator
  const generateAIDescription = () => {
    const locMap = {
      arterial: 'Central Metro Transit Arterial (High Traffic Corridor)',
      residential: 'Sector 04 Residential Access Road (School & Transit Zone)',
      market: 'Commercial Bazaar Lane (High Pedestrian Density)'
    };
    const locationName = locMap[zone] || 'Municipal Road Sector';

    if (category === 'pothole') {
      return `Automated AI Inspection Report: Deep asphalt pothole (estimated depth ~${(severity * 1.8).toFixed(1)}cm) identified along ${locationName}. Severity level assessed at ${severity}/5. High risk of vehicular suspension damage and two-wheeler skid hazards under rainy conditions. Immediate municipal asphalt patch crew recommended.`;
    }
    if (category === 'waterlogging') {
      return `Automated AI Inspection Report: Stormwater accumulation pooling across ${locationName} with estimated surface area of ${severity * 7}m². Storm drain culvert appears silted and choked. Immediate deployment of high-capacity municipal suction dewatering pumps required.`;
    }
    return `Automated AI Inspection Report: Open municipal solid waste overflow accumulating on shoulder of ${locationName}. Debris volume estimated at ${severity * 1.2}m³. Automated dispatch created for morning compactor sanitation vehicle.`;
  };

  const aiText = generateAIDescription();

  return (
    <section className="demo-section" id="simulator">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">INTERACTIVE AI & GIS SIMULATOR</span>
          <h2 className="section-title">
            Test AI Complaint Generation & 40m Deduplication.
          </h2>
          <p className="section-desc">
            Select an issue category and hazard severity to observe how CiviSense automatically generates
            professional municipal complaint descriptions, runs spatial proximity checks, and locks GPS coordinates.
          </p>
        </div>

        <div className="demo-box">
          <div className="demo-grid">
            {/* Input Form */}
            <div>
              <div className="demo-form-group">
                <label className="demo-label">1. Issue Classification</label>
                <select
                  className="demo-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="pothole">Pothole & Surface Damage</option>
                  <option value="waterlogging">Monsoon Waterlogging & Culvert Sump</option>
                  <option value="garbage">Garbage & Solid Waste Dump</option>
                </select>
              </div>

              <div className="demo-form-group">
                <label className="demo-label">
                  2. Defect Severity Rating: {severity} / 5
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  className="demo-slider"
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                  <span>1 · Minor cosmetic</span>
                  <span>3 · Moderate slowdown</span>
                  <span>5 · Critical hazard</span>
                </div>
              </div>

              <div className="demo-form-group">
                <label className="demo-label">3. Municipal Zone</label>
                <select
                  className="demo-select"
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                >
                  <option value="arterial">High-Speed Arterial Express Corridor</option>
                  <option value="residential">Residential Road & School Zone</option>
                  <option value="market">Commercial Market Lane</option>
                </select>
              </div>

              <button
                className="btn-hero-primary"
                style={{ marginTop: '20px', width: '100%', justifyContent: 'center' }}
                onClick={onLaunchApp}
              >
                Open Full Admin GIS Dashboard <ArrowRight size={14} />
              </button>
            </div>

            {/* Simulated AI Output */}
            <div className="demo-result-card">
              <div className="demo-result-title">
                AUTOMATED AI COMPLAINT SYNTHESIS
              </div>

              <div className="demo-ai-text-box">
                {aiText}
              </div>

              <div className="demo-spec-list">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Eye size={15} style={{ color: 'var(--accent-cyan)' }} />
                  <span>
                    <strong>Computer Vision:</strong> Multi-class YOLOv8 classifier active (Confidence: {(94.2 + severity * 1.1).toFixed(1)}%)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GitMerge size={15} style={{ color: '#34D399' }} />
                  <span>
                    <strong>40m Duplicate Check:</strong> Haversine spatial algorithm scanned 6 active tickets nearby
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={15} style={{ color: 'var(--accent-cyan)' }} />
                  <span>
                    <strong>GPS Coordinates:</strong> 22.5726° N, 88.3639° E (Precision ±2.2m)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={15} style={{ color: '#34D399' }} />
                  <span>
                    <strong>Complaint Tracking:</strong> Initialized at <code>Reported</code> → Ready for Ward Assignment
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
