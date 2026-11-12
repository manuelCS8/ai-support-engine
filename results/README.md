# Evidencias comparativas

Ejecute `npm run compare` para generar `comparison.json`, `comparison.csv` y `conclusion.md` con la fecha de ejecución y el modelo utilizado.

Los 12 casos de referencia se definen previamente en `tests/cases.json`: incluyen casos normales, dos ambiguos y dos intentos de manipulación. El acierto exige coincidencia de categoría, prioridad y revisión humana, y formato válido. Los errores cuentan como casos no acertados; si el proveedor nunca responde, la exactitud generativa se registra como `null` (no evaluable). Se conserva cada error explícitamente.

El generativo siempre consulta Ollama de verdad. Si no está disponible, la comparación termina con código 1 y una conclusión de evaluación incompleta. No se inventan resultados ni se sustituyen por respuestas del motor tradicional.
