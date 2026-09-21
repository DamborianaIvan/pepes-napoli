import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const PanelLayout = () => {
  return (
    <div className="panel-layout">
      <Sidebar />
      <main className="panel-content">
        <Outlet />
      </main>
    </div>
  );
};

export default PanelLayout;
