'use strict';

// Precedencia: SECURITY > ACCESS > BUG > FEATURE. Nunca ejecutar el mensaje.
const RULES = {
  SECURITY: /\b(seguridad|security|vulnerabilidad(?:es)?|vulnerability|vulnerabilities|hack(?:eo|eado|ear|ed|ing)?|phishing|malware|ransomware|ataque|attack|inyeccion sql|sql injection|xss|brecha|breach|acceso no autorizado|unauthorized access|suplantacion|robo de (?:datos|cuenta|credenciales)|filtracion|fuga de datos|datos expuestos|data leak|contrasena expuesta|password leak)\b/,
  ACCESS: /\b(acceso|access|iniciar sesion|inicio de sesion|inicia sesion|entrar (?:a|en) (?:mi |la )?cuenta|login|log in|sign in|contrasena|password|credenciales|credentials|cuenta bloqueada|account locked|autenticacion|authentication|2fa|mfa|permisos|permissions)\b/,
  BUG: /\b(bug(?:s)?|error(?:es)?|falla(?:s)?|fallo(?:s)?|no funciona|dejo de funcionar|no responde|se cierra|se congela|pantalla en blanco|crash(?:es)?|broken|not working|timeout|lento|lentitud|caid[oa]|down|500|404)\b/,
  FEATURE: /\b(funcionalidad(?:es)?|feature(?:s)?|mejora(?:s)?|sugerencia|sugiero|propongo|agregar|anadir|incorporar|implementar|quisiera|me gustaria|seria util|solicito|add|please include|would like|enhancement)\b/,
};

const RESPONSES = {
  ACCESS: 'Verifique sus credenciales y utilice la recuperación de contraseña si es necesario. Si persiste el problema, contacte a soporte sin compartir contraseñas ni códigos de acceso.',
  BUG: 'Comparta los pasos para reproducir el problema, el resultado esperado y el mensaje de error, sin incluir datos sensibles.',
  FEATURE: 'Gracias por su propuesta. Describa la funcionalidad y el beneficio esperado para que el equipo pueda evaluarla.',
  SECURITY: 'Su reporte requiere revisión del equipo de seguridad. No comparta credenciales ni datos sensibles; conserve la evidencia para entregarla por un canal seguro.',
};

const CRITICAL = /\b(perdida de datos|data loss|ransomware|filtracion|fuga de datos|datos expuestos|data leak|brecha|breach|ataque en curso|active attack|sistema caido|servicio caido|system down|service down|caida total|interrupcion total|todos los usuarios|all users|nadie puede|produccion detenida)\b/;
const HIGH = /\b(urgente|urgent|bloqueante|blocker|no puedo trabajar|impide trabajar|no podemos trabajar|produccion|production|varios usuarios|multiple users|muchos usuarios)\b/;
const LOW = /\b(cosmetico|cosmetic|detalle visual|error tipografico|typo|sin urgencia|no es urgente|not urgent|baja prioridad|low priority)\b/;

function normalize(message) {
  return message.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Clasificador puro y síncrono. Mensajes desconocidos se derivan a revisión. */
function analyze(message) {
  if (typeof message !== 'string') {
    throw new TypeError('message debe ser una cadena de texto.');
  }
  const text = normalize(message);
  if (!text) throw new TypeError('message debe contener texto o números.');

  const category = Object.keys(RULES).find((key) => RULES[key].test(text));
  if (!category) {
    return {
      category: 'BUG', priority: 'MEDIUM',
      response: 'Necesitamos más información para clasificar su solicitud. Describa el problema y el resultado esperado, sin incluir datos sensibles.',
      requiresHumanReview: true, mode: 'traditional',
    };
  }

  // La severidad objetiva y el mínimo de seguridad prevalecen sobre "prioridad baja".
  let priority;
  if (CRITICAL.test(text)) priority = 'CRITICAL';
  else if (category === 'SECURITY' || HIGH.test(text.replace(/\b(?:no es urgente|not urgent|sin urgencia)\b/g, ' '))) priority = 'HIGH';
  else if (category === 'FEATURE' || LOW.test(text)) priority = 'LOW';
  else priority = 'MEDIUM';

  return {
    category, priority, response: RESPONSES[category],
    requiresHumanReview: category === 'SECURITY', mode: 'traditional',
  };
}

exports.analyze = analyze;
