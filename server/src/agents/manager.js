/**
 * Agent Manager — routes tasks to the correct specialist agent.
 *
 * Supported agent types: "research" | "coder" | "automation"
 *
 * Usage:
 *   import { runAgent } from './agents/manager.js'
 *   const result = await runAgent('research', 'What is RAG in AI?', { model: 'gpt-4o' })
 */

import { researchAgent } from './researchAgent.js'
import { coderAgent } from './coderAgent.js'
import { automationAgent } from './automationAgent.js'

/** @typedef {'research' | 'coder' | 'automation'} AgentType */

/**
 * Dispatch a task to the named agent.
 *
 * @param {AgentType} agent   Which agent should handle the task.
 * @param {string}    task    The task description or question.
 * @param {object}    [opts]  Optional overrides forwarded to the agent (model, apiKey, baseUrl).
 * @returns {Promise<string>} The agent's response text.
 */
export async function runAgent(agent, task, opts = {}) {
  switch (agent) {
    case 'research':
      return researchAgent(task, opts)

    case 'coder':
      return coderAgent(task, opts)

    case 'automation':
      return automationAgent(task, opts)

    default:
      throw new Error(`Unknown agent: "${agent}". Supported agents: research, coder, automation.`)
  }
}

/** List of registered agent names — used for input validation. */
export const AGENT_TYPES = ['research', 'coder', 'automation']
