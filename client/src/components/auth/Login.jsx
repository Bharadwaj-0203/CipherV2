// src/components/auth/Login.jsx
import {
  Box, Container, VStack, Input, Button, Heading, Text, useToast,
  Alert, AlertIcon, AlertTitle, AlertDescription
} from '@chakra-ui/react';
import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

function Login() {
  const [credentials, setCredentials] = useState({ agentId: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      console.log('Attempting login with Agent ID:', credentials.agentId);
      
      // Call the API service for authentication
      const response = await api.auth.login(
        credentials.agentId,
        credentials.password
      );

      console.log('API Login Response:', response);

      // Check if response has the expected structure
      if (!response.success || !response.data) {
        throw new Error('Invalid response structure from server');
      }

      const { _id, username, token, publicKey } = response.data;

      if (!_id || !token) {
        throw new Error('Missing required data from server');
      }

      // Format user data for login
      const userData = {
        id: _id,
        username: username,
        token: token,
        publicKey: publicKey
      };

      // Log in with formatted user data
      login(userData);
      
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${username}!`,
        status: 'success',
        duration: 3000,
      });

    } catch (error) {
      console.error('Login Error:', error);
      toast({
        title: 'Access Denied',
        description: error.message || 'Invalid credentials',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box bg="black" minH="100vh" py={10}>
      <Container maxW="container.sm">
        <VStack
          bg="rgba(20, 0, 0, 0.9)"
          p={8}
          borderRadius="lg"
          spacing={6}
          border="1px"
          borderColor="red.500"
          boxShadow="0 0 20px rgba(255,0,0,0.2)"
        >
          <Heading color="red.500">CIPHER CHAT</Heading>
          <Text color="red.300" fontSize="sm">SECURE LOGIN PORTAL</Text>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={4}>
              <Input
                placeholder="AGENT IDENTIFIER"
                value={credentials.agentId}
                onChange={(e) =>
                  setCredentials({ ...credentials, agentId: e.target.value })
                }
                bg="blackAlpha.300"
                borderColor="red.500"
                _hover={{ borderColor: 'red.400' }}
                color="white"
                required
              />
              <Input
                type="password"
                placeholder="ACCESS CODE"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                bg="blackAlpha.300"
                borderColor="red.500"
                _hover={{ borderColor: 'red.400' }}
                color="white"
                required
              />
              <Button
                type="submit"
                w="full"
                bg="red.500"
                _hover={{ bg: 'red.600' }}
                color="white"
                isLoading={isLoading}
              >
                SECURE LOGIN
              </Button>
            </VStack>
          </form>

          <Link to="/register">
            <Text color="red.300" fontSize="sm" _hover={{ color: 'red.400' }}>
              [ REQUEST ACCESS ]
            </Text>
          </Link>

          <Text color="red.400" fontSize="xs">
            [AES-256 + RSA-2048 ENCRYPTION ACTIVE]
          </Text>
        </VStack>
      </Container>
    </Box>
  );
}

export default Login;