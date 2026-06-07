import React from 'react';
import { Sidebar } from './Sidebar';
import { BottomTabBar } from './BottomTabBar';
import { useApp } from '../../context/AppContext';
import { LogOut } from 'lucide-react';
import './layout.css';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { userProfile, resetProfile } = useApp();

  return (
    <div className="shell">
      {/* Sidebar - Desktop and Tablet */}
      <Sidebar />

      {/* Main content wrapper */}
      <div className="shell-main">
        {/* Topbar - Mobile only */}
        <header className="shell-topbar">
          <div className="shell-topbar-logo">
            <span className="sidebar-logo-icon">≠</span>
            <span>OpportunityOS</span>
          </div>
          {userProfile && (
            <button
              onClick={resetProfile}
              className="btn-ghost"
              style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626' }}
              title="Log out of the system"
            >
              <LogOut size={12} />
              <span>Log out</span>
            </button>
          )}
        </header>

        {/* Dynamic page content */}
        <main className="shell-content">
          {children}
        </main>

        {/* Bottom Tab Bar - Mobile only */}
        <BottomTabBar />
      </div>
    </div>
  );
};
export default AppShell;
