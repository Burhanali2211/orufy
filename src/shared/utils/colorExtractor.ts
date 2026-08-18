/**
 * Intelligent Image Color & Palette Extractor
 * Uses an off-screen HTML5 canvas to sample image pixels and calculate:
 * 1. Dominant vibrant color (accent)
 * 2. Background tone & luminance
 * 3. High-contrast accessible text colors (WCAG compliant)
 * 4. Harmonious button & badge styling
 */

export interface ExtractedPalette {
  dominantColor: string; // e.g. '#1e293b'
  accentColor: string;   // e.g. '#d97706'
  contrastTextColor: string; // '#ffffff' or '#111827'
  badgeBgColor: string;  // rgba
  buttonBgColor: string; // vibrant or dark
  buttonTextColor: string;
  recommendedOverlayOpacity: number;
}

export const extractPaletteFromImage = (imageSrc: string): Promise<ExtractedPalette> => {
  return new Promise((resolve) => {
    // Default fallback palette
    const fallback: ExtractedPalette = {
      dominantColor: '#1c1917',
      accentColor: '#d97706',
      contrastTextColor: '#ffffff',
      badgeBgColor: 'rgba(255, 255, 255, 0.15)',
      buttonBgColor: '#1c1917',
      buttonTextColor: '#ffffff',
      recommendedOverlayOpacity: 45,
    };

    if (!imageSrc || typeof window === 'undefined') {
      resolve(fallback);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageSrc;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(fallback);
          return;
        }

        // Downscale to 64x64 for fast pixel sampling
        const width = 64;
        const height = 64;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        let rSum = 0, gSum = 0, bSum = 0;
        let count = 0;

        let maxVibrancy = -1;
        let vibrantR = 28, vibrantG = 25, vibrantB = 23;

        for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a < 128) continue; // Skip transparent pixels

          rSum += r;
          gSum += g;
          bSum += b;
          count++;

          // Vibrancy formula (saturation * brightness variance)
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const delta = max - min;
          const vibrancy = delta * (max / 255);

          if (vibrancy > maxVibrancy) {
            maxVibrancy = vibrancy;
            vibrantR = r;
            vibrantG = g;
            vibrantB = b;
          }
        }

        if (count === 0) {
          resolve(fallback);
          return;
        }

        const avgR = Math.round(rSum / count);
        const avgG = Math.round(gSum / count);
        const avgB = Math.round(bSum / count);

        // Calculate relative luminance (standard sRGB formula)
        const luminance = (0.299 * avgR + 0.587 * avgG + 0.114 * avgB) / 255;
        const isDarkImage = luminance < 0.5;

        const rgbToHex = (r: number, g: number, b: number) =>
          '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

        const dominantHex = rgbToHex(avgR, avgG, avgB);
        const vibrantHex = rgbToHex(vibrantR, vibrantG, vibrantB);

        // Determine accessible button and text colors
        const vibrantLuminance = (0.299 * vibrantR + 0.587 * vibrantG + 0.114 * vibrantB) / 255;
        const buttonTextColor = vibrantLuminance > 0.6 ? '#111827' : '#ffffff';
        const contrastTextColor = isDarkImage ? '#ffffff' : '#111827';

        resolve({
          dominantColor: dominantHex,
          accentColor: vibrantHex,
          contrastTextColor,
          badgeBgColor: isDarkImage ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
          buttonBgColor: vibrantHex,
          buttonTextColor,
          recommendedOverlayOpacity: isDarkImage ? 35 : 55,
        });
      } catch (err) {
        console.warn('Image palette extraction error:', err);
        resolve(fallback);
      }
    };

    img.onerror = () => {
      resolve(fallback);
    };
  });
};
