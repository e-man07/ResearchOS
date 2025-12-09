# Gemini LLM Fallback Support

This package now supports automatic fallback to Google Gemini when OpenAI rate limits are hit.

## How It Works

1. **Primary Model**: Uses OpenAI (GPT-4o) by default
2. **Rate Limit Detection**: Automatically detects OpenAI rate limit errors (429, TPM limits, etc.)
3. **Automatic Fallback**: Switches to Gemini when rate limits are detected
4. **Workflow Continuity**: Subsequent agents in the workflow will also use Gemini after fallback is triggered

## Environment Variables

Add these to your `.env` file:

```bash
# Primary LLM (OpenAI)
LLM_MODEL=gpt-4o
# or
OPENAI_MODEL=gpt-4o

# Fallback LLM (Gemini)
FALLBACK_LLM_MODEL=gemini-2.0-flash-exp
# or
GEMINI_MODEL=gemini-2.0-flash-exp

# Enable/disable fallback (default: true)
ENABLE_LLM_FALLBACK=true
```

## Supported Gemini Models

The ADK supports various Gemini models. Common options:
- `gemini-2.0-flash-exp` (recommended, fast)
- `gemini-1.5-pro`
- `gemini-1.5-flash`

## Usage

### Automatic Fallback in Workflows

The `executeResearchWorkflow` function automatically handles fallback:

```typescript
import { executeResearchWorkflow } from '@research-os/agents'

const result = await executeResearchWorkflow({
  query: "Deep learning",
  workflowType: 'full'
})
// If OpenAI rate limits are hit, automatically switches to Gemini
```

### Manual Fallback

You can also manually specify fallback when creating agents:

```typescript
import { createSearchAgent } from '@research-os/agents'

// Use fallback from the start
const { runner } = await createSearchAgent({}, true)
```

### Rate Limit Detection

Check if an error is a rate limit error:

```typescript
import { isRateLimitError } from '@research-os/agents'

try {
  await agent.ask(prompt)
} catch (error) {
  if (isRateLimitError(error)) {
    // Handle rate limit - fallback will be automatic in workflows
    console.log('Rate limit detected, switching to Gemini...')
  }
}
```

## Implementation Details

- **Error Detection**: Detects 429 errors, "Rate limit" messages, TPM (tokens per minute) errors
- **State Management**: Once fallback is triggered in a workflow, all subsequent agents use Gemini
- **No Configuration Required**: Works out of the box with default settings
- **Backward Compatible**: Existing code continues to work without changes

## Notes

- Make sure you have a valid Google API key configured for Gemini
- The fallback is automatic and transparent - workflows continue seamlessly
- Rate limit detection works for both OpenAI API errors and ADK internal errors

