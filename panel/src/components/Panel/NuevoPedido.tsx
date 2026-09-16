import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Snackbar from "@mui/material/Snackbar";
import { Box, Grid, Card, CardContent, Typography, Button, Divider, TextField, Alert, Dialog, DialogTitle, DialogContent, DialogActions, MenuItem } from "@mui/material";
import "./NuevoPedido.css";
import { TIPOS_PEDIDO, type Pedido, type ProductoPedido, type TipoPedido } from "../../types/pedido";

interface Producto { _id: string; nombre: string; categoria: string; descripcion: string; precio: number; disponible: boolean; imagen: string; }
interface Mesa { _id: string; numero: number; nombre?: string; estado: string; }

const API_URL = import.meta.env.VITE_API_URL;
const NuevoPedido = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [dialogConfirmar, setDialogConfirmar] = useState(false);
  const [guardandoPedido, setGuardandoPedido] = useState(false);
  const [tipoPedido, setTipoPedido] = useState<TipoPedido>(TIPOS_PEDIDO[0]);
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [comentario, setComentario] = useState("");
  const [mesaId, setMesaId] = useState<string>("");
  const [pedidoCreado, setPedidoCreado] = useState<Pedido | null>(null);
  const [productosPedido, setProductosPedido] = useState<ProductoPedido[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" | "warning" }>({ open: false, message: "", severity: "info" });
  const [pedidoExitoso, setPedidoExitoso] = useState(false);
  const token = localStorage.getItem("token") || "";
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

  const disminuirCantidad = (productoId: string | null) => {
    setProductosPedido(prev => prev.map(item => item.productoId === productoId ? { ...item, cantidad: item.cantidad - 1, subtotal: (item.cantidad - 1) * item.precioUnitario } : item).filter(item => item.cantidad > 0));
  };

  const eliminarProducto = (productoId: string | null) => setProductosPedido(prev => prev.filter(item => item.productoId !== productoId));

  const abrirConfirmacion = () => {
    if (productosPedido.length === 0) return setSnackbar({ open: true, message: "Debe agregar al menos un producto.", severity: "warning" });
    if (tipoPedido === "SALON" && !mesaId) return setSnackbar({ open: true, message: "Seleccione una mesa.", severity: "warning" });
    setDialogConfirmar(true);
  };

  const limpiarFormulario = () => {
    setProductosPedido([]); setMesaId(""); setNombreCliente(""); setTelefono(""); setDireccion(""); setComentario(""); setTipoPedido("SALON");
  };

  const handleCrearPedido = async () => {
    setGuardandoPedido(true);
    try {
      if (productosPedido.length === 0) throw new Error("Debe agregar al menos un producto");
      if (tipoPedido === "SALON" && !mesaId) throw new Error("Debe seleccionar una mesa");
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

      setDialogConfirmar(false);
      const response = await axios.post<Pedido>(`${API_URL}/api/pedidos`, payload, axiosConfig);
      setPedidoCreado(response.data);
      setPedidoExitoso(true);
      limpiarFormulario();
    } catch (error) {
      const message = error instanceof Error && !axios.isAxiosError(error) ? error.message : (axios.isAxiosError(error) ? error.response?.data?.error?.message || error.response?.data?.message : undefined);
      setSnackbar({ open: true, message: message || "Error al crear el pedido", severity: "error" });
    } finally {
      setGuardandoPedido(false);
    }
  };

  const formatCurrency = (value: number) => value.toLocaleString("es-AR", { style: "currency", currency: "ARS" });

  return (
    <Box className="nuevoPedido-container">
      <Box className="nuevoPedido-header"><Typography variant="h4" component="span">NUEVO PEDIDO</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>Armá el pedido y confirmalo.</Typography></Box>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}><Card className="resumen-card"><CardContent><Typography variant="h6" gutterBottom>Pedido Actual</Typography>{Object.entries(productosPorCategoria).map(([categoria, items]) => <Box key={categoria} sx={{ mb: 4 }}><Typography variant="h6" fontWeight="bold">{categoria}</Typography><Grid container spacing={2} sx={{ mt: 1 }}>{items.map(producto => <Grid key={producto._id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}><Card sx={{ cursor: "pointer" }} className="producto-card" onClick={() => agregarProducto(producto)}><CardContent><Typography variant="subtitle1" fontWeight={700}>{producto.nombre}</Typography><Typography className="precio">{formatCurrency(producto.precio)}</Typography></CardContent></Card></Grid>)}</Grid></Box>)}</CardContent></Card></Grid>
        <Grid size={{ xs: 12, md: 5 }}><Card><CardContent><Typography variant="h6" gutterBottom>Configuración Pedido</Typography><Box display="flex" flexDirection="column" gap={2}>
          <TextField select label="Tipo Pedido" value={tipoPedido} onChange={(e) => setTipoPedido(e.target.value as TipoPedido)}>{TIPOS_PEDIDO.map(tipo => <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>)}</TextField>
          {tipoPedido === "SALON" && <TextField select label="Mesa" value={mesaId} onChange={(e) => setMesaId(e.target.value)}>{mesas.filter(mesa => mesa.estado === "LIBRE").map(mesa => <MenuItem key={mesa._id} value={mesa._id}>{mesa.numero}</MenuItem>)}</TextField>}
          {tipoPedido !== "SALON" && <><TextField fullWidth label="Nombre Cliente" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} /><TextField fullWidth label="Telefono" value={telefono} onChange={(e) => setTelefono(e.target.value)} /><TextField fullWidth multiline rows={3} label="Comentario" value={comentario} onChange={(e) => setComentario(e.target.value)} /></>}
          {tipoPedido === "DELIVERY" && <TextField fullWidth label="Direccion" value={direccion} onChange={(e) => setDireccion(e.target.value)} />}
          <Divider /><Typography variant="h5">Total: {formatCurrency(total)}</Typography><Button variant="contained" onClick={abrirConfirmacion} disabled={guardandoPedido}>Confirmar pedido</Button>
        </Box></CardContent></Card></Grid>
      </Grid>
      <Dialog open={dialogConfirmar} onClose={() => setDialogConfirmar(false)}><DialogTitle>Confirmar pedido</DialogTitle><DialogContent><Typography>Vas a registrar un pedido por {formatCurrency(total)}.</Typography></DialogContent><DialogActions><Button onClick={() => setDialogConfirmar(false)}>Cancelar</Button><Button variant="contained" onClick={handleCrearPedido} disabled={guardandoPedido}>Confirmar</Button></DialogActions></Dialog>
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}><Alert severity={snackbar.severity}>{snackbar.message}</Alert></Snackbar>
    </Box>
  );
};

export default NuevoPedido;
