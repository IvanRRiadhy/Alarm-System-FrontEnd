import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axiosServices, { axiosCdn } from 'src/utils/axios';


const API_CDN = '/api/upload-local';

export function useUploadCDN() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData) => {
      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }
      const response = await axiosCdn.post(API_CDN, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('File uploaded successfully: ', response.data);
      return response.data;
    },
  });
}