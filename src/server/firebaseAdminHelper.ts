import { initializeApp, cert, getApps, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { getFirebaseConfig } from './firebaseAuthHelper.js';

let adminApp: App | null = null;
let firestoreDb: Firestore | null = null;
let authInstance: Auth | null = null;

/**
 * Initializes and returns the Firebase Admin SDK instance.
 * Checks for:
 * 1. FIREBASE_SERVICE_ACCOUNT_KEY (Raw JSON string or base64 encoded JSON in Vercel / server env)
 * 2. GOOGLE_APPLICATION_CREDENTIALS (Path to service account JSON file)
 * 3. Individual env vars: FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_PROJECT_ID
 * 4. Application Default Credentials fallback
 */
export function getFirebaseAdminApp(): {
  app: App | null;
  auth: Auth | null;
  firestore: Firestore | null;
  hasServiceAccount: boolean;
  statusMessage: string;
} {
  if (adminApp && authInstance) {
    return {
      app: adminApp,
      auth: authInstance,
      firestore: firestoreDb,
      hasServiceAccount: true,
      statusMessage: 'Firebase Admin SDK initialized successfully.',
    };
  }

  const { projectId } = getFirebaseConfig();
  const targetProjectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || projectId || 'clipsort-7adfb';

  // 1. Raw JSON service account in env
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (rawKey) {
    try {
      let parsed = null;
      if (rawKey.startsWith('{')) {
        parsed = JSON.parse(rawKey);
      } else {
        // try base64 decode
        const decoded = Buffer.from(rawKey, 'base64').toString('utf-8');
        parsed = JSON.parse(decoded);
      }

      if (parsed && parsed.private_key && parsed.client_email) {
        const apps = getApps();
        if (!apps.length) {
          adminApp = initializeApp({
            credential: cert(parsed),
            projectId: parsed.project_id || targetProjectId,
          });
        } else {
          adminApp = apps[0]!;
        }

        authInstance = getAuth(adminApp);
        firestoreDb = getFirestore(adminApp);

        return {
          app: adminApp,
          auth: authInstance,
          firestore: firestoreDb,
          hasServiceAccount: true,
          statusMessage: 'Initialized via FIREBASE_SERVICE_ACCOUNT_KEY',
        };
      }
    } catch (err: any) {
      console.error('[Firebase Admin] Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:', err.message);
    }
  }

  // 2. Separate client email and private key env vars
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')?.trim();
  if (clientEmail && privateKey) {
    try {
      const apps = getApps();
      if (!apps.length) {
        adminApp = initializeApp({
          credential: cert({
            projectId: targetProjectId,
            clientEmail,
            privateKey,
          }),
          projectId: targetProjectId,
        });
      } else {
        adminApp = apps[0]!;
      }

      authInstance = getAuth(adminApp);
      firestoreDb = getFirestore(adminApp);

      return {
        app: adminApp,
        auth: authInstance,
        firestore: firestoreDb,
        hasServiceAccount: true,
        statusMessage: 'Initialized via FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY',
      };
    } catch (err: any) {
      console.error('[Firebase Admin] Error initializing with individual credentials:', err.message);
    }
  }

  // 3. File path in GOOGLE_APPLICATION_CREDENTIALS or local serviceAccountKey.json
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  const localKeyPath = path.resolve(process.cwd(), 'serviceAccountKey.json');
  const pathToCheck = credPath || (fs.existsSync(localKeyPath) ? localKeyPath : null);

  if (pathToCheck && fs.existsSync(pathToCheck)) {
    try {
      const content = fs.readFileSync(pathToCheck, 'utf-8');
      const parsed = JSON.parse(content);
      const apps = getApps();
      if (!apps.length) {
        adminApp = initializeApp({
          credential: cert(parsed),
          projectId: parsed.project_id || targetProjectId,
        });
      } else {
        adminApp = apps[0]!;
      }

      authInstance = getAuth(adminApp);
      firestoreDb = getFirestore(adminApp);

      return {
        app: adminApp,
        auth: authInstance,
        firestore: firestoreDb,
        hasServiceAccount: true,
        statusMessage: `Initialized via file: ${pathToCheck}`,
      };
    } catch (err: any) {
      console.error('[Firebase Admin] Error loading credentials from file:', err.message);
    }
  }

  return {
    app: null,
    auth: null,
    firestore: null,
    hasServiceAccount: false,
    statusMessage:
      'Firebase Admin SDK 서비스 계정 자격 증명이 설정되지 않았습니다. FIREBASE_SERVICE_ACCOUNT_KEY 환경변수가 필요합니다.',
  };
}
