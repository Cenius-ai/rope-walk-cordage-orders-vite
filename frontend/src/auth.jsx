import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api, clearToken, getToken, setToken } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // A token read from localStorage before the first render is what keeps a hard
  // reload of a gated route signed in.
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(() => (getToken() ? "loading" : "anonymous"));

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setUser(null);
      setStatus("anonymous");
      return () => {
        cancelled = true;
      };
    }
    if (user) {
      setStatus("authenticated");
      return () => {
        cancelled = true;
      };
    }
    setStatus("loading");
    api
      .me()
      .then((profile) => {
        if (cancelled) return;
        setUser(profile);
        setStatus("authenticated");
      })
      .catch(() => {
        if (cancelled) return;
        setUser(null);
        setStatus("anonymous");
      });
    return () => {
      cancelled = true;
    };
  }, [token, user]);

  useEffect(() => {
    const onUnauthorized = () => {
      setTokenState(null);
      setUser(null);
      setStatus("anonymous");
    };
    window.addEventListener("ropewalk:unauthorized", onUnauthorized);
    return () => window.removeEventListener("ropewalk:unauthorized", onUnauthorized);
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await api.login(email, password);
    setToken(result.access_token);
    setUser(result.user);
    setStatus("authenticated");
    setTokenState(result.access_token);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(
    () => ({ user, status, login, logout, setUser }),
    [user, status, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
