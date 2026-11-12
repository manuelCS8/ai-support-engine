'use strict';
const form = document.querySelector('#analyze-form');
const message = document.querySelector('#message');
const results = document.querySelector('#results');
const submit = document.querySelector('#submit');
message.addEventListener('input', () => { document.querySelector('#count').textContent = `${message.value.length} / 5000`; });
for (const button of document.querySelectorAll('[data-example]')) button.addEventListener('click', () => {
  message.value = button.dataset.example;
  message.dispatchEvent(new Event('input'));
  message.focus();
});

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

async function analyze(mode, text) {
  const card = element('article', undefined, 'result');
  const title = mode === 'traditional' ? 'Motor tradicional' : 'Motor generativo';
  card.append(element('h2', title), element('p', 'Analizando…', 'loading'));
  results.append(card);
  const started = performance.now();
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, mode }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'No fue posible procesar la solicitud.');
    const row = element('div', undefined, 'row');
    row.append(element('h2', title), element('span', `${((performance.now() - started) / 1000).toFixed(2)} s`, 'tag'));
    const details = element('div', undefined, 'details');
    details.append(element('span', data.category, 'tag'), element('span', data.priority, `tag ${data.priority.toLowerCase()}`));
    card.replaceChildren(row, details, element('p', data.response, 'answer'), element('p', data.requiresHumanReview ? 'Requiere revisión humana' : 'Sin revisión humana requerida', 'review'));
  } catch (error) {
    card.classList.add('error');
    card.replaceChildren(element('h2', title), element('p', error.message));
    if (mode === 'generative') card.append(element('p', 'Inicia Ollama y descarga el modelo indicado en el README. El motor tradicional sigue disponible.'));
  }
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!message.value.trim()) { message.focus(); return; }
  submit.disabled = true;
  results.setAttribute('aria-busy', 'true');
  results.replaceChildren();
  const mode = document.querySelector('#mode').value;
  await Promise.all((mode === 'both' ? ['traditional', 'generative'] : [mode]).map(value => analyze(value, message.value)));
  submit.disabled = false;
  results.setAttribute('aria-busy', 'false');
});
