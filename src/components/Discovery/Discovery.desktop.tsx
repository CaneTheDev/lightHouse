import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { Opportunity } from '../../context/AppContext';
import {
  Search, ArrowLeft, CheckSquare, Square, Clipboard, Check,
  ExternalLink, Terminal, ChevronDown, ChevronUp,
  UserCheck, Bookmark, BookmarkCheck, CheckCircle2, RefreshCw,
  Briefcase, GraduationCap, Award, Users, Handshake, Sparkles
} from 'lucide-react';
import './Discovery.css';

function getBadgeClass(type?: string) {
  switch (type) {
    case 'scholarship': return 'badge badge-scholarship';
    case 'internship':  return 'badge badge-internship';
    case 'fellowship':  return 'badge badge-fellowship';
    case 'community':   return 'badge badge-default';
    case 'networking':  return 'badge badge-default';
    default:            return 'badge badge-default';
  }
}


const CATEGORIES = {
  internship:  { icon: Briefcase,     label: 'Internships',    desc: 'Find hands-on work experience at top companies',     color: '#3b82f6' },
  scholarship: { icon: GraduationCap, label: 'Scholarships',   desc: 'Discover funding for your education',               color: '#8b5cf6' },
  fellowship:  { icon: Award,         label: 'Fellowships',    desc: 'Research and professional growth programs',         color: '#f59e0b' },
  community:   { icon: Users,         label: 'Community',      desc: 'Connect with like-minded peers and groups',         color: '#10b981' },
  networking:  { icon: Handshake,     label: 'Networking',     desc: 'Build professional relationships and mentorship',   color: '#ef4444' },
  saves:       { icon: Bookmark,      label: 'Saves',          desc: 'Your bookmarked opportunities for later',           color: '#6366f1' },
} as const;

export const DiscoveryDesktop: React.FC = () => {
  const {
    runAnalysis, analysisResults, userProfile,
    selectedOpportunity, selectOpportunity,
    saveLead, fetchLiveOpportunities, discoveryComment,
    activeCategory, setActiveCategory,
    liveResults, setLiveResults,
    savedOpportunities, saveOpportunity, removeOpportunity
  } = useApp();

  const [search, setSearch] = useState('');
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [networkTab, setNetworkTab] = useState<'mentors' | 'communities'>('mentors');
  const [detailTab, setDetailTab] = useState<'about' | 'strategy' | 'connect'>('about');
  const [checkedRoadmap, setCheckedRoadmap] = useState<Record<number, boolean>>({});
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [savedStates, setSavedStates] = useState<Record<string, boolean>>({});
  const [accordionOpen, setAccordionOpen] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  const oppId = selectedOpportunity?.id || '';
  const result = analysisResults[oppId];
  const isMatchView = !!(selectedOpportunity && result);

  useEffect(() => {
    if (result) {
      const t = setTimeout(() => setAnimatedScore(result.match_score), 200);
      return () => clearTimeout(t);
    } else {
      setAnimatedScore(0);
    }
  }, [result]);

  useEffect(() => {
    setCheckedRoadmap({});
    setAccordionOpen(false);
    setNetworkTab('mentors');
    setDetailTab('about');
  }, [oppId]);

  const handleAnalyze = async (opp: Opportunity, forceReanalyze = false) => {
    selectOpportunity(opp);
    if (!analysisResults[opp.id] || forceReanalyze) {
      await runAnalysis(opp);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: false })), 2000);
    } catch (err) { console.error(err); }
  };

  const handleCategoryClick = async (key: string) => {
    setActiveCategory(key);
    if (key === 'saves') return; // Local only
    if (!liveResults[key]) {
      setIsDiscovering(true);
      await performDiscovery(key);
    }
  };

  const performDiscovery = async (category: string, isAddingMore = false) => {
    if (!userProfile) return;
    setIsDiscovering(true);
    
    const existingUrls = isAddingMore 
      ? (liveResults[category] || []).map(o => {
          const match = o.requirements.match(/Source: (https?:\/\/[^\n]+)/);
          return match ? match[1] : '';
        }).filter(url => url !== '')
      : [];

    const results = await fetchLiveOpportunities(
      category, 
      userProfile.major || userProfile.interests[0] || 'Internship',
      existingUrls
    );

    setLiveResults(prev => ({ 
      ...prev, 
      [category]: isAddingMore ? [...(prev[category] || []), ...results] : results 
    }));
    setIsDiscovering(false);
  };

  const handleAddMore = async () => {
    if (activeCategory) {
      await performDiscovery(activeCategory, true);
    }
  };

  const handleReload = async () => {
    if (activeCategory) {
      await performDiscovery(activeCategory);
    }
  };

  const handleSaveJob = (job: Opportunity) => {
    if (savedOpportunities.some(o => o.id === job.id)) {
      removeOpportunity(job.id);
      return;
    }
    
    saveOpportunity(job);
    
    // Also save as lead for networking if it's not already there
    const leadDetails = {
      name: job.organization,
      source: 'web_search',
      profile_url: job.url || '', 
      snippet: job.requirements,
      suggested_message: `Interested in the ${job.title} role at ${job.organization}. \n\nDetails: ${job.requirements.split('\n\n')[0]}`
    };
    
    saveLead(leadDetails as any, job.title);
  };

  const handleSave = (contact: any, idx: number) => {
    if (savedStates[`s-${idx}`]) return;
    saveLead(contact, selectedOpportunity?.title || '');
    setSavedStates(prev => ({ ...prev, [`s-${idx}`]: true }));
  };

  const toggleRoadmap = (i: number) =>
    setCheckedRoadmap(prev => ({ ...prev, [i]: !prev[i] }));

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const probClass = result
    ? result.success_probability.toLowerCase() === 'high' ? 'prob-high'
    : result.success_probability.toLowerCase() === 'medium' ? 'prob-medium' : 'prob-low' : '';

  const scoreStrokeClass = result
    ? result.success_probability.toLowerCase() === 'high' ? 'score-ring-fill-hi'
    : result.success_probability.toLowerCase() === 'medium' ? 'score-ring-fill-mid' : 'score-ring-fill-low' : '';

  const currentOpps = activeCategory === 'saves' 
    ? savedOpportunities 
    : (activeCategory ? (liveResults[activeCategory] || []) : []);
  
  const filteredOpps = currentOpps.filter(o =>
    !search || o.title.toLowerCase().includes(search.toLowerCase()) ||
    o.organization.toLowerCase().includes(search.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────────────────
  // MATCH DETAIL VIEW
  // ─────────────────────────────────────────────────────────────────────────
  if (isMatchView) {
    const catLabel = activeCategory ? CATEGORIES[activeCategory as keyof typeof CATEGORIES]?.label : 'Discovery';
    return (
      <div className="page-body-match fade-in-up">
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <button
            id="discovery-back-btn"
            onClick={() => selectOpportunity(null)}
            className="btn-ghost"
            style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <ArrowLeft size={13} /> Back to {catLabel}
          </button>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {selectedOpportunity.organization} · {selectedOpportunity.title}
          </span>
        </div>

        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
              {selectedOpportunity.organization}
            </p>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
              {selectedOpportunity.title}
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selectedOpportunity.url && (
              <a href={selectedOpportunity.url} target="_blank" rel="noopener noreferrer" className="btn-primary"
                style={{ padding: '7px 16px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '100px', textDecoration: 'none', fontWeight: 600 }}>
                <ExternalLink size={13} /> Apply
              </a>
            )}
            <span className={`badge ${probClass}`} style={{ fontSize: '12.5px', padding: '6px 16px', borderRadius: '100px', fontWeight: 600 }}>
              {result.success_probability} Match
            </span>
            <button onClick={() => handleAnalyze(selectedOpportunity, true)} className="btn-ghost"
              style={{ padding: '7px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }} title="Re-run analysis">
              <RefreshCw size={13} /> Refresh
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: '12px', padding: '4px', marginBottom: '20px', flexShrink: 0, gap: '2px' }}>
          <button onClick={() => setDetailTab('about')} style={{
            flex: 1, padding: '9px 14px', borderRadius: '9px', border: 'none',
            background: detailTab === 'about' ? 'var(--bg-card)' : 'transparent',
            color: detailTab === 'about' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: '13px', fontWeight: 700,
            boxShadow: detailTab === 'about' ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
            cursor: 'pointer', transition: 'all 0.15s ease'
          }}>About</button>
          <button onClick={() => setDetailTab('strategy')} style={{
            flex: 1, padding: '9px 14px', borderRadius: '9px', border: 'none',
            background: detailTab === 'strategy' ? 'var(--bg-card)' : 'transparent',
            color: detailTab === 'strategy' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: '13px', fontWeight: 700,
            boxShadow: detailTab === 'strategy' ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
            cursor: 'pointer', transition: 'all 0.15s ease'
          }}>Match Strategy</button>
          <button onClick={() => setDetailTab('connect')} style={{
            flex: 1, padding: '9px 14px', borderRadius: '9px', border: 'none',
            background: detailTab === 'connect' ? 'var(--bg-card)' : 'transparent',
            color: detailTab === 'connect' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: '13px', fontWeight: 700,
            boxShadow: detailTab === 'connect' ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
            cursor: 'pointer', transition: 'all 0.15s ease'
          }}>Connect Network</button>
        </div>

        {/* ABOUT TAB */}
        {detailTab === 'about' && (() => {
          // Graceful fallback for legacy cached opportunities without separate fields
          const rawReqs = selectedOpportunity.requirements || '';
          const splitIdx = rawReqs.indexOf('\n\nAvailability:');
          const overview = selectedOpportunity.description
            || (splitIdx !== -1 ? rawReqs.slice(0, splitIdx).trim() : rawReqs.trim());
          const requirementsText = selectedOpportunity.availability
            || (splitIdx !== -1 ? rawReqs.slice(splitIdx + 2).trim() : '');

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Position Overview */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #3b82f615, #6366f115)',
                    border: '1px solid var(--border-card)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <Clipboard size={14} style={{ color: '#3b82f6' }} />
                  </div>
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Position Overview
                  </h3>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {overview || 'No description available for this opportunity.'}
                </p>
              </div>

              {/* Requirements */}
              {requirementsText && (
                <div className="card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <div style={{
                      width: '30px', height: '30px', borderRadius: '8px',
                      background: 'linear-gradient(135deg, #10b98115, #059e6a15)',
                      border: '1px solid var(--border-card)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                    </div>
                    <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Requirements & Availability
                    </h3>
                  </div>
                  <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {requirementsText}
                  </p>
                </div>
              )}

              {/* Quick Action */}
              <div className="card" style={{ padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                    {selectedOpportunity.organization}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`badge ${selectedOpportunity.type ? `badge-${selectedOpportunity.type}` : 'badge-default'}`}
                      style={{ fontSize: '11px', padding: '3px 10px' }}>
                      {selectedOpportunity.type || 'opportunity'}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>·</span>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {result.success_probability} match probability
                    </span>
                  </div>
                </div>
                {selectedOpportunity.url && (
                  <a href={selectedOpportunity.url} target="_blank" rel="noopener noreferrer"
                    className="btn-primary"
                    style={{ padding: '9px 20px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '10px', textDecoration: 'none', fontWeight: 600 }}>
                    <ExternalLink size={13} /> Apply Now
                  </a>
                )}
              </div>
            </div>
          );
        })()}

        {/* MATCH STRATEGY TAB */}
        {detailTab === 'strategy' && (
          <div className="discovery-split">
            {/* LEFT: Match Strategy */}
            <div className="discovery-split-left">
              <div className="card" style={{ padding: '24px' }}>
                <div className="score-row">
                  <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
                    <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
                      <circle cx="50" cy="50" r={radius} className="score-ring-track" fill="none" strokeWidth="8" />
                      <circle cx="50" cy="50" r={radius} className={`score-ring-fill ${scoreStrokeClass}`}
                        fill="none" strokeWidth="8" strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
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

              {result.reasoning_details && (
                <div className="card" style={{ padding: '20px 24px' }}>
                  <button id="reasoning-accordion-toggle" onClick={() => setAccordionOpen(o => !o)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      <Terminal size={14} /> View AI Pipeline Agent Reasoning
                    </span>
                    {accordionOpen ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
                  </button>
                  {accordionOpen && (
                    <div style={{ marginTop: '16px', padding: '14px', background: 'var(--bg-input)', borderRadius: '10px',
                      fontFamily: 'ui-monospace, monospace', fontSize: '11.5px', color: 'var(--text-secondary)',
                      maxHeight: '220px', overflowY: 'auto', lineHeight: 1.7, border: '1px solid var(--border-card)' }}>
                      {result.reasoning_details.eligibility && (
                        <div style={{ marginBottom: '12px' }}>
                          <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>// Branch A: Eligibility Analysis</p>
                          <p style={{ margin: 0, whiteSpace: 'pre-wrap', paddingLeft: '8px', borderLeft: '2px solid var(--border-input)' }}>
                            {typeof result.reasoning_details.eligibility === 'string' ? result.reasoning_details.eligibility : JSON.stringify(result.reasoning_details.eligibility, null, 2)}
                          </p>
                        </div>
                      )}
                      {result.reasoning_details.networking && (
                        <div>
                          <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>// Branch B: Context Agent & Web Search</p>
                          <p style={{ margin: 0, whiteSpace: 'pre-wrap', paddingLeft: '8px', borderLeft: '2px solid var(--border-input)' }}>
                            {typeof result.reasoning_details.networking === 'string' ? result.reasoning_details.networking : JSON.stringify(result.reasoning_details.networking, null, 2)}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT: Actionable Application Roadmap */}
            <div className="discovery-split-right">
              <div className="card" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: 0, marginBottom: '14px' }}>
                  Application Roadmap
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {result.application_tips.map((tip, i) => {
                    const checked = !!checkedRoadmap[i];
                    return (
                      <div key={i} id={`roadmap-item-${i}`} onClick={() => toggleRoadmap(i)}
                        className={`checklist-item ${checked ? 'done' : ''}`}>
                        <div style={{ flexShrink: 0, marginTop: '1px', color: checked ? '#22c55e' : 'var(--text-muted)' }}>
                          {checked ? <CheckSquare size={15} /> : <Square size={15} />}
                        </div>
                        <span style={{ fontSize: '13px', color: checked ? 'var(--text-muted)' : 'var(--text-primary)',
                          textDecoration: checked ? 'line-through' : 'none', lineHeight: 1.55 }}>
                          {tip}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CONNECT NETWORK TAB */}
        {detailTab === 'connect' && (
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flexShrink: 0 }}>
              <p style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '4px' }}>
                Connect Network
              </p>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 12px', letterSpacing: '-0.3px' }}>
                Networking Suite
              </h2>
              <div className="sub-tab-nav">
                <button className={`sub-tab-btn ${networkTab === 'mentors' ? 'active' : ''}`} onClick={() => setNetworkTab('mentors')}>Mentors</button>
                <button className={`sub-tab-btn ${networkTab === 'communities' ? 'active' : ''}`} onClick={() => setNetworkTab('communities')}>Communities</button>
              </div>
            </div>

            {networkTab === 'mentors' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', overflowY: 'auto', flex: 1, minHeight: 0, paddingTop: '16px' }}>
                {result.suggested_contacts.length > 0 ? result.suggested_contacts.map((contact, i) => {
                  const copyId = `contact-${i}`;
                  const isCopied = !!copiedStates[copyId];
                  const isSaved  = !!savedStates[`s-${i}`];
                  return (
                    <div key={i} className="contact-card">
                      <div className="contact-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="contact-avatar"><UserCheck size={16} /></div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{contact.name}</span>
                              {contact.source === 'github_api' ? (
                                <span style={{ fontSize: '10px', fontWeight: 600, background: 'var(--bg-tag)', border: '1px solid var(--border-card)', color: 'var(--text-secondary)', padding: '1px 6px', borderRadius: '4px' }}>GitHub</span>
                              ) : contact.source === 'mock' ? (
                                <span style={{ fontSize: '10px', fontWeight: 600, background: '#fef9c3', color: '#854d0e', padding: '1px 6px', borderRadius: '4px' }}>Sample</span>
                              ) : (
                                <span style={{ fontSize: '10px', fontWeight: 600, background: '#dbeafe', color: '#1e40af', padding: '1px 6px', borderRadius: '4px' }}>LinkedIn</span>
                              )}
                            </div>
                            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: 0, marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '170px' }}>
                              {contact.snippet}
                            </p>
                          </div>
                        </div>
                        <a href={contact.profile_url} target="_blank" rel="noopener noreferrer"
                          style={{ flexShrink: 0, padding: '6px', borderRadius: '8px', border: '1px solid var(--border-card)', color: 'var(--text-muted)', display: 'flex', background: 'var(--bg-card)' }}>
                          <ExternalLink size={13} />
                        </a>
                      </div>
                      <div className="contact-message-preview">{contact.suggested_message}</div>
                      <div className="contact-actions">
                        <button id={`copy-message-${i}`} onClick={() => handleCopy(contact.suggested_message, copyId)}
                          className={isCopied ? 'btn-ghost' : 'btn-primary'}
                          style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: '12px', gap: '6px' }}>
                          {isCopied ? <><Check size={12} /> Copied!</> : <><Clipboard size={12} /> Copy Message</>}
                        </button>
                        <button id={`save-draft-${i}`} onClick={() => handleSave(contact, i)} className="btn-ghost"
                          style={{ padding: '8px 12px', fontSize: '12px', gap: '5px', display: 'flex', alignItems: 'center' }}
                          title={isSaved ? 'Saved to Library' : 'Save to Library & Drafts'}>
                          {isSaved ? <BookmarkCheck size={13} color="#16a34a" /> : <Bookmark size={13} />}
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No networking contacts generated.
                  </div>
                )}
              </div>
            )}

            {networkTab === 'communities' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1, minHeight: 0, paddingTop: '16px' }}>
                {[
                  { name: 'Tech Career Africa', platform: 'Telegram', url: 'https://t.me/techcareerafrica', desc: 'Opportunities, referrals, and career tips for African tech professionals.' },
                  { name: `${selectedOpportunity.organization} Alumni Network`, platform: 'LinkedIn', url: `https://linkedin.com/company/${selectedOpportunity.organization.toLowerCase().replace(/\s/g,'-')}`, desc: 'Connect with former program participants and get insider tips.' },
                  { name: 'Scholarship Hunters Africa', platform: 'Telegram', url: 'https://t.me/scholarshiphuntersafrica', desc: 'Active community sharing scholarship deadlines and application tips.' },
                ].map((group, i) => (
                  <div key={i} style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border-card)', background: 'var(--bg-input)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{group.name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{group.desc}</p>
                    </div>
                    <a href={group.url} target="_blank" rel="noopener noreferrer" className="btn-primary"
                      style={{ padding: '7px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', borderRadius: '10px', textDecoration: 'none' }}>
                      <ExternalLink size={12} /> {group.platform}
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CATEGORY SUB-PAGE (filtered opportunities)
  // ─────────────────────────────────────────────────────────────────────────
  if (activeCategory) {
    const cat = CATEGORIES[activeCategory as keyof typeof CATEGORIES];
    const CatIcon = cat.icon;
    return (
      <div className="page-body fade-in-up">
        <div style={{ marginBottom: '24px' }}>
          <button onClick={() => { setActiveCategory(null); setSearch(''); }} className="btn-ghost"
            style={{ padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
            <ArrowLeft size={13} /> Back to All Categories
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${cat.color}15`,
              border: `1px solid ${cat.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CatIcon size={22} color={cat.color} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 className="hero-heading" style={{ marginBottom: '2px', fontSize: '28px' }}>{cat.label}</h1>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                {activeCategory === 'saves' 
                  ? `${filteredOpps.length} bookmarked opportunities`
                  : (isDiscovering ? 'AI is fetching live opportunities...' : `${filteredOpps.length} live results found`)}
                {!isDiscovering && activeCategory !== 'saves' && userProfile?.location && <> in <strong>{userProfile.location}</strong></>}
              </p>
            </div>
            {activeCategory !== 'saves' && (
              <button onClick={handleReload} disabled={isDiscovering} className="btn-ghost"
                style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <RefreshCw size={14} className={isDiscovering ? 'spin' : ''} /> {isDiscovering ? 'Searching...' : 'Reload'}
              </button>
            )}
          </div>
        </div>

        {discoveryComment && (
          <div className="fade-in-up" style={{ 
            marginBottom: '20px', 
            padding: '16px 20px', 
            background: 'var(--bg-tag)', 
            border: '1px solid var(--border-card)', 
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px'
          }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '8px', 
              background: 'var(--bg-btn-dark)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flexShrink: 0,
              marginTop: '2px'
            }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px' }}>AI Insights</p>
              <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{discoveryComment}</p>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '24px' }}>
          <div className="discovery-search-bar">
            <Search size={15} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input className="discovery-search-input" placeholder={`Search ${cat.label.toLowerCase()}…`}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeCategory !== 'saves' && isDiscovering && filteredOpps.length === 0 ? (
            <>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="skeleton-card">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div className="skeleton-line" style={{ width: '30%', marginBottom: '8px' }}></div>
                        <div className="skeleton-line-lg" style={{ width: '60%' }}></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '12px' }}>
                      <div className="skeleton-line" style={{ width: '100%' }}></div>
                      <div className="skeleton-line" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div className="skeleton-badge"></div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div className="skeleton-btn" style={{ width: '70px', height: '32px', borderRadius: '8px' }}></div>
                      <div className="skeleton-btn" style={{ width: '70px', height: '32px', borderRadius: '8px' }}></div>
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  🔍 AI is searching the live web for {cat.label.toLowerCase()} in {userProfile?.location}...
                </p>
              </div>
            </>
          ) : filteredOpps.map(opp => {
            const isAnalyzed = !!analysisResults[opp.id];
            const analysis = analysisResults[opp.id];
            const isSaved = savedOpportunities.some(o => o.id === opp.id);
            return (
              <div key={opp.id} className="card fade-in-up" style={{
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '20px'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', margin: 0 }}>
                      {opp.organization}
                    </p>
                    <span className={getBadgeClass(opp.type)} style={{ fontSize: '10px', padding: '1px 8px' }}>{opp.type || 'opportunity'}</span>
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', lineHeight: 1.3 }}>
                    {opp.title}
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {opp.requirements}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {opp.url && (
                    <a href={opp.url} target="_blank" rel="noopener noreferrer" className="btn-ghost"
                      style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', borderRadius: '10px', opacity: 0.7 }}>
                      <ExternalLink size={12} /> Apply
                    </a>
                  )}
                  
                  <button 
                    onClick={() => handleSaveJob(opp)} 
                    className="btn-ghost"
                    style={{ padding: '8px 14px', fontSize: '12.5px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-card)', color: isSaved ? '#6366f1' : 'inherit' }}
                  >
                    {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                    {isSaved ? 'Saved' : 'Save'}
                  </button>

                  {isAnalyzed ? (
                    <>
                      <button onClick={() => selectOpportunity(opp)} className="btn-primary"
                        style={{ padding: '8px 14px', fontSize: '12.5px', borderRadius: '10px' }}>View Results</button>
                      <button onClick={() => handleAnalyze(opp, true)} className="btn-ghost"
                        style={{ padding: '8px 10px', fontSize: '12px', borderRadius: '10px' }} title="Re-run analysis">↺</button>
                    </>
                  ) : (
                    <button onClick={() => handleAnalyze(opp)} className="btn-primary"
                      style={{ padding: '8px 16px', fontSize: '12.5px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      title="Analyze Fit">
                      <Sparkles size={14} /> Analyze
                    </button>
                  )}
                  {isAnalyzed && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 600, color: '#16a34a', background: '#dcfce7', padding: '4px 8px', borderRadius: '100px', whiteSpace: 'nowrap' }}>
                      <CheckCircle2 size={10} /> {analysis.match_score}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          {!isDiscovering && filteredOpps.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
              {search ? 'No opportunities match your search.' : `No ${cat.label.toLowerCase()} available yet. Check back soon!`}
            </div>
          )}
        </div>

        {!isDiscovering && activeCategory === 'saves' && filteredOpps.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            You haven't bookmarked any opportunities yet.
          </div>
        )}

        {activeCategory !== 'saves' && filteredOpps.length > 0 && (
          <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            {isDiscovering && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                <div className="loader-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                AI is searching for more unique opportunities...
              </div>
            )}
            <button 
              onClick={handleAddMore} 
              disabled={isDiscovering} 
              className="btn-ghost"
              style={{ padding: '12px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 600, border: '1px solid var(--border-card)' }}
            >
              {isDiscovering ? 'Searching...' : 'Show More Opportunities'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CATEGORY LANDING
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="page-body">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="hero-heading" style={{ marginBottom: '6px' }}>
            Discover <span className="faded">Opportunities</span>
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Choose a category to explore opportunities tailored to your profile.
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        {Object.entries(CATEGORIES).map(([key, cat]) => {
          const CatIcon = cat.icon;
          const liveCount = key === 'saves' ? savedOpportunities.length : liveResults[key]?.length;
          return (
            <div key={key} onClick={() => handleCategoryClick(key)} className="card fade-in-up"
              style={{ padding: '28px 24px', cursor: 'pointer', display: 'flex', flexDirection: 'column',
                alignItems: 'flex-start', gap: '12px', transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                minHeight: '160px' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${cat.color}15`,
                border: `1px solid ${cat.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CatIcon size={20} color={cat.color} />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px' }}>
                  {cat.label}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                  {cat.desc}
                </p>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginTop: 'auto' }}>
                {key === 'saves' ? `${liveCount} items saved` : (liveCount !== undefined ? `${liveCount} live results` : 'Click to discover')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default DiscoveryDesktop;
