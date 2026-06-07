import { useState } from 'react';
// Vite resolves this at build time → the worker JS is served locally (no CDN needed)
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – pdfjs-dist types don't expose the ?url path but Vite handles it fine
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export interface ExtractionProgress {
  status: string;
  progress: number; // 0 to 1
}

/**
 * 'pdf-text' – embedded text was found and extracted successfully.
 * 'ocr'      – Tesseract OCR was used (image file OR scanned/image-based PDF).
 * null       – extraction not yet run.
 */
export type ExtractionMethod = 'pdf-text' | 'ocr' | null;

export function useCvExtractor() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractionMethod, setExtractionMethod] = useState<ExtractionMethod>(null);

  const extractFromFile = async (file: File): Promise<string> => {
    setIsExtracting(true);
    setProgress(null);
    setError(null);
    setExtractionMethod(null);

    try {
      const fileType = file.type;

      if (fileType === 'application/pdf') {
        setProgress({ status: 'Loading PDF library...', progress: 0.1 });
        return await extractFromPdf(file);
      } else if (fileType.startsWith('image/')) {
        setProgress({ status: 'Loading OCR engine...', progress: 0.1 });
        setExtractionMethod('ocr');
        return await extractFromImage(file, (p) => setProgress(p));
      } else {
        throw new Error('Unsupported file type. Please upload a PDF or an image.');
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to extract text from file';
      setError(errMsg);
      throw new Error(errMsg);
    } finally {
      setIsExtracting(false);
      setProgress(null);
    }
  };

  /**
   * Attempts to extract embedded text from a PDF using PDF.js.
   * Text items are grouped by Y-coordinate so each visual line is reconstructed
   * correctly, avoiding the jumbled single-stream problem.
   *
   * If the extracted text is too sparse (< 80 non-whitespace chars) the PDF is
   * almost certainly scanned / image-based. In that case we automatically fall
   * back to rendering each page on a canvas and running Tesseract OCR over it.
   */
  const extractFromPdf = async (file: File): Promise<string> => {
    const pdfjs = await import('pdfjs-dist');

    // Use the locally-bundled worker (resolved by Vite at build time via ?url import).
    // This avoids any CDN dependency and works fully offline.
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    const maxPages = Math.min(pdf.numPages, 5); // cap for performance
    let fullText = '';

    setProgress({ status: 'Reading PDF structure...', progress: 0.25 });

    for (let i = 1; i <= maxPages; i++) {
      setProgress({
        status: `Extracting page ${i} of ${maxPages}...`,
        progress: 0.25 + (i / maxPages) * 0.45,
      });

      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const items = textContent.items as any[];

      if (items.length === 0) continue;

      // ── Line reconstruction ─────────────────────────────────────────────────
      // PDF.js returns individual text "chunks" with absolute (x, y) coordinates.
      // A naive .join(' ') loses all structure.  We bucket chunks into lines by
      // their Y value (within a small tolerance) and sort each line left→right.
      const LINE_Y_TOLERANCE = 4; // px — chunks within this window share a line
      const lines: { y: number; segs: { x: number; str: string }[] }[] = [];

      for (const item of items) {
        if (!item.str) continue;
        const x: number = item.transform[4];
        const y: number = item.transform[5];
        const ry = Math.round(y);

        const existing = lines.find((l) => Math.abs(l.y - ry) < LINE_Y_TOLERANCE);
        if (existing) {
          existing.segs.push({ x, str: item.str });
        } else {
          lines.push({ y: ry, segs: [{ x, str: item.str }] });
        }
      }

      // PDF y=0 is at the bottom, so sort descending → top of page first
      lines.sort((a, b) => b.y - a.y);

      const pageText = lines
        .map((line) => {
          line.segs.sort((a, b) => a.x - b.x);
          return line.segs.map((s) => s.str).join(' ').trim();
        })
        .filter(Boolean)
        .join('\n');

      fullText += pageText + '\n\n';
    }

    const cleanedText = fullText.trim();
    const meaningfulChars = cleanedText.replace(/\s/g, '').length;

    // ── Scanned PDF fallback ────────────────────────────────────────────────
    // If the PDF has almost no embedded text it was likely created by a scanner.
    // Render each page to a canvas at 2× scale and run Tesseract OCR on it.
    if (meaningfulChars < 80) {
      setProgress({
        status: 'Scanned PDF detected — switching to OCR...',
        progress: 0.72,
      });
      setExtractionMethod('ocr');
      return await extractPdfViaOcr(pdf, maxPages);
    }

    setExtractionMethod('pdf-text');
    return cleanedText;
  };

  /**
   * Renders PDF pages to canvases and OCRs them with Tesseract.
   * Used automatically when PDF.js finds no embedded text.
   */
  const extractPdfViaOcr = async (pdf: any, maxPages: number): Promise<string> => {
    const { createWorker } = await import('tesseract.js');

    setProgress({ status: 'Initializing OCR for scanned PDF...', progress: 0.74 });
    const worker = await createWorker('eng');

    try {
      // PSM 3 = PSM_AUTO: fully automatic page segmentation with no OSD.
      // Better than SINGLE_BLOCK for multi-column CV layouts.
      await worker.setParameters({ tessedit_pageseg_mode: '3' as any });

      let allText = '';

      for (let i = 1; i <= maxPages; i++) {
        setProgress({
          status: `OCR scanning page ${i} of ${maxPages}...`,
          progress: 0.74 + (i / maxPages) * 0.24,
        });

        const page = await pdf.getPage(i);
        // 2× viewport scale gives Tesseract more pixel detail → better accuracy
        const viewport = page.getViewport({ scale: 2.0 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        await page.render({ canvasContext: ctx, viewport }).promise;

        const blob = await new Promise<Blob>((resolve) =>
          canvas.toBlob((b) => resolve(b!), 'image/png')
        );
        const imageFile = new File([blob], `page-${i}.png`, { type: 'image/png' });
        const result = await worker.recognize(imageFile);
        allText += result.data.text + '\n\n';
      }

      return allText.trim();
    } finally {
      await worker.terminate();
    }
  };

  /**
   * Runs Tesseract OCR directly on an image file.
   * PSM_AUTO handles multi-column layouts better than SINGLE_BLOCK.
   */
  const extractFromImage = async (
    file: File,
    onProgress: (p: ExtractionProgress) => void
  ): Promise<string> => {
    const { createWorker } = await import('tesseract.js');

    onProgress({ status: 'Initializing OCR worker...', progress: 0.2 });
    const worker = await createWorker('eng');

    try {
      // PSM 3 = PSM_AUTO — handles varied column layouts well
      await worker.setParameters({ tessedit_pageseg_mode: '3' as any });

      onProgress({ status: 'Analyzing document layout...', progress: 0.4 });

      const response = await worker.recognize(file);

      onProgress({ status: 'Processing complete!', progress: 1.0 });
      return response.data.text;
    } finally {
      await worker.terminate();
    }
  };

  return {
    extractFromFile,
    isExtracting,
    progress,
    error,
    extractionMethod,
    setError,
  };
}
