import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { initEmail } from './utils/emailApi';

// Start Email Service
initEmail();

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display:'flex', flexDirection:'column', alignItems:'center',
          justifyContent:'center', height:'100vh', background:'#0f172a',
          color:'white', fontFamily:'system-ui', padding:'24px', textAlign:'center'
        }}>
          <div style={{fontSize:'48px', marginBottom:'16px'}}>⚠️</div>
          <h1 style={{fontSize:'24px', marginBottom:'8px', color:'#f87171'}}>App Failed to Load</h1>
          <p style={{color:'#94a3b8', marginBottom:'24px', maxWidth:'400px'}}>
            There was a startup error. This usually happens when Firebase config is missing or invalid.
          </p>
          <div style={{
            background:'#1e293b', border:'1px solid #334155', borderRadius:'8px',
            padding:'12px 20px', fontSize:'12px', color:'#64748b', marginBottom:'24px',
            maxWidth:'500px', wordBreak:'break-all', textAlign:'left'
          }}>
            <b style={{color:'#94a3b8'}}>Error:</b> {this.state.error?.message}
          </div>
          <button onClick={() => window.location.reload()} style={{
            background:'#3b82f6', color:'white', border:'none', borderRadius:'8px',
            padding:'10px 24px', cursor:'pointer', fontSize:'14px'
          }}>
            🔄 Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Ensure singleton root for HMR and duplicate script protection
if (!window.reactRoot) {
  window.reactRoot = createRoot(document.getElementById('root'));
}

window.reactRoot.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('Service Worker registered:', reg.scope);
        
        // Check for updates
        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          installingWorker.onstatechange = () => {
             if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New update available, notify or reload
                console.log('🚀 New version detected! Automatic update in progress...');
             }
          };
        };
      })
      .catch(err => console.log('Service Worker failed:', err));

    // Handle automatic reload when the new worker takes control
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}
