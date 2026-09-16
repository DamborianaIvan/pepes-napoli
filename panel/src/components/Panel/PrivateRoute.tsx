import React from "react";
import { Navigate } from "react-router-dom";
import { isValidRol } from "../../types/auth";

interface Props {
  children: React.ReactNode;
}

interface JwtPayload {
  rol?: unknown;
  exp?: number;
}

const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = atob(normalized);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
};

export const PrivateRoute = ({ children }: Props) => {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" replace />;

  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  const isExpired = typeof exp === "number" && exp * 1000 <= Date.now();

  if (!payload || !isValidRol(payload.rol) || isExpired) {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  return children;
};
