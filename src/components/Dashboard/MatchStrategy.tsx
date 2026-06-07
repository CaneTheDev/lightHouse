import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowLeft, CheckSquare, Square, Clipboard, Check, 
  Terminal, ChevronDown, ChevronUp, AlertCircle, Compass 
} from 'lucide-react';
import './Dashboard.css';

export const MatchStrategy: React.FC = () => {
  const { selectedOpportunity, analysisResults, setView, selectOpportunity } = useApp();
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [checkedRoadmap, setCheckedRoadmap] = useState<Record<number, boolean>>({});
  const [animatedScore, setAnimatedScore] = useState(0);

  const oppId = selectedOpportunity?.id || '';
  const result = analysisResults[oppId];

  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => setAnimatedScore(result.match_score), 200);
      return () => clearTimeout(timer);
    } else {
      setAnimatedScore(0);
    }
  }, [result, selectedOpportunity]);

  const toggleRoadmapItem = (index: number) => {
    setCheckedRoadmap(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // Score gauge metrics
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const probClass = result
    ? result.success_probability.toLowerCase() === 'high' ? 'prob-high'
      : result.success_probability.toLowerCase() === 'medium' ? 'prob-medium'
      : 'prob-low'
    : '';

  const scoreStrokeClass = result
    ? result.success_probability.toLowerCase() === 'high' ? 'score-ring-fill-hi'
      : result.success_probability.toLowerCase() === 'medium' ? 'score-ring-fill-mid'
      : 'score-ring-fill-low'
    : '';

  // Scenario 1: No opportunity selected
  if (!selectedOpportunity) {
    return (
      <div className="page-body">
        <div className="card" style={{ padding: '40px 24px', textAlign: 'center', maxWidth: '500px', margin: '60px auto' }}>
          <AlertCircle size={40} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
            No Opportunity Selected
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
            Please select an opportunity from the Discovery feed first to run the eligibility engines and generate your match strategy.
          </p>
          <button onClick={() => setView('discovery')} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <Compass size={16} /> Open Discovery Feed
          </button>
        </div>
      </div>
    );
  }

  // Scenario 2: Opportunity selected but not evaluated
  if (!result) {
    return (
      <div className="page-body">
        <div className="card" style={{ padding: '40px 24px', textAlign: 'center', maxWidth: '500px', margin: '60px auto' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {selectedOpportunity.organization}
          </span>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '6px 0 12px' }}>
            {selectedOpportunity.title}
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
            You haven't run the eligibility analysis for this program yet. Run the multi-agent reasoning models to generate your fit score.
          </p>
          <button onClick={() => setView('discovery')} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Go back and Analyze Fit
          </button>
        </div>
      </div>
    );
  }

  // Scenario 3: Opportunity analyzed successfully
  return (
    <div className="page-body">
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setView('discovery')} className="btn-ghost" style={{ padding: '8px' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              Match Strategy / {selectedOpportunity.organization}
            </p>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
              {selectedOpportunity.title}
            </h1>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => setView('leads')} 
            className="btn-ghost" 
            style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }}
          >
            <Settings size={14} /> Plan Afresh
          </button>
          <span className={`badge ${probClass}`} style={{ fontSize: '12px', padding: '5px 14px', borderRadius: '100px', fontWeight: 600 }}>
            {result.success_probability} Match
          </span>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left/Main Column - Score and tips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Fit score Card */}
          <div className="card" style={{ padding: '24px' }}>
            <div className="score-row">
              {/* Circular SVG Gauge */}
              <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
                <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="50" cy="50" r={radius} className="score-ring-track" fill="none" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r={radius}
                    className={`score-ring-fill ${scoreStrokeClass}`}
                    fill="none" strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{animatedScore}%</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fit</span>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 0, marginBottom: '6px' }}>
                  Eligibility Reasoning
                </h3>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {result.eligibility_reasoning}
                </p>
              </div>
            </div>
          </div>

          {/* Actionable Roadmap tips */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: 0, marginBottom: '14px' }}>
              Actionable Application Checklist
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {result.application_tips.map((tip, index) => {
                const isChecked = !!checkedRoadmap[index];
                return (
                  <div
                    key={index}
                    onClick={() => toggleRoadmapItem(index)}
                    className={`checklist-item ${isChecked ? 'done' : ''}`}
                    style={{ padding: '12px 14px' }}
                  >
                    <div style={{ flexShrink: 0, marginTop: '2px', color: isChecked ? '#22c55e' : 'var(--text-muted)' }}>
                      {isChecked ? <CheckSquare size={16} /> : <Square size={16} />}
                    </div>
                    <span style={{
                      fontSize: '13px', color: isChecked ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: isChecked ? 'line-through' : 'none', lineHeight: 1.5
                    }}>
                      {tip}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column - Deep AI Pipeline Logs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {result.reasoning_details && (
            <div className="card" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: 0, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal size={14} /> AI Agent Chain Reasoning
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {result.reasoning_details.eligibility && (
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 6px' }}>
                      // Eligibility Agent Trace
                    </p>
                    <div style={{
                      padding: '12px', background: 'var(--bg-input)', borderRadius: '8px',
                      fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: 'var(--text-secondary)',
                      maxHeight: '180px', overflowY: 'auto', lineHeight: 1.6, border: '1px solid var(--border-card)',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {typeof result.reasoning_details.eligibility === 'string'
                        ? result.reasoning_details.eligibility
                        : JSON.stringify(result.reasoning_details.eligibility, null, 2)}
                    </div>
                  </div>
                )}

                {result.reasoning_details.networking && (
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '0 0 6px' }}>
                      // Context Search Trace
                    </p>
                    <div style={{
                      padding: '12px', background: 'var(--bg-input)', borderRadius: '8px',
                      fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: 'var(--text-secondary)',
                      maxHeight: '180px', overflowY: 'auto', lineHeight: 1.6, border: '1px solid var(--border-card)',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {typeof result.reasoning_details.networking === 'string'
                        ? result.reasoning_details.networking
                        : JSON.stringify(result.reasoning_details.networking, null, 2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default MatchStrategy;
