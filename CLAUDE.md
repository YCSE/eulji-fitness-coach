# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a fitness AI coach application (을지 - 헬스 특화 AI 코치) built with React, TypeScript, Firebase, and OpenAI GPT. It provides users with AI-powered fitness coaching through a chat interface.

## Key Commands

### Development
```bash
# Start React development server
npm start

# Build React app for production
npm run build

# Run tests
npm test

# Run type checking (no built-in command, use tsc directly)
npx tsc --noEmit
```

### Firebase Functions
```bash
# Navigate to functions directory first
cd functions

# Build TypeScript functions
npm run build

# Start Functions emulator locally
npm run serve

# Deploy only functions
npm run deploy

# View function logs
firebase functions:log -n 20
```

### Firebase Deployment
```bash
# Deploy everything (hosting, functions, firestore rules)
firebase deploy

# Deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules

# Switch Firebase project
firebase use eulji-45720
```

## Architecture

### Frontend Structure
- **React + TypeScript** application created with Create React App
- **Material-UI** for UI components
- **Firebase Auth** for authentication
- **React Router** for navigation
- Routes:
  - `/login` - User login
  - `/signup` - User registration
  - `/chat` - Main chat interface (protected)
  - `/admin` - Admin panel (protected, admin only)

### Backend Structure
- **Firebase Functions** (Node.js 20) in `/functions` directory
  - `generateResponse` - Handles chat requests with OpenAI GPT-5 responses API
  - `deleteUser` - Admin endpoint for user deletion
- **Firestore** collections:
  - `users` - User profiles
  - `conversations` - Chat history per user
  - `admins` - Admin user IDs
  - `userStats` - Daily question counts for rate limiting

### Firebase Configuration
- Project ID: `eulji-45720`
- Functions region: `asia-northeast3` (Seoul)
- Hosting URLs:
  - https://eulji-45720.web.app
  - https://eulji-45720.firebaseapp.com
- Functions endpoints:
  - `https://asia-northeast3-eulji-45720.cloudfunctions.net/generateResponse`
  - `https://asia-northeast3-eulji-45720.cloudfunctions.net/deleteUser`

## Critical Notes

### API Configuration
- OpenAI API key is set in `functions/.env`
- Firebase configuration is in `src/config/firebase.ts`

### OpenAI Integration
- **Model**: Uses `gpt-5` via OpenAI's `/v1/responses` endpoint
- **API Structure**: Direct fetch calls to `https://api.openai.com/v1/responses`
- **Parameters**:
  - `reasoning: { effort: 'low' }` for faster responses
  - `text: { verbosity: 'medium' }` for balanced answer length
- **CRITICAL**: Model is hardcoded as `gpt-5` (line 192 in functions/src/index.ts) - DO NOT CHANGE
- **Response Field**: Uses `result.output_text` from the API response

### Daily Rate Limiting
- Users are limited to 100 questions per day (KST timezone)
- Tracked via `userStats` collection in Firestore
- Resets daily at midnight KST

### Firebase Project Context
**WARNING**: Always verify the active Firebase project before deployment:
```bash
firebase use
```
The default project should be `eulji-45720`. Never deploy to other projects without explicit confirmation.

### Admin Setup
To grant admin privileges:
1. Create `admins` collection in Firestore
2. Add document with admin's UID as document ID
3. Admin users can access `/admin` route

### Environment Requirements
- **Node.js 20** (REQUIRED - DO NOT CHANGE): Project is configured for Node.js 20
  - `.nvmrc` files enforce Node.js 20
  - Functions require exactly Node.js 20
  - package.json engines specify Node.js >=20.0.0
- Firebase CLI must be installed and authenticated
- TypeScript compilation required before Functions deployment

## Deployment Checklist
1. Ensure correct Firebase project: `firebase use eulji-45720`
2. Build Functions: `cd functions && npm run build`
3. Build React app: `npm run build`
4. Deploy: `firebase deploy`

## System Prompt Context
The "을지(Eulji)" character has a structured 3-stage response format:
1. **기본 설명**: Scientific, textbook-style explanation
2. **Eulji's Tip**: Practical, immediately applicable tips
3. **선수들의 비밀노트**: Deep insights from field experience

Only responds to fitness, exercise, nutrition, and diet questions. All other topics are politely declined.

## Font Requirement
All UI text must use the "Asta Sans" Google Font, which is loaded in `public/index.html`.