#!/usr/bin/env node

/**
 * 관리자 추가 스크립트 (Firebase CLI 사용)
 *
 * 사용법:
 * 1. 먼저 사용자가 회원가입을 완료해야 함
 * 2. 스크립트 실행: node scripts/addAdminSimple.js admin@ycse.kr
 *
 * 이 스크립트는 Firebase Console에서 수동으로 수행해야 할 작업을 안내합니다.
 */

const email = process.argv[2] || 'admin@ycse.kr';

console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    관리자 추가 가이드                          ║
╚══════════════════════════════════════════════════════════════╝

대상 이메일: ${email}

Firebase Console에서 다음 단계를 수행하세요:

1. Firebase Console 접속
   https://console.firebase.google.com/project/eulji-45720/firestore

2. Firestore Database 선택

3. "admins" 컬렉션이 없다면 생성
   - "+ 컬렉션 시작" 클릭
   - 컬렉션 ID: admins

4. 사용자 UID 확인
   - Authentication 탭으로 이동
   - ${email} 사용자 찾기
   - UID 복사

5. admins 컬렉션에 문서 추가
   - 문서 ID: [복사한 UID]
   - 필드 추가:
     • email (string): ${email}
     • addedAt (timestamp): 서버 타임스탬프
     • role (string): admin

6. 저장 후 앱 새로고침

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

또는 Firebase CLI를 사용한 자동화 (Node.js 스크립트):
`);

// Firebase 프로젝트 정보 출력
console.log(`
자동화 스크립트를 원한다면, functions 디렉토리에서 다음 명령 실행:

cat > addAdmin.js << 'EOF'
const admin = require('firebase-admin');
admin.initializeApp();

async function addAdmin() {
  const email = '${email}';
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.firestore().collection('admins').doc(user.uid).set({
      email: email,
      addedAt: admin.firestore.FieldValue.serverTimestamp(),
      role: 'admin'
    });
    console.log('✅ 관리자 추가 완료:', email, 'UID:', user.uid);
  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
  process.exit(0);
}

addAdmin();
EOF

node addAdmin.js
`);