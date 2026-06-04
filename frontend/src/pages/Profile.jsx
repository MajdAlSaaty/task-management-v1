import { useAuth } from '../contexts/AuthContext';

const Profile = () => {
  const { user } = useAuth();

  return (
    <div className="card">
      <h3 className="card-title">الملف الشخصي</h3>
      <div>
        <p><strong>البريد الإلكتروني:</strong> {user?.email}</p>
        <p><strong>الاسم:</strong> {user?.name}</p>
      </div>
    </div>
  );
};

export default Profile;