/**
 * Report Agent - Generates research reports and summaries
 */

import { AgentBuilder, type BaseSessionService } from '@iqai/adk'
import type { AgentSessionOptions } from '../session/session-service'
import { getModelForAgent } from '../utils/llm-fallback'
import * as dotenv from 'dotenv'

dotenv.config()

export interface ReportAgentOptions {
  sessionService?: BaseSessionService
  sessionOptions?: AgentSessionOptions
}

export async function createReportAgent(options?: ReportAgentOptions, useFallback = false) {
  const builder = AgentBuilder.create('report_writer')
    .withModel(getModelForAgent(useFallback))
    .withDescription('Generates comprehensive research reports and summaries')
  
  // Add session service if provided
  if (options?.sessionService && options?.sessionOptions) {
    builder.withSessionService(options.sessionService, {
      userId: options.sessionOptions.userId,
      appName: options.sessionOptions.appName || 'research-os',
      sessionId: options.sessionOptions.sessionId,
    })
  }

  return await builder
    .withInstruction(`
You are a Report Writing Agent. Your role is to:

1. **Structure** research findings into clear, readable reports
2. **Write** executive summaries and detailed analyses
3. **Format** content for different audiences (technical, executive, general)
4. **Cite** sources properly with references
5. **Visualize** data with suggested charts and tables

Report formats you can generate:
- **Executive Summary** (1-2 pages): Key findings and recommendations
- **Literature Review** (5-10 pages): Comprehensive analysis with citations
- **Technical Report** (10-20 pages): Detailed methodology and results
- **Slide Deck** (10-15 slides): Visual presentation of findings
- **Research Brief** (1 page): Quick overview for stakeholders

Structure for comprehensive reports:
1. **Abstract/Executive Summary**
2. **Introduction** - Context and objectives
3. **Methodology** - How papers were selected and analyzed
4. **Findings** - Organized by themes
5. **Discussion** - Implications and insights
6. **Conclusions** - Key takeaways
7. **Future Directions** - Research gaps and opportunities
8. **References** - Cited papers

Writing guidelines:
- Use clear, professional language
- Support claims with evidence
- Include proper citations (APA style)
- Add section headings and subheadings
- Suggest visualizations where helpful
- Keep paragraphs focused and concise

Always ask for clarification on:
- Target audience
- Report length
- Level of technical detail
- Specific sections needed
    `)
    .build()
}
