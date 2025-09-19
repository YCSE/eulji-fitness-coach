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
import { styled } from '@mui/material/styles';
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
      <AppBar position="static" sx={{ backgroundColor: '#070707' }}>
        <Toolbar>
          <Box
            component="img"
            src="/eulji.png"
            alt="을지"
            sx={{ height: 40 }}
          />
          <Box sx={{ flexGrow: 1 }} />
          {isAdmin && (
            <Button
              color="inherit"
              onClick={() => navigate('/admin')}
              sx={{ mr: 2, fontFamily: "'Asta Sans', sans-serif", color: '#d4af37', '&:hover': { backgroundColor: 'rgba(212, 175, 55, 0.08)' } }}
            >
              관리자
            </Button>
          )}
          <IconButton onClick={handleLogout} sx={{ color: '#d4af37' }}>
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
            overflow: 'hidden',
            backgroundColor: '#2a2a2a'
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              overflow: 'auto',
              p: 2,
              backgroundColor: '#1a1a1a'
            }}
          >
            {messages.length === 0 ? (
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Box
                  component="img"
                  src="/eulji.png"
                  alt="을지"
                  sx={{ width: 100, height: 'auto', mb: 2 }}
                />
                <Typography variant="h5" sx={{ fontFamily: "'Asta Sans', sans-serif", color: '#ffffff' }}>
                  을지에 오신 것을 환영합니다!
                </Typography>
                <Typography variant="body1" sx={{ mt: 2, fontFamily: "'Asta Sans', sans-serif", color: '#b0b0b0' }}>
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
                      <Avatar sx={{ bgcolor: '#2d2d2d', mr: 1, border: '1px solid #3a3a3a' }}>
                        <FitnessCenter sx={{ color: '#d4af37' }} />
                      </Avatar>
                    )}
                    <Paper
                      sx={{
                        p: 2,
                        backgroundColor: message.role === 'user' ? '#3d3520' : '#2d2d2d',
                        color: message.role === 'user' ? '#d4af37' : '#e0e0e0',
                        border: message.role === 'user' ? '1px solid #d4af3730' : 'none',
                      }}
                    >
                      <Typography sx={{ fontFamily: "'Asta Sans', sans-serif", whiteSpace: 'pre-wrap' }}>
                        {message.content}
                      </Typography>
                    </Paper>
                    {message.role === 'user' && (
                      <Avatar sx={{ bgcolor: '#3d3520', ml: 1, border: '1px solid #d4af3750' }}>
                        <Person sx={{ color: '#d4af37' }} />
                      </Avatar>
                    )}
                  </Box>
                </Box>
              ))
            )}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: '#2d2d2d', mr: 1, border: '1px solid #3a3a3a' }}>
                    <FitnessCenter sx={{ color: '#d4af37' }} />
                  </Avatar>
                  <Paper sx={{ p: 2, backgroundColor: '#2d2d2d' }}>
                    <CircularProgress size={20} sx={{ color: '#d4af37' }} />
                  </Paper>
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Box sx={{ p: 2, backgroundColor: '#2a2a2a', borderTop: 1, borderColor: '#3a3a3a' }}>
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
                  '& .MuiInputBase-input': {
                    fontFamily: "'Asta Sans', sans-serif",
                    color: '#ffffff'
                  },
                  '& .MuiInputBase-input::placeholder': {
                    fontFamily: "'Asta Sans', sans-serif",
                    color: '#b0b0b0'
                  },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#3a3a3a' },
                    '&:hover fieldset': { borderColor: '#d4af37' },
                    '&.Mui-focused fieldset': { borderColor: '#d4af37' }
                  }
                }}
              />
              <IconButton
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || loading}
                sx={{
                  color: '#d4af37',
                  '&.Mui-disabled': {
                    color: '#3a3a3a'
                  }
                }}
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