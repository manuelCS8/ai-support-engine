'use strict';
const fs = require('node:fs/promises');
const path = require('node:path');
const cases = require('../tests/cases.json');
const traditional = require('../src/traditional');
const generative = require('../src/generative');
const { validResult } = require('../src/contract');

async function main() {
  const results = [];
  const summary = {};
  for (const [mode, engine] of [['traditional', traditional], ['generative', generative]]) {
    console.log(`Evaluando ${mode}: ${cases.length} solicitudes reales al motor.`);
    for (const reference of cases) {
      const started = performance.now();
      try {
        const actual = await engine.analyze(reference.message);
        const formatValid = validResult(actual, mode);
        results.push({ id: reference.id, mode, message: reference.message, reference, actual, formatValid,
          correct: formatValid && ['category', 'priority', 'requiresHumanReview'].every(key => actual[key] === reference[key]),
          elapsedMs: Math.round(performance.now() - started), error: null });
      } catch (error) {
        results.push({ id: reference.id, mode, message: reference.message, reference, actual: null, formatValid: false, correct: false,
          elapsedMs: Math.round(performance.now() - started), error: error.code || 'ENGINE_ERROR' });
      }
    }
    const rows = results.filter(row => row.mode === mode);
    const completed = rows.filter(row => row.actual).length;
    const correct = rows.filter(row => row.correct).length;
    summary[mode] = { total: rows.length, completed, failures: rows.length - completed, correct,
      accuracyPercent: completed ? Number((100 * correct / rows.length).toFixed(2)) : null };
  }
  const out = path.join(__dirname, '..', 'results');
  await fs.mkdir(out, { recursive: true });
  const conclusion = summary.generative.completed !== cases.length
    ? 'La evaluación generativa está incompleta por errores del proveedor. No se puede determinar qué motor es mejor hasta ejecutar todos los casos con Gemini y una clave válida con cuota disponible. Las pruebas con dobles no cuentan como evidencia generativa real.'
    : `En estos ${cases.length} casos, el motor tradicional obtuvo ${summary.traditional.accuracyPercent}% de aciertos y el generativo ${summary.generative.accuracyPercent}%. El acierto exige categoría, prioridad y revisión humana correctas, además del contrato válido. Esta muestra pequeña y diseñada para las reglas no permite generalizar. El generativo incluye una defensa determinista de seguridad, por lo que los resultados evalúan la solución completa, no solamente el modelo.`;
  await fs.writeFile(path.join(out, 'comparison.json'), JSON.stringify({ generatedAt: new Date().toISOString(), provider: 'Gemini', model: process.env.GEMINI_MODEL || generative.DEFAULT_MODEL, summary, conclusion, results }, null, 2));
  const csv = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const header = ['id', 'mode', 'message', 'expectedCategory', 'expectedPriority', 'expectedReview', 'category', 'priority', 'requiresHumanReview', 'formatValid', 'correct', 'elapsedMs', 'error'];
  const lines = results.map(row => [row.id, row.mode, row.message, row.reference.category, row.reference.priority, row.reference.requiresHumanReview, row.actual?.category, row.actual?.priority, row.actual?.requiresHumanReview, row.formatValid, row.correct, row.elapsedMs, row.error].map(csv).join(','));
  await fs.writeFile(path.join(out, 'comparison.csv'), '\ufeff' + [header.join(','), ...lines].join('\n'));
  await fs.writeFile(path.join(out, 'conclusion.md'), '# Conclusión técnica\n\n' + conclusion + '\n');
  console.log(JSON.stringify(summary, null, 2));
  console.log('Evidencia guardada en results/.');
  if (summary.generative.failures || summary.traditional.failures) process.exitCode = 1;
}
main().catch(() => { console.error('No se pudo completar la comparación. Revise la configuración y los permisos de results/.'); process.exitCode = 1; });
