import { createBrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Tasks from '../pages/Tasks';
import Scheduler from '../pages/Scheduler';
import Profile from '../pages/Profile';
import Preferences from '../pages/Preferences';
import Analytics from '../pages/Analytics';
import UniversitySchedule from '../pages/UniversitySchedule';
import Notifications from '../pages/Notifications';
import Conflicts from '../pages/Conflicts';
import Auth from '../pages/Auth';
import VerifyEmail from '../pages/VerifyEmail';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import PrivateRoute from '../components/PrivateRoute';
import Layout from '../components/Layout';

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <Auth />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmail />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/reset-password',
    element: <ResetPassword />,
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <Dashboard /> },
          { path: '/analytics', element: <Analytics /> },
          { path: '/tasks', element: <Tasks /> },
          { path: '/scheduler', element: <Scheduler /> },
          { path: '/university', element: <UniversitySchedule /> },
          { path: '/notifications', element: <Notifications /> },
          { path: '/conflicts', element: <Conflicts /> },
          { path: '/preferences', element: <Preferences /> },
          { path: '/profile', element: <Profile /> },
        ],
      },
    ],
  },
]);