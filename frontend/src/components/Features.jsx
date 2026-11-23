import React from 'react';
import { Eye, GitMerge, MapPin, Gauge, Crosshair, ClipboardCheck, Sparkles, Layers } from './Icons';

export default function Features() {
  const featureList = [
    {
      icon: <Eye size={20} />,
      title: 'AI Pothole & Road Damage Detection',
      desc: 'Trained Computer Vision models (YOLO) scan citizen defect photographs to autonomously identify asphalt craters, surface subsidence, and cracks, scoring depth and vehicular hazard severity.',
      tag: 'YOLO Computer Vision'
    },
    {
      icon: <Layers size={20} />,
      title: 'Garbage, Waterlogging & Streetlight Classification',
      desc: 'Multi-class visual AI categorizes unmanaged solid waste heaps, monsoon waterlogging across crossings, and dark non-functional streetlights with instant confidence scores.',
      tag: 'Multi-Class Neural Triage'
    },
    {
      icon: <Crosshair size={20} />,
      title: 'GPS-Based Complaint Registration',
      desc: 'One-tap satellite geolocation locks precise latitude and longitude coordinates directly from the citizen mobile browser, eliminating ambiguity and mapping exact road defect positions.',
      tag: 'HTML5 GPS Geotagging'
    },
    {
      icon: <GitMerge size={20} />,
      title: 'Duplicate Complaint Detection',
      desc: 'Haversine mathematical clustering detects when another citizen has already reported the same issue within a 40-metre proximity window, linking reports to prevent redundant crew dispatches.',
      tag: '40m Haversine Heuristic'
    },
    {
      icon: <Sparkles size={20} />,
      title: 'AI-Generated Complaint Descriptions',
      desc: 'Natural language AI models automatically formulate detailed, professional municipal complaint briefs from visual defect features, GPS location, and severity ratings in under 0.5s.',
      tag: 'Local LLM Prompt Synthesis'
    },
    {
      icon: <MapPin size={20} />,
      title: 'Admin Dashboard with Live GIS Issue Map',
      desc: 'Interactive OpenStreetMap GIS control console allowing municipal officers to visualize clusters, inspect defect photos, filter by category or ward, and dispatch field crews in real time.',
      tag: 'Interactive OpenStreetMap GIS'
    },
    {
      icon: <ClipboardCheck size={20} />,
      title: 'End-to-End Complaint Status Tracking',
      desc: 'Citizens and municipal supervisors track every ticket across its complete lifecycle: Reported → Assigned → In Progress → Resolved, backed by verifiable audit timestamps.',
      tag: 'Lifecycle Audit Pipeline'
    }
  ];

  return (
    <section className="features-section" id="features">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">CORE ARCHITECTURAL PILLARS</span>
          <h2 className="section-title">
            Computer Vision + AI + GIS for Smarter Civic Governance.
          </h2>
          <p className="section-desc">
            A comprehensive civic infrastructure platform connecting citizen smartphones to municipal road maintenance squads through automated intelligence and spatial mapping.
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
