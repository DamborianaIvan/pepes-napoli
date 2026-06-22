import { useEffect, useRef, useState } from "react";
import { DateRange } from "react-date-range";
import type { Range } from "react-date-range";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { es } from "date-fns/locale";
import { TextField, MenuItem } from "@mui/material";
import "dayjs/locale/es";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "./ListaPedidos.css";
import InventoryIcon from "@mui/icons-material/Inventory";
import { Typography } from "@mui/material";
dayjs.extend(isBetween);
dayjs.locale("es");

interface Producto {
  producto: string;
  cantidad: number;
  precio: number;
}

interface Pedido {
  _id: string;
  nombreCliente: string;
  telefono: string;
  productos: Producto[];
  total: number;
  estado: "pending" | "in-preparation" | "ready" | "in-distribution" | "entregado" | "cancelado";
  fechaPedido: string;
  usuario: string;
  metodoPago: string;
  tipoEntrega: string;
  address?: string;
  comentario?: string;
}

const estadosTraducidos: Record<string, string> = {
  pending: "Pendiente",
  "in-preparation": "En preparación",
  ready: "Listo para reparto",
  "in-distribution": "En reparto",
  entregado: "Entregado",
  cancelado: "Cancelado",
};


const METODOS_PAGO = ["", "efectivo", "transferencia"];
const TIPOS_ENTREGA = ["", "delivery", "takeaway"];

export const ListaPedidos = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtros, setFiltros] = useState({
    usuario: "",
    metodoPago: "",
    tipoEntrega: "",
    fechas: {
      startDate: undefined,
      endDate: undefined,
      key: "selection",
    } as Range,
  });
  const [estado, setEstado] = useState("");
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const pedidosPorPagina = 20;

  const calendarioRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPedidos = () => {
      const token = localStorage.getItem("token");
      fetch(`${import.meta.env.VITE_API_URL}/api/pedidos`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setPedidos(data))
        .catch((err) => console.error("Error:", err));
    };

    fetchPedidos();
    const interval = setInterval(fetchPedidos, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickFuera = (e: MouseEvent) => {
      if (calendarioRef.current && !calendarioRef.current.contains(e.target as Node)) {
        setMostrarCalendario(false);
      }
    };
    if (mostrarCalendario) {
      document.addEventListener("mousedown", handleClickFuera);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickFuera);
    };
  }, [mostrarCalendario]);

  const pedidosFiltrados = pedidos.filter((pedido) => {
    if (filtros.fechas.startDate && filtros.fechas.endDate) {
      const inicio = dayjs(filtros.fechas.startDate).startOf("day");
      const fin = dayjs(filtros.fechas.endDate).endOf("day");
      const fechaPedido = dayjs(pedido.fechaPedido);
      if (!fechaPedido.isBetween(inicio, fin, null, "[]")) return false;
    }
    if (
      filtros.usuario.trim() &&
      !pedido.nombreCliente.toLowerCase().includes(filtros.usuario.toLowerCase().trim())
    )
      return false;
    if (filtros.metodoPago && pedido.metodoPago !== filtros.metodoPago) return false;
    if (filtros.tipoEntrega && pedido.tipoEntrega !== filtros.tipoEntrega) return false;
    if (estado && pedido.estado !== estado) return false;
    return true;
  });

  pedidosFiltrados.sort((a, b) => dayjs(b.fechaPedido).valueOf() - dayjs(a.fechaPedido).valueOf());

  const indexUltimo = paginaActual * pedidosPorPagina;
  const indexPrimero = indexUltimo - pedidosPorPagina;
  const pedidosPaginados = pedidosFiltrados.slice(indexPrimero, indexUltimo);
  const totalPaginas = Math.ceil(pedidosFiltrados.length / pedidosPorPagina);

  const quitarFiltro = (tipo: keyof typeof filtros | "estado") => {
    if (tipo === "fechas") {
      setFiltros((f) => ({
        ...f,
        fechas: { startDate: undefined, endDate: undefined, key: "selection" },
      }));
    } else if (tipo === "estado") {
      setEstado("");
    } else {
      setFiltros((f) => ({ ...f, [tipo]: "" }));
    }
    setPaginaActual(1);
  };

  const pedidosPorDia = pedidosPaginados.reduce((acc, pedido) => {
    const dia = dayjs(pedido.fechaPedido).format("dddd DD [de] MMMM");
    if (!acc[dia]) acc[dia] = [];
    acc[dia].push(pedido);
    return acc;
  }, {} as Record<string, Pedido[]>);

  return (
    <div className="contenedor-lista">
      <Typography variant="h4" mb={2}>
        <InventoryIcon/>HISTORIAL DE PEDIDOS
      </Typography>
      <div className="filtros">
  <TextField
    label="Buscar por cliente"
    variant="outlined"
    value={filtros.usuario}
    onChange={(e) => {
      setPaginaActual(1);
      setFiltros({ ...filtros, usuario: e.target.value });
    }}
    size="small"
  />

  <TextField
    label="Método de pago"
    variant="outlined"
    select
    value={filtros.metodoPago}
    onChange={(e) => {
      setPaginaActual(1);
      setFiltros({ ...filtros, metodoPago: e.target.value });
    }}
    size="small"
  >
    {METODOS_PAGO.map((mp) => (
      <MenuItem key={mp} value={mp}>
        {mp || "Todos"}
      </MenuItem>
    ))}
  </TextField>

  <TextField
    label="Tipo de entrega"
    variant="outlined"
    select
    value={filtros.tipoEntrega}
    onChange={(e) => {
      setPaginaActual(1);
      setFiltros({ ...filtros, tipoEntrega: e.target.value });
    }}
    size="small"
  >
      {TIPOS_ENTREGA.map((te) => (
        <MenuItem key={te} value={te}>
          {te || "Todos"}
        </MenuItem>
      ))}
    </TextField>

    <TextField
      label="Estado"
      variant="outlined"
      select
      value={estado}
      onChange={(e) => {
        setPaginaActual(1);
        setEstado(e.target.value);
      }}
      size="small"
    >
      <MenuItem value="">Todos</MenuItem>
      <MenuItem value="pending">Pendiente</MenuItem>
      <MenuItem value="in-preparation">En preparación</MenuItem>
      <MenuItem value="ready">Pedido Listo</MenuItem>
      <MenuItem value="in-distribution">En reparto</MenuItem>
      <MenuItem value="entregado">Entregado</MenuItem>
      <MenuItem value="cancelado">Cancelado</MenuItem>
    </TextField>

    <button
      className="btn-fechas"
      onClick={() => setMostrarCalendario(!mostrarCalendario)}
    >
      📅 Seleccionar Fechas
    </button>

    <button
      className="btn-limpiar"
      onClick={() => {
        setPaginaActual(1);
        setFiltros({
          usuario: "",
          metodoPago: "",
          tipoEntrega: "",
          fechas: { startDate: undefined, endDate: undefined, key: "selection" },
        });
        setEstado("");
      }}
    >
      Limpiar filtros ❌
    </button>
  </div>

      {mostrarCalendario && (
        <div ref={calendarioRef} className="popup-calendario">
          <DateRange
            editableDateInputs
            onChange={(item) => {
              setPaginaActual(1);
              setFiltros({ ...filtros, fechas: item.selection });
            }}
            moveRangeOnFirstSelection={false}
            ranges={[filtros.fechas]}
            locale={es}
            maxDate={new Date()}
          />
        </div>
      )}

      <div className="filtros-aplicados">
        {filtros.usuario && (
          <span className="filtro-aplicado" onClick={() => quitarFiltro("usuario")}>
            Cliente: {filtros.usuario} ×
          </span>
        )}
        {filtros.metodoPago && (
          <span className="filtro-aplicado" onClick={() => quitarFiltro("metodoPago")}>
            Pago: {filtros.metodoPago} ×
          </span>
        )}
        {filtros.tipoEntrega && (
          <span className="filtro-aplicado" onClick={() => quitarFiltro("tipoEntrega")}>
            Entrega: {filtros.tipoEntrega} ×
          </span>
        )}
        {estado && (
          <span className="filtro-aplicado" onClick={() => quitarFiltro("estado")}>
            Estado: {estadosTraducidos[estado] || estado} ×
          </span>
        )}
        {filtros.fechas.startDate && filtros.fechas.endDate && (
          <span className="filtro-aplicado" onClick={() => quitarFiltro("fechas")}>
            Fechas: {dayjs(filtros.fechas.startDate).format("DD/MM/YYYY")} - {dayjs(filtros.fechas.endDate).format("DD/MM/YYYY")} ×
          </span>
        )}
      </div>

      <div className="lista-pedidos">
        {Object.entries(pedidosPorDia).map(([dia, pedidosDia]) => (
          <div key={dia}>
            <h3 className="fecha-header">{dia}</h3>
            {pedidosDia.map((pedido) => (
              <div
                key={pedido._id}
                className={`pedido-item ${expandedId === pedido._id ? "expandido" : ""}`}
                onClick={() =>
                  setExpandedId((prev) => (prev === pedido._id ? null : pedido._id))
                }
              >
                <div className="resumen">
                  <strong>{pedido.nombreCliente}</strong> - {estadosTraducidos[pedido.estado] || pedido.estado} - $
                  {pedido.total.toLocaleString("es-AR")}
                  <br />
                  <small>{dayjs(pedido.fechaPedido).format("HH:mm")} hs</small>
                </div>
                {expandedId === pedido._id && (
                  <div className="detalle">
                    <p>📞 Teléfono: {pedido.telefono}</p>
                    <p>🚚 Tipo de entrega: {pedido.tipoEntrega}</p>
                    <p>💳 Método de pago: {pedido.metodoPago}</p>
                    {pedido.address && <p>🏠 Dirección: {pedido.address}</p>}
                    {pedido.comentario && <p>💬 Comentario: {pedido.comentario}</p>}
                    <ul>
                      {pedido.productos.map((prod, i) => (
                        <li key={i}>
                          {prod.cantidad} x {prod.producto} ($
                          {prod.precio.toLocaleString("es-AR")})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {totalPaginas > 1 && (
        <div className="paginacion">
          <button
            onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
            disabled={paginaActual === 1}
          >
            ← Anterior
          </button>
          <span>
            Página {paginaActual} de {totalPaginas}
          </span>
          <button
            onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))}
            disabled={paginaActual === totalPaginas}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};
