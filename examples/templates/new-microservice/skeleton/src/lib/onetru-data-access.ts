// OneTru Permissioned Data API client (demo stub for `@onetru/data-access`).
//
// Tru Guardrails require ALL consumer-record access to flow through this client with a
// permissible purpose and an FCRA audit trail. Direct SQL / DB-driver access to consumer
// or credit data is prohibited (see .cursor/rules/tru-guardrails.mdc).

export type Jurisdiction = 'us' | 'emea' | 'apac';

/** FCRA / international permissible-purpose codes. */
export type PermissiblePurpose =
  | 'credit-application'
  | 'account-review'
  | 'fraud-prevention'
  | 'consumer-initiated';

export interface ConsumerRecord {
  /** Tokenized consumer reference — never a raw SSN or other PII. */
  consumerRef: string;
  jurisdiction: Jurisdiction;
  /** Tokenized attributes; raw PII is never returned to callers. */
  attributes: Record<string, string | number>;
}

export interface AccessContext {
  permissiblePurpose: PermissiblePurpose;
  /** Tokenized consumer reference, never raw PII. */
  consumerRef: string;
  /** Identity of the actor (service or user) performing the access. */
  actor: string;
}

export interface AuditEvent extends AccessContext {
  action: 'read' | 'write' | 'derive';
  timestamp: string;
}

/**
 * Emit an FCRA-compliant audit event (Tru Guardrail 4). Every function that touches
 * consumer records must call this. PII must never be included in the event payload.
 */
export function auditLog(event: Omit<AuditEvent, 'timestamp'>): AuditEvent {
  const entry: AuditEvent = { ...event, timestamp: new Date().toISOString() };
  // Structured, PII-free audit sink. A real deployment ships this to the OneTru audit log.
  process.stdout.write(`${JSON.stringify({ level: 'info', type: 'fcra-audit', ...entry })}\n`);
  return entry;
}

/**
 * OneTru Permissioned Data API client — the only approved path to consumer records
 * (Tru Guardrail 1). Jurisdiction is pinned at construction (Tru Guardrail 3).
 */
export class OneTruDataAccess {
  constructor(private readonly jurisdiction: Jurisdiction) {}

  /** Read a consumer record. Enforces jurisdiction and writes an audit event. */
  async getConsumerRecord(ctx: AccessContext): Promise<ConsumerRecord> {
    auditLog({ ...ctx, action: 'read' });
    // Stub: a real client calls the OneTru delivery layer with permissioned access.
    return {
      consumerRef: ctx.consumerRef,
      jurisdiction: this.jurisdiction,
      attributes: {},
    };
  }
}
