import React, { useState } from 'react';
import { createCustomer, Customer } from '../api/form';

interface EnquiryFormProps {
  onSubmit: (data: Customer) => void;
}

const EnquiryForm: React.FC<EnquiryFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<Customer>({
    Name: '',
    MobileNo: '',
    DOB: '',
    DOA: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof Customer, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof Customer, string>> = {};
    if (!formData.Name.trim()) newErrors.Name = 'Name is required';
    
    if (!formData.MobileNo) {
      newErrors.MobileNo = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.MobileNo)) {
      newErrors.MobileNo = 'Mobile number must be exactly 10 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const result = await createCustomer(formData);
      onSubmit({ ...formData, id: result.id });
      setFormData({ Name: '', MobileNo: '', DOB: '', DOA: '' });
    } catch (error) {
      console.error('Failed to create customer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({ ...formData, MobileNo: value });
  };

  const inputBaseClass = "w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none bg-white text-slate-900 placeholder-slate-400";

  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 p-4 sm:p-8 text-white">
        <h2 className="text-2xl font-bold">Rathinavilas</h2>
        <p className="text-indigo-100 text-sm mt-1">Fill out the form below to register.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
          <input
            type="text"
            className={`${inputBaseClass} ${errors.Name ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
            placeholder="e.g. John Smith"
            value={formData.Name}
            onChange={e => setFormData({ ...formData, Name: e.target.value })}
          />
          {errors.Name && <p className="text-xs text-red-500 mt-1 ml-1 font-medium">{errors.Name}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-slate-700 ml-1">Mobile Number</label>
          <input
            type="tel"
            maxLength={10}
            className={`${inputBaseClass} ${errors.MobileNo ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
            placeholder="e.g. 9876543210"
            value={formData.MobileNo}
            onChange={handleMobileChange}
          />
          {errors.MobileNo && <p className="text-xs text-red-500 mt-1 ml-1 font-medium">{errors.MobileNo}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 ml-1">Date of Birth</label>
            <input
              type="date"
              className={`${inputBaseClass} border-slate-200`}
              value={formData.DOB}
              onChange={e => setFormData({ ...formData, DOB: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-slate-700 ml-1">Date of Anniversary</label>
            <input
              type="date"
              className={`${inputBaseClass} border-slate-200`}
              value={formData.DOA}
              onChange={e => setFormData({ ...formData, DOA: e.target.value })}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all transform active:scale-[0.99] mt-6 flex items-center justify-center gap-2 group disabled:opacity-50"
        >
          <span>{isSubmitting ? 'Submitting...' : 'Submit'}</span>
          {!isSubmitting && (
            <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          )}
        </button>
      </form>
    </div>
  );
};

export default EnquiryForm;
