import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Users, ExternalLink, Clipboard, Check, UserCheck, 
  Hash
} from 'lucide-react';

export const ConnectNetwork: React.FC = () => {
  const { opportunities, analysisResults, selectedOpportunity, selectOpportunity } = useApp();
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  
  // Set selected opp from analyzed ones
  const analyzedOpps = opportunities.filter(opp => analysisResults[opp.id]);
  const activeOpp = selectedOpportunity && analysisResults[selectedOpportunity.id] 
    ? selectedOpportunity 
    : (analyzedOpps.length > 0 ? analyzedOpps[0] : null);

  const result = activeOpp ? analysisResults[activeOpp.id] : null;

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [id]: true }));
      setTimeout(() => setCopiedStates(prev => ({ ...prev, [id]: false })), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // General communities fallback if no opportunity evaluated yet
  const generalCommunities = [
    {
      platform: 'Telegram',
      name: 'Nigeria Tech Space',
      url: 'https://t.me/nigeriatechspace',
      description: 'Hub for developer updates, local tech meetups, and job postings.'
    },
    {
      platform: 'Telegram',
      name: 'GDG Lagos Developers',
      url: 'https://t.me/gdglagos',
      description: 'Google Developer Group community for framework discussions.'
    },
    {
      platform: 'Twitter/X',
      name: 'Tech Twitter Nigeria',
      url: 'https://x.com/techtwitternigeria',
      description: 'Active professional network hub with job boards and CV review threads.'
    }
  ];

  return (
    <div className="page-body">
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 className="hero-heading" style={{ fontSize: '28px', marginBottom: '6px' }}>
          Connect Network
        </h1>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
          Reach out to recommended mentors and join active developer communities.
        </p>
      </div>

      {/* Select Opportunity Dropdown */}
      {analyzedOpps.length > 0 && (
        <div className="card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Show network details for:</span>
            <select
              value={activeOpp?.id || ''}
              onChange={e => {
                const opp = opportunities.find(o => o.id === e.target.value);
                if (opp) selectOpportunity(opp);
              }}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-card)',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {analyzedOpps.map(opp => (
                <option key={opp.id} value={opp.id}>{opp.title} ({opp.organization})</option>
              ))}
            </select>
          </div>
          {activeOpp && (
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {result?.suggested_contacts.length || 0} contacts generated
            </span>
          )}
        </div>
      )}

      <div className="dashboard-grid">
        {/* Left Column: Recommended Contacts & Outreach */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: 0, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserCheck size={18} /> Recommended Mentors & Alumni
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {result && result.suggested_contacts && result.suggested_contacts.length > 0 ? (
                result.suggested_contacts.map((contact, index) => {
                  const uniqueId = `contact-net-${index}`;
                  const isCopied = !!copiedStates[uniqueId];

                  return (
                    <div key={index} style={{
                      padding: '16px', borderRadius: '12px',
                      border: '1px solid var(--border-card)',
                      background: 'var(--bg-input)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'var(--bg-card)', border: '1px solid var(--border-card)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-secondary)', flexShrink: 0
                          }}>
                            <Users size={14} />
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)' }}>{contact.name}</span>
                              {contact.source === 'github_api' ? (
                                <span style={{ fontSize: '9px', fontWeight: 600, background: 'var(--bg-tag)', border: '1px solid var(--border-card)', color: 'var(--text-secondary)', padding: '1px 5px', borderRadius: '4px' }}>GitHub</span>
                              ) : contact.source === 'mock' ? (
                                <span style={{ fontSize: '9px', fontWeight: 600, background: '#fef9c3', color: '#854d0e', padding: '1px 5px', borderRadius: '4px' }}>Sample</span>
                              ) : (
                                <span style={{ fontSize: '9px', fontWeight: 600, background: '#dbeafe', color: '#1e40af', padding: '1px 5px', borderRadius: '4px' }}>LinkedIn</span>
                              )}
                            </div>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, marginTop: '1px' }}>
                              {contact.snippet}
                            </p>
                          </div>
                        </div>
                        <a
                          href={contact.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ padding: '6px', borderRadius: '8px', border: '1px solid var(--border-card)', color: 'var(--text-muted)', display: 'flex', background: 'var(--bg-card)' }}
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>

                      <div style={{
                        padding: '10px', borderRadius: '8px',
                        border: '1px solid var(--border-card)', background: 'var(--bg-card)',
                        fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.55,
                        whiteSpace: 'pre-wrap', marginBottom: '10px'
                      }}>
                        {contact.suggested_message}
                      </div>

                      <button
                        onClick={() => handleCopy(contact.suggested_message, uniqueId)}
                        className={isCopied ? 'btn-ghost' : 'btn-primary'}
                        style={{ width: '100%', justifyContent: 'center', padding: '9px', fontSize: '12px', gap: '6px', borderRadius: '8px' }}
                      >
                        {isCopied ? (
                          <><Check size={12} /> Copied to Clipboard!</>
                        ) : (
                          <><Clipboard size={12} /> Copy Outreach Template</>
                        )}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
                  No alumni evaluation details found. Run fit analysis on opportunities in Discovery to generate targeted cold outreach lists.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Social Communities */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Hash size={18} /> Joinable Social Communities
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Participate in general professional discussion channels in your locale.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(activeOpp ? [
              {
                platform: 'Telegram',
                name: `${activeOpp.organization} Applicants Space`,
                url: `https://t.me/${activeOpp.organization.toLowerCase()}_scholars`,
                description: 'Study group forum for candidates applying to international internships.'
              },
              ...generalCommunities
            ] : generalCommunities).map((community, index) => (
              <div key={index} style={{
                padding: '12px', borderRadius: '10px',
                border: '1px solid var(--border-card)',
                background: 'var(--bg-input)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {community.platform}
                    </span>
                    <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      {community.name}
                    </h4>
                  </div>
                  <a
                    href={community.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ padding: '5px', borderRadius: '6px', border: '1px solid var(--border-card)', color: 'var(--text-muted)', display: 'flex', background: 'var(--bg-card)' }}
                  >
                    <ExternalLink size={11} />
                  </a>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                  {community.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ConnectNetwork;
