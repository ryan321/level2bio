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

function isUserTextMessage(entry: ConversationEntry): boolean {
  // Check if this is a real user-typed message (not a tool result)
  if (entry.type !== 'user') return false

  const content = entry.message?.content
  if (!content) return false

  // If it's a string, it's user text
  if (typeof content === 'string') {
    // Skip command messages and tool results
    if (content.includes('<command-message>') && content.includes('is running')) return false
    return content.trim().length > 0
  }

  // If it's an array, check for text blocks (not tool_result)
  if (Array.isArray(content)) {
    return content.some(block => block.type === 'text' && block.text && block.text.trim().length > 0)
  }

  return false
}

function hasToolContent(entry: ConversationEntry): boolean {
  const content = entry.message?.content
  if (!content || typeof content === 'string') return false

  return Array.isArray(content) && content.some(block =>
    block.type === 'tool_use' || block.type === 'tool_result'
  )
}

function formatUserContent(content: ContentBlock[] | string): string {
  if (typeof content === 'string') {
    // Skip command wrapper messages
    if (content.includes('<command-message>') && content.includes('is running')) {
      return ''
    }
    // Skip context continuation summaries
    if (content.includes('This session is being continued from a previous conversation')) {
      return ''
    }
    return content
  }

  // Only extract text blocks for user messages
  const textParts: string[] = []
  for (const block of content) {
    if (block.type === 'text' && block.text) {
      // Skip context continuation summaries
      if (block.text.includes('This session is being continued from a previous conversation')) {
        continue
      }
      textParts.push(block.text)
    }
  }
  return textParts.join('\n\n')
}

function formatAssistantText(content: ContentBlock[] | string): string {
  if (typeof content === 'string') return content

  const textParts: string[] = []
  for (const block of content) {
    if (block.type === 'text' && block.text) {
      textParts.push(block.text)
    }
  }
  return textParts.join('\n\n')
}

function formatToolCalls(content: ContentBlock[]): string {
  const parts: string[] = []
  for (const block of content) {
    if (block.type === 'tool_use') {
      parts.push(formatToolUse(block))
    }
  }
  return parts.join('\n')
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

  for (const entry of conv.entries) {
    const timestamp = new Date(entry.timestamp)
    const timeStr = timestamp.toLocaleTimeString()
    const content = entry.message?.content

    // Handle user messages - make them prominent
    if (isUserTextMessage(entry)) {
      const rawContent = typeof content === 'string' ? content :
        (Array.isArray(content) ? content.map(b => b.text || '').join('') : '')

      // Check if this is a context continuation summary
      if (rawContent.includes('This session is being continued from a previous conversation')) {
        lines.push(`---`)
        lines.push('')
        lines.push(`*📝 Context was compacted at ${timeStr} - conversation continued from summary*`)
        lines.push('')
        lines.push(`---`)
        lines.push('')
        continue
      }

      const userText = formatUserContent(content)
      if (userText.trim()) {
        lines.push(`---`)
        lines.push('')
        lines.push(`## 👤 USER`)
        lines.push(`*${timeStr}*`)
        lines.push('')
        lines.push(`> **${userText.split('\n')[0]}**`)  // First line bold
        if (userText.includes('\n')) {
          lines.push('>')
          lines.push(`> ${userText.split('\n').slice(1).join('\n> ')}`)
        }
        lines.push('')
        lines.push(`---`)
        lines.push('')
      }
      continue
    }

    // Handle assistant messages
    if (entry.type === 'assistant' && content) {
      // First, output any text content
      const assistantText = formatAssistantText(content)
      if (assistantText.trim()) {
        lines.push(`### 🤖 Assistant`)
        lines.push(`*${timeStr}*`)
        lines.push('')
        lines.push(assistantText)
        lines.push('')
      }

      // Then output tool calls separately
      if (Array.isArray(content)) {
        const toolCalls = formatToolCalls(content)
        if (toolCalls.trim()) {
          lines.push(`<details>`)
          lines.push(`<summary>🔧 Tool Calls</summary>`)
          lines.push('')
          lines.push(toolCalls)
          lines.push('')
          lines.push(`</details>`)
          lines.push('')
        }
      }
    }

    // Handle tool results
    if (entry.toolUseResult) {
      const toolOutput = formatToolResult(entry)
      if (toolOutput.trim()) {
        lines.push(`<details>`)
        lines.push(`<summary>📤 Tool Output</summary>`)
        lines.push('')
        lines.push(toolOutput)
        lines.push('')
        lines.push(`</details>`)
        lines.push('')
      }
    }
  }

  return lines.join('\n')
}

function conversationToChatMarkdown(conv: Conversation): string {
  const lines: string[] = []

  // Header
  lines.push(`# Chat: ${conv.slug}`)
  lines.push('')
  lines.push(`**Started:** ${conv.startTime.toISOString()}`)
  lines.push(`**Ended:** ${conv.endTime.toISOString()}`)
  lines.push(`**Duration:** ${Math.round((conv.endTime.getTime() - conv.startTime.getTime()) / 1000 / 60)} minutes`)
  lines.push('')
  lines.push('---')
  lines.push('')

  for (const entry of conv.entries) {
    const timestamp = new Date(entry.timestamp)
    const timeStr = timestamp.toLocaleTimeString()
    const content = entry.message?.content

    // Handle user messages
    if (isUserTextMessage(entry)) {
      const rawContent = typeof content === 'string' ? content :
        (Array.isArray(content) ? content.map(b => b.text || '').join('') : '')

      // Skip context continuation summaries
      if (rawContent.includes('This session is being continued from a previous conversation')) {
        continue
      }

      const userText = formatUserContent(content)
      if (userText.trim()) {
        lines.push(`**👤 User** *${timeStr}*`)
        lines.push('')
        lines.push(userText)
        lines.push('')
      }
      continue
    }

    // Handle assistant messages - only text, no tools
    if (entry.type === 'assistant' && content) {
      const assistantText = formatAssistantText(content)
      if (assistantText.trim()) {
        lines.push(`**🤖 Assistant** *${timeStr}*`)
        lines.push('')
        lines.push(assistantText)
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

  // Create detailed output directory
  const detailedDir = path.join(outputDir, 'detailed')
  const chatDir = path.join(outputDir, 'chat')
  fs.mkdirSync(detailedDir, { recursive: true })
  fs.mkdirSync(chatDir, { recursive: true })

  if (singleFile) {
    // Output as single files
    const allDetailed: string[] = []
    allDetailed.push('# Claude Code Conversations (Detailed)')
    allDetailed.push('')
    allDetailed.push(`Generated: ${new Date().toISOString()}`)
    allDetailed.push('')
    allDetailed.push('This version includes all tool calls and outputs.')
    allDetailed.push('')
    allDetailed.push('## Table of Contents')
    allDetailed.push('')

    const allChat: string[] = []
    allChat.push('# Claude Code Conversations (Chat)')
    allChat.push('')
    allChat.push(`Generated: ${new Date().toISOString()}`)
    allChat.push('')
    allChat.push('This version shows only user prompts and assistant responses.')
    allChat.push('')
    allChat.push('## Table of Contents')
    allChat.push('')

    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i]
      allDetailed.push(`${i + 1}. [${conv.slug}](#conversation-${conv.agentId})`)
      allChat.push(`${i + 1}. [${conv.slug}](#chat-${conv.agentId})`)
    }

    allDetailed.push('')
    allDetailed.push('---')
    allDetailed.push('')

    allChat.push('')
    allChat.push('---')
    allChat.push('')

    for (const conv of conversations) {
      allDetailed.push(conversationToMarkdown(conv))
      allDetailed.push('')
      allDetailed.push('---')
      allDetailed.push('')

      allChat.push(conversationToChatMarkdown(conv))
      allChat.push('')
      allChat.push('---')
      allChat.push('')
    }

    fs.writeFileSync(path.join(outputDir, 'all-detailed.md'), allDetailed.join('\n'))
    fs.writeFileSync(path.join(outputDir, 'all-chat.md'), allChat.join('\n'))
    console.log(`Written: ${outputDir}/all-detailed.md`)
    console.log(`Written: ${outputDir}/all-chat.md`)
  } else {
    // Output as separate files
    const detailedIndex: string[] = []
    detailedIndex.push('# Claude Code Conversations (Detailed)')
    detailedIndex.push('')
    detailedIndex.push(`Generated: ${new Date().toISOString()}`)
    detailedIndex.push('')
    detailedIndex.push('This version includes all tool calls and outputs.')
    detailedIndex.push('')
    detailedIndex.push('| # | Conversation | Started | Duration | Messages |')
    detailedIndex.push('|---|--------------|---------|----------|----------|')

    const chatIndex: string[] = []
    chatIndex.push('# Claude Code Conversations (Chat)')
    chatIndex.push('')
    chatIndex.push(`Generated: ${new Date().toISOString()}`)
    chatIndex.push('')
    chatIndex.push('This version shows only user prompts and assistant responses.')
    chatIndex.push('')
    chatIndex.push('| # | Conversation | Started | Duration |')
    chatIndex.push('|---|--------------|---------|----------|')

    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i]
      const filename = `${String(i + 1).padStart(3, '0')}-${conv.agentId}.md`
      const duration = Math.round((conv.endTime.getTime() - conv.startTime.getTime()) / 1000 / 60)

      detailedIndex.push(`| ${i + 1} | [${conv.slug}](./${filename}) | ${conv.startTime.toLocaleDateString()} ${conv.startTime.toLocaleTimeString()} | ${duration} min | ${conv.entries.length} |`)
      chatIndex.push(`| ${i + 1} | [${conv.slug}](./${filename}) | ${conv.startTime.toLocaleDateString()} ${conv.startTime.toLocaleTimeString()} | ${duration} min |`)

      // Write detailed version
      const detailedMarkdown = conversationToMarkdown(conv)
      fs.writeFileSync(path.join(detailedDir, filename), detailedMarkdown)

      // Write chat version
      const chatMarkdown = conversationToChatMarkdown(conv)
      fs.writeFileSync(path.join(chatDir, filename), chatMarkdown)
    }

    fs.writeFileSync(path.join(detailedDir, 'README.md'), detailedIndex.join('\n'))
    fs.writeFileSync(path.join(chatDir, 'README.md'), chatIndex.join('\n'))

    // Write main index
    const mainIndex: string[] = []
    mainIndex.push('# Claude Code Conversations')
    mainIndex.push('')
    mainIndex.push(`Generated: ${new Date().toISOString()}`)
    mainIndex.push('')
    mainIndex.push('## Versions')
    mainIndex.push('')
    mainIndex.push('- **[Detailed](./detailed/)** - Full conversations with all tool calls and outputs')
    mainIndex.push('- **[Chat](./chat/)** - Just user prompts and assistant responses')
    mainIndex.push('')
    fs.writeFileSync(path.join(outputDir, 'README.md'), mainIndex.join('\n'))

    console.log(`Written ${conversations.length} detailed files to ${detailedDir}`)
    console.log(`Written ${conversations.length} chat files to ${chatDir}`)
    console.log(`Index: ${outputDir}/README.md`)
  }
}

main()
