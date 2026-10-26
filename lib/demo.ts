/**
 * Modo demostración: muestra accesos directos de prueba (entrar como usuario o
 * admin sin credenciales) mientras las vistas son maquetas. Activo en
 * desarrollo, o en un despliegue con NEXT_PUBLIC_MODO_DEMO=true.
 * ⚠️ Quitar (o poner en false) cuando se conecte Supabase Auth.
 */
export const MODO_DEMO =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_MODO_DEMO === "true";
