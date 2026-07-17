export const notFound = (req, res) => {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
};

export const errorHandler = (error, req, res, next) => {
  console.error(error);

  if (error.name === 'CastError') {
    return res.status(400).json({ message: 'Identificador inv\u00e1lido' });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({ message: error.message });
  }

  if (error.code === 11000) {
    return res.status(409).json({ message: 'Ya existe un registro con esos datos' });
  }

  const status = error.statusCode || error.status || 500;
  const message = status >= 500 ? 'Error interno del servidor' : error.message;

  return res.status(status).json({ message });
};
