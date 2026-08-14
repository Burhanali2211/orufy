import React from 'react';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface ContactInfoSectionProps {
  title?: string;
  description?: string;
  className?: string;
  showAddress?: boolean;
  showWhatsApp?: boolean;
}

export const ContactInfoSection: React.FC<ContactInfoSectionProps> = ({
  title = 'Contact Us',
  description,
  className = '',
  showAddress = false,
  showWhatsApp = false,
}) => {
  const { settings } = useSettings();
  const { contactInfo } = settings;

  // Get primary contact information
  const emailContact = contactInfo.find(c => c.contact_type === 'email' && c.is_primary);
  const phoneContact = contactInfo.find(c => c.contact_type === 'phone' && c.is_primary);
  const addressContact = contactInfo.find(c => c.contact_type === 'address' && c.is_primary);
  const whatsappContact = contactInfo.find(c => (c.contact_type === 'whatsapp' || c.contact_type === 'phone') && c.is_primary);

  // Fallback to any contact if primary not found
  const email = emailContact?.value || contactInfo.find(c => c.contact_type === 'email')?.value;
  const phone = phoneContact?.value || contactInfo.find(c => c.contact_type === 'phone')?.value;
  const address = addressContact?.value || contactInfo.find(c => c.contact_type === 'address')?.value;
  const whatsapp = whatsappContact?.value || phone;

  // Format phone number for tel: and WhatsApp links
  const formatPhoneForLink = (phoneNumber: string | undefined) => {
    if (!phoneNumber) return '';
    // Remove all non-digit characters except +
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    // If it doesn't start with +, assume it's Indian number and add country code
    if (!cleaned.startsWith('+')) {
      return cleaned.startsWith('91') ? `+${cleaned}` : `+91${cleaned}`;
    }
    return cleaned;
  };

  const phoneLink = formatPhoneForLink(phone);
  const whatsappLink = formatPhoneForLink(whatsapp);

  return (
    <div className={`bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-lg p-8 text-white ${className}`}>
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      {description && (
        <p className="mb-6">{description}</p>
      )}
      <div className="space-y-3">
        {email && (
          <div className="flex items-center">
            <Mail className="w-5 h-5 mr-3 flex-shrink-0" />
            <a 
              href={`mailto:${email}`} 
              className="hover:underline break-all"
            >
              {email}
            </a>
          </div>
        )}
        {phone && (
          <div className="flex items-center">
            <Phone className="w-5 h-5 mr-3 flex-shrink-0" />
            <a 
              href={`tel:${phoneLink}`} 
              className="hover:underline"
            >
              {phone}
            </a>
          </div>
        )}
        {showWhatsApp && whatsapp && (
          <div className="flex items-center">
            <MessageCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <a 
              href={`https://wa.me/${whatsappLink.replace('+', '')}`} 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {whatsapp} (WhatsApp)
            </a>
          </div>
        )}
        {showAddress && address && (
          <div className="flex items-start">
            <MapPin className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
            <p className="flex-1">{address}</p>
          </div>
        )}
      </div>
    </div>
  );
};

