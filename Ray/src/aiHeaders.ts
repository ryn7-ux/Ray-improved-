// Reads the user's configured AI provider/keys/models from localStorage.
// Shared in one place so every AI call across the app builds its headers
// the same way — previously this was copy-pasted in DietView, FitnessView,
// and WorkoutPlanner, which meant a single stale-model fix had to be applied
// in four different places. Import this instead of redefining it locally.
export function getAIHeaders(): Record<string, string> {
  const get = (key: string, fallback = '') =>
    localStorage.getItem(key)?.replace(/"/g, '') || fallback;

  return {
    'Content-Type': 'application/json',
    'x-ai-provider': get('lifehub_ai_provider', 'gemini'),
    'x-gemini-api-key': get('lifehub_gemini_api_key'),
    'x-gemini-model': get('lifehub_gemini_model', 'gemini-2.5-flash'),
    'x-openai-api-key': get('lifehub_openai_api_key'),
    'x-openai-model': get('lifehub_openai_model', 'gpt-4o-mini'),
    'x-anthropic-api-key': get('lifehub_anthropic_api_key'),
    'x-anthropic-model': get('lifehub_anthropic_model', 'claude-3-5-haiku-20241022'),
  };
}
