# Reglas de trabajo del equipo

## Ramas y pull requests

1. **Nunca** se hace push directo a `main`. Una regla de GitHub (`proteger-main`) lo bloquea para todos, incluido el dueño del repo.
2. Cada cambio va en su propia rama, creada desde `main` actualizado:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b tipo/usuario-descripcion
   ```
   Tipos: `feat/` (función nueva), `fix/` (corrección), `test/` (pruebas), `docs/` (documentación), `chore/` (configuración o evidencias).
   Ejemplos: `feat/lizcast06-motor-tradicional`, `fix/manuelcs8-validacion-api`.
3. Se abre un **pull request hacia `main`** que explique qué cambia y cómo se probó, con la salida real de las pruebas.
4. **Otro integrante** lo revisa y lo aprueba. Nadie aprueba su propio PR.
5. Se mergea con **Create a merge commit**. No se usa squash ni rebase, para conservar los commits de cada autor.
6. No se hace force push ni se borran commits ya subidos.

## Commits

- Cada quien commitea **con su propia cuenta** y su identidad de Git (`git config user.name` y `git config user.email`).
- Mensajes cortos que digan qué cambia, por ejemplo: `feat: reglas de prioridad para incidentes de seguridad`.
- Antes de abrir el PR, corre las pruebas (`npm test`) y asegúrate de que pasen.

## Secretos y datos

- Las llaves (por ejemplo, `GEMINI_API_KEY`) van **sólo** en `.env`, que está en `.gitignore`. En el repo sólo existe `.env.example`, sin valores reales.
- Revisa `git status` antes de cada commit: `.env` nunca debe aparecer.
- Usa sólo datos ficticios en pruebas y evidencias: nada de correos, nombres, contraseñas ni datos reales de personas.

## Evidencias

- Las evidencias de ejecución van en [`evidence/`](evidence/), siguiendo su README.
- Deben ser salidas **reales** de comandos ejecutados, con fecha. No se escriben ni se editan a mano.

## Uso de IA

Se permite usar herramientas de IA como apoyo, pero cada integrante debe poder explicar el código que sube, las decisiones y los resultados. Si se usó IA, se menciona en la descripción del PR.
