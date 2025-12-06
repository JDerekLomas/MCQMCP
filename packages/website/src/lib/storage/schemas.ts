import { z } from 'zod';

/**
 * Schema for a chat message
 */
export const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  timestamp: z.string(), // ISO string for serialization
  mcqItemId: z.string().optional(), // Reference to MCQ item if present
});
export type StoredMessage = z.infer<typeof MessageSchema>;

/**
 * Schema for a conversation
 */
export const ConversationSchema = z.object({
  id: z.string(),
  title: z.string(),
  timestamp: z.string(), // ISO string
  messages: z.array(MessageSchema),
});
export type StoredConversation = z.infer<typeof ConversationSchema>;

/**
 * Schema for learner profile - stores discovered context about the user
 */
export const LearnerProfileSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  // Learning goals and context
  goals: z.array(z.string()).optional(), // e.g., ["interview prep", "React project"]
  interests: z.array(z.string()).optional(), // e.g., ["React", "TypeScript"]
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  aspirations: z.string().optional(), // Why they're learning - broader context
  // Progress tracking
  skillProgress: z.record(z.string(), z.object({
    questionsAnswered: z.number(),
    correctAnswers: z.number(),
    lastAttempt: z.string().optional(),
  })).optional(),
  // Stats
  totalQuestionsAnswered: z.number().default(0),
  totalCorrect: z.number().default(0),
  longestStreak: z.number().default(0),
  currentStreak: z.number().default(0),
  // Timestamps
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type LearnerProfile = z.infer<typeof LearnerProfileSchema>;

/**
 * Schema for the full user context (stored in a single file per user/session)
 */
export const UserContextSchema = z.object({
  version: z.literal(1),
  sessionId: z.string(),
  learnerProfile: LearnerProfileSchema,
  conversations: z.array(ConversationSchema),
  currentConversationId: z.string().nullable(),
  learningModeEnabled: z.boolean(),
  updatedAt: z.string(),
});
export type UserContext = z.infer<typeof UserContextSchema>;

/**
 * Create a new empty user context
 */
export function createEmptyUserContext(sessionId: string): UserContext {
  const now = new Date().toISOString();
  return {
    version: 1,
    sessionId,
    learnerProfile: {
      id: sessionId,
      totalQuestionsAnswered: 0,
      totalCorrect: 0,
      longestStreak: 0,
      currentStreak: 0,
      createdAt: now,
      updatedAt: now,
    },
    conversations: [],
    currentConversationId: null,
    learningModeEnabled: false,
    updatedAt: now,
  };
}
