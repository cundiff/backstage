import { describe, it, expect } from 'vitest';
import { OneTruDataAccess, auditLog } from './onetru-data-access.js';

describe('OneTruDataAccess', () => {
  it('returns a tokenized record pinned to its jurisdiction', async () => {
    const client = new OneTruDataAccess('emea');
    const record = await client.getConsumerRecord({
      consumerRef: 'tok_123',
      permissiblePurpose: 'account-review',
      actor: 'service:test',
    });
    expect(record.jurisdiction).toBe('emea');
    expect(record.consumerRef).toBe('tok_123');
  });

  it('emits an FCRA audit event with a permissible purpose and timestamp', () => {
    const event = auditLog({
      consumerRef: 'tok_123',
      permissiblePurpose: 'fraud-prevention',
      actor: 'service:test',
      action: 'read',
    });
    expect(event.permissiblePurpose).toBe('fraud-prevention');
    expect(event.timestamp).toBeTruthy();
  });
});
