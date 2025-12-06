import { getItem, getItemToolDefinition } from './get-item';
import { listTopics, listTopicsToolDefinition } from './list-topics';
import { listSkills, listSkillsToolDefinition, type SkillNode } from './list-skills';
import type { Item } from '../schemas/item';
import type { TopicInfo } from './list-topics';

/**
 * All available tool definitions for Claude's tool use.
 */
export const toolDefinitions = [
  getItemToolDefinition,
  listTopicsToolDefinition,
  listSkillsToolDefinition,
] as const;

/**
 * Result type for tool execution.
 */
export type ToolResult =
  | { success: true; data: Item | TopicInfo[] | SkillNode | null }
  | { success: false; error: string };

/**
 * Executes a tool by name with the provided input.
 *
 * @param toolName - The name of the tool to execute
 * @param input - The input parameters for the tool
 * @returns The tool result or an error
 */
export function executeTool(toolName: string, input: unknown): ToolResult {
  switch (toolName) {
    case 'assessment_get_item':
      try {
        const item = getItem(input);
        return { success: true, data: item };
      } catch (error) {
        return {
          success: false,
          error: `Failed to get item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }

    case 'assessment_list_topics':
      try {
        const topics = listTopics();
        return { success: true, data: topics };
      } catch (error) {
        return {
          success: false,
          error: `Failed to list topics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }

    case 'assessment_list_skills':
      try {
        const skills = listSkills(input as { parent_id?: string; depth?: number });
        return { success: true, data: skills };
      } catch (error) {
        return {
          success: false,
          error: `Failed to list skills: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }

    default:
      return { success: false, error: `Unknown tool: ${toolName}` };
  }
}

// Re-export for convenience
export { getItem, getItemToolDefinition } from './get-item';
export { listTopics, listTopicsToolDefinition } from './list-topics';
export { listSkills, listSkillsToolDefinition } from './list-skills';
