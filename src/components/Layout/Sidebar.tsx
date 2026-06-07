import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard, Compass, Bot, FileText, Settings, LogOut
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeView, setView, userProfile, logout } = useApp();

  const navItems = [
    { id: 'dashboard',     label: 'Dashboard',       icon: <LayoutDashboard size={18} /> },
    { id: 'discovery',     label: 'Discovery',        icon: <Compass size={18} /> },
    { id: 'coach',         label: 'AI Coach',         icon: <Bot size={18} /> },
    { id: 'leads',         label: 'Leads',            icon: <FileText size={18} /> },
    { id: 'profile',       label: 'Profile Settings', icon: <Settings size={18} /> },
  ] as const;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="sidebar-logo-icon">≠</span>
        <span className="sidebar-logo-text">OpportunityOS</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {userProfile && (
        <div className="sidebar-footer">
          <div className="sidebar-profile-chip" onClick={() => setView('profile')} style={{ cursor: 'pointer' }}>
            <div className="sidebar-profile-avatar">
              {userProfile.name.charAt(0).toUpperCase()}
            </div>
            <div className="sidebar-profile-info">
              <div className="sidebar-profile-name">{userProfile.name}</div>
              <div className="sidebar-profile-sub">{userProfile.academicLevel} · {userProfile.major}</div>
            </div>
          </div>
          <button
            onClick={logout}
            className="sidebar-nav-item"
            style={{ marginTop: '8px', padding: '10px 12px', fontSize: '13px', color: '#dc2626', fontWeight: 600 }}
            title="Sign Out"
          >
            <LogOut size={16} style={{ marginRight: '8px', color: '#dc2626', flexShrink: 0 }} />
            <span className="sidebar-nav-label">Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
};
export default Sidebar;
