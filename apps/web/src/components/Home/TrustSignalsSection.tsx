import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Award, Truck, RefreshCw, CreditCard, Users, CheckCircle, Star } from 'lucide-react';

export const TrustSignalsSection: React.FC = () => {
  const trustFeatures = [
    {
      id: 'secure-protected',
      icon: Shield,
      title: "Secure & Protected",
      description: "Bank-level 256-bit SSL encryption protects your data",
      stats: "99.9% Secure",
      color: "green"
    },
    {
      id: 'quality-guaranteed',
      icon: Award,
      title: "Quality Guaranteed",
      description: "100% authentic products from verified brands",
      stats: "Verified Brands",
      color: "blue"
    },
    {
      id: 'fast-shipping',
      icon: Truck,
      title: "Fast & Fast Shipping",
      description: "Fast Shipping on orders over $50, express delivery available",
      stats: "2-Day Delivery",
      color: "purple"
    },
    {
      id: 'easy-returns',
      icon: RefreshCw,
      title: "Easy Returns",
      description: "Hassle-free 30-day return policy, no questions asked",
      stats: "30-Day Returns",
      color: "orange"
    }
  ];

  const guarantees = [
    {
      id: 'payment-protection',
      icon: CreditCard,
      title: "Payment Protection",
      description: "Your payment information is encrypted and secure"
    },
    {
      id: 'expert-support',
      icon: Users,
      title: "Expert Support",
      description: "24/7 customer service from shopping experts"
    },
    {
      id: 'satisfaction-guarantee',
      icon: CheckCircle,
      title: "Satisfaction Guarantee",
      description: "100% money-back guarantee if you're not satisfied"
    }
  ];

  const partnerLogos = [
    { name: "PayPal", logo: "https://logos-world.net/wp-content/uploads/2020/07/PayPal-Logo.png" },
    { name: "Stripe", logo: "https://logos-world.net/wp-content/uploads/2021/03/Stripe-Logo.png" },
    { name: "Visa", logo: "https://logos-world.net/wp-content/uploads/2020/04/Visa-Logo.png" },
    { name: "Mastercard", logo: "https://logos-world.net/wp-content/uploads/2020/04/Mastercard-Logo.png" },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Main Trust Features */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-gray-900 mb-6"
          >
            Shop with Complete Confidence
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Your security and satisfaction are our top priorities. Here's how we ensure a safe and enjoyable shopping experience.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {trustFeatures.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 text-center group"
            >
              <div className={`w-16 h-16 bg-${feature.color}-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`h-8 w-8 text-${feature.color}-600`} />
              </div>

              <div className={`inline-block bg-${feature.color}-50 text-${feature.color}-700 text-sm font-semibold px-3 py-1 rounded-full mb-4`}>
                {feature.stats}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>

              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Additional Guarantees */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-3xl shadow-lg p-8 lg:p-12 mb-16"
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Our Guarantees</h3>
            <p className="text-lg text-gray-600">We stand behind every purchase with these commitments</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {guarantees.map((guarantee, index) => (
              <motion.div
                key={guarantee.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start space-x-4"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <guarantee.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{guarantee.title}</h4>
                  <p className="text-gray-600">{guarantee.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Customer Stats & Social Proof */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-3xl p-8 lg:p-12 text-white text-center mb-16"
        >
          <h3 className="text-3xl font-bold mb-8">Trusted by Millions</h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-bold mb-2">1M+</div>
              <div className="text-blue-200">Happy Customers</div>
            </div>
            <div>
              <div className="flex items-center justify-center space-x-1 mb-2">
                <span className="text-4xl font-bold">4.9</span>
                <Star className="h-8 w-8 text-yellow-400 fill-current" />
              </div>
              <div className="text-blue-200">Average Rating</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-blue-200">Products Sold</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.8%</div>
              <div className="text-blue-200">Satisfaction Rate</div>
            </div>
          </div>
        </motion.div>

        {/* Payment Partners */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h3 className="text-xl font-semibold text-gray-900 mb-8">Secure Payment Partners</h3>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            {partnerLogos.map((partner, index) => (
              <motion.div
                key={partner.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 0.6, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="hover:opacity-100 transition-opacity duration-300"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="h-8 w-auto grayscale hover:grayscale-0 transition-all duration-300"
                />
              </motion.div>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-6">
            Your payment information is processed securely. We do not store credit card details.
          </p>
        </motion.div>
      </div>
    </section>
  );
};