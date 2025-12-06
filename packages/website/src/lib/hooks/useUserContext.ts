'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { UserContext, StoredConversation, StoredMessage, LearnerProfile } from '@/lib/storage/schemas';

const STORAGE_KEY = 'mcq-session-id';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = localStorage.getItem(STORAGE_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  return sessionId;
}

interface UseUserContextReturn {
  sessionId: string;
  context: UserContext | null;
  isLoading: boolean;
  error: string | null;
  // Actions
  saveConversation: (conversation: StoredConversation) => Promise<void>;
  updateLearnerProfile: (updates: Partial<LearnerProfile>) => Promise<void>;
  setCurrentConversation: (conversationId: string | null) => Promise<void>;
  setLearningMode: (enabled: boolean) => Promise<void>;
  addMessageToConversation: (conversationId: string, message: StoredMessage) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useUserContext(): UseUserContextReturn {
  const [sessionId, setSessionId] = useState('');
  const [context, setContext] = useState<UserContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingContextRef = useRef<UserContext | null>(null);

  // Initialize session ID on mount
  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  // Load context when session ID is available
  useEffect(() => {
    if (!sessionId) return;

    async function loadContext() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/context?sessionId=${sessionId}`);
        if (!response.ok) throw new Error('Failed to load context');
        const data = await response.json();
        setContext(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    loadContext();
  }, [sessionId]);

  // Debounced save function
  const debouncedSave = useCallback((newContext: UserContext) => {
    pendingContextRef.current = newContext;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      const contextToSave = pendingContextRef.current;
      if (!contextToSave) return;

      try {
        await fetch('/api/context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(contextToSave),
        });
      } catch (err) {
        console.error('Failed to save context:', err);
      }
    }, 1000); // Save after 1 second of no changes
  }, []);

  const saveConversation = useCallback(async (conversation: StoredConversation) => {
    if (!context) return;

    const existingIndex = context.conversations.findIndex(c => c.id === conversation.id);
    const updatedConversations = existingIndex >= 0
      ? context.conversations.map((c, i) => i === existingIndex ? conversation : c)
      : [conversation, ...context.conversations];

    const newContext: UserContext = {
      ...context,
      conversations: updatedConversations,
      updatedAt: new Date().toISOString(),
    };

    setContext(newContext);
    debouncedSave(newContext);
  }, [context, debouncedSave]);

  const updateLearnerProfile = useCallback(async (updates: Partial<LearnerProfile>) => {
    if (!context) return;

    const newContext: UserContext = {
      ...context,
      learnerProfile: {
        ...context.learnerProfile,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    setContext(newContext);
    debouncedSave(newContext);
  }, [context, debouncedSave]);

  const setCurrentConversation = useCallback(async (conversationId: string | null) => {
    if (!context) return;

    const newContext: UserContext = {
      ...context,
      currentConversationId: conversationId,
      updatedAt: new Date().toISOString(),
    };

    setContext(newContext);
    debouncedSave(newContext);
  }, [context, debouncedSave]);

  const setLearningMode = useCallback(async (enabled: boolean) => {
    if (!context) return;

    const newContext: UserContext = {
      ...context,
      learningModeEnabled: enabled,
      updatedAt: new Date().toISOString(),
    };

    setContext(newContext);
    debouncedSave(newContext);
  }, [context, debouncedSave]);

  const addMessageToConversation = useCallback(async (conversationId: string, message: StoredMessage) => {
    if (!context) return;

    const updatedConversations = context.conversations.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          messages: [...conv.messages, message],
        };
      }
      return conv;
    });

    const newContext: UserContext = {
      ...context,
      conversations: updatedConversations,
      updatedAt: new Date().toISOString(),
    };

    setContext(newContext);
    debouncedSave(newContext);
  }, [context, debouncedSave]);

  const refresh = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/context?sessionId=${sessionId}`);
      if (!response.ok) throw new Error('Failed to refresh context');
      const data = await response.json();
      setContext(data);
    } catch (err) {
      console.error('Failed to refresh context:', err);
    }
  }, [sessionId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    sessionId,
    context,
    isLoading,
    error,
    saveConversation,
    updateLearnerProfile,
    setCurrentConversation,
    setLearningMode,
    addMessageToConversation,
    refresh,
  };
}
