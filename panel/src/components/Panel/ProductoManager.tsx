import { useEffect, useState } from "react";
import axios from "axios";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import CircularProgress from "@mui/material/CircularProgress";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

import "./ProductoManager.css";
import { Typography } from "@mui/material";

interface Producto {
  _id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  disponible: boolean;
  image: string;
}

const API_URL = import.meta.env.VITE_API_URL;

const ProductoManager = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{ name?: string; category?: string }>({});
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" | "info" }>({
    open: false,
    message: "",
    severity: "info",
  });
  const [formData, setFormData] = useState<Omit<Producto, "_id">>({
    name: "",
    category: "",
    description: "",
    price: undefined as any,
    disponible: true,
    image: "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [stockGeneralActivo, setStockGeneralActivo] = useState<boolean>(false);

  const token = localStorage.getItem("token") || "";

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchProductos = async () => {
    setLoading(true);
    setError(null); 
    try {
      const res = await axios.get(`${API_URL}/api/productos`, axiosConfig);
      const data = Array.isArray(res.data) ? res.data : res.data.productos;
      setProductos(Array.isArray(data) ? data : []);
    } catch {
      setError("Error al obtener productos");
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStockGeneral = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/productos/configuracion/stock-general`, axiosConfig);
      setStockGeneralActivo(res.data.stockGeneralActivo);
    } catch {
      setSnackbar({ open: true, message: "Error al obtener el stock general", severity: "error" });
    }
  };

  const handleToggleStockGeneral = async () => {
    try {
      const nuevoEstado = !stockGeneralActivo;
      await axios.patch(`${API_URL}/api/productos/configuracion/stock-general`, { stockGeneralActivo: nuevoEstado }, axiosConfig);
      setStockGeneralActivo(nuevoEstado);
      setSnackbar({ open: true, message: `Stock general ${nuevoEstado ? "activado" : "desactivado"}`, severity: "success" });
    } catch {
      setSnackbar({ open: true, message: "Error al actualizar el stock general", severity: "error" });
    }
  };

  useEffect(() => {
    fetchProductos();
    fetchStockGeneral();
  }, []);

  const handleOpenDialog = (producto?: Producto) => {
  setFormErrors({});
  if (producto) {
    setEditingProduct(producto);
    setFormData({ ...producto });
    setImagePreview(producto.image);
  } else {
    setEditingProduct(null);
    setFormData({
      name: "",
      category: "",
      description: "",
      price: undefined as any,
      disponible: true,
      image: "",
    });
    setImagePreview(null);
  }
  setOpenDialog(true);
};

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setFormErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "price" ? Number(value) : value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    const errors: { name?: string; category?: string } = {};

    if (!formData.name.trim()) errors.name = "El nombre es obligatorio";
    if (!formData.category.trim()) errors.category = "La categoría es obligatoria";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      if (editingProduct) {
        await axios.put(`${API_URL}/api/productos/${editingProduct._id}`, formData, axiosConfig);
        setSnackbar({ open: true, message: "Producto actualizado correctamente", severity: "success" });
      } else {
        await axios.post(`${API_URL}/api/productos`, formData, axiosConfig);
        setSnackbar({ open: true, message: "Producto creado correctamente", severity: "success" });
      }
      handleCloseDialog();
      fetchProductos();
    } catch {
      setSnackbar({ open: true, message: "Error al guardar el producto", severity: "error" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      await axios.delete(`${API_URL}/api/productos/${deleteDialog.id}`, axiosConfig);
      setSnackbar({ open: true, message: "Producto eliminado correctamente", severity: "success" });
      fetchProductos();
    } catch {
      setSnackbar({ open: true, message: "Error al eliminar el producto", severity: "error" });
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  return (
    <div className="producto-manager">
      <div className="header">
           <Typography variant="h4" mb={2}>
                <AddCircleIcon/>GESTIÓN DEL MENÚ
            </Typography>
        <Button startIcon={<AddCircleIcon />} variant="contained" color="primary" onClick={() => handleOpenDialog()}>
          Nuevo Producto
        </Button>
      </div>

      <div className="stock-general">
        <label>
          <input type="checkbox" checked={stockGeneralActivo} onChange={handleToggleStockGeneral} /> Hay stock general
        </label>
      </div>

      {loading ? (
        <div className="loading"><CircularProgress /></div>
      ) : error ? (
        <p className="error">{error}</p>
      ) : productos.length > 0 ? (
        <div className="producto-lista">
          {productos.map(producto => (
            <div className="producto-card" key={producto._id}>
              <img src={producto.image} alt={producto.name} />
              <h2>{producto.name}</h2>
              <p>{producto.description}</p>
              <h3>
                  {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0 }).format(producto.price)}
              </h3>
              <span className={`estado-producto ${producto.disponible ? "disponible" : "no-disponible"}`}>
                {producto.disponible ? "Disponible" : "No disponible"}
              </span>
              <div className="acciones">
                <IconButton onClick={() => handleOpenDialog(producto)}><EditIcon /></IconButton>
                <IconButton onClick={() => setDeleteDialog({ open: true, id: producto._id })}><DeleteIcon color="error" /></IconButton>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No hay productos para mostrar.</p>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
        <DialogContent className="form-dialog">
          <TextField
            label="Nombre"
            name="name"
            fullWidth
            value={formData.name}
            onChange={handleChange}
            placeholder="Ej: Sushi Salmón"
            error={!!formErrors.name}
            helperText={formErrors.name}
          />
          <TextField
          label="Categoría"
          name="category"
          fullWidth
          value={formData.category}
          onChange={handleChange}
          placeholder="Ej: Rolls"
          error={!!formErrors.category}
          helperText={formErrors.category}
        />
          <TextField label="Descripción" name="description" fullWidth multiline value={formData.description} onChange={handleChange} placeholder="Ej: Con queso y palta" />
          <TextField label="Precio (ARS)" name="price" type="number" fullWidth value={formData.price ?? ""} onChange={handleChange} placeholder="Ej: 2500"  />
          <FormControlLabel control={<Checkbox checked={formData.disponible} onChange={(e) => setFormData(prev => ({ ...prev, disponible: e.target.checked }))} />} label="Producto disponible" />
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {imagePreview && <img src={imagePreview} className="preview" alt="preview" />}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">{editingProduct ? "Actualizar" : "Crear"}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null })}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>¿Estás seguro que querés eliminar este producto?</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>Cancelar</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snackbar.severity} variant="filled" onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
};

export default ProductoManager;