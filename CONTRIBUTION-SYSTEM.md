# Compact Contribution System

## Philosophy

Developers love to contribute. Stack Overflow, npm, and Hugging Face proved that the right
framing — "share what you learned" rather than "do work for us" — drives genuine participation
without incentives. The sharp edge you just debugged is exactly what the next developer needs.
Compact captures that moment.

Field trial records are first-party observed knowledge. They cover what documentation never does:
undocumented behavior, version-specific gotchas, interactions between libraries that neither
library's docs mention. No lab can replicate this. Only a community can.

---

## Phase 1 — Email submission (launch now)

### What to ask for

Keep the barrier as low as possible. One email, one record, plain text is fine.
The review process structures it — contributors shouldn't need to know the schema.

**Submission email address:** `contribute@usecompact.dev`

**Ask contributors to include:**

```
What were you trying to do?
What library or tool were you using? (e.g. n8n, Prisma, Traefik)
What version?
What went wrong or what did you discover?
What was the fix or procedure?
Any code snippets?
```

That's it. During review you structure it into the format Compact stores.

### Review process

1. Email arrives at `contribute@usecompact.dev`
2. Skim for obvious spam or off-topic content
3. If valid — structure the submission into Compact’s stored format
4. Set `source_url: field-trial/YYYY-MM-DD`
5. Set `git_repo` to the closest matching repo slug (e.g. `n8n-io/n8n`)
6. Publish to the knowledge cache after review
7. Reply to contributor confirming it was added

Target turnaround: 48 hours. Speed of acknowledgment matters more than speed of insertion.

### The reply template

```
Hi [name],

Your field trial for [library] has been added to the Compact knowledge cache.

When an agent queries Compact for "[search_text]", your procedure will surface
as a result. You've saved the next developer who hits this the same debugging time.

Thanks for contributing.

— Compact
```

Short, specific, human. No marketing. Just confirmation that it mattered.

---

## Phase 2 — Web form (add when email volume justifies it)

A simple form at `usecompact.dev/contribute` pre-structures the submission:

```
Library / tool *
Version
What were you trying to do? *
What did you discover or what was the fix? *
Code snippet (optional)
Your email (optional — for attribution and followup)
```

On submit:
- Validate required fields client-side
- Submission queued for review
- Auto-reply confirming receipt

---

## Phase 3 — X (Twitter) submission

The shortest possible path to contributing — a tweet. No form, no email, just share
what you learned in public and tag Compact.

**The format to promote:**

```
Just spent 2 hours debugging [library] + [library].
Fix: [one-liner description]
[code snippet or thread]

@usecompact #compactfieldtrial
```

**How it works:**

- Monitor `#compactfieldtrial` and `@usecompact` mentions
- High-signal tweets (code snippets, specific error messages, version numbers) go into review
- Contributor gets a reply: "Added to Compact — your fix is now in the cache"
- Public acknowledgment — visible to their followers

This works because:
- Developers already tweet about debugging wins
- It costs them nothing extra to add a hashtag
- Public acknowledgment is its own reward
- The thread format maps naturally to procedure steps

Mentions are monitored on a regular schedule. High-signal tweets (code snippets, specific error messages, version numbers) are queued for review, and contributors receive a public acknowledgment reply — closing the loop and signaling to other developers that contributions are noticed and valued.

---

## Vetting standards

Field trial records are trusted because they're vetted. Maintain the bar.

**Approve if:**
- Describes a real, reproducible procedure or fix
- Specific enough to act on (library name, version, steps)
- Not already well-covered in official docs
- Code snippet is correct and relevant

**Reject if:**
- Describes expected behavior already in the docs
- Too vague to act on ("update your dependencies")
- Code snippet has obvious errors
- Applies only to a highly specific internal setup unlikely to recur

**Ask for clarification if:**
- The fix is clear but the trigger condition isn't
- Version is missing and it likely matters
- Code snippet is partial and context is needed

Rejection is not failure — reply with what's missing and invite resubmission.
Most rejections become approvals with one follow-up.

---

## Source convention

All field trial records use:

```json
{
  "source_url": "field-trial/YYYY-MM-DD",
  "git_repo": "owner/repo"
}
```

`git_repo` uses the closest matching GitHub repo slug for the primary library
even if the record covers multiple tools. This makes filtering work cleanly.

For records covering infrastructure combinations with no single repo:

```json
{
  "git_repo": "docker/n8n-traefik"
}
```

Use a descriptive slug that makes the filter obvious. These records are never
overwritten by automated imports from official docs — they are preserved permanently.

---

## Future: credits and incentives

Not at launch. Watch contribution patterns for 60–90 days first.

Questions to answer before designing incentives:
- Who contributes without incentives? (These are your most valuable community members)
- What do they contribute? (This tells you where the knowledge gaps are)
- What do they want in return? (Ask them directly — don't assume)

A credits system that rewards the wrong behavior is worse than no credits system.
Build it around observed patterns, not anticipated ones.

---

## What to put on the website

A single paragraph on `usecompact.dev/contribute`:

> Every developer has debugged something that took hours and wasn't in any docs.
> That knowledge belongs in Compact so the next person doesn't lose the same time.
>
> Submit a field trial — describe what you hit, what the fix was, and any relevant
> code. If it's a real sharp edge we'll add it to the cache within 48 hours.
>
> Email: contribute@usecompact.dev
> Twitter: tag @usecompact with #compactfieldtrial

No promise of rewards. No gamification. Just "this mattered and we'll confirm it did."

---

## Metrics to track from day one

- Submissions per week (email + X)
- Approval rate
- Time to review
- Search hits on field trial records vs doc-sourced records
- Which field trial records get the highest similarity scores in real queries

The last metric is the most important. A field trial record that surfaces in 500 searches
per month is worth more than 10 doc-sourced records that rarely match anything. That ratio
tells you where community knowledge is outperforming extraction.
