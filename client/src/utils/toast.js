import toast from 'react-hot-toast';

/**
 * SCHOLARA Editorial Toast Helper
 * Standardizes toast styles and icons to fit the brand palette.
 */
export const showToast = {
  success: (message) => {
    toast.success(message, {
      style: {
        background: '#183D32',
        color: '#F7F5EF',
        border: '1px solid #1F4E40',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        padding: '12px 16px',
        boxShadow: '0 8px 24px rgba(24, 61, 50, 0.25)',
      },
      iconTheme: {
        primary: '#C4A66A',
        secondary: '#183D32',
      },
    });
  },

  error: (message) => {
    toast.error(message, {
      style: {
        background: '#252923',
        color: '#F7F5EF',
        border: '1px solid #C0392B',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        padding: '12px 16px',
        boxShadow: '0 8px 24px rgba(37, 41, 35, 0.25)',
      },
      iconTheme: {
        primary: '#E74C3C',
        secondary: '#252923',
      },
    });
  },

  info: (message) => {
    toast(message, {
      icon: 'ℹ️',
      style: {
        background: '#F7F5EF',
        color: '#252923',
        border: '1px solid #E5EBE3',
        borderRadius: '6px',
        fontSize: '14px',
        fontWeight: '500',
        padding: '12px 16px',
        boxShadow: '0 8px 24px rgba(37, 41, 35, 0.1)',
      },
    });
  },

  loading: (message) => {
    return toast.loading(message, {
      style: {
        background: '#252923',
        color: '#F7F5EF',
        border: '1px solid #3A3D34',
        borderRadius: '6px',
        fontSize: '14px',
        padding: '12px 16px',
      },
    });
  },

  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },
};

export default showToast;
