import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { getSession } from "../../auth/session";
import type { Pedido } from "../../types/pedido";
import "./DeliveryPedidos.css";

const API_URL = import.meta.env.VITE_API_URL;
const POLLING_MS = 5000;

const DeliveryPedidos = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [entregandoId, setEntregandoId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const token = getSession()?.token ?? "";

  const cargarPedidos = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true);

    try {
      const response = await fetch(`${API_URL}/api/pedidos/delivery`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error?.message ?? "No se pudieron cargar los pedidos.");
      }

      setPedidos(Array.isArray(body) ? body : []);
      setError("");
    } catch (requestError) {
      if (!silencioso) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "No se pudieron cargar los pedidos."
        );
      }
    } finally {
      if (!silencioso) setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    void cargarPedidos();

    const intervalId = window.setInterval(() => {
      void cargarPedidos(true);
    }, POLLING_MS);

    return () => window.clearInterval(intervalId);
  }, [cargarPedidos]);

  const marcarEntregado = async (pedidoId: string) => {
    setEntregandoId(pedidoId);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/pedidos/delivery/${pedidoId}/entregado`,
        {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const body = await response.json();
      if (!response.ok) {
        throw new Error(body?.error?.message ?? "No se pudo marcar el pedido como entregado.");
      }

      setPedidos((actuales) => actuales.filter((pedido) => pedido._id !== pedidoId));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "No se pudo marcar el pedido como entregado."
      );
    } finally {
      setEntregandoId(null);
    }
  };

  return (
    <Box className="delivery-pedidos">
      <Box className="delivery-pedidos-header">
        <LocalShippingOutlinedIcon fontSize="large" />
        <Box>
          <Typography variant="h4">PEDIDOS</Typography>
          <Typography color="text.secondary">
            Entregas disponibles.
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {cargando ? (
        <Box className="delivery-pedidos-estado">
          <CircularProgress />
          <Typography color="text.secondary">Cargando pedidos...</Typography>
        </Box>
      ) : pedidos.length === 0 ? (
        <Box className="delivery-pedidos-estado">
          <CheckCircleOutlineIcon fontSize="large" />
          <Typography variant="h6">No hay entregas pendientes</Typography>
          <Typography color="text.secondary">
            Los pedidos listos aparecerán automáticamente.
          </Typography>
        </Box>
      ) : (
        <Box className="delivery-pedidos-grid">
          {pedidos.map((pedido) => (
            <Card key={pedido._id} className="delivery-pedido-card" variant="outlined">
              <CardContent>
                <Typography variant="h6" mb={1}>
                  {pedido.nombreCliente || "Cliente"}
                </Typography>

                <Box className="delivery-pedido-datos">
                  <div>
                    <span>Dirección</span>
                    <strong>{pedido.direccion || "Sin dirección"}</strong>
                  </div>
                  <div>
                    <span>Teléfono</span>
                    <strong>{pedido.telefono || "Sin teléfono"}</strong>
                  </div>
                </Box>

                <Box className="delivery-pedido-productos">
                  {pedido.productos.map((producto, index) => (
                    <div key={`${producto.productoId ?? "producto"}-${index}`}>
                      <strong>{producto.cantidad} ×</strong>
                      <span>{producto.nombreSnapshot}</span>
                    </div>
                  ))}
                </Box>

                {pedido.comentario && (
                  <Box className="delivery-pedido-comentario">
                    <span>Comentario</span>
                    <strong>{pedido.comentario}</strong>
                  </Box>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  size="large"
                  startIcon={<CheckCircleOutlineIcon />}
                  disabled={entregandoId !== null}
                  onClick={() => void marcarEntregado(pedido._id)}
                >
                  {entregandoId === pedido._id ? "Marcando..." : "Entregado"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default DeliveryPedidos;
