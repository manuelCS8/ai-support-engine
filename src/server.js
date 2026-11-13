'use strict';

const http = require('node:http');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const traditional = require('./traditional');
const generative = require('./generative');
const { validateMessage, validResult } = require('./contract');

const assets = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/styles.css': ['styles.css', 'text/css; charset=utf-8'],
};

function send(res, status, value) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(value));
}

function createServer({ traditionalAnalyze = traditional.analyze, generativeAnalyze = generative.analyze } = {}) {
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    try {
      if (req.method === 'GET' && req.url === '/api/health') return send(res, 200, { status: 'ok', service: 'ai-support-engine' });
      if (req.method === 'GET' && assets[req.url]) {
        const [file, type] = assets[req.url];
        const content = await readFile(path.join(__dirname, '..', 'public', file));
        res.writeHead(200, { 'Content-Type': type });
        return res.end(content);
      }
      if (req.url !== '/api/analyze') return send(res, 404, { error: { code: 'NOT_FOUND', message: 'Ruta no encontrada.' } });
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return send(res, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'Utilice POST.' } });
      }
      if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] || '')) {
        return send(res, 415, { error: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Utilice Content-Type: application/json.' } });
      }
      const chunks = [];
      let length = 0;
      for await (const chunk of req) {
        length += chunk.length;
        if (length > 32768) return send(res, 413, { error: { code: 'PAYLOAD_TOO_LARGE', message: 'Solicitud demasiado grande.' } });
        chunks.push(chunk);
      }
      let input;
      try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
      catch { return send(res, 400, { error: { code: 'INVALID_JSON', message: 'El cuerpo debe ser JSON válido.' } }); }
      if (!input || typeof input !== 'object' || Array.isArray(input)
        || !['traditional', 'generative'].includes(input.mode)
        || Object.keys(input).some(key => !['message', 'mode'].includes(key))) {
        return send(res, 400, { error: { code: 'INVALID_REQUEST', message: 'Envíe únicamente message y mode (traditional o generative).' } });
      }
      validateMessage(input.message);
      const result = await (input.mode === 'traditional' ? traditionalAnalyze : generativeAnalyze)(input.message);
      if (!validResult(result, input.mode)) throw new generative.ProviderError('INVALID_ENGINE_OUTPUT', 'El motor no cumplió el contrato.');
      return send(res, 200, result);
    } catch (error) {
      if (error instanceof TypeError) return send(res, 400, { error: { code: 'INVALID_REQUEST', message: error.message } });
      if (error instanceof generative.ProviderError) return send(res, error.status, { error: { code: error.code, message: error.message } });
      return send(res, 500, { error: { code: 'INTERNAL_ERROR', message: 'No fue posible procesar la solicitud.' } });
    }
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT debe estar entre 1 y 65535.');
  const server = createServer();
  server.listen(port, process.env.HOST || '127.0.0.1', () => console.log(`AI Support Engine: http://${process.env.HOST || '127.0.0.1'}:${port}`));
  server.on('error', () => { console.error('No se pudo iniciar el servidor. Revise HOST, PORT y si el puerto está ocupado.'); process.exitCode = 1; });
}

module.exports = { createServer };
