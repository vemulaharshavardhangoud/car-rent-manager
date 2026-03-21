import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

export const usePasswordProtection = () => {
  const { requirePassword, adminSession, endAdminSession } = useContext(AppContext);
  return { requirePassword, adminSession, endAdminSession };
};

export default usePasswordProtection;
