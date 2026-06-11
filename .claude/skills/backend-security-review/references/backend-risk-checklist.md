# Backend Risk Checklist

## Contents

- Review prompts
- Risk categories
- Severity cues
- Evidence rules
- Non-findings

## Review Prompts

Ask these while reading the diff:

- What new or changed input can an attacker control?
- Which identity is trusted at each boundary?
- What authorization check proves this caller can access this object, tenant, or action?
- What data can leave the system through API responses, logs, errors, queues, or webhooks?
- What secrets, tokens, headers, cookies, keys, or credentials are read, stored, logged, or transmitted?
- What new dependency, config, route, permission, or network target was introduced?

## Risk Categories

Authentication:

- Login, session, token validation, refresh, logout, password reset, MFA, API keys, service accounts.
- Check token audience, issuer, expiry, replay, rotation, storage, and revocation assumptions.

Authorization:

- Object ownership, role checks, tenant boundaries, admin paths, feature flags, batch actions, indirect object references.
- Look for checks performed only in UI, client, route names, or caller-provided parameters.

Input and injection:

- SQL/NoSQL queries, ORM escape hatches, shell calls, templates, regex, XML, YAML, JSON parsing, path joins.
- Check allowlists, parameterization, encoding, parser limits, and unsafe deserialization.

Network and SSRF:

- User-controlled URLs, redirects, webhooks, metadata services, internal admin ports, DNS rebinding, proxy behavior.
- Check schemes, host allowlists, redirects, timeout, response size, and private-address blocking.

Data exposure:

- API response shape, serialization defaults, debug fields, logs, metrics, traces, error messages, exports, cache keys.
- Check PII, secrets, internal IDs, tenant data, and sensitive derived fields.

Dependencies and config:

- New packages, lockfile changes, CORS, cookies, TLS, rate limits, CSP, debug mode, environment variables.
- Check production defaults and whether config changes affect every environment.

## Severity Cues

Escalate severity when:

- The attacker needs no account or only a low-privilege account.
- The issue crosses tenant, user, or privilege boundaries.
- The impact includes secrets, credentials, mass data, money movement, code execution, or internal network access.
- The path is reachable from a public API or automated integration.

De-escalate when:

- Exploitability depends on admin-only access.
- The affected asset is low sensitivity.
- Existing upstream controls clearly block the path.
- The issue is a style or hardening concern without a concrete exploit path.

## Evidence Rules

Each finding should include:

- Exact file and line when available.
- Changed behavior or missing guard.
- Attacker capability.
- Data/control boundary crossed.
- Why existing checks are insufficient.
- Test or verification gap.

## Non-Findings

Do not report as findings:

- Generic best-practice advice with no local exploit path.
- Hypothetical framework CVEs without checking versions or reachability.
- Duplicates of the same root cause unless the fix differs.
- Pure code style, maintainability, or performance issues unless they create a security impact.
