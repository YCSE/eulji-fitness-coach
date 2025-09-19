import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Container,
  Paper,
  TextField,
  IconButton,
  Typography,
  Avatar,
  CircularProgress,
  AppBar,
  Toolbar,
  Button
} from '@mui/material';
import {
  Send as SendIcon,
  FitnessCenter,
  Person,
  Logout
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const { currentUser, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading || !currentUser) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await fetch(
        `${process.env.REACT_APP_FUNCTIONS_URL || 'https://asia-northeast3-eulji-45720.cloudfunctions.net'}/generateResponse`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: currentUser.uid,
            message: inputMessage
          })
        }
      );

      const data = await response.json();

      // 일일 제한 도달 체크
      if (data.isLimitReached) {
        const limitMessage: Message = {
          role: 'assistant',
          content: data.error,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, limitMessage]);
        return;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || data.error || '응답을 받을 수 없습니다.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: '죄송합니다. 메시지를 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static">
        <Toolbar>
          <FitnessCenter sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontFamily: "'Asta Sans', sans-serif" }}>
            을지
          </Typography>
          {isAdmin && (
            <Button
              color="inherit"
              onClick={() => navigate('/admin')}
              sx={{ mr: 2, fontFamily: "'Asta Sans', sans-serif" }}
            >
              관리자
            </Button>
          )}
          <IconButton color="inherit" onClick={handleLogout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', py: 2 }}>
        <Paper
          elevation={3}
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              p: 2,
              backgroundColor: '#f5f5f5'
            }}
          >
            {messages.length === 0 ? (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <FitnessCenter sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h5" color="text.secondary" sx={{ fontFamily: "'Asta Sans', sans-serif" }}>
                  을지에 오신 것을 환영합니다!
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2, fontFamily: "'Asta Sans', sans-serif" }}>
                  운동, 영양, 건강에 관한 질문을 해보세요.
                </Typography>
              </Box>
            ) : (
              messages.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                    mb: 2
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', maxWidth: '70%' }}>
                    {message.role === 'assistant' && (
                      <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
                        <FitnessCenter />
                      </Avatar>
                    )}
                    <Paper
                      sx={{
                        p: 2,
                        backgroundColor: message.role === 'user' ? 'primary.main' : 'white',
                        color: message.role === 'user' ? 'white' : 'text.primary',
                      }}
                    >
                      <Typography sx={{ fontFamily: "'Asta Sans', sans-serif", whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </Typography>
                    </Paper>
                    {message.role === 'user' && (
                      <Avatar sx={{ bgcolor: 'secondary.main', ml: 1 }}>
                        <Person />
                      </Avatar>
                    )}
                  </Box>
                </Box>
              ))
            )}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
                    <FitnessCenter />
                  </Avatar>
                  <Paper sx={{ p: 2 }}>
                    <CircularProgress size={20} />
                  </Paper>
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Box sx={{ p: 2, backgroundColor: 'white', borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="운동에 관한 질문을 입력하세요..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
                sx={{
                  '& input': { fontFamily: "'Asta Sans', sans-serif" },
                  '& input::placeholder': { fontFamily: "'Asta Sans', sans-serif" }
                }}
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || loading}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Chat;