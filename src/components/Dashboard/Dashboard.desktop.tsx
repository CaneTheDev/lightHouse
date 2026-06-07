import React from 'react';
import { useApp } from '../../context/AppContext';
import type { Opportunity } from '../../context/AppContext';
import { 
  GraduationCap, MapPin, Zap, MessageSquare, Compass, FileText
} from 'lucide-react';
import './Dashboard.css';

export const DashboardDesktop: React.FC = () => {
  const { 
    analysisResults, opportunities, userProfile, setView, 
    selectOpportunity, runAnalysis, savedLeads
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
    <div className="page-body">
      {/* Welcoming Header */}
      <div className="fade-in-up" style={{ marginBottom: '40px' }}>
        <p style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-secondary)', margin: '0 0 4px 0' }}>
          Welcome back,
        </p>
        <h1 style={{ fontSize: '48px', fontWeight: 850, color: 'var(--text-primary)', margin: 0, letterSpacing: '-1.8px', lineHeight: 1 }}>
          {userProfile?.name}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '12px', maxWidth: '600px' }}>
          Your AI-powered career journey is in full swing. You've evaluated {analyzedOpps.length} opportunities with an average fit of {avgMatchScore}%.
        </p>
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid">
        
        {/* Left Column: Stats & Profile Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Main Activity / Stats Card */}
          <div className="card" style={{ padding: '0', overflow: 'hidden', border: 'none', background: 'var(--bg-btn-dark)' }}>
            <div style={{ padding: '24px', color: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0, opacity: 0.9 }}>Career Readiness</h3>
                  <p style={{ fontSize: '12px', opacity: 0.7, margin: '4px 0 0' }}>Based on your recent evaluations</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px 12px', borderRadius: '8px', fontSize: '20px', fontWeight: 700 }}>
                  {avgMatchScore}%
                </div>
              </div>
              
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginBottom: '24px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${avgMatchScore}%`, background: '#fff', borderRadius: '4px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <p style={{ fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', margin: 0 }}>Evaluations</p>
                  <p style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0 0' }}>{analyzedOpps.length}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', margin: 0 }}>Saved Drafts</p>
                  <p style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0 0' }}>{savedLeads.length}</p>
                </div>
                <div>
                  <p style={{ fontSize: '11px', opacity: 0.6, textTransform: 'uppercase', margin: 0 }}>Opportunities</p>
                  <p style={{ fontSize: '20px', fontWeight: 700, margin: '4px 0 0' }}>{opportunities.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={16} /> Academic Profile
              </h3>
              <button onClick={() => setView('profile')} className="btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }}>Edit Profile</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Major / Course</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{userProfile?.major}</p>
                <span className="badge badge-default" style={{ alignSelf: 'flex-start', fontSize: '10px', marginTop: '4px' }}>{userProfile?.academicLevel}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Location</p>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{userProfile?.location}</p>
              </div>
            </div>

            <div className="divider" style={{ margin: '20px 0' }} />
            
            <div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, margin: '0 0 10px' }}>Top Skills</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {userProfile?.skills.slice(0, 6).map(skill => (
                  <span key={skill} className="badge badge-default" style={{ fontSize: '11px', padding: '5px 12px', borderRadius: '8px' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Coach Quick Start */}
          <div className="card" style={{ padding: '24px', background: 'var(--bg-tag)', border: '1px solid var(--border-card)' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-btn-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MessageSquare size={20} color="#fff" />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                  Ask your Career Coach
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                  Get instant advice on your resume, interview prep, or networking strategies.
                </p>
                <button
                  onClick={() => setView('coach')}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', background: 'var(--bg-btn-dark)' }}
                >
                  Start Chatting →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Evaluations and Recommendations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Recent Evaluations */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: 0, marginBottom: '16px' }}>
              Recent Evaluations
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {analyzedOpps.length > 0 ? (
                analyzedOpps.map(({ opp, result }) => {
                  const scoreClass = result.match_score >= 80 ? 'prob-high' : result.match_score >= 60 ? 'prob-medium' : 'prob-low';
                  return (
                    <div 
                      key={opp.id} 
                      style={{ 
                        padding: '12px 14px', 
                        borderRadius: '10px', 
                        border: '1px solid var(--border-card)', 
                        background: 'var(--bg-input)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{opp.title}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{opp.organization}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className={`badge ${scoreClass}`} style={{ fontSize: '11.5px', padding: '3px 8px', borderRadius: '4px' }}>
                          {result.match_score}%
                        </span>
                        <button
                          onClick={() => {
                            selectOpportunity(opp);
                            setView('discovery');
                          }}
                          className="btn-ghost"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No programs evaluated yet. Go to <span style={{ color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' }} onClick={() => setView('discovery')}>Discover</span> to find and analyze opportunities!
                </div>
              )}
            </div>
          </div>

          {/* Quick Recommendations */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Compass size={16} /> Suggested Programs
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recommendedOpps.map(opp => (
                <div 
                  key={opp.id} 
                  style={{ 
                    padding: '12px 14px', 
                    borderRadius: '10px', 
                    border: '1px solid var(--border-card)', 
                    background: 'var(--bg-input)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{opp.title}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{opp.organization}</p>
                    </div>
                    <span className="badge badge-default" style={{ fontSize: '10px', padding: '2px 6px', textTransform: 'capitalize' }}>
                      {opp.type}
                    </span>
                  </div>
                  <button
                    onClick={async () => {
                      selectOpportunity(opp);
                      await runAnalysis(opp);
                    }}
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '11.5px', justifyContent: 'center' }}
                  >
                    Analyze Program Fit
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
export default DashboardDesktop;
