import { createWorker } from 'tesseract.js'

export async function performOCR(imageData: string) {
  console.log('Starting OCR process...');
  const worker = await createWorker();
  console.log('Worker created');
  
  await worker.reinitialize('eng');
  console.log('Language loaded');
  
  const { data: { text } } = await worker.recognize(imageData);
  console.log('OCR Result:', text);
  
  await worker.terminate();
  return text;
} 