import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/chat');
    } catch (error: any) {
      setError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%', backgroundColor: '#2a2a2a', color: '#ffffff' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box
              component="img"
              src="/eulji.png"
              alt="을지"
              sx={{ width: 200, height: 'auto', mb: 2 }}
            />
            <Typography component="h2" variant="h6" sx={{ mt: 2, fontFamily: "'Asta Sans', sans-serif", color: '#ffffff' }}>
              로그인
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="이메일"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                '& label': { fontFamily: "'Asta Sans', sans-serif", color: '#b0b0b0' },
                '& .MuiInputBase-input': { color: '#ffffff', backgroundColor: '#3a3a3a', borderRadius: 1 },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#4a4a4a' },
                  '&:hover fieldset': { borderColor: '#d4af37' },
                  '&.Mui-focused fieldset': { borderColor: '#d4af37' }
                }
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="비밀번호"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                '& label': { fontFamily: "'Asta Sans', sans-serif", color: '#b0b0b0' },
                '& .MuiInputBase-input': { color: '#ffffff', backgroundColor: '#3a3a3a', borderRadius: 1 },
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: '#4a4a4a' },
                  '&:hover fieldset': { borderColor: '#d4af37' },
                  '&.Mui-focused fieldset': { borderColor: '#d4af37' }
                }
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                fontFamily: "'Asta Sans', sans-serif",
                backgroundColor: '#d4af37',
                color: '#070707',
                '&:hover': {
                  backgroundColor: '#b5962f'
                },
                '&.Mui-disabled': {
                  backgroundColor: '#3a3a3a',
                  color: '#666'
                }
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: '#070707' }} /> : '로그인'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link to="/signup" style={{ textDecoration: 'none' }}>
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{ fontFamily: "'Asta Sans', sans-serif" }}
                >
                  계정이 없으신가요? 회원가입
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;