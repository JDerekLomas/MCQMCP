'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Users, Target, Clock, TrendingUp, CheckCircle, XCircle } from 'lucide-react';

interface MasteryRecord {
  user_id: string;
  objective: string;
  correct: number;
  total: number;
  updated_at: string;
}

interface ResponseRecord {
  id: number;
  user_id: string;
  objective: string;
  item_id: string | null;
  selected_answer: string;
  correct_answer: string;
  is_correct: boolean;
  latency_ms: number | null;
  difficulty: string | null;
  created_at: string;
}

interface DashboardData {
  mastery: MasteryRecord[];
  responses: ResponseRecord[];
  stats: {
    totalResponses: number;
    totalUsers: number;
    overallAccuracy: number;
    avgLatency: number;
  };
  topicStats: {
    topic: string;
    correct: number;
    total: number;
    accuracy: number;
  }[];
}

export function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard');
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-claude"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700">
        Error: {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Total Responses"
          value={data.stats.totalResponses.toString()}
          color="blue"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Unique Users"
          value={data.stats.totalUsers.toString()}
          color="purple"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Overall Accuracy"
          value={`${data.stats.overallAccuracy}%`}
          color="green"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Avg Response Time"
          value={data.stats.avgLatency > 0 ? `${(data.stats.avgLatency / 1000).toFixed(1)}s` : 'N/A'}
          color="orange"
        />
      </div>

      {/* Topic Performance */}
      <div className="bg-white rounded-xl border border-edge-light p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-claude" />
          <h2 className="text-lg font-semibold text-ink-primary">Performance by Topic</h2>
        </div>
        {data.topicStats.length === 0 ? (
          <p className="text-ink-secondary text-center py-8">No topic data yet</p>
        ) : (
          <div className="space-y-4">
            {data.topicStats.map((topic) => (
              <div key={topic.topic} className="flex items-center gap-4">
                <div className="w-32 text-sm text-ink-secondary truncate">{topic.topic}</div>
                <div className="flex-1">
                  <div className="h-6 bg-surface-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-claude rounded-full transition-all duration-500"
                      style={{ width: `${topic.accuracy}%` }}
                    />
                  </div>
                </div>
                <div className="w-20 text-right">
                  <span className="text-sm font-medium text-ink-primary">{topic.accuracy}%</span>
                  <span className="text-xs text-ink-tertiary ml-1">({topic.total})</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Responses */}
      <div className="bg-white rounded-xl border border-edge-light p-6">
        <h2 className="text-lg font-semibold text-ink-primary mb-4">Recent Responses</h2>
        {data.responses.length === 0 ? (
          <p className="text-ink-secondary text-center py-8">No responses yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-edge-light">
                  <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Time</th>
                  <th className="text-left py-2 px-3 text-ink-tertiary font-medium">User</th>
                  <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Topic</th>
                  <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Result</th>
                  <th className="text-left py-2 px-3 text-ink-tertiary font-medium">Latency</th>
                </tr>
              </thead>
              <tbody>
                {data.responses.slice(0, 10).map((response) => (
                  <tr key={response.id} className="border-b border-edge-light last:border-0">
                    <td className="py-2 px-3 text-ink-secondary">
                      {new Date(response.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-ink-primary font-mono text-xs">
                      {response.user_id.slice(0, 12)}...
                    </td>
                    <td className="py-2 px-3 text-ink-primary">{response.objective}</td>
                    <td className="py-2 px-3">
                      {response.is_correct ? (
                        <span className="inline-flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-4 h-4" /> Correct
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-500">
                          <XCircle className="w-4 h-4" /> Incorrect
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-ink-secondary">
                      {response.latency_ms ? `${(response.latency_ms / 1000).toFixed(1)}s` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mastery by User */}
      <div className="bg-white rounded-xl border border-edge-light p-6">
        <h2 className="text-lg font-semibold text-ink-primary mb-4">User Mastery</h2>
        {data.mastery.length === 0 ? (
          <p className="text-ink-secondary text-center py-8">No mastery data yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.mastery.map((m, i) => (
              <div key={i} className="bg-surface-secondary rounded-lg p-4">
                <div className="text-xs text-ink-tertiary font-mono mb-1">
                  {m.user_id.slice(0, 16)}...
                </div>
                <div className="text-sm font-medium text-ink-primary mb-2">{m.objective}</div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-claude">
                    {Math.round((m.correct / m.total) * 100)}%
                  </span>
                  <span className="text-xs text-ink-tertiary">
                    {m.correct}/{m.total} correct
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'purple' | 'green' | 'orange';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl border border-edge-light p-5">
      <div className={`inline-flex p-2 rounded-lg ${colors[color]} mb-3`}>{icon}</div>
      <div className="text-2xl font-bold text-ink-primary">{value}</div>
      <div className="text-sm text-ink-secondary">{label}</div>
    </div>
  );
}
