import React, { useState } from 'react';
import EnquiryForm from './components/EnquiryForm';
import { Customer } from './api/form';

const App: React.FC = () => {
  const [showSuccess, setShowSuccess] = useState(false);

  const handleFormSubmit = (data: Customer) => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">

        {showSuccess && (
          <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center shadow-sm animate-bounce">
            <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Customer registered successfully!
          </div>
        )}

        <EnquiryForm onSubmit={handleFormSubmit} />
      </div>
    </div>
  );
};

export default App;
