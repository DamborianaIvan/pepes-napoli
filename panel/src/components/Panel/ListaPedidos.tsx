import { useEffect, useRef, useState } from "react";
import { DateRange } from "react-date-range";
import type { Range } from "react-date-range";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { es } from "date-fns/locale";
import { TextField, MenuItem, Typography } from "@mui/material";
import "dayjs/locale/es";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "./ListaPedidos.css";
import InventoryIcon from "@mui/icons-material/Inventory";
import { getSession } from "../../auth/session";
import {
  ESTADOS_PEDIDO,
  ETIQUETAS_ESTADO_PEDIDO,
  ETIQUETAS_METODO_PAGO,
  ETIQUETAS_TIPO_PEDIDO,
  METODOS_PAGO,
  TIPOS_PEDIDO,
  type EstadoPedido,
  type Pedido,
  type MetodoPago,
  type TipoPedido,
} from "../../types/pedido";

dayjs.extend(isBetween);
dayjs.locale("es");

const ListaPedidos = () => {
  const session = getSession();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [filtros, setFiltros] = useState({
    usuario: "",
    metodoPago: "" as MetodoPago | "",
    tipoPedido: "" as TipoPedido | "",
    fechas: {
      startDate: undefined,
      endDate: undefined,
      key: "selection",
    } as Range,
  });
  const [estadoPedido, setEstadoPedido] = useState<EstadoPedido | "">("");
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const pedidosPorPagina = 20;
  const calendarioRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const token = session?.token;
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pedidos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Error al obtener pedidos");
        const data: Pedido[] = await res.json();
        setPedidos(data);
      } catch (err) {
        console.error("Error obteniendo pedidos:", err);
      }
    };

    void fetchPedidos();
    const interval = setInterval(() => void fetchPedidos(), 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickFuera = (e: MouseEvent) => {
      if (calendarioRef.current && !calendarioRef.current.contains(e.target as Node)) {
        setMostrarCalendario(false);
      }
    };
    if (mostrarCalendario) document.addEventListener("mousedown", handleClickFuera);
    return () => document.removeEventListener("mousedown", handleClickFuera);
  }, [mostrarCalendario]);

  const pedidosFiltrados = pedidos.filter((pedido) => {
    if (filtros.fechas.startDate && filtros.fechas.endDate) {
      const inicio = dayjs(filtros.fechas.startDate).startOf("day");
      const fin = dayjs(filtros.fechas.endDate).endOf("day");
      if (!dayjs(pedido.fechaPedido).isBetween(inicio, fin, null, "[]")) return false;
    }
    if (
      filtros.usuario.trim() &&
      !(pedido.nombreCliente ?? "").toLowerCase().includes(filtros.usuario.toLowerCase().trim())
    ) return false;
    if (filtros.metodoPago && !pedido.pagos.some((pago) => pago.metodo === filtros.metodoPago)) return false;
    if (filtros.tipoPedido && pedido.tipoPedido !== filtros.tipoPedido) return false;
    if (estadoPedido && pedido.estadoPedido !== estadoPedido) return false;
    return true;
  });

  pedidosFiltrados.sort((a, b) => dayjs(b.fechaPedido).valueOf() - dayjs(a.fechaPedido).valueOf());
  const indexUltimo = paginaActual * pedidosPorPagina;
  const pedidosPaginados = pedidosFiltrados.slice(indexUltimo - pedidosPorPagina, indexUltimo);
  const totalPaginas = Math.ceil(pedidosFiltrados.length / pedidosPorPagina);

  const quitarFiltro = (tipo: keyof typeof filtros | "estadoPedido") => {
    if (tipo === "fechas") {
      setFiltros((f) => ({ ...f, fechas: { startDate: undefined, endDate: undefined, key: "selection" } }));
    } else if (tipo === "estadoPedido") {
      setEstadoPedido("");
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
      <Typography variant="h4" mb={2}><InventoryIcon />HISTORIAL DE PEDIDOS</Typography>
      <div className="filtros">
        <TextField label="Buscar por cliente" variant="outlined" value={filtros.usuario} onChange={(e) => { setPaginaActual(1); setFiltros({ ...filtros, usuario: e.target.value }); }} size="small" />
        <TextField label="Método de pago" variant="outlined" select value={filtros.metodoPago} onChange={(e) => { setPaginaActual(1); setFiltros({ ...filtros, metodoPago: e.target.value as MetodoPago | "" }); }} size="small">
          <MenuItem value="">Todos</MenuItem>
          {METODOS_PAGO.map((mp) => <MenuItem key={mp} value={mp}>{ETIQUETAS_METODO_PAGO[mp]}</MenuItem>)}
        </TextField>
        <TextField label="Tipo de pedido" variant="outlined" select value={filtros.tipoPedido} onChange={(e) => { setPaginaActual(1); setFiltros({ ...filtros, tipoPedido: e.target.value as TipoPedido | "" }); }} size="small">
          <MenuItem value="">Todos</MenuItem>
          {TIPOS_PEDIDO.map((tipo) => <MenuItem key={tipo} value={tipo}>{ETIQUETAS_TIPO_PEDIDO[tipo]}</MenuItem>)}
        </TextField>
        <TextField label="Estado" variant="outlined" select value={estadoPedido} onChange={(e) => { setPaginaActual(1); setEstadoPedido(e.target.value as EstadoPedido | ""); }} size="small">
          <MenuItem value="">Todos</MenuItem>
          {ESTADOS_PEDIDO.map((estado) => <MenuItem key={estado} value={estado}>{ETIQUETAS_ESTADO_PEDIDO[estado]}</MenuItem>)}
        </TextField>
        <button className="btn-fechas" onClick={() => setMostrarCalendario(!mostrarCalendario)}>📅 Seleccionar Fechas</button>
        <button className="btn-limpiar" onClick={() => { setPaginaActual(1); setFiltros({ usuario: "", metodoPago: "", tipoPedido: "", fechas: { startDate: undefined, endDate: undefined, key: "selection" } }); setEstadoPedido(""); }}>Limpiar filtros ❌</button>
      </div>

      {mostrarCalendario && <div ref={calendarioRef} className="popup-calendario"><DateRange editableDateInputs onChange={(item) => { setPaginaActual(1); setFiltros({ ...filtros, fechas: item.selection }); }} moveRangeOnFirstSelection={false} ranges={[filtros.fechas]} locale={es} maxDate={new Date()} /></div>}

      <div className="filtros-aplicados">
        {filtros.usuario && <span className="filtro-aplicado" onClick={() => quitarFiltro("usuario")}>Cliente: {filtros.usuario} ×</span>}
        {filtros.metodoPago && <span className="filtro-aplicado" onClick={() => quitarFiltro("metodoPago")}>Pago: {ETIQUETAS_METODO_PAGO[filtros.metodoPago]} ×</span>}
        {filtros.tipoPedido && <span className="filtro-aplicado" onClick={() => quitarFiltro("tipoPedido")}>Tipo: {ETIQUETAS_TIPO_PEDIDO[filtros.tipoPedido]} ×</span>}
        {estadoPedido && <span className="filtro-aplicado" onClick={() => quitarFiltro("estadoPedido")}>Estado: {ETIQUETAS_ESTADO_PEDIDO[estadoPedido]} ×</span>}
        {filtros.fechas.startDate && filtros.fechas.endDate && <span className="filtro-aplicado" onClick={() => quitarFiltro("fechas")}>Fechas: {dayjs(filtros.fechas.startDate).format("DD/MM/YYYY")} - {dayjs(filtros.fechas.endDate).format("DD/MM/YYYY")} ×</span>}
      </div>

      <div className="lista-pedidos">
        {Object.entries(pedidosPorDia).map(([dia, pedidosDia]) => <div key={dia}>
          <h3 className="fecha-header">{dia}</h3>
          {pedidosDia.map((pedido) => <div key={pedido._id} className={`pedido-item ${expandedId === pedido._id ? "expandido" : ""}`} onClick={() => setExpandedId((prev) => prev === pedido._id ? null : pedido._id)}>
            <div className="resumen">
              <strong>{pedido.nombreCliente || "Cliente sin nombre"}</strong> - {ETIQUETAS_ESTADO_PEDIDO[pedido.estadoPedido]} - ${pedido.total.toLocaleString("es-AR")}
              <br /><small>{dayjs(pedido.fechaPedido).format("HH:mm")} hs</small>
            </div>
            {expandedId === pedido._id && <div className="detalle">
              <p>📞 Teléfono: {pedido.telefono || "-"}</p>
              <p>🚚 Tipo de pedido: {ETIQUETAS_TIPO_PEDIDO[pedido.tipoPedido]}</p>
              <p>💳 Estado de pago: {pedido.estadoPago}</p>
              <p>💳 Pagos: {pedido.pagos.length ? pedido.pagos.map((pago) => `${ETIQUETAS_METODO_PAGO[pago.metodo]} $${pago.monto.toLocaleString("es-AR")}`).join(" · ") : "Pendiente"}</p>
              {pedido.direccion && <p>🏠 Dirección: {pedido.direccion}</p>}
              {pedido.comentario && <p>💬 Comentario: {pedido.comentario}</p>}
              <ul>{pedido.productos.map((prod, i) => <li key={`${pedido._id}-${i}`}>{prod.cantidad} x {prod.nombreSnapshot} (${prod.precioUnitario.toLocaleString("es-AR")})</li>)}</ul>
            </div>}
          </div>)}
        </div>)}
      </div>

      {totalPaginas > 1 && <div className="paginacion"><button onClick={() => setPaginaActual((p) => Math.max(1, p - 1))} disabled={paginaActual === 1}>← Anterior</button><span>Página {paginaActual} de {totalPaginas}</span><button onClick={() => setPaginaActual((p) => Math.min(totalPaginas, p + 1))} disabled={paginaActual === totalPaginas}>Siguiente →</button></div>}
    </div>
  );
};

export { ListaPedidos };
