import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import "./Mesas.css";

interface Mesa {
  _id: string;
  numero: number;
  nombre?: string | null;
  capacidad?: number;
  estado: "LIBRE" | "OCUPADA";
  observaciones?: string;
}

interface ProductoPedido {
  producto: string;
  cantidad: number;
  precio: number;
}

interface Pedido {
  _id: string;
  mesaId?: string | { _id: string } | null;
  tipoPedido: "SALON" | "DELIVERY" | "TAKEAWAY";
  productos: ProductoPedido[];
  total: number;
  metodoPago: string;
  estado: string;
  fechaPedido: string;
  comentario?: string;
}

const API_URL = import.meta.env.VITE_API_URL;
const ESTADOS_FINALIZADOS = new Set(["PAGADO", "CANCELADO"]);

const obtenerIdMesa = (mesaId: Pedido["mesaId"]) =>
  typeof mesaId === "string" ? mesaId : mesaId?._id;

const formatoPesos = (monto: number) =>
  monto.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  });

const Mesas = () => {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [mesaSeleccionada, setMesaSeleccionada] = useState<Mesa | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [cerrandoPedidoId, setCerrandoPedidoId] = useState<string | null>(null);

  const cargarDatos = useCallback(async () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      setError(null);
      const [mesasResponse, pedidosResponse] = await Promise.all([
        fetch(`${API_URL}/api/mesas`, { headers }),
        fetch(`${API_URL}/api/pedidos`, { headers }),
      ]);

      if (!mesasResponse.ok || !pedidosResponse.ok) {
        throw new Error("No se pudieron cargar las mesas.");
      }

      const [mesasData, pedidosData] = await Promise.all([
        mesasResponse.json(),
        pedidosResponse.json(),
      ]);

      setMesas(Array.isArray(mesasData) ? mesasData : []);
      setPedidos(Array.isArray(pedidosData) ? pedidosData : []);
    } catch {
      setError("No se pudieron cargar las mesas. Intentá actualizar nuevamente.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
    const intervalo = window.setInterval(() => void cargarDatos(), 30_000);
    return () => window.clearInterval(intervalo);
  }, [cargarDatos]);

  const pedidosActivosPorMesa = useMemo(() => {
    const pedidosPorMesa = new Map<string, Pedido>();

    pedidos
      .filter(
        (pedido) =>
          pedido.tipoPedido === "SALON" &&
          !ESTADOS_FINALIZADOS.has(pedido.estado) &&
          obtenerIdMesa(pedido.mesaId),
      )
      .sort(
        (a, b) =>
          new Date(b.fechaPedido).getTime() - new Date(a.fechaPedido).getTime(),
      )
      .forEach((pedido) => {
        const mesaId = obtenerIdMesa(pedido.mesaId);
        if (mesaId && !pedidosPorMesa.has(mesaId)) pedidosPorMesa.set(mesaId, pedido);
      });

    return pedidosPorMesa;
  }, [pedidos]);

  const resumen = useMemo(
    () => ({
      libres: mesas.filter((mesa) => mesa.estado === "LIBRE").length,
      ocupadas: mesas.filter((mesa) => mesa.estado === "OCUPADA").length,
    }),
    [mesas],
  );

  const pedidoSeleccionado = mesaSeleccionada
    ? pedidosActivosPorMesa.get(mesaSeleccionada._id)
    : undefined;

  const finalizarPedidoYLiberarMesa = async (
    mesa: Mesa,
    pedido: Pedido,
    estado: "PAGADO" | "CANCELADO",
  ) => {
    const accion = estado === "PAGADO" ? "cobro" : "cancelación";
    if (!window.confirm(`¿Confirmás el ${accion} del pedido y la liberación de la mesa ${mesa.numero}?`)) return;

    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

    try {
      setCerrandoPedidoId(pedido._id);
      setError(null);
      setMensaje(null);

      const pedidoResponse = await fetch(`${API_URL}/api/pedidos/${pedido._id}/estado`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ estado }),
      });
      if (!pedidoResponse.ok) throw new Error("No se pudo cerrar el pedido.");

      const mesaResponse = await fetch(`${API_URL}/api/mesas/${mesa._id}/estado`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ estado: "LIBRE" }),
      });
      if (!mesaResponse.ok) throw new Error("El pedido se cerró, pero no se pudo liberar la mesa.");

      setMesaSeleccionada(null);
      setMensaje(`Mesa ${mesa.numero} liberada y pedido ${estado === "PAGADO" ? "cobrado" : "cancelado"} correctamente.`);
      await cargarDatos();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo cerrar el pedido.");
      await cargarDatos();
    } finally {
      setCerrandoPedidoId(null);
    }
  };

  return (
    <section className="mesas-page">
      <header className="mesas-header">
        <div>
          <div className="mesas-title">
            <TableRestaurantIcon fontSize="large" />
            <h1>Mesas</h1>
          </div>
          <p>Estado del salón y pedidos activos en tiempo real.</p>
        </div>
        <button className="mesas-refresh" type="button" onClick={() => void cargarDatos()}>
          <RefreshIcon fontSize="small" /> Actualizar
        </button>
      </header>

      <div className="mesas-resumen" aria-label="Resumen de mesas">
        <div className="resumen-chip libre">
          <span className="estado-dot" />
          <strong>{resumen.libres}</strong> libres
        </div>
        <div className="resumen-chip ocupada">
          <span className="estado-dot" />
          <strong>{resumen.ocupadas}</strong> ocupadas
        </div>
        <div className="resumen-chip total">
          <strong>{mesas.length}</strong> mesas en total
        </div>
      </div>

      {error && <p className="mesas-error">{error}</p>}
      {mensaje && <p className="mesas-success">{mensaje}</p>}

      {cargando ? (
        <p className="mesas-loading">Cargando mesas...</p>
      ) : (
        <div className="mesas-grid">
          {mesas.map((mesa) => {
            const pedido = pedidosActivosPorMesa.get(mesa._id);
            const ocupada = mesa.estado === "OCUPADA" || Boolean(pedido);

            return (
              <article
                key={mesa._id}
                className={`mesa-card ${ocupada ? "ocupada" : "libre"}`}
                onClick={() => setMesaSeleccionada(mesa)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setMesaSeleccionada(mesa);
                }}
                role="button"
                tabIndex={0}
                aria-label={`Mesa ${mesa.numero}, ${ocupada ? "ocupada" : "libre"}`}
              >
                <span className="mesa-estado">{ocupada ? "Ocupada" : "Libre"}</span>
                <div className="mesa-dibujo" aria-hidden="true">
                  <span className="silla silla-arriba" />
                  <span className="silla silla-abajo" />
                  <span className="silla silla-izquierda" />
                  <span className="silla silla-derecha" />
                  <strong>{mesa.numero}</strong>
                </div>
                <span className="mesa-nombre">{mesa.nombre || `Mesa ${mesa.numero}`}</span>
                <span className="mesa-capacidad">
                  <PeopleAltOutlinedIcon fontSize="small" /> {mesa.capacidad ?? 4} personas
                </span>
                {pedido ? (
                  <span className="mesa-pedido">
                    <ReceiptLongOutlinedIcon fontSize="small" /> Pedido {pedido.estado}
                    <strong>{formatoPesos(pedido.total)}</strong>
                  </span>
                ) : (
                  <span className="mesa-disponible">Disponible para un nuevo pedido</span>
                )}
                {pedido && (
                  <>
                  <button
                    className="mesa-action"
                    type="button"
                    disabled={cerrandoPedidoId === pedido._id}
                    onClick={(event) => {
                      event.stopPropagation();
                      void finalizarPedidoYLiberarMesa(mesa, pedido, "PAGADO");
                    }}
                  >
                    {cerrandoPedidoId === pedido._id ? "Cerrando..." : "Cobrar y liberar"}
                  </button>
                  <button
                    className="mesa-cancel-action"
                    type="button"
                    disabled={cerrandoPedidoId === pedido._id}
                    onClick={(event) => {
                      event.stopPropagation();
                      void finalizarPedidoYLiberarMesa(mesa, pedido, "CANCELADO");
                    }}
                  >
                    Cancelar pedido
                  </button>
                  </>
                )}
              </article>
            );
          })}
        </div>
      )}

      {!cargando && mesas.length === 0 && !error && (
        <p className="mesas-loading">Todavía no hay mesas creadas.</p>
      )}

      {mesaSeleccionada && (
        <div className="mesa-modal-backdrop" role="presentation" onMouseDown={() => setMesaSeleccionada(null)}>
          <article
            className="mesa-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mesa-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="mesa-modal-close" type="button" onClick={() => setMesaSeleccionada(null)}>
              ×
            </button>
            <span className={`mesa-modal-status ${pedidoSeleccionado || mesaSeleccionada.estado === "OCUPADA" ? "ocupada" : "libre"}`}>
              {pedidoSeleccionado || mesaSeleccionada.estado === "OCUPADA" ? "Ocupada" : "Libre"}
            </span>
            <h2 id="mesa-modal-title">{mesaSeleccionada.nombre || `Mesa ${mesaSeleccionada.numero}`}</h2>
            <p>Capacidad: {mesaSeleccionada.capacidad ?? 4} personas</p>

            {pedidoSeleccionado ? (
              <div className="mesa-pedido-detalle">
                <h3>Pedido actual</h3>
                <p><strong>Estado:</strong> {pedidoSeleccionado.estado}</p>
                <p><strong>Pago:</strong> {pedidoSeleccionado.metodoPago}</p>
                <p><strong>Hora:</strong> {new Date(pedidoSeleccionado.fechaPedido).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</p>
                <ul>
                  {pedidoSeleccionado.productos.map((producto, index) => (
                    <li key={`${producto.producto}-${index}`}>
                      {producto.cantidad} × {producto.producto}
                    </li>
                  ))}
                </ul>
                <strong className="mesa-total">Total: {formatoPesos(pedidoSeleccionado.total)}</strong>
                {pedidoSeleccionado.comentario && <p className="mesa-comentario">{pedidoSeleccionado.comentario}</p>}
                <button
                  className="mesa-modal-action"
                  type="button"
                  disabled={cerrandoPedidoId === pedidoSeleccionado._id}
                  onClick={() => void finalizarPedidoYLiberarMesa(mesaSeleccionada, pedidoSeleccionado, "PAGADO")}
                >
                  {cerrandoPedidoId === pedidoSeleccionado._id ? "Cerrando pedido..." : "Cobrar y liberar mesa"}
                </button>
                <button
                  className="mesa-modal-cancel-action"
                  type="button"
                  disabled={cerrandoPedidoId === pedidoSeleccionado._id}
                  onClick={() => void finalizarPedidoYLiberarMesa(mesaSeleccionada, pedidoSeleccionado, "CANCELADO")}
                >
                  Cancelar pedido y liberar mesa
                </button>
              </div>
            ) : (
              <div className="mesa-sin-pedido">
                <p>No hay un pedido activo en esta mesa.</p>
                <Link to="/panel/nuevo-pedido" onClick={() => setMesaSeleccionada(null)}>
                  Crear pedido
                </Link>
              </div>
            )}

            {mesaSeleccionada.observaciones && (
              <p className="mesa-observaciones"><strong>Observaciones:</strong> {mesaSeleccionada.observaciones}</p>
            )}
          </article>
        </div>
      )}
    </section>
  );
};

export default Mesas;
