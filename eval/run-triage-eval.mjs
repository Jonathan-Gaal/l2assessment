// Runs eval/triage-cases.json through the app's real triage pipeline (live Groq call,
// key from .env.local) and prints a Markdown results table plus raw JSON.
// Usage: node eval/run-triage-eval.mjs [output.json]
import { createServer } from 'vite'
import { readFile, writeFile } from 'node:fs/promises'

const cases = JSON.parse(await readFile(new URL('./triage-cases.json', import.meta.url)))
const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' })

try {
  const { categorizeMessage } = await server.ssrLoadModule('/src/utils/llmHelper.js')
  const { calculateUrgency } = await server.ssrLoadModule('/src/utils/urgencyScorer.js')
  const { getRecommendedAction } = await server.ssrLoadModule('/src/utils/templates.js')

  const results = []
  for (const c of cases) {
    const ai = await categorizeMessage(c.message)
    const urgency = calculateUrgency(c.message)
    results.push({ ...c, ...ai, urgency, action: getRecommendedAction(ai.category, urgency) })
  }

  const cell = (s) => String(s ?? '').replace(/\s+/g, ' ').replace(/\|/g, '\\|')
  const mark = (got, want) => (got === want ? '✅' : '❌')
  console.log('| # | Category | Label | Urgency | Source | Recommended action |')
  console.log('|---|---|---|---|---|---|')
  for (const r of results) {
    console.log(`| ${r.id} | ${mark(r.category, r.expectCategory)} ${cell(r.category)} | ${cell(r.label)} | ${mark(r.urgency, r.expectUrgency)} ${r.urgency} | ${r.source} | ${cell(r.action)} |`)
  }
  const hits = results.filter((r) => r.category === r.expectCategory).length
  console.log(`\nCategory correct: ${hits}/${results.length}`)
  if (process.argv[2]) await writeFile(process.argv[2], JSON.stringify(results, null, 2))
} finally {
  await server.close()
}
