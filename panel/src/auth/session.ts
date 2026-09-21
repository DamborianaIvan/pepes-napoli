import { isValidRol, type Rol } from "../types/auth";

export interface SessionUser {
  id: string;
  nombre: string;
}

export interface Session {
  token: string;
  rol: Rol;
  user: SessionUser;
}

const TOKEN_KEY = "token";
const ROLE_KEY = "rol";
const USER_KEY = "user";

export const getSession = (): Session | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  const rolValue = localStorage.getItem(ROLE_KEY);
  const userValue = localStorage.getItem(USER_KEY);

  if (!token || !isValidRol(rolValue) || !userValue) return null;

  try {
    const user = JSON.parse(userValue) as Partial<SessionUser>;

    if (typeof user.id !== "string" || typeof user.nombre !== "string") {
      return null;
    }

    return { token, rol: rolValue, user: { id: user.id, nombre: user.nombre } };
  } catch {
    return null;
  }
};

export const saveSession = (session: Session): void => {
  localStorage.setItem(TOKEN_KEY, session.token);
  localStorage.setItem(ROLE_KEY, session.rol);
  localStorage.setItem(USER_KEY, JSON.stringify(session.user));
};

export const clearSession = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USER_KEY);
};
