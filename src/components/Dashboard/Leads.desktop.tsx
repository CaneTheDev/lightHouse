import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { Opportunity } from '../../context/AppContext';
import { 
  Clipboard, Check, Plus, Trash2, 
  BookOpen, Sparkles, AlertCircle, Briefcase, Search, ArrowRight, RefreshCcw,
  ExternalLink, Bookmark, BookmarkCheck
} from 'lucide-react';

interface CustomLead {
  id: string;
  title: string;
  content: string;
}

export const LeadsDesktop: React.FC = () => {
  const { 
    savedLeads, removeLead, saveLead,
    runAnalysis, selectOpportunity, analysisResults
  } = useApp();
  
  // States for the new job discovery flow
  const [step, setStep] = useState<'initial' | 'form' | 'results'>('initial');
  const [leadProfile, setLeadProfile] = useState({
    name: '',
    major: '',
    academicLevel: 'University',
    skills: '',
    interests: '',
    location: ''
  });
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [foundJobs, setFoundJobs] = useState<Opportunity[]>([]);
  const [excludeUrls, setExcludeUrls] = useState<string[]>([]);

  // Existing states refactored
  const [activeSubTab, setActiveSubTab] = useState<'discovery' | 'saved' | 'templates'>('discovery');
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [savedStates, setSavedStates] = useState<Record<string, boolean>>({});
  
  const [customLeads, setCustomLeads] = useState<CustomLead[]>(() => {
    const saved = localStorage.getItem('opportunity_os_library_custom_drafts'); // keeping key for migration
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    localStorage.setItem('opportunity_os_library_custom_drafts', JSON.stringify(customLeads));
  }, [customLeads]);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: false })), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleAddLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    const newLead: CustomLead = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      content: newContent.trim()
    };
    setCustomLeads([...customLeads, newLead]);
    setNewTitle('');
    setNewContent('');
    setIsAdding(false);
  };

  const handleDeleteLead = (id: string) => {
    setCustomLeads(customLeads.filter(d => d.id !== id));
  };

  const handleSaveJob = (job: Opportunity) => {
    if (savedStates[job.id]) return;
    
    // Construct a contact-like object for saveLead using job details
    const leadDetails = {
      name: job.organization,
      source: 'web_search',
      profile_url: job.url || '', 
      snippet: job.requirements,
      suggested_message: `Interested in the ${job.title} role at ${job.organization}. \n\nDetails: ${job.requirements.split('\n\n')[0]}`
    };
    
    saveLead(leadDetails as any, job.title);
    setSavedStates(prev => ({ ...prev, [job.id]: true }));
  };

  const handleAnalyze = async (job: Opportunity) => {
    selectOpportunity(job);
    if (!analysisResults[job.id]) {
      await runAnalysis(job);
    }
  };

  const handleFindJobs = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setExcludeUrls([]); // Reset exclusions for new search
    
    try {
      const payload = {
        category: 'internship',
        user_interest: leadProfile.interests,
        academic_level: leadProfile.academicLevel,
        location: leadProfile.location,
        exclude_urls: []
      };

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/discover/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Discovery failed');
      const data = await response.json();
      
      const mapped: Opportunity[] = data.opportunities.map((opp: any, idx: number) => ({
        id: `lead-job-${Date.now()}-${idx}`,
        title: opp.title,
        organization: opp.organization,
        requirements: `${opp.description}\n\nAvailability: ${opp.availability}`,
        type: 'job',
        url: opp.url
      }));

      setFoundJobs(mapped);
      setExcludeUrls(mapped.map(j => j.url || '').filter(u => u !== ''));
      setStep('results');
    } catch (err) {
      console.error('Discovery Error:', err);
      setFoundJobs([
        {
          id: 'mock-1',
          title: `Graduate ${leadProfile.interests} Role`,
          organization: 'Global Tech Corp',
          requirements: `Seeking a ${leadProfile.academicLevel} student with skills in ${leadProfile.skills}.`,
          type: 'job',
          url: 'https://example.com/1'
        },
        {
          id: 'mock-2',
          title: `Junior ${leadProfile.interests} position`,
          organization: 'Innovation Labs',
          requirements: `Great opportunity for someone located in ${leadProfile.location}.`,
          type: 'job',
          url: 'https://example.com/2'
        }
      ]);
      setStep('results');
    } finally {
      setIsSearching(false);
    }
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const payload = {
        category: 'internship',
        user_interest: leadProfile.interests,
        academic_level: leadProfile.academicLevel,
        location: leadProfile.location,
        exclude_urls: excludeUrls
      };

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/discover/live`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Load more failed');
      const data = await response.json();
      
      const mapped: Opportunity[] = data.opportunities.map((opp: any, idx: number) => ({
        id: `lead-job-more-${Date.now()}-${idx}`,
        title: opp.title,
        organization: opp.organization,
        requirements: `${opp.description}\n\nAvailability: ${opp.availability}`,
        type: 'job',
        url: opp.url
      }));

      if (mapped.length > 0) {
        setFoundJobs(prev => [...prev, ...mapped]);
        setExcludeUrls(prev => [...prev, ...mapped.map(j => j.url || '').filter(u => u !== '')]);
      } else {
        // No more results found
        alert("No more unique jobs found for this criteria.");
      }
    } catch (err) {
      console.error('Load More Error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="page-body" style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <div style={{ 
        marginBottom: '24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '12px' 
      }}>
        <div>
          <h1 className="hero-heading" style={{ fontSize: '28px', marginBottom: '6px', letterSpacing: '-0.5px' }}>
            Leads
          </h1>
          <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
            Find appropriate jobs based on your qualifications and manage your outreach.
          </p>
        </div>
        {step !== 'initial' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setStep('initial')}
              className="btn-ghost"
              style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCcw size={14} /> Start Afresh
            </button>
          </div>
        )}
      </div>

      {/* Sub-tab Navigation */}
      <div style={{ 
        display: 'flex', 
        background: 'var(--bg-input)', 
        borderRadius: '12px', 
        padding: '4px', 
        marginBottom: '24px',
        maxWidth: '600px'
      }}>
        <button
          onClick={() => setActiveSubTab('discovery')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '9px',
            border: 'none',
            background: activeSubTab === 'discovery' ? 'var(--bg-card)' : 'transparent',
            color: activeSubTab === 'discovery' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Briefcase size={14} /> Job Discovery
        </button>
        <button
          onClick={() => setActiveSubTab('saved')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '9px',
            border: 'none',
            background: activeSubTab === 'saved' ? 'var(--bg-card)' : 'transparent',
            color: activeSubTab === 'saved' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <Sparkles size={14} /> Saved Leads ({savedLeads.length})
        </button>
        <button
          onClick={() => setActiveSubTab('templates')}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '9px',
            border: 'none',
            background: activeSubTab === 'templates' ? 'var(--bg-card)' : 'transparent',
            color: activeSubTab === 'templates' ? 'var(--text-primary)' : 'var(--text-muted)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <BookOpen size={14} /> Templates
        </button>
      </div>

      {activeSubTab === 'discovery' && (
        <div className="fade-in">
          {step === 'initial' && (
            <div className="card" style={{ padding: '60px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <Sparkles size={64} color="var(--primary)" style={{ marginBottom: '10px' }} />
              <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Find Your Perfect Job</h2>
              <p style={{ maxWidth: '500px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Let our agents analyze your qualifications and find appropriate jobs tailored just for you. Get started by filling out your profile.
              </p>
              <button 
                onClick={() => setStep('form')}
                className="btn-primary" 
                style={{ padding: '14px 32px', fontSize: '16px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}
              >
                Get Started <ArrowRight size={20} />
              </button>
            </div>
          )}

          {step === 'form' && (
            <div className="card fade-in-up" style={{ padding: '32px', maxWidth: '700px', margin: '0 auto' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>What are you looking for?</h2>
              <form onSubmit={handleFindJobs} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Full Name</label>
                    <input
                      type="text"
                      required
                      className="input-clean"
                      placeholder="e.g. Jane Doe"
                      value={leadProfile.name}
                      onChange={e => setLeadProfile({...leadProfile, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Academic Major</label>
                    <input
                      type="text"
                      required
                      className="input-clean"
                      placeholder="e.g. Computer Science"
                      value={leadProfile.major}
                      onChange={e => setLeadProfile({...leadProfile, major: e.target.value})}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Level</label>
                    <select
                      className="input-clean"
                      value={leadProfile.academicLevel}
                      onChange={e => setLeadProfile({...leadProfile, academicLevel: e.target.value})}
                    >
                      <option>High School</option>
                      <option>University</option>
                      <option>Graduate</option>
                      <option>Professional</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Preferred Location</label>
                    <input
                      type="text"
                      required
                      className="input-clean"
                      placeholder="e.g. Remote, Lagos, London"
                      value={leadProfile.location}
                      onChange={e => setLeadProfile({...leadProfile, location: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Core Skills (comma separated)</label>
                  <input
                    type="text"
                    required
                    className="input-clean"
                    placeholder="e.g. Python, React, Design"
                    value={leadProfile.skills}
                    onChange={e => setLeadProfile({...leadProfile, skills: e.target.value})}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Job Interests / Role</label>
                  <input
                    type="text"
                    required
                    className="input-clean"
                    placeholder="e.g. Frontend Engineer, Product Manager"
                    value={leadProfile.interests}
                    onChange={e => setLeadProfile({...leadProfile, interests: e.target.value})}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSearching}
                  className="btn-primary" 
                  style={{ padding: '14px', fontSize: '15px', borderRadius: '12px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                  {isSearching ? 'Analyzing Markets...' : <><Search size={18} /> Find Appropriate Jobs</>}
                </button>
              </form>
            </div>
          )}

          {step === 'results' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Tailored Opportunities for You</h2>
                <button onClick={() => setStep('form')} className="btn-ghost" style={{ fontSize: '13px' }}>Edit Criteria</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {foundJobs.length > 0 ? foundJobs.map(job => (
                  <div key={job.id} className="card fade-in-up" style={{
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.3px', margin: 0 }}>
                          {job.organization}
                        </p>
                        <span className="badge badge-internship" style={{ fontSize: '10px', padding: '1px 8px' }}>Job</span>
                      </div>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', lineHeight: 1.3 }}>
                        {job.title}
                      </h3>
                      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {job.requirements.split('\n\n')[0]}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      {job.url && (
                        <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn-ghost"
                          style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', borderRadius: '10px', opacity: 0.7 }}>
                          <ExternalLink size={12} /> Apply
                        </a>
                      )}

                      <button 
                        onClick={() => handleSaveJob(job)} 
                        className="btn-ghost"
                        disabled={!!savedStates[job.id]}
                        style={{ padding: '8px 16px', fontSize: '12.5px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border-card)' }}
                      >
                        {savedStates[job.id] ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                        {savedStates[job.id] ? 'Saved' : 'Save'}
                      </button>

                      {analysisResults[job.id] ? (
                        <button 
                          onClick={() => selectOpportunity(job)} 
                          className="btn-primary"
                          style={{ padding: '8px 16px', fontSize: '12.5px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Sparkles size={14} /> View Results
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleAnalyze(job)} 
                          className="btn-primary"
                          style={{ padding: '8px 16px', fontSize: '12.5px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Sparkles size={14} /> Analyze
                        </button>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No specific jobs found for this criteria. Try broadening your search.
                  </div>
                )}

                {/* Low result warning */}
                {foundJobs.length > 0 && foundJobs.length < 5 && (
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '16px', 
                    borderRadius: '12px', 
                    background: 'rgba(245, 158, 11, 0.1)', 
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <AlertCircle size={20} color="#f59e0b" />
                    <p style={{ fontSize: '13px', color: '#92400e', margin: 0, lineHeight: 1.5 }}>
                      The specific jobs you are looking for may not be available in abundance here. 
                      Try using a <strong>wider search</strong> like global or country level instead of state level.
                    </p>
                  </div>
                )}

                {/* Load More Button */}
                {foundJobs.length >= 5 && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                    <button 
                      onClick={handleLoadMore} 
                      disabled={isLoadingMore}
                      className="btn-ghost"
                      style={{ 
                        padding: '10px 24px', 
                        fontSize: '13.5px', 
                        borderRadius: '12px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        border: '1px solid var(--border-card)'
                      }}
                    >
                      {isLoadingMore ? <RefreshCcw size={16} className="spin" /> : <Plus size={16} />}
                      {isLoadingMore ? 'Searching for more...' : 'Load more jobs'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'saved' && (
        <div className="card fade-in" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="var(--primary)" /> Saved Outreach Leads
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {savedLeads.length > 0 ? savedLeads.map(lead => (
              <div key={lead.id} style={{ 
                padding: '20px', 
                borderRadius: '16px', 
                border: '1px solid var(--border-card)', 
                background: 'var(--bg-input)',
                transition: 'transform 0.2s ease'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ 
                        fontSize: '10px', 
                        fontWeight: 700, 
                        color: 'var(--primary)', 
                        background: 'rgba(99, 102, 241, 0.1)', 
                        padding: '3px 10px', 
                        borderRadius: '6px',
                        textTransform: 'uppercase'
                      }}>
                        {lead.platform}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Saved on {lead.savedAt}</span>
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                      To: {lead.contactName}
                    </h4>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                      For <strong style={{ color: 'var(--primary)' }}>{lead.opportunityTitle}</strong>
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {lead.url && (
                      <a 
                        href={lead.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn-ghost" 
                        style={{ padding: '8px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', textDecoration: 'none' }}
                        title="Visit Link"
                      >
                        <ExternalLink size={14} /> Apply
                      </a>
                    )}
                    <button 
                      onClick={() => handleCopy(lead.message, lead.id)} 
                      className="btn-ghost" 
                      style={{ padding: '8px', borderRadius: '10px' }}
                      title="Copy Outreach"
                    >
                      {copiedStates[lead.id] ? <Check size={16} color="#16a34a" /> : <Clipboard size={16} />}
                    </button>
                    <button 
                      onClick={() => removeLead(lead.id)} 
                      className="btn-ghost" 
                      style={{ padding: '8px', borderRadius: '10px' }}
                      title="Delete"
                    >
                      <Trash2 size={16} color="#ef4444" />
                    </button>
                  </div>
                </div>
                <div style={{ 
                  padding: '16px', 
                  background: 'var(--bg-card)', 
                  borderRadius: '12px', 
                  fontSize: '13px', 
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap', 
                  lineHeight: 1.6,
                  border: '1px solid var(--border-input)'
                }}>
                  {lead.message}
                </div>
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                <AlertCircle size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p>No saved leads yet. Start by discovering and saving jobs!</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'templates' && (
        <div className="card fade-in" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Custom Templates</h3>
            <button onClick={() => setIsAdding(!isAdding)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}><Plus size={14} /> New Template</button>
          </div>

          {isAdding && (
            <form onSubmit={handleAddLead} className="card" style={{ padding: '16px', marginBottom: '20px', border: '1px solid var(--primary)' }}>
              <input type="text" placeholder="Template Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="input-clean" style={{ marginBottom: '10px' }} />
              <textarea placeholder="Template Content..." value={newContent} onChange={e => setNewContent(e.target.value)} className="input-clean" style={{ minHeight: '100px', marginBottom: '10px' }} />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsAdding(false)} className="btn-ghost">Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {customLeads.map(lead => (
              <div key={lead.id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border-card)', background: 'var(--bg-input)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>{lead.title}</h4>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleCopy(lead.content, lead.id)} className="btn-ghost" style={{ padding: '6px' }}>
                      {copiedStates[lead.id] ? <Check size={14} color="#16a34a" /> : <Clipboard size={14} />}
                    </button>
                    <button onClick={() => handleDeleteLead(lead.id)} className="btn-ghost" style={{ padding: '6px' }}>
                      <Trash2 size={14} color="#ef4444" />
                    </button>
                  </div>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-card)', borderRadius: '8px', fontSize: '12.5px', whiteSpace: 'pre-wrap' }}>{lead.content}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsDesktop;
