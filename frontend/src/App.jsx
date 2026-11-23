import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PrefaceSection from './components/PrefaceSection';
import Features from './components/Features';
import WorkflowSection from './components/WorkflowSection';
import TutorialSection from './components/TutorialSection';
import BottomBanner from './components/BottomBanner';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import MainApp from './components/MainApp';
import './style.css';

const API = 'http://127.0.0.1:8000';

export default function App() {
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'app'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('civisense_theme') || localStorage.getItem('roadguard_theme') || 'light';
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('civisense_user') || localStorage.getItem('roadguard_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activeNav, setActiveNav] = useState('preface');
  const [reports, setReports] = useState([]);

  // Load live reports from FastAPI for Preface Map and Main App
  async function loadReports() {
    try {
      const res = await fetch(`${API}/api/reports`);
      if (res.ok) {
        setReports(await res.json());
      }
    } catch (e) {
      console.warn('Backend currently offline, running demo coordinates.');
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  // Apply theme to html root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('civisense_theme', theme);
  }, [theme]);

  // ScrollSpy: dynamically and smoothly update the active bookmark pill as user scrolls
  useEffect(() => {
    if (currentView !== 'landing') return;

    const sectionIds = ['preface', 'features', 'workflow', 'tutorial'];

    const handleScroll = () => {
      const scrollPos = window.scrollY + 140; // 140px header offset

      // If at top of the page, highlight preface
      if (window.scrollY < 240) {
        setActiveNav('preface');
        return;
      }

      // Check which section is in view from bottom to top
      for (let i = sectionIds.length - 1; i >= 0; i--) {
        const el = document.getElementById(sectionIds[i]);
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top - 30) {
            setActiveNav(sectionIds[i]);
            return;
          }
        }
      }
      setActiveNav('preface');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentView]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('civisense_user', JSON.stringify(userData));
    setCurrentView('app');
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('civisense_user');
    localStorage.removeItem('roadguard_user');
    setCurrentView('landing');
  };

  // Smooth scroll handler for nav clicks
  const handleNavClick = (id) => {
    setActiveNav(id);
    if (currentView !== 'landing') {
      setCurrentView('landing');
    }
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 20);
  };

  return (
    <div className="site-wrapper">
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {currentView === 'landing' ? (
        <>
          <Navbar
            currentView={currentView}
            setCurrentView={setCurrentView}
            theme={theme}
            toggleTheme={toggleTheme}
            user={user}
            onOpenAuth={() => setAuthModalOpen(true)}
            onSignOut={handleSignOut}
            activeNav={activeNav}
            setActiveNav={setActiveNav}
          />

          {/* 2nd Screenshot stays on top */}
          <Hero
            onStartReporting={() => setCurrentView('app')}
            onExploreApp={() => {
              const el = document.getElementById('gis-map') || document.getElementById('preface');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setActiveNav('preface');
              }
            }}
          />

          {/* 1. Preface (3rd screenshot + Map in console) */}
          <PrefaceSection
            reports={reports}
            onRefreshReports={loadReports}
          />

          {/* 2. Features (4th screenshot as it is) */}
          <Features />

          {/* 3. Workflow (Actual clean workflow) */}
          <WorkflowSection />

          {/* 4. Tutorial (5th screenshot video walkthrough + chapters) */}
          <TutorialSection />

          {/* 5. Footer and end portion remains as it is */}
          <BottomBanner
            onOpenApp={() => setCurrentView('app')}
          />

          <Footer onNavClick={handleNavClick} />
        </>
      ) : (
        <MainApp
          onBackToLanding={() => setCurrentView('landing')}
          user={user}
          onSignOut={handleSignOut}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}
    </div>
  );
}
