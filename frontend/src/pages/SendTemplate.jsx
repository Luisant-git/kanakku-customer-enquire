import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SendTemplate.css';

const API_URL = import.meta.env.VITE_API_URL;

const SendTemplate = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [configId, setConfigId] = useState('');
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/available-configs`, { withCredentials: true });
      setConfigs(response.data);
      const defaultConfig = response.data.find(c => c.isDefault);
      if (defaultConfig) setConfigId(defaultConfig.id);
    } catch (error) {
      console.error('Error fetching configs:', error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/send-configured-template`, 
        { phoneNumber, name, configId: configId || undefined },
        { withCredentials: true }
      );
      setModalMessage(`Template sent successfully using ${response.data.config}!`);
      setShowModal(true);
      setPhoneNumber('');
      setName('');
    } catch (error) {
      setModalMessage('Error sending template');
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
          placeholder="Phone Number (with country code)"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />
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
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Template'}
        </button>
      </form>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{modalMessage.includes('Error') ? '❌ Error' : '✅ Success'}</h3>
            <p>{modalMessage}</p>
            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendTemplate;
