const AUTH_TOKEN_KEY = "token";
const AUTH_USER_KEY = "rozikhan_user";
const AUTH_CHANGE_EVENT = "rozikhan-auth-change";
const fallbackStorage = { token: null, user: null };

const canUseStorage = () => {
  if (typeof window === "undefined") return false;
  try {
    const testKey = "__rozikhan_storage_test";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

const safeGetItem = (key) => {
  if (!canUseStorage()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSetItem = (key, value) => {
  if (!canUseStorage()) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const safeRemoveItem = (key) => {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
};

export const getAuthToken = () => {
  const storedToken = safeGetItem(AUTH_TOKEN_KEY);
  return storedToken || fallbackStorage.token;
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
  const storedUser = safeGetItem(AUTH_USER_KEY);
  if (!storedUser && !canUseStorage()) {
    return fallbackStorage.user;
  }

  try {
    const savedUser = JSON.parse(storedUser || "null");
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
    return fallbackStorage.user;
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
  if (!token) {
    clearAuthToken();
    return getAuthSession();
  }

  const tokenPayload = decodeJwtPayload(token);
  const role = user?.role || user?.user?.role || tokenPayload?.role || "user";
  const normalizedUser = {
    ...(user || {}),
    _id: user?._id || tokenPayload?.id,
    role,
  };

  if (!safeSetItem(AUTH_TOKEN_KEY, token)) {
    fallbackStorage.token = token;
  }

  if (!safeSetItem(AUTH_USER_KEY, JSON.stringify(normalizedUser))) {
    fallbackStorage.user = normalizedUser;
  }

  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));

  return getAuthSession();
};

export const setAuthToken = (token, user = null) => {
  return persistAuthSession({ token, user });
};

export const clearAuthToken = () => {
  safeRemoveItem(AUTH_TOKEN_KEY);
  safeRemoveItem(AUTH_USER_KEY);
  fallbackStorage.token = null;
  fallbackStorage.user = null;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

export const authChangeEvent = AUTH_CHANGE_EVENT;
