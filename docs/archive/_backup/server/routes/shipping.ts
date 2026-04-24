/**
 * Shipping Routes
 * 
 * API endpoints for shipping calculation and zone information
 */

import express, { Request, Response } from 'express';
import {
  calculateShippingCost,
  getAvailableShippingZones,
  getShippingZoneById,
  validateShippingAddress,
  isAddressServiceable,
  getShippingInfo,
  detectShippingZone
} from '../services/shippingService';
import { SHIPPING_CONFIG } from '../config/shipping';

const router = express.Router();

/**
 * Calculate shipping cost for an address
 * POST /api/shipping/calculate
 */
router.post('/calculate', async (req: Request, res: Response) => {
  try {
    const { address, orderTotal } = req.body;

    // Validate request
    if (!address || !orderTotal) {
      return res.status(400).json({
        success: false,
        message: 'Address and order total are required'
      });
    }

    // Validate address
    const validation = validateShippingAddress(address);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shipping address',
        errors: validation.errors
      });
    }

    // Check if address is serviceable
    if (!isAddressServiceable(address)) {
      return res.status(400).json({
        success: false,
        message: 'Sorry, we do not ship to this location yet.'
      });
    }

    // Calculate shipping
    const calculation = calculateShippingCost(address, orderTotal);

    res.json({
      success: true,
      data: {
        zone: {
          id: calculation.zone.id,
          name: calculation.zone.name,
          description: calculation.zone.description
        },
        baseRate: calculation.baseRate,
        shippingCost: calculation.shippingCost,
        isFreeShipping: calculation.isFreeShipping,
        freeShippingThreshold: calculation.zone.freeShippingThreshold,
        amountToFreeShipping: Math.max(0, calculation.zone.freeShippingThreshold - orderTotal),
        estimatedDelivery: calculation.estimatedDelivery,
        courierPartner: calculation.courierPartner
      }
    });
  } catch (error) {
    console.error('Error calculating shipping:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate shipping cost'
    });
  }
});

/**
 * Get shipping information for display
 * POST /api/shipping/info
 */
router.post('/info', async (req: Request, res: Response) => {
  try {
    const { address, orderTotal } = req.body;

    if (!address || !orderTotal) {
      return res.status(400).json({
        success: false,
        message: 'Address and order total are required'
      });
    }

    const info = getShippingInfo(address, orderTotal);

    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('Error getting shipping info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get shipping information'
    });
  }
});

/**
 * Get all available shipping zones
 * GET /api/shipping/zones
 */
router.get('/zones', async (req: Request, res: Response) => {
  try {
    const zones = getAvailableShippingZones();

    res.json({
      success: true,
      data: zones.map(zone => ({
        id: zone.id,
        name: zone.name,
        description: zone.description,
        countries: zone.countries,
        baseRate: zone.baseRate,
        freeShippingThreshold: zone.freeShippingThreshold,
        estimatedDeliveryDays: zone.estimatedDeliveryDays
      }))
    });
  } catch (error) {
    console.error('Error getting shipping zones:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get shipping zones'
    });
  }
});

/**
 * Get shipping zone by ID
 * GET /api/shipping/zones/:zoneId
 */
router.get('/zones/:zoneId', async (req: Request, res: Response) => {
  try {
    const { zoneId } = req.params;
    const zone = getShippingZoneById(zoneId);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: 'Shipping zone not found'
      });
    }

    res.json({
      success: true,
      data: zone
    });
  } catch (error) {
    console.error('Error getting shipping zone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get shipping zone'
    });
  }
});

/**
 * Detect shipping zone for an address
 * POST /api/shipping/detect-zone
 */
router.post('/detect-zone', async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }

    const zone = detectShippingZone(address);

    res.json({
      success: true,
      data: {
        id: zone.id,
        name: zone.name,
        description: zone.description,
        baseRate: zone.baseRate,
        freeShippingThreshold: zone.freeShippingThreshold,
        estimatedDeliveryDays: zone.estimatedDeliveryDays
      }
    });
  } catch (error) {
    console.error('Error detecting shipping zone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect shipping zone'
    });
  }
});

/**
 * Validate shipping address
 * POST /api/shipping/validate-address
 */
router.post('/validate-address', async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }

    const validation = validateShippingAddress(address);

    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validating address:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate address'
    });
  }
});

/**
 * Check if address is serviceable
 * POST /api/shipping/check-serviceability
 */
router.post('/check-serviceability', async (req: Request, res: Response) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }

    const serviceable = isAddressServiceable(address);

    res.json({
      success: true,
      data: {
        serviceable,
        message: serviceable 
          ? 'We deliver to this location' 
          : 'Sorry, we do not ship to this location yet.'
      }
    });
  } catch (error) {
    console.error('Error checking serviceability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check serviceability'
    });
  }
});

/**
 * Get shipping configuration
 * GET /api/shipping/config
 */
router.get('/config', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        defaultFreeShippingThreshold: SHIPPING_CONFIG.DEFAULT_FREE_SHIPPING_THRESHOLD,
        defaultShippingRate: SHIPPING_CONFIG.DEFAULT_SHIPPING_RATE,
        kashmirShippingRate: SHIPPING_CONFIG.KASHMIR_SHIPPING_RATE,
        internationalBaseRate: SHIPPING_CONFIG.INTERNATIONAL_BASE_RATE,
        processingTime: SHIPPING_CONFIG.PROCESSING_TIME,
        orderCutoffTime: SHIPPING_CONFIG.ORDER_CUTOFF_TIME,
        courierPartners: SHIPPING_CONFIG.COURIER_PARTNERS
      }
    });
  } catch (error) {
    console.error('Error getting shipping config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get shipping configuration'
    });
  }
});

export default router;

