import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  helperText,
  required,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        {...props}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
          error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${className}`}
      />
      {error && (
        <div className="flex items-center mt-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  label,
  error,
  helperText,
  required,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        {...props}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors resize-none ${
          error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${className}`}
      />
      {error && (
        <div className="flex items-center mt-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  options: { value: string; label: string }[];
}

export const FormSelect: React.FC<FormSelectProps> = ({
  label,
  error,
  helperText,
  required,
  options,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        {...props}
        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors ${
          error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${className}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <div className="flex items-center mt-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

interface FormCheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  label,
  error,
  helperText,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      <div className="flex items-center">
        <input
          type="checkbox"
          {...props}
          className={`h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded ${className}`}
        />
        <label className="ml-2 block text-sm text-gray-700">{label}</label>
      </div>
      {error && (
        <div className="flex items-center mt-1 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

