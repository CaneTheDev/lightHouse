import type React from 'react';
import { useState, useEffect } from 'react';
import { X, FileText, AlertTriangle, Check, Loader2 } from 'lucide-react';
import type { ExtractionProgress } from './useCvExtractor';

interface CvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileType: string;
  extractedText: string;
  isExtracting: boolean;
  progress: ExtractionProgress | null;
  onSend: (text: string) => void;
}

export const CvUploadModal: React.FC<CvUploadModalProps> = ({
  isOpen,
  onClose,
  fileName,
  fileType,
  extractedText,
  isExtracting,
  progress,
  onSend,
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

  const isImage = fileType.startsWith('image/');

  const handleSend = () => {
    if (!editedText.trim()) return;
    onSend(editedText);
    onClose();
  };

  return (
    <div className="cv-modal-overlay">
      <div className="cv-modal">
        <div className="cv-modal-header">
          <div className="cv-modal-title">
            <div className="cv-file-icon-badge">
              <FileText size={20} color="var(--primary)" />
            </div>
            <div>
              <h3>Review Extracted CV Text</h3>
              <p className="cv-modal-subtitle">{fileName}</p>
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
              <h4>Extracting text locally...</h4>
              <p>{progress?.status || 'Processing file...'}</p>
              
              <div className="cv-progress-container">
                <div className="cv-progress-bar-bg">
                  <div 
                    className="cv-progress-bar-fill" 
                    style={{ width: `${(progress?.progress || 0.1) * 100}%` }}
                  />
                </div>
              </div>
              
              <span className="cv-modal-loading-note">
                {isImage 
                  ? 'First-time OCR setup might take a few seconds to load language libraries.' 
                  : 'Parsing PDF structure and contents...'}
              </span>
            </div>
          ) : (
            <>
              {isImage && (
                <div className="cv-accuracy-note">
                  <AlertTriangle size={15} />
                  <span>OCR extracted text from an image. Please review and correct any spelling mistakes or format errors below.</span>
                </div>
              )}

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
            onClick={handleSend}
            disabled={isExtracting || !editedText.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Check size={16} />
            Send to AI Coach
          </button>
        </div>
      </div>
    </div>
  );
};
