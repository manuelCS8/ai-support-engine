'use strict';

const categories = ['ACCESS', 'BUG', 'FEATURE', 'SECURITY'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const schema = {
  type: 'object', additionalProperties: false,
  required: ['category', 'priority', 'response', 'requiresHumanReview', 'mode'],
  properties: {
    category: { type: 'string', enum: categories },
    priority: { type: 'string', enum: priorities },
    response: { type: 'string', minLength: 1, maxLength: 4000 },
    requiresHumanReview: { type: 'boolean' },
    mode: { type: 'string', enum: ['generative'] },
  },
};

function validResult(value, mode) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).sort().join(',') === 'category,mode,priority,requiresHumanReview,response'
    && categories.includes(value.category) && priorities.includes(value.priority)
    && typeof value.response === 'string' && value.response.trim().length > 0
    && value.response.length <= 4000 && typeof value.requiresHumanReview === 'boolean'
    && value.mode === mode;
}

function validateMessage(message) {
  if (typeof message !== 'string' || !message.trim() || !/[\p{L}\p{N}]/u.test(message)) {
    throw new TypeError('message debe ser un texto no vacío.');
  }
  if (message.length > 5000) throw new TypeError('message admite hasta 5000 caracteres.');
  return message;
}

module.exports = { schema, validResult, validateMessage };
