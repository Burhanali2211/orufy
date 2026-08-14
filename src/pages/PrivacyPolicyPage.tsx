import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Database, Server, UserCheck } from 'lucide-react';
import { ContactInfoSection } from '../components/Legal/ContactInfoSection';

import { useSettings } from '../contexts/SettingsContext';

const PrivacyPolicyPage: React.FC = () => {
  const { getSiteSetting } = useSettings();
  const siteName = getSiteSetting('site_name') || 'Our Store';

  const sections = [
    {
      icon: Database,
      title: '1. Information We Collect',
      content: [
        {
          subtitle: 'Personal Identification Data',
          text: 'When you register an account, place an order, or contact us, we collect personal information such as your full name, email address, mobile phone number, shipping address, and billing details.'
        },
        {
          subtitle: 'Payment Processing Data',
          text: `All payment information is processed directly by PCI-DSS certified payment gateways (Razorpay). ${siteName} does not store, capture, or retain raw credit card numbers, CVVs, or net banking passwords.`
        },
        {
          subtitle: 'Technical & Usage Telemetry',
          text: 'We collect anonymized browser data, device types, IP addresses, cookie identifiers, and navigation pages to ensure website stability, prevent security threats, and optimize shopping experiences.'
        }
      ]
    },
    {
      icon: Lock,
      title: '2. How We Use Your Personal Data',
      content: [
        {
          subtitle: 'Fulfillment & Order Communications',
          text: 'Your personal details are used strictly to process orders, generate invoices, coordinate shipping with logistics partners, send transactional SMS/email updates, and handle customer support inquiries.'
        },
        {
          subtitle: 'Legal & Regulatory Compliance',
          text: 'We maintain transactional records as required under Indian GST law, Tax Laws, and the Information Technology Act 2000.'
        },
        {
          subtitle: 'Strict No-Sale Guarantee',
          text: `${siteName} DOES NOT SELL, RENT, BARTER, OR LEASE your personal information or email addresses to third-party brokers or advertisers for commercial gain.`
        }
      ]
    },
    {
      icon: Shield,
      title: '3. Data Security & Storage Architecture',
      content: [
        {
          subtitle: 'SSL/TLS Encryption Standards',
          text: 'All data exchanged between your browser and our store servers is secured using 256-bit SSL (Secure Sockets Layer) encryption.'
        },
        {
          subtitle: 'Restricted Access Control',
          text: 'Access to customer database records is strictly restricted to authorized system operators on a need-to-know basis behind multi-factor authenticated database firewalls.'
        }
      ]
    },
    {
      icon: Eye,
      title: '4. Third-Party Service Integrations',
      content: [
        {
          subtitle: 'Authorized Service Partners',
          text: 'We only share relevant customer data (such as delivery address and contact phone number) with verified delivery logistics partners (e.g. Blue Dart, Delhivery, DTDC) and transactional email providers solely to fulfill your orders.'
        },
        {
          subtitle: 'Legal Disclosures',
          text: 'We may disclose personal data if required to do so by applicable law, court order, or governmental authority pursuant to lawful proceedings.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-stone-900 text-white py-20 border-b border-stone-800"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block p-4 bg-white/10 rounded-2xl mb-6"
          >
            <Shield className="w-12 h-12 text-stone-200" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold mb-4 font-serif"
          >
            Privacy Policy
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-stone-300 max-w-2xl mx-auto"
          >
            How {siteName} collects, protects, and respects your personal data.
          </motion.p>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-stone-400 mt-4 tracking-wider uppercase font-semibold"
          >
            Last Updated: January 2025 | Compliant with DPDP Act 2023 & IT Act 2000
          </motion.p>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Introduction */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-stone-900 mb-4 font-serif">Commitment to Data Privacy</h2>
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8 mb-8 text-stone-600 leading-relaxed text-sm sm:text-base">
          <p className="mb-4">
            At <strong>{siteName}</strong>, we respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy outlines our data collection, storage, and usage practices in compliance with the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and other applicable Indian privacy laws.
          </p>
          <p>
            By continuing to browse our website, creating an account, or placing an order, you expressly consent to the collection and use of your data as described in this policy.
          </p>
        </div>
        </motion.div>

        {/* Main Sections */}
        {sections.map((section, index) => (
          <motion.div
            key={index}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 + index * 0.1 }}
            className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs p-8 mb-8"
          >
            <div className="flex items-center mb-6">
              <div className="p-3 bg-stone-100 rounded-xl mr-4 text-stone-800">
                <section.icon className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-serif">{section.title}</h2>
            </div>
            
            {section.content.map((item, idx) => (
              <div key={idx} className="mb-6 last:mb-0">
                <h3 className="text-base font-bold text-stone-900 mb-2">{item.subtitle}</h3>
                <p className="text-stone-600 leading-relaxed text-sm">{item.text}</p>
              </div>
            ))}
          </motion.div>
        ))}

        {/* Customer Data Rights */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs p-8 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 bg-stone-100 rounded-xl mr-4 text-stone-800">
              <UserCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 font-serif">5. Your Data Subject Rights</h2>
          </div>
          <div className="space-y-4 text-sm text-stone-600">
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 bg-stone-900 rounded-full mt-2 flex-shrink-0" />
              <p><strong>Right to Access:</strong> You may request a copy of the personal information stored in your account profile.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 bg-stone-900 rounded-full mt-2 flex-shrink-0" />
              <p><strong>Right to Rectification:</strong> You can update or correct inaccurate address details via your account settings page.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-2 h-2 bg-stone-900 rounded-full mt-2 flex-shrink-0" />
              <p><strong>Right to Erasure / Account Deletion:</strong> You may request account deletion by emailing <span className="font-semibold text-stone-900">support@aligarhattarhouse.com</span> (subject to statutory tax retention laws).</p>
            </div>
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <ContactInfoSection
            title="Privacy Inquiries & Data Protection Contact"
            description="If you have any questions regarding this Privacy Policy or wish to exercise your data protection rights:"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
