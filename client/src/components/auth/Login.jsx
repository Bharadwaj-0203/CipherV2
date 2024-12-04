// client/src/components/auth/Login.jsx
import {
  Box,
  Container,
  VStack,
  Input,
  Button,
  Heading,
  Text,
  useToast
} from '@chakra-ui/react';
import { useState } from 'react';
import { useAuth } from './AuthContext';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';

function Login() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { success, data } = await api.auth.login(
        credentials.username, 
        credentials.password
      );
      
      if (!success || !data) {
        throw new Error('Invalid server response');
      }

      const userData = {
        id: data._id,
        username: data.username,
        token: data.token,
        dhPrivateKey: data.dhPrivateKey,
        dhPublicKey: data.dhPublicKey
      };

      await login(userData);

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${userData.username}!`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Login failed:', error);
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
    <Box bg="black" h="100vh" w="100vw" py={10}>
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
                value={credentials.username}
                onChange={(e) => setCredentials({
                  ...credentials,
                  username: e.target.value
                })}
                bg="blackAlpha.300"
                borderColor="red.500"
                _hover={{ borderColor: 'red.400' }}
                color="white"
                required
                minLength={3}
              />
              <Input
                type="password"
                placeholder="ACCESS CODE"
                value={credentials.password}
                onChange={(e) => setCredentials({
                  ...credentials,
                  password: e.target.value
                })}
                bg="blackAlpha.300"
                borderColor="red.500"
                _hover={{ borderColor: 'red.400' }}
                color="white"
                required
                minLength={6}
              />
              <Button
                type="submit"
                w="full"
                bg="red.500"
                _hover={{ bg: 'red.600' }}
                color="white"
                isLoading={isLoading}
                disabled={!credentials.username || !credentials.password}
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
            [SECURE ENCRYPTION ACTIVE]
          </Text>
        </VStack>
      </Container>
    </Box>
  );
}

export default Login;