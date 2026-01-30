/**
 * ImageEditorLazy - Dynamic loader for ImageEditor
 * Handles the "React is not defined" issue in Next.js production builds
 */
import React, { useEffect, useState } from 'react';
import type { ImageEditorProps } from '../types';

// Make React available globally for react-filerobot-image-editor
if (typeof window !== 'undefined') {
  (window as unknown as { React: typeof React }).React = React;
}

export function ImageEditorLazy(props: ImageEditorProps) {
  const [EditorComponent, setEditorComponent] = useState<React.ComponentType<ImageEditorProps> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only load on client side
    if (typeof window === 'undefined') return;

    // Ensure React is globally available before importing
    (window as unknown as { React: typeof React }).React = React;

    import('./ImageEditor')
      .then((mod) => {
        setEditorComponent(() => mod.ImageEditor);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load ImageEditor:', err);
        setError('Failed to load image editor');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a',
        color: '#fff',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #333',
            borderTopColor: '#fff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p>Loading editor...</p>
        </div>
      </div>
    );
  }

  if (error || !EditorComponent) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#fee',
        color: '#c00',
        borderRadius: '8px',
      }}>
        <p>{error || 'Failed to load editor'}</p>
        <button
          onClick={props.onClose}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    );
  }

  return <EditorComponent {...props} />;
}
