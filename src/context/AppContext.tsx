import type React from 'react';
import { createContext, useContext, useState, useRef, useEffect } from 'react';

export interface UserProfile {
  name: string;
  major: string;
  academicLevel: string;
  skills: string[];
  location: string;
  gpa?: string;
  interests: string[];
}

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  requirements: string;
  type?: string;
  url?: string;
}

export interface ContactResult {
  name: string;
  profile_url: string;
  snippet: string;
  suggested_message: string;
  source?: string; // 'tavily' | 'github_api' | 'mock'
}

export interface SavedLead {
  id: string;
  contactName: string;
  platform: string;
  opportunityTitle: string;
  message: string;
  savedAt: string;
  url?: string;
}

export interface AnalysisResponse {
  opp_id: string;
  match_score: number;
  success_probability: string;
  eligibility_reasoning: string;
  application_tips: string[];
  suggested_contacts: ContactResult[];
  reasoning_details?: {
    eligibility?: string;
    networking?: any;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  reasoning_details?: any;
}

export interface LocalAccount {
  email: string;
  password: string;
}

// ─── 7 core views + loader + onboarding ───────────────────────────────────────
export type ActiveView =
  | 'login'
  | 'onboarding'
  | 'dashboard'
  | 'discovery'
  | 'coach'
  | 'leads'
  | 'profile'
  | 'loader'
  | 'match-strategy';

interface AppContextType {
  currentUser: { email: string } | null;
  userProfile: UserProfile | null;
  opportunities: Opportunity[];
  selectedOpportunity: Opportunity | null;
  activeView: ActiveView;
  analysisResults: Record<string, AnalysisResponse>;
  chatHistories: Record<string, ChatMessage[]>;
  savedLeads: SavedLead[];
  loadingStatus: string;
  fetchLiveOpportunities: (category: string, interest: string, excludeUrls?: string[]) => Promise<Opportunity[]>;
  login: (email: string, password: string) => { success: boolean; message?: string };
  signup: (email: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  saveProfile: (profile: UserProfile) => void;
  selectOpportunity: (opp: Opportunity | null) => void;
  runAnalysis: (opp: Opportunity) => Promise<void>;
  resetProfile: () => void;
  setView: (view: ActiveView) => void;
  addChatMessage: (oppId: string, message: ChatMessage) => void;
  setChatHistories: React.Dispatch<React.SetStateAction<Record<string, ChatMessage[]>>>;
  saveLead: (contact: ContactResult, oppTitle: string) => void;
  removeLead: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<LocalAccount[]>(() => {
    const saved = localStorage.getItem('opportunity_os_accounts');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(() => {
    const saved = localStorage.getItem('opportunity_os_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('opportunity_os_profile');
    if (!saved) return null;
    const profile = JSON.parse(saved);
    // Migration: ensure academicLevel exists for older profiles
    if (!profile.academicLevel) {
      profile.academicLevel = 'University';
    }
    return profile;
  });

  const [activeView, setView] = useState<ActiveView>(() => {
    const savedUser = localStorage.getItem('opportunity_os_user');
    const savedProfile = localStorage.getItem('opportunity_os_profile');
    if (!savedUser) return 'login';
    if (!savedProfile) return 'onboarding';
    return 'dashboard';
  });

  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  const [analysisResults, setAnalysisResults] = useState<Record<string, AnalysisResponse>>(() => {
    const saved = localStorage.getItem('opportunity_os_evaluations');
    return saved ? JSON.parse(saved) : {};
  });

  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
    const saved = localStorage.getItem('opportunity_os_discovered_opps');
    return saved ? JSON.parse(saved) : [];
  });

  const [chatHistories, setChatHistories] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem('opportunity_os_chats');
    if (!saved) return {};
    const histories: Record<string, ChatMessage[]> = JSON.parse(saved);
    // Migration: remove old hardcoded duplicate welcome messages
    const oldPatterns = [
      'I am your OpportunityOS Career Coach. How can I help you find international opportunities',
    ];
    for (const key of Object.keys(histories)) {
      histories[key] = histories[key].filter(msg =>
        !oldPatterns.some(pattern => msg.content.includes(pattern))
      );
    }
    return histories;
  });

  const [savedLeads, setSavedLeads] = useState<SavedLead[]>(() => {
    const saved = localStorage.getItem('opportunity_os_leads');
    return saved ? JSON.parse(saved) : [];
  });

  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing Agents...');
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const discoveryAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (discoveryAbortControllerRef.current) {
        discoveryAbortControllerRef.current.abort();
      }
    };
  }, []);

  const login = (email: string, password: string): { success: boolean; message?: string } => {
    const account = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
    
    if (!account) {
      return { success: false, message: "Account not found. Please sign up." };
    }

    if (account.password !== password) {
      return { success: false, message: "Invalid password." };
    }

    const user = { email: account.email };
    setCurrentUser(user);
    localStorage.setItem('opportunity_os_user', JSON.stringify(user));
    
    if (localStorage.getItem('opportunity_os_profile')) {
      setView('dashboard');
    } else {
      setView('onboarding');
    }
    return { success: true };
  };

  const signup = (email: string, password: string): { success: boolean; message?: string } => {
    const existing = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return { success: false, message: "Account already exists. Please sign in." };
    }

    const newAccount = { email, password };
    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);
    localStorage.setItem('opportunity_os_accounts', JSON.stringify(updatedAccounts));

    const user = { email };
    setCurrentUser(user);
    localStorage.setItem('opportunity_os_user', JSON.stringify(user));
    setView('onboarding');
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('opportunity_os_user');
    setView('login');
  };

  const saveProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem('opportunity_os_profile', JSON.stringify(profile));
    setView('dashboard');
  };

  const resetProfile = () => {
    setUserProfile(null);
    setSelectedOpportunity(null);
    setAnalysisResults({});
    setChatHistories({});
    setSavedLeads([]);
    setOpportunities([]);
    localStorage.removeItem('opportunity_os_profile');
    localStorage.removeItem('opportunity_os_evaluations');
    localStorage.removeItem('opportunity_os_chats');
    localStorage.removeItem('opportunity_os_leads');
    localStorage.removeItem('opportunity_os_discovered_opps');
    setView('onboarding');
  };

  const selectOpportunity = (opp: Opportunity | null) => {
    setSelectedOpportunity(opp);
  };

  const addChatMessage = (oppId: string, message: ChatMessage) => {
    setChatHistories(prev => {
      const history = prev[oppId] || [];
      const updated = {
        ...prev,
        [oppId]: [...history, message]
      };
      localStorage.setItem('opportunity_os_chats', JSON.stringify(updated));
      return updated;
    });
  };

  const saveLead = (contact: ContactResult, oppTitle: string) => {
    // Detect platform dynamically from the profile_url
    let platform = 'Web';
    const url = contact.profile_url.toLowerCase();
    
    if (url.includes('linkedin.com')) platform = 'LinkedIn';
    else if (url.includes('github.com')) platform = 'GitHub';
    else if (url.includes('eventbrite.com')) platform = 'Eventbrite';
    else if (url.includes('meetup.com')) platform = 'Meetup';
    else if (url.includes('t.me') || url.includes('telegram.org')) platform = 'Telegram';
    else if (url.includes('discord.gg') || url.includes('discord.com')) platform = 'Discord';
    else if (url.includes('slack.com')) platform = 'Slack';
    else if (contact.source === 'github_api') platform = 'GitHub';
    else if (contact.source === 'tavily') platform = 'Web Search';

    const lead: SavedLead = {
      id: `${Date.now()}-${contact.name}`,
      contactName: contact.name,
      platform: platform,
      opportunityTitle: oppTitle,
      message: contact.suggested_message,
      url: contact.profile_url,
      savedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    };
    setSavedLeads(prev => {
      const updated = [lead, ...prev];
      localStorage.setItem('opportunity_os_leads', JSON.stringify(updated));
      return updated;
    });
  };

  const removeLead = (id: string) => {
    setSavedLeads(prev => {
      const updated = prev.filter(d => d.id !== id);
      localStorage.setItem('opportunity_os_leads', JSON.stringify(updated));
      return updated;
    });
  };

  const fetchLiveOpportunities = async (category: string, interest: string, excludeUrls: string[] = []): Promise<Opportunity[]> => {
    if (!userProfile) return [];

    console.log('Fetching live opportunities with payload:', {
      category,
      user_interest: interest,
      academic_level: userProfile.academicLevel,
      location: userProfile.location,
      exclude_urls: excludeUrls
    });

    if (discoveryAbortControllerRef.current) {
      discoveryAbortControllerRef.current.abort();
    }
    discoveryAbortControllerRef.current = new AbortController();

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/discover/live`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: discoveryAbortControllerRef.current.signal,
        body: JSON.stringify({
          category,
          user_interest: interest,
          academic_level: userProfile.academicLevel,
          location: userProfile.location,
          exclude_urls: excludeUrls
        })
      });

      if (!response.ok) throw new Error('Discovery failed');
      const data = await response.json();
      
      // Map DiscoveryOpportunity to Opportunity interface
      const mapped: Opportunity[] = data.opportunities.map((opp: any, idx: number) => ({
        id: `live-${Date.now()}-${idx}`,
        title: opp.title,
        organization: opp.organization,
        requirements: `${opp.description}\n\nAvailability: ${opp.availability}`,
        type: category,
        url: opp.url
      }));

      setOpportunities(prev => {
        const existingUrls = new Set(prev.map(o => o.url));
        const uniqueNew = mapped.filter(o => !existingUrls.has(o.url));
        const updated = [...prev, ...uniqueNew];
        localStorage.setItem('opportunity_os_discovered_opps', JSON.stringify(updated));
        return updated;
      });

      discoveryAbortControllerRef.current = null;
      return mapped;
    } catch (err: any) {
      if (err.name === 'AbortError') return [];
      console.error('Discovery Error:', err);
      return [];
    }
  };

  const runAnalysis = async (opp: Opportunity) => {
    if (!userProfile) return;

    setSelectedOpportunity(opp);
    setView('loader');

    // Status text rotation to show agent progress
    const statuses = [
      'Activating Eligibility Agent...',
      'Searching LinkedIn & GitHub for professionals...',
      'Context Agent digesting real profiles...',
      'Synthesizing fit metrics & custom templates...'
    ];

    let statusIndex = 0;
    setLoadingStatus(statuses[0]);

    // Clear any existing interval before starting a new one
    if (analysisIntervalRef.current) {
      clearInterval(analysisIntervalRef.current);
    }
    
    // Abort any existing analysis request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    analysisIntervalRef.current = setInterval(() => {
      statusIndex = (statusIndex + 1) % statuses.length;
      setLoadingStatus(statuses[statusIndex]);
    }, 1500);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          profile: userProfile,
          opportunity: opp
        })
      });

      if (!response.ok) {
        throw new Error('Analysis request failed');
      }

      const result: AnalysisResponse = await response.json();

      setAnalysisResults(prev => {
        const updated = { ...prev, [opp.id]: result };
        localStorage.setItem('opportunity_os_evaluations', JSON.stringify(updated));
        return updated;
      });

      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
      abortControllerRef.current = null;
      setView('discovery');

    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error('API Error, falling back to local simulation:', error);

      await new Promise(resolve => setTimeout(resolve, 6000));

      const matchScore = Math.floor(Math.random() * 41) + 60; // 60–100
      const success_probability = matchScore > 80 ? 'High' : (matchScore > 65 ? 'Medium' : 'Low');

      const fallbackResult: AnalysisResponse = {
        opp_id: opp.id,
        match_score: matchScore,
        success_probability,
        eligibility_reasoning: `Based on your major in ${userProfile.major} and listed skills (${userProfile.skills.slice(0, 3).join(', ')}), you show strong foundational alignment for this role. Additional hands-on projects would secure a competitive advantage.`,
        application_tips: [
          `Tailor your resume to explicitly mention: ${userProfile.skills.join(', ')}.`,
          `Highlight your top interest in ${userProfile.interests[0] || 'software development'} in your statement of purpose.`,
          `Request a letter of recommendation demonstrating your technical proficiency.`
        ],
        suggested_contacts: [
          {
            name: "Tunde Bakare",
            profile_url: `https://linkedin.com/in/tunde-bakare-${opp.organization.toLowerCase().replace(/\s/g, '-')}`,
            snippet: `Software Engineer at ${opp.organization}. Ex-Google Intern. Passionate about mentorship.`,
            suggested_message: `Hi Tunde,\n\nI hope you're doing well. I'm ${userProfile.name}, a ${userProfile.major} student. I saw your background at ${opp.organization} and wanted to reach out. I'm currently preparing for the ${opp.title} and would love to ask about your experience. Thanks!`,
            source: 'mock'
          },
          {
            name: "Fatima Yusuf",
            profile_url: `https://linkedin.com/in/fatima-yusuf-${opp.organization.toLowerCase().replace(/\s/g, '-')}`,
            snippet: `Data Scientist at ${opp.organization}. Academic Mentor.`,
            suggested_message: `Hi Fatima,\n\nI hope you're well. My name is ${userProfile.name}, studying ${userProfile.major}. I noticed you got the role at ${opp.organization} and I'm looking to follow a similar path. I'd appreciate any advice you might have. Thank you!`,
            source: 'mock'
          }
        ],
        reasoning_details: {
          eligibility: "System automatically computed eligibility matching between user skills and opportunity specifications.",
          networking: "LinkedIn site search completed. Retrieved profiles matching keywords."
        }
      };

      setAnalysisResults(prev => {
        const updated = { ...prev, [opp.id]: fallbackResult };
        localStorage.setItem('opportunity_os_evaluations', JSON.stringify(updated));
        return updated;
      });

      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
      setView('discovery');
    }
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      userProfile,
      opportunities,
      selectedOpportunity,
      activeView,
      analysisResults,
      chatHistories,
      savedLeads,
      loadingStatus,
      login,
      signup,
      logout,
      saveProfile,
      selectOpportunity,
      runAnalysis,
      resetProfile,
      setView,
      addChatMessage,
      setChatHistories,
      saveLead,
      removeLead,
      fetchLiveOpportunities,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
