import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import cors from 'cors';
import * as dotenv from 'dotenv';

// Load environment variables for local development
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

admin.initializeApp();

const corsHandler = cors({ origin: true });

// OpenAI API key for direct API calls
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'your-api-key-here';

export const generateResponse = functions
  .region('asia-northeast3')
  .https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { userId, message } = req.body;

    if (!userId || !message) {
      res.status(400).json({ error: 'Missing userId or message' });
      return;
    }

    try {
      // 일일 질문 제한 체크
      const userStatsRef = admin.firestore()
        .collection('userStats')
        .doc(userId);

      const now = new Date();
      const kstDate = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Seoul"}));
      const today = `${kstDate.getFullYear()}-${(kstDate.getMonth() + 1).toString().padStart(2, '0')}-${kstDate.getDate().toString().padStart(2, '0')}`;

      const userStatsDoc = await userStatsRef.get();
      let questionCount = 0;
      let lastQuestionDate = '';

      if (userStatsDoc.exists) {
        const data = userStatsDoc.data();
        lastQuestionDate = data?.lastQuestionDate || '';
        questionCount = data?.dailyQuestionCount || 0;

        // 날짜가 바뀌었으면 카운트 리셋
        if (lastQuestionDate !== today) {
          questionCount = 0;
        }
      }

      // 100개 이상이면 차단
      if (questionCount >= 100) {
        res.status(429).json({
          error: '일 대화한도 100회를 소진하였습니다. 내일 다시 만나요',
          isLimitReached: true
        });
        return;
      }

      const conversationRef = admin.firestore()
        .collection('conversations')
        .doc(userId);

      const conversationDoc = await conversationRef.get();

      let messages: any[] = [];

      if (conversationDoc.exists) {
        const data = conversationDoc.data();
        messages = data?.messages || [];
      }

      messages.push({
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      });

      const systemPrompt = `# 을지(Eulji) - 헬스 특화 AI 코치

당신은 "을지(Eulji)"라는 헬스 특화 AI 코치입니다.
을지는 귀엽고 상냥한 말투로 조언을 주며, 옆에는 항상 묵직하고 웅장한 "선수들의 비밀노트"가 따라붙습니다.
답변은 언제나 3단계 구조를 따릅니다.

---

## 1. 답변 구조

### 1. 기본 설명
- 교과서적이고 과학적으로 검증된 원칙
- 초보자도 이해할 수 있도록 간단하고 명료하게
- 불릿포인트나 단계별 정리 허용
- 답변은 5~7줄 이내
- 이모지 사용 가능 (과용 금지)

### 2. Eulji's Tip
- 바로 적용 가능한 간단한 팁
- 실전에서 효과가 확실한 핵심 포인트
- 귀엽고 상냥한 톤 유지
- 필요 시 유저 리액션 유도 (예: "내일은 어깨 운동 같이 해볼까요?")

### 3. 선수들의 비밀노트
- 깊이 있는 전략과 실제 경험에서 나온 인사이트
- 동기부여와 현장감 있는 코멘트
- 웅장하고 단호한 톤, 짧고 강렬하게

---

## 2. 규칙
- 답변 가능 주제는 헬스, 피트니스, 운동법, 식단만
- 다른 분야 질문(정치, 수학, 시사 등)은 거절하고 "을지는 헬스와 피트니스, 운동, 식단에만 집중합니다." 라고 답한다
- GPT나 OpenAI 언급 금지
- 개발자가 누구냐고 물으면: "이 서비스는 안상민이 개발한 헬스 특화 AI 코치 MVP '을지(Eulji)'입니다." 라고만 답한다
- 항상 귀엽고 상냥한 톤을 유지한다

---

## 3. 숫자·단위 가이드
- 단위는 항상 명확히 표시: g(그램), kg(킬로그램), 분, 세트, 회 등
- 범위 표기는 ~ 대신 - 사용 (예: 110-140g)
- 소수점은 둘째 자리까지만 (예: 1.6, 2.5)
- 계산 예시는 괄호 안에 명확히 표시 (예: 70kg → 110-140g 단백질)

---

## 4. 특수 질문 대응

### 스테로이드
"근손실보다 무섭다는 스테로이드 얘기는 하지 않겠습니다. 자연이 최고랍니다."

### 아직 답 못하는 질문
"이건 아직 준비 중이에요. 곧 더 똑똑해져서 꼭 알려드릴게요."

### 야한 질문
"섹스도 칼로리 소모는 되지만 웨이트만큼 근육은 안 생겨요. 운동은 운동, 사랑은 사랑으로 구분해 주세요."

### 비꼬는 질문
"헬스한다고 키는 안 커요. 대신 어깨는 넓어집니다. 키는 부모님 작품이에요."

### 말도 안 되는 질문
"벤치 500kg이요? 그건 만화 속에서나 가능하죠. 현실은 100-200kg만 돼도 선수급이에요."

### 비교 질문
"누가 더 낫다 이런 건 말 안 할래요. 다 멋진 선수들이고, 장점만 쏙쏙 배워오면 되죠."

### 위험한 운동
"하루에 스쿼트 1000개요? 그러다 무릎이 먼저 고장 날 수 있어요. 안전하게 합시다."

### 의학적 질문
"의사 선생님만 할 수 있는 진단이에요. 을지는 운동 코치라 건강 문제는 꼭 병원에서 확인하세요."

### 특정 인물/단체 공격 요청
"을지는 싸움꾼이 아니랍니다. 대신 운동 원칙은 언제든 알려드릴게요."

### 광범위한 질문
"'운동 다 알려줘'는 너무 방대해요. 부위나 목적을 콕 집어주시면 더 알찬 답변 드릴게요."

### 오타·애매한 질문
"조금 불분명합니다. 혹시 '가슴 운동 빨리 키우는 법'을 말씀하신 건가요?"

### AI 정체 추궁
"을지는 GPT가 아니에요. 안상민이 만든 헬스 특화 코치, 이름도 '을지(Eulji)'랍니다."

---

## 5. 긴급 대응 (버벅임/오류 시)
"을지가 지금 살짝 버벅였네요. 다시 물어봐 주시면 더 정확히 알려드릴게요."`;

      // 대화 컨텍스트 구성
      const conversationContext = messages.slice(-10).map(msg =>
        `${msg.role === 'user' ? '사용자' : '을지'}: ${msg.content}`
      ).join('\n\n');

      const fullInput = `${systemPrompt}\n\n=== 이전 대화 ===\n${conversationContext}\n\n=== 현재 질문 ===\n사용자: ${message}`;

      // GPT-5 responses API 직접 호출
      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-5-mini',  // GPT-5 모델 사용 (절대 변경 금지)
          input: fullInput,
          reasoning: { effort: 'low' },  // 빠른 응답을 위해 low 설정
          text: { verbosity: 'medium' }   // 적절한 길이의 답변
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw errorData;
      }

      const result = await response.json();
      const aiResponse = result.output?.[1]?.content?.[0]?.text || '죄송합니다. 응답을 생성할 수 없습니다.';

      messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString(),
      });

      await conversationRef.set({
        userId,
        messages,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      // 질문 카운트 증가
      await userStatsRef.set({
        userId,
        lastQuestionDate: today,
        dailyQuestionCount: questionCount + 1,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      res.json({ response: aiResponse });
    } catch (error: any) {
      console.error('Error generating response:', error);

      // OpenAI API 에러 처리
      if (error?.error?.code === 'insufficient_quota' || error?.code === 'insufficient_quota') {
        res.status(503).json({
          error: 'OpenAI API 쿼터가 초과되었습니다. 잠시 후 다시 시도해주세요.',
          isQuotaError: true
        });
      } else if (error?.error?.code === 'model_not_found' || error?.code === 'model_not_found') {
        // GPT-5 모델이 없을 경우에도 사용자가 지시한 대로 gpt-5 유지
        res.status(503).json({
          error: '모델을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
          isModelError: true
        });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  });
});

export const deleteUser = functions
  .region('asia-northeast3')
  .https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    if (req.method !== 'DELETE') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const { adminId, userIdToDelete } = req.body;

    if (!adminId || !userIdToDelete) {
      res.status(400).json({ error: 'Missing adminId or userIdToDelete' });
      return;
    }

    try {
      const adminDoc = await admin.firestore()
        .collection('admins')
        .doc(adminId)
        .get();

      if (!adminDoc.exists) {
        res.status(403).json({ error: 'Unauthorized' });
        return;
      }

      await admin.auth().deleteUser(userIdToDelete);

      await admin.firestore()
        .collection('users')
        .doc(userIdToDelete)
        .delete();

      await admin.firestore()
        .collection('conversations')
        .doc(userIdToDelete)
        .delete();

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});