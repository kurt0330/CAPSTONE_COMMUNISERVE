// PATH: /src/components/ui/ToastError.jsx
// Simple toast component for displaying error messages in a non-intrusive way.
// Usage: <ToastError message="Your error message here" />// PATH: /src/components/ui/ToastError.jsx
'use client';

export default function ToastError({ message }) {
  if (!message) return null; // Don't render if there's no error

  const styles = {
    toastContainer: {
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      backgroundColor: '#fff5f5',
      borderLeft: '5px solid #E24B4A',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
      padding: '16px 24px',
      borderRadius: '8px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#E24B4A',
      fontWeight: 'bold',
      maxWidth: '400px',
      animation: 'slideIn 0.3s ease-out forwards'
    }
  };

  return (
    <div style={styles.toastContainer}>
      <span style={{ fontSize: '20px' }}>⚠️</span>
      <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>{message}</p>
    </div>
  );
}