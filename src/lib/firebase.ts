import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, Firestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: firebaseConfigJson.projectId || 'elevated-catwalk-rd2jw',
  appId: firebaseConfigJson.appId || '',
  apiKey: firebaseConfigJson.apiKey || '',
  authDomain: firebaseConfigJson.authDomain || '',
  storageBucket: firebaseConfigJson.storageBucket || '',
  messagingSenderId: firebaseConfigJson.messagingSenderId || '',
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Connect specifically to the custom database ID specified in config (amplify-cost-engine)
const databaseId = firebaseConfigJson.firestoreDatabaseId || 'amplify-cost-engine';

export const db: Firestore = getFirestore(app, databaseId);

export const COLLECTIONS = {
  TENANTS: 'tenants',
  INGREDIENTS: 'ingredients',
  RECIPES: 'recipes',
} as const;

export { collection, doc };
