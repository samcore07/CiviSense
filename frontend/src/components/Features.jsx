import React from 'react';
import { Eye, GitMerge, MapPin, Gauge, Crosshair, ClipboardCheck, Sparkles, Layers } from './Icons';

export default function Features() {
  const featureList = [
    {
      icon: <Eye size={20} />,
      title: 'Custom-Trained YOLO11 Potholes',
      desc: 'Fine-tuned on real-world asphalt rupture datasets with transfer learning for high-precision crater and crack segmentation on Apple Silicon MPS.',
      tag: 'Custom YOLO11 (MPS)'
    },
    {
      icon: <Layers size={20} />,
      title: 'Waterlogging with False-Positive Guard',
      desc: 'Custom-trained segmentation model backed by degenerate bounding box filters (<70% area) to eliminate indoor room false positives.',
      tag: 'Calibrated YOLO11 Seg'
    },
    {
      icon: <Crosshair size={20} />,
      title: 'Open-Vocabulary Garbage Triage',
      desc: 'Tailored municipal prompt lexicon detects black bags, loose trash, overflowing bins, and dumpsters at calibrated 0.15 confidence.',
      tag: 'Open-Vocab YOLO-World'
    },
    {
      icon: <MapPin size={20} />,
      title: 'Radial Spiral Anti-Occlusion Radar',
      desc: 'Anti-collision algorithm blooms overlapping landmark pins outward radially (~700m) so every incident is visible on OpenStreetMap.',
      tag: 'Radial Pin Dispersion'
    },
    {
      icon: <ClipboardCheck size={20} />,
      title: 'Role-Based Municipal Authority',
      desc: 'Admin console provides dispatch status dropdowns; citizens track live work orders with secure read-only locked status badges.',
      tag: 'Strict RBAC Pipeline'
    },
    {
      icon: <Sparkles size={20} />,
      title: '1-Click AI Complaint Dispatch',
      desc: 'Visual inference automatically synthesizes municipal briefs, estimates severity (1–5), and files verified tickets in under 0.5s.',
      tag: '1-Click Neural Filing'
    }
  ];

  return (
    <section className="features-section" id="features">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">CORE ARCHITECTURAL PILLARS</span>
          <h2 className="section-title">
            Neural Vision + Spatial Deduplication + Live GIS.
          </h2>
          <p className="section-desc">
            An intelligent civic pipeline connecting citizen smartphones to municipal road maintenance squads in real time.
          </p>
        </div>

        <div className="features-grid">
          {featureList.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon-wrapper">
                {f.icon}
              </div>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-description">{f.desc}</p>
              <span className="feature-tag">{f.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
