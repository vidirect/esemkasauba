import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, setDoc, getDocFromServer, onSnapshot, Unsubscribe, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Student, AllowedUser } from '../types';

interface FirebaseContextType {
  user: User | null;
  student: Student | null;
  isAdmin: boolean;
  isTeacher: boolean;
  loading: boolean;
  isSigningIn: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    let studentUnsubscribe: Unsubscribe | null = null;

    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (studentUnsubscribe) {
        studentUnsubscribe();
        studentUnsubscribe = null;
      }

      if (user) {
        studentUnsubscribe = onSnapshot(doc(db, 'students', user.uid), async (snapshot) => {
          if (snapshot.exists()) {
            const studentData = snapshot.data() as Student;
            // Force admin role for the specific user if not already set
            if (user.email === 'vikry.thu@gmail.com' && studentData.role !== 'admin') {
              updateDoc(doc(db, 'students', user.uid), { role: 'admin' });
            }
            setStudent(studentData);
            setLoading(false);
          } else {
            // Check if user is pre-approved
            let assignedRole: Student['role'] = 'student';
            
            try {
              const allowedQuery = query(collection(db, 'allowed_users'), where('email', '==', user.email?.toLowerCase()));
              const allowedSnap = await getDocs(allowedQuery);
              
              if (!allowedSnap.empty) {
                assignedRole = (allowedSnap.docs[0].data() as AllowedUser).role;
              } else if (user.email === 'vikry.thu@gmail.com') {
                assignedRole = 'admin';
              }
            } catch (err) {
              console.error("Error checking allowed users:", err);
            }

            // Create initial profile
            const newStudent: Student = {
              id: user.uid,
              name: user.displayName || 'User',
              email: user.email || '',
              avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
              role: assignedRole,
              competence: {
                computationalThinking: 0,
                ictLiteracy: 0,
                projectManagement: 0,
                collaboration: 0,
                appUsage: 0,
                programming: 0
              },
              projects: [],
              teamIds: [],
              portfolio: []
            };
            try {
              await setDoc(doc(db, 'students', user.uid), newStudent);
            } catch (error) {
              handleFirestoreError(error, OperationType.WRITE, `students/${user.uid}`);
            }
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `students/${user.uid}`);
          setLoading(false);
        });
      } else {
        setStudent(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (studentUnsubscribe) studentUnsubscribe();
    };
  }, []);

  const signIn = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/drive.file');
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        localStorage.setItem('google_drive_token', credential.accessToken);
      }
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        console.warn("Sign in cancelled or interrupted:", error.code);
        return;
      }
      console.error("Sign in error:", error);
      alert(`Sign in error: ${error.message}`);
    } finally {
      setIsSigningIn(false);
    }
  };

  const signOutUser = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const isAdmin = student?.role === 'admin' || user?.email === 'vikry.thu@gmail.com';
  const isTeacher = student?.role === 'teacher';

  return (
    <FirebaseContext.Provider value={{ user, student, isAdmin, isTeacher, loading, isSigningIn, signIn, signOut: signOutUser, theme, setTheme }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase() {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
}
