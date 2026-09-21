import React, { useEffect, useState } from "react";
import { Box, Card, CardContent, Typography, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import AssessmentIcon from "@mui/icons-material/Assessment";
import { ETIQUETAS_METODO_PAGO, type MetodoPago, type Pedido, type TipoPedido } from "../../types/pedido";
import { getSession } from "../../auth/session";

const API_URL = import.meta.env.VITE_API_URL;
type Periodo = "dia" | "semana" | "mes";
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const Reportes: React.FC = () => {
  const session = getSession();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>("mes");

  useEffect(() => {
    async function obtenerPedidos() {
      try {
        const token = session?.token;
        const res = await fetch(`${API_URL}/api/pedidos`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("Error al obtener pedidos");
        setPedidos(await res.json());
      } catch (error) {
        console.error(error);
      }
    }
    void obtenerPedidos();
  }, []);

  const filtrarPedidos = () => {
    const ahora = new Date();
    return pedidos.filter((p) => {
      const fecha = new Date(p.fechaPedido);
      if (Number.isNaN(fecha.getTime())) return false;
      if (periodo === "dia") return fecha.getDate() === ahora.getDate() && fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
      if (periodo === "semana") {
        const unaSemanaAtras = new Date(ahora);
        unaSemanaAtras.setDate(ahora.getDate() - 7);
        return fecha >= unaSemanaAtras && fecha <= ahora;
      }
      return fecha.getMonth() === ahora.getMonth() && fecha.getFullYear() === ahora.getFullYear();
    });
  };

  const pedidosFiltrados = filtrarPedidos();
  const pedidosCobrados = pedidosFiltrados.filter((pedido) => pedido.estadoPago === "PAGADO");
  const totalPorMetodoPago: Record<MetodoPago, number> = { EFECTIVO: 0, TRANSFERENCIA: 0, DEBITO: 0, CREDITO: 0 };
  const totalPorTipoPedido: Record<Exclude<TipoPedido, "SALON">, number> = { DELIVERY: 0, TAKEAWAY: 0 };

  pedidosCobrados.forEach((pedido) => {
    pedido.pagos.forEach((pago) => { totalPorMetodoPago[pago.metodo] += pago.monto; });
    if (pedido.tipoPedido === "DELIVERY") totalPorTipoPedido.DELIVERY++;
    else if (pedido.tipoPedido === "TAKEAWAY") totalPorTipoPedido.TAKEAWAY++;
  });

  const productosContados: Record<string, { nombre: string; cantidad: number }> = {};
  pedidosCobrados.forEach((pedido) => pedido.productos.forEach((prod) => {
    const key = prod.productoId || prod.nombreSnapshot;
    if (!productosContados[key]) productosContados[key] = { nombre: prod.nombreSnapshot, cantidad: 0 };
    productosContados[key].cantidad += prod.cantidad;
  }));

  const productoMasPedido = Object.values(productosContados).sort((a, b) => b.cantidad - a.cantidad)[0];
  const totalProductos = Object.values(productosContados).reduce((acc, p) => acc + p.cantidad, 0);
  const totalIngresos = pedidosCobrados.reduce((acc, pedido) => acc + (pedido.total || 0), 0);
  const dataPiePago = (Object.keys(ETIQUETAS_METODO_PAGO) as MetodoPago[]).map((metodo) => ({ name: ETIQUETAS_METODO_PAGO[metodo], value: totalPorMetodoPago[metodo] }));
  const dataPieEntrega = [
    { name: "Delivery", value: totalPorTipoPedido.DELIVERY },
    { name: "Takeaway", value: totalPorTipoPedido.TAKEAWAY },
  ];
  const dataTopProductos = Object.values(productosContados).sort((a, b) => b.cantidad - a.cantidad).slice(0, 5);

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}><AssessmentIcon />REPORTES</Typography>
      <FormControl sx={{ mb: 3, width: 200 }}>
        <InputLabel>Filtrar por</InputLabel>
        <Select value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)} label="Filtrar por">
          <MenuItem value="dia">Hoy</MenuItem><MenuItem value="semana">Últimos 7 días</MenuItem><MenuItem value="mes">Este mes</MenuItem>
        </Select>
      </FormControl>

      <Box display="flex" gap={2} flexWrap="wrap">
        <Card sx={{ minWidth: 200 }}><CardContent><Typography variant="h6">Pedidos cobrados</Typography><Typography variant="h5">{pedidosCobrados.length}</Typography></CardContent></Card>
        <Card sx={{ minWidth: 200 }}><CardContent><Typography variant="h6">Producto más pedido</Typography><Typography variant="h5">{productoMasPedido?.nombre ?? "Sin datos"}</Typography></CardContent></Card>
        <Card sx={{ minWidth: 200 }}><CardContent><Typography variant="h6">Total productos vendidos</Typography><Typography variant="h5">{totalProductos}</Typography></CardContent></Card>
        <Card sx={{ minWidth: 200 }}><CardContent><Typography variant="h6">Delivery</Typography><Typography variant="h5">{totalPorTipoPedido.DELIVERY}</Typography></CardContent></Card>
        <Card sx={{ minWidth: 200 }}><CardContent><Typography variant="h6">Takeaway</Typography><Typography variant="h5">{totalPorTipoPedido.TAKEAWAY}</Typography></CardContent></Card>
        <Card sx={{ minWidth: 200 }}><CardContent><Typography variant="h6">Efectivo</Typography><Typography variant="h5">${totalPorMetodoPago.EFECTIVO.toLocaleString("es-AR")}</Typography></CardContent></Card>
        <Card sx={{ minWidth: 200 }}><CardContent><Typography variant="h6">Transferencias</Typography><Typography variant="h5">${totalPorMetodoPago.TRANSFERENCIA.toLocaleString("es-AR")}</Typography></CardContent></Card>
        <Card sx={{ minWidth: 200 }}><CardContent><Typography variant="h6">Ingresos</Typography><Typography variant="h5">${totalIngresos.toLocaleString("es-AR")}</Typography></CardContent></Card>
      </Box>

      <Box mt={4} display="flex" gap={4} flexWrap="wrap">
        <Card sx={{ flex: 1, minWidth: 300 }}><CardContent><Typography variant="h6" mb={2}>Método de Pago</Typography><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={dataPiePago} dataKey="value" nameKey="name" outerRadius={80} label>{dataPiePago.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Legend /><Tooltip /></PieChart></ResponsiveContainer></CardContent></Card>
        <Card sx={{ flex: 1, minWidth: 300 }}><CardContent><Typography variant="h6" mb={2}>Tipo de Pedido</Typography><ResponsiveContainer width="100%" height={250}><PieChart><Pie data={dataPieEntrega} dataKey="value" nameKey="name" outerRadius={80} label>{dataPieEntrega.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />)}</Pie><Legend /><Tooltip /></PieChart></ResponsiveContainer></CardContent></Card>
      </Box>

      <Box mt={4}><Card><CardContent><Typography variant="h6" mb={2}>🥢 Top 5 Productos más pedidos</Typography><ResponsiveContainer width="100%" height={300}><BarChart data={dataTopProductos}><XAxis dataKey="nombre" /><YAxis /><Tooltip /><Bar dataKey="cantidad" fill="#8884d8" /></BarChart></ResponsiveContainer></CardContent></Card></Box>
    </Box>
  );
};

export default Reportes;
