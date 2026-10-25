/** @jest-environment node */
import { currentAnalysisProfileId } from '../runtime-profile';
import { classificationInstructions } from '../profile';

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
