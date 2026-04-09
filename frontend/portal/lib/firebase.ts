import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every((value) => Boolean(value));
export const firebaseConfigError = '포털 로그인 설정이 비어 있습니다. 환경 변수를 확인해 주세요.';

const app: FirebaseApp | null = isFirebaseConfigured
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0] ?? null)
  : null;

export const auth: Auth | null = app ? getAuth(app) : null;
export const googleProvider = auth ? new GoogleAuthProvider() : null;
