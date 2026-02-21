import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SendTemplate.css';

const API_URL = import.meta.env.VITE_API_URL;

const SendTemplate = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [name, setName] = useState('');
  const [configId, setConfigId] = useState('');
  const [configs, setConfigs] = useState([]);
  const [message, setMessage] = useState('');

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
    try {
      const response = await axios.post(`${API_URL}/api/send-configured-template`, 
        { phoneNumber, name, configId: configId || undefined },
        { withCredentials: true }
      );
      setMessage(`Template sent successfully using ${response.data.config}!`);
      setPhoneNumber('');
      setName('');
    } catch (error) {
      setMessage('Error sending template');
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
        />
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <select
          value={configId}
          onChange={(e) => setConfigId(e.target.value)}
        >
          <option value="">Use Default Configuration</option>
          {configs.map((config) => (
            <option key={config.id} value={config.id}>
              {config.configName} - {config.templateName} {config.isDefault && '(Default)'}
            </option>
          ))}
        </select>
        <button type="submit">Send Template</button>
      </form>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default SendTemplate;
