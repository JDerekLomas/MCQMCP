import { z } from 'zod';
import skillTreeData from '../skill-tree.json';

/**
 * Schema for a skill node in the tree
 */
export const SkillNodeSchema: z.ZodType<SkillNode> = z.object({
  id: z.string(),
  name: z.string(),
  children: z.array(z.lazy(() => SkillNodeSchema)).optional(),
});

export interface SkillNode {
  id: string;
  name: string;
  children?: SkillNode[];
}

/**
 * Input schema for list_skills tool
 */
export const ListSkillsInputSchema = z.object({
  parent_id: z.string().optional(), // If provided, return only children of this node
  depth: z.number().min(1).max(4).optional(), // How deep to traverse (default: full tree)
});

export type ListSkillsInput = z.infer<typeof ListSkillsInputSchema>;

/**
 * Find a node in the tree by ID
 */
function findNode(node: SkillNode, id: string): SkillNode | null {
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNode(child, id);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Truncate tree to specified depth
 */
function truncateTree(node: SkillNode, maxDepth: number, currentDepth = 1): SkillNode {
  if (currentDepth >= maxDepth || !node.children) {
    return { id: node.id, name: node.name };
  }
  return {
    id: node.id,
    name: node.name,
    children: node.children.map(child => truncateTree(child, maxDepth, currentDepth + 1)),
  };
}

/**
 * Get the skill tree or a subtree
 */
export function listSkills(input: ListSkillsInput): SkillNode | null {
  const tree = skillTreeData.tree as SkillNode;

  // Find starting node
  let startNode = tree;
  if (input.parent_id) {
    const found = findNode(tree, input.parent_id);
    if (!found) return null;
    startNode = found;
  }

  // Apply depth limit if specified
  if (input.depth) {
    return truncateTree(startNode, input.depth);
  }

  return startNode;
}

/**
 * Tool definition for Claude
 */
export const listSkillsToolDefinition = {
  name: 'assessment_list_skills',
  description: `Returns the skill tree structure for frontend engineering topics.
Use this to show learners what topics are available to explore and assess.
The tree is hierarchical: Frontend → JavaScript/React/HTML-CSS/TypeScript → specific skills.
Returns the full tree by default, or a subtree if parent_id is specified.`,
  input_schema: {
    type: 'object' as const,
    properties: {
      parent_id: {
        type: 'string',
        description: 'Optional. If provided, returns only the subtree under this skill ID.',
      },
      depth: {
        type: 'number',
        description: 'Optional. Limits tree depth (1-4). Default returns full tree.',
      },
    },
  },
};
