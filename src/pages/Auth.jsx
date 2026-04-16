import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!name.trim()) throw new Error('الاسم مطلوب');
        if (password !== confirmPassword) throw new Error('كلمة المرور غير متطابقة');
        if (password.length < 6) throw new Error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
        await signup(name.trim(), email, password);
      }
      navigate('/');
    } catch (err) {
      const apiError = err.response?.data?.message || err.response?.data?.error;
      setError(apiError || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '2rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>
          مرحباً بك في مساعد المهام الذكي
        </h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--gray-200)' }}>
          <button
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1, padding: '0.75rem', border: 'none', background: 'none',
              cursor: 'pointer', fontWeight: 'bold',
              color: isLogin ? 'var(--primary)' : 'var(--gray-600)',
              borderBottom: isLogin ? '2px solid var(--primary)' : 'none'
            }}
          >
            تسجيل الدخول
          </button>
          <button
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1, padding: '0.75rem', border: 'none', background: 'none',
              cursor: 'pointer', fontWeight: 'bold',
              color: !isLogin ? 'var(--primary)' : 'var(--gray-600)',
              borderBottom: !isLogin ? '2px solid var(--primary)' : 'none'
            }}
          >
            إنشاء حساب
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>الاسم</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="form-control" required />
            </div>
          )}
          <div className="form-group">
            <label>البريد الإلكتروني</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="form-control" required />
          </div>
          <div className="form-group">
            <label>كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="form-control" required />
          </div>
          {!isLogin && (
            <div className="form-group">
              <label>تأكيد كلمة المرور</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="form-control" required />
            </div>
          )}
          {error && <p style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem' }}>
            {loading ? 'جاري التحميل...' : (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Auth;