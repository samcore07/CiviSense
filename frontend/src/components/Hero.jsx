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
          Custom-trained YOLO11 vision detects asphalt craters, urban stormwater, and municipal waste in real time.
          Geotagged with 40m spatial deduplication on an interactive GIS dispatch radar.
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
