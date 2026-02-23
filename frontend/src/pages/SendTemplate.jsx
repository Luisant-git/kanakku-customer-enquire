import React, { useState, useEffect } from 'react';
import './SendTemplate.css';
import { bulkUploadCustomers } from '../api/customer';
import { getAvailableConfigs, sendConfiguredTemplate } from '../api/sendTemplate';
import { FiSend, FiUpload, FiUserPlus, FiTrash2, FiX, FiCheckCircle, FiXCircle, FiSettings } from 'react-icons/fi';
import { BsChatText, BsPeople } from 'react-icons/bs';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

const SendTemplate = () => {
  const [customers, setCustomers] = useState([{ phoneNumber: '', name: '' }]);
  const [configId, setConfigId] = useState('');
  const [campaign, setCampaign] = useState('');
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const data = await getAvailableConfigs();
      setConfigs(data);
      const defaultConfig = data.find(c => c.isDefault);
      if (defaultConfig) setConfigId(defaultConfig.id);
    } catch (error) {
      console.error('Error fetching configs:', error);
    }
  };

  const addCustomer = () => {
    setCustomers([...customers, { phoneNumber: '', name: '' }]);
  };

  const removeCustomer = (index) => {
    setCustomers(customers.filter((_, i) => i !== index));
  };

  const updateCustomer = (index, field, value) => {
    const updated = [...customers];
    updated[index][field] = value;
    setCustomers(updated);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const data = await bulkUploadCustomers(file);
      setCustomers(data.customers);
    } catch (error) {
      alert('Failed to upload Excel file');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await sendConfiguredTemplate({ customers, configId: configId || undefined, campaign });
      setResults(data.results);
      setShowModal(true);
      setCustomers([{ phoneNumber: '', name: '' }]);
      setCampaign('');
    } catch (error) {
      setResults([{ status: 'error', error: error.response?.data?.error || 'Failed to send templates' }]);
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="send-template">
      <div className="page-header">
        <h2><FiSend /> Send Template Message</h2>
        <p>Send WhatsApp template messages to your customers</p>
      </div>

      <form onSubmit={handleSend} className="template-form">
        <div className="form-section">
          <label><BsChatText /> Campaign Name</label>
          <input
            type="text"
            placeholder="Enter campaign name"
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-section">
          <label><FiSettings /> Template Configuration</label>
          <select
            value={configId}
            onChange={(e) => setConfigId(e.target.value)}
            disabled={loading}
          >
            <option value="">Use Default Configuration</option>
            {configs.map((config) => (
              <option key={config.id} value={config.id}>
                {config.configName} - {config.templateName} {config.isDefault && '(Default)'}
              </option>
            ))}
          </select>
        </div>

        <div className="form-section">
          <label><FiUpload /> Upload Excel File</label>
          <div className="upload-area">
            <input
              id="excel-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={loading}
              style={{ display: 'none' }}
            />
            <label htmlFor="excel-upload" className="upload-btn">
              <FiUpload /> Choose Excel File
            </label>
            <span className="upload-hint">Excel file with Phone & Name columns</span>
          </div>
        </div>

        <div className="form-section">
          <div className="section-header">
            <label><BsPeople /> Customer List</label>
            <button type="button" onClick={addCustomer} disabled={loading} className="add-customer-btn">
              <FiUserPlus /> Add Customer
            </button>
          </div>
          
          <div className="customers-list">
            {customers.map((customer, index) => (
              <div key={index} className="customer-item">
                <div className="customer-inputs">
                  <input
                    type="text"
                    placeholder="Phone Number (with country code)"
                    value={customer.phoneNumber}
                    onChange={(e) => updateCustomer(index, 'phoneNumber', e.target.value)}
                    required
                    disabled={loading}
                  />
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={customer.name}
                    onChange={(e) => updateCustomer(index, 'name', e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                {customers.length > 1 && (
                  <button type="button" onClick={() => removeCustomer(index)} disabled={loading} className="remove-btn">
                    <FiTrash2 />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? <><AiOutlineLoading3Quarters className="spin" /> Sending...</> : <><FiSend /> Send Templates</>}
        </button>
      </form>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send Results</h3>
              <button onClick={() => setShowModal(false)} className="close-btn"><FiX /></button>
            </div>
            <div className="results">
              {results.map((result, i) => (
                <div key={i} className={`result-item ${result.status}`}>
                  <span className="result-icon">{result.status === 'success' ? <FiCheckCircle /> : <FiXCircle />}</span>
                  <div className="result-info">
                    <strong>{result.name}</strong>
                    <span>{result.phoneNumber}</span>
                    {result.error && <div className="error-msg">{result.error}</div>}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowModal(false)} className="modal-close-btn">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendTemplate;
