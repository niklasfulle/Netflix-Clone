'use client';

import { CalendarClock, DatabaseBackup, Loader2, ScanSearch } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useLanguage } from '@/components/providers/LanguageProvider';
import type { TranslationKey } from '@/lib/i18n/translations';

type ScheduleKind = 'BACKUP' | 'MEDIA_HEALTH';
type Schedule = {
  kind: ScheduleKind;
  enabled: boolean;
  weekdays: number[];
  time: string;
  timezone: 'Europe/Berlin' | 'UTC';
};

const endpoint = '/api/admin/jobs/schedules';
const days: Array<{ value: number; label: TranslationKey }> = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

async function jsonResponse(response: Response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || 'Weekly schedule could not be saved.');
  return body;
}

function replaceSchedule(schedules: Schedule[], updated: Schedule): Schedule[] {
  return schedules.map((schedule) => schedule.kind === updated.kind ? updated : schedule);
}

export function WeeklyJobSchedulePanel() {
  const { t } = useLanguage();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<ScheduleKind | null>(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    void fetch(endpoint, { cache: 'no-store' })
      .then(jsonResponse)
      .then((body) => {
        if (active) setSchedules(body.schedules);
      })
      .catch(() => {
        if (active) setError(t('Weekly schedules could not be loaded.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [t]);

  function update(kind: ScheduleKind, change: Partial<Schedule>) {
    setSchedules((current) => current.map((schedule) => (
      schedule.kind === kind ? { ...schedule, ...change } : schedule
    )));
  }

  function toggleDay(schedule: Schedule, day: number) {
    const selected = schedule.weekdays.includes(day);
    if (selected && schedule.weekdays.length === 1) return;
    update(schedule.kind, {
      weekdays: selected
        ? schedule.weekdays.filter((value) => value !== day)
        : [...schedule.weekdays, day],
    });
  }

  async function save(schedule: Schedule) {
    setSaving(schedule.kind);
    setError('');
    setMessage('');
    try {
      const body = await jsonResponse(await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      }));
      setSchedules((current) => replaceSchedule(current, body.schedule));
      setMessage(t('Weekly schedule saved.'));
    } catch {
      setError(t('Weekly schedule could not be saved.'));
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-white/10 bg-zinc-950/70 p-4 sm:p-6" aria-labelledby="weekly-schedules-title">
      <div className="flex items-start gap-3">
        <CalendarClock className="mt-1 h-5 w-5 text-red-400" aria-hidden="true" />
        <div>
          <h2 id="weekly-schedules-title" className="text-lg font-semibold text-white">{t('Weekly schedules')}</h2>
          <p className="mt-1 text-sm text-zinc-400">{t('Plan database backups and full media health scans for selected weekdays.')}</p>
        </div>
      </div>

      {loading && <p className="mt-5 text-sm text-zinc-400">{t('Loading weekly schedules...')}</p>}
      {!loading && (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {schedules.map((schedule) => {
            const backup = schedule.kind === 'BACKUP';
            const Icon = backup ? DatabaseBackup : ScanSearch;
            const title = backup ? t('Database backup') : t('Media health scan');
            const description = backup
              ? t('Creates and verifies an additional PostgreSQL backup. The host baseline remains active.')
              : t('Checks all published videos and thumbnails.');
            return (
              <article key={schedule.kind} className="rounded-xl border border-white/10 bg-zinc-900/70 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-3">
                    <Icon className="mt-0.5 h-5 w-5 text-zinc-300" aria-hidden="true" />
                    <div>
                      <h3 className="font-medium text-white">{title}</h3>
                      <p className="mt-1 text-sm text-zinc-400">{description}</p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-zinc-200">
                    <input
                      type="checkbox"
                      checked={schedule.enabled}
                      onChange={(event) => update(schedule.kind, { enabled: event.target.checked })}
                      className="h-4 w-4 accent-red-600"
                    />
                    {t('Enabled')}
                  </label>
                </div>

                <fieldset className="mt-5">
                  <legend className="text-sm font-medium text-zinc-200">{t('Weekdays')}</legend>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {days.map((day) => (
                      <label key={day.value} className="cursor-pointer">
                        <input
                          type="checkbox"
                          checked={schedule.weekdays.includes(day.value)}
                          onChange={() => toggleDay(schedule, day.value)}
                          className="peer sr-only"
                        />
                        <span className="inline-flex min-h-10 items-center rounded-lg border border-white/10 px-3 text-sm text-zinc-300 peer-checked:border-red-500 peer-checked:bg-red-500/15 peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-red-500">
                          {t(day.label)}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-zinc-300">
                    {t('Time')}
                    <input
                      type="time"
                      value={schedule.time}
                      onChange={(event) => update(schedule.kind, { time: event.target.value })}
                      className="mt-2 block min-h-11 w-full rounded-lg border border-white/10 bg-black px-3 text-white"
                    />
                  </label>
                  <label className="text-sm text-zinc-300">
                    {t('Time zone')}
                    <select
                      value={schedule.timezone}
                      onChange={(event) => update(schedule.kind, { timezone: event.target.value as Schedule['timezone'] })}
                      className="mt-2 block min-h-11 w-full rounded-lg border border-white/10 bg-black px-3 text-white"
                    >
                      <option value="Europe/Berlin">Europe/Berlin</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => void save(schedule)}
                  disabled={saving !== null}
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving === schedule.kind && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {t('Save schedule')}
                </button>
              </article>
            );
          })}
        </div>
      )}
      {message && <output className="mt-4 block text-sm text-emerald-300">{message}</output>}
      {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
    </section>
  );
}
