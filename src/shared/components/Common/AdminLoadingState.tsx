import React from 'react';


interface AdminLoadingStateProps {
  title?: string;
  message?: string;
  showSpinner?: boolean;
}

export const AdminLoadingState: React.FC<AdminLoadingStateProps> = ({
  title = 'Loading...',
  message = 'Please wait while we load the data.',
  showSpinner = true
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        {showSpinner && (
          <div className="flex justify-center mb-4">
            <></>
          </div>
        )}
        <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default AdminLoadingState;