import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const Toast = () => {
  const { toast } = useContext(AppContext);

  if (!toast.isVisible) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50 animate-fade-in-down">
      <div className="bg-white rounded-lg shadow-lg border border-gray-100 p-4 flex items-center gap-3 w-80">
        {getIcon()}
        <span className="flex-1 text-gray-800 text-sm font-medium">{toast.message}</span>
      </div>
    </div>
  );
};

export default Toast;
