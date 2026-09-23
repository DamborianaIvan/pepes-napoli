import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import RefreshIcon from "@mui/icons-material/Refresh";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getSession } from "../../auth/session";
import {
  ETIQUETAS_METODO_PAGO,
  ETIQUETAS_TIPO_PEDIDO,
  METODOS_PAGO,
  TIPOS_PEDIDO,
  type MetodoPago,
  type TipoPedido,
} from "../../types/pedido";
import type { ResumenReportes } from "../../types/reportes";
import "./Reportes.css";

const API_URL = import.meta.env.VITE_API_URL;
const TIME_ZONE = "America/Argentina/Buenos_Aires";

type Preset = "HOY" | "7_DIAS" | "MES" | "PERSONALIZADO";
type TabReporte = "ventas" | "caja" | "stock";

const fechaArgentina = () => {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(partes.map((parte) => [parte.type, parte.value]));
  return `${values.year}-${values.month}-${values.day}`;
};

const sumarDias = (fecha: string, dias: number) => {
  const [year, month, day] = fecha.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + dias));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
};

const inicioMes = (fecha: string) => `${fecha.slice(0, 7)}-01`;

const resolverPreset = (preset: Exclude<Preset, "PERSONALIZADO">) => {
  const hoy = fechaArgentina();
  if (preset === "HOY") return { desde: hoy, hasta: hoy };
  if (preset === "7_DIAS") return { desde: sumarDias(hoy, -6), hasta: hoy };
  return { desde: inicioMes(hoy), hasta: hoy };
};

const moneda = (valor: number) =>
  Number(valor ?? 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  });

const numero = (valor: number) =>
  Number(valor ?? 0).toLocaleString("es-AR", { maximumFractionDigits: 3 });

const etiquetaCategoria = (categoria: string) =>
  categoria === "SIN_CATEGORIA"
    ? "Sin categoría"
    : categoria.charAt(0) + categoria.slice(1).toLowerCase();

const Reportes = () => {
  const session = getSession();
  const inicial = resolverPreset("MES");

  const [preset, setPreset] = useState<Preset>("MES");
  const [desde, setDesde] = useState(inicial.desde);
  const [hasta, setHasta] = useState(inicial.hasta);
  const [tab, setTab] = useState<TabReporte>("ventas");
  const [data, setData] = useState<ResumenReportes | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async (rangoDesde = desde, rangoHasta = hasta) => {
    const token = getSession()?.token;
    if (!token) return;

    try {
      setCargando(true);
      setError(null);
      const params = new URLSearchParams({
        desde: rangoDesde,
        hasta: rangoHasta,
      });
      const response = await fetch(`${API_URL}/api/reportes/resumen?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error?.message ?? body?.message ?? "No se pudieron cargar los reportes.");
      }
      setData(body);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudieron cargar los reportes.");
    } finally {
      setCargando(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    void cargar(inicial.desde, inicial.hasta);
    // El rango inicial se calcula una sola vez al montar la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cambiarPreset = (nuevo: Preset) => {
    setPreset(nuevo);
    if (nuevo === "PERSONALIZADO") return;

    const rango = resolverPreset(nuevo);
    setDesde(rango.desde);
    setHasta(rango.hasta);
    void cargar(rango.desde, rango.hasta);
  };

  const aplicarPersonalizado = () => {
    setPreset("PERSONALIZADO");
    void cargar(desde, hasta);
  };

  const pagosData = useMemo(
    () =>
      METODOS_PAGO.map((metodo) => ({
        metodo: ETIQUETAS_METODO_PAGO[metodo],
        importe: data?.ventas.porMetodoPago[metodo] ?? 0,
      })),
    [data],
  );

  const tiposData = useMemo(
    () =>
      TIPOS_PEDIDO.map((tipo) => ({
        tipo: ETIQUETAS_TIPO_PEDIDO[tipo],
        cantidad: data?.ventas.porTipo[tipo]?.cantidad ?? 0,
        importe: data?.ventas.porTipo[tipo]?.importe ?? 0,
      })),
    [data],
  );

  const categoriasData = useMemo(
    () =>
      (data?.ventas.categorias ?? []).map((item) => ({
        ...item,
        categoriaLabel: etiquetaCategoria(item.categoria),
      })),
    [data],
  );

  const topProductos = data?.ventas.productos.slice(0, 8) ?? [];

  return (
    <Box className="reportes-page">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} mb={2}>
        <Box>
          <Typography variant="h4" className="reportes-title">
            <AssessmentIcon /> REPORTES
          </Typography>
          <Typography color="text.secondary">
            Ventas, caja y stock consolidados desde el backend.
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          disabled={cargando}
          onClick={() => void cargar()}
        >
          Actualizar
        </Button>
      </Stack>

      <Card variant="outlined" className="reportes-filter-card">
        <CardContent>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems={{ lg: "center" }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Período</InputLabel>
              <Select
                label="Período"
                value={preset}
                onChange={(event) => cambiarPreset(event.target.value as Preset)}
              >
                <MenuItem value="HOY">Hoy</MenuItem>
                <MenuItem value="7_DIAS">Últimos 7 días</MenuItem>
                <MenuItem value="MES">Este mes</MenuItem>
                <MenuItem value="PERSONALIZADO">Personalizado</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Desde"
              type="date"
              value={desde}
              onChange={(event) => {
                setPreset("PERSONALIZADO");
                setDesde(event.target.value);
              }}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              size="small"
              label="Hasta"
              type="date"
              value={hasta}
              onChange={(event) => {
                setPreset("PERSONALIZADO");
                setHasta(event.target.value);
              }}
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <Button variant="contained" onClick={aplicarPersonalizado} disabled={cargando || !desde || !hasta}>
              Aplicar
            </Button>

            {data && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: { lg: "auto" } }}>
                {data.periodo.desde} al {data.periodo.hasta} · {data.periodo.zonaHoraria}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {cargando && !data ? (
        <Box className="reportes-loading"><CircularProgress /></Box>
      ) : data ? (
        <>
          <Box className="reportes-kpis">
            <Card><CardContent><span>Ingresos</span><strong>{moneda(data.ventas.ingresos)}</strong></CardContent></Card>
            <Card><CardContent><span>Ventas</span><strong>{data.ventas.cantidad}</strong></CardContent></Card>
            <Card><CardContent><span>Ticket promedio</span><strong>{moneda(data.ventas.ticketPromedio)}</strong></CardContent></Card>
            <Card><CardContent><span>Unidades vendidas</span><strong>{numero(data.ventas.unidadesVendidas)}</strong></CardContent></Card>
            <Card><CardContent><span>Descuentos</span><strong>{moneda(data.ventas.descuentos)}</strong></CardContent></Card>
          </Box>

          <Tabs value={tab} onChange={(_, value: TabReporte) => setTab(value)} sx={{ mt: 3, mb: 2 }}>
            <Tab value="ventas" icon={<TrendingUpIcon />} iconPosition="start" label="Ventas" />
            <Tab value="caja" icon={<PointOfSaleIcon />} iconPosition="start" label="Caja" />
            <Tab value="stock" icon={<Inventory2OutlinedIcon />} iconPosition="start" label="Stock" />
          </Tabs>

          {tab === "ventas" && (
            <Stack spacing={2}>
              <Box className="reportes-chart-grid">
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" mb={2}>Importes por medio de pago</Typography>
                    <div className="reportes-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pagosData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="metodo" />
                          <YAxis />
                          <Tooltip formatter={(value) => moneda(Number(value))} />
                          <Bar dataKey="importe" name="Importe" fill="#344054" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" mb={2}>Ventas por tipo de pedido</Typography>
                    <div className="reportes-chart">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={tiposData}
                            dataKey="cantidad"
                            nameKey="tipo"
                            outerRadius={95}
                            label
                            fill="#667085"
                          />
                          <Legend />
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </Box>

              <Box className="reportes-chart-grid">
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" mb={2}>Top productos</Typography>
                    {topProductos.length ? (
                      <div className="reportes-chart reportes-chart-tall">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topProductos} layout="vertical" margin={{ left: 25 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="nombre" width={130} />
                            <Tooltip formatter={(value, name) => name === "importe" ? moneda(Number(value)) : numero(Number(value))} />
                            <Legend />
                            <Bar dataKey="cantidad" name="Unidades" fill="#475467" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <Typography color="text.secondary">Sin ventas en el período.</Typography>}
                  </CardContent>
                </Card>

                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" mb={2}>Ventas por categoría</Typography>
                    {categoriasData.length ? (
                      <div className="reportes-chart reportes-chart-tall">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={categoriasData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="categoriaLabel" />
                            <YAxis />
                            <Tooltip formatter={(value) => moneda(Number(value))} />
                            <Bar dataKey="importe" name="Importe neto" fill="#667085" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : <Typography color="text.secondary">Sin categorías vendidas en el período.</Typography>}
                  </CardContent>
                </Card>
              </Box>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" mb={2}>Detalle por producto</Typography>
                  <div className="reportes-table-wrap">
                    <table className="reportes-table">
                      <thead><tr><th>Producto</th><th>Unidades</th><th>Importe neto</th></tr></thead>
                      <tbody>
                        {data.ventas.productos.map((producto) => (
                          <tr key={producto.productoId ?? producto.nombre}>
                            <td>{producto.nombre}</td>
                            <td>{numero(producto.cantidad)}</td>
                            <td>{moneda(producto.importe)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </Stack>
          )}

          {tab === "caja" && (
            <Stack spacing={2}>
              <Box className="reportes-kpis secundarios">
                <Card><CardContent><span>Cierres de caja</span><strong>{data.caja.cantidadCierres}</strong></CardContent></Card>
                <Card><CardContent><span>Diferencia acumulada</span><strong>{moneda(data.caja.diferenciaAcumulada)}</strong></CardContent></Card>
                {METODOS_PAGO.map((metodo: MetodoPago) => (
                  <Card key={metodo}><CardContent><span>{ETIQUETAS_METODO_PAGO[metodo]}</span><strong>{moneda(data.caja.totalesPorMetodo[metodo])}</strong></CardContent></Card>
                ))}
              </Box>

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" mb={2}>Cierres del período</Typography>
                  <div className="reportes-table-wrap">
                    <table className="reportes-table">
                      <thead>
                        <tr>
                          <th>Cierre</th>
                          <th>Inicial</th>
                          <th>Efectivo esperado</th>
                          <th>Declarado</th>
                          <th>Diferencia</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.caja.sesiones.map((caja) => (
                          <tr key={caja.id}>
                            <td>{new Date(caja.fechaCierre).toLocaleString("es-AR")}</td>
                            <td>{moneda(caja.montoInicial)}</td>
                            <td>{moneda(caja.efectivoEsperado ?? 0)}</td>
                            <td>{moneda(caja.efectivoDeclarado ?? 0)}</td>
                            <td className={(caja.diferencia ?? 0) === 0 ? "" : "reportes-diferencia"}>
                              {moneda(caja.diferencia ?? 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {data.caja.sesiones.length === 0 && (
                    <Typography color="text.secondary">No hubo cierres de caja en el período.</Typography>
                  )}
                </CardContent>
              </Card>
            </Stack>
          )}

          {tab === "stock" && (
            <Stack spacing={2}>
              <Alert
                severity={data.stock.alertas.length ? "warning" : "success"}
                icon={data.stock.alertas.length ? <WarningAmberOutlinedIcon /> : undefined}
              >
                {data.stock.alertas.length
                  ? `${data.stock.alertas.length} ingrediente(s) están en o debajo del stock mínimo actual.`
                  : "No hay alertas de stock bajo actualmente."}
              </Alert>

              {data.stock.alertas.length > 0 && (
                <Box className="reportes-alertas">
                  {data.stock.alertas.map((alerta) => (
                    <Chip
                      key={alerta.ingredienteId}
                      color="warning"
                      label={`${alerta.nombre}: ${numero(alerta.stockActual)} ${alerta.unidad} / mín. ${numero(alerta.stockMinimo)}`}
                    />
                  ))}
                </Box>
              )}

              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6">Movimientos del período</Typography>
                  <Typography color="text.secondary" mb={2}>
                    {data.stock.movimientos} movimiento(s) registrados.
                  </Typography>
                  <div className="reportes-table-wrap">
                    <table className="reportes-table">
                      <thead>
                        <tr>
                          <th>Ingrediente</th>
                          <th>Entrada</th>
                          <th>Salida</th>
                          <th>Ajuste</th>
                          <th>Merma</th>
                          <th>Consumo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.stock.porIngrediente.map((item) => (
                          <tr key={item.ingredienteId}>
                            <td>{item.nombre} <small>{item.unidad}</small></td>
                            <td>{numero(item.ENTRADA)}</td>
                            <td>{numero(item.SALIDA)}</td>
                            <td>{numero(item.AJUSTE)}</td>
                            <td>{numero(item.MERMA)}</td>
                            <td>{numero(item.CONSUMO)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {data.stock.porIngrediente.length === 0 && (
                    <Typography color="text.secondary">No hubo movimientos de stock en el período.</Typography>
                  )}
                </CardContent>
              </Card>
            </Stack>
          )}
        </>
      ) : null}
    </Box>
  );
};

export default Reportes;
