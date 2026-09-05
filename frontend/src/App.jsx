import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './layouts/AppShell';

// Auth Pages
import LoginPage from './pages/LoginPage';
import Register from './pages/Register';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ForbiddenPage from './pages/ForbiddenPage';
import NotFoundPage from './pages/NotFoundPage';

// Public Landing
import LandingPage from './pages/LandingPage';

// Operational & Management Pages
import DashboardPage from './features/dashboard/pages/DashboardPage';
import UsersPage from './features/users/pages/UsersPage';
import SpacesPage from './features/spaces/pages/SpacePage';
import AvailabilityPage from './features/availability/pages/AvailabilityPage';
import Campaigns from './pages/Campaigns';
import BookingsPage from './features/bookings/pages/BookingsPage';
import CreativesPage from './features/creatives/pages/CreativesPage';
import InfluencersPage from './features/influencers/pages/InfluencersPage';
import PaymentsPage from './features/payments/pages/PaymentsPage';
import NotificationsPage from './features/notifications/pages/NotificationsPage';
import ProfilePage from './features/profile/pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AuditLogsPage from './pages/AuditLogsPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/unauthorized" element={<ForbiddenPage />} />

            {/* Authenticated Application Shell */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/spaces" element={<SpacesPage />} />
                <Route path="/availability" element={<AvailabilityPage />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/influencers" element={<InfluencersPage />} />
                <Route path="/bookings" element={<BookingsPage />} />
                <Route path="/creatives" element={<CreativesPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/invoices" element={<Navigate to="/payments" replace />} />
                <Route path="/billing" element={<Navigate to="/payments" replace />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />

                {/* Administrator Dedicated Routes */}
                <Route element={<ProtectedRoute allowedRoles={['Administrator']} />}>
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/audit" element={<AuditLogsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/admin" element={<Navigate to="/users" replace />} />
                </Route>
              </Route>
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;