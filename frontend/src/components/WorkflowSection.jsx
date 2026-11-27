import React from 'react';
import { Camera, Eye, GitMerge, Sparkles, MapPin, CheckCircle2, ArrowRight } from './Icons';

export default function WorkflowSection() {
  const workflowSteps = [
    {
      step: '01',
      icon: <Camera size={20} />,
      title: 'Geotag & Defect Capture',
      desc: 'Citizen captures defect photo with automated satellite GPS coordinate lock (±2m accuracy).',
      badge: 'HTML5 Geolocation API'
    },
    {
      step: '02',
      icon: <Eye size={20} />,
      title: 'Custom YOLO11 Inference',
      desc: 'Custom-trained neural models segment craters, waterlogging, and waste on Apple Silicon MPS.',
      badge: 'Custom YOLO11 + MPS'
    },
    {
      step: '03',
      icon: <GitMerge size={20} />,
      title: '40m Spatial Deduplication',
      desc: 'Haversine clustering suppresses duplicate pings within 40m and links to the root incident.',
      badge: 'Haversine Proximity Filter'
    },
    {
      step: '04',
      icon: <Sparkles size={20} />,
      title: 'AI Complaint Synthesis',
      desc: 'Automated synthesis generates structured municipal dispatch briefs and severity ratings in under 0.5s.',
      badge: 'Automated Work Order Text'
    },
    {
      step: '05',
      icon: <MapPin size={20} />,
      title: 'GIS Dispatch & Lifecycle',
      desc: 'Ward engineers dispatch maintenance squads on the live GIS map; citizens track real-time status.',
      badge: 'Reported → Resolved'
    }
  ];

  return (
    <section className="workflow-section" id="workflow">
      <div className="container">
        <div className="section-header">
          <span className="section-eyebrow">OPERATIONAL LIFECYCLE</span>
          <h2 className="section-title">
            The End-to-End Civic Intelligence Workflow.
          </h2>
          <p className="section-desc">
            An automated, transparent pipeline from initial camera click to asphalt restoration and municipal sign-off.
          </p>
        </div>

        {/* Clean Modern 5-Step Pipeline Grid */}
        <div className="workflow-pipeline-grid">
          {workflowSteps.map((ws, i) => (
            <div key={i} className="workflow-card">
              <div className="workflow-card-top">
                <span className="workflow-step-num">{ws.step}</span>
                <div className="workflow-card-icon">
                  {ws.icon}
                </div>
              </div>
              <h3 className="workflow-card-title">{ws.title}</h3>
              <p className="workflow-card-desc">{ws.desc}</p>
              <div className="workflow-card-badge">{ws.badge}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
