'use client';

import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    const errorDetails = `Stack:\n${error?.stack || 'No stack'}\n\nComponent Stack:\n${errorInfo?.componentStack || 'No component stack'}`;

    if (typeof window !== 'undefined') {
      if (typeof window.__dripp_report_error === 'function') {
        window.__dripp_report_error({
          level: 'fatal',
          message: error?.message || 'React Render Crash',
          source: window.location.href,
          details: errorDetails
        });
      }
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          color: '#ffffff',
          fontFamily: 'Clash Display, sans-serif'
        }}>
          <div style={{
            fontSize: '1.8rem',
            fontFamily: 'Panchang, sans-serif',
            color: '#ff4d4d',
            marginBottom: '16px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Something went wrong
          </div>
          <p style={{
            maxWidth: '540px',
            fontSize: '1rem',
            lineHeight: '1.6',
            color: '#aaaaaa',
            marginBottom: '28px',
            fontFamily: 'Clash Display, sans-serif'
          }}>
            An unexpected error occurred. The full incident details have been captured and transmitted to the Admin Panel error radar.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 28px',
              background: '#ebd73f',
              color: '#000000',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'Panchang, sans-serif',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              boxShadow: '0 4px 20px rgba(235, 215, 63, 0.25)'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
