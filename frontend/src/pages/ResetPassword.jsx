import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const emailParam = searchParams.get('email') || '';
  const isValidToken = /^[a-f0-9]{64}$/i.test(token);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailParam);

  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    if (password !== passwordConfirmation) { setError('كلمة المرور غير متطابقة'); setLoading(false); return; }
    if (password.length < 8) { setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل'); setLoading(false); return; }
    try {
      const response = await api.post('/password/reset', { token, email, password, password_confirmation: passwordConfirmation });
      setMessage(response.data?.message || 'تم إعادة تعيين كلمة المرور بنجاح');
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'فشلت عملية إعادة التعيين');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !emailParam || !isValidToken || !isValidEmail) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
        <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--danger)' }}>⚠️ رابط غير صالح</h2>
          <p style={{ marginBottom: '1rem' }}>رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية.</p>
          <Link to="/forgot-password" className="btn btn-primary" style={{ display: 'inline-block', padding: '0.75rem 2rem' }}>طلب رابط جديد</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
      <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>🔑 إعادة تعيين كلمة المرور</h2>
        {success ? (
          <>
            <p style={{ marginBottom: '1rem', textAlign: 'center', color: 'var(--secondary)' }}>{message}</p>
            <Link to="/auth" className="btn btn-primary" style={{ display: 'block', textAlign: 'center', padding: '0.75rem' }}>تسجيل الدخول</Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label>البريد الإلكتروني</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control" required readOnly={!!emailParam} /></div>
            <div className="form-group"><label>كلمة المرور الجديدة</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-control" required minLength={8} placeholder="8 أحرف على الأقل" /></div>
            <div className="form-group"><label>تأكيد كلمة المرور</label><input type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} className="form-control" required /></div>
            {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>}
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>{loading ? 'جاري إعادة التعيين...' : 'إعادة تعيين كلمة المرور'}</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;