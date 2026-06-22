import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; 
import { AuthLogin } from "./components/Login/AuthLogin";
import { AuthRegister } from "./components/Login/AuthRegister";
import PanelLayout from "./components/Panel/PanelLayout";
import { Dashboard } from "./components/Panel/Dashboard";
import { ListaPedidos } from "./components/Panel/ListaPedidos";
import { PrivateRoute } from "./components/Panel/PrivateRoute";
import  Reportes  from "./components/Panel/Reportes";
import  ProductoManager  from "./components/Panel/ProductoManager";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<AuthLogin />} />
        <Route path="/register" element={<AuthRegister />} />

        <Route
          path="/panel"
          element={
            <PrivateRoute>
              <PanelLayout />
            </PrivateRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pedidos" element={<ListaPedidos />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="crear-producto" element={<ProductoManager />} />
        </Route>

        <Route path="*" element={<AuthLogin />} />
      </Routes>
    </Router>
  );
}
