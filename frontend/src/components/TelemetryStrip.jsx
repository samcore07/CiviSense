import React from 'react';

export default function TelemetryStrip() {
  const stats = [
    { num: '96.8%', label: 'Computer Vision Damage Detection Accuracy' },
    { num: '40m', label: 'Haversine Spatial Deduplication Radius' },
    { num: '0.4s', label: 'AI Complaint Description Synthesis Latency' },
    { num: '100%', label: 'Satellite GPS Precision & OpenStreetMap GIS Coverage' }
  ];

  return (
    <section className="telemetry-strip" id="deduplication">
      <div className="container">
        <div className="telemetry-items">
          {stats.map((s, idx) => (
            <div key={idx} className="telemetry-item">
              <span className="telemetry-num">{s.num}</span>
              <span className="telemetry-desc">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
