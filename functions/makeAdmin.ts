import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Admin SDK가 이미 초기화되어 있는지 확인
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// 일회성 관리자 추가 함수
export const makeUserAdmin = functions
  .region('asia-northeast3')
  .https.onRequest(async (req, res) => {
    // CORS 허용
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { email, secretKey } = req.body;

    // 보안을 위한 임시 비밀 키 확인
    if (secretKey !== 'eulji-admin-setup-2024') {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    try {
      // 이메일로 사용자 찾기
      const user = await admin.auth().getUserByEmail(email);

      // admins 컬렉션에 사용자 추가
      await admin.firestore().collection('admins').doc(user.uid).set({
        email: user.email,
        addedAt: admin.firestore.FieldValue.serverTimestamp(),
        role: 'admin',
        addedBy: 'setup-function'
      });

      res.json({
        success: true,
        message: `${email} has been made an admin`,
        uid: user.uid
      });

    } catch (error: any) {
      console.error('Error making user admin:', error);

      if (error.code === 'auth/user-not-found') {
        res.status(404).json({
          error: 'User not found',
          message: `No user with email ${email} exists. Please sign up first.`
        });
      } else {
        res.status(500).json({
          error: 'Internal error',
          message: error.message
        });
      }
    }
  });