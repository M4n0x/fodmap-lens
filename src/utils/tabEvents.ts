type Listener = () => void;
const listeners: Record<string, Listener[]> = {};

export function onTabRepress(tab: string, fn: Listener) {
  (listeners[tab] ??= []).push(fn);
  return () => {
    listeners[tab] = listeners[tab].filter((l) => l !== fn);
  };
}

export function emitTabRepress(tab: string) {
  listeners[tab]?.forEach((fn) => fn());
}
