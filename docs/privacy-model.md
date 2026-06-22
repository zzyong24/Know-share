# Privacy Model

Know-share should be designed around one rule: the public registry contains only discovery metadata, never the user's private knowledge base.

## Privacy boundaries

### Local-only

These stay on the user's machine unless the user explicitly shares them in a private exchange:

- Raw notes and documents
- Full excerpts
- Embeddings derived from private content
- Private repository URLs
- Internal tags that reveal sensitive context
- Names, identities, or relationship details about third parties

### Public manifest

These can be published after user review:

- High-level topic labels
- Short module summary
- Covered question list
- Time range and freshness
- Source categories
- Exchange expectations
- Contact method chosen by the user
- Sensitivity level and redaction notes

### Private exchange

Actual knowledge exchange should happen after both owners approve it. A practical first path is a GitHub private repository, where one owner can invite the other as a collaborator for a selected sanitized package or curated subset.

## Required consent points

1. Before manifest generation touches a folder or vault section.
2. Before the generated manifest is submitted publicly.
3. Before a contact request is sent.
4. Before any private repository, file, or note subset is shared.

## Redaction checklist

- Remove names, emails, phone numbers, addresses, and account IDs.
- Remove secrets, tokens, credentials, and private links.
- Replace specific people or companies with generalized roles when needed.
- Avoid long verbatim excerpts.
- Keep examples synthetic unless the user explicitly approves otherwise.
- Mark sensitive domains such as health, finance, legal, workplace, or relationships.

## Matching without leakage

Matching should happen primarily on the consuming agent's side. The registry exposes enough metadata for discovery, while each user's private interests and ranking logic can remain local.
