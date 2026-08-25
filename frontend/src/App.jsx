import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './features/dashboard/pages/DashboardPage';
import Campaigns from './pages/Campaigns';
import SpacesPage from './features/spaces/pages/SpacePage';
import BookingsPage from './features/bookings/pages/BookingsPage';
import CreativesPage from './features/creatives/pages/CreativesPage';
import PaymentsPage from './features/payments/pages/PaymentsPage';


function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <main className="app-container">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/campaigns" element={<Campaigns />} />
                <Route path="/spaces" element={<SpacesPage />} />
                <Route path="/bookings" element={<BookingsPage />} />
                <Route path="/creatives" element={<CreativesPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<div className="text-center py-5"><h3>404 - Page Not Found</h3></div>} />
            </Routes>
          </main>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;