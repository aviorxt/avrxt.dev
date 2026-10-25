import test from 'node:test';
import assert from 'node:assert/strict';
import { runTerminalCommand, TERMINAL_PAGES, terminalCompletions, COMMAND_LIMIT } from '../src/lib/terminal';

test('terminal navigates only to explicitly listed public routes', () => {
  assert.equal(runTerminalCommand('open profile', TERMINAL_PAGES).navigate, 'https://me.avrxt.dev');
  assert.equal(runTerminalCommand('open /contact', TERMINAL_PAGES).navigate, '/contact');
  for (const target of ['javascript:alert(1)', 'https://evil.example', '//evil.example', '/me/admin', '/auth/start', '/api/health', '/docs/admin', '/contact?next=//evil.example', '/%2e%2e/me/admin', '/storage', '/\\evil.example']) {
    const result = runTerminalCommand(`open ${target}`, TERMINAL_PAGES);
    assert.equal(result.navigate, undefined, target);
    assert.equal(result.error, true, target);
  }
});
test('terminal treats shell syntax and HTML as inert input and bounds command size', () => {
  const payload = '<img src=x onerror=alert(1)><script>alert(1)</script>';
  assert.deepEqual(runTerminalCommand(`echo ${payload}`, TERMINAL_PAGES), { text: payload });
  for (const value of ['constructor', '__proto__', 'sudo rm -rf /', 'curl https://evil.example', 'open profile;alert(1)', 'profile && contact', 'help\nopen profile', '\u0000help', 'a'.repeat(COMMAND_LIMIT + 1)]) {
    const result = runTerminalCommand(value, TERMINAL_PAGES);
    assert.equal(result.navigate, undefined); assert.equal(result.error, true);
  }
});
test('terminal directory search, aliases and autocomplete expose public destinations', () => {
  assert.equal(runTerminalCommand('me', TERMINAL_PAGES).pages?.[0].href, 'https://me.avrxt.dev');
  assert.ok(runTerminalCommand('ls legal', TERMINAL_PAGES).pages?.every(page => page.group === 'legal'));
  assert.equal(runTerminalCommand('search privacy', TERMINAL_PAGES).pages?.length, 2);
  assert.deepEqual(terminalCompletions('open prof', TERMINAL_PAGES), ['open profile']);
  assert.equal(runTerminalCommand('clear', TERMINAL_PAGES).clear, true);
  assert.equal(runTerminalCommand('history', TERMINAL_PAGES).history, true);
  assert.equal(runTerminalCommand('search', TERMINAL_PAGES).error, true);
});
