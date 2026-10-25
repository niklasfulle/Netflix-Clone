"use client";

import Image from 'next/image';
import { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/LanguageProvider';
import fetcher from '@/lib/fetcher';
import { formatExampleTime } from '@/lib/video-examples/types';
import { diagnoseSample, type DiagnosticReason, type Visibility } from '@/lib/video-evaluation/inspection';
import type { readEvaluationEvidence } from '@/lib/video-evaluation/evidence';
import type { TranslationKey } from '@/lib/i18n/translations';

type Evidence = Awaited<ReturnType<typeof readEvaluationEvidence>>;
const reasonKeys: Record<DiagnosticReason, TranslationKey> = {
  CORRECT: 'Prediction agrees with the saved judgment.',
  SAMPLING: 'Not visible in the captured frames: review the sampling or marked interval.',
  JUDGMENT_CONFLICT: 'Visible in the frames but marked absent: review the original judgment.',
  BELOW_THRESHOLD: 'The model returned this name below the confidence threshold.',
  SELECTION: 'A model pass returned this category, but final selection removed it.',
  ABSTAINED: 'The model abstained from a usable prediction for this category.',
  OUTSIDE_VOCABULARY: 'This name was not in the matching vocabulary. Review the vocabulary limit and alternative names.',
  NOT_RETURNED: 'No exact German or English name match. Review visibility, recognition and alternative names.',
  FALSE_POSITIVE: 'The model predicted a category marked absent. Review the frames and original judgment.',
};
const outcomes = { tp: 'Correctly recognized', fn: 'Missed', fp: 'False suggestion', tn: 'Correctly absent' } as const;
const errorKeys: Record<string, TranslationKey> = {
  INSPECTION_CONFLICT: 'This frame review changed elsewhere. Reload before saving.',
  EVIDENCE_UNAVAILABLE: 'Original frames are not available for this sample. Start a new comparison.',
};

export function VideoEvaluationEvidence({ evaluationId, sampleId }: Readonly<{ evaluationId: string; sampleId: string }>) {
  const { t } = useLanguage();
  const [saved, setSaved] = useState(false);
  const url = `/api/admin/video-evaluations/${encodeURIComponent(evaluationId)}/samples/${encodeURIComponent(sampleId)}`;
  const { data, error, mutate } = useSWR<Evidence>(url, fetcher, { revalidateOnFocus: false });
  return <div className="space-y-3 border-t border-zinc-800 pt-4">
    {error && <p role="alert" className="text-sm text-red-300">{t('Frame evidence could not be loaded.')} <Button type="button" onClick={() => { void mutate(); }}>{t('Retry')}</Button></p>}
    {!data && !error && <output className="text-sm text-zinc-400">{t('Loading original frames...')}</output>}
    {saved && <output className="text-sm text-emerald-300">{t('Frame review saved.')}</output>}
    {data && <EvidenceContent key={`${sampleId}:${data.inspectionVersion}`} evidence={data} url={url} onSaved={async () => { await mutate(); setSaved(true); }} onEdited={() => setSaved(false)} />}
  </div>;
}

function EvidenceContent({ evidence, url, onSaved, onEdited }: Readonly<{ evidence: Evidence; url: string; onSaved(): Promise<void>; onEdited(): void }>) {
  const { t, locale } = useLanguage();
  const [visibility, setVisibility] = useState<Record<string, Visibility>>(() => Object.fromEntries(evidence.inspection.map(judgment => [judgment.categoryId, judgment.visibility])));
  const [threshold, setThreshold] = useState(evidence.threshold);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const judgments = Object.entries(visibility).map(([categoryId, value]) => ({ categoryId, visibility: value }));
  const diagnostics = diagnoseSample(evidence.labels, evidence.tags, evidence.diagnostics, threshold, judgments);
  const isPreview = threshold !== evidence.threshold;
  async function save() {
    setPending(true); setError('');
    try {
      const response = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: evidence.inspectionVersion, judgments }) });
      const result = await response.json();
      if (!response.ok) { setError(t(errorKeys[result.error] ?? 'Frame review could not be saved.')); return; }
      await onSaved();
    } catch { setError(t('Frame review could not be saved.')); }
    finally { setPending(false); }
  }
  return <div className="space-y-5">
    <div><h3 className="font-semibold text-zinc-100">{t('Original analyzed frames')}</h3><p className="mt-1 text-xs leading-5 text-zinc-400">{t('These exact images were sent to the model. Frame judgments help separate sampling and recognition errors without changing the saved category labels.')}</p></div>
    <div className="grid gap-3 lg:grid-cols-3">{evidence.frames.map(frame => <figure key={frame.index} className="min-w-0 overflow-hidden rounded-xl border border-zinc-700 bg-black"><a href={frame.url} target="_blank" rel="noreferrer" className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400" title={t('Open full-size frame')}><Image src={frame.url} alt={`${t('Analyzed frame')} ${frame.index + 1}`} width={768} height={432} unoptimized className="aspect-video w-full object-contain" /></a><figcaption className="bg-zinc-900 px-3 py-2 text-xs tabular-nums text-zinc-300">{frame.index + 1} · {formatExampleTime(frame.atSeconds)}</figcaption></figure>)}</div>
    <div className="rounded-xl border border-zinc-700 bg-zinc-950/50 p-4"><label className="block text-sm text-zinc-200">{t('Preview confidence threshold')}: <strong className="tabular-nums">{Math.round(threshold * 100)} %</strong><input type="range" min="0" max="1" step="0.01" value={threshold} onChange={event => setThreshold(Number(event.target.value))} className="mt-3 block w-full accent-red-500" /></label><p className="mt-2 text-xs leading-5 text-zinc-400">{t('Preview only: saved results and analysis settings remain unchanged. Missing model predictions cannot be recovered by lowering the threshold.')}</p>{isPreview && <Button type="button" onClick={() => setThreshold(evidence.threshold)} className="mt-3">{t('Reset threshold preview')}</Button>}<p className="mt-3 text-sm text-zinc-300">{t('Correctly recognized')}: {diagnostics.filter(label => label.outcome === 'tp').length} · {t('Missed')}: {diagnostics.filter(label => label.outcome === 'fn').length} · {t('False suggestion')}: {diagnostics.filter(label => label.outcome === 'fp').length}</p></div>
    <div className="space-y-3"><h3 className="font-semibold text-zinc-100">{t('Check visibility in these frames')}</h3>{diagnostics.map(label => <div key={label.categoryId} className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><h4 className="min-w-0 break-words font-medium text-zinc-200">{locale === 'de' ? label.name : label.nameEn || label.name}</h4><span className={`text-xs ${label.outcome === 'fn' || label.outcome === 'fp' ? 'text-amber-300' : 'text-emerald-300'}`}>{t(outcomes[label.outcome])}{label.confidence !== null && ` · ${Math.round(label.confidence * 100)} %`}</span></div><p className="text-xs text-zinc-500">{t('Saved judgment')}: {t(label.verdict === 'PRESENT' ? 'Present in this segment' : 'Absent from this segment')}</p><label className="block text-sm text-zinc-300">{t('Visible in the analyzed frames?')}<select value={visibility[label.categoryId] ?? 'UNCERTAIN'} disabled={pending} onChange={event => { setVisibility(current => ({ ...current, [label.categoryId]: event.target.value as Visibility })); onEdited(); }} className="mt-2 min-h-11 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 text-white"><option value="UNCERTAIN">{t('Not checked or uncertain')}</option><option value="VISIBLE">{t('Visible in the frames')}</option><option value="NOT_VISIBLE">{t('Not visible in the frames')}</option></select></label><p className="text-xs leading-5 text-zinc-400">{t(reasonKeys[label.reason])}</p></div>)}</div>
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
    <Button type="button" disabled={pending} onClick={() => { void save(); }} className="min-h-11 bg-red-600 text-white hover:bg-red-500">{t(pending ? 'Saving...' : 'Save frame review')}</Button>
    <details className="rounded-xl border border-zinc-800 p-4"><summary className="cursor-pointer text-sm font-medium text-zinc-200">{t('Model responses and name matching')}</summary><p className="mt-3 text-xs leading-5 text-zinc-400">{t('Discovery, vocabulary matching and final selection are shown separately. Names are matched exactly after normalization in German or English; synonyms need manual review.')}</p><p className="mt-2 text-xs text-zinc-400">{t('Matching vocabulary')}: {evidence.diagnostics.matchingVocabulary.length} · {t('Final category limit')}: {evidence.diagnostics.selectionLimit}</p><div className="mt-4 space-y-4">{([{ name: 'Independent discovery', value: evidence.diagnostics.discovered }, { name: 'Existing category matching', value: evidence.diagnostics.matched }, { name: 'Final predictions', value: evidence.tags }] as const).map(pass => <div key={pass.name}><h4 className="text-sm font-medium text-zinc-200">{t(pass.name)}</h4><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-black/40 p-3 text-xs leading-5 text-zinc-400">{JSON.stringify(pass.value, null, 2)}</pre></div>)}<details><summary className="cursor-pointer text-xs text-zinc-400">{t('Matching vocabulary')}</summary><p className="mt-2 break-words text-xs leading-5 text-zinc-400">{evidence.diagnostics.matchingVocabulary.join(' · ') || '—'}</p></details></div></details>
  </div>;
}
