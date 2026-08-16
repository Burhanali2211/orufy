import React from 'react';
import { X } from 'lucide-react';
import { useNotification } from '@/shared/contexts/NotificationContext';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/shared/lib/apiClient';
import { FormInput, FormSelect, FormCheckbox } from '@/shared/components/Common/FormInput';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export interface ContactInfo {
  id?: string;
  contact_type: string;
  label: string;
  value: string;
  is_primary: boolean;
  is_active: boolean;
  display_order: number;
  icon_name: string;
  additional_info: Record<string, unknown>;
}

interface ContactInfoFormProps {
  contact: ContactInfo | null;
  onClose: () => void;
}

const contactTypes = [
  { value: 'phone', label: 'Phone Number', icon: 'Phone' },
  { value: 'email', label: 'Email Address', icon: 'Mail' },
  { value: 'address', label: 'Physical Address', icon: 'MapPin' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'MessageCircle' },
  { value: 'support', label: 'Support', icon: 'Headphones' },
];

const schema = z.object({
  contact_type: z.string().min(1, 'Contact type is required'),
  label: z.string().min(1, 'Label is required'),
  value: z.string().min(1, 'Value is required'),
  is_primary: z.boolean().default(false),
  is_active: z.boolean().default(true),
  display_order: z.coerce.number().min(0).default(0),
  department: z.string().optional(),
  hours: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export const ContactInfoForm: React.FC<ContactInfoFormProps> = ({ contact, onClose }) => {
  const { showSuccess, showError } = useNotification();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      contact_type: contact?.contact_type || '',
      label: contact?.label || '',
      value: contact?.value || '',
      is_primary: contact?.is_primary || false,
      is_active: contact?.is_active ?? true,
      display_order: contact?.display_order || 0,
      department: contact?.additional_info?.department || '',
      hours: contact?.additional_info?.hours || '',
    }
  });

  const contactType = watch('contact_type');

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const selectedType = contactTypes.find(t => t.value === data.contact_type);
      const payload = {
        contact_type: data.contact_type,
        label: data.label,
        value: data.value,
        is_primary: data.is_primary,
        is_active: data.is_active,
        display_order: data.display_order,
        icon_name: selectedType?.icon || 'Phone',
        additional_info: {
          department: data.department,
          hours: data.hours,
        }
      };
      
      if (contact?.id) {
        return apiClient.put(`/admin/settings/contact/${contact.id}`, payload);
      } else {
        return apiClient.post('/admin/settings/contact', payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-contact-info'] });
      showSuccess(contact?.id ? 'Contact updated successfully' : 'Contact created successfully');
      onClose();
    },
    onError: (err: Error) => {
      showError(err.message || 'Failed to save contact');
    }
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-b border-white/10 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">
            {contact?.id ? 'Edit Contact Information' : 'Add Contact Information'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/60 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Controller
              name="contact_type"
              control={control}
              render={({ field }) => (
                <FormSelect
                  label="Contact Type *"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  options={[
                    { value: '', label: 'Select a type' },
                    ...contactTypes
                  ]}
                  error={errors.contact_type?.message}
                />
              )}
            />

            <Controller
              name="label"
              control={control}
              render={({ field }) => (
                <FormInput
                  label="Label *"
                  placeholder="e.g., Customer Support, Main Office"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.label?.message}
                />
              )}
            />

            <Controller
              name="value"
              control={control}
              render={({ field }) => (
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-white/80">
                    {contactType === 'email' ? 'Email Address' :
                     contactType === 'phone' || contactType === 'whatsapp' ? 'Phone Number' :
                     contactType === 'address' ? 'Address' : 'Value'} *
                  </label>
                  {contactType === 'address' ? (
                    <textarea
                      value={field.value}
                      onChange={field.onChange}
                      rows={3}
                      placeholder="123 Main Street, City, State, ZIP"
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-white placeholder-white/40 transition-all resize-none"
                    />
                  ) : (
                    <FormInput
                      type={contactType === 'email' ? 'email' : 'text'}
                      placeholder={
                        contactType === 'email' ? 'support@example.com' :
                        contactType === 'phone' || contactType === 'whatsapp' ? '+1 (555) 123-4567' :
                        'Enter value'
                      }
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.value?.message}
                    />
                  )}
                  {errors.value && !contactType && <p className="text-sm text-red-500">{errors.value.message}</p>}
                </div>
              )}
            />

            <Controller
              name="department"
              control={control}
              render={({ field }) => (
                <FormInput
                  label="Department (Optional)"
                  placeholder="e.g., Sales, Support, General"
                  value={field.value || ''}
                  onChange={field.onChange}
                />
              )}
            />

            <Controller
              name="hours"
              control={control}
              render={({ field }) => (
                <FormInput
                  label="Business Hours (Optional)"
                  placeholder="e.g., Mon-Fri 9AM-6PM"
                  value={field.value || ''}
                  onChange={field.onChange}
                />
              )}
            />

            <Controller
              name="display_order"
              control={control}
              render={({ field }) => (
                <div>
                  <FormInput
                    label="Display Order"
                    type="number"
                    min="0"
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    error={errors.display_order?.message}
                  />
                  <p className="text-sm text-white/50 mt-1">Lower numbers appear first</p>
                </div>
              )}
            />

            <div className="space-y-3">
              <Controller
                name="is_primary"
                control={control}
                render={({ field }) => (
                  <FormCheckbox
                    id="is_primary"
                    label="Primary contact (featured prominently)"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />

              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormCheckbox
                    id="is_active"
                    label="Active (visible on website)"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                  />
                )}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
            >
              {mutation.isPending ? 'Saving...' : contact?.id ? 'Update Contact' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
