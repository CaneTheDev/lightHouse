import type React from 'react';
import { useApp } from '../../context/AppContext';
import { Compass, ShieldAlert, Users } from 'lucide-react';

export const Loader: React.FC = () => {
  const { loadingStatus, selectedOpportunity } = useApp();

  const isHunterActive = loadingStatus.toLowerCase().includes('initializing') || loadingStatus.toLowerCase().includes('scanning');
  const isEligibilityActive = loadingStatus.toLowerCase().includes('eligibility') || loadingStatus.toLowerCase().includes('fit');
  const isNetworkingActive =
    loadingStatus.toLowerCase().includes('searching') ||
    loadingStatus.toLowerCase().includes('linkedin') ||
    loadingStatus.toLowerCase().includes('synthesizing') ||
    loadingStatus.toLowerCase().includes('mentor');

  const agents = [
    { label: 'Hunter', icon: <Compass size={22} />, active: isHunterActive },
    { label: 'Match Agent', icon: <ShieldAlert size={22} />, active: isEligibilityActive },
    { label: 'Networking', icon: <Users size={22} />, active: isNetworkingActive },
  ];

  const progressWidth = isNetworkingActive ? '100%' : isEligibilityActive ? '50%' : '16%';

  return (
    <div className="page-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="fade-in-up" style={{ width: '100%', maxWidth: '440px', textAlign: 'center', margin: '0 auto' }}>

          {/* Target info */}
          {selectedOpportunity && (
            <div style={{ marginBottom: '48px' }}>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                Analyzing target
              </p>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.5px' }}>
                {selectedOpportunity.title}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
                {selectedOpportunity.organization}
              </p>
            </div>
          )}

          {/* Agent pipeline */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '320px', margin: '0 auto 40px' }}>
            {/* Track */}
            <div style={{
              position: 'absolute', top: '50%', left: '0', right: '0',
              height: '2px', background: 'var(--border-card)', transform: 'translateY(-50%)',
              borderRadius: '1px'
            }} />
            {/* Progress */}
            <div style={{
              position: 'absolute', top: '50%', left: '0',
              height: '2px', background: 'var(--text-primary)', transform: 'translateY(-50%)',
              borderRadius: '1px', width: progressWidth, transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)'
            }} />

            {agents.map((agent) => (
              <div key={agent.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', position: 'relative' }}>
                <div className={`agent-node ${agent.active ? 'active' : ''}`}>
                  {agent.icon}
                </div>
                <span style={{
                  fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px',
                  color: agent.active ? 'var(--text-primary)' : 'var(--text-muted)',
                  transition: 'color 0.3s ease'
                }}>
                  {agent.label}
                </span>
                {agent.active && (
                  <span style={{
                    position: 'absolute', top: '-4px', right: '-4px',
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: 'var(--text-primary)',
                    animation: 'pulse-ring 1.5s ease-in-out infinite'
                  }} />
                )}
              </div>
            ))}
          </div>

          {/* Status text */}
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
              {loadingStatus}
            </p>
            <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '320px', margin: '0 auto' }}>
              Executing parallel AI chains to analyze match scores and locate relevant professionals.
            </p>
          </div>

          {/* Dot loader */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span className="dot-bounce" />
            <span className="dot-bounce" />
            <span className="dot-bounce" />
          </div>
        </div>

      <style>{`
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.6); opacity: 0.4; }
        }
      `}</style>
    </div>
  );
};
