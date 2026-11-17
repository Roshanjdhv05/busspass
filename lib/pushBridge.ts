"use client";
/**
 * Thin bridge that fires a browser push notification whenever the in-app
 * notification system emits an important event.
 *
 * Call `pushIfGranted(title, body, url)` from anywhere in the client code.
 * It is a no-op if the browser doesn't support notifications or permission
 * hasn't been granted.
 */
export async function pushIfGranted(
  title: string,
  body: string,
  url = "/"
) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const icon = "/icon-192.png";

  // Prefer service-worker notification (shows even when tab is in background)
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await reg.showNotification(title, {
        body,
        icon,
        badge: icon,
        data: { url },
      } as any);
      return;
    } catch { /* fall through */ }
  }
  // Fallback: Notification API
  new Notification(title, { body, icon });
}
