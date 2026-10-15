export function copilotGenerationError(error) {
  const data = error?.response?.data || {};
  if (data.code === 'TEMPORAL_SCOPE_VIOLATION') {
    const detail = data.detail || data.error || 'The generated dates or required milestones did not pass validation.';
    return 'No timeline was returned because calendar validation failed. ' + detail;
  }
  if (error?.code === 'ERR_EMPTY_COPILOT_REPLY') return 'No output was returned. Please try generating again.';
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') return 'Generation timed out. Try again after confirming the backend is available.';
  if (error?.code === 'ERR_NETWORK') return 'The generation service could not be reached. Check that the local backend is running.';
  return data.detail || data.error || error?.message || 'Generation failed. Please try again.';
}
export function readCopilotReply(result) {
  const content = [result?.message?.content, result?.answer].find(value => typeof value === 'string' && value.trim());
  if (!content) {
    const error = new Error('The generation service returned no output.');
    error.code = 'ERR_EMPTY_COPILOT_REPLY';
    throw error;
  }
  return content;
}
