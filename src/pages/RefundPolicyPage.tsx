import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, CheckCircle, XCircle, Clock, Package, CreditCard } from 'lucide-react';
import { ContactInfoSection } from '../components/Legal/ContactInfoSection';
import { useSettings } from '../contexts/SettingsContext';

const RefundPolicyPage: React.FC = () => {
  const { getSiteSetting } = useSettings();
  const siteName = getSiteSetting('site_name') || 'Our Store';

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
            <RotateCcw className="w-16 h-16" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Refund & Return Policy
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-stone-100"
          >
            Your satisfaction is our priority
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment</h2>
          <p className="text-stone-600 mb-6 leading-relaxed">
            At <strong>{siteName}</strong>, we stand behind the quality of our premium products. We adhere to a strict quality control protocol to ensure you receive only authentic, premium items.
          </p>
          <p className="text-gray-600 leading-relaxed">
            Please do not ship items back without prior authorization. Unauthorized returns will be rejected at the warehouse, and {siteName} holds no liability for such parcels.
          </p>
        </motion.div>

        {/* 7-Day Return Policy */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 bg-stone-100 rounded-lg mr-4">
              <Clock className="w-6 h-6 text-stone-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">7-Day Return Window</h2>
          </div>
          <p className="text-gray-600 leading-relaxed mb-4">
            You have <strong>7 days</strong> from the date of delivery to return your product for a full refund or exchange.
          </p>
          <div className="bg-stone-50 border-l-4 border-stone-500 p-4 rounded">
            <p className="text-green-800 font-semibold">
              💡 Tip: The 7-day period starts from the delivery date, not the order date.
              </p>
          </div>
        </motion.div>

        {/* Eligible Returns */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 bg-stone-100 rounded-lg mr-4">
              <CheckCircle className="w-6 h-6 text-stone-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Eligible for Return</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-stone-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800">Unopened Products</p>
                <p className="text-gray-600">Products in original, unused condition with all tags and packaging intact</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-stone-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800">Damaged Products</p>
                <p className="text-gray-600">Products damaged during shipping (with photographic evidence)</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-stone-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800">Wrong Product</p>
                <p className="text-gray-600">If you received a different product than what you ordered</p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-stone-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800">Defective Products</p>
                <p className="text-gray-600">Products with manufacturing defects or quality issues</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Not Eligible */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 bg-red-100 rounded-lg mr-4">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Not Eligible for Return</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800">Used or Washed Items</p>
                <p className="text-gray-600">Due to hygiene reasons, items that have been used, washed or have tags removed cannot be returned</p>
              </div>
            </div>
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800">After 7 Days</p>
                <p className="text-gray-600">Returns requested after the 7-day window will not be accepted</p>
              </div>
            </div>
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800">Sale Items</p>
                <p className="text-gray-600">Products purchased during clearance sales (unless defective)</p>
              </div>
            </div>
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-600 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800">Gift Cards</p>
                <p className="text-gray-600">Gift cards and vouchers are non-refundable</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Return Process */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 bg-stone-100 rounded-lg mr-4">
              <Package className="w-6 h-6 text-stone-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">How to Return</h2>
          </div>
          <div className="space-y-6">
            <div className="flex">
              <div className="flex-shrink-0 w-10 h-10 bg-stone-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                1
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Contact Us</h3>
                <p className="text-gray-600">
                  Contact us within 7 days of delivery using the contact information provided below.
                </p>
              </div>
            </div>
            <div className="flex">
              <div className="flex-shrink-0 w-10 h-10 bg-stone-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                2
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Provide Details</h3>
                <p className="text-gray-600">
                  Share your order number, reason for return, and photos (if product is damaged or defective).
                </p>
              </div>
            </div>
            <div className="flex">
              <div className="flex-shrink-0 w-10 h-10 bg-stone-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                3
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Get Approval</h3>
                <p className="text-gray-600">
                  Our team will review your request and provide return instructions within 24-48 hours.
                </p>
              </div>
            </div>
            <div className="flex">
              <div className="flex-shrink-0 w-10 h-10 bg-stone-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                4
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Ship the Product</h3>
                <p className="text-gray-600">
                  Pack the product securely in its original packaging and ship it to the address provided. 
                  We recommend using a trackable shipping method.
                </p>
              </div>
            </div>
            <div className="flex">
              <div className="flex-shrink-0 w-10 h-10 bg-stone-600 text-white rounded-full flex items-center justify-center font-bold mr-4">
                5
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Receive Refund</h3>
                <p className="text-gray-600">
                  Once we receive and inspect the product, your refund will be processed within 5-7 business days.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Refund Method */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 bg-stone-100 rounded-lg mr-4">
              <CreditCard className="w-6 h-6 text-stone-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Refund Processing</h2>
          </div>
          <p className="text-gray-600 leading-relaxed mb-4">
            Refunds will be processed to your original payment method:
          </p>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-stone-600 rounded-full mt-2 mr-3"></div>
              <p className="text-gray-600"><strong>Credit/Debit Card:</strong> 5-7 business days</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-stone-600 rounded-full mt-2 mr-3"></div>
              <p className="text-gray-600"><strong>UPI/Net Banking:</strong> 3-5 business days</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-stone-600 rounded-full mt-2 mr-3"></div>
              <p className="text-gray-600"><strong>Wallets:</strong> 2-3 business days</p>
            </div>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded mt-6">
            <p className="text-yellow-800">
              <strong>Note:</strong> Shipping charges are non-refundable unless the return is due to our error 
              (wrong product, damaged product, etc.).
            </p>
          </div>
        </motion.div>

        {/* Exchange Policy */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Exchange Policy</h2>
            <p className="text-stone-700 leading-relaxed font-medium">
              We process refunds solely to the original method of payment (Credit Card, Debit Card, UPI, or Net Banking) used during checkout. {siteName} does NOT issue cash refunds.
            </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Return the original product following our return process</li>
            <li>Receive your refund</li>
            <li>Place a new order for the desired product</li>
          </ol>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          <ContactInfoSection
            title="Need Help with a Return?"
            description="Our customer service team is here to assist you with any return or refund questions."
            className="from-stone-600 to-stone-800"
            showWhatsApp={true}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default RefundPolicyPage;

