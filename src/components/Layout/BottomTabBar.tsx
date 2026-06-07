import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import type { ActiveView } from '../../context/AppContext';
import { LayoutDashboard, Compass, Bot, User, FileText, Settings, LogOut } from 'lucide-react';

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

  // Is the Profile group active (either leads or profile settings is shown)
  const isProfileGroupActive = activeView === 'leads' || activeView === 'profile';

  const mainTabs = [
    { id: 'dashboard' as ActiveView, label: 'Home',    icon: <LayoutDashboard size={20} /> },
    { id: 'discovery' as ActiveView, label: 'Discover', icon: <Compass size={20} /> },
    { id: 'coach'     as ActiveView, label: 'Coach',   icon: <Bot size={20} /> },
  ];

  return (
    <nav className="bottom-tab-bar">
      {/* First 3 standard tabs */}
      {mainTabs.map((tab) => {
        const isActive = activeView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => { navigateTo(tab.id); setProfileMenuOpen(false); }}
            className={`tab-item ${isActive ? 'active' : ''}`}
          >
            <span className="tab-item-icon">{tab.icon}</span>
            <span className="tab-item-label">{tab.label}</span>
          </button>
        );
      })}

      {/* 4th tab: Profile combo button */}
      <div ref={menuRef} style={{ position: 'relative', flex: 1 }}>
        <button
          id="tab-profile-combo"
          onClick={() => setProfileMenuOpen(prev => !prev)}
          className={`tab-item ${isProfileGroupActive ? 'active' : ''}`}
          style={{ width: '100%' }}
        >
          <span className="tab-item-icon"><User size={20} /></span>
          <span className="tab-item-label">Profile</span>
        </button>

        {/* Popover */}
        {profileMenuOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              right: '-4px',
              left: 'auto',
              transform: 'none',
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
              left: 'auto',
              transform: 'none',
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
              onClick={() => navigateTo('leads')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '11px 14px',
                borderRadius: '10px',
                background: activeView === 'leads' ? 'var(--bg-tag)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                textAlign: 'left',
              }}
            >
              <FileText size={16} color="var(--text-secondary)" />
              Leads
            </button>

            <div style={{ height: '1px', background: 'var(--border-card)', margin: '2px 8px' }} />

            <button
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
