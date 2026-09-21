import { useEffect, useState } from "react";
import { TextField, MenuItem, Box, Typography } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory";
import { Link } from "react-router-dom";
import { getSession } from "../../auth/session";
import { hasPermission, PERMISSIONS } from "../../types/auth";
import "./Dashboard.css";

import { ETIQUETAS_ESTADO_PEDIDO, type EstadoPedido, type Pedido } from "../../types/pedido";

interface Mesa {
  _id: string;
  numero: number;
  nombre?: string | null;
}
export const Dashboard = () => {
 const [resumen, setResumen] = useState({
    totalMes: 0,
    pedidosAbiertos: 0,
    pedidosDia: 0,
    salonActivos: 0,
    deliveryActivos: 0,
    takeawayActivos: 0
  });
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const session = getSession();
  const rol = session?.rol ?? null;
  const canCreateOrders = rol ? hasPermission(rol, PERMISSIONS.ORDERS_CREATE) : false;
  const canChangeStatus = rol ? hasPermission(rol, PERMISSIONS.ORDERS_CHANGE_STATUS) : false;
  const [snackbar, setSnackbar] = useState<{ mensaje: string; tipo: "ok" | "error" } | null>(null);
  const [mostrarDashboardCards, setMostrarDashboardCards] = useState(true);

  useEffect(() => {
    

   

    obtenerPedidos();
    const intervalo = setInterval(obtenerPedidos, 65000);
    return () => clearInterval(intervalo);
  }, []);


  const obtenerPedidos = () => {
    const token = session?.token;
    const rolGuardado = rol;
    fetch(`${import.meta.env.VITE_API_URL}/api/pedidos`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) return;

        const hoy = new Date();
        const hoyStr = hoy.toDateString();
        const mesActual = hoy.getMonth();
        const añoActual = hoy.getFullYear();

        const pedidosDelDia = data.filter((p: Pedido) => {
          const fecha = new Date(p.fechaPedido);
          return fecha.toDateString() === hoyStr;
        });

        const entregadosHoy = pedidosDelDia.filter((p) => {
          if (rolGuardado === "DELIVERY") {
            return (
              p.estadoPedido.toLowerCase() === "entregado" &&
              p.tipoPedido.toLowerCase() === "delivery"
            );
          }
          return p.estadoPedido.toLowerCase() === "entregado";
        });

        const entregadosMes = data.filter((p: Pedido) => {
          const fecha = new Date(p.fechaPedido);
          return (
            fecha.getMonth() === mesActual &&
            fecha.getFullYear() === añoActual &&
            p.estadoPedido.toLowerCase() === "entregado"
          );
        });

        const visibles = pedidosDelDia
          .filter((p) => {
            if (rolGuardado === "DELIVERY") {
              return (
                p.tipoPedido === "DELIVERY" &&
                ["LISTO", "EN_CAMINO", 'ENTREGADO'].includes(p.estadoPedido)
              );
            }
            return true;
          })
          .sort((a, b) => new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime());
        
        const pedidosAbiertos = visibles.filter(
          p =>
            [
              "ABIERTO",
              "CONFIRMADO",
              "EN_COCINA",
              "LISTO",
              "EN_CAMINO"
            ].includes(p.estadoPedido)
        ).length;

        const salonActivos = visibles.filter(
          p =>
            p.tipoPedido === "SALON" &&
            [
              "ABIERTO",
              "CONFIRMADO",
              "EN_COCINA",
              "LISTO"
            ].includes(p.estadoPedido)
        ).length;
        const deliveryActivos = visibles.filter(
          p =>
            p.tipoPedido === "DELIVERY" &&
            [
              "ABIERTO",
              "CONFIRMADO",
              "EN_COCINA",
              "LISTO",
              "EN_CAMINO"
            ].includes(p.estadoPedido)
        ).length;

        const takeawayActivos = visibles.filter(
          p =>
            p.tipoPedido === "TAKEAWAY" &&
            [
              "ABIERTO",
              "CONFIRMADO",
              "EN_COCINA",
              "LISTO"
            ].includes(p.estadoPedido)
        ).length;

        setResumen({
          totalMes: entregadosMes.length,
          pedidosAbiertos,
          pedidosDia: entregadosHoy.length,
          salonActivos,
          deliveryActivos,
          takeawayActivos
        });
        
        setPedidos(visibles);

        fetch(`${import.meta.env.VITE_API_URL}/api/mesas`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => res.json())
          .then((data) => setMesas(Array.isArray(data) ? data : []))
          .catch(() => setMesas([]));

      })
      .catch(() => {
        setSnackbar({ mensaje: "❌ Error cargando pedidos", tipo: "error" });
      });
  };
  const actualizarEstado = async (id: string, nuevoEstado: EstadoPedido) => {
    const token = session?.token;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pedidos/${id}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estadoPedido: nuevoEstado }),
      });

      if (res.ok) {
        const actualizado = await res.json();
        await obtenerPedidos();
        setPedidos((prev) =>
          prev.map((p) => (p._id === id ? actualizado : p))
        );
        setSnackbar({ mensaje: "✅ Estado actualizado correctamente.", tipo: "ok" });
      } else {
        setSnackbar({ mensaje: "❌ Error al actualizar estado.", tipo: "error" });
      }
    } catch {
      setSnackbar({ mensaje: "❌ Error al actualizar estado.", tipo: "error" });
    }

    setTimeout(() => setSnackbar(null), 3000);
  };

  const obtenerEstadosPermitidos = (pedido: Pedido): EstadoPedido[] => {
    const transiciones: Record<EstadoPedido, EstadoPedido[]> = {
      ABIERTO: ["CONFIRMADO", "CANCELADO"], CONFIRMADO: ["EN_COCINA", "CANCELADO"],
      EN_COCINA: ["LISTO", "CANCELADO"], LISTO: pedido.tipoPedido === "DELIVERY" ? ["EN_CAMINO", "CANCELADO"] : ["ENTREGADO", "CANCELADO"],
      EN_CAMINO: ["ENTREGADO", "CANCELADO"], ENTREGADO: [], CANCELADO: [],
    };
    return transiciones[pedido.estadoPedido];
  };

  const formatoPesos = (monto: number) =>
    monto.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    });

  const obtenerEtiquetaMesa = (pedido: Pedido) => {
    const mesaId = typeof pedido.mesaId === "string" ? pedido.mesaId : pedido.mesaId?._id;
    const mesa = mesas.find((item) => item._id === mesaId);
    return mesa?.nombre || (mesa ? `Mesa ${mesa.numero}` : "Mesa sin asignar");
  };

  return (
    <div className="panel-content">
           
      <Box
        onClick={() => setMostrarDashboardCards(!mostrarDashboardCards)}
        sx={{
          display: "flex",
          alignItems: "flex-start",
          cursor: "pointer",
          userSelect: "none",
          gap: 1,
          mb: 2,
        }}
      >
        <span style={{ fontSize: "1.2rem" }}>{mostrarDashboardCards ? "▼" : "►"}</span>
        <DashboardIcon />
        <Typography variant="h4" component="span">
          DASHBOARD
        </Typography>
         {canCreateOrders && <Link to="/panel/nuevo-pedido">
                  <button type="button" className="login-button">
                    NUEVO PEDIDO
                  </button>
                </Link>}
      </Box>


      {mostrarDashboardCards && (
        <div className="dashboard-cards">

          <div className="card">
            <div className="card-label">
              📋 PEDIDOS ABIERTOS
            </div>
            <div className="card-number highlight-orange">
              {resumen.pedidosAbiertos}
            </div>
          </div>

          <div className="card">
            <div className="card-label">
              🍽️ SALÓN ACTIVOS
            </div>
            <div className="card-number">
              {resumen.salonActivos}
            </div>
          </div>

          <div className="card">
            <div className="card-label">
              🛵 DELIVERY ACTIVOS
            </div>
            <div className="card-number">
              {resumen.deliveryActivos}
            </div>
          </div>

          <div className="card">
            <div className="card-label">
              🥡 TAKEAWAY ACTIVOS
            </div>
            <div className="card-number">
              {resumen.takeawayActivos}
            </div>
          </div>

          <div className="card">
            <div className="card-label">
              📅 PEDIDOS DEL DÍA
            </div>
            <div className="card-number">
              {resumen.pedidosDia}
            </div>
          </div>

          <div className="card">
            <div className="card-label">
              📈 PEDIDOS DEL MES
            </div>
            <div className="card-number highlight-blue">
              {resumen.totalMes}
            </div>
          </div>

        </div>
      )}

      {snackbar && (
        <div className={`snackbar ${snackbar.tipo === "ok" ? "snackbar-ok" : "snackbar-error"}`}>
          {snackbar.mensaje}
        </div>
      )}


  <div className="pedidos-section">
        <Typography variant="h4" mb={1}>
          <InventoryIcon /> PEDIDOS PARA HOY
        </Typography> 
      </div>
      
   
      <div className="pedidos-cards">
        {pedidos.map((pedido) => (
          <div className="pedido-card" key={pedido._id} data-estado={pedido.estadoPedido}>
            {pedido.tipoPedido === "SALON" ? (
              <p><strong>Mesa:</strong> {obtenerEtiquetaMesa(pedido)}</p>
            ) : (
              <>
                <p><strong>Cliente: </strong>{pedido.nombreCliente || "-"}</p>
                <p><strong>Teléfono:</strong> {pedido.telefono || "-"}</p>
              </>
            )}
            <p><strong>Productos:</strong></p>
            <ul>
              {pedido.productos.map((p, i) => (
                <li key={i}>
                  {p.cantidad} × {p.nombreSnapshot}
                </li>
              ))}
            </ul>
            <p><strong>Total:</strong> {formatoPesos(pedido.total)}</p>
            <p><strong>Método Pago:</strong> {pedido.estadoPago}</p>
            <p><strong>Entrega:</strong> {pedido.tipoPedido}</p>
            {pedido.tipoPedido !== "SALON" && (
              <p><strong>Dirección:</strong> {pedido.direccion || "-"}</p>
            )}
            <p><strong>Comentario:</strong> {pedido.comentario || "-"}</p>
            <p><strong>Estado:</strong> {ETIQUETAS_ESTADO_PEDIDO[pedido.estadoPedido]}</p>
            <p><strong>Fecha:</strong> {new Date(pedido.fechaPedido).toLocaleString()}</p>

            

            {/* Select para delivery */}
            {canChangeStatus && rol === "DELIVERY" &&
              (pedido.estadoPedido === "LISTO" || pedido.estadoPedido === "EN_CAMINO") && (
                <TextField
                  select
                  label="Estado"
                  value=""
                  onChange={(e) => actualizarEstado(pedido._id, e.target.value as EstadoPedido)}
                  size="small"
                  fullWidth
                  variant="outlined"
                  style={{ marginTop: "0.5rem" }}
                >
                  {pedido.estadoPedido === "LISTO" &&
                    [
                      <MenuItem key="en-camino" value="EN_CAMINO">En camino</MenuItem>,
                      <MenuItem key="entregado" value="ENTREGADO">Entregado</MenuItem>,
                    ]
                  }
                  {pedido.estadoPedido === "EN_CAMINO" &&
                    [
                      <MenuItem key="in-distribution" value="in-distribution">En reparto</MenuItem>,
                      ,
                    ]
                  }
                </TextField>
              )}

            {/* Select para admin */}
            {rol === "ADMIN" && (
              <TextField
                select
                label="Estado"
                value=""
                onChange={(e) => actualizarEstado(pedido._id, e.target.value as EstadoPedido)}
                size="small"
                fullWidth
                variant="outlined"
                style={{ marginTop: "0.5rem" }}
              >
               {
                obtenerEstadosPermitidos(
                  pedido.tipoPedido
                ).map(
                  estado => (
                    <MenuItem
                      key={estado}
                      value={estado}
                    >
                      {
                        ETIQUETAS_ESTADO_PEDIDO[estado]
                      }
                    </MenuItem>
                  )
                )
}
              </TextField>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
