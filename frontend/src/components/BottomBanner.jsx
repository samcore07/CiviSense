import React from 'react';
import { ArrowRight } from './Icons';

export default function BottomBanner({ onOpenApp }) {
  return (
    <section className="bottom-banner-section">
      <div className="container">
        <div className="bottom-banner">
          <h2 className="banner-title">
            Computer Vision + AI + GIS for Smarter Civic Governance.
          </h2>
          <p className="banner-subtitle">
            Deploy automated road damage triage in your municipality. Eliminate duplicate complaint tickets,
            auto-generate structured municipal work orders, and monitor every repair live on OpenStreetMap.
          </p>

          <div className="banner-actions">
            <button className="btn-banner-white" onClick={onOpenApp}>
              Explore GIS Console <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
