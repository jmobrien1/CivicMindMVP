import { createWorker, Worker } from 'tesseract.js';
import sharp from 'sharp';

export interface OCRResult {
  text: string;
  confidence: number;
}

class TesseractWorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private maxWorkers: number;
  private initializationPromise: Promise<void> | null = null;
  private isShuttingDown = false;

  constructor(maxWorkers: number = 2) {
    this.maxWorkers = maxWorkers;
  }

  async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      console.log(`[OCR] Initializing Tesseract worker pool with ${this.maxWorkers} workers...`);
      
      for (let i = 0; i < this.maxWorkers; i++) {
        try {
          const worker = await createWorker('eng');
          this.workers.push(worker);
          this.availableWorkers.push(worker);
          console.log(`[OCR] Worker ${i + 1}/${this.maxWorkers} initialized`);
        } catch (error) {
          console.error(`[OCR] Failed to initialize worker ${i + 1}:`, error);
        }
      }
      
      if (this.workers.length === 0) {
        console.error('[OCR] Failed to initialize any workers');
        throw new Error('Failed to initialize OCR worker pool - no workers available');
      }
      
      console.log(`[OCR] Worker pool ready with ${this.workers.length} workers`);
    })();

    return this.initializationPromise;
  }

  async getWorker(): Promise<Worker> {
    if (this.isShuttingDown) {
      throw new Error('Worker pool is shutting down');
    }

    await this.initialize();

    const startTime = Date.now();
    const timeout = 30000;

    while (this.availableWorkers.length === 0) {
      if (Date.now() - startTime > timeout) {
        throw new Error('Timeout waiting for available OCR worker');
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const worker = this.availableWorkers.pop();
    if (!worker) {
      throw new Error('No workers available');
    }

    return worker;
  }

  releaseWorker(worker: Worker): void {
    if (!this.isShuttingDown && this.workers.includes(worker)) {
      this.availableWorkers.push(worker);
    }
  }

  async shutdown(): Promise<void> {
    this.isShuttingDown = true;
    console.log('[OCR] Shutting down worker pool...');
    
    for (const worker of this.workers) {
      try {
        await worker.terminate();
      } catch (error) {
        console.error('[OCR] Error terminating worker:', error);
      }
    }
    
    this.workers = [];
    this.availableWorkers = [];
    this.initializationPromise = null;
    console.log('[OCR] Worker pool shutdown complete');
  }

  getPoolStatus(): { total: number; available: number; inUse: number } {
    return {
      total: this.workers.length,
      available: this.availableWorkers.length,
      inUse: this.workers.length - this.availableWorkers.length,
    };
  }
}

const workerPool = new TesseractWorkerPool(2);

export async function extractTextFromImage(imageBuffer: Buffer): Promise<OCRResult> {
  const startTime = Date.now();
  let worker: Worker | null = null;

  try {
    console.log('[OCR] Starting text extraction, pool status:', workerPool.getPoolStatus());

    const processedImage = await sharp(imageBuffer)
      .grayscale()
      .normalize()
      .toBuffer();

    console.log('[OCR] Image preprocessed, acquiring worker...');
    worker = await workerPool.getWorker();

    const { data: { text, confidence } } = await worker.recognize(processedImage);
    
    const processingTime = Date.now() - startTime;
    console.log(`[OCR] Text extraction successful in ${processingTime}ms, confidence: ${confidence.toFixed(1)}%`);

    return {
      text: text.trim(),
      confidence: Math.round(confidence),
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[OCR] Processing failed after ${processingTime}ms:`, error);
    
    throw new Error("Failed to extract text from image");
  } finally {
    if (worker) {
      workerPool.releaseWorker(worker);
      console.log('[OCR] Worker released, pool status:', workerPool.getPoolStatus());
    }
  }
}

export async function isImageFile(filename: string): Promise<boolean> {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return imageExtensions.includes(ext);
}

export async function shutdownOCRPool(): Promise<void> {
  await workerPool.shutdown();
}

export function getOCRPoolStatus() {
  return workerPool.getPoolStatus();
}
