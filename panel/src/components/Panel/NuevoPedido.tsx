import { useEffect, useState } from "react";
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
  MenuItem
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';

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
  estado: string;
}

interface ProductoPedido {
  producto: string;
  cantidad: number;
  precio: number;
}

const API_URL = import.meta.env.VITE_API_URL;
const NuevoPedido = () => {
  useEffect(() => {
  setLoading(true);
  Promise.all([fetchProductos(),fetchMesas()]).finally(() => {
    setLoading(false);
  });
}, []);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(false);
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
  const mesasLibres =mesas.filter(
    mesa =>
      mesa.estado === "LIBRE"
  );
  const [productosPedido, setProductosPedido] =useState<ProductoPedido[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({
    open: false,
    message: "",
    severity: "info",
  });

  const token = localStorage.getItem("token") || "";

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  //fetch PRODUCTOS
  const fetchProductos = async () => {
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
};

  //fetch MESAS (todasss)
  const fetchMesas = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/mesas`,axiosConfig);
    setMesas(res.data);
  } catch (error) {
    console.error("Error obteniendo mesas", error);

  }
};

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
                cantidad:
                  p.cantidad + 1
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
            cantidad:
              item.cantidad - 1
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

  const handleCrearPedido = async () => {
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
      
      const response =await axios.post(
        `${API_URL}/api/pedidos`,
        payload,
        axiosConfig
      );

      
      setSnackbar({ open: true, message: "Pedido creado correctamente", severity: "success" });
      setProductosPedido([]);
      setMesaId("");
      setNombreCliente("");
      setTelefono("");
      setDireccion("");
      setComentario("");
      setMetodoPago("EFECTIVO");
      setTipoPedido("SALON");
  } catch (error: any) {
    console.error(error);
    alert(
      error?.response?.data?.message ||
      "Error al crear el pedido"
    );
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
  return (
    <Box sx={{ p:3 }} display="flex" flexDirection="column" gap={2}>
      <Typography
        variant="h4"
        fontWeight="bold"
        mb={3}
      >
        Nuevo Pedido
      </Typography>
    
      <Typography>
        Productos cargados: {productos.length}
      </Typography>

      <Typography>
        Mesas cargadas: {mesas.length}
      </Typography>
  
      
      <Grid
        container
        spacing={3}
      >


        <Grid
          size={{
            xs: 12,
            md: 7
          }}
        >
          <Card>
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
                                onClick={() =>
                                  agregarProducto(producto)
                                }
                              >

                                <CardContent>

                                  <Typography
                                    variant="subtitle1"
                                    fontWeight="bold"
                                  >
                                    {producto.nombre}
                                  </Typography>

                                  <Typography
                                    color="success.main"
                                  >
                                    {
                                      formatCurrency(
                                        producto.precio
                                      )
                                    }
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
        <Grid
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
                    ${item.precio * item.cantidad}
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
                fullWidth
                variant="contained"
                sx={{ mt: 2 }}
                onClick={handleCrearPedido}
              >
                Guardar Pedido
              </Button>

            </CardContent>

          </Card>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};
  

export default NuevoPedido;