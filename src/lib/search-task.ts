export async function waitForSearchTask(
  load: (timeoutMs: number) => Promise<{ status: string }>,
  options: { timeoutMs?: number; now?: () => number; pause?: (ms: number) => Promise<void> } = {},
) {
  const now = options.now || Date.now;
  const pause = options.pause || ((ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms)));
  const deadline = now() + (options.timeoutMs ?? 25_000);
  let delay = 250;
  while (now() < deadline) {
    const task = await load(Math.min(5000, deadline - now()));
    if (task.status === 'published') return;
    const remaining = deadline - now();
    if (remaining <= 0) break;
    await pause(Math.min(delay, remaining));
    delay = Math.min(delay * 1.5, 1500);
  }
  throw new Error('Search indexing task timed out');
}
