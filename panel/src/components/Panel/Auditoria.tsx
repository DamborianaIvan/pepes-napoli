import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import { getSession } from "../../auth/session";
import "./Auditoria.css";

const API_URL = import.meta.env.VITE_API_URL;

type EntidadAuditoria = "PEDIDO" | "CAJA" | "STOCK" | "USUARIO" | "PRODUCTO";

interface AuditLog {
  _id: string;
  accion: string;
  entidad: EntidadAuditoria;
  entidadId?: string | null;
  usuarioId?: {
    _id: string;
    nombre: string;
    nombreUsuario: string;
    rol: string;
  } | null;
  usuarioNombreSnapshot?: string | null;
  antes?: Record<string, unknown> | null;
  despues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  fecha: string;
}

const ENTIDADES: Array<{ value: EntidadAuditoria; label: string }> = [
  { value: "PEDIDO", label: "Pedidos" },
  { value: "CAJA", label: "Caja" },
  { value: "STOCK", label: "Stock" },
  { value: "USUARIO", label: "Usuarios" },
  { value: "PRODUCTO", label: "Productos" },
];

const etiquetaAccion = (accion: string) =>
  accion
    .toLowerCase()
    .split("_")
    .map((palabra) => palabra.charAt(0).toUpperCase() + palabra.slice(1))
    .join(" ");

const detalle = (valor?: Record<string, unknown> | null) => {
  if (!valor || Object.keys(valor).length === 0) return null;
  return JSON.stringify(valor, null, 2);
};

const Auditoria = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [entidad, setEntidad] = useState<EntidadAuditoria | "">("");
  const [limit, setLimit] = useState(100);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const token = getSession()?.token;
    if (!token) return;

    try {
      setCargando(true);
      setError(null);

      const params = new URLSearchParams({ limit: String(limit) });
      if (entidad) params.set("entidad", entidad);

      const response = await fetch(`${API_URL}/api/auditoria?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error?.message ?? body?.message ?? "No se pudo cargar la auditoría.");
      }

      setLogs(Array.isArray(body) ? body : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo cargar la auditoría.");
    } finally {
      setCargando(false);
    }
  }, [entidad, limit]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <Box className="auditoria-page">
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} mb={2}>
        <Box>
          <Typography variant="h4" className="auditoria-title">
            <HistoryOutlinedIcon /> AUDITORÍA
          </Typography>
          <Typography color="text.secondary">
            Historial de operaciones críticas realizadas dentro del sistema.
          </Typography>
        </Box>

        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => void cargar()} disabled={cargando}>
          Actualizar
        </Button>
      </Stack>

      <Card variant="outlined" className="auditoria-filtros">
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Entidad</InputLabel>
              <Select
                value={entidad}
                label="Entidad"
                onChange={(event) => setEntidad(event.target.value as EntidadAuditoria | "")}
              >
                <MenuItem value="">Todas</MenuItem>
                {ENTIDADES.map((item) => (
                  <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Cantidad</InputLabel>
              <Select
                value={limit}
                label="Cantidad"
                onChange={(event) => setLimit(Number(event.target.value))}
              >
                <MenuItem value={50}>Últimos 50</MenuItem>
                <MenuItem value={100}>Últimos 100</MenuItem>
                <MenuItem value={200}>Últimos 200</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

      {cargando ? (
        <Box className="auditoria-loading"><CircularProgress /></Box>
      ) : logs.length === 0 ? (
        <Typography color="text.secondary" sx={{ mt: 3 }}>
          No hay eventos de auditoría para mostrar.
        </Typography>
      ) : (
        <div className="auditoria-lista">
          {logs.map((log) => {
            const antes = detalle(log.antes);
            const despues = detalle(log.despues);
            const metadata = detalle(log.metadata);
            const usuario = log.usuarioId?.nombre
              ?? log.usuarioNombreSnapshot
              ?? "Sistema";

            return (
              <Card key={log._id} variant="outlined" className="auditoria-item">
                <CardContent>
                  <div className="auditoria-item-header">
                    <div>
                      <strong>{etiquetaAccion(log.accion)}</strong>
                      <span>{log.entidad}</span>
                    </div>
                    <time>{new Date(log.fecha).toLocaleString("es-AR")}</time>
                  </div>

                  <div className="auditoria-meta">
                    <span>Usuario: <strong>{usuario}</strong></span>
                    {log.usuarioId?.rol && <span>Rol: {log.usuarioId.rol}</span>}
                    {log.entidadId && <span>ID: {log.entidadId}</span>}
                  </div>

                  {(antes || despues || metadata) && (
                    <details className="auditoria-detalle">
                      <summary>Ver detalle</summary>
                      <div className="auditoria-detalle-grid">
                        {antes && <div><span>Antes</span><pre>{antes}</pre></div>}
                        {despues && <div><span>Después</span><pre>{despues}</pre></div>}
                        {metadata && <div><span>Datos</span><pre>{metadata}</pre></div>}
                      </div>
                    </details>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </Box>
  );
};

export default Auditoria;
