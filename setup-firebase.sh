#!/bin/bash

echo "Firebase 프로젝트 설정을 시작합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 프로젝트 ID
PROJECT_ID="eulji-45720"

echo -e "${YELLOW}1. Firebase 로그인 확인...${NC}"
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}Firebase에 로그인되어 있지 않습니다.${NC}"
    echo "다음 명령어를 실행하여 로그인해주세요:"
    echo -e "${GREEN}firebase login${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Firebase 로그인 확인됨${NC}"

echo -e "${YELLOW}2. 프로젝트 설정...${NC}"
firebase use $PROJECT_ID --add 2>/dev/null || firebase use $PROJECT_ID

echo -e "${YELLOW}3. Functions 빌드...${NC}"
cd functions
npm run build
cd ..

echo -e "${YELLOW}4. React 앱 빌드...${NC}"
npm run build

echo -e "${YELLOW}5. Firebase 서비스 배포...${NC}"

# Firestore 보안 규칙 배포
echo -e "${YELLOW}   - Firestore 규칙 배포 중...${NC}"
firebase deploy --only firestore:rules

# Functions 배포
echo -e "${YELLOW}   - Functions 배포 중...${NC}"
firebase deploy --only functions

# Hosting 배포
echo -e "${YELLOW}   - Hosting 배포 중...${NC}"
firebase deploy --only hosting

echo -e "${GREEN}===============================================${NC}"
echo -e "${GREEN}Firebase 배포가 완료되었습니다!${NC}"
echo -e "${GREEN}===============================================${NC}"
echo ""
echo -e "앱 URL:"
echo -e "  ${GREEN}https://${PROJECT_ID}.web.app${NC}"
echo -e "  ${GREEN}https://${PROJECT_ID}.firebaseapp.com${NC}"
echo ""
echo -e "${YELLOW}관리자 설정:${NC}"
echo "1. Firebase Console에 접속: https://console.firebase.google.com/project/${PROJECT_ID}"
echo "2. Authentication > Sign-in method에서 이메일/비밀번호 인증 활성화"
echo "3. Firestore Database > 데이터에서 'admins' 컬렉션 생성"
echo "4. 관리자로 지정할 사용자의 UID를 문서 ID로 추가"
echo ""
echo -e "${GREEN}배포 완료!${NC}"