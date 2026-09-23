import AuditLog from '../models/AuditLog.js';

const limpiarUndefined = (valor) => {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) return valor;

  return Object.fromEntries(
    Object.entries(valor)
      .filter(([, contenido]) => contenido !== undefined)
      .map(([clave, contenido]) => [clave, contenido])
  );
};

export const registrarAuditoria = async ({
  accion,
  entidad,
  entidadId = null,
  usuario = null,
  antes = null,
  despues = null,
  metadata = null,
  fecha = new Date()
}) => {
  try {
    return await AuditLog.create({
      accion,
      entidad,
      entidadId,
      usuarioId: usuario?.id ?? null,
      usuarioNombreSnapshot: usuario?.nombre ?? null,
      antes: limpiarUndefined(antes),
      despues: limpiarUndefined(despues),
      metadata: limpiarUndefined(metadata),
      fecha
    });
  } catch (error) {
    console.error('No se pudo registrar auditoría:', error);
    return null;
  }
};
