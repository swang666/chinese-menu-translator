import EXIF from 'exif-js';

export async function compressImage(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Target width (maintain aspect ratio)
      const maxWidth = 1024;
      
      // Calculate new dimensions
      let newWidth = img.width;
      let newHeight = img.height;
      
      if (newWidth > maxWidth) {
        newHeight = Math.round((maxWidth * img.height) / img.width);
        newWidth = maxWidth;
      }

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      // Draw and compress
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      // Convert to compressed JPEG
      resolve(canvas.toDataURL('image/jpeg', 0.7)); // 0.7 quality (0-1)
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageDataUrl;
  });
}

export const getImageOrientation = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    EXIF.getData(file as any, function(this: any) {
      const orientation = EXIF.getTag(this, 'Orientation');
      resolve(orientation || 1);
    });
  });
};

export const rotateImage = (base64Image: string, orientation: number): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      // Set proper canvas dimensions before transform & export
      if ([5, 6, 7, 8].indexOf(orientation) > -1) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }

      // Transform context before drawing image
      switch (orientation) {
        case 2: ctx.transform(-1, 0, 0, 1, img.width, 0); break;
        case 3: ctx.transform(-1, 0, 0, -1, img.width, img.height); break;
        case 4: ctx.transform(1, 0, 0, -1, 0, img.height); break;
        case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
        case 6: ctx.transform(0, 1, -1, 0, img.height, 0); break;
        case 7: ctx.transform(0, -1, -1, 0, img.height, img.width); break;
        case 8: ctx.transform(0, -1, 1, 0, 0, img.width); break;
        default: break;
      }

      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.src = base64Image;
  });
}; 