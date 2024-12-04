// client/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/auth/RouteGuards';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ChatInterface from './components/chat/ChatInterface';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        <Route path="/chat" element={
          <ProtectedRoute>
            <ChatInterface />
          </ProtectedRoute>
        } />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;