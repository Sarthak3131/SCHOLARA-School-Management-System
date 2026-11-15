import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import '@/styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#252923',
            color: '#F7F5EF',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            borderRadius: '6px',
            padding: '12px 16px',
            boxShadow: '0 4px 12px rgba(37,41,35,0.2)',
          },
          success: {
            iconTheme: { primary: '#52B788', secondary: '#252923' },
          },
          error: {
            iconTheme: { primary: '#E74C3C', secondary: '#252923' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
);
