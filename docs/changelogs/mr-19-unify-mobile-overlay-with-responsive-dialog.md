# MR 19 — Unify Mobile Overlay Presentation Behind `ResponsiveDialog`

**Branch:** (unify mobile dialog/sheet presentation) → `main`

### Context

On mobile, the transaction detail view opened as a bottom sheet, but add-transaction,
transfer-money, and create-wallet forms opened as centered dialogs — the same viewport
got two different overlay conventions depending on which flow you were in. Several other
overlays (edit transaction, the three delete confirmations) already hand-rolled the same
`useIsMobile` branch between `Dialog` and `Sheet` independently, with copy-pasted
markup. Desktop always shows a dialog and is unaffected by this merge.

### Inventory (before changing anything)

Every overlay under `apps/ledger-box/src`, and whether it already branched on
`useIsMobile`:

| Overlay                                             | Type               | Primitive before | Branched on mobile?                                                                          |
| --------------------------------------------------- | ------------------ | ---------------- | -------------------------------------------------------------------------------------------- |
| Add transaction                                     | Form               | Dialog only      | No — **inconsistent**                                                                        |
| Transfer money                                      | Form               | Dialog only      | No — **inconsistent**                                                                        |
| Create wallet                                       | Form               | Dialog only      | No — **inconsistent**                                                                        |
| Statement share (wallet settings)                   | Form → read-only   | Dialog only      | No — **inconsistent**                                                                        |
| Edit transaction                                    | Form               | Dialog + Sheet   | Yes (hand-rolled)                                                                            |
| Transaction detail                                  | Read-only          | Dialog + Sheet   | Yes (hand-rolled)                                                                            |
| Transaction attachments list                        | Read-only + upload | Dialog + Sheet   | Yes (hand-rolled)                                                                            |
| Delete wallet                                       | Read-only confirm  | Dialog + Sheet   | Yes (hand-rolled)                                                                            |
| Delete transaction                                  | Read-only confirm  | Dialog + Sheet   | Yes (hand-rolled)                                                                            |
| Delete transaction attachment                       | Read-only confirm  | Dialog + Sheet   | Yes (hand-rolled)                                                                            |
| Transaction attachment preview (full-screen viewer) | Read-only          | Dialog only      | **Deliberately not converted** — see below                                                   |
| Account settings dialog (`settings-dialog.tsx`)     | Tabbed container   | Dialog only      | **Deliberately not converted** — app-level user settings, not a wallet overlay, out of scope |

`packages/ui`'s `Dialog` and `Sheet` are both thin wrappers over the same
`@base-ui/react/dialog` primitive (not Radix) — `Sheet` differs only in position/side
styling. Neither implements a swipe/drag gesture; the "bottom sheet" transition is CSS
only. Dismissal in both today (and after this merge) happens via Escape, backdrop press,
or the close button, all funneled through Base UI's controlled `onOpenChange(open,
eventDetails)` callback, where `eventDetails.reason` distinguishes explicit closes
(`close-press`, `imperative-action`, `trigger-press`) from incidental ones
(`outside-press`, `escape-key`, `focus-out`).

The transaction attachment preview (full-screen image/PDF viewer with prev/next paging)
was kept as a plain `Dialog` at every viewport size — it's already full-screen chrome at
all breakpoints and paging/zooming UX doesn't map onto a bottom-sheet layout; converting
it would have been a change with no user benefit.

### Added

- `ResponsiveDialog` (`packages/ui/src/components/responsive-dialog.tsx`) — renders
  `Sheet` (bottom) below the mobile breakpoint and `Dialog` above it behind one prop
  shape (`open`, `onOpenChange`, `title`, `description`, `trigger`, `children`,
  `footer`, plus `hideTitle`/`hideDescription` for visually-hidden-but-announced
  headers used by custom in-body headers). Call sites never branch on viewport.
  - **Dismissal for forms**: `preventDismiss` + `onDismissAttempt`. When
    `preventDismiss` is true and the popup is being closed for a non-explicit reason
    (`outside-press`, `escape-key`, `focus-out`), the underlying `onOpenChange(false)`
    is never called — since the dialog is controlled, it simply stays open — and
    `onDismissAttempt` fires instead so the caller can confirm. The explicit close
    button still closes immediately. Every migrated form passes
    `preventDismiss={isDirty(form)}` (formisch's `isDirty`) and confirms via
    `window.confirm` in `onDismissAttempt`; read-only views omit `preventDismiss`
    entirely and dismiss freely.
  - **Mobile keyboard**: the sheet branch sets `max-h-[85dvh] overflow-y-auto` (`dvh`
    tracks the visual viewport, so it shrinks under an open on-screen keyboard, unlike
    `vh`) so a focused field scrolls into view within the sheet's own scroll container
    instead of being pushed off-screen. This mirrors the `dvh`-based sizing the
    attachments sheet already used before this merge. Verified by code review against
    Base UI's default popup focus/scroll behavior and the existing `dvh` convention in
    this codebase; not verified against a live on-screen keyboard on a physical device
    or simulator — flagging this as unverified rather than claiming device testing that
    didn't happen.
  - **Focus/aria/escape**: both branches render through the same `DialogTitle`/
    `SheetTitle` and `DialogDescription`/`SheetDescription` primitives (Base UI
    `Title`/`Description`, satisfying `aria-labelledby`/`aria-describedby`), and both
    inherit Base UI's shared focus-trap and Escape handling — there is no separate
    a11y code path per mode.
- Storybook story (`apps/storybook/src/stories/responsive-dialog.stories.tsx`) covering
  the desktop dialog mode, an explicit mobile-viewport story asserting
  `data-side="bottom"`, and a `preventDismiss` story asserting Escape is blocked while
  the close button still works — each with a `play` function.

### Changed

Converted to `ResponsiveDialog` (desktop appearance/behavior, form logic, validation
schemas, and mutations unchanged):

- `wallet-add-transaction-dialog.tsx`, `wallet-transfer-money-dialog.tsx`,
  `wallet-create-dialog.tsx` — previously dialog-only forms now become bottom sheets on
  mobile, matching edit-transaction; each guards dismissal while dirty.
- `wallet-settings-statement-shares.tsx` — guards dismissal while period/title input has
  been entered and no link has been created yet.
- `wallet-edit-transaction-dialog.tsx`, `wallet-transaction-detail-sheet.tsx`,
  `wallet-transaction-attachments-sheet.tsx`, `wallet-delete-dialog.tsx`,
  `wallet-delete-transaction-dialog.tsx`,
  `wallet-delete-transaction-attachment-dialog.tsx` — same visual behavior as before,
  now expressed through the shared component instead of a duplicated
  `useIsMobile` branch per file. The decorative drag-handle bar these sheets rendered
  was dropped in the migration since it implied a swipe gesture that was never actually
  implemented (see inventory above) — a minor, deliberate visual simplification, not a
  regression.

Also, `wallet-shell-layout.tsx`'s mobile-only sub-header (`md:hidden`) was reworked
alongside the overlay migration: it previously rendered every settings section
(General, Activity, Members, Statement shares) as its own item in a horizontally
scrollable `Tabs` strip next to "Transactions", requiring a sideways scroll to find a
section and giving no at-a-glance sense of which one was active. It's now a plain flex
row (`justify-between`) with two elements instead:

- `Transactions` — a plain link, styled active/inactive by `isSettingsPath`.
- A settings dropdown trigger (`@vhnam/ui`'s `DropdownMenu`) showing the active
  section's icon and label (e.g. "General ⌄"). Opening it lists every section visible
  to the current role (`visibleSettingsSections` — Activity stays owner-only), with a
  small dot marking the active one. The menu content is sized to its own contents
  (`w-fit`) rather than stretching to match the trigger's width.

The `Tabs`/`TabsList`/`TabsTrigger` components (and the `activeNavValue` variable they
required) were removed from this file — a real ARIA tablist was the wrong fit once one
of the two items became a menu button instead of a tab. Section list, routes, and role
filtering (`SETTINGS_SECTIONS`, `visibleSettingsSections`) are unchanged — same four
sections as before; "Danger Zone" has no separate route in this app (folded into the
General page since MR-17) and was intentionally not added back as a dropdown entry.
Desktop's vertical sidebar was untouched.

### Verification

- `vp check` — clean (format, lint, types).
- `vp test` — 23/23 non-browser tests pass; the browser-mode (Playwright) test project
  could not run in this environment (`chrome-headless-shell` binary not installed — pre-
  existing environment gap, not something this change introduced or could fix by
  editing source).

### Commits

- `f027251` refactor(ledger-box): unify mobile overlay with responsive dialog
