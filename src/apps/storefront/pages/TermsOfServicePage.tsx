import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ShoppingBag, CreditCard, Package, AlertCircle, Scale, ShieldAlert, Award } from 'lucide-react';
import { ContactInfoSection } from '@/shared/components/Legal/ContactInfoSection';

import { useSettings } from '@/shared/contexts/SettingsContext';

const TermsOfServicePage: React.FC = () => {
  const { getSiteSetting } = useSettings();
  const siteName = getSiteSetting('site_name') || 'Our Store';

  const sections = [
    {
      icon: ShoppingBag,
      title: '1. Use of Our Service & Account Integrity',
      content: [
        {
          subtitle: 'Eligibility & Legal Capacity',
          text: 'You must be at least 18 years of age or accessing under the supervision of a parent/legal guardian to make purchases. By accessing this store, you warrant that you possess full legal capacity to enter into binding contracts.'
        },
        {
          subtitle: 'Account Credentials',
          text: `You are solely responsible for safeguarding your login credentials and for any activity conducted through your account. ${siteName} reserves the right to terminate accounts, cancel orders, or restrict access at our sole discretion.`
        },
        {
          subtitle: 'Strictly Prohibited Uses',
          text: 'You agree not to use our website for any fraudulent, malicious, or unlawful purpose, including unauthorized scraping, reverse engineering, counterfeiting, reselling our branded items without prior written approval, or introducing harmful code.'
        }
      ]
    },
    {
      icon: Award,
      title: '2. Proprietary Products & Intellectual Property',
      content: [
        {
          subtitle: 'Proprietary Brand & Formulations',
          text: `All products, photography, product descriptions, logos, and digital content are the exclusive proprietary intellectual property of ${siteName}. All rights reserved under the Indian Copyright Act 1957 and Trademarks Act 1999.`
        },
        {
          subtitle: 'Prohibition of Counterfeiting & Unauthorized Resale',
          text: `Our products are sold for personal end-use only. Commercial reproduction, un-labeled decanting, unauthorized commercial distribution, or passing off counterfeit items under the ${siteName} brand is strictly prohibited and subject to civil and criminal prosecution.`
        }
      ]
    },
    {
      icon: ShieldAlert,
      title: '3. Product Disclaimer & Safety Instructions',
      content: [
        {
          subtitle: 'Fragrance & Attar Application Safety',
          text: 'Please use all products according to their provided safety guidelines and instructions.'
        },
        {
          subtitle: 'No Medical Claims',
          text: 'Our attars, essential oils, and aromatic formulations are not intended to diagnose, treat, cure, or prevent any physical or medical condition. Any descriptions of therapeutic aromas are purely traditional and informational.'
        },
        {
          subtitle: 'Natural Product Variations',
          text: 'Due to natural botanical distillation processes (e.g. Oudh, Rose, Musk distillation), subtle variations in color, density, or top-note nuances between batches may naturally occur. This reflects authentic natural sourcing and does not constitute a product defect.'
        }
      ]
    },
    {
      icon: CreditCard,
      title: '4. Pricing, Orders & Payment Security',
      content: [
        {
          subtitle: 'Order Acceptance & Right to Refuse',
          text: 'Placing an order constitutes an offer to purchase. We reserve the absolute right to accept, decline, or cancel any order at any stage prior to dispatch for reasons including inventory shortage, pricing errors, or suspected fraudulent activity.'
        },
        {
          subtitle: 'Transparent Pricing & Taxes',
          text: 'All prices are listed in Indian Rupees (₹) and include applicable taxes (GST) unless otherwise indicated. Shipping charges are calculated at checkout. Prices are subject to revision without prior notice.'
        },
        {
          subtitle: 'Encrypted Payment Processing',
          text: 'All online transactions are securely encrypted and processed through PCI-DSS compliant payment gateways (Razorpay). We do not store or process sensitive credit card numbers or banking PINs on our servers.'
        }
      ]
    },
    {
      icon: Package,
      title: '5. Shipping & Delivery Terms',
      content: [
        {
          subtitle: 'Transit Liabilities',
          text: `We ship across India and select international destinations via verified courier partners. Estimated delivery times provided at checkout are approximations. ${siteName} is not liable for logistics delays caused by weather, customs holds, or courier operational bottlenecks.`
        },
        {
          subtitle: 'Transfer of Risk & Delivery',
          text: 'Risk of loss and title for all items pass to the customer upon verified delivery by the courier partner to the address specified during order placement.'
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
            <FileText className="w-12 h-12 text-stone-200" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold mb-4 font-serif"
          >
            Terms of Service
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-stone-300 max-w-2xl mx-auto"
          >
            Comprehensive legal terms governing purchases, proprietary rights, and website usage at {siteName}.
          </motion.p>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-stone-400 mt-4 tracking-wider uppercase font-semibold"
          >
            Last Updated: January 2025 | Compliant with IT Act 2000 & Consumer Protection Rules
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
          <h2 className="text-2xl font-bold text-stone-900 mb-4 font-serif">Binding Legal Agreement</h2>
          <div className="prose prose-stone max-w-none text-stone-600 mb-12">
            <p className="text-lg leading-relaxed">
              Welcome to <strong>{siteName}</strong>. These Terms of Service ("Terms") constitute a legally binding agreement between you ("Customer", "User") and {siteName} regarding your access to and purchase of products from our official online platform.
            </p>
          </div>
          <p className="text-stone-600 leading-relaxed text-sm sm:text-base">
            By accessing, browsing, creating an account, or placing an order on this website, you acknowledge that you have read, understood, and unreservedly agree to be bound by all terms, policies, and disclaimers set forth herein.
          </p>
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

        {/* Limitation of Liability & Absolute Monetary Cap */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs p-8 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="p-3 bg-stone-100 rounded-xl mr-4 text-stone-800">
              <Scale className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-stone-900 mb-4">6. Limitation of Liability</h3>
          </div>
          <p className="text-stone-600 mb-4">
            To the maximum extent permitted by applicable Indian laws, {siteName}, its founders, officers, employees, or suppliers shall not be liable for any indirect, punitive, incidental, special, or consequential damages resulting from the use or inability to use our products or services.
          </p>
          <p className="text-stone-600">
            <strong>Monetary Cap:</strong> In any event, lawsuit, or dispute, the aggregate total liability of {siteName} arising from or related to any purchase shall strictly not exceed the net purchase price actually paid by the customer for the specific product giving rise to the claim.
          </p>
        </motion.div>

        {/* Governing Law & Exclusive Jurisdiction */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs p-8 mb-8"
        >
          <h2 className="text-2xl font-bold text-stone-900 mb-4 font-serif">7. Governing Law & Dispute Resolution</h2>
          <p className="text-stone-600 leading-relaxed text-sm mb-4">
            These Terms shall be governed by, interpreted, and enforced strictly in accordance with the laws of the Republic of India, without regard to its conflict of law principles.
          </p>
          <p className="text-stone-600 leading-relaxed text-sm">
            Any dispute, legal proceeding, or claim arising out of or in connection with these Terms, website access, or product purchases shall be subject to the exclusive jurisdiction of the competent Courts located at <strong>Aligarh, Uttar Pradesh, India</strong>.
          </p>
        </motion.div>

        {/* Contact & Grievance Officer */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <ContactInfoSection
            title="Legal & Consumer Grievance Contact"
            description="In compliance with the Information Technology Act 2000 and Consumer Protection Rules 2020, you may contact our Grievance Officer:"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
