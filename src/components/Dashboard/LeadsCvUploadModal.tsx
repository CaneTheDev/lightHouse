import type React from 'react';
import { useState, useEffect } from 'react';
import { X, FileText, Check, Loader2, Search } from 'lucide-react';
import type { ExtractionProgress } from '../Coach/useCvExtractor';

interface LeadsCvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  extractedText: string;
  isExtracting: boolean;
  progress: ExtractionProgress | null;
  onConfirm: (text: string) => void;
}

export const LeadsCvUploadModal: React.FC<LeadsCvUploadModalProps> = ({
  isOpen,
  onClose,
  fileName,
  extractedText,
  isExtracting,
  progress,
  onConfirm,
}) => {
  const [editedText, setEditedText] = useState('');

  useEffect(() => {
    if (extractedText) {
      setEditedText(extractedText);
    } else {
      setEditedText('');
    }
  }, [extractedText]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!editedText.trim()) return;
    onConfirm(editedText);
    onClose();
  };

  return (
    <div className="cv-modal-overlay">
      <div className="cv-modal">
        <div className="cv-modal-header">
          <div className="cv-modal-title">
            <div className="cv-file-icon-badge">
              <Search size={20} color="var(--primary)" />
            </div>
            <div>
              <h3>Smart Job Search via CV</h3>
              <p className="cv-modal-subtitle">Analyzing: {fileName}</p>
            </div>
          </div>
          <button type="button" className="cv-modal-close" onClick={onClose} disabled={isExtracting}>
            <X size={18} />
          </button>
        </div>

        <div className="cv-modal-body">
          {isExtracting ? (
            <div className="cv-extracting-state">
              <Loader2 size={36} className="animate-spin" style={{ color: 'var(--primary)', marginBottom: '16px' }} />
              <h4>Extracting career details...</h4>
              <p>{progress?.status || 'Reading document structure...'}</p>
              
              <div className="cv-progress-container">
                <div className="cv-progress-bar-bg">
                  <div 
                    className="cv-progress-bar-fill" 
                    style={{ width: `${(progress?.progress || 0.1) * 100}%` }}
                  />
                </div>
              </div>
              
              <span className="cv-modal-loading-note">
                Our AI is extracting your skills, education, and interests to find the best job matches.
              </span>
            </div>
          ) : (
            <>
              <div className="cv-accuracy-note" style={{ background: 'var(--bg-tag)', border: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}>
                <FileText size={15} />
                <span>Please review the extracted text. This will be used to automatically find appropriate jobs for you.</span>
              </div>

              <div className="cv-textarea-container">
                <textarea
                  className="cv-modal-preview"
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  placeholder="Review or paste your CV details here..."
                />
              </div>
            </>
          )}
        </div>

        <div className="cv-modal-footer">
          <button 
            type="button" 
            className="btn-ghost" 
            onClick={onClose} 
            disabled={isExtracting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleConfirm}
            disabled={isExtracting || !editedText.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Check size={16} />
            Find Matching Jobs
          </button>
        </div>
      </div>
    </div>
  );
};
