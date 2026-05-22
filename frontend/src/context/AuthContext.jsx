import { useCallback, useEffect, useMemo, useState } from "react";
import {
  authChangeEvent,
  clearAuthToken,
  getAuthSession,
  persistAuthSession,
} from "../utils/auth";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => getAuthSession());

  const refreshSession = useCallback(() => {
    setSession(getAuthSession());
  }, []);

  useEffect(() => {
    window.addEventListener(authChangeEvent, refreshSession);
    window.addEventListener("storage", refreshSession);

    return () => {
      window.removeEventListener(authChangeEvent, refreshSession);
      window.removeEventListener("storage", refreshSession);
    };
  }, [refreshSession]);

  const login = useCallback((token, user) => {
    const nextSession = persistAuthSession({ token, user });
    setSession(nextSession);
    return nextSession;
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    setSession(getAuthSession());
  }, []);

  const value = useMemo(
    () => ({
      ...session,
      login,
      logout,
      refreshSession,
    }),
    [login, logout, refreshSession, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
