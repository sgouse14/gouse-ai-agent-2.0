import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { SaqlainSecurityView } from './components/SaqlainSecurityView';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

const rootElement = document.getElementById('root');
if (rootElement) {
  const securityMode = window.location.hash === '#saqlain';
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ThemeProvider>
        {securityMode ? <SaqlainSecurityView /> : <App />}
      </ThemeProvider>
    </React.StrictMode>
  );
}
