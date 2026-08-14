/**
 * useShipping Hook
 * 
 * React hook for shipping calculations and zone detection
 */

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Determine API base URL based on environment
const getApiBaseUrl = (): string => {
  // In development, use Vite proxy
  if (import.meta.env.DEV) {
    return '/api';
  }

  // In production, use environment variable or default to /api
  return import.meta.env.VITE_API_URL || '/api';
};

const API_URL = getApiBaseUrl();

export interface ShippingAddress {
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface ShippingCalculation {
  zone: {
    id: string;
    name: string;
    description: string;
  };
  baseRate: number;
  shippingCost: number;
  isFreeShipping: boolean;
  freeShippingThreshold: number;
  amountToFreeShipping: number;
  estimatedDelivery: {
    min: number;
    max: number;
    minDate: string;
    maxDate: string;
  };
  courierPartner: string;
}

export interface ShippingZone {
  id: string;
  name: string;
  description: string;
  countries: string[];
  baseRate: number;
  freeShippingThreshold: number;
  estimatedDeliveryDays: {
    min: number;
    max: number;
  };
}

export function useShipping() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shippingCalculation, setShippingCalculation] = useState<ShippingCalculation | null>(null);
  const [availableZones, setAvailableZones] = useState<ShippingZone[]>([]);

  /**
   * Calculate shipping cost for an address
   */
  const calculateShipping = useCallback(async (
    address: ShippingAddress,
    orderTotal: number
  ): Promise<ShippingCalculation | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_URL}/shipping/calculate`, {
        address,
        orderTotal
      });

      if (response.data.success) {
        const calculation = response.data.data;
        setShippingCalculation(calculation);
        return calculation;
      } else {
        setError(response.data.message || 'Failed to calculate shipping');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to calculate shipping cost';
      setError(errorMessage);
      console.error('Error calculating shipping:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get shipping information for display
   */
  const getShippingInfo = useCallback(async (
    address: ShippingAddress,
    orderTotal: number
  ) => {
    try {
      const response = await axios.post(`${API_URL}/shipping/info`, {
        address,
        orderTotal
      });

      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (err) {
      console.error('Error getting shipping info:', err);
      return null;
    }
  }, []);

  /**
   * Detect shipping zone for an address
   */
  const detectZone = useCallback(async (address: ShippingAddress) => {
    try {
      const response = await axios.post(`${API_URL}/shipping/detect-zone`, {
        address
      });

      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (err) {
      console.error('Error detecting zone:', err);
      return null;
    }
  }, []);

  /**
   * Validate shipping address
   */
  const validateAddress = useCallback(async (address: ShippingAddress) => {
    try {
      const response = await axios.post(`${API_URL}/shipping/validate-address`, {
        address
      });

      if (response.data.success) {
        return response.data.data;
      }
      return { isValid: false, errors: ['Failed to validate address'] };
    } catch (err) {
      console.error('Error validating address:', err);
      return { isValid: false, errors: ['Failed to validate address'] };
    }
  }, []);

  /**
   * Check if address is serviceable
   */
  const checkServiceability = useCallback(async (address: ShippingAddress) => {
    try {
      const response = await axios.post(`${API_URL}/shipping/check-serviceability`, {
        address
      });

      if (response.data.success) {
        return response.data.data;
      }
      return { serviceable: false, message: 'Failed to check serviceability' };
    } catch (err) {
      console.error('Error checking serviceability:', err);
      return { serviceable: false, message: 'Failed to check serviceability' };
    }
  }, []);

  /**
   * Get all available shipping zones
   */
  const fetchAvailableZones = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/shipping/zones`);

      if (response.data.success) {
        setAvailableZones(response.data.data);
        return response.data.data;
      }
      return [];
    } catch (err) {
      console.error('Error fetching shipping zones:', err);
      return [];
    }
  }, []);

  /**
   * Get shipping configuration
   */
  const getShippingConfig = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/shipping/config`);

      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (err) {
      console.error('Error getting shipping config:', err);
      return null;
    }
  }, []);

  /**
   * Calculate shipping cost based on state (simplified for checkout)
   */
  const calculateShippingByState = useCallback((
    state: string,
    orderTotal: number
  ): { cost: number; isFree: boolean } => {
    const freeShippingThreshold = 2000;
    
    // Check if Kashmir
    const isKashmir = state.toLowerCase().includes('kashmir') || 
                      state.toLowerCase().includes('j&k') ||
                      state.toLowerCase().includes('ladakh');
    
    const baseRate = 5;
    const isFree = orderTotal >= freeShippingThreshold;
    
    return {
      cost: isFree ? 0 : baseRate,
      isFree
    };
  }, []);

  return {
    loading,
    error,
    shippingCalculation,
    availableZones,
    calculateShipping,
    getShippingInfo,
    detectZone,
    validateAddress,
    checkServiceability,
    fetchAvailableZones,
    getShippingConfig,
    calculateShippingByState
  };
}

/**
 * Hook for real-time shipping calculation as user types
 */
export function useRealtimeShipping(
  address: ShippingAddress | null,
  orderTotal: number,
  debounceMs: number = 500
) {
  const { calculateShipping } = useShipping();
  const [shipping, setShipping] = useState<ShippingCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!address || !address.city || !address.state || !address.country) {
      setShipping(null);
      return;
    }

    setIsCalculating(true);
    const timer = setTimeout(async () => {
      const result = await calculateShipping(address, orderTotal);
      setShipping(result);
      setIsCalculating(false);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [address?.city, address?.state, address?.country, address?.postalCode, orderTotal, debounceMs, calculateShipping]);

  return { shipping, isCalculating };
}

