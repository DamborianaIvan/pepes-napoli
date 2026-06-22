import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useEffect } from "react";

const PanelLayout = () => {

const navigate = useNavigate();

useEffect(() => {
  const rol = localStorage.getItem("rol");
  if (!rol) {
    navigate("/login");
  } 
});

  return (
    <div className="panel-layout">
      <Sidebar />
      <main className="panel-content">
        {/* RENDERIZA AQUÍ LAS RUTAS HIJAS */}
        <Outlet />
      </main>
    </div>
  );
};

export default PanelLayout;
