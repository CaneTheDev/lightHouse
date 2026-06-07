import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, GraduationCap, MapPin, User, 
  ArrowLeft 
} from 'lucide-react';

export const OnboardingMobile: React.FC = () => {
  const { saveProfile, userProfile, activeView, resetProfile } = useApp();
  
  // Step State for Onboarding Wizard
  const [step, setStep] = useState<1 | 2>(1);

  const STANDARD_LEVELS = ['Elementary', 'High School', 'University', 'BSc', 'Masters', 'PhD'];
  
  const initialAcademicLevel = userProfile?.academicLevel 
    ? (STANDARD_LEVELS.includes(userProfile.academicLevel) ? userProfile.academicLevel : 'Other')
    : 'University';

  const [name, setName] = useState(userProfile?.name || '');
  const [location, setLocation] = useState(userProfile?.location || '');
  const [major, setMajor] = useState(userProfile?.major || '');
  const [academicLevel, setAcademicLevel] = useState(initialAcademicLevel);
  const [customAcademicLevel, setCustomAcademicLevel] = useState(
    initialAcademicLevel === 'Other' ? (userProfile?.academicLevel || '') : ''
  );
  const [skills, setSkills] = useState<string[]>(userProfile?.skills || []);
  const [currentSkill, setCurrentSkill] = useState('');
  const [interests, setInterests] = useState<string[]>(userProfile?.interests || []);
  const [currentInterest, setCurrentInterest] = useState('');

  // Autocomplete Suggestions States
  const [majorSuggestions, setMajorSuggestions] = useState<string[]>([]);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [interestSuggestions, setInterestSuggestions] = useState<string[]>([]);

  // Refs for closing dropdowns on outside clicks
  const majorRef = useRef<HTMLDivElement>(null);
  const skillRef = useRef<HTMLDivElement>(null);
  const interestRef = useRef<HTMLDivElement>(null);

  // Close suggestions on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (majorRef.current && !majorRef.current.contains(e.target as Node)) {
        setMajorSuggestions([]);
      }
      if (skillRef.current && !skillRef.current.contains(e.target as Node)) {
        setSkillSuggestions([]);
      }
      if (interestRef.current && !interestRef.current.contains(e.target as Node)) {
        setInterestSuggestions([]);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Fetch suggestions from public Datamuse API
  const fetchSuggestions = async (query: string): Promise<string[]> => {
    if (!query.trim() || query.trim().length < 2) return [];
    try {
      const res = await fetch(`https://api.datamuse.com/sug?s=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        // Capitalize words for professional look
        return data.slice(0, 5).map((item: any) => 
          item.word.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        );
      }
    } catch (err) {
      console.error('Datamuse API error:', err);
    }
    return [];
  };

  const handleMajorChange = async (val: string) => {
    setMajor(val);
    const suggestions = await fetchSuggestions(val);
    setMajorSuggestions(suggestions);
  };

  const handleSkillChange = async (val: string) => {
    setCurrentSkill(val);
    const suggestions = await fetchSuggestions(val);
    setSkillSuggestions(suggestions);
  };

  const handleInterestChange = async (val: string) => {
    setCurrentInterest(val);
    const suggestions = await fetchSuggestions(val);
    setInterestSuggestions(suggestions);
  };

  const handleAddSkill = (skillVal: string) => {
    const trimmed = skillVal.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setCurrentSkill('');
    setSkillSuggestions([]);
  };

  const handleAddInterest = (interestVal: string) => {
    const trimmed = interestVal.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests([...interests, trimmed]);
    }
    setCurrentInterest('');
    setInterestSuggestions([]);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleRemoveInterest = (interestToRemove: string) => {
    setInterests(interests.filter(i => i !== interestToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location || !major) {
      alert('Please fill out all required fields.');
      return;
    }
    const finalLevel = academicLevel === 'Other' ? customAcademicLevel : academicLevel;
    saveProfile({ name, major, academicLevel: finalLevel, location, gpa: '', skills, interests });
  };

  const handleReset = () => {
    const confirmReset = window.confirm(
      'Are you sure you want to reset all data? This will clear your academic profile, all opportunity evaluations, saved outreach drafts, and chat history.'
    );
    if (confirmReset) {
      resetProfile();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STYLES & SUB-RENDERERS
  // ─────────────────────────────────────────────────────────────────────────
  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'var(--bg-card)',
    border: '1px solid var(--border-input)',
    borderRadius: '10px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    zIndex: 100,
    maxHeight: '180px',
    overflowY: 'auto',
    padding: '4px 0',
    marginTop: '4px'
  };

  const suggestionItemStyle = (hovered: boolean): React.CSSProperties => ({
    padding: '10px 14px',
    fontSize: '13.5px',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    background: hovered ? 'var(--bg-input)' : 'transparent',
    transition: 'background 0.15s ease'
  });

  const SuggestionList = ({ 
    items, 
    onSelect 
  }: { 
    items: string[], 
    onSelect: (item: string) => void 
  }) => {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

    if (items.length === 0) return null;
    return (
      <div style={dropdownStyle}>
        {items.map((item, idx) => (
          <div
            key={idx}
            style={suggestionItemStyle(hoveredIdx === idx)}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={(e) => { e.stopPropagation(); onSelect(item); }}
          >
            {item}
          </div>
        ))}
      </div>
    );
  };

  // ─── Step 1 Form Fields ───
  const renderStep1Fields = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <div className="label">
          <User size={13} /> Full Name *
        </div>
        <input
          id="onboarding-name"
          type="text"
          required
          placeholder="Jane Doe"
          value={name}
          onChange={e => setName(e.target.value)}
          className="input-clean"
          style={{ fontSize: '13.5px' }}
        />
      </div>

      <div>
        <div className="label">
          <MapPin size={13} /> Location / Country *
        </div>
        <input
          id="onboarding-location"
          type="text"
          required
          placeholder="Nigeria, Kenya, South Africa..."
          value={location}
          onChange={e => setLocation(e.target.value)}
          className="input-clean"
          style={{ fontSize: '13.5px' }}
        />
      </div>

    </div>
  );

  // ─── Step 2 Form Fields ───
  const renderStep2Fields = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Academic Level */}
      <div>
        <div className="label">
          <GraduationCap size={13} /> Academic Level *
        </div>
        <select
          id="onboarding-academic-level"
          value={academicLevel}
          onChange={e => setAcademicLevel(e.target.value)}
          className="input-clean"
          style={{ fontSize: '13.5px', width: '100%', appearance: 'none', background: 'var(--bg-input)' }}
        >
          <option value="Elementary">Elementary</option>
          <option value="High School">High School</option>
          <option value="University">University</option>
          <option value="BSc">BSc (Bachelor's)</option>
          <option value="Masters">Masters</option>
          <option value="PhD">PhD</option>
          <option value="Other">Other (Manually Fill)</option>
        </select>
      </div>

      {academicLevel === 'Other' && (
        <div className="fade-in-up">
          <div className="label">Specify Academic Level *</div>
          <input
            id="onboarding-custom-level"
            type="text"
            required
            placeholder="e.g. Diploma, Certification, Vocational..."
            value={customAcademicLevel}
            onChange={e => setCustomAcademicLevel(e.target.value)}
            className="input-clean"
            style={{ fontSize: '13.5px' }}
          />
        </div>
      )}

      {/* Field / Major */}
      <div ref={majorRef} style={{ position: 'relative' }}>
        <div className="label">
          <GraduationCap size={13} /> Field of Study / Major *
        </div>
        <input
          id="onboarding-major"
          type="text"
          required
          placeholder="e.g. Computer Science, Mechanical Engineering..."
          value={major}
          onChange={e => handleMajorChange(e.target.value)}
          className="input-clean"
          style={{ fontSize: '13.5px' }}
          autoComplete="off"
        />
        <SuggestionList 
          items={majorSuggestions} 
          onSelect={(item) => {
            setMajor(item);
            setMajorSuggestions([]);
          }} 
        />
      </div>

      {/* Skills */}
      <div ref={skillRef} style={{ position: 'relative' }}>
        <div className="label">Skills & Technologies</div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            id="onboarding-skill-input"
            type="text"
            placeholder="Type skill (e.g. Python, Public Speaking...)"
            value={currentSkill}
            onChange={e => handleSkillChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSkill(currentSkill);
              }
            }}
            className="input-clean"
            style={{ flex: 1, fontSize: '13.5px' }}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => handleAddSkill(currentSkill)}
            className="btn-add"
          >+</button>
        </div>
        <SuggestionList 
          items={skillSuggestions} 
          onSelect={(item) => handleAddSkill(item)} 
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
          {skills.map(skill => (
            <span key={skill} className="chip" style={{ fontSize: '12px', padding: '4px 10px' }}>
              {skill}
              <button type="button" className="chip-remove" onClick={() => handleRemoveSkill(skill)}>
                <X size={11} />
              </button>
            </span>
          ))}
          {skills.length === 0 && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No skills added.</span>}
        </div>
      </div>

      {/* Interests */}
      <div ref={interestRef} style={{ position: 'relative' }}>
        <div className="label">Interests & Target Fields</div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input
            id="onboarding-interest-input"
            type="text"
            placeholder="Type interest (e.g. Machine Learning, Open Source...)"
            value={currentInterest}
            onChange={e => handleInterestChange(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddInterest(currentInterest);
              }
            }}
            className="input-clean"
            style={{ flex: 1, fontSize: '13.5px' }}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => handleAddInterest(currentInterest)}
            className="btn-add"
          >+</button>
        </div>
        <SuggestionList 
          items={interestSuggestions} 
          onSelect={(item) => handleAddInterest(item)} 
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
          {interests.map(interest => (
            <span key={interest} className="chip" style={{ fontSize: '12px', padding: '4px 10px' }}>
              {interest}
              <button type="button" className="chip-remove" onClick={() => handleRemoveInterest(interest)}>
                <X size={11} />
              </button>
            </span>
          ))}
          {interests.length === 0 && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No interests added.</span>}
        </div>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: Onboarding Mode (Two-Step Wizard)
  // ─────────────────────────────────────────────────────────────────────────
  if (activeView === 'onboarding') {
    return (
      <div className="page-wrapper">
        <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 60px)', padding: '24px 16px' }}>
          <div className="fade-in-up" style={{ width: '100%', maxWidth: '560px' }}>
            
            {/* Step Wizard Header */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: 700, 
                  color: 'var(--text-primary)', 
                  background: 'var(--bg-tag)',
                  padding: '2px 8px',
                  borderRadius: '100px'
                }}>
                  Step {step} of 2
                </span>
              </div>
              <h1 className="hero-heading" style={{ fontSize: '32px', marginBottom: '8px', letterSpacing: '-1px' }}>
                {step === 1 ? 'Personal Details' : 'Academic Setup'}
              </h1>
            </div>

            {/* Form */}
            <form onSubmit={step === 2 ? handleSubmit : (e) => { e.preventDefault(); setStep(2); }}>
              <div className="card" style={{ padding: '24px' }}>
                {step === 1 ? renderStep1Fields() : renderStep2Fields()}
                <div style={{ marginTop: '24px', display: 'flex', gap: '10px' }}>
                  {step === 2 && (
                    <button type="button" onClick={() => setStep(1)} className="btn-ghost" style={{ padding: '12px' }}>
                      <ArrowLeft size={14} />
                    </button>
                  )}
                  <button type="submit" className="btn-primary" style={{ flex: 1, padding: '12px', borderRadius: '10px' }}>
                    {step === 1 ? 'Next' : 'Complete'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: Profile Settings View (Unified Form)
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="page-body fade-in-up" style={{ padding: '16px', paddingBottom: '80px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="hero-heading" style={{ fontSize: '24px', marginBottom: '4px' }}>Profile Settings</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Manage your academic details.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>1. Basic Info</h3>
          {renderStep1Fields()}
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>2. Academic</h3>
          {renderStep2Fields()}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button type="submit" className="btn-primary" style={{ padding: '14px', borderRadius: '12px' }}>Save Changes</button>
          <button type="button" onClick={handleReset} className="btn-ghost" style={{ padding: '12px', color: '#ef4444' }}>Reset Platform</button>
        </div>
      </form>
    </div>
  );
};

export default OnboardingMobile;
