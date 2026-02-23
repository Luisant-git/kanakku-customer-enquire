import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

export const getCustomers = async () => {
  const response = await api.get('/api/customers');
  return response.data;
};

export const getFormCustomers = async () => {
  const response = await api.get('/api/customers');
  return response.data;
};

export const bulkUploadCustomers = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/bulk-upload-customers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
