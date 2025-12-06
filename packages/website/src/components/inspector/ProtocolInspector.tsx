'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, Wrench, CheckCircle, XCircle, Clock, Target, Zap } from 'lucide-react';

// Types matching the SSE events from /api/chat
export type ProtocolEvent =
  | { type: 'tool_call'; name: string; input: unknown; tool_use_id: string; timestamp?: number }
  | { type: 'tool_result'; name: string; result: unknown; tool_use_id: string; success: boolean; timestamp?: number }
  | { type: 'response_logged'; item_id: string; selected: string; correct: string; is_correct: boolean; latency_ms: number; timestamp?: number };

export type SessionStats = {
  total_responses: number;
  correct_responses: number;
  accuracy_percent: number;
  avg_latency_ms: number;
};

interface ProtocolInspectorProps {
  events: ProtocolEvent[];
  sessionStats: SessionStats;
  className?: string;
}

function JsonViewer({ data, collapsed = false }: { data: unknown; collapsed?: boolean }) {
  const [isCollapsed, setIsCollapsed] = useState(collapsed);
  const jsonString = JSON.stringify(data, null, 2);
  const lines = jsonString.split('\n');
  const isMultiline = lines.length > 3;

  if (!isMultiline) {
    return (
      <pre className="text-xs font-mono text-ink-secondary bg-surface-tertiary rounded px-2 py-1 overflow-x-auto">
        {jsonString}
      </pre>
    );
  }

  return (
    <div>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-1 text-xs text-ink-tertiary hover:text-ink-secondary"
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
        {isCollapsed ? 'Show JSON' : 'Hide JSON'}
      </button>
      {!isCollapsed && (
        <pre className="text-xs font-mono text-ink-secondary bg-surface-tertiary rounded px-2 py-1 mt-1 overflow-x-auto max-h-48 overflow-y-auto">
          {jsonString}
        </pre>
      )}
    </div>
  );
}

function ToolCallEvent({ event }: { event: Extract<ProtocolEvent, { type: 'tool_call' }> }) {
  return (
    <div className="border border-edge-light rounded-lg p-3 bg-surface-primary">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded bg-blue-100">
          <Wrench size={14} className="text-blue-600" />
        </div>
        <span className="font-medium text-sm text-ink-primary">MCP Tool Call</span>
        <code className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
          {event.name}
        </code>
      </div>
      <div className="ml-7">
        <div className="text-xs text-ink-tertiary mb-1">Input:</div>
        <JsonViewer data={event.input} collapsed={true} />
      </div>
    </div>
  );
}

function ToolResultEvent({ event }: { event: Extract<ProtocolEvent, { type: 'tool_result' }> }) {
  const isItemResult = event.name === 'assessment_get_item' && event.success;
  const item = isItemResult ? (event.result as { id?: string; difficulty?: string; topic?: string }) : null;

  return (
    <div className={`border rounded-lg p-3 ${event.success ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded ${event.success ? 'bg-green-100' : 'bg-red-100'}`}>
          {event.success ? (
            <CheckCircle size={14} className="text-green-600" />
          ) : (
            <XCircle size={14} className="text-red-600" />
          )}
        </div>
        <span className="font-medium text-sm text-ink-primary">Tool Result</span>
        <code className="text-xs bg-surface-tertiary text-ink-secondary px-1.5 py-0.5 rounded">
          {event.name}
        </code>
      </div>

      {/* Show item metadata prominently if this is an item retrieval */}
      {item && (
        <div className="ml-7 mb-2 flex flex-wrap gap-2">
          {item.id && (
            <span className="text-xs bg-surface-tertiary text-ink-secondary px-2 py-1 rounded">
              ID: {item.id}
            </span>
          )}
          {item.topic && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
              {item.topic}
            </span>
          )}
          {item.difficulty && (
            <span className={`text-xs px-2 py-1 rounded ${
              item.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
              item.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {String(item.difficulty)}
            </span>
          )}
        </div>
      )}

      <div className="ml-7">
        <div className="text-xs text-ink-tertiary mb-1">Result:</div>
        <JsonViewer data={event.result} collapsed={true} />
      </div>
    </div>
  );
}

function ResponseLoggedEvent({ event }: { event: Extract<ProtocolEvent, { type: 'response_logged' }> }) {
  return (
    <div className={`border rounded-lg p-3 ${event.is_correct ? 'border-green-200 bg-green-50/50' : 'border-orange-200 bg-orange-50/50'}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded ${event.is_correct ? 'bg-green-100' : 'bg-orange-100'}`}>
          <Target size={14} className={event.is_correct ? 'text-green-600' : 'text-orange-600'} />
        </div>
        <span className="font-medium text-sm text-ink-primary">Response Logged</span>
        {event.is_correct ? (
          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Correct</span>
        ) : (
          <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">Incorrect</span>
        )}
      </div>
      <div className="ml-7 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-ink-tertiary">Item:</span>{' '}
          <code className="text-ink-secondary">{event.item_id}</code>
        </div>
        <div>
          <span className="text-ink-tertiary">Selected:</span>{' '}
          <span className={event.is_correct ? 'text-green-600 font-medium' : 'text-orange-600 font-medium'}>
            {event.selected}
          </span>
          {!event.is_correct && (
            <span className="text-ink-tertiary"> (correct: {event.correct})</span>
          )}
        </div>
        <div className="col-span-2 flex items-center gap-1">
          <Clock size={12} className="text-ink-tertiary" />
          <span className="text-ink-tertiary">Latency:</span>{' '}
          <span className="text-ink-secondary font-medium">{(event.latency_ms / 1000).toFixed(1)}s</span>
        </div>
      </div>
    </div>
  );
}

function StatsPanel({ stats }: { stats: SessionStats }) {
  return (
    <div className="border border-edge-light rounded-lg p-4 bg-surface-secondary">
      <div className="flex items-center gap-2 mb-3">
        <Zap size={16} className="text-claude" />
        <span className="font-medium text-sm text-ink-primary">Session Stats</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-2 bg-surface-primary rounded">
          <div className="text-2xl font-bold text-ink-primary">{stats.total_responses}</div>
          <div className="text-xs text-ink-tertiary">Responses</div>
        </div>
        <div className="text-center p-2 bg-surface-primary rounded">
          <div className={`text-2xl font-bold ${stats.accuracy_percent >= 70 ? 'text-green-600' : stats.accuracy_percent >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
            {stats.total_responses > 0 ? `${stats.accuracy_percent.toFixed(0)}%` : '-'}
          </div>
          <div className="text-xs text-ink-tertiary">Accuracy</div>
        </div>
        <div className="text-center p-2 bg-surface-primary rounded">
          <div className="text-2xl font-bold text-ink-primary">{stats.correct_responses}</div>
          <div className="text-xs text-ink-tertiary">Correct</div>
        </div>
        <div className="text-center p-2 bg-surface-primary rounded">
          <div className="text-2xl font-bold text-ink-primary">
            {stats.avg_latency_ms > 0 ? `${(stats.avg_latency_ms / 1000).toFixed(1)}s` : '-'}
          </div>
          <div className="text-xs text-ink-tertiary">Avg Time</div>
        </div>
      </div>
    </div>
  );
}

export function ProtocolInspector({ events, sessionStats, className = '' }: ProtocolInspectorProps) {
  return (
    <div className={`flex flex-col h-full bg-surface-secondary ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-edge-light bg-surface-primary">
        <h2 className="font-semibold text-ink-primary flex items-center gap-2">
          <span className="text-lg">🔍</span>
          Protocol Inspector
        </h2>
        <p className="text-xs text-ink-tertiary mt-1">
          Watch MCP tool calls, item retrieval, and response logging in real-time
        </p>
      </div>

      {/* Stats */}
      <div className="p-4 border-b border-edge-light">
        <StatsPanel stats={sessionStats} />
      </div>

      {/* Event Log */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-ink-primary">Event Log</span>
          <span className="text-xs bg-surface-tertiary text-ink-tertiary px-1.5 py-0.5 rounded">
            {events.length} events
          </span>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-8 text-ink-tertiary text-sm">
            <div className="text-3xl mb-2">📡</div>
            <p>No events yet</p>
            <p className="text-xs mt-1">Ask Claude a question to see MCP in action</p>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event, index) => (
              <div key={index}>
                {event.type === 'tool_call' && <ToolCallEvent event={event} />}
                {event.type === 'tool_result' && <ToolResultEvent event={event} />}
                {event.type === 'response_logged' && <ResponseLoggedEvent event={event} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
