/**
 * Shipping Service
 * 
 * Handles shipping cost calculation, delivery estimates, and zone detection
 */

import {
  SHIPPING_ZONES,
  SHIPPING_CONFIG,
  INDIAN_STATES,
  ShippingZone
} from '../config/shipping';

export interface ShippingAddress {
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface ShippingCalculation {
  zone: ShippingZone;
  baseRate: number;
  shippingCost: number;
  isFreeShipping: boolean;
  estimatedDelivery: {
    min: number;
    max: number;
    minDate: string;
    maxDate: string;
  };
  courierPartner: string;
}

/**
 * Detect shipping zone based on address
 */
export function detectShippingZone(address: ShippingAddress): ShippingZone {
  const { country, state } = address;

  // For India, check state-based zones
  if (country === 'IN' || country === 'India') {
    // Check if Kashmir/J&K
    const kashmirZone = SHIPPING_ZONES.find(z => z.id === 'kashmir');
    if (kashmirZone?.states?.some(s => 
      state.toLowerCase().includes(s.toLowerCase()) ||
      s.toLowerCase().includes(state.toLowerCase())
    )) {
      return kashmirZone;
    }

    // Check if metro city
    const metroZone = SHIPPING_ZONES.find(z => z.id === 'india-metro');
    if (metroZone?.states?.some(s => 
      state.toLowerCase().includes(s.toLowerCase()) ||
      s.toLowerCase().includes(state.toLowerCase())
    )) {
      return metroZone;
    }

    // Default to rest of India
    const restIndiaZone = SHIPPING_ZONES.find(z => z.id === 'india-rest');
    if (restIndiaZone) {
      return restIndiaZone;
    }
  }

  // For international, check country code
  const internationalZone = SHIPPING_ZONES.find(z => 
    z.countries.includes(country) && z.id.startsWith('international')
  );

  if (internationalZone) {
    return internationalZone;
  }

  // Default to international-other
  const defaultInternationalZone = SHIPPING_ZONES.find(z => z.id === 'international-other');
  if (defaultInternationalZone) {
    return defaultInternationalZone;
  }

  // Fallback to rest of India
  return SHIPPING_ZONES.find(z => z.id === 'india-rest')!;
}

/**
 * Calculate shipping cost
 */
export function calculateShippingCost(
  address: ShippingAddress,
  orderTotal: number,
  weight?: number // in grams, optional for future use
): ShippingCalculation {
  const zone = detectShippingZone(address);
  
  // Check if order qualifies for free shipping
  const isFreeShipping = orderTotal >= zone.freeShippingThreshold;
  const shippingCost = isFreeShipping ? 0 : zone.baseRate;

  // Calculate estimated delivery dates
  const estimatedDelivery = calculateDeliveryEstimate(zone);

  // Select courier partner
  const courierPartner = selectCourierPartner(zone);

  return {
    zone,
    baseRate: zone.baseRate,
    shippingCost,
    isFreeShipping,
    estimatedDelivery,
    courierPartner
  };
}

/**
 * Calculate delivery estimate based on zone and current date
 */
function calculateDeliveryEstimate(zone: ShippingZone): {
  min: number;
  max: number;
  minDate: string;
  maxDate: string;
} {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Add processing time
  let processingDays = SHIPPING_CONFIG.PROCESSING_TIME.min;
  
  // If order is placed after cutoff time, add 1 day
  const cutoffHour = parseInt(SHIPPING_CONFIG.ORDER_CUTOFF_TIME.split(':')[0]);
  if (currentHour >= cutoffHour) {
    processingDays += 1;
  }

  // Calculate minimum delivery date
  const minDeliveryDate = addBusinessDays(now, processingDays + zone.estimatedDeliveryDays.min);
  const maxDeliveryDate = addBusinessDays(now, processingDays + zone.estimatedDeliveryDays.max);

  return {
    min: zone.estimatedDeliveryDays.min,
    max: zone.estimatedDeliveryDays.max,
    minDate: formatDate(minDeliveryDate),
    maxDate: formatDate(maxDeliveryDate)
  };
}

/**
 * Add business days to a date (excluding weekends and holidays)
 */
function addBusinessDays(date: Date, days: number): Date {
  const result = new Date(date);
  let addedDays = 0;

  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    
    // Check if it's a working day
    const dayOfWeek = result.getDay();
    const dateString = formatDate(result);
    
    if (SHIPPING_CONFIG.WORKING_DAYS.includes(dayOfWeek) && 
        !SHIPPING_CONFIG.HOLIDAYS.includes(dateString)) {
      addedDays++;
    }
  }

  return result;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date for display (e.g., "Jan 15, 2025")
 */
export function formatDisplayDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
}

/**
 * Select appropriate courier partner based on zone
 */
function selectCourierPartner(zone: ShippingZone): string {
  if (zone.id.startsWith('international')) {
    // For international, use DHL or FedEx
    return SHIPPING_CONFIG.COURIER_PARTNERS.international[0];
  } else {
    // For domestic, use Blue Dart or Delhivery
    return SHIPPING_CONFIG.COURIER_PARTNERS.domestic[0];
  }
}

/**
 * Get all available shipping zones
 */
export function getAvailableShippingZones(): ShippingZone[] {
  return SHIPPING_ZONES.filter(zone => zone.isActive);
}

/**
 * Get shipping zone by ID
 */
export function getShippingZoneById(zoneId: string): ShippingZone | undefined {
  return SHIPPING_ZONES.find(zone => zone.id === zoneId);
}

/**
 * Validate shipping address
 */
export function validateShippingAddress(address: ShippingAddress): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!address.city || address.city.trim().length === 0) {
    errors.push('City is required');
  }

  if (!address.state || address.state.trim().length === 0) {
    errors.push('State is required');
  }

  if (!address.country || address.country.trim().length === 0) {
    errors.push('Country is required');
  }

  if (!address.postalCode || address.postalCode.trim().length === 0) {
    errors.push('Postal code is required');
  }

  // Validate Indian PIN code format
  if ((address.country === 'IN' || address.country === 'India') && 
      address.postalCode && 
      !/^\d{6}$/.test(address.postalCode)) {
    errors.push('Invalid Indian PIN code. Must be 6 digits.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if address is serviceable
 */
export function isAddressServiceable(address: ShippingAddress): boolean {
  const zone = detectShippingZone(address);
  return zone.isActive;
}

/**
 * Get shipping info for display
 */
export function getShippingInfo(
  address: ShippingAddress,
  orderTotal: number
): {
  zoneName: string;
  shippingCost: number;
  isFreeShipping: boolean;
  freeShippingThreshold: number;
  amountToFreeShipping: number;
  deliveryEstimate: string;
  courierPartner: string;
} {
  const calculation = calculateShippingCost(address, orderTotal);
  const amountToFreeShipping = Math.max(0, calculation.zone.freeShippingThreshold - orderTotal);

  return {
    zoneName: calculation.zone.name,
    shippingCost: calculation.shippingCost,
    isFreeShipping: calculation.isFreeShipping,
    freeShippingThreshold: calculation.zone.freeShippingThreshold,
    amountToFreeShipping,
    deliveryEstimate: `${formatDisplayDate(calculation.estimatedDelivery.minDate)} - ${formatDisplayDate(calculation.estimatedDelivery.maxDate)}`,
    courierPartner: calculation.courierPartner
  };
}

