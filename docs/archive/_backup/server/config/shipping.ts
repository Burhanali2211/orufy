/**
 * Shipping Configuration for Kashmir Perfume E-Commerce
 * 
 * This file defines shipping zones, rates, and delivery estimates
 * for Kashmir, India, and International destinations.
 */

export interface ShippingZone {
  id: string;
  name: string;
  description: string;
  countries: string[];
  states?: string[]; // For India-specific zones
  baseRate: number; // Base shipping cost in INR
  freeShippingThreshold: number; // Free shipping above this amount in INR
  estimatedDeliveryDays: {
    min: number;
    max: number;
  };
  isActive: boolean;
}

export interface ShippingRate {
  zoneId: string;
  weightBrackets: {
    maxWeight: number; // in grams
    rate: number; // in INR
  }[];
}

/**
 * Shipping Zones Configuration
 */
export const SHIPPING_ZONES: ShippingZone[] = [
  {
    id: 'kashmir',
    name: 'Kashmir & J&K',
    description: 'Jammu & Kashmir, Ladakh',
    countries: ['IN'],
    states: [
      'Jammu and Kashmir',
      'Jammu & Kashmir',
      'J&K',
      'Kashmir',
      'Ladakh'
    ],
    baseRate: 5,
    freeShippingThreshold: 2000,
    estimatedDeliveryDays: {
      min: 2,
      max: 3
    },
    isActive: true
  },
  {
    id: 'india-metro',
    name: 'India - Metro Cities',
    description: 'Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad',
    countries: ['IN'],
    states: [
      'Delhi',
      'NCR',
      'Maharashtra',
      'Karnataka',
      'Tamil Nadu',
      'West Bengal',
      'Telangana'
    ],
    baseRate: 5,
    freeShippingThreshold: 2000,
    estimatedDeliveryDays: {
      min: 3,
      max: 5
    },
    isActive: true
  },
  {
    id: 'india-rest',
    name: 'Rest of India',
    description: 'All other Indian states and territories',
    countries: ['IN'],
    states: [], // Will match any Indian state not in other zones
    baseRate: 5,
    freeShippingThreshold: 2000,
    estimatedDeliveryDays: {
      min: 5,
      max: 7
    },
    isActive: true
  },
  {
    id: 'international-gcc',
    name: 'GCC Countries',
    description: 'UAE, Saudi Arabia, Qatar, Kuwait, Bahrain, Oman',
    countries: ['AE', 'SA', 'QA', 'KW', 'BH', 'OM'],
    baseRate: 500,
    freeShippingThreshold: 5000,
    estimatedDeliveryDays: {
      min: 7,
      max: 10
    },
    isActive: true
  },
  {
    id: 'international-us-uk',
    name: 'USA & UK',
    description: 'United States and United Kingdom',
    countries: ['US', 'GB'],
    baseRate: 800,
    freeShippingThreshold: 8000,
    estimatedDeliveryDays: {
      min: 10,
      max: 14
    },
    isActive: true
  },
  {
    id: 'international-other',
    name: 'Other International',
    description: 'Canada, Australia, Europe, and other countries',
    countries: ['CA', 'AU', 'NZ', 'SG', 'MY'], // Add more as needed
    baseRate: 1000,
    freeShippingThreshold: 10000,
    estimatedDeliveryDays: {
      min: 10,
      max: 14
    },
    isActive: true
  }
];

/**
 * Weight-based shipping rates (optional, for future use)
 * Currently using flat rates, but this allows for weight-based pricing
 */
export const WEIGHT_BASED_RATES: ShippingRate[] = [
  {
    zoneId: 'kashmir',
    weightBrackets: [
      { maxWeight: 500, rate: 5 },
      { maxWeight: 1000, rate: 5 },
      { maxWeight: 2000, rate: 5 }
    ]
  },
  {
    zoneId: 'india-metro',
    weightBrackets: [
      { maxWeight: 500, rate: 5 },
      { maxWeight: 1000, rate: 5 },
      { maxWeight: 2000, rate: 5 }
    ]
  },
  {
    zoneId: 'india-rest',
    weightBrackets: [
      { maxWeight: 500, rate: 5 },
      { maxWeight: 1000, rate: 5 },
      { maxWeight: 2000, rate: 5 }
    ]
  }
];

/**
 * Shipping Configuration Constants
 */
export const SHIPPING_CONFIG = {
  // Default free shipping threshold for India
  DEFAULT_FREE_SHIPPING_THRESHOLD: 2000,
  
  // Default shipping rate for India
  DEFAULT_SHIPPING_RATE: 5,
  
  // Kashmir special rate
  KASHMIR_SHIPPING_RATE: 5,
  
  // International base rate
  INTERNATIONAL_BASE_RATE: 500,
  
  // GST rate for shipping (5% for logistics services in India)
  SHIPPING_GST_RATE: 0.05,
  
  // Maximum order weight for standard shipping (in grams)
  MAX_STANDARD_WEIGHT: 5000,
  
  // Courier partners
  COURIER_PARTNERS: {
    domestic: ['Blue Dart', 'Delhivery', 'DTDC'],
    international: ['DHL', 'FedEx', 'Aramex']
  },
  
  // Processing time (business days)
  PROCESSING_TIME: {
    min: 1,
    max: 2
  },
  
  // Order cutoff time (IST)
  ORDER_CUTOFF_TIME: '14:00', // 2:00 PM IST
  
  // Working days
  WORKING_DAYS: [1, 2, 3, 4, 5, 6], // Monday to Saturday
  
  // Holidays (will be checked against order date)
  HOLIDAYS: [
    '2025-01-26', // Republic Day
    '2025-03-14', // Holi
    '2025-08-15', // Independence Day
    '2025-10-02', // Gandhi Jayanti
    '2025-10-24', // Diwali
    '2025-12-25'  // Christmas
  ]
};

/**
 * Country codes mapping
 */
export const COUNTRY_CODES: Record<string, string> = {
  'IN': 'India',
  'AE': 'United Arab Emirates',
  'SA': 'Saudi Arabia',
  'QA': 'Qatar',
  'KW': 'Kuwait',
  'BH': 'Bahrain',
  'OM': 'Oman',
  'US': 'United States',
  'GB': 'United Kingdom',
  'CA': 'Canada',
  'AU': 'Australia',
  'NZ': 'New Zealand',
  'SG': 'Singapore',
  'MY': 'Malaysia'
};

/**
 * Indian states mapping (for zone detection)
 */
export const INDIAN_STATES: Record<string, string> = {
  'Andhra Pradesh': 'india-rest',
  'Arunachal Pradesh': 'india-rest',
  'Assam': 'india-rest',
  'Bihar': 'india-rest',
  'Chhattisgarh': 'india-rest',
  'Goa': 'india-rest',
  'Gujarat': 'india-rest',
  'Haryana': 'india-metro',
  'Himachal Pradesh': 'india-rest',
  'Jharkhand': 'india-rest',
  'Karnataka': 'india-metro',
  'Kerala': 'india-rest',
  'Madhya Pradesh': 'india-rest',
  'Maharashtra': 'india-metro',
  'Manipur': 'india-rest',
  'Meghalaya': 'india-rest',
  'Mizoram': 'india-rest',
  'Nagaland': 'india-rest',
  'Odisha': 'india-rest',
  'Punjab': 'india-rest',
  'Rajasthan': 'india-rest',
  'Sikkim': 'india-rest',
  'Tamil Nadu': 'india-metro',
  'Telangana': 'india-metro',
  'Tripura': 'india-rest',
  'Uttar Pradesh': 'india-rest',
  'Uttarakhand': 'india-rest',
  'West Bengal': 'india-metro',
  'Andaman and Nicobar Islands': 'india-rest',
  'Chandigarh': 'india-metro',
  'Dadra and Nagar Haveli and Daman and Diu': 'india-rest',
  'Delhi': 'india-metro',
  'Jammu and Kashmir': 'kashmir',
  'Ladakh': 'kashmir',
  'Lakshadweep': 'india-rest',
  'Puducherry': 'india-rest'
};

