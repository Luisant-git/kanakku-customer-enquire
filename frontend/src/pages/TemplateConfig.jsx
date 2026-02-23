import React, { useState, useEffect } from 'react';
import './TemplateConfig.css';
import { getTemplateConfigs, createTemplateConfig, updateTemplateConfig, deleteTemplateConfig, uploadFile } from '../api/template';
import { FiSettings, FiPlus, FiX, FiEdit2, FiTrash2, FiUpload, FiSave, FiImage, FiVideo, FiFile } from 'react-icons/fi';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { BsCheckCircle } from 'react-icons/bs';

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
    try {
      const data = await uploadFile(file);
      setFormData({ ...formData, headerMedia: data.url });
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const fetchConfigs = async () => {
    try {
      const data = await getTemplateConfigs();
      setConfigs(data);
    } catch (error) {
      console.error('Error fetching configs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await updateTemplateConfig(editId, formData);
      } else {
        await createTemplateConfig(formData);
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
        await deleteTemplateConfig(id);
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

  const getMediaIcon = (type) => {
    switch(type) {
      case 'IMAGE': return <FiImage />;
      case 'VIDEO': return <FiVideo />;
      case 'DOCUMENT': return <FiFile />;
      default: return <FiImage />;
    }
  };

  return (
    <div className="template-config">
      <div className="page-header">
        <div>
          <h2><FiSettings /> Template Configurations</h2>
          <p>Manage your WhatsApp template configurations</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? <><FiX /> Cancel</> : <><FiPlus /> Add Configuration</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="config-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Configuration Name *</label>
              <input
                type="text"
                placeholder="Enter configuration name"
                value={formData.configName}
                onChange={(e) => setFormData({ ...formData, configName: e.target.value })}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Template Name *</label>
              <input
                type="text"
                placeholder="Enter template name"
                value={formData.templateName}
                onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Template Language</label>
              <select
                value={formData.templateLanguage}
                onChange={(e) => setFormData({ ...formData, templateLanguage: e.target.value })}
              >
                <option value="en">English</option>
              </select>
            </div>

            <div className="form-group">
              <label>Phone Number ID *</label>
              <input
                type="text"
                placeholder="Enter phone number ID"
                value={formData.phoneNumberId}
                onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Access Token *</label>
              <input
                type="text"
                placeholder="Enter access token"
                value={formData.accessToken}
                onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Verify Token *</label>
              <input
                type="text"
                placeholder="Enter verify token"
                value={formData.verifyToken}
                onChange={(e) => setFormData({ ...formData, verifyToken: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Header Media Type</label>
              <select
                value={formData.headerMediaType}
                onChange={(e) => setFormData({ ...formData, headerMediaType: e.target.value })}
              >
                <option value="IMAGE">Image</option>
                <option value="VIDEO">Video</option>
                <option value="DOCUMENT">Document/PDF</option>
              </select>
            </div>

            <div className="form-group">
              <label>Header Media URL</label>
              <input
                type="text"
                placeholder="Enter media URL (optional)"
                value={formData.headerMedia}
                onChange={(e) => setFormData({ ...formData, headerMedia: e.target.value })}
              />
            </div>

            <div className="form-group full-width">
              <label><FiUpload /> Upload Media File</label>
              <div className="upload-area">
                <input
                  type="file"
                  accept="image/*,video/*,.pdf"
                  onChange={handleFileUpload}
                  id="media-upload"
                  style={{ display: 'none' }}
                />
                <label htmlFor="media-upload" className="upload-btn">
                  {uploading ? <><AiOutlineLoading3Quarters className="spin" /> Uploading...</> : <><FiUpload /> Choose File</>}
                </label>
              </div>
            </div>

            <div className="form-group full-width">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                />
                <span>Set as default configuration</span>
              </label>
            </div>
          </div>

          <button type="submit" className="btn-submit">
            <FiSave /> {editId ? 'Update Configuration' : 'Create Configuration'}
          </button>
        </form>
      )}

      <div className="configs-grid">
        {configs.map((config) => (
          <div key={config.id} className="config-card">
            <div className="card-header">
              <h3>{config.configName}</h3>
              {config.isDefault && <span className="badge"><BsCheckCircle /> Default</span>}
            </div>
            <div className="card-body">
              <div className="info-row">
                <span className="label">Template:</span>
                <span className="value">{config.templateName}</span>
              </div>
              <div className="info-row">
                <span className="label">Phone ID:</span>
                <span className="value">{config.phoneNumberId}</span>
              </div>
              <div className="info-row">
                <span className="label">Language:</span>
                <span className="value">{config.templateLanguage}</span>
              </div>
              {config.headerMedia && (
                <div className="info-row">
                  <span className="label">Media:</span>
                  <span className="value media-type">{getMediaIcon(config.headerMediaType)} {config.headerMediaType}</span>
                </div>
              )}
            </div>
            <div className="card-actions">
              <button onClick={() => handleEdit(config)} className="btn-edit">
                <FiEdit2 /> Edit
              </button>
              <button onClick={() => handleDelete(config.id)} className="btn-delete">
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateConfig;
