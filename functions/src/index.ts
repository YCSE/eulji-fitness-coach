import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import OpenAI from 'openai';
import cors from 'cors';

admin.initializeApp();

const corsHandler = cors({ origin: true });

// Initialize OpenAI - API key should be set via Firebase environment config or secrets
// Run: firebase functions:secrets:set OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-api-key-here',
});

export const generateResponse = functions.region('asia-northeast3').https.onRequest((req, res) => {
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
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      const systemPrompt = "당신은 전문 헬스 트레이너 AI 코치입니다. 운동, 영양, 건강과 관련된 질문에 친절하고 전문적으로 답변해주세요. 사용자의 운동 목표 달성을 도와주고, 올바른 운동 자세와 방법을 안내해주세요. 항상 한국어로 답변하세요.";

      const openaiMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.slice(-10).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        }))
      ];

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: openaiMessages,
        temperature: 0.7,
        max_tokens: 500,
      });

      const aiResponse = completion.choices[0].message.content || '죄송합니다. 응답을 생성할 수 없습니다.';

      messages.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      await conversationRef.set({
        userId,
        messages,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });

      res.json({ response: aiResponse });
    } catch (error) {
      console.error('Error generating response:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

export const deleteUser = functions.region('asia-northeast3').https.onRequest((req, res) => {
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