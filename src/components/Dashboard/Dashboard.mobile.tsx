import React from 'react';
import { useApp } from '../../context/AppContext';
import type { Opportunity } from '../../context/AppContext';
import { 
  GraduationCap, MapPin, MessageSquare
} from 'lucide-react';
import './Dashboard.mobile.css';

export const DashboardMobile: React.FC = () => {
  const { 
    analysisResults, opportunities, userProfile, setView, 
    selectOpportunity, runAnalysis, savedLeads, setActiveCategory
  } = useApp();

  // Hub Data Calculations
  const analyzedOpps = Object.keys(analysisResults).map(id => {
    const opp = opportunities.find(o => o.id === id);
    const result = analysisResults[id];
    return { opp, result };
  }).filter(item => item.opp !== undefined) as { opp: Opportunity, result: any }[];

  const avgMatchScore = analyzedOpps.length > 0
    ? Math.round(analyzedOpps.reduce((sum, item) => sum + item.result.match_score, 0) / analyzedOpps.length)
    : 0;

  const recommendedOpps = opportunities
    .filter(opp => !analysisResults[opp.id])
    .sort(() => 0.5 - Math.random()) // Randomize suggestions
    .slice(0, 3);

  return (
    <div className="page-body-mobile">
      {/* Welcoming Header */}
      <div className="fade-in-up" style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', margin: '0 0 2px 0' }}>
          Welcome back,
        </p>
        <h1 style={{ fontSize: '32px', fontWeight: 850, color: 'var(--text-primary)', margin: 0, letterSpacing: '-1.2px', lineHeight: 1.1 }}>
          {userProfile?.name}
        </h1>
      </div>

      {/* Profile summary card */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Career Readiness Card (Integrated Stats) */}
        <div className="card-mobile" style={{ padding: '0', overflow: 'hidden', border: 'none', background: 'var(--bg-btn-dark)' }}>
          <div style={{ padding: '16px', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, opacity: 0.9 }}>Career Readiness</h3>
                <p style={{ fontSize: '10px', opacity: 0.7, margin: '2px 0 0' }}>Based on recent activity</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 10px', borderRadius: '6px', fontSize: '16px', fontWeight: 700 }}>
                {avgMatchScore}%
              </div>
            </div>
            
            <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginBottom: '16px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${avgMatchScore}%`, background: '#fff', borderRadius: '3px' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div>
                <p style={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase', margin: 0 }}>Evaluations</p>
                <p style={{ fontSize: '16px', fontWeight: 700, margin: '2px 0 0' }}>{analyzedOpps.length}</p>
              </div>
              <div>
                <p style={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase', margin: 0 }}>Saved</p>
                <p style={{ fontSize: '16px', fontWeight: 700, margin: '2px 0 0' }}>{savedLeads.length}</p>
              </div>
              <div>
                <p style={{ fontSize: '9px', opacity: 0.6, textTransform: 'uppercase', margin: 0 }}>Programs</p>
                <p style={{ fontSize: '16px', fontWeight: 700, margin: '2px 0 0' }}>{opportunities.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card-mobile" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Academic Profile
            </h3>
            <button onClick={() => setView('profile')} className="btn-ghost" style={{ fontSize: '10px', padding: '2px 6px' }}>Edit</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={14} color="var(--text-muted)" />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}><strong>{userProfile?.major}</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={14} color="var(--text-muted)" />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}><strong>{userProfile?.location}</strong></span>
            </div>
          </div>
          <div className="divider" style={{ margin: '14px 0 10px' }} />
          <div>
            <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 8px' }}>Skills</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {userProfile?.skills.slice(0, 5).map(skill => (
                <span key={skill} className="badge badge-default" style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '6px' }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Career Coach Advisor call */}
        <div className="card-mobile" style={{ padding: '16px', background: 'var(--bg-tag)', border: '1px solid var(--border-card)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-btn-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <MessageSquare size={16} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>
                AI Career Coach
              </h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
                Get expert advice on your resume and interview prep.
              </p>
              <button
                onClick={() => setView('coach')}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: '12px', padding: '8px', borderRadius: '6px', background: 'var(--bg-btn-dark)' }}
              >
                Start Chatting
              </button>
            </div>
          </div>
        </div>

        {/* Recent Evaluations */}
        <div className="card-mobile" style={{ padding: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: 0, marginBottom: '12px' }}>
            Recent Evaluations
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {analyzedOpps.length > 0 ? (
              analyzedOpps.map(({ opp, result }) => {
                const scoreClass = result.match_score >= 80 ? 'prob-high' : result.match_score >= 60 ? 'prob-medium' : 'prob-low';
                return (
                  <div 
                    key={opp.id} 
                    style={{ 
                      padding: '10px 12px', 
                      borderRadius: '8px', 
                      border: '1px solid var(--border-card)', 
                      background: 'var(--bg-input)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px'
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opp.title}</p>
                      <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: 0 }}>{opp.organization}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`badge ${scoreClass}`} style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px' }}>
                        {result.match_score}%
                      </span>
                      <button
                        onClick={() => {
                          selectOpportunity(opp);
                          if (opp.type) setActiveCategory(opp.type);
                          setView('discovery');
                        }}
                        className="btn-ghost"
                        style={{ padding: '5px 8px', fontSize: '11.5px', borderRadius: '6px' }}
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                No evaluations yet. Go to <span style={{ color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setView('discovery')}>Discover</span> to get started!
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        <div className="card-mobile" style={{ padding: '16px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: 0, marginBottom: '12px' }}>
            Suggested Programs
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recommendedOpps.map(opp => (
              <div 
                key={opp.id} 
                style={{ 
                  padding: '10px 12px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-card)', 
                  background: 'var(--bg-input)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opp.title}</p>
                    <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: 0 }}>{opp.organization}</p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    selectOpportunity(opp);
                    if (opp.type) setActiveCategory(opp.type);
                    await runAnalysis(opp);
                  }}
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '11px', justifyContent: 'center', borderRadius: '6px' }}
                >
                  Analyze Program Fit
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
export default DashboardMobile;
