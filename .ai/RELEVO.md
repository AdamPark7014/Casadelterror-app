# RELEVO — PUMPKIN-app

- **Último turno:** claude-code
- **Fecha:** 2026-11-14
- **Rama:** main

## Hecho
- PUMPKIN Accesos (control de acceso de los 250 pases QR, https://panel.experiencebt.com.mx/pumpkin/)
  se mudó a `accesos/`. Antes vivía en `EVENTOS-app/pumpkin`, que Adam mandó retirar junto con
  EVENTO-ELISA («que su código corra de pumpkin en su repo separado, mata totalmente evento elisa»).
- `accesos/` usa npm propio y no entra al espacio pnpm (`apps/*`, `packages/*`). Pruebas: `cd accesos/api && npm test`.
- En el droplet `147.182.128.128` corre desde `/opt/pumpkin-accesos`. El nginx compartido la alcanza
  por la red `pumpkin-net` (ya no por `eventos-demo-net`). Bloque del nginx en
  `accesos/deploy/zz-panel.conf` y capa del compose del nginx en `accesos/deploy/nginx-proxy.override.yml`.
- Respaldo nocturno de su base: `C:\dev\apps\PUMPKIN-app\.respaldos-prod\` (fuera de git).

## Siguiente
El monorepo raíz (Pumpkin Zone, Hetzner) sigue igual; `accesos/` es independiente de él.

## No tocar
`.env` del servidor y `C:\dev\secrets\pumpkin-accesos\`. Este repo es público: nada de claves en git.
