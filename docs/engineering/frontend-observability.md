# Frontend observability contract

Sprint 0 intentionally does not connect a third-party monitoring account. A
future adapter must expose this provider-neutral contract:

```ts
interface FrontendTelemetry {
  captureException(error: unknown, context?: Record<string, unknown>): void;
  captureMessage(message: string, context?: Record<string, unknown>): void;
  setUser(user: { id: string } | null): void;
  recordWebVital(metric: {
    name: 'CLS' | 'INP' | 'LCP';
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
  }): void;
}
```

The adapter must be a no-op when disabled, load after the application becomes
interactive, identify releases by commit SHA, and scrub email addresses,
names, access tokens, URL query strings, form values and API response bodies.
Production activation requires a retention policy, sampling policy, alert
ownership, CSP updates, and a privacy review. No telemetry may run before any
legally required consent.
