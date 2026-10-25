/** @jest-environment node */
import { currentAnalysisProfileId } from '../runtime-profile';
import { classificationInstructions } from '../profile';

test('keeps different model identities separate without changing the default profile', () => {
  const previous = process.env.VIDEO_ANALYSIS_MODEL_ID;
  try {
    delete process.env.VIDEO_ANALYSIS_MODEL_ID;
    const baseline = currentAnalysisProfileId();
    process.env.VIDEO_ANALYSIS_MODEL_ID = 'qwen3-vl-8b-q4km-macos-test';
    expect(currentAnalysisProfileId()).not.toBe(baseline);
    expect(currentAnalysisProfileId()).toMatch(/^qwen3-vl-8b-q4km-macos-test-/);
    process.env.VIDEO_ANALYSIS_MODEL_ID = '';
    expect(currentAnalysisProfileId()).toBe(baseline);
    process.env.VIDEO_ANALYSIS_MODEL_ID = 'invalid model name';
    expect(() => currentAnalysisProfileId()).toThrow('INVALID_MODEL_PROFILE');
  } finally { if (previous === undefined) delete process.env.VIDEO_ANALYSIS_MODEL_ID; else process.env.VIDEO_ANALYSIS_MODEL_ID = previous; }
});

test('uses optional local instructions at runtime and invalidates cached profiles when they change', () => {
  const previous = process.env.VIDEO_ANALYSIS_DOMAIN_INSTRUCTIONS;
  try {
    delete process.env.VIDEO_ANALYSIS_DOMAIN_INSTRUCTIONS;
    const baseline = currentAnalysisProfileId();
    process.env.VIDEO_ANALYSIS_DOMAIN_INSTRUCTIONS = 'Use local nature categories.';
    expect(classificationInstructions()).toContain('Use local nature categories.');
    const customized = currentAnalysisProfileId();
    expect(customized).not.toBe(baseline);
    expect(customized).not.toContain('nature');
    process.env.VIDEO_ANALYSIS_DOMAIN_INSTRUCTIONS = 'Use local travel categories.';
    expect(currentAnalysisProfileId()).not.toBe(customized);
  } finally { if (previous === undefined) delete process.env.VIDEO_ANALYSIS_DOMAIN_INSTRUCTIONS; else process.env.VIDEO_ANALYSIS_DOMAIN_INSTRUCTIONS = previous; }
});
