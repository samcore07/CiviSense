import React from 'react';
import { ArrowRight } from './Icons';

export default function BottomBanner({ onOpenApp }) {
  return (
    <section className="bottom-banner-section">
      <div className="container">
        <div className="bottom-banner">
          <h2 className="banner-title">
            Neural Vision + Spatial Deduplication + Live GIS Radar.
          </h2>
          <p className="banner-subtitle">
            Automate defect triage: eliminate duplicate complaints with 40m Haversine clustering and dispatch field squads in real time.
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
