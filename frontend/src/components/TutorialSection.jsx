import React, { useState, useRef } from 'react';
import { Clock, Play, ExternalLink, CheckCircle2 } from './Icons';

export default function TutorialSection() {
  const [videoSrc, setVideoSrc] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const chapters = [
    {
      time: '00:00 - 00:25',
      title: 'Intro & Auth',
      desc: 'Citizen and Municipal Officer authentication with role-based access control.'
    },
    {
      time: '00:25 - 00:46',
      title: 'Dashboard',
      desc: 'Centralized civic command overview, live KPI metrics, and ward telemetry.'
    },
    {
      time: '00:46 - 01:25',
      title: 'Computer Vision',
      desc: 'YOLO model detecting pothole crater, depth calculation, and multi-class defects.'
    },
    {
      time: '01:25 - 02:06',
      title: '40m Deduplication',
      desc: 'Haversine mathematical proximity filter clustering nearby duplicate complaints.'
    },
    {
      time: '02:06 - 02:46',
      title: 'AI Complaint Drafting',
      desc: 'Automated synthesis of structured, formal municipal work order descriptions.'
    },
    {
      time: '02:46 - 03:02',
      title: 'Live GIS Issue Map',
      desc: 'OpenStreetMap radar plotting real-time colored pins with popup inspection.'
    },
    {
      time: '03:02 - 03:37',
      title: 'Dynamic Severity Matrix',
      desc: 'Urgency scoring factoring road transit speed, pedestrian risk, and defect depth.'
    },
    {
      time: '03:37 - 03:54',
      title: 'Municipal Dispatch & Audit',
      desc: 'End-to-end lifecycle tracking from Reported to In Progress to Resolved.'
    }
  ];

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setVideoSrc(url);
      setIsPlaying(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play();
        }
      }, 100);
    }
  };

  const handlePlayToggle = () => {
    if (videoSrc && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    } else {
      // If no video uploaded yet, trigger file picker so user can upload their video
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  return (
    <section className="tutorial-section" id="tutorial">
      <div className="container">
        {/* Header matching Screenshot 5 */}
        <div className="section-header">
          <div className="hero-chip-wrapper" style={{ marginBottom: '14px' }}>
            <div className="hero-chip" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
              <span>▶ PRODUCT WALKTHROUGH</span>
            </div>
          </div>
          <h2 className="section-title">
            See CiviSense in Action
          </h2>
          <p className="section-desc">
            Watch a comprehensive tutorial walkthrough covering mobile GPS geotagging,
            YOLO computer vision inspection, 40m spatial deduplication, and live municipal GIS dispatch.
          </p>
        </div>

        {/* Video Player Box matching Screenshot 5 */}
        <div className="video-player-container">
          <div className="video-player-card">
            {videoSrc ? (
              <div className="video-media-wrap">
                <video
                  ref={videoRef}
                  src={videoSrc}
                  controls
                  className="video-element"
                  onEnded={() => setIsPlaying(false)}
                />
              </div>
            ) : (
              <div className="video-screen-placeholder" onClick={handlePlayToggle}>
                <div className="video-grid-pattern"></div>
                <div className="video-center-cta">
                  <div className="video-play-btn-circle">
                    <Play size={26} style={{ marginLeft: '4px', fill: 'currentColor' }} />
                  </div>
                  <div className="video-play-label">
                    Watch Full Product Walkthrough (03:54)
                  </div>
                </div>
              </div>
            )}

            {/* Hidden Video File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="video/mp4,video/webm,video/ogg"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />

            {/* Video Footer Bar */}
            <div className="video-bottom-bar" style={{ justifyContent: 'flex-end' }}>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="video-yt-link"
              >
                Watch on YouTube <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* 8 Timestamp / Chapter Cards Grid matching Screenshot 5 */}
          <div className="chapter-cards-grid">
            {chapters.map((ch, idx) => (
              <div
                key={idx}
                className={`chapter-card ${activeChapter === idx ? 'active' : ''}`}
                onClick={() => setActiveChapter(idx)}
              >
                <div className="chapter-time-pill">
                  <Clock size={11} />
                  <span>{ch.time}</span>
                </div>
                <h4 className="chapter-title">{ch.title}</h4>
                <p className="chapter-desc">{ch.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
