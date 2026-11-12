# Evidencias de ejecución

Aquí se guardan las pruebas de que el proyecto funciona. Son **entregables** de la actividad.

## Qué va aquí

| Evidencia | Cómo se obtiene | Nombre sugerido |
|---|---|---|
| Pruebas automatizadas | `npm test`, guardando la salida completa | `AAAA-MM-DD-npm-test.txt` |
| Comparación de ambos motores (10 casos o más) | `npm run compare` | `AAAA-MM-DD-comparacion.json` / `.csv` |
| Tabla de resultados y conclusión (≤ 150 palabras) | A partir de la comparación real | `AAAA-MM-DD-conclusion.md` |
| Ejecución del motor tradicional | Petición a `POST /api/analyze` con `mode: "traditional"` | `AAAA-MM-DD-api-traditional.txt` |
| Ejecución del motor generativo | Petición a `POST /api/analyze` con `mode: "generative"` | `AAAA-MM-DD-api-generative.txt` |
| Capturas de la interfaz (opcional) | Pantalla de la app funcionando | `AAAA-MM-DD-captura-*.png` |

## Reglas

- Sólo salidas **reales** de comandos ejecutados, con la fecha y el commit (`git rev-parse HEAD`) en que se corrieron. Nada se escribe ni se ajusta a mano.
- **Nunca** incluir llaves de API, contenido de `.env`, tokens ni datos reales de personas. Revisa el archivo antes de subirlo.
- Si una ejecución falla (por ejemplo, el proveedor no responde), también se guarda: es evidencia honesta del manejo de errores.
- Las evidencias se suben por pull request, como cualquier otro cambio (rama `chore/usuario-evidencias`).
