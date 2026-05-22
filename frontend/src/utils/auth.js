const AUTH_TOKEN_KEY = "token";
const AUTH_USER_KEY = "rozikhan_user";
const AUTH_CHANGE_EVENT = "rozikhan-auth-change";

const canUseStorage = () => typeof window !== "undefined" && window.localStorage;

export const getAuthToken = () => {
  if (!canUseStorage()) return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const decodeJwtPayload = (token) => {
  if (!token || typeof token !== "string") return null;

  try {
    const [, payload] = token.split(".");
    if (!payload) return null;

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decodedPayload = atob(normalizedPayload);

    return JSON.parse(
      decodeURIComponent(
        decodedPayload
          .split("")
          .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
          .join("")
      )
    );
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now();
};

export const getAuthUser = () => {
  if (!canUseStorage()) return null;

  try {
    const savedUser = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || "null");
    const tokenPayload = decodeJwtPayload(getAuthToken());

    if (!savedUser && tokenPayload) {
      return {
        _id: tokenPayload.id,
        role: tokenPayload.role || "user",
      };
    }

    return savedUser
      ? {
          ...savedUser,
          role: savedUser.role || tokenPayload?.role || "user",
        }
      : null;
  } catch {
    return null;
  }
};

export const getAuthSession = () => {
  const token = getAuthToken();

  if (!token || isTokenExpired(token)) {
    if (token) clearAuthToken();
    return {
      token: null,
      user: null,
      isAuthenticated: false,
      isAdmin: false,
    };
  }

  const user = getAuthUser();

  return {
    token,
    user,
    isAuthenticated: true,
    isAdmin: user?.role === "admin",
  };
};

export const isAuthenticated = () => getAuthSession().isAuthenticated;

export const isAdminUser = () => getAuthSession().isAdmin;

export const persistAuthSession = ({ token, user }) => {
  if (!canUseStorage()) return getAuthSession();

  if (!token) {
    clearAuthToken();
    return getAuthSession();
  }

  localStorage.setItem(AUTH_TOKEN_KEY, token);
  const tokenPayload = decodeJwtPayload(token);
  const role = user?.role || user?.user?.role || tokenPayload?.role || "user";
  const normalizedUser = {
    ...(user || {}),
    _id: user?._id || tokenPayload?.id,
    role,
  };

  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(normalizedUser));
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));

  return getAuthSession();
};

export const setAuthToken = (token, user = null) => {
  return persistAuthSession({ token, user });
};

export const clearAuthToken = () => {
  if (!canUseStorage()) return;

  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const authChangeEvent = AUTH_CHANGE_EVENT;
