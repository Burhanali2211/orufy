import { apiClient } from '@/shared/lib/apiClient';
import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettings } from '@/shared/contexts/SettingsContext';

interface FormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

export const ContactPage: React.FC = () => {
  const { settings } = useSettings();
  const contactInfo: any[] = (settings as any)?.contactInfo || [];
  const businessHours: any[] = (settings as any)?.businessHours || [];

  const [formData, setFormData] = useState<FormData>({
    name: '', email: '', phone: '', subject: '', message: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const emailContact = contactInfo.find((c: any) => c.contact_type === 'email' && c.is_primary) ||
                       contactInfo.find((c: any) => c.contact_type === 'email');
  const phoneContact = contactInfo.find((c: any) => c.contact_type === 'phone' && c.is_primary) ||
                       contactInfo.find((c: any) => c.contact_type === 'phone');
  const addressContact = contactInfo.find((c: any) => c.contact_type === 'address' && c.is_primary) ||
                         contactInfo.find((c: any) => c.contact_type === 'address');

  const email = emailContact?.value || 'info@aligarhattarhouse.com';
  const phone = phoneContact?.value || '+91-9876543210';
  const address = addressContact?.value || 'Jaipur, Rajasthan, India';

  const formatBusinessHours = () => {
    if (!businessHours || businessHours.length === 0) return 'Monday - Sunday: 10:00 AM - 9:00 PM';
    const openDays = businessHours.filter((bh: any) => bh.is_open);
    if (openDays.length === 7) {
      const firstDay = businessHours.find((bh: any) => bh.is_open);
      if (firstDay?.is_24_hours) return 'Open 24/7';
      if (firstDay?.open_time && firstDay?.close_time) {
        return `Monday - Sunday: ${firstDay.open_time} - ${firstDay.close_time}`;
      }
    }
    return 'Monday - Sunday: 10:00 AM - 9:00 PM';
  };

  const hours = formatBusinessHours();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage('');
    try {
      await apiClient.post('/contact-submissions', [{
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        status: 'new',
        created_at: new Date().toISOString(),
      }]);
      
      setSubmitStatus('success');
      setSubmitMessage('Thank you for contacting us! We will get back to you soon.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error: any) {
      console.error('Contact form error:', error);
      setSubmitStatus('error');
      setSubmitMessage(error.message || 'Failed to send message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } },
  };
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const inputBase = 'w-full px-4 py-3 border rounded-xl text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-stone-500 focus:border-transparent transition';

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero ── */}
      <div className="relative bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Contact Us
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            We'd love to hear from you. Get in touch and we'll respond as soon as possible.
          </motion.p>
        </div>
      </div>

      {/* ── Info Cards Row ── */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: MapPin, label: 'Address', value: address },
              { icon: Phone, label: 'Phone', value: phone, href: `tel:${phone}` },
              { icon: Mail, label: 'Email', value: email, href: `mailto:${email}` },
              { icon: Clock, label: 'Hours', value: hours },
            ].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col gap-2">
                <div className="w-8 h-8 bg-stone-50 rounded-lg flex items-center justify-center">
                  <Icon className="h-4 w-4 text-stone-700" />
                </div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
                {href ? (
                  <a href={href} className="text-sm text-gray-800 font-medium hover:text-stone-700 transition-colors line-clamp-2">{value}</a>
                ) : (
                  <p className="text-sm text-gray-800 font-medium line-clamp-2">{value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form + Map ── */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-10"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Form */}
            <motion.div variants={itemVariants}>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h2>

                {submitStatus === 'success' && (
                  <div className="mb-6 p-4 bg-stone-50 border border-stone-200 rounded-xl flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-stone-600 flex-shrink-0 mt-0.5" />
                     <p className="text-sm text-stone-800">{submitMessage}</p>
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">{submitMessage}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" id="name" name="name"
                      value={formData.name} onChange={handleChange}
                      placeholder="Your full name"
                      className={`${inputBase} ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email" id="email" name="email"
                      value={formData.email} onChange={handleChange}
                      placeholder="your.email@example.com"
                      className={`${inputBase} ${errors.email ? 'border-red-400' : 'border-gray-200'}`}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="tel" id="phone" name="phone"
                      value={formData.phone} onChange={handleChange}
                      placeholder="+91-1234567890"
                      className={`${inputBase} border-gray-200`}
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text" id="subject" name="subject"
                      value={formData.subject} onChange={handleChange}
                      placeholder="What is this regarding?"
                      className={`${inputBase} ${errors.subject ? 'border-red-400' : 'border-gray-200'}`}
                    />
                    {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject}</p>}
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message" name="message"
                      value={formData.message} onChange={handleChange}
                      rows={5}
                      placeholder="Tell us how we can help you..."
                      className={`${inputBase} resize-none ${errors.message ? 'border-red-400' : 'border-gray-200'}`}
                    />
                    {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gray-900 hover:bg-gray-800 active:bg-black text-white font-semibold py-3.5 px-6 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <><></> Sending…</>
                    ) : (
                      <><Send className="h-4 w-4" /> Send Message</>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Info + Map */}
            <motion.div variants={itemVariants} className="flex flex-col gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Get in Touch</h2>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  Have a question or need assistance? We're here to help. Reach out through any
                  of the channels below and we'll get back to you as soon as possible.
                </p>
                <div className="space-y-5">
                  {[
                    { icon: MapPin, label: 'Address', value: address },
                    { icon: Phone, label: 'Phone', value: phone, href: `tel:${phone}` },
                    { icon: Mail, label: 'Email', value: email, href: `mailto:${email}` },
                    { icon: Clock, label: 'Business Hours', value: hours },
                  ].map(({ icon: Icon, label, value, href }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-stone-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="h-4 w-4 text-stone-700" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-0.5">{label}</p>
                        {href ? (
                          <a href={href} className="text-sm text-gray-800 hover:text-stone-700 transition-colors whitespace-pre-line">{value}</a>
                        ) : (
                          <p className="text-sm text-gray-800 whitespace-pre-line">{value}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map */}
              <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden min-h-[220px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d227748.84976722244!2d75.7138883!3d26.8852107!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x396c4adf4c57e281%3A0xce1c63a0cf22e09!2sJaipur%2C%20Rajasthan!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                  title="Aligarh Attarsavenue Location"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
