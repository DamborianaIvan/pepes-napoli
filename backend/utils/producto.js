export const productoRequiereArchivo = ({ tienePedidos, tieneReceta }) =>
  Boolean(tienePedidos || tieneReceta);
