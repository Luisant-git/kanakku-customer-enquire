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
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-2 bg-indigo-600 rounded-xl mb-4 shadow-lg shadow-indigo-200">
             <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
             </svg>
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Nexus Enquiry Hub</h1>
          <p className="mt-4 text-lg text-slate-600">Smart assistance for your business enquiries</p>
        </header>

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
