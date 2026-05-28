// PATH: /src/components/ui/MainHeader.jsx
'use client';

export default function MainHeader() {
  const styles = {
    headerBar: {
      backgroundColor: '#0504AA', 
      padding: '16px 40px',
      display: 'flex',
      alignItems: 'center',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      width: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 1000,
    },
    logoWrapper: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      textDecoration: 'none',
      cursor: 'pointer'
    },
    iconPlaceholder: {
      height: '40px',
      width: '40px',
      backgroundColor: '#ffffff',
      borderRadius: '50%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden'
    },
    brandText: {
      color: '#ffffff',
      fontSize: '22px',
      fontWeight: 'bold',
      letterSpacing: '1px',
      fontFamily: 'Arial, sans-serif'
    }
  };

  return (
    <header style={styles.headerBar}>
      <a href="/" style={styles.logoWrapper}>
        <div style={styles.iconPlaceholder}>
          <img 
            src="/logos/communiserve-icon.png" 
            alt="CS" 
            style={{ width: '100%', height: '150%', objectFit: 'contain' }} 
            onError={(e) => e.target.style.display = 'none'} 
          />
        </div>
        <span style={styles.brandText}>COMMUNISERVE</span>
      </a>
    </header>
  );
}