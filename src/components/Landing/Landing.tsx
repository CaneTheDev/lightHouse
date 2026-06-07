import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart2, Users, MessageSquare,
  ArrowRight, ShieldCheck, Compass,
  Globe, ChevronDown,
  GraduationCap, RefreshCw, TrendingUp, Bookmark
} from 'lucide-react';
import './Landing.css';

/* ─── Inline GitHub icon (lucide-react may not export it in all versions) ─── */
const GithubIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

/* ─── Team data (from Team information.md) ─── */
const TEAM = [
  {
    name: 'Olowookere Fawaz',
    role: 'Systems Development',
    github: 'CaneTheDev',
    initials: 'OF',
    color: '#6366f1',
  },
  {
    name: 'Emmanuel Timileyin',
    role: 'Back-end Developer',
    github: 'Emrys2404',
    initials: 'ET',
    color: '#0ea5e9',
  },
  {
    name: 'AbdulRahman Farri',
    role: 'Product Manager',
    github: 'abdulrahmanfarri-cpu',
    initials: 'AF',
    color: '#10b981',
  },
  {
    name: 'Usman Mubarak Oladimeji',
    role: 'Front-end Developer',
    github: 'mubus133',
    initials: 'UO',
    color: '#f59e0b',
  },
];

/* ─── Features ─── */
const FEATURES = [
  {
    icon: <ShieldCheck size={22} />,
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
    title: 'Privacy-First Resume Reader',
    desc:
      'Your CV is parsed entirely inside your browser. No raw files are ever sent to an external server  OCR and PDF parsing happen locally via Tesseract.js and PDF.js.',
  },
  {
    icon: <Globe size={22} />,
    color: '#0ea5e9',
    bg: 'rgba(14,165,233,0.1)',
    title: 'Live Opportunity Discovery',
    desc:
      'The Discovery Agent scours the live web in real time via Tavily, returning active scholarships, fellowships, internships, and jobs matched to your major, skills, and location.',
  },
  {
    icon: <BarChart2 size={22} />,
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    title: 'Dual-Branch Fit Analysis',
    desc:
      'Two concurrent AI agents evaluate your eligibility (Match Score 0–100) and simultaneously discover real professionals at the target company for warm outreach.',
  },
  {
    icon: <Users size={22} />,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    title: 'Tailored Networking Outreach',
    desc:
      'The system scrapes LinkedIn and GitHub for actual contacts at target organisations, then generates a copy-pasteable personalised message for each  ready to send.',
  },
  {
    icon: <MessageSquare size={22} />,
    color: '#ec4899',
    bg: 'rgba(236,72,153,0.1)',
    title: 'Stateful AI Career Coach',
    desc:
      'A persistent chatbot with awareness of your full profile and current opportunity. It can search the live web inside the chat to fetch fresh job links and interview tips.',
  },
  {
    icon: <Bookmark size={22} />,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,0.1)',
    title: 'Saved Opportunities Library',
    desc:
      'Bookmark promising opportunities as you discover them. Your saved list persists across sessions so you can revisit and compare later.',
  },
];

/* ─── How it works steps ─── */
const STEPS = [
  {
    num: '01',
    title: 'Upload Your CV',
    desc: 'Drop your PDF or image resume. The app reads it in-browser and builds your profile  no data leaves your device.',
  },
  {
    num: '02',
    title: 'Discover Opportunities',
    desc: 'Choose a category (internship, fellowship, scholarship, job) and let the live Discovery Agent fetch relevant listings from the web.',
  },
  {
    num: '03',
    title: 'Analyse Your Fit',
    desc: 'Click any opportunity to trigger the dual-branch AI. Get a match score, eligibility breakdown, and resume tips in seconds.',
  },
  {
    num: '04',
    title: 'Network & Apply',
    desc: 'Copy your personalised outreach message, connect with professionals on LinkedIn or GitHub, and land warm referrals.',
  },
];

/* ─── Animated counter ─── */
function Counter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          let start = 0;
          const duration = 1400;
          const step = (timestamp: number) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            setVal(Math.floor(progress * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

/* ─── Component ─── */
const Landing: React.FC = () => {
  const { setView } = useApp();

  return (
    <div className="landing-root">
      {/* ── Ambient blobs ── */}
      <div className="landing-blob landing-blob--pink" />
      <div className="landing-blob landing-blob--blue" />
      <div className="landing-blob landing-blob--purple" />

      {/* ══════════════ NAV ══════════════ */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-nav-logo">
            <span className="landing-nav-logo-icon">≠</span>
            OpportunityOS
          </div>
          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link">Features</a>
            <a href="#how-it-works" className="landing-nav-link">How It Works</a>
            <a href="#audience" className="landing-nav-link">Who It's For</a>
            <a href="#team" className="landing-nav-link">Team</a>
            <a
              href="https://github.com/CaneTheDev/lightHouse"
              target="_blank"
              rel="noopener noreferrer"
              className="landing-nav-link landing-nav-link--icon"
              title="GitHub Repository"
            >
              <GithubIcon size={18} />
            </a>
          </div>
          <button
            id="landing-cta-nav"
            className="btn-primary landing-nav-cta"
            onClick={() => setView('login')}
          >
            Launch App <ArrowRight size={15} />
          </button>
        </div>
      </nav>

      {/* ══════════════ HERO ══════════════ */}
      <section className="landing-hero">
        <div className="landing-section-inner landing-hero-inner">
          <span className="landing-badge">
            <Compass size={13} /> &nbsp;Intelligent Multi-Agent Career Platform
          </span>

          <h1 className="landing-hero-heading">
            Your AI-Powered
            <br />
            <span className="landing-hero-highlight">Opportunity Engine</span>
          </h1>

          <p className="landing-hero-sub">
            OpportunityOS discovers live internships, fellowships, scholarships, and jobs
            from the web  then runs a dual AI analysis on your fit, generates warm
            networking messages, and connects you to a real-time Career Coach.
          </p>

          <div className="landing-hero-actions">
            <button
              id="landing-hero-primary-btn"
              className="btn-primary landing-hero-btn-primary"
              onClick={() => setView('login')}
            >
              Get Started Free <ArrowRight size={16} />
            </button>
            <a
              href="https://github.com/CaneTheDev/lightHouse"
              target="_blank"
              rel="noopener noreferrer"
              className="landing-hero-btn-ghost"
              id="landing-hero-github-btn"
            >
              <GithubIcon size={16} /> View on GitHub
            </a>
          </div>

          <a href="#features" className="landing-hero-scroll-hint">
            <ChevronDown size={20} />
          </a>
        </div>
      </section>

      {/* ══════════════ STATS BAR ══════════════ */}
      <section className="landing-stats" id="stats">
        <div className="landing-section-inner">
          <div className="landing-stats-grid">
            <div className="landing-stat">
              <div className="landing-stat-value">
                <Counter target={4} />
              </div>
              <div className="landing-stat-label">AI Agents</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-value">
                <Counter target={100} suffix="%" />
              </div>
              <div className="landing-stat-label">In-Browser Privacy</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-value">Real-Time</div>
              <div className="landing-stat-label">Web Discovery</div>
            </div>
            <div className="landing-stat">
              <div className="landing-stat-value">Zero</div>
              <div className="landing-stat-label">Manual Searching</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ FEATURES ══════════════ */}
      <section className="landing-section" id="features">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <h2 className="landing-section-title">Everything You Need to Land Your Dream Role</h2>
            <p className="landing-section-sub">
              Five intelligent capabilities working together to automate the tedious parts of
              your career journey.
            </p>
          </div>

          <div className="landing-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="landing-feature-card">
                <div
                  className="landing-feature-icon"
                  style={{ background: f.bg, color: f.color }}
                >
                  {f.icon}
                </div>
                <h3 className="landing-feature-title">{f.title}</h3>
                <p className="landing-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ HOW IT WORKS ══════════════ */}
      <section className="landing-section landing-section--alt" id="how-it-works">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <h2 className="landing-section-title">How It Works</h2>
            <p className="landing-section-sub">
              From resume upload to warm introduction  four simple steps powered by AI.
            </p>
          </div>

          <div className="landing-steps">
            {STEPS.map((step, i) => (
              <div key={i} className="landing-step">
                <div className="landing-step-num">{step.num}</div>
                <div className="landing-step-content">
                  <h3 className="landing-step-title">{step.title}</h3>
                  <p className="landing-step-desc">{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="landing-step-connector" aria-hidden="true" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ══════════════ WHO THIS IS FOR ══════════════ */}
      <section className="landing-section" id="audience">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <h2 className="landing-section-title">Who This Is For</h2>
            <p className="landing-section-sub">
              Whether you are hunting for your first break or pivoting into something new,
              OpportunityOS meets you where you are.
            </p>
          </div>

          <div className="landing-audience-grid">
            <div className="landing-audience-card">
              <div className="landing-feature-icon" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                <GraduationCap size={22} />
              </div>
              <h3 className="landing-audience-card-title">Students &amp; Grads</h3>
              <p className="landing-audience-card-desc">
                Find scholarships, fellowships, and internships matched to your major and
                skills  no more scrolling through spreadsheets.
              </p>
            </div>
            <div className="landing-audience-card">
              <div className="landing-feature-icon" style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899' }}>
                <RefreshCw size={22} />
              </div>
              <h3 className="landing-audience-card-title">Career Switchers</h3>
              <p className="landing-audience-card-desc">
                Discover entry points into your target industry and get warm introductions
                to insiders who can open doors.
              </p>
            </div>
            <div className="landing-audience-card">
              <div className="landing-feature-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                <TrendingUp size={22} />
              </div>
              <h3 className="landing-audience-card-title">Early-Career Pros</h3>
              <p className="landing-audience-card-desc">
                Skip the cold application queue. Let our dual AI analyse your fit and
                generate personalised outreach for real connections.
              </p>
            </div>
            <div className="landing-audience-card">
              <div className="landing-feature-icon" style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}>
                <Globe size={22} />
              </div>
              <h3 className="landing-audience-card-title">Global Seekers</h3>
              <p className="landing-audience-card-desc">
                Search across countries and continents without location bias. Your
                opportunity is out there  we help you find it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ TEAM ══════════════ */}
      <section className="landing-section landing-section--alt" id="team">
        <div className="landing-section-inner">
          <div className="landing-section-header">
            <h2 className="landing-section-title">Meet the Team</h2>
            <p className="landing-section-sub">
              Four engineers and a product manager who built OpportunityOS from the ground up.
            </p>
          </div>

          <div className="landing-team-grid">
            {TEAM.map((member, i) => (
              <div key={i} className="landing-team-card">
                <div
                  className="landing-team-avatar"
                  style={{ background: member.color }}
                >
                  {member.initials}
                </div>
                <div className="landing-team-info">
                  <div className="landing-team-name">{member.name}</div>
                  <div className="landing-team-role">{member.role}</div>
                  <a
                    href={`https://github.com/${member.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="landing-team-github"
                    title={`@${member.github} on GitHub`}
                  >
                    <GithubIcon size={14} /> @{member.github}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════ FINAL CTA ══════════════ */}
      <section className="landing-cta-section">
        <div className="landing-section-inner landing-cta-inner">
          <h2 className="landing-cta-title">Ready to Accelerate Your Career?</h2>
          <p className="landing-cta-sub">
            Sign up in seconds, upload your CV, and let OpportunityOS find and analyse
            your next big opportunity.
          </p>
          <div className="landing-cta-actions">
            <button
              id="landing-final-cta-btn"
              className="btn-primary landing-cta-btn"
              onClick={() => setView('login')}
            >
              Launch OpportunityOS <ArrowRight size={16} />
            </button>
            <a
              href="https://github.com/CaneTheDev/lightHouse"
              target="_blank"
              rel="noopener noreferrer"
              className="landing-cta-ghost"
              id="landing-final-github-btn"
            >
              <GithubIcon size={16} /> Star on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="landing-footer">
        <div className="landing-section-inner landing-footer-inner">
          <div className="landing-footer-logo">
            <span>≠</span> OpportunityOS
          </div>
          <p className="landing-footer-copy">
            Built with ❤ by the OpportunityOS team ·{' '}
            <a
              href="https://github.com/CaneTheDev/lightHouse"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Source on GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
