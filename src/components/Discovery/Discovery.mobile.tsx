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
  internship:  { icon: Briefcase,     label: 'Internships',  desc: 'Hands-on work experience',     color: '#3b82f6' },
  scholarship: { icon: GraduationCap, label: 'Scholarships', desc: 'Education funding',             color: '#8b5cf6' },
  fellowship:  { icon: Award,         label: 'Fellowships',  desc: 'Research & growth programs',   color: '#f59e0b' },
  community:   { icon: Users,         label: 'Community',    desc: 'Peers and groups',             color: '#10b981' },
  networking:  { icon: Handshake,     label: 'Networking',   desc: 'Professional relationships',   color: '#ef4444' },
  saves:       { icon: Bookmark,      label: 'Saves',        desc: 'Bookmarked for later',         color: '#6366f1' },
} as const;

export const DiscoveryMobile: React.FC = () => {
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
  const [detailTab, setDetailTab] = useState<'strategy' | 'connect'>('strategy');
  const [networkTab, setNetworkTab] = useState<'mentors' | 'communities'>('mentors');
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
    setDetailTab('strategy');
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
    
    // Also save as lead for networking
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

  const radius = 40;
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
  // MATCH DETAIL (Mobile)
  // ─────────────────────────────────────────────────────────────────────────
  if (isMatchView) {
    const catLabel = activeCategory ? CATEGORIES[activeCategory as keyof typeof CATEGORIES]?.label : 'Discovery';
    return (
      <div className="page-body-discovery-mobile fade-in-up" style={{ padding: '16px 12px' }}>
        <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button id="discovery-mobile-back-btn" onClick={() => selectOpportunity(null)} className="btn-ghost"
            style={{ padding: '6px 10px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ArrowLeft size={13} /> Back
          </button>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
            {catLabel} · {selectedOpportunity.organization}
          </span>
        </div>

        <div className="card" style={{ padding: '16px', marginBottom: '16px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>
            {selectedOpportunity.organization}
          </p>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px 0', lineHeight: 1.3 }}>
            {selectedOpportunity.title}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className={`badge ${probClass}`} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '100px', fontWeight: 600 }}>
                {result.success_probability} Match
              </span>
              {selectedOpportunity.url && (
                <a href={selectedOpportunity.url} target="_blank" rel="noopener noreferrer" className="btn-primary"
                  style={{ padding: '4px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', borderRadius: '100px', textDecoration: 'none', fontWeight: 600 }}>
                  <ExternalLink size="11" /> Apply
                </a>
              )}
              <button 
                onClick={() => handleSaveJob(selectedOpportunity)} 
                className="btn-ghost"
                style={{ padding: '5px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: savedOpportunities.some(o => o.id === selectedOpportunity.id) ? '#6366f1' : 'inherit' }}
              >
                {savedOpportunities.some(o => o.id === selectedOpportunity.id) ? <BookmarkCheck size={11} /> : <Bookmark size={11} />}
                {savedOpportunities.some(o => o.id === selectedOpportunity.id) ? 'Saved' : 'Save'}
              </button>
            </div>
            <button onClick={() => handleAnalyze(selectedOpportunity, true)} className="btn-ghost"
              style={{ padding: '5px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <RefreshCw size={11} /> Refresh
            </button>
          </div>
        </div>

        {/* Mobile Tab bar */}
        <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: '12px', padding: '4px', marginBottom: '16px' }}>
          <button onClick={() => setDetailTab('strategy')} style={{
            flex: 1, padding: '10px', borderRadius: '9px', border: 'none',
            background: detailTab === 'strategy' ? 'var(--bg-card)' : 'transparent',
            color: detailTab === 'strategy' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: '13px', fontWeight: 700,
            boxShadow: detailTab === 'strategy' ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
            cursor: 'pointer', transition: 'all 0.15s ease'
          }}>Match Strategy</button>
          <button onClick={() => setDetailTab('connect')} style={{
            flex: 1, padding: '10px', borderRadius: '9px', border: 'none',
            background: detailTab === 'connect' ? 'var(--bg-card)' : 'transparent',
            color: detailTab === 'connect' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: '13px', fontWeight: 700,
            boxShadow: detailTab === 'connect' ? '0 1px 4px rgba(0,0,0,0.05)' : 'none',
            cursor: 'pointer', transition: 'all 0.15s ease'
          }}>Connect Network</button>
        </div>

        {detailTab === 'strategy' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                  <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx="40" cy="40" r={radius} className="score-ring-track" fill="none" strokeWidth="6" />
                    <circle cx="40" cy="40" r={radius} className={`score-ring-fill ${scoreStrokeClass}`}
                      fill="none" strokeWidth="6" strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1 }}>{animatedScore}%</span>
                    <span style={{ fontSize: '8px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fit</span>
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0' }}>
                    Eligibility Reasoning
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {result.eligibility_reasoning}
                  </p>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: 0, marginBottom: '12px' }}>
                Application Roadmap
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {result.application_tips.map((tip, i) => {
                  const checked = !!checkedRoadmap[i];
                  return (
                    <div key={i} onClick={() => toggleRoadmap(i)}
                      className={`checklist-item ${checked ? 'done' : ''}`}
                      style={{ padding: '10px', borderRadius: '10px' }}>
                      <div style={{ flexShrink: 0, marginTop: '2px', color: checked ? '#22c55e' : 'var(--text-muted)' }}>
                        {checked ? <CheckSquare size={14} /> : <Square size={14} />}
                      </div>
                      <span style={{ fontSize: '12.5px', color: checked ? 'var(--text-muted)' : 'var(--text-primary)',
                        textDecoration: checked ? 'line-through' : 'none', lineHeight: 1.45 }}>
                        {tip}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {result.reasoning_details && (
              <div className="card" style={{ padding: '14px 16px' }}>
                <button onClick={() => setAccordionOpen(o => !o)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    <Terminal size={13} /> AI Agent Reasoning
                  </span>
                  {accordionOpen ? <ChevronUp size={13} color="var(--text-muted)" /> : <ChevronDown size={13} color="var(--text-muted)" />}
                </button>
                {accordionOpen && (
                  <div style={{ marginTop: '12px', padding: '10px', background: 'var(--bg-input)', borderRadius: '8px',
                    fontFamily: 'ui-monospace, monospace', fontSize: '10.5px', color: 'var(--text-secondary)',
                    maxHeight: '180px', overflowY: 'auto', lineHeight: 1.6, border: '1px solid var(--border-card)' }}>
                    {result.reasoning_details.eligibility && (
                      <div style={{ marginBottom: '10px' }}>
                        <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px' }}>// Branch A: Eligibility Analysis</p>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap', paddingLeft: '6px', borderLeft: '2px solid var(--border-input)' }}>
                          {typeof result.reasoning_details.eligibility === 'string' ? result.reasoning_details.eligibility : JSON.stringify(result.reasoning_details.eligibility, null, 2)}
                        </p>
                      </div>
                    )}
                    {result.reasoning_details.networking && (
                      <div>
                        <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 3px' }}>// Branch B: Web Search & Profiles</p>
                        <p style={{ margin: 0, whiteSpace: 'pre-wrap', paddingLeft: '6px', borderLeft: '2px solid var(--border-input)' }}>
                          {typeof result.reasoning_details.networking === 'string' ? result.reasoning_details.networking : JSON.stringify(result.reasoning_details.networking, null, 2)}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {detailTab === 'connect' && (
          <div className="card" style={{ padding: '16px' }}>
            <div style={{ marginBottom: '14px' }}>
              <div className="sub-tab-nav" style={{ padding: '3px' }}>
                <button className={`sub-tab-btn ${networkTab === 'mentors' ? 'active' : ''}`}
                  onClick={() => setNetworkTab('mentors')} style={{ padding: '6px 8px', fontSize: '12px' }}>Mentors</button>
                <button className={`sub-tab-btn ${networkTab === 'communities' ? 'active' : ''}`}
                  onClick={() => setNetworkTab('communities')} style={{ padding: '6px 8px', fontSize: '12px' }}>Communities</button>
              </div>
            </div>

            {networkTab === 'mentors' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {result.suggested_contacts.length > 0 ? result.suggested_contacts.map((contact, i) => {
                  const copyId = `contact-${i}`;
                  const isCopied = !!copiedStates[copyId];
                  const isSaved  = !!savedStates[`s-${i}`];
                  return (
                    <div key={i} className="contact-card" style={{ padding: '12px', borderRadius: '12px' }}>
                      <div className="contact-card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <div className="contact-avatar" style={{ width: '32px', height: '32px', borderRadius: '8px' }}><UserCheck size={14} /></div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>{contact.name}</span>
                              {contact.source === 'github_api' ? (
                                <span style={{ fontSize: '8.5px', fontWeight: 600, background: 'var(--bg-tag)', border: '1px solid var(--border-card)', color: 'var(--text-secondary)', padding: '0px 4px', borderRadius: '3px' }}>GitHub</span>
                              ) : contact.source === 'mock' ? (
                                <span style={{ fontSize: '8.5px', fontWeight: 600, background: '#fef9c3', color: '#854d0e', padding: '0px 4px', borderRadius: '3px' }}>Sample</span>
                              ) : (
                                <span style={{ fontSize: '8.5px', fontWeight: 600, background: '#dbeafe', color: '#1e40af', padding: '0px 4px', borderRadius: '3px' }}>LinkedIn</span>
                              )}
                            </div>
                            <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
                              {contact.snippet}
                            </p>
                          </div>
                        </div>
                        <a href={contact.profile_url} target="_blank" rel="noopener noreferrer"
                          style={{ flexShrink: 0, padding: '5px', borderRadius: '6px', border: '1px solid var(--border-card)', color: 'var(--text-muted)', display: 'flex', background: 'var(--bg-card)' }}>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                      <div className="contact-message-preview" style={{ fontSize: '11px', padding: '8px 10px', borderRadius: '8px' }}>
                        {contact.suggested_message}
                      </div>
                      <div className="contact-actions" style={{ gap: '4px' }}>
                        <button onClick={() => handleCopy(contact.suggested_message, copyId)}
                          className={isCopied ? 'btn-ghost' : 'btn-primary'}
                          style={{ flex: 1, justifyContent: 'center', padding: '6px', fontSize: '11.5px', gap: '4px', borderRadius: '8px' }}>
                          {isCopied ? <><Check size={11} /> Copied!</> : <><Clipboard size={11} /> Copy</>}
                        </button>
                        <button onClick={() => handleSave(contact, i)} className="btn-ghost"
                          style={{ padding: '6px 10px', fontSize: '11.5px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
                          title="Save outreach draft">
                          {isSaved ? <BookmarkCheck size={12} color="#16a34a" /> : <Bookmark size={12} />}
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No suggested contacts.
                  </div>
                )}
              </div>
            )}

            {networkTab === 'communities' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { name: 'Tech Career Africa', platform: 'TG', url: 'https://t.me/techcareerafrica', desc: 'Referrals & career tips.' },
                  { name: `${selectedOpportunity.organization} Alumni`, platform: 'LN', url: `https://linkedin.com/company/${selectedOpportunity.organization.toLowerCase().replace(/\s/g,'-')}`, desc: 'Connect with former participants.' },
                  { name: 'Scholarship Hunters', platform: 'TG', url: 'https://t.me/scholarshiphuntersafrica', desc: 'Deadlines & application tips.' },
                ].map((group, i) => (
                  <div key={i} style={{ padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-card)', background: 'var(--bg-input)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</p>
                      <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.desc}</p>
                    </div>
                    <a href={group.url} target="_blank" rel="noopener noreferrer" className="btn-primary"
                      style={{ padding: '5px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', borderRadius: '8px', textDecoration: 'none' }}>
                      <ExternalLink size={10} /> {group.platform}
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
  // CATEGORY SUB-PAGE (Mobile)
  // ─────────────────────────────────────────────────────────────────────────
  if (activeCategory) {
    const cat = CATEGORIES[activeCategory as keyof typeof CATEGORIES];
    const CatIcon = cat.icon;
    return (
      <div className="page-body-discovery-mobile fade-in-up">
        <div style={{ marginBottom: '14px' }}>
          <button onClick={() => { setActiveCategory(null); setSearch(''); }} className="btn-ghost"
            style={{ padding: '6px 10px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '12px' }}>
            <ArrowLeft size={13} /> All Categories
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${cat.color}15`,
              border: `1px solid ${cat.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CatIcon size={20} color={cat.color} />
            </div>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>{cat.label}</h1>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                {activeCategory === 'saves' 
                  ? `${filteredOpps.length} bookmarked items`
                  : (isDiscovering ? 'AI searching...' : `${filteredOpps.length} results`)}
                {!isDiscovering && activeCategory !== 'saves' && userProfile?.location && <> in <strong>{userProfile.location}</strong></>}
              </p>
            </div>
            {activeCategory !== 'saves' && (
              <button onClick={handleReload} disabled={isDiscovering} className="btn-ghost"
                style={{ padding: '6px', borderRadius: '8px' }}>
                <RefreshCw size={14} className={isDiscovering ? 'spin' : ''} />
              </button>
            )}
          </div>
        </div>

        {discoveryComment && (
          <div className="fade-in-up" style={{ 
            marginBottom: '16px', 
            padding: '12px 14px', 
            background: 'var(--bg-tag)', 
            border: '1px solid var(--border-card)', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <div style={{ 
              width: '28px', 
              height: '28px', 
              borderRadius: '8px', 
              background: 'var(--bg-btn-dark)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flexShrink: 0,
              marginTop: '2px'
            }}>
              <Sparkles size={14} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px' }}>AI Insights</p>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>{discoveryComment}</p>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '16px' }}>
          <div className="discovery-search-bar" style={{ padding: '8px 12px', borderRadius: '12px' }}>
            <Search size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
            <input className="discovery-search-input" style={{ fontSize: '13px' }}
              placeholder={`Search ${cat.label.toLowerCase()}…`}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activeCategory !== 'saves' && isDiscovering && filteredOpps.length === 0 ? (
            <>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="skeleton-card-mobile">
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                      <div style={{ flex: 1 }}>
                        <div className="skeleton-line" style={{ width: '45%', marginBottom: '6px' }}></div>
                        <div className="skeleton-line-lg" style={{ width: '80%' }}></div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px' }}>
                      <div className="skeleton-line" style={{ width: '100%' }}></div>
                      <div className="skeleton-line" style={{ width: '88%' }}></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="skeleton-btn" style={{ width: '28px', height: '28px', borderRadius: '6px' }}></div>
                      <div className="skeleton-badge" style={{ width: '70px', height: '18px' }}></div>
                    </div>
                    <div className="skeleton-line" style={{ width: '80px', height: '30px', borderRadius: '8px' }}></div>
                  </div>
                </div>
              ))}
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  🔍 AI is searching the live web for {cat.label.toLowerCase()} in {userProfile?.location}...
                </p>
              </div>
            </>
          ) : filteredOpps.map(opp => {
            const isAnalyzed = !!analysisResults[opp.id];
            const analysis = analysisResults[opp.id];
            const isSaved = savedOpportunities.some(o => o.id === opp.id);
            return (
              <div key={opp.id} className="card fade-in-up" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opp.organization}
                    </p>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                      {opp.title}
                    </h3>
                  </div>
                  <span className={getBadgeClass(opp.type)} style={{ fontSize: '9px', padding: '3px 8px', flexShrink: 0, borderRadius: '6px' }}>{opp.type || 'opportunity'}</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {opp.requirements}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {isAnalyzed ? (
                      <button onClick={() => selectOpportunity(opp)} className="btn-primary"
                        style={{ flex: 1.5, padding: '10px', fontSize: '13px', borderRadius: '10px', background: 'var(--bg-btn-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <CheckCircle2 size={14} /> View Results
                      </button>
                    ) : (
                      <button onClick={() => handleAnalyze(opp)} className="btn-primary"
                        style={{ flex: 1.5, padding: '10px', fontSize: '13px', borderRadius: '10px', background: 'var(--bg-btn-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <Sparkles size={14} /> Analyze
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleSaveJob(opp)} 
                      className="btn-ghost"
                      style={{ flex: 1, padding: '10px', fontSize: '13px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1px solid var(--border-card)', color: isSaved ? '#6366f1' : 'inherit' }}
                    >
                      {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                      {isSaved ? 'Saved' : 'Save'}
                    </button>
                  </div>

                  {opp.url && (
                    <a href={opp.url} target="_blank" rel="noopener noreferrer" className="btn-ghost"
                      style={{ width: '100%', padding: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', textDecoration: 'none', borderRadius: '8px', opacity: 0.8 }}>
                      <ExternalLink size={12} /> Apply on Platform
                    </a>
                  )}
                </div>
                {isAnalyzed && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <CheckCircle2 size={14} /> Match Found
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#16a34a' }}>{analysis.match_score}%</span>
                  </div>
                )}
              </div>
            );
          })}
          {!isDiscovering && activeCategory === 'saves' && filteredOpps.length === 0 && (
            <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
              You haven't bookmarked any items yet.
            </div>
          )}

          {activeCategory !== 'saves' && filteredOpps.length === 0 && !isDiscovering && (
            <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)', fontSize: '12px' }}>
              {search ? 'No matches found.' : `No ${cat.label.toLowerCase()} available yet.`}
            </div>
          )}
        </div>

        {activeCategory !== 'saves' && filteredOpps.length > 0 && (
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', paddingBottom: '20px' }}>
            {isDiscovering && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                <div className="loader-spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                AI searching for more...
              </div>
            )}
            <button 
              onClick={handleAddMore} 
              disabled={isDiscovering} 
              className="btn-ghost"
              style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '13px', fontWeight: 600, border: '1px solid var(--border-card)' }}
            >
              {isDiscovering ? 'Searching...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CATEGORY LANDING (Mobile)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="page-body-discovery-mobile fade-in-up">
      <div style={{ marginBottom: '18px' }}>
        <h1 className="hero-heading" style={{ fontSize: '24px', marginBottom: '4px' }}>
          Discover Opportunities
        </h1>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
          Choose a category to explore.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Object.entries(CATEGORIES).map(([key, cat]) => {
          const CatIcon = cat.icon;
          const liveCount = key === 'saves' ? savedOpportunities.length : liveResults[key]?.length;
          return (
            <div key={key} onClick={() => handleCategoryClick(key)} className="card fade-in-up"
              style={{ padding: '20px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '14px',
                transition: 'transform 0.15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${cat.color}15`,
                border: `1px solid ${cat.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CatIcon size={20} color={cat.color} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px' }}>{cat.label}</h3>
                <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0 }}>{cat.desc}</p>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                {key === 'saves' ? `${liveCount}` : (liveCount !== undefined ? liveCount : '→')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default DiscoveryMobile;
