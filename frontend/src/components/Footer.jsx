import React from 'react';

export default function Footer({ onNavClick }) {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div className="brand-badge" style={{ width: '30px', height: '30px', fontSize: '15px' }}>
                CS
              </div>
              <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '-0.3px' }}>
                CiviSense
              </span>
            </div>
            <p className="footer-brand-desc">
              AI-Powered Civic Issue Reporting System. Integrating Computer Vision, 40m GPS Deduplication,
              and OpenStreetMap GIS for smarter municipal governance.
            </p>
          </div>

          <div>
            <h4 className="footer-col-title">Core Capabilities</h4>
            <ul className="footer-links">
              <li><a href="#features" onClick={(e) => { e.preventDefault(); onNavClick('features'); }}>AI Pothole Detection</a></li>
              <li><a href="#features" onClick={(e) => { e.preventDefault(); onNavClick('features'); }}>Multi-Class Vision</a></li>
              <li><a href="#deduplication" onClick={(e) => { e.preventDefault(); onNavClick('deduplication'); }}>40m Deduplication</a></li>
              <li><a href="#simulator" onClick={(e) => { e.preventDefault(); onNavClick('simulator'); }}>AI Complaint Generator</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Civic Architecture</h4>
            <ul className="footer-links">
              <li><a href="#radar">OpenStreetMap GIS</a></li>
              <li><a href="#features">YOLO Computer Vision</a></li>
              <li><a href="#features">Haversine Spatial Formula</a></li>
              <li><a href="#features">Complaint Status Tracking</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-col-title">Governance & Tech</h4>
            <ul className="footer-links">
              <li><a href="#features">FastAPI & SQLite</a></li>
              <li><a href="#features">Admin Operations Console</a></li>
              <li><a href="#features">Citizen Mobile Geotag</a></li>
              <li><a href="#features">Audit Trail</a></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>&copy; {new Date().getFullYear()} CiviSense — Computer Vision + AI + GIS for Smarter Civic Governance.</span>
          <div style={{ display: 'flex', gap: '18px' }}>
            <span>Privacy Policy</span>
            <span>Municipal Data Standards</span>
            <span>Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
