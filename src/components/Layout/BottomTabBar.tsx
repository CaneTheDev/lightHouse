import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import type { ActiveView } from '../../context/AppContext';
import { LayoutDashboard, Compass, FileText, User, Settings, LogOut } from 'lucide-react';

export const BottomTabBar: React.FC = () => {
  const { activeView, setView, logout } = useApp();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close popover when tapping outside
  useEffect(() => {
    if (!profileMenuOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [profileMenuOpen]);

  const navigateTo = (view: ActiveView) => {
    setView(view);
    setProfileMenuOpen(false);
  };

  const isProfileGroupActive = activeView === 'profile';

  return (
    <nav className="bottom-tab-bar">

      {/* 1 — Home */}
      <button
        className={`tab-item ${activeView === 'dashboard' ? 'active' : ''}`}
        onClick={() => navigateTo('dashboard')}
        aria-label="Home"
      >
        <span className="tab-item-icon"><LayoutDashboard size={20} /></span>
        <span className="tab-item-label">Home</span>
      </button>

      {/* 2 — Discover */}
      <button
        className={`tab-item ${activeView === 'discovery' ? 'active' : ''}`}
        onClick={() => navigateTo('discovery')}
        aria-label="Discover"
      >
        <span className="tab-item-icon"><Compass size={20} /></span>
        <span className="tab-item-label">Discover</span>
      </button>

      {/* 3 — Center FAB (Coach) */}
      <div className="tab-center-wrapper">
        <button
          className={`tab-center-fab ${activeView === 'coach' ? 'tab-center-fab--active' : ''}`}
          onClick={() => navigateTo('coach')}
          aria-label="AI Coach"
        >
          {/* Stylised "AI" icon — two overlapping chat-like curves */}
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.06L2 22l4.94-1.38A9.96 9.96 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
            <path d="M8 12h.01M12 12h.01M16 12h.01"/>
          </svg>
        </button>
        <span className="tab-center-label">Coach</span>
      </div>

      {/* 4 — Job Leads */}
      <button
        className={`tab-item ${activeView === 'leads' ? 'active' : ''}`}
        onClick={() => navigateTo('leads')}
        aria-label="Job Leads"
      >
        <span className="tab-item-icon"><FileText size={20} /></span>
        <span className="tab-item-label">Job Leads</span>
      </button>

      {/* 5 — Profile (with settings popover) */}
      <div ref={menuRef} style={{ position: 'relative', flex: 1 }}>
        <button
          id="tab-profile-combo"
          onClick={() => setProfileMenuOpen(prev => !prev)}
          className={`tab-item ${isProfileGroupActive ? 'active' : ''}`}
          style={{ width: '100%' }}
          aria-label="Profile"
          aria-haspopup="true"
          aria-expanded={profileMenuOpen}
        >
          <span className="tab-item-icon"><User size={20} /></span>
          <span className="tab-item-label">Profile</span>
        </button>

        {/* Profile popover */}
        {profileMenuOpen && (
          <div
            role="menu"
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              right: '-4px',
              left: 'auto',
              width: '190px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              padding: '6px',
              zIndex: 300,
              animation: 'fade-in-up 0.18s ease forwards',
            }}
          >
            {/* Arrow pointer */}
            <div style={{
              position: 'absolute',
              bottom: '-6px',
              right: '34px',
              width: '12px',
              height: '12px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderTop: 'none',
              borderLeft: 'none',
              borderRadius: '0 0 4px 0',
              rotate: '45deg',
            }} />

            <button
              role="menuitem"
              onClick={() => navigateTo('profile')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '11px 14px',
                borderRadius: '10px',
                background: activeView === 'profile' ? 'var(--bg-tag)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                textAlign: 'left',
              }}
            >
              <Settings size={16} color="var(--text-secondary)" />
              Settings
            </button>

            <div style={{ height: '1px', background: 'var(--border-card)', margin: '2px 8px' }} />

            <button
              role="menuitem"
              onClick={() => { logout(); setProfileMenuOpen(false); }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '11px 14px',
                borderRadius: '10px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '13px',
                fontWeight: 600,
                color: '#dc2626',
                textAlign: 'left',
              }}
            >
              <LogOut size={16} color="#dc2626" />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default BottomTabBar;
