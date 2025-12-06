'use client';

import { useState, useEffect } from 'react';

interface LearnerProfile {
  name?: string;
  goals?: string[];
  interests?: string[];
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  aspirations?: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  learnerProfile?: LearnerProfile;
  onUpdateProfile?: (profile: Partial<LearnerProfile>) => void;
}

interface Stats {
  total_responses: number;
  correct_responses: number;
  accuracy_percent: string;
  generated_items_count: number;
}

interface ResponseLog {
  item_id: string;
  selected: string;
  correct: string;
  is_correct: boolean;
  latency_ms: number;
  timestamp: string;
  session_id: string;
}

interface GeneratedItem {
  type: string;
  item: {
    id: string;
    topic: string;
    difficulty: string;
    stem: string;
  };
  timestamp: string;
  session_id: string;
}

interface LogData {
  stats: Stats;
  recent_responses: ResponseLog[];
  recent_generated: GeneratedItem[];
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M15 5L5 15M5 5L15 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SettingsModal({ isOpen, onClose, learnerProfile, onUpdateProfile }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'stats' | 'responses' | 'generated'>('profile');
  const [logData, setLogData] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local state for profile editing
  const [editedGoals, setEditedGoals] = useState('');
  const [editedAspirations, setEditedAspirations] = useState('');
  const [editedInterests, setEditedInterests] = useState('');

  // Sync profile state when modal opens
  useEffect(() => {
    if (isOpen && learnerProfile) {
      setEditedGoals(learnerProfile.goals?.join(', ') || '');
      setEditedAspirations(learnerProfile.aspirations || '');
      setEditedInterests(learnerProfile.interests?.join(', ') || '');
    }
  }, [isOpen, learnerProfile]);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/log-response');
      if (!response.ok) throw new Error('Failed to fetch logs');
      const data = await response.json();
      setLogData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8E7E3]">
          <h2 className="text-lg font-semibold text-[#0D0D0D]">Settings & Logs</h2>
          <button
            onClick={onClose}
            className="p-1 text-[#8E8E8E] hover:text-[#5D5D5D] rounded-lg hover:bg-[#E8E7E3] transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E8E7E3] px-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-3 text-[14px] font-medium border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'text-[#DA7756] border-[#DA7756]'
                : 'text-[#5D5D5D] border-transparent hover:text-[#0D0D0D]'
            }`}
          >
            Learning Profile
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-3 text-[14px] font-medium border-b-2 transition-colors ${
              activeTab === 'stats'
                ? 'text-[#DA7756] border-[#DA7756]'
                : 'text-[#5D5D5D] border-transparent hover:text-[#0D0D0D]'
            }`}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab('responses')}
            className={`px-4 py-3 text-[14px] font-medium border-b-2 transition-colors ${
              activeTab === 'responses'
                ? 'text-[#DA7756] border-[#DA7756]'
                : 'text-[#5D5D5D] border-transparent hover:text-[#0D0D0D]'
            }`}
          >
            Response Log
          </button>
          <button
            onClick={() => setActiveTab('generated')}
            className={`px-4 py-3 text-[14px] font-medium border-b-2 transition-colors ${
              activeTab === 'generated'
                ? 'text-[#DA7756] border-[#DA7756]'
                : 'text-[#5D5D5D] border-transparent hover:text-[#0D0D0D]'
            }`}
          >
            Generated Items
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#DA7756] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-[#DC2626] text-[14px]">{error}</p>
              <button
                onClick={fetchLogs}
                className="mt-4 px-4 py-2 text-[14px] text-[#DA7756] hover:bg-[#DA7756]/10 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-[13px] font-medium text-[#0D0D0D] mb-2">
                      Learning Goals
                    </label>
                    <textarea
                      value={editedGoals}
                      onChange={(e) => setEditedGoals(e.target.value)}
                      placeholder="What are you hoping to learn? (e.g., React hooks, TypeScript, CSS Grid)"
                      className="w-full px-4 py-3 text-[14px] bg-white border border-[#E8E7E3] rounded-xl focus:border-[#DA7756] focus:ring-1 focus:ring-[#DA7756] outline-none resize-none"
                      rows={2}
                    />
                    <p className="mt-1 text-[12px] text-[#8E8E8E]">
                      Separate multiple goals with commas
                    </p>
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#0D0D0D] mb-2">
                      Why are you learning? (Aspirations)
                    </label>
                    <textarea
                      value={editedAspirations}
                      onChange={(e) => setEditedAspirations(e.target.value)}
                      placeholder="What's driving your learning? (e.g., career change, building a project, preparing for interviews)"
                      className="w-full px-4 py-3 text-[14px] bg-white border border-[#E8E7E3] rounded-xl focus:border-[#DA7756] focus:ring-1 focus:ring-[#DA7756] outline-none resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-[13px] font-medium text-[#0D0D0D] mb-2">
                      Topics of Interest
                    </label>
                    <textarea
                      value={editedInterests}
                      onChange={(e) => setEditedInterests(e.target.value)}
                      placeholder="What topics interest you most? (e.g., JavaScript, React, Node.js, CSS)"
                      className="w-full px-4 py-3 text-[14px] bg-white border border-[#E8E7E3] rounded-xl focus:border-[#DA7756] focus:ring-1 focus:ring-[#DA7756] outline-none resize-none"
                      rows={2}
                    />
                    <p className="mt-1 text-[12px] text-[#8E8E8E]">
                      Separate multiple topics with commas
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onUpdateProfile?.({
                        goals: editedGoals.split(',').map(g => g.trim()).filter(Boolean),
                        aspirations: editedAspirations,
                        interests: editedInterests.split(',').map(i => i.trim()).filter(Boolean),
                      });
                    }}
                    className="w-full px-4 py-3 text-[14px] font-medium text-white bg-[#DA7756] rounded-xl hover:bg-[#C54E3A] transition-colors"
                  >
                    Save Profile
                  </button>
                </div>
              )}

              {activeTab === 'stats' && logData && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <StatCard
                      label="Total Responses"
                      value={logData.stats.total_responses.toString()}
                    />
                    <StatCard
                      label="Correct Answers"
                      value={logData.stats.correct_responses.toString()}
                    />
                    <StatCard
                      label="Accuracy"
                      value={`${logData.stats.accuracy_percent}%`}
                      highlight
                    />
                    <StatCard
                      label="Generated Questions"
                      value={logData.stats.generated_items_count.toString()}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'responses' && logData && (
                <div className="space-y-3">
                  {logData.recent_responses.length === 0 ? (
                    <p className="text-center text-[#8E8E8E] py-8">No responses logged yet</p>
                  ) : (
                    logData.recent_responses.map((response, index) => (
                      <div
                        key={index}
                        className="p-4 bg-[#F5F4F1] rounded-lg border border-[#E8E7E3]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[13px] font-medium text-[#0D0D0D]">
                            {response.item_id}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${
                              response.is_correct
                                ? 'bg-[#16A34A]/10 text-[#16A34A]'
                                : 'bg-[#DC2626]/10 text-[#DC2626]'
                            }`}
                          >
                            {response.is_correct ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                        <div className="flex gap-4 text-[12px] text-[#5D5D5D]">
                          <span>Selected: {response.selected}</span>
                          <span>Correct: {response.correct}</span>
                          <span>Latency: {response.latency_ms}ms</span>
                        </div>
                        <div className="mt-1 text-[11px] text-[#8E8E8E]">
                          {new Date(response.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'generated' && logData && (
                <div className="space-y-3">
                  {logData.recent_generated.length === 0 ? (
                    <p className="text-center text-[#8E8E8E] py-8">No generated items yet</p>
                  ) : (
                    logData.recent_generated.map((item, index) => (
                      <div
                        key={index}
                        className="p-4 bg-[#F5F4F1] rounded-lg border border-[#E8E7E3]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[13px] font-medium text-[#0D0D0D]">
                            {item.item.id}
                          </span>
                          <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-[#DA7756]/10 text-[#DA7756]">
                            {item.item.difficulty}
                          </span>
                        </div>
                        <p className="text-[13px] text-[#5D5D5D] mb-2">
                          {item.item.stem}
                        </p>
                        <div className="flex gap-4 text-[12px] text-[#8E8E8E]">
                          <span>Topic: {item.item.topic}</span>
                          <span>{new Date(item.timestamp).toLocaleString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8E7E3] bg-[#F5F4F1]">
          <button
            onClick={fetchLogs}
            className="px-4 py-2 text-[14px] text-[#5D5D5D] hover:text-[#0D0D0D] hover:bg-[#E8E7E3] rounded-lg transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-4 rounded-xl border ${
      highlight ? 'bg-[#DA7756]/5 border-[#DA7756]/20' : 'bg-[#F5F4F1] border-[#E8E7E3]'
    }`}>
      <div className="text-[12px] text-[#5D5D5D] mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${
        highlight ? 'text-[#DA7756]' : 'text-[#0D0D0D]'
      }`}>
        {value}
      </div>
    </div>
  );
}
