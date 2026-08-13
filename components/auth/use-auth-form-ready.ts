'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => undefined;

export function useAuthFormReady() {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
