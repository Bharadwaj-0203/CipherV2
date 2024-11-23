// src/components/auth/Register.jsx
import { checkPasswordStrength } from '../../services/passwordCheck';
import {
  Box,
  Container,
  VStack,
  Input,
  Button,
  Heading,
  Text,
  useToast,
  FormControl,
  FormLabel,
  FormErrorMessage,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';

function Register() {
  const [formData, setFormData] = useState({
    agentId: '',
    password: '',
    confirmPassword: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const toast = useToast();

  const validateForm = () => {
    const newErrors = {};
    if (!checkPasswordStrength(formData.password).isStrong) {
      newErrors.password = 'Password must contain uppercase, lowercase, number, special character and be at least 8 characters';
    }
    if (formData.agentId.length < 3) {
      newErrors.agentId = 'Agent ID must be at least 3 characters';
    }
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        await api.auth.register(formData.agentId, formData.password);
        
        toast({
          title: 'Registration Successful',
          description: 'You can now login with your credentials',
          status: 'success',
          duration: 3000,
        });
        navigate('/login');
      } catch (error) {
        toast({
          title: 'Registration Failed',
          description: error.message || 'Something went wrong',
          status: 'error',
          duration: 3000,
        });
      } finally {
        setIsLoading(false);
      }
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
          <Heading color="red.500">AGENT REGISTRATION</Heading>
          <Text color="red.300" fontSize="sm">
            SECURE ACCESS REQUEST PORTAL
          </Text>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={4}>
              <FormControl isInvalid={errors.agentId}>
                <FormLabel color="red.300">AGENT IDENTIFIER</FormLabel>
                <Input
                  value={formData.agentId}
                  onChange={(e) =>
                    setFormData({ ...formData, agentId: e.target.value })
                  }
                  bg="blackAlpha.300"
                  borderColor="red.500"
                  _hover={{ borderColor: 'red.400' }}
                  color="white"
                />
                <FormErrorMessage>{errors.agentId}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={errors.password}>
                <FormLabel color="red.300">ACCESS CODE</FormLabel>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  bg="blackAlpha.300"
                  borderColor="red.500"
                  _hover={{ borderColor: 'red.400' }}
                  color="white"
                />
                <FormErrorMessage>{errors.password}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={errors.confirmPassword}>
                <FormLabel color="red.300">CONFIRM ACCESS CODE</FormLabel>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  bg="blackAlpha.300"
                  borderColor="red.500"
                  _hover={{ borderColor: 'red.400' }}
                  color="white"
                />
                <FormErrorMessage>{errors.confirmPassword}</FormErrorMessage>
              </FormControl>

              <Button
                type="submit"
                w="full"
                bg="red.500"
                _hover={{ bg: 'red.600' }}
                color="white"
                mt={6}
                isLoading={isLoading}
              >
                SUBMIT REQUEST
              </Button>
            </VStack>
          </form>

          <Link to="/login">
            <Text color="red.300" fontSize="sm" _hover={{ color: 'red.400' }}>
              [ RETURN TO LOGIN ]
            </Text>
          </Link>

          <Text color="red.400" fontSize="xs">
            [ENCRYPTION ACTIVE]
          </Text>
        </VStack>
      </Container>
    </Box>
  );
}

export default Register;