import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './TemplateConfig.css';

const API_URL = import.meta.env.VITE_API_URL;

const TemplateConfig = () => {
  const [configs, setConfigs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    configName: '',
    templateName: '',
    templateLanguage: 'en',
    phoneNumberId: '',
    accessToken: '',
    verifyToken: '',
    headerMedia: '',
    headerMediaType: 'IMAGE',
    isDefault: false
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const response = await axios.post(`${API_URL}/api/upload`, formDataUpload, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData({ ...formData, headerMedia: response.data.url });
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const fetchConfigs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/template-config`, { withCredentials: true });
      setConfigs(response.data);
    } catch (error) {
      console.error('Error fetching configs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await axios.put(`${API_URL}/api/template-config/${editId}`, formData, { withCredentials: true });
      } else {
        await axios.post(`${API_URL}/api/template-config`, formData, { withCredentials: true });
      }
      fetchConfigs();
      resetForm();
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const handleEdit = (config) => {
    setFormData(config);
    setEditId(config.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this configuration?')) {
      try {
        await axios.delete(`${API_URL}/api/template-config/${id}`, { withCredentials: true });
        fetchConfigs();
      } catch (error) {
        console.error('Error deleting config:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      configName: '',
      templateName: '',
      templateLanguage: 'en',
      phoneNumberId: '',
      accessToken: '',
      verifyToken: '',
      headerMedia: '',
      headerMediaType: 'IMAGE',
      isDefault: false
    });
    setEditId(null);
    setShowForm(false);
  };

  return (
    <div className="template-config">
      <div className="header-section">
        <h2>Template Configurations</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Add Configuration'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="config-form">
          <input
            type="text"
            placeholder="Configuration Name *"
            value={formData.configName}
            onChange={(e) => setFormData({ ...formData, configName: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Template Name *"
            value={formData.templateName}
            onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
            required
          />
          <select
            value={formData.templateLanguage}
            onChange={(e) => setFormData({ ...formData, templateLanguage: e.target.value })}
          >
            <option value="en">English</option>
          </select>
          <input
            type="text"
            placeholder="Phone Number ID *"
            value={formData.phoneNumberId}
            onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Access Token *"
            value={formData.accessToken}
            onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Verify Token *"
            value={formData.verifyToken}
            onChange={(e) => setFormData({ ...formData, verifyToken: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Header Media URL (Optional)"
            value={formData.headerMedia}
            onChange={(e) => setFormData({ ...formData, headerMedia: e.target.value })}
          />
          <select
            value={formData.headerMediaType}
            onChange={(e) => setFormData({ ...formData, headerMediaType: e.target.value })}
          >
            <option value="IMAGE">Image</option>
            <option value="VIDEO">Video</option>
            <option value="DOCUMENT">Document/PDF</option>
          </select>
          <input
            type="file"
            accept="image/*,video/*,.pdf"
            onChange={handleFileUpload}
          />
          <label>
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
            />
            Set as default configuration
          </label>
          <button type="submit" className="btn-primary">
            {editId ? 'Update Configuration' : 'Create Configuration'}
          </button>
        </form>
      )}

      <div className="configs-list">
        {configs.map((config) => (
          <div key={config.id} className="config-card">
            <h3>{config.configName} {config.isDefault && <span className="badge">Default</span>}</h3>
            <p><strong>Template:</strong> {config.templateName}</p>
            <p><strong>Phone ID:</strong> {config.phoneNumberId}</p>
            <div className="card-actions">
              <button onClick={() => handleEdit(config)} className="btn-edit">Edit</button>
              <button onClick={() => handleDelete(config.id)} className="btn-delete">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateConfig;
