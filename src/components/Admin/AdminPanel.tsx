import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../config/firebase';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Box,
  AppBar,
  Toolbar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  ArrowBack,
  Person
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface Conversation {
  role: string;
  content: string;
  timestamp: any;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [conversationDialogOpen, setConversationDialogOpen] = useState(false);

  const { currentUser, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) {
      navigate('/chat');
      return;
    }
    fetchUsers();
  }, [isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersCollection = collection(db, 'users');
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as User));
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete || !currentUser) return;

    try {
      const response = await fetch(
        `${process.env.REACT_APP_FUNCTIONS_URL || 'https://asia-northeast3-eulji-45720.cloudfunctions.net'}/deleteUser`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            adminId: currentUser.uid,
            userIdToDelete: userToDelete.id
          })
        }
      );

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userToDelete.id));
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleViewConversations = async (user: User) => {
    setSelectedUser(user);
    try {
      const conversationDoc = await getDoc(doc(db, 'conversations', user.id));
      if (conversationDoc.exists()) {
        const data = conversationDoc.data();
        setConversations(data.messages || []);
      } else {
        setConversations([]);
      }
      setConversationDialogOpen(true);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    }
  };

  const openDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#1a1a1a' }}>
      <AppBar position="static" sx={{ backgroundColor: '#070707' }}>
        <Toolbar>
          <Box
            component="img"
            src="/eulji.png"
            alt="을지"
            sx={{ height: 40, mr: 2 }}
          />
          <Typography variant="h6" sx={{ flexGrow: 1, fontFamily: "'Asta Sans', sans-serif", color: '#d4af37' }}>
            관리자 페이지
          </Typography>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => navigate('/chat')}
            sx={{ fontFamily: "'Asta Sans', sans-serif", color: '#d4af37', '&:hover': { backgroundColor: 'rgba(212, 175, 55, 0.08)' } }}
          >
            채팅으로 돌아가기
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 3, backgroundColor: '#2a2a2a' }}>
          <Typography variant="h5" sx={{ mb: 3, fontFamily: "'Asta Sans', sans-serif", color: '#ffffff' }}>
            회원 관리
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : users.length === 0 ? (
            <Alert severity="info" sx={{ backgroundColor: '#3a3a3a', color: '#ffffff' }}>등록된 회원이 없습니다.</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#070707' }}>
                    <TableCell sx={{ fontFamily: "'Asta Sans', sans-serif", fontWeight: 'bold', color: '#d4af37' }}>
                      이름
                    </TableCell>
                    <TableCell sx={{ fontFamily: "'Asta Sans', sans-serif", fontWeight: 'bold', color: '#d4af37' }}>
                      이메일
                    </TableCell>
                    <TableCell sx={{ fontFamily: "'Asta Sans', sans-serif", fontWeight: 'bold', color: '#d4af37' }}>
                      가입일
                    </TableCell>
                    <TableCell sx={{ fontFamily: "'Asta Sans', sans-serif", fontWeight: 'bold', color: '#d4af37' }} align="center">
                      작업
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} sx={{ '&:hover': { backgroundColor: '#3a3a3a' } }}>
                      <TableCell sx={{ fontFamily: "'Asta Sans', sans-serif", color: '#ffffff' }}>
                        {user.name}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "'Asta Sans', sans-serif", color: '#ffffff' }}>
                        {user.email}
                      </TableCell>
                      <TableCell sx={{ fontFamily: "'Asta Sans', sans-serif", color: '#ffffff' }}>
                        {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={() => handleViewConversations(user)}
                          sx={{ color: '#d4af37' }}
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => openDeleteDialog(user)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle sx={{ fontFamily: "'Asta Sans', sans-serif" }}>
          회원 삭제 확인
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: "'Asta Sans', sans-serif" }}>
            {userToDelete?.name} ({userToDelete?.email}) 회원을 정말 삭제하시겠습니까?
            <br />
            이 작업은 되돌릴 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ fontFamily: "'Asta Sans', sans-serif" }}>
            취소
          </Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained" sx={{ fontFamily: "'Asta Sans', sans-serif" }}>
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={conversationDialogOpen}
        onClose={() => setConversationDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontFamily: "'Asta Sans', sans-serif" }}>
          {selectedUser?.name}님의 대화 기록
        </DialogTitle>
        <DialogContent>
          {conversations.length === 0 ? (
            <Alert severity="info">대화 기록이 없습니다.</Alert>
          ) : (
            <List>
              {conversations.map((message, index) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="flex-start">
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        {message.role === 'user' ? (
                          <Person sx={{ mr: 1 }} />
                        ) : (
                          <Box
                            component="img"
                            src="/eulji.png"
                            alt="을지"
                            sx={{ width: 24, height: 'auto', mr: 1 }}
                          />
                        )}
                        <Typography
                          variant="subtitle2"
                          color="text.secondary"
                          sx={{ fontFamily: "'Asta Sans', sans-serif" }}
                        >
                          {message.role === 'user' ? '사용자' : '을지'}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body1"
                        sx={{ fontFamily: "'Asta Sans', sans-serif", whiteSpace: 'pre-wrap' }}
                      >
                        {message.content}
                      </Typography>
                    </Box>
                  </ListItem>
                  {index < conversations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConversationDialogOpen(false)}
            sx={{ fontFamily: "'Asta Sans', sans-serif" }}
          >
            닫기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPanel;