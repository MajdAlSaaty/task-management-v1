import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const response = await api.post('/password/forgot', { email });
      setMessage(response.data?.message || 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني');
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'فشل إرسال رابط إعادة التعيين');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
      <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>🔑 نسيت كلمة المرور</h2>
        {sent ? (
          <>
            <p style={{ marginBottom: '1rem', lineHeight: '1.6', textAlign: 'center' }}>{message}</p>
            <Link to="/auth" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', padding: '0.75rem' }}>العودة إلى تسجيل الدخول</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>البريد الإلكتروني</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control" required placeholder="أدخل بريدك الإلكتروني" /></div>
            {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>}
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>{loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}</button>
            <Link to="/auth" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', color: 'var(--gray-600)', fontSize: '0.875rem' }}>تذكرت كلمة المرور؟ تسجيل الدخول</Link>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;