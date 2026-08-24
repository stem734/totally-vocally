import { getFunctions, httpsCallable } from 'firebase/functions';
import app from './firebase';

const functions = getFunctions(
  app,
  import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'europe-west2',
);

export const setMemberAccess = httpsCallable(functions, 'setMemberAccess');
