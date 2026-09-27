/**
 * Rutas de recuperación del embudo Pumpkin (evento único).
 * Nunca mandar al usuario a `/events` (alias de home / marketplace).
 */
export const TICKETS_HREF = '/boletos';

export function eventTicketsHref(_slug?: string | null): string {
  return TICKETS_HREF;
}
