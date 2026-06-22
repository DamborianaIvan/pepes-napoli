import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Sidebar.css";
import logo from "../../assets/FRESCO.png";
// Íconos MUI
import HomeIcon from "@mui/icons-material/Home";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import InventoryIcon from "@mui/icons-material/Inventory";
import AssessmentIcon from "@mui/icons-material/Assessment";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import PersonIcon from "@mui/icons-material/Person";

const Sidebar = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rol = localStorage.getItem("rol");
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("rol");
    navigate("/login");
  };

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="sidebar-top">
        <Link to="/panel/dashboard" onClick={() => setOpen(false)}>
          <img src={logo} alt="FRESCO" className="sidebar-logo" />
        </Link>
        <button className="menu-toggle" onClick={() => setOpen(!open)}>
          <MenuIcon/>
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

          {rol?.toLowerCase() === "owner" && (
            <>
              <Link to="/panel/crear-producto" onClick={() => setOpen(false)}>
                <AddCircleIcon className="sidebar-icon" />
                MENÚ
              </Link>
              <Link to="/panel/pedidos" onClick={() => setOpen(false)}>
                <InventoryIcon className="sidebar-icon" />
                HISTORIAL PEDIDOS
              </Link>
              <Link to="/panel/reportes" onClick={() => setOpen(false)}>
                <AssessmentIcon className="sidebar-icon" />
                REPORTES
              </Link>
            </>
          )}

          {rol?.toLowerCase() === "delivery" && (
            <Link to="/panel/pedidos" onClick={() => setOpen(false)}>
              <InventoryIcon className="sidebar-icon" />
              PEDIDOS
            </Link>
          )}
        </nav>
        <div className="sidebar-bottom">
          <button className="logout-btn" onClick={logout}>
            <LogoutIcon style={{ verticalAlign: "middle", marginRight: "5px" }}/>
            Cerrar sesión
          </button>
          <footer className="sidebar-footer">Versión 1.0.0</footer>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;