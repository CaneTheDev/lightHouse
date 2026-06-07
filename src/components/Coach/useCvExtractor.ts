import { useState } from 'react';

export interface ExtractionProgress {
  status: string;
  progress: number; // 0 to 1
}

export function useCvExtractor() {
  const [isExtracting, setIsExtracting] = useState(false);
  const [progress, setProgress] = useState<ExtractionProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const extractFromFile = async (file: File): Promise<string> => {
    setIsExtracting(true);
    setProgress(null);
    setError(null);

    try {
      const fileType = file.type;
      if (fileType === 'application/pdf') {
        setProgress({ status: 'Loading PDF library...', progress: 0.1 });
        const text = await extractFromPdf(file);
        return text;
      } else if (fileType.startsWith('image/')) {
        setProgress({ status: 'Loading OCR engine...', progress: 0.1 });
        const text = await extractFromImage(file, (p) => {
          setProgress(p);
        });
        return text;
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

  const extractFromPdf = async (file: File): Promise<string> => {
    // Dynamic import of pdfjs-dist
    const pdfjs = await import('pdfjs-dist');
    
    // Set worker src from a CDN matching the installed version to ensure it works in Vite without complex configuration
    const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    
    setProgress({ status: 'Reading PDF pages...', progress: 0.4 });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      setProgress({ 
        status: `Extracting page ${i} of ${pdf.numPages}...`, 
        progress: 0.4 + (i / pdf.numPages) * 0.5 
      });
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText.trim();
  };

  const extractFromImage = async (
    file: File, 
    onProgress: (p: ExtractionProgress) => void
  ): Promise<string> => {
    // Dynamic import of tesseract.js
    const { createWorker } = await import('tesseract.js');
    
    onProgress({ status: 'Initializing OCR worker...', progress: 0.2 });
    
    // Create a worker. We specify 'eng' as language.
    const worker = await createWorker('eng');
    
    try {
      onProgress({ status: 'Analyzing image...', progress: 0.4 });
      
      const response = await worker.recognize(file, {}, {
        // We can listen to progress events
      });
      
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
    setError
  };
}
