# RELEVO — PUMPKIN-app

- **Último turno:** claude-code
- **Fecha:** 2026-11-14
- **Rama:** main (GitHub: `AdamPark7014/Casadelterror-app`, antes `PUMPKIN-app`; público)

## 25-11-2026 (claude-code): credenciales del seed fuera del repo público

- `seed-pumpkin.ts` (contraseña y PIN fijos) y el compilado `seed.js` dejan de versionarse; siguen en disco y hay copia en
  `C:/dev/secrets/seeders/casadelterror`. El seed demo toma la contraseña de `SEED_PASSWORD` y se detiene si falta; la CI
  genera una nueva en cada corrida.
- Sin probar en ejecución: esta copia no tiene `node_modules`; se revisó la sintaxis. El evento ya está fuera de producción.

## Hecho
- PUMPKIN Accesos (control de acceso de los 250 pases QR) se mudó a `accesos/`. Antes vivía en `EVENTOS-app/pumpkin`,
  que se retiró junto con EVENTO-ELISA (`da70f13`).
- **14-11-2026, fuera de producción:** Adam dijo «pumpkin ya pasó, bájalo del server pero deja su db y todo interna
  en local».
  - En el droplet `147.182.128.128` no queda nada de Pumpkin, y el nginx compartido volvió a su compose base.
  - Datos en local, fuera de git: `.respaldos-prod/final-2026-11-14/` (dump, SQL, carpeta del servidor con `.env`,
    conteos 7/250/0).
  - La base está restaurada en Docker local: `pumpkin_accesos_db`, detenido, con el volumen `pumpkin-accesos_pumpkin_db`.
    Se comprobó que los conteos coinciden con los del servidor.
  - `accesos/.env` es el del servidor y está ignorado por git.
- `accesos/` usa npm propio y no entra al espacio pnpm (`apps/*`, `packages/*`). Pruebas: `cd accesos/api && npm test`
  (2/2 en verde el 14-11).

## Siguiente
Nada pendiente de `accesos/`. El monorepo raíz (Pumpkin Zone) sigue igual y es independiente.

## No tocar
`accesos/.env`, `.respaldos-prod/` y `C:\dev\secrets\pumpkin-accesos\`. Este repo es público: nada de claves en git.
