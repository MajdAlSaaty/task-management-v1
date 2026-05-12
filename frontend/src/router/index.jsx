import { createBrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Tasks from '../pages/Tasks';
import Scheduler from '../pages/Scheduler';
import Profile from '../pages/Profile';
import UniversitySchedule from '../pages/UniversitySchedule';
import Auth from '../pages/Auth';
import PrivateRoute from '../components/PrivateRoute';
import Layout from '../components/Layout';

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <Auth />,
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          { path: '/', element: <Dashboard /> },
          { path: '/tasks', element: <Tasks /> },
          { path: '/scheduler', element: <Scheduler /> },
          { path: '/university', element: <UniversitySchedule /> },
          { path: '/profile', element: <Profile /> },
        ],
      },
    ],
  },
]);