import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showVerifyMsg, setShowVerifyMsg] = useState(searchParams.get('verify') === '1');
  const [verifySuccess, setVerifySuccess] = useState('');

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        navigate('/');
      } else {
        if (!name.trim()) throw new Error('الاسم مطلوب');
        if (password !== confirmPassword) throw new Error('كلمة المرور غير متطابقة');
        if (password.length < 8) throw new Error('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
        await signup(name.trim(), email, password, confirmPassword);
        setShowVerifyMsg(true);
      }
    } catch (err) {
      const apiError = err.response?.data?.message || err.response?.data?.error;
      setError(apiError || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (showVerifyMsg) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
        <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>📧 تحقق من بريدك الإلكتروني</h2>
          <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
            تم إنشاء حسابك بنجاح. يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.
            <br />
            إذا لم يصلك البريد، يمكنك طلب إعادة الإرسال.
          </p>
          <button
            onClick={async () => {
              try {
                await api.post('/email/resend');
                setVerifySuccess('تم إعادة إرسال رابط التفعيل');
              } catch (err) {
                setError(err.response?.data?.message || 'فشل إعادة الإرسال');
              }
            }}
            className="btn btn-primary"
            style={{ marginBottom: '0.5rem', width: '100%', padding: '0.75rem' }}
          >
            إعادة إرسال رابط التفعيل
          </button>
          {verifySuccess && <p style={{ color: 'var(--secondary)', marginTop: '0.5rem' }}>{verifySuccess}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
      <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>مرحباً بك في مساعد المهام الذكي</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray-200)' }}>
          <button onClick={() => setIsLogin(true)} style={{ flex: 1, padding: '0.75rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', color: isLogin ? 'var(--primary)' : 'var(--gray-600)', borderBottom: isLogin ? '2px solid var(--primary)' : 'none' }}>تسجيل الدخول</button>
          <button onClick={() => setIsLogin(false)} style={{ flex: 1, padding: '0.75rem', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', color: !isLogin ? 'var(--primary)' : 'var(--gray-600)', borderBottom: !isLogin ? '2px solid var(--primary)' : 'none' }}>إنشاء حساب</button>
        </div>
        <form onSubmit={handleSubmit}>
          {!isLogin && (<div className="form-group"><label>الاسم</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-control" required /></div>)}
          <div className="form-group"><label>البريد الإلكتروني</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control" required /></div>
          <div className="form-group"><label>كلمة المرور</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-control" required /></div>
          {!isLogin && (<div className="form-group"><label>تأكيد كلمة المرور</label><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="form-control" required /></div>)}
          {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>{loading ? 'جاري التحميل...' : (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب')}</button>
          {isLogin && (<Link to="/forgot-password" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', color: 'var(--gray-600)', fontSize: '0.875rem' }}>نسيت كلمة المرور؟</Link>)}
        </form>
      </div>
    </div>
  );
};

export default Auth;