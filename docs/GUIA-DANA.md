# Dana — Motor tradicional de AI Support Engine

Archivos del módulo: `src/traditional.js` y `tests/traditional.test.cjs` en la raíz del proyecto. No requiere paquetes, claves, red ni los módulos de Abraham y Emma. Requisito: Node.js 18 o superior.

## Ejecutar

Desde la raíz del proyecto:

```sh
node --test tests/traditional.test.cjs
node -e "console.log(require('./src/traditional.js').analyze('No puedo iniciar sesión'))"
```

## Integración

```js
const { analyze } = require('./src/traditional.js');
const result = analyze('No puedo iniciar sesión');
// { category: 'ACCESS', priority: 'MEDIUM', response: '...',
//   requiresHumanReview: false, mode: 'traditional' }
```

También admite `import { analyze } from './src/traditional.js'` desde un módulo ES. El archivo usa CommonJS porque no existía una configuración del proyecto; si la integración futura establece `type: module`, habrá que adaptar la exportación a `export { analyze }` y las pruebas al nuevo formato.

La función es síncrona, pura y devuelve únicamente los cinco campos del contrato. Rechaza tipos distintos de string y mensajes vacíos o sin texto/números mediante `TypeError`; la API de Emma deberá convertir esos errores en la respuesta HTTP apropiada.

## Decisiones de las reglas

- Normaliza mayúsculas, acentos, puntuación y espacios; usa límites de palabras para evitar coincidencias dentro de otras palabras.
- Ante varias categorías: SECURITY > ACCESS > BUG > FEATURE. Una solicitud de protección que mencione seguridad también se envía a revisión por precaución.
- SECURITY siempre requiere revisión humana y al menos HIGH, incluso si el mensaje intenta ordenar una prioridad baja.
- CRITICAL: señales de impacto grave, como pérdida o fuga de datos, ransomware, caída total o afectación de todos los usuarios.
- HIGH: seguridad o urgencia/bloqueo/impacto en producción. Las expresiones «no es urgente», «not urgent» y «sin urgencia» no elevan por sí solas la prioridad.
- LOW: funcionalidades sin urgencia o problemas menores explícitos. ACCESS y BUG tienen MEDIUM por defecto. La gravedad objetiva prevalece sobre LOW.
- Sin coincidencias: BUG/MEDIUM como categoría provisional, respuesta de aclaración y revisión humana. El contrato no contempla UNKNOWN.

## Alcance y límites

Es un clasificador determinista por reglas, no un intérprete semántico. No comprende todas las negaciones, ironías o idiomas; una mención de seguridad incluso negada puede provocar revisión. Incluye vocabulario de soporte en español y términos habituales en inglés. Las respuestas son predeterminadas y no reproducen el mensaje ni sus secretos. No utiliza modelos generativos ni ejecuta instrucciones del mensaje.

Las pruebas cubren las cuatro categorías y prioridades, entradas inválidas, acentos, solapamientos, ambigüedad, dos intentos de manipulación, contrato, aislamiento e importación. Son pruebas exclusivas del motor de Dana; no sustituyen la comparación de ambos motores que corresponde a la integración del equipo.
