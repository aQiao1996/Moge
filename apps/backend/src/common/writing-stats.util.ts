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

export function countWrittenWords(content: string): number {
  return content.replace(/\s/g, '').length;
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
