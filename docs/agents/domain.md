# Domain documentation

This repository uses a single-context domain documentation layout.

## Before exploring

Read the following resources when they exist and are relevant to the task:

- `CONTEXT.md` at the repository root for the ubiquitous language.
- ADRs under `docs/adr/` for established architectural decisions.

If either location does not exist, proceed silently. Domain Modeling creates
these resources lazily when terminology or a consequential decision is
actually resolved.

## Layout

```text
/
|-- CONTEXT.md
|-- docs/
|   `-- adr/
`-- app/, components/, actions/, lib/, ...
```

`CONTEXT.md` is a glossary, not a specification or implementation diary. It
defines canonical domain terms and identifies ambiguous or rejected synonyms.

An architecture decision record (ADR) belongs in `docs/adr/` only when the
decision is consequential, difficult to reverse, and surprising without its
context.

## Working rules

- Use the terminology defined in `CONTEXT.md` in issue titles, plans, tests,
  interfaces, and implementation discussions.
- If a required concept is missing or ambiguous, use Domain Modeling before
  inventing new vocabulary.
- Surface conflicts with an existing ADR explicitly instead of silently
  overriding the recorded decision.
- Keep implementation details out of the glossary and put durable
  architectural trade-offs in ADRs.
