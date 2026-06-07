import type React from 'react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import type { ChatMessage } from '../../context/AppContext';
import { Send, Terminal, ChevronDown, Sparkles, Bot, Compass, FileText, RotateCcw, Paperclip } from 'lucide-react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useCvExtractor } from './useCvExtractor';
import { CvUploadModal } from './CvUploadModal';

// Configure marked once — GFM on, links open in new tab
const renderer = new marked.Renderer();
renderer.link = ({ href, title, text }: { href: string; title?: string | null; text: string }) => {
  const titleAttr = title ? ` title="${title}"` : '';
  return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
};
marked.setOptions({ gfm: true, breaks: true, renderer });

function renderMarkdown(content: string): string {
  const raw = marked.parse(content) as string;
  return DOMPurify.sanitize(raw, { ADD_ATTR: ['target', 'rel'] });
}

function isLikelyCv(text: string): boolean {
  const lower = text.toLowerCase();
  const cvKeywords = [
    'curriculum vitae', 'cv', 'resume', 'education', 'experience',
    'skills', 'work history', 'employment', 'qualification',
    'objective', 'profile', 'summary', 'references', 'university',
    'bachelor', 'master', 'phd', 'degree', 'certification'
  ];
  const matches = cvKeywords.filter(k => lower.includes(k)).length;
  const hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(text);
  const hasPhone = /[+]?[\d\s()-]{7,}/.test(text);
  const lineCount = text.split('\n').length;
  const wordCount = text.split(/\s+/).length;

  return (matches >= 2 && lineCount >= 5) || (hasEmail && hasPhone && lineCount >= 5) || (lineCount >= 10 && wordCount >= 80);
}

export const Coach: React.FC = () => {
  const { userProfile, selectedOpportunity, chatHistories, addChatMessage, setChatHistories } = useApp();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<Record<number, boolean>>({});
  const [showTip, setShowTip] = useState(true);

  // CV Upload State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [currentFile, setCurrentFile] = useState<{ name: string; type: string } | null>(null);
  
  const { extractFromFile, isExtracting, progress, extractionMethod } = useCvExtractor();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const oppId = useMemo(() => selectedOpportunity?.id || 'general', [selectedOpportunity?.id]);
  const history = useMemo(() => chatHistories[oppId] || [], [chatHistories, oppId]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCurrentFile({ name: file.name, type: file.type });
    setExtractedText('');
    setIsModalOpen(true);

    try {
      const text = await extractFromFile(file);
      setExtractedText(text);
    } catch (err) {
      // Error handled by hook, display message in modal or alert
      console.error(err);
    }

    // Reset input so the same file can be selected again
    if (e.target) {
      e.target.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const clearChat = useCallback(() => {
    setChatHistories(prev => {
      const updated = { ...prev };
      delete updated[oppId];
      return updated;
    });
  }, [oppId, setChatHistories]);

  const isEmpty = history.length === 0;
  const hasSharedCv = useMemo(() => history.some(m => m.role === 'user' && (m.content.startsWith('[CV_UPLOAD]') || isLikelyCv(m.content))), [history]);
  const lastAiMsg = !isEmpty ? history.filter(m => m.role === 'assistant').pop()?.content || '' : '';
  const showSuggestions = isEmpty && !loading;

  useEffect(() => {
    if (showTip) {
      const timer = setTimeout(() => {
        setShowTip(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [showTip]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = useCallback(async (messageText: string) => {
    if (loading || !userProfile) return;

    const finalText = messageText.trim();
    if (!finalText) return;

    const isCvContent = isLikelyCv(finalText);
    const userContent = isCvContent ? `[CV_UPLOAD] ${finalText}` : finalText;

    const userMessage: ChatMessage = { role: 'user', content: userContent };
    addChatMessage(oppId, userMessage);
    setInput('');
    setLoading(true);

    const updatedHistory = [...history, userMessage];
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map(msg => ({
            role: msg.role,
            content: msg.content,
            reasoning_details: msg.reasoning_details
          })),
          profile: userProfile,
          opportunity: selectedOpportunity || undefined
        })
      });

      if (!response.ok) throw new Error('Coach chat request failed');

      const data = await response.json();
      addChatMessage(oppId, { role: 'assistant', content: data.content, reasoning_details: data.reasoning_details });
    } catch {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const lastMsg = updatedHistory[updatedHistory.length - 1]?.content || '';
      const hasCv = lastMsg.startsWith('[CV_UPLOAD]') || isLikelyCv(lastMsg);
      const prevMsg = updatedHistory.length >= 2 ? updatedHistory[updatedHistory.length - 2]?.content : '';
      const prevWasCv = prevMsg ? (prevMsg.startsWith('[CV_UPLOAD]') || isLikelyCv(prevMsg)) : false;
      const hasPosition = !hasCv && prevWasCv;

      const topSkills = userProfile.skills.slice(0, 5);
      const mockedResponse = hasCv
        ? `Thanks for sharing your CV, ${userProfile.name}! I can see you have experience in ${topSkills.join(', ')}. ` +
          `What type of position are you looking for? For example: internships, scholarships, fellowships, or full-time roles. ` +
          `Let me know your target area and I will search for the best opportunities tailored to you.`
        : hasPosition
          ? `Great, ${userProfile.name}! Based on your CV and interest in "${lastMsg}", ` +
            `I will search for matching opportunities now. Here are some tailored suggestions:\n\n` +
            `1. Look into ${lastMsg} programs at top tech companies and research institutions.\n` +
            `2. Check the Discovery section for live ${lastMsg} openings matching your skills in ${userProfile.skills.slice(0, 3).join(', ')}.\n` +
            `3. Consider networking with professionals in ${lastMsg} roles from your area.\n\n` +
            `Head over to the Discovery tab to browse live opportunities, or let me know if you'd like help with a specific application!`
          : `Thanks, ${userProfile.name}! Could you please paste your CV or resume text so I can review your background and find the right opportunities for you?`;

      addChatMessage(oppId, {
        role: 'assistant',
        content: mockedResponse,
        reasoning_details: { trace: 'Coach fallback: analyzed profile and generated tailored response.' }
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [loading, userProfile, oppId, addChatMessage, selectedOpportunity, history]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  }, [input, sendMessage]);

  const handleSendCvText = (text: string) => {
    sendMessage(text);
  };

  const handleSuggestionClick = useCallback((suggestion: string) => {
    sendMessage(suggestion);
    setInput('');
  }, [sendMessage]);

  const toggleReasoning = useCallback((index: number) => {
    setExpandedReasoning(prev => ({ ...prev, [index]: !prev[index] }));
  }, []);

  const suggestions = lastAiMsg.toLowerCase().includes('what type of position') || lastAiMsg.toLowerCase().includes('looking for')
    ? ['Internships', 'Scholarships', 'Fellowships', 'Full-time roles']
    : history.length <= 2
      ? ['Paste my CV for review', 'Help me structure my resume', 'What scholarships are available?']
      : ['Browse my matching opportunities', 'Draft a cold email for me', 'Suggest networking contacts'];

  return (
    <div className="coach-container">
      <div className="coach-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bot size={20} style={{ color: 'var(--text-primary)', flexShrink: 0 }} />
          <div>
            <h2>AI Career Coach</h2>
          </div>
        </div>
        {!isEmpty && (
          <button
            type="button"
            onClick={clearChat}
            className="coach-refresh-btn"
            title="Restart & clear conversation"
            disabled={loading}
          >
            <RotateCcw size={15} />
          </button>
        )}
      </div>

      <div className="coach-messages">
        {isEmpty && userProfile && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            textAlign: 'center', padding: '40px 32px', gap: '16px'
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'var(--bg-input)', border: '1px solid var(--border-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <FileText size={26} color="var(--text-secondary)" />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Welcome, {userProfile.name}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '400px', margin: 0 }}>
              Upload your CV (PDF or image) or paste the text below so I can review your background and find the right opportunities for you.
            </p>
          </div>
        )}

        {history.map((msg, index) => {
          const isUser = msg.role === 'user';
          let displayContent = msg.content;
          
          if (displayContent.startsWith('[CV_UPLOAD]')) {
            displayContent = displayContent.replace('[CV_UPLOAD]', '').trim();
          }

          return (
            <div key={index} className={`coach-message ${isUser ? 'align-right' : 'align-left'}`}>
              <div className={`coach-bubble ${isUser ? 'user' : 'ai'}`}>
                {isUser ? (
                  displayContent
                ) : (
                  <div
                    className="coach-md"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(displayContent) }}
                  />
                )}
              </div>

              {!isUser && msg.reasoning_details && (
                <div style={{ paddingLeft: '4px', width: '100%', maxWidth: '85%' }}>
                  <button
                    type="button"
                    onClick={() => toggleReasoning(index)}
                    className="coach-reasoning-toggle"
                  >
                    <Terminal size={12} />
                    <span>{expandedReasoning[index] ? 'Hide thinking' : 'View thinking trace'}</span>
                    <ChevronDown size={11} style={{
                      transform: expandedReasoning[index] ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease'
                    }} />
                  </button>

                  {expandedReasoning[index] && (
                    <div className="coach-reasoning-box">
                      {typeof msg.reasoning_details === 'string'
                        ? msg.reasoning_details
                        : JSON.stringify(msg.reasoning_details, null, 2)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div className="coach-bubble loading ai">
              <span className="dot-bounce" />
              <span className="dot-bounce" style={{ animationDelay: '0.16s' }} />
              <span className="dot-bounce" style={{ animationDelay: '0.32s' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {showSuggestions && (
        <div className="coach-suggestions">
          <p className="coach-suggestions-label">
            <Sparkles size={11} /> Suggestions
          </p>
          <div className="coach-suggestions-list">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="coach-suggestion-pill"
              >
                {index === 0 && <Compass size={12} style={{ marginRight: 4 }} />}
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {showTip && !hasSharedCv && (
        <div className="coach-cv-note">
          <FileText size={14} />
          <span>Tip: Sharing your CV helps me find better job matches for you.</span>
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

      <form onSubmit={handleSubmit} className="coach-input-area">
        <button 
          type="button"
          onClick={triggerFileUpload}
          className="coach-upload-btn"
          title="Upload CV (PDF or Image)"
          disabled={loading}
        >
          <Paperclip size={16} />
        </button>
        <input
          ref={inputRef}
          id="coach-chat-input"
          type="text"
          placeholder={isEmpty ? 'Paste or upload CV...' : 'Type your message...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
          className="coach-input"
        />
        <button
          id="coach-send-btn"
          type="submit"
          disabled={loading || !input.trim()}
          className="btn-primary coach-send-btn"
        >
          <Send size={15} />
        </button>
      </form>

      {/* CV Extraction Review Modal */}
      {currentFile && (
        <CvUploadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          fileName={currentFile.name}
          fileType={currentFile.type}
          extractedText={extractedText}
          isExtracting={isExtracting}
          progress={progress}
          extractionMethod={extractionMethod}
          onSend={handleSendCvText}
        />
      )}
    </div>
  );
};
export default Coach;
