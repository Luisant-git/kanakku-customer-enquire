import React, { useState, useEffect } from 'react';
import './SendTemplate.css';
import { bulkUploadCustomers } from '../api/customer';
import { getAvailableConfigs, sendConfiguredTemplate } from '../api/sendTemplate';

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
      <h2>Send Template Message</h2>
      <form onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Campaign Name"
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
          required
          disabled={loading}
          className="campaign-input"
        />
        <div className="upload-section">
          <label htmlFor="excel-upload" className="upload-label">
            📊 Upload Excel (Phone & Name columns)
          </label>
          <input
            id="excel-upload"
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={loading}
            style={{ display: 'none' }}
          />
        </div>
        {customers.map((customer, index) => (
          <div key={index} className="customer-row">
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
              placeholder="Name"
              value={customer.name}
              onChange={(e) => updateCustomer(index, 'name', e.target.value)}
              required
              disabled={loading}
            />
            {customers.length > 1 && (
              <button type="button" onClick={() => removeCustomer(index)} disabled={loading} className="remove-btn">
                ✕
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addCustomer} disabled={loading} className="add-btn">
          + Add Customer
        </button>
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
        <button type="submit" disabled={loading} className="send-btn">
          {loading ? 'Sending...' : 'Send Templates'}
        </button>
      </form>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Send Results</h3>
            <div className="results">
              {results.map((result, i) => (
                <div key={i} className={`result-item ${result.status}`}>
                  {result.status === 'success' ? '✅' : '❌'} {result.name} ({result.phoneNumber})
                  {result.error && <div className="error-msg">{result.error}</div>}
                </div>
              ))}
            </div>
            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendTemplate;
