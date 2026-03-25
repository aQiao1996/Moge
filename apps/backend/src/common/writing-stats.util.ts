export interface CurrentWritingContent {
  id: number;
  version: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WritingContentVersion {
  contentId: number;
  version: number;
  content: string;
  createdAt: Date;
}

export interface WritingDeltaEvent {
  occurredAt: Date;
  words: number;
}

const WRITING_STATS_TIME_ZONE = 'Asia/Shanghai';

export function countWrittenWords(content: string): number {
  return content.replace(/\s/g, '').length;
}

export function getDateKeyInTimeZone(date: Date, timeZone = WRITING_STATS_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  if (!year || !month || !day) {
    throw new Error('无法生成日期键');
  }

  return `${year}-${month}-${day}`;
}

export function buildRecentDateKeySet(
  days: number,
  baseDate = new Date(),
  timeZone = WRITING_STATS_TIME_ZONE
): Set<string> {
  const keys = new Set<string>();

  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() - offset);
    keys.add(getDateKeyInTimeZone(date, timeZone));
  }

  return keys;
}

export function buildWritingDeltaEvents(
  currentContents: CurrentWritingContent[],
  versionRecords: WritingContentVersion[]
): WritingDeltaEvent[] {
  const versionGroups = new Map<number, WritingContentVersion[]>();

  for (const record of versionRecords) {
    const records = versionGroups.get(record.contentId) ?? [];
    records.push(record);
    versionGroups.set(record.contentId, records);
  }

  const events: WritingDeltaEvent[] = [];

  for (const content of currentContents) {
    const history = (versionGroups.get(content.id) ?? []).sort(
      (left, right) => left.version - right.version
    );

    if (content.version <= 1) {
      const words = countWrittenWords(content.content);
      if (words > 0) {
        events.push({ occurredAt: content.createdAt, words });
      }
      continue;
    }

    const snapshots = new Map<number, string>();
    for (const record of history) {
      snapshots.set(record.version, record.content);
    }
    snapshots.set(content.version, content.content);

    const initialContent = snapshots.get(1) ?? content.content;
    const initialWords = countWrittenWords(initialContent);
    if (initialWords > 0) {
      events.push({ occurredAt: content.createdAt, words: initialWords });
    }

    for (const record of history) {
      const nextContent = snapshots.get(record.version + 1);

      if (nextContent === undefined) {
        continue;
      }

      const delta = countWrittenWords(nextContent) - countWrittenWords(record.content);
      if (delta > 0) {
        events.push({ occurredAt: record.createdAt, words: delta });
      }
    }
  }

  return events.sort((left, right) => left.occurredAt.getTime() - right.occurredAt.getTime());
}
