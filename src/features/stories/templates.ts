// Work story templates with guided prompts

export type TemplateType = 'project' | 'role_highlight' | 'lessons_learned'

export interface TemplatePrompt {
  key: string
  label: string
  placeholder: string
  hint?: string
}

export interface Template {
  type: TemplateType
  name: string
  description: string
  prompts: TemplatePrompt[]
}

export const templates: Record<TemplateType, Template> = {
  project: {
    type: 'project',
    name: 'Project Deep-Dive',
    description: 'Walk through a specific project from problem to outcome',
    prompts: [
      {
        key: 'problem',
        label: 'What problem were you solving?',
        placeholder: 'Describe the challenge or opportunity that led to this project...',
        hint: 'Set the context. What was broken, missing, or needed?',
      },
      {
        key: 'approach',
        label: 'What was your approach?',
        placeholder: 'Explain how you tackled the problem...',
        hint: 'Focus on your decisions and reasoning, not just what you did.',
      },
      {
        key: 'outcome',
        label: 'What was the outcome?',
        placeholder: 'Share the results and impact...',
        hint: 'Be specific. Numbers, feedback, or tangible changes are great.',
      },
      {
        key: 'learnings',
        label: 'What did you learn?',
        placeholder: 'Reflect on what you took away from this experience...',
        hint: 'What would you do differently? What surprised you?',
      },
    ],
  },
  role_highlight: {
    type: 'role_highlight',
    name: 'Role Highlight',
    description: 'Showcase your impact in a specific role or position',
    prompts: [
      {
        key: 'role',
        label: 'What was your role?',
        placeholder: 'Describe your position and responsibilities...',
        hint: 'Go beyond the job title. What did you actually own?',
      },
      {
        key: 'impact',
        label: 'What impact did you have?',
        placeholder: 'Share the difference you made...',
        hint: 'Think about what changed because you were there.',
      },
      {
        key: 'challenges',
        label: 'What challenges did you overcome?',
        placeholder: 'Describe obstacles you faced and how you handled them...',
        hint: 'This shows resilience and problem-solving ability.',
      },
    ],
  },
  lessons_learned: {
    type: 'lessons_learned',
    name: 'Lessons Learned',
    description: 'Share a meaningful experience and what it taught you',
    prompts: [
      {
        key: 'situation',
        label: 'What happened?',
        placeholder: 'Describe the situation or experience...',
        hint: 'Set the scene. What were the circumstances?',
      },
      {
        key: 'lesson',
        label: 'What did you learn?',
        placeholder: 'Share the insight or lesson you gained...',
        hint: 'Be honest. The best lessons often come from mistakes.',
      },
      {
        key: 'application',
        label: 'How have you applied it?',
        placeholder: 'Explain how this lesson has shaped your approach...',
        hint: 'Show growth and self-awareness.',
      },
    ],
  },
}

export const templateList = Object.values(templates)

export function getTemplate(type: TemplateType): Template {
  return templates[type]
}
