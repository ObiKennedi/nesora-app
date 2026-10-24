// File: nesora-app/src/lib/push.web.ts
// Push notifications are phone-only; the web preview does nothing.

export async function registerForPush(): Promise<string | null> {
  return null;
}

export async function unregisterPush(): Promise<void> {}
