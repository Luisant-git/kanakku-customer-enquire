import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

export const getAvailableConfigs = async () => {
  const response = await api.get('/api/available-configs');
  return response.data;
};

export const sendConfiguredTemplate = async (data) => {
  const response = await api.post('/api/send-configured-template', data);
  return response.data;
};
