import { db } from './src/firebase.js';
import { doc, setDoc } from 'firebase/firestore';

async function resetPassword() {
  try {
    await setDoc(doc(db, 'settings', 'owner'), { password: 'harsha9154' });
    console.log('Password successfully updated to harsha9154');
    process.exit(0);
  } catch (error) {
    console.error('Error updating password:', error);
    process.exit(1);
  }
}

resetPassword();
