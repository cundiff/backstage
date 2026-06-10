import type { RunResult } from '@cursor/sdk';
import type { MaintenanceStreamEvent } from './types';

type SdkTextBlock = { type: 'text'; text: string };
type SdkToolUseBlock = { type: 'tool_use'; id: string; name: string; input: unknown };

type SdkAssistantMessage = {
  type: 'assistant';
  agent_id: string;
  run_id: string;
  message: {
    role: 'assistant';
    content: Array<SdkTextBlock | SdkToolUseBlock>;
  };
};

type SdkToolUseMessage = {
  type: 'tool_call';
  agent_id: string;
  run_id: string;
  call_id: string;
  name: string;
  status: 'running' | 'completed' | 'error';
  args?: unknown;
  result?: unknown;
};

type SdkStatusMessage = {
  type: 'status';
  agent_id: string;
  run_id: string;
  status: string;
  message?: string;
};

type SdkTaskMessage = {
  type: 'task';
  agent_id: string;
  run_id: string;
  status?: string;
  text?: string;
};

export type SdkStreamEvent =
  | SdkAssistantMessage
  | SdkToolUseMessage
  | SdkStatusMessage
  | SdkTaskMessage
  | { type: string; agent_id?: string; run_id?: string };

export function mapSdkEventToMaintenanceEvent(
  event: SdkStreamEvent,
): MaintenanceStreamEvent | null {
  switch (event.type) {
    case 'assistant': {
      const assistant = event as SdkAssistantMessage;
      const text = assistant.message.content
        .filter((block): block is SdkTextBlock => block.type === 'text')
        .map(block => block.text)
        .join('');

      if (!text.trim()) {
        return null;
      }

      return {
        type: 'log',
        message: text,
        agentId: assistant.agent_id,
        runId: assistant.run_id,
      };
    }
    case 'tool_call': {
      const toolCall = event as SdkToolUseMessage;
      if (toolCall.status === 'running') {
        return {
          type: 'tool_start',
          toolName: toolCall.name,
          message: `Starting ${toolCall.name}`,
          agentId: toolCall.agent_id,
          runId: toolCall.run_id,
        };
      }

      if (toolCall.status === 'completed') {
        return {
          type: 'tool_complete',
          toolName: toolCall.name,
          message: `Completed ${toolCall.name}`,
          agentId: toolCall.agent_id,
          runId: toolCall.run_id,
        };
      }

      if (toolCall.status === 'error') {
        return {
          type: 'error',
          toolName: toolCall.name,
          message: `Tool ${toolCall.name} failed`,
          agentId: toolCall.agent_id,
          runId: toolCall.run_id,
        };
      }

      return null;
    }
    case 'status': {
      const statusEvent = event as SdkStatusMessage;
      return {
        type: 'status',
        status: statusEvent.status,
        message: statusEvent.message ?? statusEvent.status,
        agentId: statusEvent.agent_id,
        runId: statusEvent.run_id,
      };
    }
    case 'task': {
      const taskEvent = event as SdkTaskMessage;
      if (!taskEvent.text) {
        return null;
      }

      return {
        type: 'log',
        message: taskEvent.text,
        agentId: taskEvent.agent_id,
        runId: taskEvent.run_id,
      };
    }
    default:
      return null;
  }
}

export function mapRunResultToCompleteEvent(
  result: RunResult,
  agentId?: string,
): MaintenanceStreamEvent {
  const prUrl = result.git?.branches?.find(branch => branch.prUrl)?.prUrl;

  return {
    type: 'complete',
    status: result.status,
    message: result.result,
    prUrl,
    agentId,
    runId: result.id,
  };
}

export function formatSseEvent(event: MaintenanceStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
