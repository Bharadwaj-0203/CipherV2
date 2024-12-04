// client/src/components/auth/RouteGuards.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Box, Spinner } from '@chakra-ui/react';

const LoadingSpinner = () => (
  <Box h="100vh" w="100vw" display="flex" alignItems="center" justifyContent="center" bg="black">
    <Spinner size="xl" color="red.500" thickness="4px" />
  </Box>
);

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <Navigate to="/chat" replace /> : children;
};