import React from 'react';
import { Camera, Eye, GitMerge, Sparkles, MapPin, CheckCircle2, ArrowRight } from './Icons';

export default function WorkflowSection() {
  const workflowSteps = [
    {
      step: '01',
      icon: <Camera size={20} />,
      title: 'Mobile Geotag & Photo Capture',
      desc: 'Citizen encounters a road defect, opens the mobile app, captures an image, and locks high-precision satellite GPS coordinates (±2m accuracy).',
      badge: 'Browser Geolocation API'
    },
    {
      step: '02',
      icon: <Eye size={20} />,
      title: 'Computer Vision Inference',
      desc: 'YOLO neural model processes the photograph, detects bounding boxes, classifies the hazard (pothole, waterlogging, streetlight, garbage), and estimates severity.',
      badge: 'YOLO Multi-Class Vision'
    },
    {
      step: '03',
      icon: <GitMerge size={20} />,
      title: '40m Spatial Deduplication',
      desc: 'Haversine mathematical algorithm scans the database within a 40-metre proximity window, linking duplicate citizen pings to the root ticket.',
      badge: 'Haversine Cluster Filter'
    },
    {
      step: '04',
      icon: <Sparkles size={20} />,
      title: 'AI Complaint Synthesis',
      desc: 'Local AI LLM automatically crafts an official, structured municipal complaint text with hazard assessment, equipment requirements, and priority level.',
      badge: 'Automated Work Order Text'
    },
    {
      step: '05',
      icon: <MapPin size={20} />,
      title: 'GIS Dispatch & Lifecycle Tracking',
      desc: 'Ward engineers view the incident on the live OpenStreetMap console, dispatch road maintenance crews, and transition status to Resolved with photo audit proof.',
      badge: 'Reported → Assigned → Resolved'
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
            An automated, transparent pipeline from the initial smartphone camera click to asphalt restoration and municipal sign-off.
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
