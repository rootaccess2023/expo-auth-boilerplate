import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { deleteToken, getMe, getToken, saveToken } from "../api/client";
import type { User } from "../types/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (token: string, user: User) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const data = await getMe();
          setUser(data.user);
        }
      } catch {
        await deleteToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async (token: string, userData: User): Promise<void> => {
    await saveToken(token);
    setUser(userData);
  };

  const signOut = async (): Promise<void> => {
    await deleteToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
