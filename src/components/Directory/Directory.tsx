import type React from 'react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { Opportunity } from '../../context/AppContext';
import { LogOut, CheckCircle2 } from 'lucide-react';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  internship: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="26" cy="26" r="20" stroke="#d1d1d1" strokeWidth="1.5" fill="none" />
      <circle cx="26" cy="26" r="12" stroke="#d1d1d1" strokeWidth="1.5" fill="none" />
      <circle cx="26" cy="26" r="4" stroke="#d1d1d1" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  scholarship: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="26" r="10" stroke="#d1d1d1" strokeWidth="1.5" fill="none" />
      <circle cx="34" cy="18" r="10" stroke="#d1d1d1" strokeWidth="1.5" fill="none" />
      <circle cx="34" cy="34" r="10" stroke="#d1d1d1" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  fellowship: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="26" cy="26" rx="22" ry="7" stroke="#d1d1d1" strokeWidth="1.5" fill="none" />
      <ellipse cx="26" cy="26" rx="22" ry="14" stroke="#d1d1d1" strokeWidth="1.5" fill="none" />
      <ellipse cx="26" cy="26" rx="22" ry="20" stroke="#d1d1d1" strokeWidth="1.5" fill="none" />
    </svg>
  ),
  default: (
    <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 26 L26 10 L42 26 L26 42 Z" stroke="#d1d1d1" strokeWidth="1.5" fill="none" />
      <path d="M16 26 L26 16 L36 26 L26 36 Z" stroke="#d1d1d1" strokeWidth="1.5" fill="none" />
    </svg>
  )
};

function getBadgeClass(type?: string) {
  switch (type) {
    case 'scholarship': return 'badge badge-scholarship';
    case 'internship': return 'badge badge-internship';
    case 'fellowship': return 'badge badge-fellowship';
    default: return 'badge badge-default';
  }
}

export const Directory: React.FC = () => {
  const { userProfile, opportunities, runAnalysis, analysisResults, setView, selectOpportunity, resetProfile } = useApp();
  const [filter, setFilter] = useState<'all' | 'internship' | 'scholarship' | 'fellowship'>('all');
  const [activeTab, setActiveTab] = useState<'Opportunities' | 'Saved' | 'Analyzed'>('Opportunities');

  const filteredOpportunities = opportunities.filter(opp => {
    if (filter === 'all') return true;
    return opp.type === filter;
  });

  const handleAction = async (opp: Opportunity, forceReanalyze = false) => {
    selectOpportunity(opp);
    if (analysisResults[opp.id] && !forceReanalyze) {
      setView('dashboard');
    } else {
      await runAnalysis(opp);
    }
  };

  return (
    <div className="page-body">

        {/* Hero row */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
          <h1 className="hero-heading">
            Find <span className="faded">Apply</span> <span className="faded">Grow</span>
          </h1>
          <div className="tab-nav">
            {(['Opportunities', 'Saved', 'Analyzed'] as const).map(tab => (
              <button
                key={tab}
                id={`tab-${tab.toLowerCase()}`}
                className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(['all', 'internship', 'scholarship', 'fellowship'] as const).map(type => (
              <button
                key={type}
                id={`filter-${type}`}
                onClick={() => setFilter(type)}
                className={`filter-pill ${filter === type ? 'active' : ''}`}
              >
                {type === 'all' ? 'All' : `${type.charAt(0).toUpperCase() + type.slice(1)}s`}
              </button>
            ))}
          </div>
          <span style={{ fontSize: '12.5px', color: 'var(--text-muted)', fontWeight: 500 }}>
            {filteredOpportunities.length} opportunities
          </span>
        </div>

        {/* Opportunity grid */}
        <div className="opp-grid">
          {filteredOpportunities.map(opp => {
            const isAnalyzed = !!analysisResults[opp.id];
            const analysis = analysisResults[opp.id];
            const icon = TYPE_ICONS[opp.type || 'default'] ?? TYPE_ICONS.default;

            return (
              <div key={opp.id} className="card fade-in-up" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '200px' }}>
                {/* Top: title + org */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <p style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                        {opp.organization}
                      </p>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                        {opp.title}
                      </h3>
                    </div>
                    {isAnalyzed && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 600, color: '#16a34a', background: '#dcfce7', padding: '3px 8px', borderRadius: '100px', whiteSpace: 'nowrap' }}>
                        <CheckCircle2 size={10} /> {analysis.match_score}%
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.55, marginTop: '8px', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {opp.requirements}
                  </p>
                </div>

                {/* Bottom: icon + badge + action button */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {icon}
                    <span className={getBadgeClass(opp.type)}>{opp.type || 'opportunity'}</span>
                  </div>

                  {isAnalyzed ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        id={`view-analysis-${opp.id}`}
                        onClick={() => handleAction(opp, false)}
                        className="btn-primary"
                        style={{ padding: '8px 14px', fontSize: '12.5px' }}
                      >
                        View Results
                      </button>
                      <button
                        id={`reanalyze-${opp.id}`}
                        onClick={() => handleAction(opp, true)}
                        className="btn-ghost"
                        style={{ padding: '8px 10px', fontSize: '12px' }}
                        title="Re-run analysis"
                      >
                        ↺
                      </button>
                    </div>
                  ) : (
                    <button
                      id={`analyze-${opp.id}`}
                      onClick={() => handleAction(opp, false)}
                      className="btn-add"
                      title="Analyze Fit"
                      aria-label={`Analyze fit for ${opp.title}`}
                    >+</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
    </div>
  );
};
