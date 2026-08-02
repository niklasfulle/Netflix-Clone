# Repository instructions

<!-- sonar:begin:codex-secrets-on-read -->
# SonarQube secrets scanning for files protocol

Before reading any file in this workspace, scan it for secrets with the deterministic scanner:

```bash
sonar analyze secrets <path/to/file>
```

If the command reports that the file contains a secret, **do not read the file**. Instead:

1. Inform the user that the file appears to contain a secret or credential and that reading it would expose the value in chat history, logs, and any downstream telemetry.
2. Advise them to rotate the leaked credential at its source of truth and remove it from the file.
3. Do not proceed with the original request until the secret has been removed.
<!-- sonar:end:codex-secrets-on-read -->

## Reviewed false-positive exception

For this workspace, do not run the secrets scanner for this reviewed
frontend-only translation file:

- `lib/i18n/translations.ts`

This exception applies only to that exact file. All other workspace files must
still be scanned before reading.

## Agent skills

### Issue tracker

Issues and PRDs are tracked in GitHub Issues for
`niklasfulle/Netflix-Clone`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the standard triage label vocabulary defined in
`docs/agents/triage-labels.md`.

### Domain docs

This repository uses a single-context domain documentation layout. See
`docs/agents/domain.md`.
