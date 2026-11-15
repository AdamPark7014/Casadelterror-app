# PUMPKIN Accesos

Control de acceso de los 250 pases QR genéricos de PUMPKIN (`QR-001` … `QR-250`): **entrada,
salida y reingreso**, estado dentro/fuera por jornada, pausa de confirmación, cámara, lector de PDA
y cola sin red. Base de datos propia.

Vive en `PUMPKIN-app/accesos` desde el 14-11-2026. Antes estaba en `EVENTOS-app/pumpkin`
(commits `ffa5522` y `9e2a9bd`), que se retiró junto con FICTI.

> **Fuera de producción desde el 14-11-2026** (Adam: «pumpkin ya pasó, bájalo del server pero deja su db y
> todo interna en local»). En el droplet ya no queda nada: ni contenedores, ni volumen, ni `/opt/pumpkin-accesos`.
> Lo que queda en local, fuera de git:
> - `C:\dev\apps\PUMPKIN-app\.respaldos-prod\final-2026-11-14\` con `pumpkin.dump` (`pg_restore`), `pumpkin.sql.gz`,
>   `servidor-opt-pumpkin-accesos.tar.gz` (la carpeta del servidor con su `.env` y la capa del nginx) y los conteos
>   (7 usuarios, 250 pases, 0 escaneos).
> - La base restaurada en Docker local: el contenedor `pumpkin_accesos_db` (detenido) y el volumen
>   `pumpkin-accesos_pumpkin_db`. Para levantarla:
>   `docker compose -f accesos/docker-compose.pumpkin.yml --env-file accesos/.env up -d db`.
> - `accesos/.env` es el `.env` del servidor (ignorado por git).
>
> Lo de abajo describe cómo corría. Para volver a publicarlo hay que recrear la red `pumpkin-net`, subir la carpeta,
> montar `deploy/zz-panel.conf` en el nginx con `deploy/nginx-proxy.override.yml` y volver a crear el registro DNS
> `panel`.

- **URL:** https://panel.experiencebt.com.mx (todo el dominio es de PUMPKIN: la raíz, `/login` y
  `/accesos*` redirigen a `/pumpkin/`). Bloque del nginx: `deploy/zz-panel.conf`.
- **Servidor:** droplet `147.182.128.128`, `/opt/pumpkin-accesos`, contenedores
  `pumpkin_accesos_web` (API Hono + SPA React, puerto 3090) y `pumpkin_accesos_db` (Postgres 16).
  El nginx compartido (`nginx_registro_proxy`) la alcanza por la red `pumpkin-net`.
  Capa del nginx: `deploy/nginx-proxy.override.yml`.
- **Respaldo:** cada noche a `C:\dev\apps\PUMPKIN-app\.respaldos-prod\` (fuera de git).
- **Credenciales:** `C:\dev\secrets\pumpkin-accesos\` (PDF, Excel, TXT). Nunca en git: este repo es público.

## Perfiles

| Rol | Cuentas | Puede |
|---|---|---|
| `admin` | `admin` | Resumen en vivo, pases (titular, bloqueo), historial + CSV y escáner |
| `puerta` | `puerta1`–`puerta6` | Solo el escáner (pantalla enfocada, sin menú) |

Las cuentas salen de `PUMPKIN_USUARIOS` en el `.env` del servidor (`usuario:clave:rol:Nombre;…`);
quien no esté queda desactivado. Cada PDA tiene además un **enlace de acceso directo**
(`/pumpkin/directo#usuario.token`, token HMAC derivado de la clave: cambiar la clave lo anula).
`docker exec pumpkin_accesos_web node dist/enlaces.js` los lista (directo a la carpeta de secretos).

## Reglas de puerta (`api/src/scan.ts`)

- ENTRADA: primera de la jornada → `OK_ENTRY`; tras una salida → `OK_REENTRY`; ya dentro → `ALREADY_INSIDE`.
- SALIDA: dentro → `OK_EXIT`; si no → `NOT_INSIDE`.
- Bloqueado → `BLACKLISTED`; fuera del lote → `NOT_FOUND`; basura → `INVALID_QR`; mismo QR+modo en
  < 1.2 s → `COOLDOWN`. Con `PUMPKIN_AFORO` > 0, `ZONE_FULL`.
- La **jornada** cambia a las `PUMPKIN_CORTE_HORA` (6:00 CDMX): una noche cuenta como un día.
- El pase se bloquea con `SELECT … FOR UPDATE`: dos PDA con el mismo pase se validan en orden.
- El lector acepta `QR-045`, `QR'045` (teclado español), `045`, `45` o una URL que lo contenga.

## Desarrollo y despliegue

```
cd accesos/api && npm ci && npm test && npm run build
cd accesos/ui  && npm ci && npm run build
```

`accesos/` no es parte del espacio pnpm del monorepo (`apps/*`, `packages/*`): usa npm propio.

Despliegue: subir `accesos/` (sin `node_modules`, `dist` ni `.env`) a `/opt/pumpkin-accesos`
(el `.env` del servidor se queda) y
`docker compose -f docker-compose.pumpkin.yml --env-file .env up -d --build`.

`herramientas/generar_qrs.py` genera el PDF de impresión con los 250 QR reales (5 hojas A4 de 5 × 10).
La plantilla que mandó el cliente traía el mismo dibujo de QR en las 250 celdas y no es legible.
