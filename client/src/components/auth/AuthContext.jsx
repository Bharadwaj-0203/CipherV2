//client/src/components/auth/AuthContext
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socketService } from '../../services/socket';
import { encryptionService } from '../../services/encryption';
import { api } from '../../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          await api.auth.verify();

          // Initialize encryption service
          await encryptionService.initialize();

          setUser(userData);
          setToken(storedToken);
        } catch (error) {
          console.error('Auth initialization error:', error);
          handleLogout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await socketService.disconnect();
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setToken(null);
      navigate('/login');
    }
  };

  const login = async (userData) => {
    try {
      setUser(userData);
      setToken(userData.token);
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Initialize encryption service after successful login
      await encryptionService.initialize();
      
      navigate('/chat');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  if (isLoading) {
    return null; // Or a loading spinner
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout: handleLogout,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
};