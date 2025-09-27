// Custom error page to fix build issue
// This file is intentionally minimal to avoid the Html import issue
import Link from 'next/link';

function Error({ statusCode }: { statusCode: number }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ fontSize: '4rem', margin: 0 }}>{statusCode || 'Error'}</h1>
      <p style={{ marginTop: '1rem', color: '#666' }}>
        {statusCode === 404
          ? 'Sayfa bulunamadı'
          : statusCode === 500
          ? 'Sunucu hatası'
          : 'Bir hata oluştu'}
      </p>
      <Link href="/" style={{
        marginTop: '2rem',
        padding: '0.5rem 1rem',
        backgroundColor: '#0070f3',
        color: 'white',
        textDecoration: 'none',
        borderRadius: '0.25rem',
        display: 'inline-block'
      }}>
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;