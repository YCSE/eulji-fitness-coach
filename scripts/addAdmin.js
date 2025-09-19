const admin = require('firebase-admin');

// Firebase Admin SDK 초기화
const serviceAccount = require('../eulji-45720-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://eulji-45720.firebaseio.com'
});

const db = admin.firestore();
const auth = admin.auth();

async function makeUserAdmin(email) {
  try {
    // 이메일로 사용자 찾기
    const user = await auth.getUserByEmail(email);
    console.log(`사용자 찾음: ${user.email} (UID: ${user.uid})`);

    // admins 컬렉션에 사용자 추가
    await db.collection('admins').doc(user.uid).set({
      email: user.email,
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
      addedBy: 'script'
    });

    console.log(`✅ ${email} 사용자가 관리자로 설정되었습니다.`);
    console.log(`   UID: ${user.uid}`);

  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ 오류: ${email} 사용자를 찾을 수 없습니다.`);
      console.log('   사용자가 먼저 회원가입을 해야 합니다.');
    } else {
      console.error('오류 발생:', error);
    }
  } finally {
    // Firebase 앱 종료
    await admin.app().delete();
  }
}

// 명령줄 인자에서 이메일 가져오기
const email = process.argv[2] || 'admin@ycse.kr';

console.log(`\n🔧 관리자 추가 스크립트`);
console.log(`━━━━━━━━━━━━━━━━━━━━━`);
console.log(`대상 이메일: ${email}`);
console.log(`━━━━━━━━━━━━━━━━━━━━━\n`);

makeUserAdmin(email);