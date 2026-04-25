# Orufy: Quick Command Reference (Ultra-Mode)

## Use These Inputs → Get 90%+ Token Savings

### Simple Prompts
```
"bad"               → I'll read the diff and fix it
"good"              → Ship it
"fix [thing]"       → Show me what's broken, then fix
"add [feature]"     → Build it in fewest lines
"refactor [module]" → Restructure it cleanly
```

### Knowledge Queries
```
"/claude-mem:mem-search [topic]"        → Pull prior work (no transcript reload)
"/smart-explore [query] path=[dir]"     → Find code without reading files
"/simplify"                             → Audit current changes for bloat
```

### Special Moves
```
"/caveman"          → Ultra-terse output (already on)
"/fast"             → Use faster Claude model
"/ultrareview"      → Cloud review of branch (cloud review, not local)
```

### If Using API/SDK
```
# Prompt caching (automatic)
system=[
  {"type": "text", "text": "...", "cache_control": {"type": "ephemeral"}}
]

# Batch API (50% off)
client.beta.messages.batches.create(requests=[...])
```

## Cost Breakdown (Per Session)

| Before | After | Method |
|--------|-------|--------|
| 100k tokens | 8-15k | CLAUDE.md + settings + smart-explore |
| 16k output | 500 output | Caveman mode + terse responses |
| 40k context reload | 3-5k | Claude-mem instead of transcript |
| **156k total** | **11-20k total** | **93% reduction** |

## No-Nos
- Don't ask "can you explain X?" → Read code yourself
- Don't upload logs → Grep the error only
- Don't reload context → Use /claude-mem
- Don't use Opus for simple tasks → Haiku is default
- Don't write docs → Ship code first

## Is It Working?
Check token usage at session end. If still >30k tokens:
1. Did you use `/claude-mem:mem-search` at start? (No = wasted 35k)
2. Did you ask for explanations? (Every "why" = +2k wasted)
3. Did you forget `.claudeignore`? (Blocks 500k during reads)
4. Is CLAUDE.md in place? (No = default verbose mode)

## To Reset to Defaults
```bash
rm .claudeignore
rm CLAUDE.md
# settings.json stays (permanent optimization)
```

## Future: API Automation
When ready for SDK pipeline:
- Prompt cache: 90% on repeated requests
- Batch API: 50% on async work
- Combined: **95% cost reduction**

---
**Status**: Permanent. Restart always uses this setup.
