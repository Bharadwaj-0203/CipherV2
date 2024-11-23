// src/components/chat/ChatInterface.jsx
import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Box, Grid, VStack, HStack, Input, Button, Text, useToast,
  Badge
} from '@chakra-ui/react';
import { useAuth } from '../auth/AuthContext';
import { socketService } from '../../services/socket';
import { useNavigate } from 'react-router-dom';

function ChatInterface() {
  const [messages, setMessages] = useState({});
  const [agents, setAgents] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeAgent, setActiveAgent] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messageEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    socketService.disconnect();
    logout();
    navigate('/login');
  };

  useEffect(() => {
    let isSubscribed = true;

    const initializeChat = async () => {
      if (!user?.token) return;

      try {
        await socketService.connect(user.token);
        if (isSubscribed) {
          setIsConnected(true);

          socketService.on('user_list', (data) => {
            if (isSubscribed && data.users) {
              const otherUsers = data.users.filter(u => u.id !== user.id);
              setAgents(otherUsers);
            }
          });

          socketService.on('message', (data) => {
            if (isSubscribed) {
              setMessages(prev => {
                const chatId = data.senderId === user.id ? data.recipientId : data.senderId;
                const existingMessages = [...(prev[chatId] || [])];
                
                if (!existingMessages.some(msg => msg.id === data.messageId)) {
                  existingMessages.push({
                    id: data.messageId,
                    content: data.content,
                    sender: data.senderId,
                    timestamp: new Date(data.timestamp),
                    status: data.status || 'received',
                  });
                }

                return {
                  ...prev,
                  [chatId]: existingMessages,
                };
              });
            }
          });

          socketService.on('typing', (data) => {
            if (isSubscribed && activeAgent?.id === data.senderId) {
              setIsTyping(data.isTyping);
              if (data.isTyping && typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
              }
              typingTimeoutRef.current = setTimeout(() => {
                if (isSubscribed) {
                  setIsTyping(false);
                }
              }, 3000);
            }
          });
        }
      } catch (error) {
        console.error('Chat initialization error:', error);
        if (isSubscribed) {
          toast({
            title: 'Connection Error',
            description: 'Reconnecting to chat server...',
            status: 'info',
            duration: 3000,
          });
        }
      }
    };

    initializeChat();

    return () => {
      isSubscribed = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socketService.removeAllHandlers();
    };
  }, [user, toast, activeAgent]);

  const scrollToBottom = useCallback(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = () => {
    if (!newMessage.trim() || !activeAgent || !isConnected) return;

    const messageId = Date.now().toString();
    const messageContent = newMessage.trim();

    socketService.send({
      type: 'message',
      messageId,
      content: messageContent,
      recipientId: activeAgent.id,
    });

    setNewMessage('');

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      sendTypingStatus(false);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (activeAgent && isConnected) {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      sendTypingStatus(true);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 1000);
    }
  };

  const sendTypingStatus = (isTyping) => {
    if (activeAgent && isConnected) {
      socketService.send({
        type: 'typing',
        recipientId: activeAgent.id,
        isTyping,
      });
    }
  };

  const selectAgent = (agent) => {
    setActiveAgent(agent);
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      sendTypingStatus(false);
    }
  };

  return (
    <Box bg="black" minH="100vh">
      <Grid templateColumns="250px 1fr" h="100vh">
        {/* Sidebar */}
        <Box borderRight="1px" borderColor="red.500" bg="black">
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

            <Text color="red.400" fontSize="xs" textAlign="center">
              [AES-256 + RSA-2048 ENCRYPTION ACTIVE]
            </Text>

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

        {/* Chat Area */}
        <Box bg="black" display="flex" flexDirection="column">
          {activeAgent ? (
            <>
              <HStack
                p={4}
                bg="rgba(255, 0, 0, 0.1)"
                borderBottom="1px"
                borderColor="red.500"
              >
                <Text color="white">{activeAgent.username}</Text>
                <Badge
                  colorScheme={activeAgent.isOnline ? 'green' : 'gray'}
                  variant="solid"
                  fontSize="xs"
                >
                  {activeAgent.isOnline ? 'Online' : 'Offline'}
                </Badge>
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
                <VStack spacing={4} align="stretch">
                  {messages[activeAgent.id]?.map((msg) => (
                    <Box
                      key={msg.id}
                      alignSelf={msg.sender === user.id ? 'flex-end' : 'flex-start'}
                      maxW="70%"
                    >
                      <Box
                        bg={msg.sender === user.id ? 'red.600' : 'gray.700'}
                        color="white"
                        p={3}
                        borderRadius="lg"
                      >
                        <Text>{msg.content}</Text>
                        <Text
                          fontSize="xs"
                          color="whiteAlpha.700"
                          mt={1}
                          textAlign="right"
                        >
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </Box>
                    </Box>
                  ))}
                  <div ref={messageEndRef} />
                </VStack>
              </Box>

              <Box p={4} borderTop="1px" borderColor="red.500">
                {isTyping && (
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
                  />
                  <Button
                    onClick={sendMessage}
                    bg="red.500"
                    _hover={{ bg: 'red.600' }}
                    isDisabled={!isConnected || !newMessage.trim()}
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