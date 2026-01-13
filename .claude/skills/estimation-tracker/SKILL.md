# Estimation Tracker Skill

Track estimated vs actual build time for AI agent implementation phases to improve future estimations.

## Commands

### `/start-phase <phase-name>`
Start timing a phase. Records the current timestamp.

**Usage:** `/start-phase Phase 3: Core Hook`

### `/end-phase`
End timing the current phase. Records duration and updates estimations.md.

**Usage:** `/end-phase`

### `/estimations`
Show estimation accuracy summary and insights.

**Usage:** `/estimations`

---

## Instructions

### When `/start-phase` is invoked:

1. Parse the phase name from the arguments
2. Look up the estimated time from the project's `plan.md` file
3. Record in memory (or a temp file at `.claude/current-phase.json`):
   ```json
   {
     "project": "voice-dictation",
     "phase": "Phase 3: Core Hook",
     "estimated": "1-2 hours",
     "startTime": "2026-01-13T10:30:00Z"
   }
   ```
4. Confirm to user: "Started timing **Phase 3: Core Hook** (estimated: 1-2 hours)"

### When `/end-phase` is invoked:

1. Read the current phase from `.claude/current-phase.json`
2. Calculate actual duration from start to now
3. Append to `Projects/{project}/estimations.md`:
   ```markdown
   | Phase | Estimated | Actual | Variance |
   |-------|-----------|--------|----------|
   | Phase 3: Core Hook | 1-2 hours | 47 min | -43% (faster) |
   ```
4. Delete `.claude/current-phase.json`
5. Report: "Completed **Phase 3: Core Hook** in 47 minutes (estimated 1-2 hours, 43% faster)"

### When `/estimations` is invoked:

1. Read `Projects/{project}/estimations.md`
2. Calculate summary statistics:
   - Average variance (are estimates consistently high/low?)
   - Which phase types are most accurate?
   - Total estimated vs total actual time
3. Display insights:
   ```
   ## Estimation Accuracy for voice-dictation

   | Phase | Estimated | Actual | Variance |
   |-------|-----------|--------|----------|
   | Phase 1: Setup | 15 min | 8 min | -47% |
   | Phase 2: API Route | 30 min | 22 min | -27% |
   | Phase 3: Core Hook | 1-2 hours | 47 min | -48% |

   **Insights:**
   - Average variance: -41% (estimates are too high)
   - Total estimated: 2-3 hours | Total actual: 1h 17min
   - Recommendation: Reduce future estimates by ~40%
   ```

---

## File Locations

- **Current phase state:** `.claude/current-phase.json`
- **Estimation history:** `Projects/{project}/estimations.md`
- **Plan with estimates:** `Projects/{project}/plan.md`

---

## Estimations.md Format

Create this file when first ending a phase:

```markdown
# Estimation Tracking: {Project Name}

Track estimated vs actual build time to improve future planning.

## Summary

| Metric | Value |
|--------|-------|
| Total Estimated | - |
| Total Actual | - |
| Average Variance | - |

## Phase History

| Phase | Estimated | Actual | Variance | Date |
|-------|-----------|--------|----------|------|
```

---

## Variance Calculation

```
variance = ((actual - estimated) / estimated) * 100

Examples:
- Estimated 60 min, Actual 30 min → -50% (faster than estimated)
- Estimated 30 min, Actual 45 min → +50% (slower than estimated)
```

For ranges like "1-2 hours", use the midpoint (90 min) for calculation.

---

## Tips for Better Estimates

Based on collected data, the skill should suggest adjustments:

- If consistently 40% faster → multiply future estimates by 0.6
- If hooks take ~30-50 min → use that range instead of "1-2 hours"
- If setup phases are always < 10 min → estimate 10 min max

---

## Example Session

```
User: /start-phase Phase 1: Setup
Agent: Started timing **Phase 1: Setup** (estimated: 15 minutes)

[Agent implements Phase 1...]

User: /end-phase
Agent: Completed **Phase 1: Setup** in 8 minutes (estimated 15 min, 47% faster)

User: /start-phase Phase 2: API Route
Agent: Started timing **Phase 2: API Route** (estimated: 30 minutes)

[Agent implements Phase 2...]

User: /end-phase
Agent: Completed **Phase 2: API Route** in 22 minutes (estimated 30 min, 27% faster)

User: /estimations
Agent: [Shows summary table with insights]
```
