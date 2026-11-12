# AI Support Engine

Prototipo funcional para clasificar solicitudes de soporte con dos enfoques: reglas tradicionales y un modelo generativo real servido por Ollama. Incluye API HTTP, interfaz web, pruebas independientes y 12 casos comparativos con referencias definidas antes de la evaluación.

## Requisitos

- Node.js 22.9 o superior (verifique con `node --version`).
- Ollama instalado y un modelo descargado para el modo generativo. El tradicional funciona sin Ollama y sin internet.
- No hay dependencias npm externas, claves ni servicios de pago necesarios.

## Inicio en Windows

Abra PowerShell en la carpeta `ai-support-engine`:

```powershell
Copy-Item .env.example .env
ollama pull qwen2.5:1.5b
npm start
```

Abra <http://127.0.0.1:3000>. Si Ollama no está iniciado, abra otra terminal con `ollama serve` o inicie la aplicación de Ollama. Si el comando `ollama` no existe, instálelo desde <https://ollama.com/download/windows> y reabra la terminal. La descarga del modelo requiere internet y espacio de almacenamiento; su velocidad depende del equipo. Puede seleccionar otro modelo instalado mediante `OLLAMA_MODEL` en `.env`.

Si PowerShell bloquea `npm.ps1`, utilice `npm.cmd start`, `npm.cmd test` y `npm.cmd run compare`. No es necesario cambiar la política de ejecución del equipo. Detenga el servidor con Ctrl+C.

Puede iniciar solamente el prototipo con `npm start` antes de instalar Ollama. El modo tradicional estará disponible y el generativo mostrará un error explícito de proveedor, sin simular respuestas.

## Uso de la API

`POST /api/analyze` con `Content-Type: application/json`:

```json
{ "message": "No puedo iniciar sesión", "mode": "traditional" }
```

```json
{
  "category": "ACCESS",
  "priority": "MEDIUM",
  "response": "Verifique sus credenciales y utilice la recuperación de contraseña si es necesario. Si persiste el problema, contacte a soporte sin compartir contraseñas ni códigos de acceso.",
  "requiresHumanReview": false,
  "mode": "traditional"
}
```

Para consultar el modelo real, envíe `mode: "generative"`. Ambos motores exportan `analyze(message)`; el tradicional es síncrono y el generativo devuelve una promesa. Las únicas categorías son ACCESS, BUG, FEATURE y SECURITY; prioridades LOW, MEDIUM, HIGH y CRITICAL. `GET /api/health` comprueba el servidor, no la disponibilidad del modelo.

Ejemplo en PowerShell:

```powershell
$ticket = @{ message = 'Detecté una vulnerabilidad'; mode = 'generative' } | ConvertTo-Json
Invoke-RestMethod -Uri http://127.0.0.1:3000/api/analyze -Method Post -ContentType 'application/json; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($ticket))
```

La entrada exige message con texto de hasta 5000 caracteres y mode válido. No admite campos extra. El límite del cuerpo es 32 KiB. Errores: 400 entrada/JSON inválido, 413 tamaño excesivo, 415 contenido no JSON, 502 respuesta del modelo inválida, 503 proveedor no disponible/modelo no instalado, 504 tiempo agotado. Los errores tienen `{ "error": { "code": "...", "message": "..." } }` y no contienen mensajes privados del proveedor.

## Pruebas y comparación real

```powershell
npm test
npm run compare
```

Las pruebas unitarias y de API no requieren Ollama. Los dobles de proveedor existen únicamente en pruebas; no son evidencia de IA real. `npm run compare` llama realmente a ambos motores con los 12 mensajes de `tests/cases.json`, y guarda resultados detallados, tabla CSV y conclusión de menos de 150 palabras en `results/`. Si Ollama falta, registra fallos explícitos, devuelve código 1 y no declara un ganador. Reejecute la comparación tras iniciar Ollama para obtener la evidencia completa.

La exactitud exige contrato válido y coincidencia de categoría, prioridad y revisión humana. El denominador son los 12 casos por motor, incluyendo fallos. Si no hay respuestas del proveedor, su exactitud es `null`, no evaluable. La muestra incluye ambigüedad y dos intentos de manipulación; no representa una medición general de calidad en producción.

## Organización del equipo

- Dana: `src/traditional.js` y `tests/traditional.test.cjs` (conservados).
- Motor generativo: `src/generative.js`; prompt, esquema JSON y consulta real a `/api/chat` de Ollama.
- API e integración: `src/server.js`, `src/contract.js`, `public/`, `scripts/compare.js` y pruebas adicionales.

## Decisiones y límites

El motor tradicional normaliza acentos, espacios y mayúsculas. Usa precedencia SECURITY > ACCESS > BUG > FEATURE. ACCESS/BUG suelen ser MEDIUM, mejoras LOW, bloqueos y seguridad HIGH, pérdidas/fugas de datos y caídas generales CRITICAL. Sin contexto devuelve BUG/MEDIUM provisional y revisión humana. No interpreta toda negación o ironía.

El generativo separa instrucciones del sistema y ticket no confiable, solicita un esquema JSON y valida los cinco campos en la respuesta. Una defensa de reglas evita que señales conocidas de seguridad se desescalen: SECURITY siempre requiere revisión y mínimo HIGH. Esta defensa no sustituye la generación: si Ollama falla, la solicitud falla. La respuesta profesional procede del modelo, cuya calidad puede variar; las reglas no detectan todos los incidentes ni garantizan resistencia absoluta a manipulación.

No se guardan tickets ni se registran sus contenidos en el servidor. La interfaz usa texto seguro para mostrar respuestas, no HTML del modelo. `.env` está excluido del repositorio. Por defecto todo funciona en localhost; no exponga el prototipo a internet sin autenticación, límites de uso y una revisión adicional. No envíe secretos al modelo. Si configura un proveedor remoto, el ticket saldrá del equipo.

Configuración opcional: HOST, PORT, OLLAMA_URL, OLLAMA_MODEL y OLLAMA_TIMEOUT_MS en `.env`. La conexión predeterminada es local y el tiempo máximo de generación es 120 segundos.

Documentación de la integración: [salidas estructuradas de Ollama](https://ollama.com/blog/structured-outputs).
