# AI Support Engine

Prototipo que clasifica solicitudes de soporte (ACCESS, BUG, FEATURE, SECURITY) y les asigna prioridad (LOW, MEDIUM, HIGH, CRITICAL) con dos enfoques que se comparan:

- **Motor tradicional:** reglas escritas por el equipo, sin modelos generativos.
- **Motor generativo:** un modelo de IA real que devuelve JSON validado.

Ambos responden por `POST /api/analyze` con el mismo contrato.

> Este README se completa con las instrucciones de instalación y ejecución cuando el código entra a `main` por pull request.

## Equipo

| Integrante | Usuario de GitHub |
|---|---|
| Emmanuel Castro Salvador | [@manuelCS8](https://github.com/manuelCS8) |
| Abraham Cervantes Romero | [@BAM-JI](https://github.com/BAM-JI) |
| Lizbeth (Dana) | [@lizcast06](https://github.com/lizcast06) |

## Cómo trabajamos

- **Nada se sube directo a `main`.** Todo entra por pull request con la aprobación de otro integrante. La rama está protegida con una regla de GitHub.
- Las reglas completas están en [CONTRIBUTING.md](CONTRIBUTING.md).
- Las evidencias de ejecución van en [`evidence/`](evidence/).
