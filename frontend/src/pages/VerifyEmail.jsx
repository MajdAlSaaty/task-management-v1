import { Link, useSearchParams } from 'react-router-dom';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const verified = searchParams.get('verified') === '1';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
      <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '2rem', textAlign: 'center' }}>
        {verified ? (
          <>
            <h2 style={{ marginBottom: '1rem', color: 'var(--secondary)' }}>✅ تم التفعيل بنجاح</h2>
            <p style={{ marginBottom: '1rem' }}>شكراً لك! تم تفعيل بريدك الإلكتروني بنجاح.</p>
            <Link to="/" className="btn btn-primary" style={{ display: 'inline-block', padding: '0.75rem 2rem' }}>الذهاب إلى الرئيسية</Link>
          </>
        ) : (
          <>
            <h2 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>⚠️ رابط غير صالح</h2>
            <p style={{ marginBottom: '1rem' }}>رابط التفعيل غير صالح أو منتهي الصلاحية.</p>
            <Link to="/" className="btn btn-primary" style={{ display: 'inline-block', padding: '0.75rem 2rem' }}>العودة إلى الرئيسية</Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;