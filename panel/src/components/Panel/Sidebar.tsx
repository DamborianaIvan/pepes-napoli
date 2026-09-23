import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
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
  const canAdjustStock = rol
    ? hasPermission(rol, PERMISSIONS.STOCK_ADJUST)
    : false;
  const canManageUsers = rol
    ? hasPermission(rol, PERMISSIONS.USERS_MANAGE)
    : false;
  const canViewReports = rol
    ? hasPermission(rol, PERMISSIONS.REPORTS_VIEW)
    : false;
  const canViewCaja = rol
    ? hasPermission(rol, PERMISSIONS.CASH_OPEN) ||
      hasPermission(rol, PERMISSIONS.CASH_CLOSE) ||
      hasPermission(rol, PERMISSIONS.CASH_CHARGE)
    : false;
  const canViewKitchen = rol === "ADMIN" || rol === "CAJERO" || rol === "CHEF";
  const navClass = ({ isActive }: { isActive: boolean }) => `sidebar-link${isActive ? " active" : ""}`;

  const logout = () => {
    clearSession();
    navigate("/login");
  };

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-top">
        <NavLink to="/panel/dashboard" className="sidebar-brand" onClick={() => setOpen(false)}>
          <img src={logo} alt="Pepe's Napoletana" className="sidebar-logo" />
          <span className="sidebar-brand-name">Pepe's <small>Napoletana</small></span>
        </NavLink>
        <button className="menu-toggle" type="button" aria-label={open ? "Cerrar menú" : "Abrir menú"} aria-expanded={open} onClick={() => setOpen(!open)}>
          <MenuIcon />
        </button>
      </div>

      <div className={`sidebar-content ${open ? "show" : ""}`}>
        <p className="sidebar-user">
          <PersonIcon className="sidebar-icon" />
          <span><strong>{user?.nombre || "Usuario"}</strong><small>{rol || "Panel"}</small></span>
        </p>

        <nav className="sidebar-nav">
          <NavLink className={navClass} to="/panel/dashboard" onClick={() => setOpen(false)}>
            <HomeIcon className="sidebar-icon" />
            HOME
          </NavLink>

          <NavLink className={navClass} to="/panel/mesas" onClick={() => setOpen(false)}>
            <TableRestaurantIcon className="sidebar-icon" />
            MESAS
          </NavLink>

          {canCreateOrders && (
            <NavLink className={navClass} to="/panel/nuevo-pedido" onClick={() => setOpen(false)}>
              <AddCircleIcon className="sidebar-icon" />
              NUEVO PEDIDO
            </NavLink>
          )}

          {canViewOrders && (
            <NavLink className={navClass} to="/panel/pedidos" onClick={() => setOpen(false)}>
              <InventoryIcon className="sidebar-icon" />
              PEDIDOS
            </NavLink>
          )}

          {canViewKitchen && (
            <NavLink className={navClass} to="/panel/cocina" onClick={() => setOpen(false)}>
              <RestaurantMenuIcon className="sidebar-icon" />
              COCINA
            </NavLink>
          )}

          {canViewCaja && (
            <NavLink className={navClass} to="/panel/caja" onClick={() => setOpen(false)}>
              <PointOfSaleIcon className="sidebar-icon" />
              CAJA
            </NavLink>
          )}

          {canManageProducts && (
            <NavLink className={navClass} to="/panel/crear-producto" onClick={() => setOpen(false)}>
              <ReceiptLongIcon className="sidebar-icon" />
              MENÚ
            </NavLink>
          )}

          {canAdjustStock && (
            <NavLink className={navClass} to="/panel/stock" onClick={() => setOpen(false)}>
              <Inventory2Icon className="sidebar-icon" />
              STOCK
            </NavLink>
          )}

          {canManageUsers && (
            <NavLink className={navClass} to="/panel/usuarios" onClick={() => setOpen(false)}>
              <ManageAccountsIcon className="sidebar-icon" />
              USUARIOS
            </NavLink>
          )}

          {canViewReports && (
            <NavLink className={navClass} to="/panel/reportes" onClick={() => setOpen(false)}>
              <AssessmentIcon className="sidebar-icon" />
              REPORTES
            </NavLink>
          )}

          {rol === "ADMIN" && (
            <NavLink className={navClass} to="/panel/auditoria" onClick={() => setOpen(false)}>
              <HistoryOutlinedIcon className="sidebar-icon" />
              AUDITORÍA
            </NavLink>
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
