import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import useSWR from 'swr';
import { VideoEvaluationEvidence } from '../VideoEvaluationEvidence';
jest.mock('swr');
jest.mock('@/components/providers/LanguageProvider', () => ({ useLanguage: () => ({ t: (key: string) => key, locale: 'en' }) }));
const refresh = jest.fn();
const tags = { tags: [{ name: 'Natur', nameEn: 'Nature', confidence: 0.5 }, { name: 'Stadt', nameEn: 'City', confidence: 0.7 }], uncertain: false };
const evidence = { sampleId: 'sample-123', model: 'neutral-profile', threshold: 0.65, startSeconds: 0, endSeconds: 6,
  frames: [0, 1, 2].map(index => ({ index, atSeconds: index + 1, sha256: 'digest', url: `/api/admin/video-evaluations/evaluation-123/samples/sample-123/frames/${index}` })),
  labels: [{ categoryId: 'nature', name: 'Natur', nameEn: 'Nature', verdict: 'PRESENT' }, { categoryId: 'city', name: 'Stadt', nameEn: 'City', verdict: 'ABSENT' }], tags,
  diagnostics: { schemaVersion: 1, discovered: tags, matched: tags, matchingVocabulary: ['Natur', 'Stadt'], selectionLimit: 5 }, inspectionVersion: 2, inspection: [],
};
beforeEach(() => { jest.clearAllMocks(); jest.mocked(useSWR).mockReturnValue({ data: evidence, mutate: refresh } as never); global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ version: 3 }) }); });
test('loads private originals directly and previews a threshold without writing settings or judgments', () => {
  render(<VideoEvaluationEvidence evaluationId="evaluation-123" sampleId="sample-123" />);
  expect(screen.getAllByRole('img')).toHaveLength(3);
  expect(screen.getAllByRole('img')[0]).toHaveAttribute('src', evidence.frames[0].url);
  fireEvent.change(screen.getByRole('slider'), { target: { value: '0.4' } });
  expect(screen.getByText(/Correctly recognized: 1/)).toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
test('saves only the independent visibility review with its concurrency version', async () => {
  render(<VideoEvaluationEvidence evaluationId="evaluation-123" sampleId="sample-123" />);
  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'NOT_VISIBLE' } });
  expect(screen.getByText(/Not visible in the captured frames/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Save frame review' }));
  await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/admin/video-evaluations/evaluation-123/samples/sample-123', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ version: 2, judgments: [{ categoryId: 'nature', visibility: 'NOT_VISIBLE' }] }) })));
  await waitFor(() => expect(screen.getByText('Frame review saved.')).toBeInTheDocument());
});
