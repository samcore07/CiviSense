import React from 'react';
import { ArrowRight } from './Icons';

export default function Hero({ onStartReporting, onExploreApp }) {
  return (
    <section className="hero-section" style={{ paddingBottom: '30px' }}>
      <div className="container">
        {/* Hero Headline matching Screenshot 2 */}
        <h1 className="hero-headline">
          AI–Powered Civic Issue <br />
          Intelligence. <br />
          <span className="gradient-text">From Pixels to Asphalt Restoration.</span>
        </h1>

        {/* Hero Subtitle matching Screenshot 2 */}
        <p className="hero-subtext">
          CiviSense automates civic complaint resolution: computer vision detects potholes,
          garbage, waterlogging, and dark streetlights, GPS geotags exact locations,
          40m spatial deduplication suppresses duplicate reports, and local AI generates
          structured complaint descriptions on a live GIS admin map.
        </p>

        {/* Action CTAs: "Report Issue" and "Explore Live GIS Map" */}
        <div className="hero-ctas" style={{ marginBottom: '24px' }}>
          <button className="btn-hero-primary" onClick={onStartReporting}>
            Report Issue <ArrowRight size={15} />
          </button>
          <button className="btn-hero-secondary" onClick={onExploreApp}>
            Explore Live GIS Map
          </button>
        </div>
      </div>
    </section>
  );
}
