const admin = require('firebase-admin');
const dotenv = require('dotenv');

// 환경 변수 로드
dotenv.config();

// 프로젝트 ID 설정
process.env.GOOGLE_CLOUD_PROJECT = 'eulji-45720';

// Firebase Admin 초기화
admin.initializeApp({
  projectId: 'eulji-45720'
});

const db = admin.firestore();
const auth = admin.auth();

async function addAdmin() {
  const email = process.argv[2] || 'admin@ycse.kr';

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║       관리자 추가 스크립트 실행중...       ║');
  console.log('╚══════════════════════════════════════════╝\n');
  console.log(`대상 이메일: ${email}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // 이메일로 사용자 찾기
    console.log('1. 사용자 검색 중...');
    const user = await auth.getUserByEmail(email);
    console.log(`   ✓ 사용자 찾음: ${user.email}`);
    console.log(`   ✓ UID: ${user.uid}\n`);

    // admins 컬렉션에 사용자 추가
    console.log('2. 관리자 권한 부여 중...');
    await db.collection('admins').doc(user.uid).set({
      email: user.email,
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
      role: 'admin',
      addedBy: 'script'
    });
    console.log('   ✓ Firestore admins 컬렉션에 추가 완료\n');

    console.log('╔══════════════════════════════════════════╗');
    console.log('║            ✅ 성공적으로 완료!            ║');
    console.log('╚══════════════════════════════════════════╝');
    console.log(`\n${email} 사용자가 관리자로 설정되었습니다.`);
    console.log('앱을 새로고침하면 관리자 메뉴가 표시됩니다.\n');

  } catch (error) {
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║              ❌ 오류 발생!                ║');
    console.log('╚══════════════════════════════════════════╝\n');

    if (error.code === 'auth/user-not-found') {
      console.error(`${email} 사용자를 찾을 수 없습니다.\n`);
      console.log('해결 방법:');
      console.log('1. 사용자가 먼저 회원가입을 완료했는지 확인하세요.');
      console.log('2. 이메일 주소가 정확한지 확인하세요.');
      console.log(`3. Firebase Console에서 확인: https://console.firebase.google.com/project/eulji-45720/authentication/users\n`);
    } else {
      console.error('오류 내용:', error.message);
      console.error('\n전체 오류:', error);
    }
  } finally {
    process.exit(0);
  }
}

// 스크립트 실행
addAdmin();