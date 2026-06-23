import { useEffect, useState } from "react";
import { TextField, MenuItem, Box, Typography } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import InventoryIcon from "@mui/icons-material/Inventory";
import "./Dashboard.css";

interface Pedido {
  _id: string;
  tipoPedido:
    | "SALON"
    | "DELIVERY"
    | "TAKEAWAY";

  nombreCliente?: string;
  telefono?: string;
  direccion?: string;
  comentario?: string;
  productos: {
    producto: string;
    cantidad: number;
    precio: number;
  }[];
  total: number;
  metodoPago: string;
  estado:
    | "ABIERTO"
    | "CONFIRMADO"
    | "EN_COCINA"
    | "LISTO"
    | "ENTREGADO"
    | "PAGADO"
    | "EN_CAMINO"
    | "CANCELADO";
  fechaPedido: string;
}

const estadosTraducidos: Record<string, string> = {
  ABIERTO: "Abierto",
  CONFIRMADO: "Confirmado",
  EN_COCINA: "En Cocina",
  LISTO: "Listo",
  EN_CAMINO: "En Camino",
  ENTREGADO: "Entregado",
  PAGADO: "Pagado",
  CANCELADO: "Cancelado"
};

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
  const [rol, setRol] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ mensaje: string; tipo: "ok" | "error" } | null>(null);
  const [mostrarDashboardCards, setMostrarDashboardCards] = useState(true);

  useEffect(() => {
    

   

    obtenerPedidos();
    const intervalo = setInterval(obtenerPedidos, 65000);
    return () => clearInterval(intervalo);
  }, []);


  const obtenerPedidos = () => {
    const token = localStorage.getItem("token");
    const rolGuardado = localStorage.getItem("rol");
    setRol(rolGuardado);
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
          if (rolGuardado === "delivery") {
            return (
              p.estado.toLowerCase() === "entregado" &&
              p.tipoEntrega.toLowerCase() === "delivery"
            );
          }
          return p.estado.toLowerCase() === "entregado";
        });

        const entregadosMes = data.filter((p: Pedido) => {
          const fecha = new Date(p.fechaPedido);
          return (
            fecha.getMonth() === mesActual &&
            fecha.getFullYear() === añoActual &&
            p.estado.toLowerCase() === "entregado"
          );
        });

        const visibles = pedidosDelDia
          .filter((p) => {
            if (rolGuardado === "delivery") {
              return (
                p.tipoEntrega === "DELIVERY" &&
                ["LISTO", "EN_CAMINO", 'ENTREGADO'].includes(p.estado)
              );
            }
            return true;
          })
          .sort((a, b) => new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime());
        
        const nuevos = visibles.filter((p) =>
            p.estado === "ABIERTO"
        ).length;

        const enReparto = visibles.filter(
          (p) =>
            p.estado === "in-distribution" &&
            p.tipoEntrega.toLowerCase() === "delivery"
        ).length;

        const pedidosAbiertos = visibles.filter(
          p =>
            [
              "ABIERTO",
              "CONFIRMADO",
              "EN_COCINA",
              "LISTO",
              "EN_CAMINO"
            ].includes(p.estado)
        ).length;

        const salonActivos = visibles.filter(
          p =>
            p.tipoPedido === "SALON" &&
            [
              "ABIERTO",
              "CONFIRMADO",
              "EN_COCINA",
              "LISTO"
            ].includes(p.estado)
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
            ].includes(p.estado)
        ).length;

        const takeawayActivos = visibles.filter(
          p =>
            p.tipoPedido === "TAKEAWAY" &&
            [
              "ABIERTO",
              "CONFIRMADO",
              "EN_COCINA",
              "LISTO"
            ].includes(p.estado)
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

      })
      .catch(() => {
        setSnackbar({ mensaje: "❌ Error cargando pedidos", tipo: "error" });
      });
  };
  const actualizarEstado = async (id: string, nuevoEstado: string) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pedidos/${id}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (res.ok) {
        const actualizado = await res.json();
        await obtenerPedidos();
        setPedidos((prev) =>
          prev.map((p) => (p._id === id ? { ...p, estado: actualizado.estado } : p))
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

  const obtenerEstadosPermitidos = (
    tipoPedido: string
  ) => {

    switch (tipoPedido) {

      case "SALON":
        return [
          "ABIERTO",
          "CONFIRMADO",
          "EN_COCINA",
          "LISTO",
          "PAGADO",
          "CANCELADO"
        ];

      case "DELIVERY":
        return [
          "ABIERTO",
          "CONFIRMADO",
          "EN_COCINA",
          "LISTO",
          "EN_CAMINO",
          "ENTREGADO",
          "PAGADO",
          "CANCELADO"
        ];

      case "TAKEAWAY":
        return [
          "ABIERTO",
          "CONFIRMADO",
          "EN_COCINA",
          "LISTO",
          "ENTREGADO",
          "PAGADO",
          "CANCELADO"
        ];

      default:
        return [];
    }

  };

  const formatoPesos = (monto: number) =>
    monto.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    });

  return (
    <div className="panel-content">
      <Box
        onClick={() => setMostrarDashboardCards(!mostrarDashboardCards)}
        sx={{
          display: "flex",
          alignItems: "center",
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

      <Typography variant="h4" mb={2}>
        <InventoryIcon /> PEDIDOS PARA HOY
      </Typography>
      <div className="pedidos-cards">
        {pedidos.map((pedido) => (
          <div className="pedido-card" key={pedido._id} data-estado={pedido.estado}>
            <p><strong>Cliente: </strong>{pedido.nombreCliente}</p>
            <p><strong>Teléfono:</strong> {pedido.telefono}</p>
            <p><strong>Productos:</strong></p>
            <ul>
              {pedido.productos.map((p, i) => (
                <li key={i}>
                  {p.cantidad} × {typeof p.producto === "string" ? p.producto : p.producto.nombre}
                </li>
              ))}
            </ul>
            <p><strong>Total:</strong> {formatoPesos(pedido.total)}</p>
            <p><strong>Método Pago:</strong> {pedido.metodoPago}</p>
            <p><strong>Entrega:</strong> {pedido.tipoPedido}</p>
            <p><strong>Dirección:</strong> {pedido.direccion || "-"}</p>
            <p><strong>Comentario:</strong> {pedido.comentario || "-"}</p>
            <p><strong>Estado:</strong> {estadosTraducidos[pedido.estado] || pedido.estado}</p>
            <p><strong>Fecha:</strong> {new Date(pedido.fechaPedido).toLocaleString()}</p>

            {/* Select para delivery */}
            {rol === "delivery" &&
              (pedido.estado === "LISTO" || pedido.estado === "EN_CAMINO") && (
                <TextField
                  select
                  label="Estado"
                  value={pedido.estado}
                  onChange={(e) => actualizarEstado(pedido._id, e.target.value)}
                  size="small"
                  fullWidth
                  variant="outlined"
                  style={{ marginTop: "0.5rem" }}
                >
                  {pedido.estado === "LISTO" &&
                    [
                      <MenuItem key="ready" value="ready">Listo para reparto</MenuItem>,
                      <MenuItem key="in-distribution" value="in-distribution">En reparto</MenuItem>,
                    ]
                  }
                  {pedido.estado === "EN_CAMINO" &&
                    [
                      <MenuItem key="in-distribution" value="in-distribution">En reparto</MenuItem>,
                      <MenuItem key="entregado" value="entregado">Entregado</MenuItem>,
                    ]
                  }
                </TextField>
              )}

            {/* Select para admin */}
            {rol === "admin" && (
              <TextField
                select
                label="Estado"
                value={pedido.estado}
                onChange={(e) => actualizarEstado(pedido._id, e.target.value)}
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
                        estadosTraducidos[
                          estado
                        ]
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
