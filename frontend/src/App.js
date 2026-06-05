import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Opportunities from './pages/Opportunities';
import PostOpportunity from './pages/PostOpportunity';
import Applications from './pages/Applications';
import Mentorship from './pages/Mentorship';
import MentorDashboard from './pages/MentorDashboard';
import Certificates from './pages/Certificates';
import VerifyCertificate from './pages/VerifyCertificate';
import OpportunityDetail from './pages/OpportunityDetail';
import Profile from './pages/Profile';
import EditOpportunity from './pages/EditOpportunity';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          <Navbar />
          <main>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify" element={<VerifyCertificate />} />
              <Route path="/verify/:code" element={<VerifyCertificate />} />
              <Route path="/opportunities" element={<Opportunities />} />
              <Route path="/opportunities/:id" element={<OpportunityDetail />} />

              {/* Protected - All authenticated users */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

              {/* Volunteer only */}
              <Route path="/applications" element={<ProtectedRoute allowedRoles={['volunteer']}><Applications /></ProtectedRoute>} />
              <Route path="/mentorship" element={<ProtectedRoute allowedRoles={['volunteer']}><Mentorship /></ProtectedRoute>} />
              <Route path="/certificates" element={<ProtectedRoute allowedRoles={['volunteer', 'organization']}><Certificates /></ProtectedRoute>} />

              {/* Opportunity edit — org only */}
              <Route path="/opportunities/:id/edit" element={<ProtectedRoute allowedRoles={['organization']}><EditOpportunity /></ProtectedRoute>} />

              {/* Organization only */}
              <Route path="/post-opportunity" element={<ProtectedRoute allowedRoles={['organization']}><PostOpportunity /></ProtectedRoute>} />
              <Route path="/my-opportunities" element={<ProtectedRoute allowedRoles={['organization']}><Dashboard /></ProtectedRoute>} />

              {/* Mentor only */}
              <Route path="/mentor" element={<ProtectedRoute allowedRoles={['mentor']}><MentorDashboard /></ProtectedRoute>} />

              {/* 404 */}
              <Route path="*" element={
                <div style={{ textAlign: 'center', padding: '80px 24px' }}>
                  <h1 style={{ fontSize: 48, color: '#d1d5db' }}>404</h1>
                  <p style={{ color: '#6b7280' }}>Page not found</p>
                </div>
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
