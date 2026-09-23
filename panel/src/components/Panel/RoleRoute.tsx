import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { getSession } from "../../auth/session";

interface RoleRouteProps {
  children: ReactNode;
  deliveryOnly?: boolean;
}

export const RoleRoute = ({ children, deliveryOnly = false }: RoleRouteProps) => {
  const session = getSession();
  const isDelivery = session?.rol === "DELIVERY";

  if (deliveryOnly && !isDelivery) {
    return <Navigate to="/panel/dashboard" replace />;
  }

  if (!deliveryOnly && isDelivery) {
    return <Navigate to="/panel/delivery" replace />;
  }

  return children;
};
