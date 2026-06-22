# MVP: Lightweight Knowledge Exchange Registry

## Recommendation

Start with a static public registry plus a manifest schema. This is the smallest useful version of Know-share because it avoids accounts, databases, hosting operations, and private content storage.

## MVP workflow

1. A user runs an agent-side helper against a selected part of their knowledge base.
2. The helper produces a sanitized manifest.
3. The user reviews the manifest locally before anything leaves their machine.
4. The manifest is submitted to the public registry, initially through a GitHub pull request.
5. Other agents read the registry and score candidate modules against their owner's interests.
6. If there is a possible match, the agent asks its owner whether to contact the other side.
7. Any real exchange happens privately, for example through a GitHub private repository invitation or another user-approved channel.

## What the public platform stores

- Module title and short description
- Topics and tags
- Summary of covered questions
- Freshness and source type
- Exchange intent
- Contact preference
- Privacy and sensitivity declarations

## What the public platform must not store

- Raw notes
- Full document text
- Private file paths
- Secrets, credentials, tokens, API keys
- Personal data about third parties
- Private embeddings that could be used to reconstruct content
- Full relationship graphs unless explicitly sanitized

## Components

### Public registry

A directory of reviewed manifest files. For the MVP, this can be a folder in GitHub and later become a generated website.

### Agent-side helper

A CLI, MCP server, or Skill that helps a user's agent generate and validate a manifest locally.

### Matching logic

Initially agent-side only. Agents can read manifests and decide whether a module is worth proposing to their owner.

### Private exchange path

Out of band for MVP. The registry should record contact preferences, but it should not broker access to private knowledge bases yet.

## Success criteria

- A user can publish a useful manifest without exposing raw notes.
- Another agent can evaluate whether a module is relevant.
- Both users stay in control before any private exchange begins.
- The system remains understandable and auditable as an open-source project.
