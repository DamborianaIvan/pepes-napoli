import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import AssessmentIcon from "@mui/icons-material/Assessment";

const API_URL = import.meta.env.VITE_API_URL;
const token = localStorage.getItem("token");

interface Producto {
  producto: string;
  cantidad: number;
  precio: number;
  _id: string;
}

interface Pedido {
  _id: string;
  nombreCliente: string;
  telefono: string;
  productos: Producto[];
  total: number;
  estado: string;
  fechaPedido: string;
  metodoPago: "efectivo" | "transferencia";
  tipoEntrega: "delivery" | "takeaway";
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const Reportes: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mes">("mes");

  useEffect(() => {
    async function obtenerPedidos() {
      try {
        const res = await fetch(`${API_URL}/api/pedidos`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Error al obtener pedidos");
        const data = await res.json();
        setPedidos(data);
      } catch (error) {
        console.error(error);
      }
    }
    obtenerPedidos();
  }, []);

  const filtrarPedidos = () => {
    const ahora = new Date();
    return pedidos.filter((p) => {
      const fecha = new Date(p.fechaPedido);
      if (isNaN(fecha.getTime())) return false;

      if (periodo === "dia") {
        return (
          fecha.getDate() === ahora.getDate() &&
          fecha.getMonth() === ahora.getMonth() &&
          fecha.getFullYear() === ahora.getFullYear()
        );
      }
      if (periodo === "semana") {
        const unaSemanaAtras = new Date();
        unaSemanaAtras.setDate(ahora.getDate() - 7);
        return fecha >= unaSemanaAtras && fecha <= ahora;
      }
      if (periodo === "mes") {
        return (
          fecha.getMonth() === ahora.getMonth() &&
          fecha.getFullYear() === ahora.getFullYear()
        );
      }
      return true;
    });
  };

  const pedidosFiltrados = filtrarPedidos();

  // Inicializo los contadores
  const totalPorMetodoPago = { efectivo: 0, transferencia: 0 };
  const totalPorTipoEntrega = { delivery: 0, takeaway: 0 };

  pedidosFiltrados.forEach((pedido) => {
    // Sumar método de pago
    if (pedido.metodoPago === "efectivo") totalPorMetodoPago.efectivo++;
    else if (pedido.metodoPago === "transferencia") totalPorMetodoPago.transferencia++;

    // Sumar tipo de entrega
    if (pedido.tipoEntrega === "delivery") totalPorTipoEntrega.delivery++;
    else if (pedido.tipoEntrega === "takeaway") totalPorTipoEntrega.takeaway++;
  });

  // Contar productos vendidos
  const productosContados: Record<string, { nombre: string; cantidad: number }> = {};

  pedidosFiltrados.forEach((pedido) => {
    pedido.productos.forEach((prod) => {
      if (!productosContados[prod.producto]) {
        productosContados[prod.producto] = { nombre: prod.producto, cantidad: 0 };
      }
      productosContados[prod.producto].cantidad += prod.cantidad;
    });
  });

  const productoMasPedido = Object.values(productosContados).sort(
    (a, b) => b.cantidad - a.cantidad
  )[0];

  const totalProductos = Object.values(productosContados).reduce(
    (acc, p) => acc + p.cantidad,
    0
  );

  const totalIngresos = pedidosFiltrados.reduce((acc, pedido) => {
    return acc + (pedido.total || 0);
  }, 0);

  // Datos para los gráficos Pie
  const dataPiePago = [
    { name: "Efectivo", value: totalPorMetodoPago.efectivo },
    { name: "Transferencia", value: totalPorMetodoPago.transferencia },
  ];

  const dataPieEntrega = [
    { name: "Delivery", value: totalPorTipoEntrega.delivery },
    { name: "Takeaway", value: totalPorTipoEntrega.takeaway },
  ];

  // Top 5 productos más pedidos para BarChart
  const dataTopProductos = Object.values(productosContados)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  return (
    <Box p={3}>
      <Typography variant="h4" mb={2}>
        <AssessmentIcon/>REPORTES
      </Typography>

      <FormControl sx={{ mb: 3, width: 200 }}>
        <InputLabel>Filtrar por</InputLabel>
        <Select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value as any)}
          label="Filtrar por"
        >
          <MenuItem value="dia">Hoy</MenuItem>
          <MenuItem value="semana">Últimos 7 días</MenuItem>
          <MenuItem value="mes">Este mes</MenuItem>
        </Select>
      </FormControl>

      <Box display="flex" gap={2} flexWrap="wrap">
        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6">Total pedidos</Typography>
            <Typography variant="h5">{pedidosFiltrados.length}</Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6">Producto más pedido</Typography>
            <Typography variant="h5">
              {productoMasPedido?.nombre ?? "Sin datos"}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6">Total productos vendidos</Typography>
            <Typography variant="h5">{totalProductos}</Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6">Delivery</Typography>
            <Typography variant="h5">{totalPorTipoEntrega.delivery}</Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6">Takeaway</Typography>
            <Typography variant="h5">{totalPorTipoEntrega.takeaway}</Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6">Pagos en efectivo</Typography>
            <Typography variant="h5">{totalPorMetodoPago.efectivo}</Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6">Transferencias</Typography>
            <Typography variant="h5">{totalPorMetodoPago.transferencia}</Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 200 }}>
          <CardContent>
            <Typography variant="h6">Ingresos estimados</Typography>
            <Typography variant="h5">
              ${totalIngresos.toLocaleString("es-AR")}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Gráficos Pie */}
      <Box mt={4} display="flex" gap={4} flexWrap="wrap">
        <Card sx={{ flex: 1, minWidth: 300 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Método de Pago
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={dataPiePago}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label
                >
                  {dataPiePago.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, minWidth: 300 }}>
          <CardContent>
            <Typography variant="h6" mb={2}>
              Tipo de Entrega
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={dataPieEntrega}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label
                >
                  {dataPieEntrega.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[(index + 2) % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Top productos */}
      <Box mt={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" mb={2}>
              🥢 Top 5 Productos más pedidos
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dataTopProductos}>
                <XAxis dataKey="nombre" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Reportes;
