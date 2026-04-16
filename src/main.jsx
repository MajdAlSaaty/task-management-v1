import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AuthProvider } from './contexts/AuthContext';
import { TaskProvider } from './contexts/TaskContext';
import ThemeManager from './components/ThemeManager';
import './index.css';
import './styles/global.css';
import './styles/buttons.css';
import './styles/forms.css';
import './styles/cards.css';
import './styles/layout.css';
import './styles/modern.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeManager />
      <TaskProvider>
        <RouterProvider router={router} />
      </TaskProvider>
    </AuthProvider>
  </React.StrictMode>
);