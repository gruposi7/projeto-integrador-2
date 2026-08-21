const app = require('../server');
const path = require('path');

module.exports = (req, res) => {
  const caminho = req.url.split('?')[0];
  const arquivosPublicos = {
    '/': 'index.html',
    '/index.html': 'index.html',
    '/style.css': 'style.css',
    '/java.js': 'java.js',
  };

  if (arquivosPublicos[caminho]) {
    return res.sendFile(path.join(__dirname, '..', arquivosPublicos[caminho]));
  }

  if (!req.url.startsWith('/api')) {
    req.url = `/api${req.url === '/' ? '' : req.url}`;
  }

  return app(req, res);
};