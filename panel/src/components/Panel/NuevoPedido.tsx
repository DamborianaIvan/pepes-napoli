import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Snackbar from "@mui/material/Snackbar";
import { Box, Grid, Card, CardContent, Typography, Button, Divider, TextField, Alert, MenuItem, IconButton } from "@mui/material";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import "./NuevoPedido.css";
import { TIPOS_PEDIDO, type Pedido, type ProductoPedido, type TipoPedido } from "../../types/pedido";
import { getSession } from "../../auth/session";

interface Producto { _id: string; nombre: string; categoria: string; descripcion: string; precio: number; disponible: boolean; imagen: string; }
interface Mesa { _id: string; numero: number; nombre?: string; estado: string; }

const API_URL = import.meta.env.VITE_API_URL;
const NuevoPedido = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [guardandoPedido, setGuardandoPedido] = useState(false);
  const [tipoPedido, setTipoPedido] = useState<TipoPedido>(TIPOS_PEDIDO[0]);
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [comentario, setComentario] = useState("");
  const [mesaId, setMesaId] = useState<string>("");
  const [productosPedido, setProductosPedido] = useState<ProductoPedido[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" | "warning" }>({ open: false, message: "", severity: "info" });
  const token = getSession()?.token || "";
  const axiosConfig = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const fetchProductos = useCallback(async () => {
    try { const res = await axios.get(`${API_URL}/api/productos`, axiosConfig); setProductos(res.data); }
    catch (error) { console.error("Error obteniendo productos", error); }
  }, [axiosConfig]);

  const fetchMesas = useCallback(async () => {
    try { const res = await axios.get(`${API_URL}/api/mesas`, axiosConfig); setMesas(res.data); }
    catch (error) { console.error("Error obteniendo mesas", error); }
  }, [axiosConfig]);

  useEffect(() => { void Promise.all([fetchProductos(), fetchMesas()]); }, [fetchMesas, fetchProductos]);

  const productosPorCategoria = productos.reduce((acc, producto) => {
    if (!acc[producto.categoria]) acc[producto.categoria] = [];
    acc[producto.categoria].push(producto);
    return acc;
  }, {} as Record<string, Producto[]>);

  const total = productosPedido.reduce((acc, item) => acc + item.precioUnitario * item.cantidad, 0);

  const agregarProducto = (producto: Producto) => {
    setProductosPedido(prev => {
      const existente = prev.find(p => p.productoId === producto._id);
      if (existente) return prev.map(p => p.productoId === producto._id ? { ...p, cantidad: p.cantidad + 1, subtotal: (p.cantidad + 1) * p.precioUnitario } : p);
      return [...prev, { productoId: producto._id, nombreSnapshot: producto.nombre, cantidad: 1, precioUnitario: producto.precio, subtotal: producto.precio }];
    });
  };

  const aumentarCantidad = (productoId: string | null) => {
    setProductosPedido(prev => prev.map(item => item.productoId === productoId
      ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precioUnitario }
      : item
    ));
  };

  const disminuirCantidad = (productoId: string | null) => {
    setProductosPedido(prev => prev.map(item => item.productoId === productoId
      ? { ...item, cantidad: item.cantidad - 1, subtotal: (item.cantidad - 1) * item.precioUnitario }
      : item
    ).filter(item => item.cantidad > 0));
  };

  const eliminarProducto = (productoId: string | null) => setProductosPedido(prev => prev.filter(item => item.productoId !== productoId));

  const crearPedido = async () => {
    if (productosPedido.length === 0) return setSnackbar({ open: true, message: "Debe agregar al menos un producto.", severity: "warning" });
    if (tipoPedido === "SALON" && !mesaId) return setSnackbar({ open: true, message: "Seleccione una mesa.", severity: "warning" });

    setGuardandoPedido(true);
    try {
      if (tipoPedido === "DELIVERY" && (!nombreCliente || !telefono || !direccion)) throw new Error("Complete todos los datos del cliente");
      if (tipoPedido === "TAKEAWAY" && (!nombreCliente || !telefono)) throw new Error("Complete todos los datos del cliente");

      const payload = {
        tipoPedido,
        nombreCliente,
        telefono,
        direccion,
        comentario,
        productos: productosPedido.map(({ productoId, cantidad }) => ({ productoId, cantidad })),
        mesaId: tipoPedido === "SALON" ? mesaId : null,
      };

      const response = await axios.post<Pedido>(`${API_URL}/api/pedidos`, payload, axiosConfig);
      setSnackbar({ open: true, message: `Pedido #${response.data._id.slice(-6)} creado y confirmado correctamente.`, severity: "success" });
      limpiarFormulario();
    } catch (error) {
      const message = error instanceof Error && !axios.isAxiosError(error) ? error.message : (axios.isAxiosError(error) ? error.response?.data?.error?.message || error.response?.data?.message : undefined);
      setSnackbar({ open: true, message: message || "Error al crear el pedido", severity: "error" });
    } finally {
      setGuardandoPedido(false);
    }
  };

  const limpiarFormulario = () => {
    setProductosPedido([]); setMesaId(""); setNombreCliente(""); setTelefono(""); setDireccion(""); setComentario(""); setTipoPedido("SALON");
  };

  const formatCurrency = (value: number) => value.toLocaleString("es-AR", { style: "currency", currency: "ARS" });

  return (
    <Box className="nuevoPedido-container">
      <Box className="nuevoPedido-header">
        <Typography variant="h4" component="span">NUEVO PEDIDO</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>Armá el pedido y confirmalo.</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card className="resumen-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>Productos</Typography>
              {Object.entries(productosPorCategoria).map(([categoria, items]) => (
                <Box key={categoria} sx={{ mb: 4 }}>
                  <Typography variant="h6" fontWeight="bold">{categoria}</Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {items.map(producto => (
                      <Grid key={producto._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                        <Card sx={{ cursor: "pointer" }} className="producto-card" onClick={() => agregarProducto(producto)}>
                          <CardContent>
                            <Typography variant="subtitle1" fontWeight={700}>{producto.nombre}</Typography>
                            <Typography className="precio">{formatCurrency(producto.precio)}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Configuración Pedido</Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <TextField select label="Tipo Pedido" value={tipoPedido} onChange={(e) => setTipoPedido(e.target.value as TipoPedido)}>
                  {TIPOS_PEDIDO.map(tipo => <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>)}
                </TextField>

                {tipoPedido === "SALON" && (
                  <TextField select label="Mesa" value={mesaId} onChange={(e) => setMesaId(e.target.value)}>
                    {mesas.filter(mesa => mesa.estado === "LIBRE").map(mesa => <MenuItem key={mesa._id} value={mesa._id}>{mesa.numero}</MenuItem>)}
                  </TextField>
                )}

                {tipoPedido !== "SALON" && (
                  <>
                    <TextField fullWidth label="Nombre Cliente" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} />
                    <TextField fullWidth label="Telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
                    <TextField fullWidth multiline rows={3} label="Comentario" value={comentario} onChange={(e) => setComentario(e.target.value)} />
                  </>
                )}

                {tipoPedido === "DELIVERY" && (
                  <TextField fullWidth label="Direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />
                )}

                <Divider />

                <Box className="detalle-pedido">
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle1" fontWeight={700}>Detalle del pedido</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {productosPedido.reduce((acc, item) => acc + item.cantidad, 0)} {productosPedido.reduce((acc, item) => acc + item.cantidad, 0) === 1 ? "item" : "items"}
                    </Typography>
                  </Box>

                  {productosPedido.length === 0 ? (
                    <Box className="detalle-pedido-vacio">
                      <Typography variant="body2" color="text.secondary">Todavía no agregaste productos.</Typography>
                      <Typography variant="caption" color="text.secondary">Seleccioná un producto para comenzar.</Typography>
                    </Box>
                  ) : (
                    <Box className="detalle-pedido-lista">
                      {productosPedido.map(item => (
                        <Box key={item.productoId} className="pedido-item">
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>{item.nombreSnapshot}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.cantidad} × {formatCurrency(item.precioUnitario)}
                            </Typography>
                          </Box>

                          <Typography variant="body2" fontWeight={700} sx={{ mx: 1.5, whiteSpace: "nowrap" }}>
                            {formatCurrency(item.precioUnitario * item.cantidad)}
                          </Typography>

                          <Box display="flex" alignItems="center">
                            <IconButton size="small" aria-label={`Disminuir ${item.nombreSnapshot}`} onClick={() => disminuirCantidad(item.productoId)}>
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                            <Typography variant="body2" fontWeight={700} sx={{ minWidth: 24, textAlign: "center" }}>{item.cantidad}</Typography>
                            <IconButton size="small" aria-label={`Aumentar ${item.nombreSnapshot}`} onClick={() => aumentarCantidad(item.productoId)}>
                              <AddIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" aria-label={`Eliminar ${item.nombreSnapshot}`} onClick={() => eliminarProducto(item.productoId)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}

                  <Box className="total-box">
                    <Typography variant="body2">Total</Typography>
                    <Typography variant="h4" fontWeight={800}>{formatCurrency(total)}</Typography>
                  </Box>
                </Box>

                <Button className="guardar-btn" variant="contained" onClick={crearPedido} disabled={guardandoPedido}>
                  Crear pedido
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default NuevoPedido;
