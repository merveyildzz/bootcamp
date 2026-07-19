import axios from 'axios';
import { toast } from 'sonner';

export const apiClient = axios.create({
  baseURL: 'https://mighty-deer-40.loca.lt/api/v1',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true', // LocalTunnel uyarı sayfasını atlamak için
  },
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = error.response?.data?.error || 'Beklenmeyen bir hata oluştu.';
    toast.error(customError);
    return Promise.reject(new Error(customError));
  }
);
