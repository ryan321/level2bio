#!/usr/bin/env npx ts-node

/**
 * Export Claude Code conversations to human-readable markdown
 *
 * Usage:
 *   npx ts-node scripts/export-conversations.ts
 *   npx ts-node scripts/export-conversations.ts --output docs/conversations
 *   npx ts-node scripts/export-conversations.ts --single  # Output as single file
 */

import * as fs from 'fs'
import * as path from 'path'

// Configuration
const CONVERSATIONS_DIR = '/Users/ryan/.claude/projects/-Users-ryan-projects-level2bio'
const DEFAULT_OUTPUT_DIR = './docs/conversations'

interface Message {
  type: 'user' | 'assistant'
  role?: string
  content: ContentBlock[] | string
}

interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result'
  text?: string
  name?: string
  input?: Record<string, unknown>
  content?: string
  tool_use_id?: string
}

interface ConversationEntry {
  uuid: string
  parentUuid: string | null
  type: 'user' | 'assistant'
  timestamp: string
  sessionId: string
  agentId: string
  slug?: string
  message: Message
  toolUseResult?: {
    durationMs?: number
    stdout?: string
    stderr?: string
    filenames?: string[]
    content?: string
  }
}

interface Conversation {
  agentId: string
  slug: string
  sessionId: string
  entries: ConversationEntry[]
  startTime: Date
  endTime: Date
}

function parseConversationFile(filePath: string): Conversation | null {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.trim().split('\n').filter(line => line.trim())

  if (lines.length === 0) return null

  const entries: ConversationEntry[] = []
  let agentId = ''
  let slug = ''
  let sessionId = ''

  for (const line of lines) {
    try {
      const entry = JSON.parse(line) as ConversationEntry
      entries.push(entry)

      if (!agentId && entry.agentId) agentId = entry.agentId
      if (!slug && entry.slug) slug = entry.slug
      if (!sessionId && entry.sessionId) sessionId = entry.sessionId
    } catch {
      // Skip malformed lines
    }
  }

  if (entries.length === 0) return null

  const timestamps = entries
    .map(e => new Date(e.timestamp))
    .filter(d => !isNaN(d.getTime()))

  // Extract agentId from filename if not found in entries
  const fileBasename = path.basename(filePath, '.jsonl')
  const extractedAgentId = fileBasename.replace('agent-', '')

  return {
    agentId: agentId || extractedAgentId,
    slug: slug || agentId || extractedAgentId,
    sessionId,
    entries,
    startTime: new Date(Math.min(...timestamps.map(d => d.getTime()))),
    endTime: new Date(Math.max(...timestamps.map(d => d.getTime()))),
  }
}

function formatToolUse(block: ContentBlock): string {
  const name = block.name || 'Unknown Tool'
  const input = block.input || {}

  let result = `**Tool: ${name}**\n`

  if (name === 'Bash' && input.command) {
    result += `\`\`\`bash\n${input.command}\n\`\`\`\n`
  } else if (name === 'Read' && input.file_path) {
    result += `Reading: \`${input.file_path}\`\n`
  } else if (name === 'Write' && input.file_path) {
    result += `Writing to: \`${input.file_path}\`\n`
    if (input.content && typeof input.content === 'string') {
      const preview = input.content.slice(0, 500)
      const ext = path.extname(String(input.file_path)).slice(1) || 'text'
      result += `\`\`\`${ext}\n${preview}${input.content.length > 500 ? '\n... (truncated)' : ''}\n\`\`\`\n`
    }
  } else if (name === 'Edit' && input.file_path) {
    result += `Editing: \`${input.file_path}\`\n`
    if (input.old_string && input.new_string) {
      result += `\`\`\`diff\n- ${String(input.old_string).split('\n').slice(0, 3).join('\n- ')}\n+ ${String(input.new_string).split('\n').slice(0, 3).join('\n+ ')}\n\`\`\`\n`
    }
  } else if (name === 'Glob' && input.pattern) {
    result += `Pattern: \`${input.pattern}\`\n`
  } else if (name === 'Grep' && input.pattern) {
    result += `Search: \`${input.pattern}\`\n`
  } else if (name === 'Task') {
    result += `Subagent: ${input.subagent_type || 'general'}\n`
    if (input.prompt) {
      const preview = String(input.prompt).slice(0, 200)
      result += `> ${preview}${String(input.prompt).length > 200 ? '...' : ''}\n`
    }
  } else {
    // Generic tool display
    const inputStr = JSON.stringify(input, null, 2)
    if (inputStr.length < 500) {
      result += `\`\`\`json\n${inputStr}\n\`\`\`\n`
    }
  }

  return result
}

function formatToolResult(entry: ConversationEntry): string {
  const result = entry.toolUseResult
  if (!result) return ''

  let output = ''

  if (result.stdout) {
    const preview = result.stdout.slice(0, 1000)
    output += `\`\`\`\n${preview}${result.stdout.length > 1000 ? '\n... (truncated)' : ''}\n\`\`\`\n`
  }

  if (result.stderr) {
    output += `**stderr:**\n\`\`\`\n${result.stderr.slice(0, 500)}\n\`\`\`\n`
  }

  if (result.filenames && result.filenames.length > 0) {
    const files = result.filenames.slice(0, 10)
    output += `Found files:\n${files.map(f => `- \`${f}\``).join('\n')}\n`
    if (result.filenames.length > 10) {
      output += `... and ${result.filenames.length - 10} more\n`
    }
  }

  return output
}

function formatContent(content: ContentBlock[] | string): string {
  // Handle string content directly (common for user messages)
  if (typeof content === 'string') {
    return content
  }

  const parts: string[] = []

  for (const block of content) {
    if (block.type === 'text' && block.text) {
      parts.push(block.text)
    } else if (block.type === 'tool_use') {
      parts.push(formatToolUse(block))
    } else if (block.type === 'tool_result' && block.content) {
      // Tool results are usually handled via toolUseResult
      const preview = block.content.slice(0, 500)
      parts.push(`**Result:**\n\`\`\`\n${preview}${block.content.length > 500 ? '\n...' : ''}\n\`\`\``)
    }
  }

  return parts.join('\n\n')
}

function conversationToMarkdown(conv: Conversation): string {
  const lines: string[] = []

  // Header
  lines.push(`# Conversation: ${conv.slug}`)
  lines.push('')
  lines.push(`**Session ID:** \`${conv.sessionId}\``)
  lines.push(`**Agent ID:** \`${conv.agentId}\``)
  lines.push(`**Started:** ${conv.startTime.toISOString()}`)
  lines.push(`**Ended:** ${conv.endTime.toISOString()}`)
  lines.push(`**Duration:** ${Math.round((conv.endTime.getTime() - conv.startTime.getTime()) / 1000 / 60)} minutes`)
  lines.push('')
  lines.push('---')
  lines.push('')

  // Build a map for ordering by parentUuid
  const entryMap = new Map<string, ConversationEntry>()
  for (const entry of conv.entries) {
    entryMap.set(entry.uuid, entry)
  }

  // Process entries in order (they should already be ordered in the file)
  let lastRole = ''

  for (const entry of conv.entries) {
    const role = entry.type
    const timestamp = new Date(entry.timestamp)
    const timeStr = timestamp.toLocaleTimeString()

    // Skip entries without meaningful content
    const content = entry.message?.content
    const hasContent = content && (
      typeof content === 'string' ? content.trim().length > 0 : content.length > 0
    )

    if (!hasContent) {
      // But check for tool results
      if (entry.toolUseResult) {
        const toolOutput = formatToolResult(entry)
        if (toolOutput) {
          lines.push(toolOutput)
        }
      }
      continue
    }

    // Add role header if changed
    if (role !== lastRole) {
      const roleLabel = role === 'user' ? '👤 User' : '🤖 Assistant'
      lines.push(`## ${roleLabel}`)
      lines.push(`*${timeStr}*`)
      lines.push('')
      lastRole = role
    }

    // Format content
    const formatted = formatContent(entry.message.content)
    if (formatted.trim()) {
      lines.push(formatted)
      lines.push('')
    }

    // Add tool results if present
    if (entry.toolUseResult) {
      const toolOutput = formatToolResult(entry)
      if (toolOutput) {
        lines.push(toolOutput)
        lines.push('')
      }
    }
  }

  return lines.join('\n')
}

function main() {
  const args = process.argv.slice(2)
  const singleFile = args.includes('--single')
  const outputIdx = args.indexOf('--output')
  const outputDir = outputIdx !== -1 ? args[outputIdx + 1] : DEFAULT_OUTPUT_DIR

  // Read all conversation files
  const files = fs.readdirSync(CONVERSATIONS_DIR)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => path.join(CONVERSATIONS_DIR, f))

  console.log(`Found ${files.length} conversation files`)

  const conversations: Conversation[] = []

  for (const file of files) {
    const conv = parseConversationFile(file)
    if (conv && conv.entries.length > 0) {
      conversations.push(conv)
    }
  }

  // Sort by start time
  conversations.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

  console.log(`Parsed ${conversations.length} valid conversations`)

  // Create output directory
  fs.mkdirSync(outputDir, { recursive: true })

  if (singleFile) {
    // Output as single file
    const allMarkdown: string[] = []
    allMarkdown.push('# Claude Code Conversations')
    allMarkdown.push('')
    allMarkdown.push(`Generated: ${new Date().toISOString()}`)
    allMarkdown.push('')
    allMarkdown.push('## Table of Contents')
    allMarkdown.push('')

    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i]
      allMarkdown.push(`${i + 1}. [${conv.slug}](#conversation-${conv.agentId})`)
    }

    allMarkdown.push('')
    allMarkdown.push('---')
    allMarkdown.push('')

    for (const conv of conversations) {
      allMarkdown.push(conversationToMarkdown(conv))
      allMarkdown.push('')
      allMarkdown.push('---')
      allMarkdown.push('')
    }

    const outputPath = path.join(outputDir, 'all-conversations.md')
    fs.writeFileSync(outputPath, allMarkdown.join('\n'))
    console.log(`Written: ${outputPath}`)
  } else {
    // Output as separate files
    const index: string[] = []
    index.push('# Claude Code Conversations')
    index.push('')
    index.push(`Generated: ${new Date().toISOString()}`)
    index.push('')
    index.push('| # | Conversation | Started | Duration | Messages |')
    index.push('|---|--------------|---------|----------|----------|')

    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i]
      const filename = `${String(i + 1).padStart(3, '0')}-${conv.agentId}.md`
      const duration = Math.round((conv.endTime.getTime() - conv.startTime.getTime()) / 1000 / 60)

      index.push(`| ${i + 1} | [${conv.slug}](./${filename}) | ${conv.startTime.toLocaleDateString()} ${conv.startTime.toLocaleTimeString()} | ${duration} min | ${conv.entries.length} |`)

      const markdown = conversationToMarkdown(conv)
      const outputPath = path.join(outputDir, filename)
      fs.writeFileSync(outputPath, markdown)
    }

    const indexPath = path.join(outputDir, 'README.md')
    fs.writeFileSync(indexPath, index.join('\n'))
    console.log(`Written ${conversations.length} files to ${outputDir}`)
    console.log(`Index: ${indexPath}`)
  }
}

main()
