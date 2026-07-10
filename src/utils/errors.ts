import { toast } from 'react-hot-toast';

/**
 * Extract error message from API response or fallback to default message.
 */
export const getErrorMessage = (error: any, defaultMessage: string = 'An error occurred'): string => {
  return error?.response?.data?.msg || error?.response?.data?.message || defaultMessage;
};

/**
 * Display toast error message using extracted error message or fallback.
 */
export const toastError = (error: any, defaultMessage: string = 'An error occurred') => {
  toast.error(getErrorMessage(error, defaultMessage));
};
