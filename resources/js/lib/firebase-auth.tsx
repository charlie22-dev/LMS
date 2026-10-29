import { createContext, useContext, useMemo, type ReactNode } from 'react';
import axios from 'axios';
import { router } from '@inertiajs/react';

interface FirebaseAuthContext { available: boolean; signIn: () => Promise<void> }
const AuthContext = createContext<FirebaseAuthContext | null>(null);

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
    const value = useMemo<FirebaseAuthContext>(() => {
        const config = { apiKey: import.meta.env.VITE_FIREBASE_API_KEY, authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID, appId: import.meta.env.VITE_FIREBASE_APP_ID };
        const available = Object.values(config).every(Boolean);
        return {
            available,
            async signIn() {
                if (!available) throw new Error('Google sign-in is not configured yet.');
                const [{ getApps, initializeApp }, { GoogleAuthProvider, getAuth, inMemoryPersistence, setPersistence, signInWithPopup, signOut }] = await Promise.all([import('firebase/app'), import('firebase/auth')]);
                const app = getApps()[0] ?? initializeApp(config);
                const auth = getAuth(app);
                await setPersistence(auth, inMemoryPersistence);
                const result = await signInWithPopup(auth, new GoogleAuthProvider());
                try {
                    const token = await result.user.getIdToken();
                    const response = await axios.post<{ redirect: string }>('/auth/firebase', { credential: token });
                    router.visit(response.data.redirect);
                } catch (error) {
                    if (axios.isAxiosError(error)) {
                        const message = error.response?.data?.errors?.credential?.[0] ?? error.response?.data?.message;
                        throw new Error(typeof message === 'string' ? message : 'Could not sign in. Please try again.');
                    }
                    throw error;
                } finally {
                    await signOut(auth);
                }
            },
        };
    }, []);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useFirebaseAuth(): FirebaseAuthContext {
    const context = useContext(AuthContext);
    if (!context) throw new Error('FirebaseAuthProvider is missing.');
    return context;
}
