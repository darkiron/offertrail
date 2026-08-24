import { http, HttpResponse } from 'msw';
import { server } from './support/server';

test('the test harness intercepts backend contracts without a live API', async () => {
  server.use(
    http.get('http://localhost/health', () =>
      HttpResponse.json({ status: 'ok' }),
    ),
  );

  const response = await fetch('http://localhost/health');

  expect(response.ok).toBe(true);
  await expect(response.json()).resolves.toEqual({ status: 'ok' });
});
