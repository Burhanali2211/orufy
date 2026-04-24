import React from 'react';
import { Link, useParams } from 'react-router-dom';

export default function StorefrontOrderConfirmationPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Order placed!</h1>

      {orderNumber && (
        <p className="text-2xl font-mono font-semibold text-blue-600 my-2">{orderNumber}</p>
      )}

      <p className="text-sm text-gray-500 mb-8">
        We'll send updates to your email.
      </p>

      <Link
        to="/"
        className="bg-blue-600 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Continue shopping
      </Link>
    </div>
  );
}
