/**
 * Modo demostración: accesos directos de prueba en el login (entrar como
 * usuario o admin sin credenciales) para ver las maquetas.
 * Solo aplica SIN Supabase configurado: con Supabase, la app exige sesión real
 * y estos accesos no tendrían efecto. Activo en desarrollo o con
 * NEXT_PUBLIC_MODO_DEMO=true.
 */
export const MODO_DEMO =
  !process.env.NEXT_PUBLIC_SUPABASE_URL &&
  (process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_MODO_DEMO === "true");
