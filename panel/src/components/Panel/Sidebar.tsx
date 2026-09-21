import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Sidebar.css";
import logo from "../../assets/pepes.png";
import HomeIcon from "@mui/icons-material/Home";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import InventoryIcon from "@mui/icons-material/Inventory";
import AssessmentIcon from "@mui/icons-material/Assessment";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import { clearSession, getSession } from "../../auth/session";
import { hasPermission, PERMISSIONS } from "../../types/auth";

const Sidebar = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const session = getSession();
  const rol = session?.rol ?? null;
  const user = session?.user ?? null;

  const canCreateOrders = rol
    ? hasPermission(rol, PERMISSIONS.ORDERS_CREATE)
    : false;
  const canViewOrders = rol
    ? hasPermission(rol, PERMISSIONS.ORDERS_CREATE) ||
      hasPermission(rol, PERMISSIONS.ORDERS_CHANGE_STATUS)
    : false;
  const canManageProducts = rol
    ? hasPermission(rol, PERMISSIONS.PRODUCTS_MANAGE)
    : false;
  const canManageUsers = rol
    ? hasPermission(rol, PERMISSIONS.USERS_MANAGE)
    : false;
  const canViewReports = rol
    ? hasPermission(rol, PERMISSIONS.REPORTS_VIEW)
    : false;
  const canViewKitchen = rol === "ADMIN" || rol === "CAJERO" || rol === "CHEF";

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-top">
        <Link to="/panel/dashboard" onClick={() => setOpen(false)}>
          <img src={logo} alt="FRESCO" className="sidebar-logo" />
        </Link>
        <button className="menu-toggle" onClick={() => setOpen(!open)}>
          <MenuIcon />
        </button>
      </div>

      <div className={`sidebar-content ${open ? "show" : ""}`}>
        <p className="sidebar-user">
          <PersonIcon className="sidebar-icon" />
          {user?.nombre || "Usuario"}
        </p>

        <nav className="sidebar-nav">
          <Link to="/panel/dashboard" onClick={() => setOpen(false)}>
            <HomeIcon className="sidebar-icon" />
            HOME
          </Link>

          <Link to="/panel/mesas" onClick={() => setOpen(false)}>
            <TableRestaurantIcon className="sidebar-icon" />
            MESAS
          </Link>

          {canCreateOrders && (
            <Link to="/panel/nuevo-pedido" onClick={() => setOpen(false)}>
              <AddCircleIcon className="sidebar-icon" />
              NUEVO PEDIDO
            </Link>
          )}

          {canViewOrders && (
            <Link to="/panel/pedidos" onClick={() => setOpen(false)}>
              <InventoryIcon className="sidebar-icon" />
              PEDIDOS
            </Link>
          )}

          {
            canViewKitchen && (
              <Link to="/panel/cocina" onClick={() => setOpen(false)}>
                <RestaurantMenuIcon className="sidebar-icon" />
                COCINA
              </Link>
            )
          )}

          {canManageProducts && (
            <Link to="/panel/crear-producto" onClick={() => setOpen(false)}>
              <ReceiptLongIcon className="sidebar-icon" />
              MENÚ
            </Link>
          )}

          {canManageUsers && (
            <Link to="/panel/usuarios" onClick={() => setOpen(false)}>
              <ManageAccountsIcon className="sidebar-icon" />
              USUARIOS
            </Link>
          )}

          {canViewReports && (
            <Link to="/panel/reportes" onClick={() => setOpen(false)}>
              <AssessmentIcon className="sidebar-icon" />
              REPORTES
            </Link>
          )}
        </nav>

        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={logout}>
            <LogoutIcon style={{ verticalAlign: "middle", marginRight: "5px" }} />
            Cerrar sesión
          </button>
          <footer className="sidebar-footer">Versión 1.0.0</footer>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
