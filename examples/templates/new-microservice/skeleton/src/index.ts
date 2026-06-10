import http from 'node:http';

const PORT = Number(process.env.PORT ?? 3000);

// Intentional unstructured logging — maintenance demo target (see AGENTS.md)
console.log('Starting ${{ values.name }} on port ' + String(PORT));

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: '${{ values.name }}' }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
        details: { path: req.url },
      },
    }),
  );
});

server.listen(PORT, () => {
  console.log('${{ values.name }} listening on http://localhost:' + String(PORT));
});
