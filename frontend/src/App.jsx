import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Compose from './pages/Compose';
import Calendar from './pages/Calendar';
import Analytics from './pages/Analytics';
import AIFeatures from './pages/AIFeatures';
import AIAssistant from './components/AIAssistant';
import Profile from './pages/Profile';
import Inbox from './pages/Inbox';
import OAuthConsent from './pages/OAuthConsent';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#0f172a',
            color: '#fff',
            borderRadius: '14px',
            fontSize: '13px',
            fontWeight: '500',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#f43f5e',
              secondary: '#fff',
            },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/oauth/authorize"
            element={
              <ProtectedRoute>
                <OAuthConsent />
              </ProtectedRoute>
            }
          />

          {/* Protected routes wrapped in Layout */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/compose" element={<Compose />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/ai" element={<AIFeatures />} />
            <Route path="/assistant" element={<AIAssistant />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </LanguageProvider>
  );
}
