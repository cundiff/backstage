const http = require('node:http');

const PORT = Number(process.env.PORT ?? 3000);

// Intentionally unstructured — legacy service with no golden-path conventions
console.log('legacy-checkout-api starting on port ' + PORT);

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  if (req.url === '/checkout') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'accepted', legacy: true }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, () => {
  console.log('legacy-checkout-api listening on http://localhost:' + PORT);
});
