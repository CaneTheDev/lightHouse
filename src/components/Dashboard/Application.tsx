import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { Opportunity } from '../../context/AppContext';
import { 
  ClipboardList, CheckCircle2, XCircle, Clock, 
  ChevronRight, Calendar, ArrowRight, Award
} from 'lucide-react';

type ApplicationStatus = 'Interested' | 'Applying' | 'Submitted' | 'Interview' | 'Accepted' | 'Rejected';

const STATUS_CONFIGS: Record<ApplicationStatus, { label: string, color: string, bg: string, icon: React.ReactNode }> = {
  Interested: { label: 'Interested', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', icon: <Clock size={13} color="#6366f1" /> },
  Applying: { label: 'In Progress', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: <Clock size={13} color="#f59e0b" /> },
  Submitted: { label: 'Submitted', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: <Clock size={13} color="#3b82f6" /> },
  Interview: { label: 'Interviewing', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', icon: <Clock size={13} color="#a855f7" /> },
  Accepted: { label: 'Accepted', color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: <CheckCircle2 size={13} color="#10b981" /> },
  Rejected: { label: 'Closed', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <XCircle size={13} color="#ef4444" /> }
};

export const Application: React.FC = () => {
  const { opportunities, analysisResults, setView, selectOpportunity } = useApp();
  
  // Track status of each opportunity
  const [statuses, setStatuses] = useState<Record<string, ApplicationStatus>>(() => {
    const saved = localStorage.getItem('opportunity_os_application_tracker');
    if (saved) return JSON.parse(saved);
    
    // Default: seed statuses for analyzed programs
    const initial: Record<string, ApplicationStatus> = {};
    Object.keys(analysisResults).forEach((id, idx) => {
      initial[id] = idx === 0 ? 'Submitted' : 'Interested';
    });
    return initial;
  });

  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('opportunity_os_application_notes');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('opportunity_os_application_tracker', JSON.stringify(statuses));
  }, [statuses]);

  useEffect(() => {
    localStorage.setItem('opportunity_os_application_notes', JSON.stringify(notes));
  }, [notes]);

  const handleStatusChange = (oppId: string, newStatus: ApplicationStatus) => {
    setStatuses(prev => ({ ...prev, [oppId]: newStatus }));
  };

  const handleNotesChange = (oppId: string, text: string) => {
    setNotes(prev => ({ ...prev, [oppId]: text }));
  };

  // Get list of opportunities that have been evaluated/analyzed
  const trackedOpps = opportunities.filter(opp => analysisResults[opp.id]);

  return (
    <div className="page-body">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="hero-heading" style={{ fontSize: '28px', marginBottom: '6px' }}>
          Application Pipeline
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
          Track program application stages, deadlines, and specific checklist statuses.
        </p>
      </div>

      {trackedOpps.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {trackedOpps.map(opp => {
            const currentStatus = statuses[opp.id] || 'Interested';
            const config = STATUS_CONFIGS[currentStatus];
            const result = analysisResults[opp.id];

            return (
              <div 
                key={opp.id} 
                className="card" 
                style={{ 
                  padding: '20px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px',
                  transition: 'border-color 0.2s ease'
                }}
              >
                {/* Top Row: Title, Org, and Current Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {opp.organization}
                    </span>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '2px 0 0' }}>
                      {opp.title}
                    </h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Status Dropdown */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
                      <select
                        value={currentStatus}
                        onChange={e => handleStatusChange(opp.id, e.target.value as ApplicationStatus)}
                        style={{
                          background: 'var(--bg-input)',
                          border: '1px solid var(--border-card)',
                          borderRadius: '8px',
                          padding: '6px 28px 6px 12px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          color: config.color,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          outline: 'none'
                        }}
                      >
                        <option value="Interested">Interested</option>
                        <option value="Applying">In Progress</option>
                        <option value="Submitted">Submitted</option>
                        <option value="Interview">Interviewing</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Closed</option>
                      </select>
                    </div>

                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#16a34a', background: '#dcfce7', padding: '4px 10px', borderRadius: '100px' }}>
                      Fit: {result?.match_score}%
                    </span>
                  </div>
                </div>

                {/* Grid fields: deadline date note + custom note input */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="sidebar-profile-avatar" style={{ width: '28px', height: '28px', background: 'var(--bg-tag)', color: 'var(--text-primary)' }}>
                      <Calendar size={13} />
                    </div>
                    <div>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0 }}>Target Deadline</p>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>September 30, 2026</p>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Add specific application notes (e.g., 'Refining interview questions', 'Waitlisted')"
                    value={notes[opp.id] || ''}
                    onChange={e => handleNotesChange(opp.id, e.target.value)}
                    className="input-clean"
                    style={{ fontSize: '12.5px', padding: '8px 12px' }}
                  />
                </div>

                <div className="divider" style={{ margin: '4px 0' }} />

                {/* Action CTA */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    onClick={() => {
                      selectOpportunity(opp);
                      setView('match-strategy');
                    }}
                    className="btn-ghost"
                    style={{ padding: '8px 14px', fontSize: '12.5px' }}
                  >
                    Match Strategy
                  </button>
                  <button
                    onClick={() => {
                      selectOpportunity(opp);
                      setView('coach');
                    }}
                    className="btn-primary"
                    style={{ padding: '8px 14px', fontSize: '12.5px' }}
                  >
                    Consult Coach <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: '40px 24px', textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
          <ClipboardList size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
            No Active Applications
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
            You haven't run eligibility evaluations on any opportunities yet. Explore the Discovery catalog to evaluate programs.
          </p>
          <button onClick={() => setView('discovery')} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Browse Discovery Feed
          </button>
        </div>
      )}
    </div>
  );
};
export default Application;
