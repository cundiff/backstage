import http from 'node:http';
import { OneTruDataAccess } from './lib/onetru-data-access.js';

const PORT = Number(process.env.PORT ?? 3000);

// Jurisdiction is pinned at scaffold time by OneDev (Tru Guardrail 3).
const dataAccess = new OneTruDataAccess('${{ values.jurisdiction }}');

// Intentional unstructured logging — maintenance demo target (see AGENTS.md)
console.log('Starting ${{ values.name }} on port ' + String(PORT));

const server = http.createServer(async (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: '${{ values.name }}' }));
    return;
  }

  // Example: permissioned consumer-record access via OneTru (Tru Guardrails 1 + 4).
  if (req.url === '/consumer/example') {
    try {
      const record = await dataAccess.getConsumerRecord({
        consumerRef: 'tok_demo_consumer',
        permissiblePurpose: 'account-review',
        actor: 'service:${{ values.name }}',
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      // Return tokenized data only — never raw PII (Tru Guardrail 2).
      res.end(
        JSON.stringify({
          consumerRef: record.consumerRef,
          jurisdiction: record.jurisdiction,
        }),
      );
    } catch {
      // Never leak error internals or PII in the response (Tru Guardrail 2).
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          error: {
            code: 'CONSUMER_LOOKUP_FAILED',
            message: 'Unable to retrieve record',
            details: {},
          },
        }),
      );
    }
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
