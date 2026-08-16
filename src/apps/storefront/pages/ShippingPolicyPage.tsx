import React from 'react';
import { motion } from 'framer-motion';
import { Truck, MapPin, Clock, IndianRupee, Globe, Package } from 'lucide-react';
import { ContactInfoSection } from '@/shared/components/Legal/ContactInfoSection';

const ShippingPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-white to-orange-50">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gradient-to-r from-stone-600 to-stone-800 text-white py-20"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block p-4 bg-white/10 rounded-full mb-6"
          >
            <Truck className="w-16 h-16" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Shipping Policy
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-stone-100"
          >
            Fast, secure delivery of premium curated products
          </motion.p>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-stone-300 mt-4"
          >
            Last Updated: January 2025
          </motion.p>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Introduction */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Shipping Overview</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We ship our premium products across India and select international locations.
            All orders are carefully packaged in leak-proof, padded boxes to ensure your items arrive safely in pristine condition.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Orders are typically processed within 1-2 business days and shipped via trusted courier partners.
          </p>
        </motion.div>

        {/* Shipping Zones */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 bg-stone-100 rounded-lg mr-4">
              <MapPin className="w-6 h-6 text-stone-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Shipping Zones & Rates</h2>
          </div>

          {/* Kashmir */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-gray-800">Jaipur & local Rajasthan</h3>
              <span className="text-2xl font-bold text-stone-600">₹99</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600"><strong>Delivery Time:</strong> 2-3 business days</p>
              </div>
              <div>
                <p className="text-gray-600"><strong>Free Shipping:</strong> Orders above ₹999</p>
              </div>
            </div>
          </div>

          {/* Rest of India */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-gray-800">Rest of India</h3>
              <span className="text-2xl font-bold text-stone-600">₹99</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600"><strong>Metro Cities:</strong> 3-5 business days</p>
                <p className="text-gray-500 text-xs">Delhi, Mumbai, Bangalore, Chennai, Kolkata, Hyderabad</p>
              </div>
              <div>
                <p className="text-gray-600"><strong>Other Cities:</strong> 5-7 business days</p>
                <p className="text-gray-500 text-xs">Tier 2 & 3 cities</p>
              </div>
            </div>
            <div className="mt-3">
               <p className="text-gray-600"><strong>Free Shipping:</strong> Orders above ₹999</p>
            </div>
          </div>

          {/* International */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-gray-800">International Shipping</h3>
              <span className="text-2xl font-bold text-stone-600">₹1500+</span>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-600"><strong>Available Countries:</strong> UAE, Saudi Arabia, USA, UK, Canada, Australia</p>
              <p className="text-gray-600"><strong>Delivery Time:</strong> 7-14 business days</p>
              <p className="text-gray-600"><strong>Shipping Cost:</strong> Calculated based on weight and destination</p>
              <p className="text-gray-500 text-xs">
                Note: International orders may be subject to customs duties and taxes, which are the responsibility of the customer.
              </p>
            </div>
          </div>

          <div className="bg-stone-50 border-l-4 border-stone-500 p-4 rounded mt-6">
            <p className="text-orange-800 font-semibold">
              🎉 Free Shipping on all orders above ₹999 within India!
            </p>
          </div>
        </motion.div>

        {/* Processing Time */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 bg-stone-100 rounded-lg mr-4">
              <Clock className="w-6 h-6 text-stone-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Order Processing</h2>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Standard Processing</h3>
              <p className="text-gray-600">
                Orders are processed within <strong>1-2 business days</strong> (Monday-Saturday, excluding public holidays).
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Order Cutoff Time</h3>
              <p className="text-gray-600">
                Orders placed before <strong>2:00 PM IST</strong> are processed the same day. 
                Orders after 2:00 PM are processed the next business day.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Tracking Information</h3>
              <p className="text-gray-600">
                You'll receive a tracking number via email once your order ships. Track your package in real-time 
                through our website or the courier's tracking portal.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Packaging */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 bg-stone-100 rounded-lg mr-4">
              <Package className="w-6 h-6 text-stone-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Packaging & Safety</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-stone-600 rounded-full mt-2 mr-3"></div>
              <p className="text-gray-600">
                <strong>Secure Packaging:</strong> All products are wrapped in bubble wrap and placed in sturdy boxes 
                to prevent breakage during transit.
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-stone-600 rounded-full mt-2 mr-3"></div>
              <p className="text-gray-600">
                <strong>Protective Packaging:</strong> Items are carefully wrapped and placed in sturdy boxes 
                to maintain their shape and prevent damage during transit.
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-stone-600 rounded-full mt-2 mr-3"></div>
              <p className="text-gray-600">
                <strong>Discreet Packaging:</strong> Your order arrives in plain, unmarked packaging for privacy.
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-stone-600 rounded-full mt-2 mr-3"></div>
              <p className="text-gray-600">
                <strong>Gift Packaging:</strong> Free gift wrapping available on request (mention in order notes).
              </p>
            </div>
          </div>
        </motion.div>

        {/* Courier Partners */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Courier Partners</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We partner with trusted courier services to ensure safe and timely delivery:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-800">Blue Dart</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-800">Delhivery</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="font-semibold text-gray-800">DTDC</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            The courier partner is selected based on your location to ensure fastest delivery.
          </p>
        </motion.div>

        {/* Delivery Issues */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Delivery Issues</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Damaged Package</h3>
              <p className="text-gray-600">
                If your package arrives damaged, please refuse delivery and contact us immediately. 
                We'll arrange a replacement at no extra cost.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Lost Package</h3>
              <p className="text-gray-600">
                If your package is marked as delivered but you haven't received it, please check with neighbors 
                and building security. Contact us within 48 hours and we'll investigate with the courier.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Delayed Delivery</h3>
              <p className="text-gray-600">
                While we strive to meet delivery estimates, delays may occur due to weather, holidays, or courier issues. 
                Track your package and contact us if it's significantly delayed.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Important Notes */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Important Notes</h2>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-stone-600 rounded-full mt-2 mr-3"></div>
              <p className="text-gray-600">
                Ensure your shipping address is complete and accurate. We are not responsible for delays or 
                non-delivery due to incorrect addresses.
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-stone-600 rounded-full mt-2 mr-3"></div>
              <p className="text-gray-600">
                Someone must be available to receive the package. If delivery is attempted and no one is available, 
                the courier will make additional attempts or hold the package for pickup.
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-stone-600 rounded-full mt-2 mr-3"></div>
              <p className="text-gray-600">
                We do not ship to PO Boxes. Please provide a physical street address.
              </p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-stone-600 rounded-full mt-2 mr-3"></div>
              <p className="text-gray-600">
                Delivery times are estimates and not guaranteed. Actual delivery may vary based on location and circumstances.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          <ContactInfoSection
            title="Questions About Shipping?"
            description="Our customer service team is here to help with any shipping-related questions."
            className="from-stone-600 to-stone-800"
            showWhatsApp={true}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default ShippingPolicyPage;

