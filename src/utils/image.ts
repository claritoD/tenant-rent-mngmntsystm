/**
 * Client-side image compression utility using HTML5 Canvas.
 * Compresses images to be under a target size (default 1MB) while maintaining decent quality.
 */
export async function compressImage(file: File, maxSizeBytes: number = 1024 * 1024): Promise<File> {
  // If the file is already smaller than the target, return it as is
  if (file.size <= maxSizeBytes) return file;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Max dimensions to prevent huge memory usage
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context failed'));
        
        ctx.drawImage(img, 0, 0, width, height);

        // Start with 0.8 quality and reduce if still too large
        const quality = 0.8;
        
        function toBlob(q: number) {
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('Compression failed'));
              
              if (blob.size > maxSizeBytes && q > 0.2) {
                // Still too big, try lower quality
                toBlob(q - 0.1);
              } else {
                // Success or reached minimum quality
                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
              }
            },
            'image/jpeg',
            q
          );
        }

        toBlob(quality);
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}
