/**
 * Utility to dynamically load Razorpay SDK
 * 
 * This ensures Razorpay scripts are only loaded when needed (on checkout/payment pages)
 * instead of loading globally on every page load.
 */

interface RazorpayOptions {
  key: string;
  amount: number;
  currency?: string;
  name?: string;
  description?: string;
  order_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  handler?: (response: any) => void;
  modal?: {
    ondismiss?: () => void;
  };
  theme?: {
    color?: string;
  };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: any) => void) => void;
}

declare global {
  interface Window {
    Razorpay: {
      new (options: RazorpayOptions): RazorpayInstance;
    };
  }
}

let razorpayScriptLoaded = false;
let razorpayLoadPromise: Promise<void> | null = null;

/**
 * Dynamically loads the Razorpay SDK script
 * Returns a promise that resolves when the script is loaded
 */
export const loadRazorpayScript = (): Promise<void> => {
  // If already loaded, return immediately
  if (razorpayScriptLoaded && window.Razorpay) {
    return Promise.resolve();
  }

  // If already loading, return the existing promise
  if (razorpayLoadPromise) {
    return razorpayLoadPromise;
  }

  // Create new promise to load the script
  razorpayLoadPromise = new Promise((resolve, reject) => {
    // Check if script already exists in DOM
    const existingScript = document.querySelector('script[src*="razorpay.com"]');
    if (existingScript) {
      // Script exists, wait for it to load
      existingScript.addEventListener('load', () => {
        razorpayScriptLoaded = true;
        resolve();
      });
      existingScript.addEventListener('error', reject);
      return;
    }

    // Create and append script tag
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      razorpayScriptLoaded = true;
      razorpayLoadPromise = null;
      resolve();
    };
    
    script.onerror = () => {
      razorpayLoadPromise = null;
      reject(new Error('Failed to load Razorpay SDK'));
    };

    document.head.appendChild(script);
  });

  return razorpayLoadPromise;
};

/**
 * Check if Razorpay is available
 */
export const isRazorpayAvailable = (): boolean => {
  return typeof window !== 'undefined' && typeof window.Razorpay !== 'undefined';
};

/**
 * Get Razorpay instance (loads script if needed)
 */
export const getRazorpayInstance = async (
  options: RazorpayOptions
): Promise<RazorpayInstance> => {
  await loadRazorpayScript();
  
  if (!window.Razorpay) {
    throw new Error('Razorpay SDK not available');
  }

  return new window.Razorpay(options);
};

