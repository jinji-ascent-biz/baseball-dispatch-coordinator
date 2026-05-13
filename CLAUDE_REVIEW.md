# Claude Code Review — 配車調整ボード MVP

**Reviewed:** 2026-05-13  
**Reviewer:** Claude Code (claude-sonnet-4-6)  
**Branch:** main  
**Commit:** 9d09ddf

---

## 1. Overall Verdict

**Pass with concerns**

Core functionality is implemented correctly and the code is clean, well-structured, and XSS-safe. Two correctness issues require attention before user-facing deployment: a companion-count calculation bug that inflates required riders, and a destructive reset with no confirmation.

---

## 2. What Works Well

- **All MVP scope items are covered.** Event metadata, per-player participation/companion/car inputs, live-updated summary with colour-coded status, GAS auto-fetch with graceful CORS fallback, manual paste import, player add, localStorage persistence, and responsive layout are all present.
- **Calculation plumbing is solid.** `normalizeCount` guards against NaN/negative/non-integer. `normalizeState` handles corrupt or schema-mismatched localStorage without crashing. STORAGE_KEY is versioned (`:v1`).
- **XSS prevention is consistent.** Every user-provided string entering `innerHTML` passes through `escapeHtml` or `escapeAttribute`. The raw URL constant rendered in `<a href>` is safe because it comes from source code, not user input.
- **Mobile UX is thoughtful.** `inputmode="numeric"` on number fields, `min-height: 42px` touch targets, two responsive breakpoints, labels that appear only on mobile where the desktop header is hidden, and `aria-live` on the summary panel.
- **Import parser is generous.** Handles comma/tab/読点 separators, Japanese and English participation tokens, free-form inline format, and JSON array response. Fuzzy name matching (whitespace-normalised, lowercased) reduces manual correction.
- **Dev server has path-traversal defence.** `resolve()` + `startsWith(root)` check prevents directory escape.
- **`npm run build` and `npm run test` both pass.** The smoke checks verify the key symbols are present in every critical file.

---

## 3. Must-Fix Issues

### 3-A. Companion count ignores participation status (calculation bug)

**File:** `src/main.js:122-128`

```js
// current — counts companions for ALL players including absent/unknown
const companionTotal = rows.reduce((total, row) => total + row.companionCount, 0);
```

If a player is marked 欠席 but has `companionCount: 2`, those 2 are added to `companionTotal` and therefore to `requiredRiders`. This overstates the required seats and may falsely report a shortage.

The fix is to gate on `participation === 'yes'`:

```js
const companionTotal = rows
  .filter((row) => row.participation === 'yes')
  .reduce((total, row) => total + row.companionCount, 0);
```

The companion label in the UI ("選手以外の参加人数") also implies these are _attendees_ — if the player is absent, their family is presumably absent too.

### 3-B. "初期化" button has no confirmation

**File:** `src/main.js:473-477`

Clicking 初期化 in the page header immediately calls `localStorage.removeItem` and wipes all data. On a mobile screen this button sits close to other controls. One misclick by a coordinator mid-event destroys the entire board.

Add a `window.confirm` guard before the reset:

```js
document.querySelector('[data-action="reset"]').addEventListener('click', () => {
  if (!window.confirm('入力内容をすべて初期化します。よろしいですか?')) return;
  localStorage.removeItem(STORAGE_KEY);
  importMessage = '入力内容を初期状態に戻しました。';
  setState(createInitialState());
});
```

---

## 4. Should-Fix Improvements

| # | Issue | Location | Notes |
|---|-------|----------|-------|
| 4-A | **No fetch timeout** | `main.js:205` | `tryFetchMonthlyParticipation` has no `AbortSignal`. A stalled GAS request leaves the button spinning indefinitely. Wrap with `AbortSignal.timeout(8000)`. |
| 4-B | **Add-player input not cleared after submit** | `main.js:507-510` | After `addPlayer(input.value)`, the text field retains the submitted name. Set `input.value = ''` after the call. |
| 4-C | **Build is a plain file copy** | `scripts/build.mjs` | `dist/` contains development source with bare `/src/` paths that won't resolve on many static hosts without a base path. Consider adding a note in README that the dev server is needed to serve `dist/` locally, or use a simple bundler pass. |
| 4-D | **Only one active event** | `main.js` data model | GOAL item 1 says "イベント/日付ごとにページを作成できる". The current implementation supports a single board. For now this is acceptable as MVP, but if the team schedules multiple events simultaneously (regular game + make-up game), data is overwritten. A future-safe approach is to key localStorage by event ID. |
| 4-E | **Hardcoded player roster** | `main.js:5-18` | The 12 sample players are fictional (placeholder names). The README/QA checklist imply a real team will use this. There is no UI to remove or reorder players. Acceptable for MVP, but teams will need direct source edits. |
| 4-F | **`companionCount` label on desktop is missing from column header** | `styles.css:214` | The desktop header row (`<div class="desktop-header">`) shows `選手 / 参加 / 同伴者 / 車出し / 空席 / メモ`. This matches the current grid, but if the label spans two columns due to `minmax` reflow on medium screens the header and data columns can misalign. Low-impact cosmetic issue. |

---

## 5. Manual QA Checklist

Run through these steps in a browser after applying must-fix 3-A and 3-B.

**Setup**
- [ ] `npm install` completes without errors
- [ ] `npm run build` prints "dist を作成しました。" — no errors
- [ ] `npm run test` prints "QA smoke checks passed."
- [ ] `npm run dev` starts server; opening `http://127.0.0.1:5173` shows the board

**Core calculations**
- [ ] Set one player to 参加, others to 未定 → 参加選手 shows 1, 必要乗車人数 shows 1
- [ ] Add 2 companions to a 参加 player → 同伴者 shows 2, 必要乗車人数 shows 3
- [ ] Add 2 companions to an **欠席** player → 同伴者 and 必要乗車人数 must **not** increase (bug 3-A fix verification)
- [ ] Enable 車あり for a player, set 空席 to 4 → 乗車可能 shows 4
- [ ] Disable 車あり → 空席 input becomes disabled and 乗車可能 drops by 4; balance updates
- [ ] Create shortage (requiredRiders > availableSeats) → summary panel turns red 不足
- [ ] Make it exact → turns green ちょうど
- [ ] Make it surplus → turns blue 余裕あり

**Persistence**
- [ ] Enter data, reload page → all values restored
- [ ] Click 初期化 → confirmation dialog appears; dismissing it leaves data intact; confirming resets board

**Import**
- [ ] Paste `佐藤 蓮,参加\n鈴木 悠真,欠席` into textarea, click 貼り付け内容を取り込む → those players update; others unchanged
- [ ] Paste a line with mismatched name → does not affect existing players
- [ ] Click 自動取得を試す → either succeeds or shows an error message with guidance to use paste fallback; button re-enables afterward

**Player management**
- [ ] Enter a name in 選手追加, click 追加 → new row appears with 未定 / 0 companions / no car
- [ ] After adding player, input field is cleared (bug 4-B fix verification)

**Responsive / mobile**
- [ ] At 375px width: player rows stack vertically; all fields are accessible and have visible labels
- [ ] Number inputs on iOS/Android show numeric keyboard
- [ ] Segmented control buttons have adequate tap target height

---

## 6. Release Readiness Notes

**Not yet ready for team-wide use** due to bugs 3-A and 3-B. Both are small fixes (< 5 lines each) and nothing requires architectural change.

**Acceptable for demo/internal review** in current state — the visual presentation and UX structure are solid.

**No security blockers.** XSS is handled, no sensitive data leaves the browser, and the GAS fetch uses `credentials: 'omit'`.

**Privacy note.** Real player names should not be committed to a public repository. If this repo is ever published, replace the default player list with generic placeholders and add a README note that teams configure the roster locally.

**Deployment path.** This is a static app with no build transform. Any static host (Netlify, GitHub Pages, Vercel) can serve the `src/` + `index.html` files directly, as long as it can serve files at the `/src/` path. Alternatively, a small bundler step would produce a self-contained `dist/index.html`.
