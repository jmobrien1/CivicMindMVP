import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

export interface OCRResult {
  text: string;
  confidence: number;
}

export async function extractTextFromImage(imageBuffer: Buffer): Promise<OCRResult> {
  try {
    const processedImage = await sharp(imageBuffer)
      .grayscale()
      .normalize()
      .toBuffer();

    const worker = await createWorker('eng');
    
    const { data: { text, confidence } } = await worker.recognize(processedImage);
    
    await worker.terminate();

    return {
      text: text.trim(),
      confidence: Math.round(confidence),
    };
  } catch (error) {
    console.error("OCR processing error:", error);
    throw new Error("Failed to extract text from image");
  }
}

export async function isImageFile(filename: string): Promise<boolean> {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  return imageExtensions.includes(ext);
}
