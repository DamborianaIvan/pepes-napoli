import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Snackbar from "@mui/material/Snackbar";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Stack,
  MenuItem,
  Avatar
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { useNavigate } from "react-router-dom";
import "./NuevoPedido.css";

interface Producto {
  _id: string;
  nombre: string;
  categoria: string;
  descripcion: string;
  precio: number;
  disponible: boolean;
  imagen: string;
}

interface Mesa {
  _id: string;
  numero: number;
  nombre?: string;
  estado: string;
}

interface ProductoPedido {
  producto: string;
  cantidad: number;
  precio: number;
  subtotal?: number;
}

interface PedidoCreado {
  _id: string;
  numeroPedido: number;
  mesa?: string;
  nombreCliente?: string;
  telefono?: string;
  direccion?: string;
  comentario?: string;
  tipoPedido: "SALON" | "DELIVERY" | "TAKEAWAY";
  metodoPago: "EFECTIVO" | "TRANSFERENCIA" | "DEBITO" | "CREDITO";
  productos: ProductoPedido[];
  total: number;
  estado: string;
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL;
const NuevoPedido = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [dialogConfirmar, setDialogConfirmar] = useState(false);
  const [guardandoPedido, setGuardandoPedido] = useState(false);
  const [tipoPedido, setTipoPedido] =
  useState<
    "SALON" |
    "DELIVERY" |
    "TAKEAWAY"
  >("SALON");
  const [nombreCliente, setNombreCliente] = useState("");
  const [telefono, setTelefono] = useState("");
  const [direccion, setDireccion] = useState("");
  const [comentario, setComentario] = useState("");
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");
  const [mesaId, setMesaId] = useState<string>("");
  const [pedidoCreado, setPedidoCreado] = useState<PedidoCreado | null>(null);
  const mesaSeleccionada = mesas.find(
    (mesa) => mesa._id === mesaId
  );
  const mesasLibres =mesas.filter(
    mesa =>
      mesa.estado === "LIBRE"
  );
  const [productosPedido, setProductosPedido] =useState<ProductoPedido[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" | "warning" }>({
    open: false,
    message: "",
    severity: "info",
  });
  const navigate = useNavigate();
  const [pedidoExitoso, setPedidoExitoso] = useState(false);
  const token = localStorage.getItem("token") || "";
  const axiosConfig = useMemo(() => ({
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }), [token]);


  //fetch PRODUCTOS
  const fetchProductos = useCallback(async () => {
  try {
    const res = await axios.get(
      `${API_URL}/api/productos`,
      axiosConfig
    );
    setProductos(res.data);
  } catch (error) {
    console.error(
      "Error obteniendo productos",
      error
    );
  }
  }, [axiosConfig]);

  //fetch MESAS (todasss)
  const fetchMesas = useCallback(async () => {
  try {
    const res = await axios.get(`${API_URL}/api/mesas`,axiosConfig);
    setMesas(res.data);
  } catch (error) {
    console.error("Error obteniendo mesas", error);

  }
  }, [axiosConfig]);

  useEffect(() => {
    void Promise.all([fetchProductos(), fetchMesas()]);
  }, [fetchMesas, fetchProductos]);

  //reduce sobre jsons reformandolos y obtenciones de valores
  const productosPorCategoria = productos.reduce(
    (acc, producto) => {
      if (!acc[producto.categoria]) {
        acc[producto.categoria] = [];
      }
      acc[producto.categoria].push(
        producto
      );
      return acc;
    },
    {} as Record<
      string,
      Producto[]
    >
  );

  const total = productosPedido.reduce(
  (acc, item) =>
    acc + item.precio * item.cantidad,
  0
);

  //Aca van operaciones dentro del componente
  //Aca vamos a estar seteando el array productosPedido con los diferentes pedidos que vamos a hacer, para un futuro poder hacer el envio a la api del pedido completo
  const agregarProducto = (
    producto: Producto
  ) => {
    setProductosPedido(prev => {
      const existente =
        prev.find(
          p =>
            p.producto === producto.nombre
        );
      if (existente) {
        return prev.map(p =>
          p.producto === producto.nombre
            ? {
                  ...p,
                  cantidad: p.cantidad + 1,
              }
            : p
        );
      }
      return [
        ...prev,
        {
          producto:
            producto.nombre,
          cantidad: 1,
          precio:
            producto.precio
        }
      ];

    });

  };

  //Disminuir cantidad de productos dentro del pedido
  const disminuirCantidad = (
  producto: string
) => {
  setProductosPedido(prev => {
    return prev
      .map(item => {
        if (
          item.producto === producto
        ) {
          return {
            ...item,
            cantidad:item.cantidad - 1
          };
        }
        return item;
      })
      .filter(
        item =>
          item.cantidad > 0
      );
  });
  };

  //Eliminar producto
  const eliminarProducto = (
    producto: string
  ) => {

    setProductosPedido(prev =>
      prev.filter(
        item =>
          item.producto !== producto
      )
    );

  };

  //Fuyncion que abre dialog de confirmacion

 
  const abrirConfirmacion = () => {
    if (productosPedido.length === 0) {
      setSnackbar({
        open: true,
        message: "Debe agregar al menos un producto.",
        severity: "warning"
      });
      return;
    }

    if (tipoPedido === "SALON" && !mesaId) {
      setSnackbar({
        open: true,
        message: "Seleccione una mesa.",
        severity: "warning"
      });
      return;
    }

    setDialogConfirmar(true);
  };
  

  const limpiarFormulario = () => {

    setProductosPedido([]);

    setMesaId("");

    setNombreCliente("");

    setTelefono("");

    setDireccion("");

    setComentario("");

    setMetodoPago("EFECTIVO");

    setTipoPedido("SALON");

  };


  const handleCrearPedido = async () => {
    setGuardandoPedido(true);
    try {
      //validacion pedido vacio
      if (productosPedido.length === 0) {
        setSnackbar({ open: true, message: "Debe agregar al menos un producto", severity: "error" });
        return;
      }
      //validacion que si es salon tiene mesa
      if (tipoPedido === "SALON" &&!mesaId) {
        setSnackbar({ open: true, message: "Debe seleccionar una mesa", severity: "error" });
        return;
      }

      //si es delivery valida que tenga los datos necesarios
      if (tipoPedido === "DELIVERY") {
        if (
          !nombreCliente ||
          !telefono ||
          !direccion
        ) {
          setSnackbar({ open: true, message: "Complete todos los datos del cliente", severity: "error" });
          return;
        }
      }
      //valida que tenga todos los datos necesarios para takeaway
      if (tipoPedido === "TAKEAWAY") {
        if (
          !nombreCliente ||
          !telefono
        ) {
          alert(
            "Complete todos los datos del cliente"
          );
          return;
        }
      }  
      
      // Construcción del payload
      // ======================================
      const payload = {
        tipoPedido,
        nombreCliente,
        telefono,
        direccion,
        comentario,
        metodoPago,
        productos: productosPedido,
        total,
        mesaId:
          tipoPedido === "SALON"
            ? mesaId
            : undefined
      };
      setDialogConfirmar(false);
      // Envío del pedido
      // ======================================
      const response =await axios.post(
        `${API_URL}/api/pedidos`,
        payload,
        axiosConfig
      );
      setPedidoCreado(response.data);
      
      
      if (
        tipoPedido === "SALON" &&
        mesaId
      ) {

        await axios.patch(
          `${API_URL}/api/mesas/${mesaId}/estado`,
          {
            estado: "OCUPADA"
          },
          axiosConfig
        );
        await fetchMesas();
      }
        setGuardandoPedido(false);
        setPedidoExitoso(true);
        limpiarFormulario();
              
  } catch (error) {
    const message = axios.isAxiosError(error)
      ? error.response?.data?.message
      : undefined;
    setSnackbar({
      open: true,
      message: message || "Error al crear el pedido",
      severity: "error"
    });
  }
  };
  //obtenemos el formato correcot para mostrar el total
  const formatCurrency = (
    value: number
  ) => {

    return value.toLocaleString(
      "es-AR",
      {
        style: "currency",
        currency: "ARS"
      }
    );

  };
//   Se lo removi ya que esto va a ir a un boton que te deja ir a pedidos
//   useEffect(() => {
//   if (pedidoExitoso) {
//     const timer = setTimeout(() => {
//       navigate("/panel");
//     }, 5000);

//     return () =>
//       clearTimeout(timer);
//   }
// }, [pedidoExitoso]);

  return (
    <Box className="nuevoPedido-container">
      <Box className="nuevoPedido-header">
        <Typography variant="h4" component="span">
          NUEVO PEDIDO
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mt: 1 }}
        >
          Armá el pedido y confirmalo.
        </Typography>
      </Box>
    
      
      <Grid
        container
        spacing={3}
      >
        <Grid //grid izquierdo
          size={{
            xs: 12,
            md: 7
          }}
        >
          <Card className="resumen-card">
            <CardContent>

              <Typography
                variant="h6"
                gutterBottom
              >
                Pedido Actual
              </Typography>

              {
                Object.entries(productosPorCategoria).map(
                  ([categoria, items]) => (

                    <Box
                      key={categoria}
                      sx={{ mb: 4 }}
                    >

                      <Typography
                        variant="h6"
                        fontWeight="bold"
                      >
                        {categoria}
                      </Typography>

                      <Grid
                        container
                        spacing={2}
                        sx={{ mt: 1 }}
                      >

                        {
                          items.map(producto => (

                            <Grid
                              key={producto._id}
                              size={{
                                xs: 12,
                                sm: 6,
                                md: 4,
                                lg: 3
                              }}
                            >

                              <Card
                                sx={{
                                  cursor: "pointer"
                                }}
                                className="producto-card"
                                onClick={() =>
                                agregarProducto(producto)
                                }
                              >

                                <CardContent>
                                  <Typography
                                    variant="subtitle1"
                                    fontWeight={700}
                                  >
                                    {producto.nombre}
                                  </Typography>

                                  <Typography className="precio">
                                    {formatCurrency(producto.precio)}
                                  </Typography>
                                </CardContent>
                              </Card>

                            </Grid>

                          ))
                        }

                      </Grid>

                    </Box>

                  )
                )
              }

            </CardContent>
          </Card>
        </Grid>
        <Grid //grid derecho
          size={{
            xs: 12,
            md: 5
          }}
        >
          <Card>
            <CardContent>

              <Typography
                variant="h6"
                gutterBottom
              >
                Configuración Pedido
              </Typography>
                  <Box
                    display="flex"
                    flexDirection="column"
                    gap={2}
                  >
                      <TextField
                        select
                        label="Tipo Pedido"
                        value={tipoPedido}
                        onChange={(e) =>
                          setTipoPedido(
                            e.target.value as
                            "SALON" |
                            "DELIVERY" |
                            "TAKEAWAY"
                          )
                        }
                      >
                        <MenuItem value="SALON">
                        SALON
                        </MenuItem>

                        <MenuItem value="DELIVERY">
                          DELIVERY
                        </MenuItem>

                        <MenuItem value="TAKEAWAY">
                          TAKEAWAY
                        </MenuItem>
                      </TextField>
                      
                      { //Pedido SALON
                          tipoPedido === "SALON" && (
                            <TextField
                              select
                              label="Mesa"
                              value={mesaId}
                              onChange={(e) =>
                                setMesaId(
                                  e.target.value
                                )
                              }
                            >
                              {
                                mesasLibres.map(
                                  mesa => (
                                    <MenuItem
                                      key={mesa._id}
                                      value={mesa._id}
                                    >
                                      {mesa.numero}
                                    </MenuItem>
                                  )
                                )
                              }
                            </TextField>
                          )
                        }   
                        {//aca imprime los campos que comparten entre delivery y takeway, nombre, tel, comentario
                            tipoPedido !== "SALON" && (
                              <>
                                <TextField
                                  fullWidth
                                  label="Nombre Cliente"
                                  value={nombreCliente}
                                  onChange={(e) =>
                                    setNombreCliente(
                                      e.target.value
                                    )
                                  }
                                />

                                <TextField
                                  fullWidth
                                  label="Telefono"
                                  value={telefono}
                                  onChange={(e) =>
                                    setTelefono(
                                      e.target.value
                                    )
                                  }
                                />

                                <TextField
                                  fullWidth
                                  multiline
                                  rows={3}
                                  label="Comentario"
                                  value={comentario}
                                  onChange={(e) =>
                                    setComentario(
                                      e.target.value
                                    )
                                  }
                                />
                              </>
                            )
                          }
                          {
                            tipoPedido === "DELIVERY" && (
                              <TextField
                                fullWidth
                                label="Direccion"
                                value={direccion}
                                onChange={(e) =>
                                  setDireccion(
                                    e.target.value
                                  )
                                }
                              />

                            )
                          }
                          <TextField
                            select  
                            fullWidth
                            label="Método de Pago"
                            value={metodoPago}
                            onChange={(e) =>
                              setMetodoPago(
                                e.target.value
                              )
                            }
                          >
                            <MenuItem value="EFECTIVO">
                              EFECTIVO
                            </MenuItem>
                            <MenuItem value="TRANSFERENCIA">
                              TRANSFERENCIA
                            </MenuItem>
                            <MenuItem value="DEBITO">
                              DEBITO
                            </MenuItem>
                            <MenuItem value="CREDITO">
                              CREDITO
                            </MenuItem>
                          </TextField>

                      </Box>
            </CardContent>
          </Card>
          <Card>
            <CardContent
              sx={{
                p: 1.5,
                "&:last-child": {
                  pb: 1.5
                }
              }}
            >
              <Typography
                variant="body2"
                fontWeight="bold"
                gutterBottom
              >
                Pedido Actual
              </Typography>

              {
                productosPedido.map(item => (
                  <div key={item.producto}>
                    <strong>
                      {item.producto}
                    </strong>
                    <br />
                    ${item.precio} x {item.cantidad}
                    {" = "}
                    <Typography fontWeight={700}>
                        {formatCurrency(item.precio * item.cantidad)}
                    </Typography>
                    <IconButton
                      color="success"
                      onClick={() =>
                        agregarProducto({
                          nombre: item.producto,
                          precio: item.precio
                        } as Producto)
                      }
                    >
                      <AddIcon />
                    </IconButton>
                    
                    <IconButton
                      color="warning"
                      onClick={() =>
                        disminuirCantidad(
                          item.producto
                        )
                      }
                    >
                      <RemoveIcon  />

                    </IconButton><IconButton
                      color="error"
                        onClick={() =>
                        eliminarProducto(
                          item.producto
                        )
                      }
                    >
                      <DeleteIcon   />
                    </IconButton>
                  </div>
                  
                ))
              }

              <Divider
                sx={{ my: 2 }}
              />

              <Typography
                variant="h5"
                fontWeight="bold"
              >
                Total:
                {formatCurrency(total)}
              </Typography>

              
              <Button
                  variant="contained"
                  color="success"
                  onClick={abrirConfirmacion}
              >
                  Confirmar pedido
              </Button>

            </CardContent>

          </Card>
        </Grid>
      </Grid>
           


      
      <Dialog //DIALOGO DE CONFIRMACION
          open={dialogConfirmar}
          onClose={() => setDialogConfirmar(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle
            sx={{
              bgcolor: "success.main",
              color: "success.contrastText",
              py: 2,
            }}
          >
            <Stack
                direction="row"
                spacing={2}
                alignItems="center"
            >
                <Avatar
                    sx={{
                        bgcolor: "success.main",
                        width: 48,
                        height: 48,
                    }}
                >
                </Avatar>
                <Box>
                    <Typography
                        variant="h6"
                        fontWeight={700}
                    >
                        Confirmar pedido
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                    >
                        Revisá la información antes de enviarla a cocina.
                    </Typography>
                </Box>
            </Stack>
          </DialogTitle>

          <DialogContent dividers>

            {/* Información general */}

            <Card
              elevation={0}
              sx={{
                mb: 2,
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <CardContent>

                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  sx={{ mb: 2 }}
                >
                  📋 Información del pedido
                </Typography>

                <Grid container spacing={2}>

                  {tipoPedido === "SALON" && (
                    <>
                      <Grid size={{xs:6}}>
                        <Typography color="text.secondary">
                          Mesa
                        </Typography>

                        <Typography fontWeight={600}>
                          {mesaSeleccionada?.nombre}
                        </Typography>
                      </Grid>
                    </>
                  )}

                  {nombreCliente && (
                    <Grid size={{xs:6}}>
                      <Typography color="text.secondary">
                        Cliente
                      </Typography>

                      <Typography fontWeight={600}>
                        {nombreCliente}
                      </Typography>
                    </Grid>
                  )}

                  <Grid size={{xs:6}}>
                    <Typography color="text.secondary">
                      Tipo
                    </Typography>

                    <Chip
                      label={tipoPedido}
                      color="primary"
                      size="small"
                    />
                  </Grid>

                  <Grid size={{xs:6}}>
                    <Typography color="text.secondary">
                      Pago
                    </Typography>

                    <Chip
                      label={metodoPago}
                      color="success"
                      size="small"
                    />
                  </Grid>

                </Grid>

              </CardContent>
            </Card>

            {/* Productos */}

            <Card
              elevation={0}
              sx={{
                mb: 2,
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <CardContent>

                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  sx={{ mb: 2 }}
                >
                  🛒 Productos
                </Typography>

                <Stack spacing={1.5}>

                  {productosPedido.map((item) => (

                    <Box key={item.producto}>

                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >

                        <Box>

                          <Typography fontWeight={600}>
                            {item.producto}
                          </Typography>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            {item.cantidad} × {formatCurrency(item.precio)}
                          </Typography>

                        </Box>

                        <Typography
                          fontWeight={700}
                        >
                          {formatCurrency(item.precio * item.cantidad)}
                        </Typography>

                      </Stack>

                      <Divider />

                    </Box>

                  ))}

                </Stack>

              </CardContent>
            </Card>

            {/* Total */}

            <Card
              sx={{
                bgcolor: "success.light",
                color: "success.contrastText",
                borderRadius: 2,
                mb: comentario ? 2 : 0,
              }}
            >
              <CardContent>

                <Typography
                  align="center"
                  variant="overline"
                >
                  TOTAL
                </Typography>

                <Typography
                  align="center"
                  variant="h4"
                  fontWeight={700}
                >
                  {formatCurrency(total)}
                </Typography>

              </CardContent>
            </Card>

            {/* Observaciones */}

            {comentario && (

              <Card
                elevation={0}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >

                <CardContent>

                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    sx={{ mb: 1 }}
                  >
                    📝 Observaciones
                  </Typography>

                  <Typography>
                    {comentario}
                  </Typography>

                </CardContent>

              </Card>

            )}

          </DialogContent>

          <DialogActions
            sx={{
              position: "sticky",
              bottom: 0,
              bgcolor: "background.paper",
              borderTop: 1,
              borderColor: "divider",
              px: 3,
              py: 2,
            }}
          >
            <Button
              onClick={() => setDialogConfirmar(false)}
            >
              ← Seguir editando
            </Button>

            <Button
              variant="contained"
              color="success"
              onClick={handleCrearPedido}
              disabled={guardandoPedido}
              size="large"
            >
              {guardandoPedido
                ? "Guardando..."
                : "✔ Confirmar pedido"}
            </Button>

          </DialogActions>
      </Dialog>        

      <Dialog
        open={pedidoExitoso}
        onClose={() => setPedidoExitoso(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogContent sx={{ py: 4 }}>

          <Stack
            spacing={3}
            alignItems="center"
          >

            {/* Icono */}

            <Avatar
              sx={{
                bgcolor: "success.main",
                width: 80,
                height: 80,
              }}
            >
              {/* <CheckCircleOutlineIcon
                sx={{ fontSize: 45 }}
              /> */}
            </Avatar>

            {/* Título */}

            <Box textAlign="center">

              <Typography
                variant="h5"
                fontWeight={700}
              >
                ¡Pedido creado!
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 1 }}
              >
                El pedido fue registrado correctamente.
              </Typography>

            </Box>

            {/* Número de pedido */}

            <Typography
              variant="h3"
              color="primary"
              fontWeight={800}
            >
              #{pedidoCreado?.numeroPedido}
            </Typography>

            {/* Resumen */}

            <Card
              elevation={0}
              sx={{
                width: "100%",
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <CardContent>

                <Stack spacing={2}>

                  {tipoPedido === "SALON" && (
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                    >
                      <Typography color="text.secondary">
                        Mesa
                      </Typography>

                      <Typography fontWeight={600}>
                        {pedidoCreado?.mesa}
                      </Typography>
                    </Stack>
                  )}

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                  >
                    <Typography color="text.secondary">
                      Tipo
                    </Typography>

                    <Chip
                      size="small"
                      label={pedidoCreado?.tipoPedido}
                      color="primary"
                    />
                  </Stack>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                  >
                    <Typography color="text.secondary">
                      Total
                    </Typography>

                    <Typography
                      fontWeight={700}
                      color="success.main"
                    >
                      {formatCurrency(
                       pedidoCreado?.total ?? 0
                      )}
                    </Typography>

                  </Stack>

                </Stack>

              </CardContent>
            </Card>

            {/* Acciones */}

            <Stack
              spacing={2}
              width="100%"
            >

              <Button
                variant="contained"
                size="large"
                //startIcon={<PrintIcon />}
                fullWidth
                onClick={() => {
                  // imprimirTicket();
                }}
              >
                Imprimir comanda
              </Button>

              <Button
                variant="outlined"
                size="large"
                //startIcon={<AddCircleOutlineIcon />}
                fullWidth
                onClick={() => {
                  setPedidoExitoso(false);
                }}
              >
                Nuevo pedido
              </Button>
              <Button
                variant="contained"
                size="large"
                //startIcon={<PrintIcon />}
                fullWidth
                onClick={() => {
                   navigate("/panel/dashboard");
                }}
              >
                Ver pedidos
              </Button>
            </Stack>

          </Stack>

        </DialogContent>
      </Dialog>          

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};
  

export default NuevoPedido;
