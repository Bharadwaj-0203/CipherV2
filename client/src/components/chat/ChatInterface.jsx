import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box, Grid, VStack, HStack, Input, Button, Text, useToast, Badge, Spinner
} from '@chakra-ui/react';
import { useAuth } from '../auth/AuthContext';
import { socketService } from '../../services/socket';
import { encryptionService } from '../../services/encryption';
import { api } from '../../services/api';

function ChatInterface() {
  const [messages, setMessages] = useState({});
  const [agents, setAgents] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeAgent, setActiveAgent] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user, logout } = useAuth();
  const toast = useToast();

  useEffect(() => {
    let mounted = true;

    const initializeChat = async () => {
      if (!user?.token) return;

      try {
        socketService.removeAllHandlers();
        
        socketService.on('message', handleMessage);
        socketService.on('message_confirmation', handleMessageConfirmation);
        socketService.on('typing', handleTyping);
        socketService.on('user_list', handleUserList);
        socketService.on('error', handleError);
        socketService.on('auth_success', () => {
          if (mounted) setIsConnected(true);
        });

        await socketService.connect(user.token);
        await fetchAllMessages();
      } catch (error) {
        console.error('Chat initialization error:', error);
        handleError(error);
      } finally {
        if (mounted) setIsLoadingHistory(false);
      }
    };

    initializeChat();

    return () => {
      mounted = false;
      socketService.removeAllHandlers();
    };
  }, [user]);

  useEffect(() => {
    if (messageEndRef.current && activeAgent) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeAgent]);

  const fetchAllMessages = async () => {
    try {
      const response = await api.messages.getAll();
      if (response.success) {
        const decryptedMessages = {};
        for (const [chatId, messages] of Object.entries(response.data)) {
          decryptedMessages[chatId] = await Promise.all(messages.map(async (msg) => ({
            ...msg,
            content: await encryptionService.decryptMessage(msg.content, msg.iv)
          })));
        }
        setMessages(decryptedMessages);
      } else {
        throw new Error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      handleError(error);
    }
  };

  const handleMessage = useCallback(async (data) => {
    try {
      let messageContent = data.content;
      if (data.encrypted) {
        messageContent = await encryptionService.decryptMessage(
          data.encrypted.data,
          data.encrypted.iv
        );
      }

      setMessages(prev => {
        const chatId = data.senderId === user.id ? data.recipientId : data.senderId;
        const existingMessages = [...(prev[chatId] || [])];
        
        if (!existingMessages.some(msg => msg.id === data.messageId)) {
          existingMessages.push({
            id: data.messageId,
            content: messageContent,
            sender: data.senderId,
            timestamp: new Date(data.timestamp),
            status: data.status
          });
        }

        return {
          ...prev,
          [chatId]: existingMessages
        };
      });

    } catch (error) {
      console.error('Message processing error:', error);
      handleError(error);
    }
  }, [user?.id]);

  const handleMessageConfirmation = useCallback((data) => {
    setMessages(prev => {
      const chatId = data.recipientId;
      const updatedMessages = [...(prev[chatId] || [])];
      const messageIndex = updatedMessages.findIndex(msg => msg.id === data.messageId);
      
      if (messageIndex === -1) {
        updatedMessages.push({
          id: data.messageId,
          content: data.content,
          sender: user.id,
          timestamp: new Date(data.timestamp),
          status: data.status
        });
      } else {
        updatedMessages[messageIndex] = {
          ...updatedMessages[messageIndex],
          status: data.status
        };
      }

      return {
        ...prev,
        [chatId]: updatedMessages
      };
    });
  }, [user?.id]);

  const handleUserList = useCallback((data) => {
    if (!data.users) return;
    
    const otherUsers = data.users.filter(u => u.id !== user?.id);
    setAgents(otherUsers);
  }, [user?.id]);

  const handleTyping = useCallback((data) => {
    setAgents(prevAgents => prevAgents.map(agent => {
      if (agent.id === data.senderId) {
        return { ...agent, isTyping: data.isTyping };
      }
      return agent;
    }));
  }, []);

  const handleError = useCallback((error) => {
    toast({
      title: 'Error',
      description: error.message || 'Something went wrong',
      status: 'error',
      duration: 3000,
      isClosable: true
    });
  }, [toast]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeAgent || !isConnected || isSending) return;

    setIsSending(true);
    const messageContent = newMessage.trim();
    setNewMessage('');

    try {
      await socketService.sendMessage(activeAgent.id, messageContent);
    } catch (error) {
      console.error('Failed to send message:', error);
      handleError(error);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (activeAgent && isConnected) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      socketService.send({
        type: 'typing',
        recipientId: activeAgent.id,
        isTyping: true
      });

      typingTimeoutRef.current = setTimeout(() => {
        socketService.send({
          type: 'typing',
          recipientId: activeAgent.id,
          isTyping: false
        });
      }, 1000);
    }
  };

  const handleLogout = async () => {
    try {
      await socketService.disconnect();
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      logout();
    }
  };

  const selectAgent = (agent) => {
    setActiveAgent(agent);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      if (activeAgent) {
        socketService.send({
          type: 'typing',
          recipientId: activeAgent.id,
          isTyping: false
        });
      }
    }
  };

  if (isLoadingHistory) {
    return (
      <Box 
        bg="black" 
        h="100vh" 
        w="100vw" 
        display="flex" 
        alignItems="center" 
        justifyContent="center"
      >
        <Spinner size="xl" color="red.500" thickness="4px" />
      </Box>
    );
  }

  const renderMessage = (msg) => (
    <Box
      key={msg.id}
      alignSelf={msg.sender === user.id ? 'flex-end' : 'flex-start'}
      maxW="70%"
      mb={4}
    >
      <Box
        bg={msg.sender === user.id ? 'red.600' : 'gray.700'}
        color="white"
        p={3}
        borderRadius="lg"
      >
        <Text>{msg.content}</Text>
        <HStack justify="flex-end" spacing={2} mt={1}>
          <Text fontSize="xs" color="whiteAlpha.700">
            {new Date(msg.timestamp).toLocaleTimeString()}
          </Text>
          {msg.sender === user.id && (
            <Badge
              colorScheme={
                msg.status === 'delivered' ? 'green' :
                msg.status === 'sent' ? 'blue' :
                msg.status === 'sending' ? 'yellow' :
                'red'
              }
              fontSize="xs"
            >
              {msg.status}
            </Badge>
          )}
        </HStack>
      </Box>
    </Box>
  );

  return (
    <Box bg="black" h="100vh" w="100vw" overflow="hidden">
      <Grid templateColumns="250px 1fr" h="100%" maxH="100vh" w="100%">
        <Box borderRight="1px" borderColor="red.500" bg="black" overflowY="auto">
          <VStack h="full" p={4} spacing={4} align="stretch">
            <HStack justify="space-between" mb={2}>
              <Text color="red.500" fontWeight="bold">
                ACTIVE AGENTS ({agents.filter(a => a.isOnline).length})
              </Text>
              <Button
                size="sm"
                bg="red.500"
                _hover={{ bg: 'red.600' }}
                color="white"
                onClick={handleLogout}
              >
                LOGOUT
              </Button>
            </HStack>

            {agents.map((agent) => (
              <Box
                key={agent.id}
                p={3}
                bg={activeAgent?.id === agent.id ? 'rgba(255, 0, 0, 0.1)' : 'transparent'}
                borderRadius="md"
                cursor="pointer"
                onClick={() => selectAgent(agent)}
                borderWidth="1px"
                borderColor={activeAgent?.id === agent.id ? 'red.500' : 'transparent'}
                _hover={{ bg: 'rgba(255, 0, 0, 0.05)' }}
              >
                <HStack justify="space-between">
                  <HStack>
                    <Box
                      w={2}
                      h={2}
                      borderRadius="full"
                      bg={agent.isOnline ? 'green.500' : 'gray.500'}
                    />
                    <Text color="white">{agent.username}</Text>
                  </HStack>
                  {agent.isOnline && (
                    <Badge colorScheme="green" variant="solid" fontSize="xs">
                      Online
                    </Badge>
                  )}
                </HStack>
              </Box>
            ))}
          </VStack>
        </Box>

        <Box bg="black" display="flex" flexDirection="column" h="100%">
          {activeAgent ? (
            <>
              <HStack
                p={4}
                bg="rgba(255, 0, 0, 0.1)"
                borderBottom="1px"
                borderColor="red.500"
                justify="space-between"
              >
                <HStack>
                  <Text color="white">{activeAgent.username}</Text>
                  <Badge
                    colorScheme={activeAgent.isOnline ? 'green' : 'gray'}
                    variant="solid"
                    fontSize="xs"
                  >
                    {activeAgent.isOnline ? 'Online' : 'Offline'}
                  </Badge>
                </HStack>
                {!isConnected && (
                  <Badge colorScheme="red" variant="solid">
                    Disconnected
                  </Badge>
                )}
              </HStack>

              <Box
                flex="1"
                overflowY="auto"
                p={4}
                css={{
                  '&::-webkit-scrollbar': {
                    width: '4px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: 'rgba(255, 0, 0, 0.1)',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#e53e3e',
                    borderRadius: '24px',
                  },
                }}
              >
                <VStack spacing={0} align="stretch">
                  {messages[activeAgent.id]?.map(renderMessage)}
                  <div ref={messageEndRef} />
                </VStack>
              </Box>

              <Box p={4} borderTop="1px" borderColor="red.500">
                {activeAgent && agents.find(a => a.id === activeAgent.id)?.isTyping && (
                  <Text color="red.300" fontSize="sm" mb={2}>
                    {activeAgent.username} is typing...
                  </Text>
                )}
                <HStack>
                  <Input
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type your message..."
                    bg="transparent"
                    border="1px solid"
                    borderColor="red.500"
                    _hover={{ borderColor: 'red.400' }}
                    color="white"
                    disabled={!isConnected}
                  />
                  <Button
                    onClick={sendMessage}
                    bg="red.500"
                    _hover={{ bg: 'red.600' }}
                    isLoading={isSending}
                    isDisabled={!isConnected || !newMessage.trim()}
                    color="white"
                  >
                    Send
                  </Button>
                </HStack>
              </Box>
            </>
          ) : (
            <Box
              flex="1"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="gray.500"
            >
              <Text>Select an agent to start messaging</Text>
            </Box>
          )}
        </Box>
      </Grid>
    </Box>
  );
}

export default ChatInterface;