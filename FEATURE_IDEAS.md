## Nightstand — Feature Ideas Backlog

This file is a lightweight backlog for product ideas — things we might build next, plus longer-term bets.
Nothing here is a commitment; it is a parking lot so we do not lose good ideas or their rationale.

---

### Core ideas to prioritize next

#### 1. Mark-as-read, streaks, and GitHub-like graph

- **What it is**: Let users explicitly mark an article as **read** and track their reading activity over time.
  - Simple per-article state: _saved_ → _read_.
  - Aggregate that into **daily/weekly streaks** (e.g. “You’ve read at least 1 article for 5 days in a row”).
  - Visualize activity as a **GitHub-style contribution heatmap** (calendar grid where intensity = articles read).
- **Why it matters**:
  - Helps build a **reading habit**, not just a saving habit.
  - Gives users a **brag-worthy artifact** they can screenshot or share (“look at my reading streak”).
  - Turns quiet solo reading into something slightly social + motivating without needing a full social network.
- **Sharing angle**:
  - Make the streak graph **sharable**:
    - Public page (e.g. `xarticlecurator.com/u/{username}/streak`).
    - Or a generated image / card for Twitter/X or other socials.
  - Optional privacy controls: private by default, with explicit opt-in to share.

#### 2. Sharable reading lists

- **What it is**: Allow users to turn a subset of their saved +/or read articles into a **curated list** they can share.
  - Examples: “My weekend reading stack”, “What I learned this week”, “Stuff to discuss with friends”.
  - A list is essentially a named collection of articles with optional intro/notes.
- **Why it matters**:
  - Matches how you personally want to use the tool: **share what you’ve gone through with friends/mates**.
  - Makes it easier to **spark discussion** later (“let’s chat about this list on Sunday”).
  - Turns private consumption into **lightweight curation**, which is valuable on its own.
- **Possible formats**:
  - Public URL with a clean, simple reading list view.
  - Export options: copy as Markdown, maybe later “export as newsletter draft”.
  - Future: allow attaching a short summary or one-line takeaway to each item in the list.

---

### Other future ideas (parking lot)

These are ideas we like but are not committing to yet. They can be pulled into the “Core ideas” section as priorities change.

- **Weekly reading goals & stats**
  - Let users set a goal (e.g. **X articles** or **Y minutes** per week) and show progress + completion rate.
  - Surface simple stats: articles saved vs read, average read time, weeks hit vs missed.

- **Estimated read time per article**
  - Show a rough “**N min read**” badge for each article based on word count or external services.
  - Helps users decide what to tackle now vs later (especially useful for weekend planning).

- **Manual + lightweight automatic “read” detection**
  - Manual “Mark as read” is the source of truth.
  - Optionally augment with simple signals (e.g. scrolled to near bottom, tab active for at least N seconds) to **suggest** that something might be read, without being creepy or over-precise.

- **One-line takeaway / notes per article**
  - After finishing an article, prompt for a **single sentence takeaway** (“What stuck with you?”).
  - Over time this becomes a personal knowledge trail and can enrich sharable lists (“My note on this piece”).

- **Tags, topics, and collections**
  - Allow tagging articles with topics (e.g. `ai`, `career`, `writing`) or placing them into named collections.
  - Makes it easier to find things later and to build **themed reading lists** (“AI weekend”, “Career reset pack”).

- **AI summaries and highlights**
  - Generate short, opinionated summaries for long or dense articles to reduce friction to start reading.
  - Potentially extract **key quotes / highlights** that the user can save or share.

- **“Weekend mode” or focused reading sessions**
  - A mode that pulls together your **saved but unread** items into a focused session view.
  - Could include timeboxing (e.g. “45-minute reading block”), distraction-free layout, and progress through the stack.

- **Friend activity / light social layer (later)**
  - Very lightweight social features: see selected lists or top reads from **close friends**, not a full-blown network.
  - Could start with: “Follow a friend’s public reading lists” or “See what this friend read this week”.

---

### Prioritization notes

- **Next up candidates**:
  - Mark-as-read + streaks + GitHub-like graph (with optional sharing).
  - Sharable reading lists for friends/mates and future discussions.
- **Explicitly parked for later**:
  - Weekly goals & stats, estimated read time, auto-read hints, one-line takeaways, tags/collections, AI summaries,
    weekend mode, and friend activity/social layer.
  - These should be revisited after core reading habit + sharing features feel solid.

