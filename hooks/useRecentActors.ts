import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "netflix:recent-actors:v1";

function readRecentActors(): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(stored)) return [];
    return [...new Set(stored.filter((id): id is string => typeof id === "string" && id.length > 0))].slice(0, 3);
  } catch {
    return [];
  }
}

/** Remember additions to the cast, including actors created inline, but not initial form values. */
export function useRecentActors(selectedActorIds: readonly string[]) {
  const [recentActorIds, setRecentActorIds] = useState<string[]>([]);
  const history = useRef<string[]>([]);
  const previousSelection = useRef(selectedActorIds);

  useEffect(() => {
    history.current = readRecentActors();
    setRecentActorIds(history.current);
  }, []);

  useEffect(() => {
    const added = selectedActorIds.filter((id) => !previousSelection.current.includes(id));
    previousSelection.current = selectedActorIds;
    if (added.length === 0) return;
    history.current = [...new Set([...added.toReversed(), ...history.current])].slice(0, 3);
    setRecentActorIds(history.current);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.current));
    } catch {
      // Keep the current session usable when browser storage is unavailable.
    }
  }, [selectedActorIds]);

  return recentActorIds;
}
