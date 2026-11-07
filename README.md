# Nexxa Expo by Impulso

Sitio oficial: **https://nexxaexpo2026.online**

Página del evento **Nexxa Expo by Impulso**: 4 ponencias para emprender en digital.

- **Fecha:** viernes 20 de noviembre de 2026, 2:30 a 8:15 p. m.
- **Lugar:** Auditorio principal, Institución Universitaria Salazar y Herrera. Carrera 70 # 52-49 (Bulevar Libertadores de América # 52-49), barrio Los Colores, Medellín.
- **Transmisión:** en vivo por Facebook, Instagram y YouTube.

## Qué incluye la página
- Ponencias: Dropshipping (Master Shop), Meta Ads (TAG Digital), Master Shop 360 y JadeMind (IA).
- Registro al auditorio con 200 cupos y lista de espera.
- Registro aparte al laboratorio virtual de Meta Ads de TAG Digital.
- Agenda, aliados, video promocional, vuelo del planeta al campus y transmisión en vivo.

## Archivos
| Archivo | Para qué sirve |
|---|---|
| `index.html` | Portada cinematográfica: apertura, viaje al campus con los aliados en órbita, ponencias, ponentes, video, agenda, sorteos y créditos. |
| `registro.html` | Página completa con registro, laboratorio de Meta Ads, tarjeta con QR, verificación de ingreso y demás funciones. |
| `test.html` | Test "¿Qué tipo de emprendedor eres?". |
| `apps-script-registros.gs` | Código de Apps Script de la hoja de registros. |
| `CNAME` | Conecta el dominio `nexxaexpo2026.online` con GitHub Pages. |
| `*.png`, `*.jpg`, `promo.mp4` | Logos, fotos del campus, video promocional y su portada. |

## Registros (Google Sheets)
Los formularios guardan cada registro en la hoja **Nexxa Expo 2026 · Registros** (pestañas *Ponencias* y *Laboratorio*) por medio de una aplicación web de Apps Script.

- La URL de la aplicación web está en `registro.html`, en `const SHEETS_URL=`.
- Si cambias el código de Apps Script, publícalo con **Implementar → Gestionar implementaciones → ✏️ → Nueva versión** para conservar la misma URL.
- El cupo del auditorio se cambia en `const CUPO = 200;` del código de Apps Script.

## Enlaces de la transmisión
En `registro.html`, busca `const STREAM=` y pega los enlaces de Facebook, Instagram y YouTube.

## Publicación
GitHub Pages publica la rama `main` en el dominio. Cada cambio que se sube aquí queda en línea en uno o dos minutos.

## Enlaces antiguos
`index.html` redirige a `registro.html` los enlaces con `#registro`, `#laboratorio`, `#evento`, `#ponencias`, `#agenda` o `#aliados` y los QR de las tarjetas (`?verificar=`).
