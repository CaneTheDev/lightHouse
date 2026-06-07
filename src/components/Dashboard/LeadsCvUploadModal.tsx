import type React from 'react';
import { useState, useEffect } from 'react';
import { X, FileText, AlertTriangle, Check, Loader2, Search, ScanLine } from 'lucide-react';
import type { ExtractionProgress, ExtractionMethod } from '../Coach/useCvExtractor';

interface LeadsCvUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  extractedText: string;
  isExtracting: boolean;
  progress: ExtractionProgress | null;
  extractionMethod: ExtractionMethod;
  onConfirm: (text: string) => void;
}

export const LeadsCvUploadModal: React.FC<LeadsCvUploadModalProps> = ({
  isOpen,
  onClose,
  fileName,
  extractedText,
  isExtracting,
  progress,
  extractionMethod,
  onConfirm,
}) => {
  const [editedText, setEditedText] = useState('');

  useEffect(() => {
    setEditedText(extractedText ?? '');
  }, [extractedText]);

  if (!isOpen) return null;

  const usedOcr = extractionMethod === 'ocr';
  // OCR triggered automatically because a PDF had no embedded text
  const isScannedPdf = usedOcr && !fileName.match(/\.(png|jpe?g|gif|webp|bmp|tiff?)$/i);
  const isSparse = !isExtracting && editedText.replace(/\s/g, '').length < 100;

  const handleConfirm = () => {
    if (!editedText.trim()) return;
    onConfirm(editedText);
    onClose();
  };

  // Dynamic loading note depending on current phase
  const loadingNote = isScannedPdf
    ? 'Scanned PDF detected — rendering pages and running OCR. This may take a moment.'
    : usedOcr
    ? 'First-time OCR setup might take a few seconds to load language libraries.'
    : 'Parsing PDF structure and reconstructing text layout...';

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
              <h4>
                {progress?.status?.toLowerCase().includes('ocr') || isScannedPdf
                  ? 'Running OCR...'
                  : 'Extracting career details...'}
              </h4>
              <p>{progress?.status || 'Reading document structure...'}</p>

              <div className="cv-progress-container">
                <div className="cv-progress-bar-bg">
                  <div
                    className="cv-progress-bar-fill"
                    style={{ width: `${(progress?.progress || 0.1) * 100}%` }}
                  />
                </div>
              </div>

              <span className="cv-modal-loading-note">{loadingNote}</span>
            </div>
          ) : (
            <>
              {/* OCR / accuracy notice */}
              {usedOcr && (
                <div className="cv-accuracy-note">
                  <ScanLine size={15} />
                  <span>
                    {isScannedPdf
                      ? 'This PDF had no embedded text, so OCR was used. Please review and correct any errors below.'
                      : 'OCR extracted text from an image. Please review and correct any errors below.'}
                  </span>
                </div>
              )}

              {/* Info banner for clean PDF extraction */}
              {!usedOcr && !isSparse && (
                <div
                  className="cv-accuracy-note"
                  style={{ background: 'var(--bg-tag)', border: '1px solid var(--border-card)', color: 'var(--text-secondary)' }}
                >
                  <FileText size={15} />
                  <span>Please review the extracted text. This will be used to automatically find appropriate jobs for you.</span>
                </div>
              )}

              {/* Sparse text warning */}
              {isSparse && (
                <div
                  className="cv-accuracy-note"
                  style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    borderColor: 'rgba(245, 158, 11, 0.3)',
                    color: '#b45309',
                  }}
                >
                  <AlertTriangle size={15} />
                  <span>
                    Very little text was extracted. Paste your CV content directly into the box below for better job matching results.
                  </span>
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
