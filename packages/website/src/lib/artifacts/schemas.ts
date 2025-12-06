import { z } from 'zod';

/**
 * Supported artifact types
 */
export const ArtifactTypeSchema = z.enum([
  'code',           // Generic code block with syntax highlighting
  'html',           // HTML that can be previewed
  'react',          // React component that can be rendered
  'svg',            // SVG graphics
  'mermaid',        // Mermaid diagrams
  'markdown',       // Markdown content
]);
export type ArtifactType = z.infer<typeof ArtifactTypeSchema>;

/**
 * Supported programming languages for syntax highlighting
 */
export const LanguageSchema = z.enum([
  'javascript',
  'typescript',
  'jsx',
  'tsx',
  'html',
  'css',
  'json',
  'python',
  'sql',
  'bash',
  'markdown',
  'yaml',
  'xml',
  'svg',
]);
export type Language = z.infer<typeof LanguageSchema>;

/**
 * An artifact block from Claude's response
 */
export const ArtifactSchema = z.object({
  id: z.string().min(1),
  type: ArtifactTypeSchema,
  title: z.string().min(1),
  language: LanguageSchema.optional(),
  content: z.string(),
});
export type Artifact = z.infer<typeof ArtifactSchema>;

/**
 * Result of parsing a message that may contain artifact blocks
 */
export interface ParsedArtifacts {
  textSegments: string[];
  artifacts: Artifact[];
  invalidBlocks: string[];
}
