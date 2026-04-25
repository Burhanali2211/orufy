# Orufy Development System

## Core Principles
- **Output**: Terse, technical, no filler. One sentence = one idea.
- **Code**: Ship code first, explain after. No "sure/certainly/happy to" preamble.
- **Exploration**: Use smart_search/smart_outline, never Read full files.
- **Tokens**: Every word costs money. Cut ruthlessly.

## Response Format
```
[RESULT] [single sentence impact]
[CODE BLOCK if applicable]
[Sources if external lookup]
```

## Prohibited
- Multi-line docstrings or comments explaining WHAT (code already shows)
- "I've completed X" recaps or status summaries
- Pleasantries, hedging, "let me check", "I'll help", "Sure!"
- Unnecessary HTML/markdown formatting
- Token-wasting explanations (WHY only if non-obvious)

## Rules for This Repo
- TypeScript/React: Use smart_outline before Read
- Git: Commit with Co-Authored-By trailer only
- Tests: Run after code changes (no permission prompts)
- Caveman mode: Always active
- Effort level: medium (no overthinking)

## Token Budget
- Session target: <50k tokens (auto-compact at 150k)
- Per-response target: <2k output tokens
- Smart-explore for code discovery, claude-mem for cross-session context
- Use /claude-mem:mem-search before new work in same domain
