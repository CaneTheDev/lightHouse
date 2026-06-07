import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import type { Opportunity } from '../../context/AppContext';
import { 
  Clipboard, Check, Plus, Trash2, 
  BookOpen, Sparkles, AlertCircle, Briefcase, Search, ArrowRight, RefreshCcw,
  ExternalLink, Bookmark, BookmarkCheck, FileText, Paperclip, Loader2, X
} from 'lucide-react';
import { useCvExtractor } from '../Coach/useCvExtractor';
import { LeadsCvUploadModal } from './LeadsCvUploadModal';
import { getNames } from 'country-list';

const COUNTRIES = getNames().map(c => c.replace(/\s*\(.*?\)\s*/g, '').trim());

interface CustomLead {
  id: string;
  title: string;
  content: string;
}

export const LeadsMobile: React.FC = () => {
  const { 
    savedLeads, removeLead, saveLead,
    runAnalysis, selectOpportunity, analysisResults, discoveryComment,
    userProfile
  } = useApp();
  
  // CV Upload State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cvText, setCvText] = useState('');
  const [currentFile, setCurrentFile] = useState<{ name: string; type: string } | null>(null);
  const { extractFromFile, isExtracting, progress, extractionMethod } = useCvExtractor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse initial location from profile
  const getInitialLocation = () => {
    let country = '';
    let state = '';
    if (userProfile?.location) {
      const parts = userProfile.location.split(',').map(p => p.trim());
      if (parts.length > 1) {
        state = parts[0];
        country = parts[1];
      } else {
        country = userProfile.location;
      }
    }
    return { country, state };
  };

  const initialLoc = getInitialLocation();

  // States for the new job discovery flow
  const [step, setStep] = useState<'initial' | 'form' | 'cv_location' | 'results'>('initial');
  const [leadProfile, setLeadProfile] = useState({
    name: userProfile?.name || '',
    major: userProfile?.major || '',
    academicLevel: userProfile?.academicLevel || 'University',
    skills: userProfile?.skills || [],
    interests: userProfile?.interests || [],
    country: initialLoc.country,
    state: initialLoc.state
  });
  const [currentSkill, setCurrentSkill] = useState('');
  const [currentInterest, setCurrentInterest] = useState('');
  const [countrySuggestions, setCountrySuggestions] = useState<string[]>([]);
  const countryRef = useRef<HTMLDivElement>(null);

  // Close suggestion dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) setCountrySuggestions([]);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync with user profile if it loads/updates, without overwriting user edits
  useEffect(() => {
    if (userProfile) {
      const loc = getInitialLocation();
      setLeadProfile(prev => ({
        name: prev.name || userProfile.name || '',
        major: prev.major || userProfile.major || '',
        academicLevel: prev.academicLevel || userProfile.academicLevel || 'University',
        skills: prev.skills.length > 0 ? prev.skills : (userProfile.skills || []),
        interests: prev.interests.length > 0 ? prev.interests : (userProfile.interests || []),
        country: prev.country || loc.country,
        state: prev.state || loc.state
      }));
    }
  }, [userProfile]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [foundJobs, setFoundJobs] = useState<Opportunity[]>([]);
  const [excludeUrls, setExcludeUrls] = useState<string[]>([]);

  // Existing states refactored
  const [activeSubTab, setActiveSubTab] = useState<'discovery' | 'saved' | 'templates'>('discovery');
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [savedStates, setSavedStates] = useState<Record<string, boolean>>({});
  
  const [customLeads, setCustomLeads] = useState<CustomLead[]>(() => {
    const saved = localStorage.getItem('opportunity_os_library_custom_drafts');
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

  const handleAddSkill = () => {
    const trimmed = currentSkill.trim();
    if (trimmed && !leadProfile.skills.includes(trimmed)) {
      setLeadProfile({ ...leadProfile, skills: [...leadProfile.skills, trimmed] });
    }
    setCurrentSkill('');
  };

  const handleRemoveSkill = (skill: string) => {
    setLeadProfile({ ...leadProfile, skills: leadProfile.skills.filter(s => s !== skill) });
  };

  const handleAddInterest = () => {
    const trimmed = currentInterest.trim();
    if (trimmed && !leadProfile.interests.includes(trimmed)) {
      setLeadProfile({ ...leadProfile, interests: [...leadProfile.interests, trimmed] });
    }
    setCurrentInterest('');
  };

  const handleRemoveInterest = (interest: string) => {
    setLeadProfile({ ...leadProfile, interests: leadProfile.interests.filter(i => i !== interest) });
  };

  const handleCountryChange = (val: string) => {
    setLeadProfile({ ...leadProfile, country: val });
    if (!val.trim()) { setCountrySuggestions([]); return; }
    const filtered = COUNTRIES.filter(c => c.toLowerCase().includes(val.toLowerCase())).slice(0, 3);
    setCountrySuggestions(filtered);
  };

  const SuggestionList = ({ items, onSelect, refObj }: { items: string[]; onSelect: (v: string) => void; refObj: React.RefObject<HTMLDivElement | null> }) => {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
    if (items.length === 0) return null;
    return (
      <div ref={refObj} style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border-input)', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)', zIndex: 100, maxHeight: '120px', overflowY: 'auto', padding: '4px 0', marginTop: '4px' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ padding: '10px 14px', fontSize: '13.5px', color: 'var(--text-primary)', cursor: 'pointer', background: hoveredIdx === idx ? 'var(--bg-input)' : 'transparent' }}
            onMouseEnter={() => setHoveredIdx(idx)} onMouseLeave={() => setHoveredIdx(null)}
            onMouseDown={(e) => { e.preventDefault(); onSelect(item); }}>
            {item}
          </div>
        ))}
      </div>
    );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCurrentFile({ name: file.name, type: file.type });
    setCvText('');
    setIsModalOpen(true);

    try {
      const text = await extractFromFile(file);
      setCvText(text);
    } catch (err) {
      console.error(err);
    }

    if (e.target) e.target.value = '';
  };

  const handleSendCvText = (text: string) => {
    setCvText(text);
    setIsModalOpen(false);
    setStep('cv_location');
  };

  const triggerSearch = async (extractedCv: string, location: string) => {
    setIsSearching(true);
    setExcludeUrls([]);
    setStep('results');
    
    try {
      const payload = {
        category: 'internship',
        user_interest: leadProfile.interests.length > 0 ? leadProfile.interests.join(', ') : 'relevant roles',
        academic_level: leadProfile.academicLevel,
        location: location,
        major: leadProfile.major,
        skills: leadProfile.skills || [],
        cv_text: extractedCv,
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
    } catch (err) {
      console.error('Discovery Error:', err);
      setFoundJobs([
        {
          id: 'mock-cv-1',
          title: "Extracted Role from CV",
          organization: 'Matching Company',
          requirements: "This role was found based on your uploaded CV background.",
          type: 'job',
          url: '#'
        }
      ]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFindJobs = async (e: React.FormEvent) => {
    e.preventDefault();
    const locationParts = [leadProfile.state, leadProfile.country].filter(Boolean);
    const effectiveLocation = locationParts.length > 0 ? locationParts.join(', ') : 'Global Remote';
    triggerSearch(cvText, effectiveLocation);
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    try {
      const locationParts = [leadProfile.state, leadProfile.country].filter(Boolean);
      const effectiveLocation = locationParts.length > 0 ? locationParts.join(', ') : 'Global Remote';

      const payload = {
        category: 'internship',
        user_interest: leadProfile.interests.length > 0 ? leadProfile.interests.join(', ') : '',
        academic_level: leadProfile.academicLevel,
        location: effectiveLocation,
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
      }
    } catch (err) {
      console.error('Load More Error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="page-body-mobile" style={{ padding: '16px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>
              Job Leads
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Find appropriate jobs and manage outreach.
            </p>
          </div>
          {step !== 'initial' && (
            <button
              onClick={() => setStep('initial')}
              className="btn-ghost"
              style={{ padding: '6px 10px', fontSize: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <RefreshCcw size={12} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Sub-tab Navigation - Mobile optimized (scrollable if needed, but here 3 fit) */}
      <div style={{ 
        display: 'flex', 
        background: 'var(--bg-input)', 
        borderRadius: '12px', 
        padding: '3px', 
        marginBottom: '20px'
      }}>
        {[
          { id: 'discovery', label: 'Job Discovery', icon: <Briefcase size={14} /> },
          { id: 'saved', label: `Saved (${savedLeads.length})`, icon: <Sparkles size={14} /> },
          { id: 'templates', label: 'Templates', icon: <BookOpen size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            style={{
              flex: 1,
              padding: '10px 4px',
              borderRadius: '9px',
              border: 'none',
              background: activeSubTab === tab.id ? 'var(--bg-card)' : 'transparent',
              color: activeSubTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeSubTab === 'discovery' && (
        <div className="fade-in">
          {step === 'initial' && (
            <div className="card" style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <Sparkles size={48} color="var(--primary)" style={{ marginBottom: '8px' }} />
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Find Your Perfect Job</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, fontSize: '14px' }}>
                Let our AI agents find appropriate jobs tailored just for you based on your profile.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '8px' }}>
                <button 
                  onClick={() => setStep('form')}
                  className="btn-primary" 
                  style={{ width: '100%', padding: '14px', fontSize: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                  Get Started <ArrowRight size={18} />
                </button>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-ghost" 
                  style={{ 
                    width: '100%', 
                    padding: '14px', 
                    fontSize: '15px', 
                    borderRadius: '12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '10px', 
                    border: '1px dashed var(--primary)', 
                    background: 'var(--bg-tag)',
                    color: 'var(--primary)',
                    fontWeight: 700
                  }}
                >
                  <Paperclip size={18} /> Use CV Instead
                </button>
              </div>
            </div>
          )}

          {step === 'form' && (
            <div className="card fade-in-up" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0' }}>What are you looking for?</h2>
              </div>

              <form onSubmit={handleFindJobs} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Full Name</label>
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
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Academic Major</label>
                  <input
                    type="text"
                    required
                    className="input-clean"
                    placeholder="e.g. Computer Science"
                    value={leadProfile.major}
                    onChange={e => setLeadProfile({...leadProfile, major: e.target.value})}
                  />
                </div>

                <div style={{ position: 'relative', isolation: 'isolate' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Target Country *</label>
                  <input
                    type="text"
                    required
                    className="input-clean"
                    style={{ width: '100%' }}
                    placeholder="e.g. USA, UK, Nigeria"
                    value={leadProfile.country}
                    onChange={e => handleCountryChange(e.target.value)}
                    autoComplete="off"
                  />
                  <SuggestionList items={countrySuggestions} onSelect={(v) => { setLeadProfile({...leadProfile, country: v}); setCountrySuggestions([]); }} refObj={countryRef} />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>State / City (Optional)</label>
                  <input
                    type="text"
                    className="input-clean"
                    style={{ width: '100%' }}
                    placeholder="e.g. Lagos, London, California"
                    value={leadProfile.state}
                    onChange={e => setLeadProfile({...leadProfile, state: e.target.value})}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Academic Level</label>
                  <select
                    className="input-clean"
                    style={{ width: '100%' }}
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
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Core Skills</label>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                    <input
                      type="text"
                      className="input-clean"
                      style={{ flex: 1, fontSize: '13px' }}
                      placeholder="e.g. Python, React, Design"
                      value={currentSkill}
                      onChange={e => setCurrentSkill(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); } }}
                    />
                    <button type="button" onClick={handleAddSkill} className="btn-add"
                      style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--border-card)', background: 'var(--bg-input)', fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {leadProfile.skills.map(skill => (
                      <span key={skill} className="chip" style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--bg-tag)', border: '1px solid var(--border-card)' }}>
                        {skill}
                        <button type="button" onClick={() => handleRemoveSkill(skill)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--text-muted)' }}><X size={11} /></button>
                      </span>
                    ))}
                    {leadProfile.skills.length === 0 && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No skills added yet.</span>}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Job Interests / Role</label>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                    <input
                      type="text"
                      className="input-clean"
                      style={{ flex: 1, fontSize: '13px' }}
                      placeholder="e.g. Frontend Engineer"
                      value={currentInterest}
                      onChange={e => setCurrentInterest(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddInterest(); } }}
                    />
                    <button type="button" onClick={handleAddInterest} className="btn-add"
                      style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid var(--border-card)', background: 'var(--bg-input)', fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>+</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {leadProfile.interests.map(interest => (
                      <span key={interest} className="chip" style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--bg-tag)', border: '1px solid var(--border-card)' }}>
                        {interest}
                        <button type="button" onClick={() => handleRemoveInterest(interest)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: 'var(--text-muted)' }}><X size={11} /></button>
                      </span>
                    ))}
                    {leadProfile.interests.length === 0 && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No interests added yet.</span>}
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSearching}
                  className="btn-primary" 
                  style={{ width: '100%', padding: '14px', fontSize: '15px', borderRadius: '12px', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                >
                  {isSearching ? <RefreshCcw size={18} className="spin" /> : <Search size={18} />}
                  {isSearching ? 'Searching...' : 'Find Jobs'}
                </button>
              </form>
            </div>
          )}

          {step === 'cv_location' && (
            <div className="card fade-in-up" style={{ padding: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px'
                }}>
                  <Sparkles size={24} color="var(--primary)" />
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0' }}>Where are you looking?</h2>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  CV parsed successfully! Please tell us your target country to find matching opportunities.
                </p>
                {currentFile && (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    marginTop: '12px',
                    padding: '6px 10px',
                    background: 'var(--bg-tag)',
                    borderRadius: '8px',
                    border: '1px solid var(--border-card)'
                  }}>
                    <FileText size={12} color="var(--primary)" />
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
                      {currentFile.name}
                    </span>
                  </div>
                )}
              </div>

              <form onSubmit={handleFindJobs} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ position: 'relative', isolation: 'isolate' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Target Country *</label>
                  <input
                    type="text"
                    required
                    className="input-clean"
                    style={{ width: '100%' }}
                    placeholder="e.g. USA, UK, Nigeria"
                    value={leadProfile.country}
                    onChange={e => handleCountryChange(e.target.value)}
                    autoComplete="off"
                  />
                  <SuggestionList items={countrySuggestions} onSelect={(v) => { setLeadProfile({...leadProfile, country: v}); setCountrySuggestions([]); }} refObj={countryRef} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>State / City (Optional)</label>
                  <input
                    type="text"
                    className="input-clean"
                    style={{ width: '100%' }}
                    placeholder="e.g. Lagos, London, California"
                    value={leadProfile.state}
                    onChange={e => setLeadProfile({...leadProfile, state: e.target.value})}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <button 
                    type="submit" 
                    disabled={isSearching}
                    className="btn-primary" 
                    style={{ width: '100%', padding: '14px', fontSize: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                  >
                    {isSearching ? <RefreshCcw size={18} className="spin" /> : <Search size={18} />}
                    {isSearching ? 'Analyzing...' : 'Find Jobs'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStep('initial')}
                    className="btn-ghost"
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px' }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'results' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Tailored Opportunities</h2>
                <button onClick={() => setStep(cvText ? 'cv_location' : 'form')} className="btn-ghost" style={{ fontSize: '12px', padding: '4px 8px' }}>Edit</button>
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
                    <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 2px' }}>AI Overview</p>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>{discoveryComment}</p>
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {isSearching ? (
                  <div className="card" style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary)' }} />
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Finding Jobs...</h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 auto', lineHeight: 1.5 }}>
                      Analyzing your background and searching for the best matches.
                    </p>
                  </div>
                ) : foundJobs.length > 0 ? foundJobs.map(job => (
                  <div key={job.id} className="card fade-in-up" style={{ padding: '16px' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <p style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', margin: 0 }}>
                          {job.organization}
                        </p>
                        <span className="badge" style={{ fontSize: '9px', padding: '1px 6px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', borderRadius: '4px' }}>JOB</span>
                      </div>
                      <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px', lineHeight: 1.3 }}>
                        {job.title}
                      </h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        {job.requirements.split('\n\n')[0]}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {analysisResults[job.id] ? (
                          <button 
                            onClick={() => selectOpportunity(job)} 
                            className="btn-primary"
                            style={{ flex: 1.5, padding: '10px', fontSize: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            <Sparkles size={14} /> View Results
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleAnalyze(job)} 
                            className="btn-primary"
                            style={{ flex: 1.5, padding: '10px', fontSize: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                          >
                            <Sparkles size={14} /> Analyze
                          </button>
                        )}
                        <button 
                          onClick={() => handleSaveJob(job)} 
                          className="btn-ghost"
                          disabled={!!savedStates[job.id]}
                          style={{ flex: 1, padding: '10px', fontSize: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1px solid var(--border-card)' }}
                        >
                          {savedStates[job.id] ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                          {savedStates[job.id] ? 'Saved' : 'Save'}
                        </button>
                      </div>
                      
                      {job.url && (
                        <a href={job.url} target="_blank" rel="noopener noreferrer" className="btn-ghost"
                          style={{ width: '100%', padding: '8px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', textDecoration: 'none', borderRadius: '10px', opacity: 0.8 }}>
                          <ExternalLink size={12} /> Apply on Platform
                        </a>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="card" style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                    No jobs found. Try broadening your criteria.
                  </div>
                )}

                {foundJobs.length > 0 && foundJobs.length < 5 && (
                  <div style={{ 
                    padding: '12px', 
                    borderRadius: '10px', 
                    background: 'rgba(245, 158, 11, 0.05)', 
                    border: '1px solid rgba(245, 158, 11, 0.1)',
                    display: 'flex',
                    gap: '10px'
                  }}>
                    <AlertCircle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ fontSize: '11px', color: '#92400e', margin: 0, lineHeight: 1.4 }}>
                      Few results found. Try a wider search (e.g. country instead of city).
                    </p>
                  </div>
                )}

                {foundJobs.length >= 5 && (
                  <button 
                    onClick={handleLoadMore} 
                    disabled={isLoadingMore}
                    className="btn-ghost"
                    style={{ 
                      width: '100%',
                      padding: '12px', 
                      fontSize: '13px', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      gap: '8px',
                      marginTop: '8px',
                      border: '1px solid var(--border-card)'
                    }}
                  >
                    {isLoadingMore ? <RefreshCcw size={14} className="spin" /> : <Plus size={14} />}
                    {isLoadingMore ? 'Loading...' : 'Load more jobs'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'saved' && (
        <div className="fade-in">
          <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--primary)" /> Saved Outreach
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {savedLeads.length > 0 ? savedLeads.map(lead => (
              <div key={lead.id} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span style={{ 
                        fontSize: '9px', 
                        fontWeight: 700, 
                        color: 'var(--primary)', 
                        background: 'rgba(99, 102, 241, 0.1)', 
                        padding: '2px 8px', 
                        borderRadius: '4px'
                      }}>
                        {lead.platform}
                      </span>
                    </div>
                    <h4 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 2px 0', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      To: {lead.contactName}
                    </h4>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0 }}>
                      For {lead.opportunityTitle}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      onClick={() => handleCopy(lead.message, lead.id)} 
                      className="btn-ghost" 
                      style={{ padding: '8px', borderRadius: '8px' }}
                    >
                      {copiedStates[lead.id] ? <Check size={14} color="#16a34a" /> : <Clipboard size={14} />}
                    </button>
                    <button 
                      onClick={() => removeLead(lead.id)} 
                      className="btn-ghost" 
                      style={{ padding: '8px', borderRadius: '8px' }}
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </button>
                  </div>
                </div>
                <div style={{ 
                  padding: '12px', 
                  background: 'var(--bg-input)', 
                  borderRadius: '10px', 
                  fontSize: '12px', 
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap', 
                  lineHeight: 1.5,
                  border: '1px solid var(--border-input)',
                  maxHeight: '120px',
                  overflowY: 'auto'
                }}>
                  {lead.message}
                </div>
                {lead.url && (
                  <a 
                    href={lead.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="btn-primary" 
                    style={{ width: '100%', marginTop: '12px', padding: '10px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '12px', textDecoration: 'none' }}
                  >
                    <ExternalLink size={14} /> Open Link
                  </a>
                )}
              </div>
            )) : (
              <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <AlertCircle size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <p style={{ fontSize: '14px' }}>No saved leads yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'templates' && (
        <div className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Templates</h3>
            <button onClick={() => setIsAdding(!isAdding)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}>
              <Plus size={14} /> New
            </button>
          </div>

          {isAdding && (
            <form onSubmit={handleAddLead} className="card" style={{ padding: '16px', marginBottom: '16px', border: '1px solid var(--primary)' }}>
              <input type="text" placeholder="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} className="input-clean" style={{ marginBottom: '10px', fontSize: '14px' }} />
              <textarea placeholder="Content..." value={newContent} onChange={e => setNewContent(e.target.value)} className="input-clean" style={{ minHeight: '100px', marginBottom: '12px', fontSize: '14px' }} />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsAdding(false)} className="btn-ghost" style={{ fontSize: '12px' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ fontSize: '12px' }}>Save</button>
              </div>
            </form>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {customLeads.map(lead => (
              <div key={lead.id} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 800, margin: 0 }}>{lead.title}</h4>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => handleCopy(lead.content, lead.id)} className="btn-ghost" style={{ padding: '6px' }}>
                      {copiedStates[lead.id] ? <Check size={14} color="#16a34a" /> : <Clipboard size={14} />}
                    </button>
                    <button onClick={() => handleDeleteLead(lead.id)} className="btn-ghost" style={{ padding: '6px' }}>
                      <Trash2 size={14} color="#ef4444" />
                    </button>
                  </div>
                </div>
                <div style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: '8px', fontSize: '12px', whiteSpace: 'pre-wrap', color: 'var(--text-secondary)' }}>
                  {lead.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf,image/*"
        style={{ display: 'none' }}
      />

      {/* CV Extraction Review Modal */}
      {currentFile && (
        <LeadsCvUploadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          fileName={currentFile.name}
          extractedText={cvText}
          isExtracting={isExtracting}
          progress={progress}
          extractionMethod={extractionMethod}
          onConfirm={handleSendCvText}
        />
      )}
    </div>
  );
};

export default LeadsMobile;
