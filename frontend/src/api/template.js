import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

export const getTemplateConfigs = async () => {
  const response = await api.get('/api/template-config');
  return response.data;
};

export const createTemplateConfig = async (data) => {
  const response = await api.post('/api/template-config', data);
  return response.data;
};

export const updateTemplateConfig = async (id, data) => {
  const response = await api.put(`/api/template-config/${id}`, data);
  return response.data;
};

export const deleteTemplateConfig = async (id) => {
  const response = await api.delete(`/api/template-config/${id}`);
  return response.data;
};

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
