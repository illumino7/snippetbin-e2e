/**
 * Maps file extensions to syntax highlighter language identifiers.
 */

const EXTENSION_MAP: Record<string, string> = {
  // Markdown
  md: 'markdown',
  mdx: 'markdown',
  // Web
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  // JavaScript / TypeScript
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  // Systems
  go: 'go',
  rs: 'rust',
  c: 'c',
  h: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  cs: 'csharp',
  // JVM
  java: 'java',
  kt: 'kotlin',
  // Scripting
  py: 'python',
  rb: 'ruby',
  php: 'php',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  // Data / Config
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  xml: 'xml',
  sql: 'sql',
  // Other
  dockerfile: 'docker',
  makefile: 'makefile',
  txt: 'text',
}

/**
 * Extract the language identifier for syntax highlighting from a filename.
 * Falls back to 'text' if the extension is unrecognized.
 */
export function getLanguageFromFilename(filename: string): string {
  if (!filename) return 'text'

  // Handle special filenames without extensions
  const lowerName = filename.toLowerCase()
  if (lowerName === 'dockerfile') return 'docker'
  if (lowerName === 'makefile') return 'makefile'

  const parts = filename.split('.')
  if (parts.length < 2) return 'text'

  const ext = parts[parts.length - 1].toLowerCase()
  return EXTENSION_MAP[ext] || 'text'
}

/**
 * Check if a filename represents a markdown file.
 */
export function isMarkdown(filename: string): boolean {
  const lang = getLanguageFromFilename(filename)
  return lang === 'markdown'
}
