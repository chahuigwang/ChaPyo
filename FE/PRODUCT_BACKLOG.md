# EnjoyTrip — Feature Backlog & Idea Document

> **Owner:** Product / UX
> **Last updated:** 2026-05-20
> **Status:** Living document — iterate after each phase review
> **Stack context:** Vue 3 (Composition API) · Pinia · Tailwind · `lucide-vue-next` · Spring Boot API · Korea Tourism Org. data
> **Architectural constraint:** No WebSockets. Real-time collaboration via SSE or Smart Polling, with `version` / `updatedAt` concurrency guards.

---

## 0. Guiding Principles

1. **Personal vs. Shared boundary is sacred.** Sidebar (Chat, Search, Storage, Profile) is *personal*. Workspace (Summary, Calendar, Map, Itinerary Timeline) is *shared*. Every new feature must declare which side it lives on.
2. **Borderless, ticket-motif visual language.** Separation via spacing, soft shadows (`shadow-sm`), and background contrast — never decorative borders.
3. **Conflict-free by design.** Any shared-state mutation must carry a version. Optimistic UI is allowed; silent overwrites are not.
4. **70 / 25 / 5 color ratio** with `#00B7EB` as the single source of brand accent.
5. **Mock-first, API-second.** Ship the UX behind a mock layer in `src/api/`, swap in the real backend without touching components.

---

## 1. Backlog from Submitted Ideas

### EPIC A — Dashboard: Trip Status Visual Cues

**Why:** Users currently can't tell at a glance which trip is happening *now* vs. which one is a memory. A single visual scan should answer "what's live, what's upcoming, what's done."

**Personal/Shared:** Read-only render of shared state.

| ID    | User Story | Acceptance Criteria | Priority |
|-------|-----------|---------------------|----------|
| A-1   | As a traveler, I want past trips to look visually de-emphasized so I can focus on what's relevant. | Trip end date `< today` → card renders with `opacity-60`, `grayscale`, and `hover` interaction disabled or muted. A subtle `"종료"` chip appears in the top-right of the boarding-pass card. | P0 |
| A-2   | As a traveler, I want an *ongoing* trip to feel alive on my dashboard. | `startDate <= today <= endDate` → card gets a soft `#00B7EB` outer glow (`shadow-[0_0_0_2px_rgba(0,183,235,0.25)]`), a pulsing `LIVE` dot, and a "오늘은 Day N" microcopy line. | P0 |
| A-3   | As a traveler, I want upcoming trips to feel anticipatory but neutral. | `startDate > today` → default styling + a small `"D-N"` countdown chip. | P1 |
| A-4   | As a developer, I need a single derived helper to classify status. | New `useTripStatus(trip)` composable returns `'past' \| 'ongoing' \| 'upcoming'` + days-from-now. Used by `TripCard.vue` and any future surface. | P0 |
| A-5   | As a traveler, I want the dashboard to sort intelligently. | Default sort: `ongoing → upcoming (nearest first) → past (most recent first)`. Configurable via a small segmented control. | P2 |

**Out of scope (for now):** Filters by destination/persona. Tracked separately in C-3.

---

### EPIC B — Workspace: Collaboration UI

**Why:** Today the workspace looks single-player. Without an Invite affordance and presence indicators, users won't *discover* that collaboration exists, let alone trust it.

**Personal/Shared:** Strictly shared state. Invitations mutate the trip's collaborator list and must be version-aware.

| ID   | User Story | Acceptance Criteria | Priority |
|------|-----------|---------------------|----------|
| B-1  | As a trip owner, I want a prominent **Invite** affordance in the workspace. | `<UserPlus />` button (top-right of workspace, next to active-users stack). Opens a flyout/modal with: (a) copyable shareable link with role selector (`viewer` / `editor`), (b) email input with comma-separated batching, (c) list of pending invites with revoke action. | P0 |
| B-2  | As a collaborator, I want to see who's editing right now. | Top-right of workspace shows up to 4 overlapping circular avatars (`-space-x-2`, `ring-2 ring-white`). Beyond 4 → `+N` chip. Each avatar tooltip shows name + "지금 편집 중". Source: smart-poll heartbeat every 10s on the `/trips/:id/presence` endpoint (mock first). | P0 |
| B-3  | As a collaborator, I want to know when my view is stale. | If a poll detects a `version` bump that I haven't merged, show a non-blocking `Toast`: *"동료가 일정을 업데이트했어요. 새로고침"* with a one-click "최신으로 보기" button. | P0 |
| B-4  | As a collaborator, I want to see *whose* edit a given itinerary item is. | Each `PlaceCard` in the timeline gets a tiny avatar in the bottom-right corner = `lastEditedBy`. Hover → "민지 · 3분 전 추가". | P1 |
| B-5  | As a trip owner, I want role management. | Owner-only menu inside the Invite flyout: change role, remove collaborator. Editors can invite *viewers*, not *editors* (capability gate). | P2 |
| B-6  | As any user, I want safe link sharing. | Share links are signed, scoped (`viewer` or `editor`), and revocable. UI shows expiry ("7일 후 만료") and a regenerate button. | P1 |

**Data model additions (mock first, wire later):**
- `TripPlan.collaborators: Array<{ userId, role, joinedAt }>`
- `TripPlan.presence: Array<{ userId, lastSeenAt, cursor? }>`
- `TravelItem.lastEditedBy: userId`, `TravelItem.lastEditedAt: ISO`

---

## 2. Brainstormed Additions

### CATEGORY C — Collaborative UX (make multi-user editing feel alive & safe)

> **North star:** Two people on the same trip should feel each other's presence without ever clobbering each other's work.

| ID   | Idea | Problem it solves | UX sketch | Concurrency strategy | Priority |
|------|------|-------------------|-----------|----------------------|----------|
| C-1  | **Soft Item Locks (Edit Intent)** | Two editors opening the same `PlaceCard` simultaneously and overwriting. | When user clicks Edit on an item, broadcast `editingItemId` via the presence channel. Other clients render that card with a faint `#00B7EB` border + small avatar — *"민지가 편집 중"*. Tap-to-take-over with a 2-step confirm. | Soft lock with TTL (30s heartbeat). Server-side resolution: last `version` wins, but the UI warns. | P0 |
| C-2  | **Inline Comments per Itinerary Item** | Discussion currently scatters across KakaoTalk / Slack. Decisions get lost. | Each `PlaceCard` has a comment count chip. Click → side-drawer with threaded comments scoped to that item. `@mention` invites a collaborator. Read receipts shown as faded avatars. | Append-only comment log keyed by `itemId` + `clientTempId`. No version conflicts because comments don't mutate item state. | P1 |
| C-3  | **Activity Feed (Timeline of changes)** | Returning to a trip after a day, users want "what changed while I was gone?" | Bottom-right `History` icon → side drawer: chronological feed (*"건희가 N서울타워를 Day 2로 옮김 · 2시간 전"*). Each entry is clickable → scroll-and-highlight the affected item. | Append-only `tripEvents` table. Read-only, no merge concerns. Power-user feature for trust. | P1 |
| C-4  | **"Catch Me Up" on Reconnect** | Long polling gap → user reopens tab → confused by silent changes. | On focus regain, compare local `version` vs server. If diff → modal summarizing changes: *"마지막 본 뒤 4건이 바뀌었어요"* with a per-change diff highlighter on the timeline (green = added, amber = moved, red = removed; fades after 5s). | Server returns delta since `lastSyncTime`. Client animates a one-time diff overlay. | P0 |
| C-5  | **Vote-on-Place** (lightweight group decisioning) | Couples / groups argue about which restaurant. No structured way to decide. | Any item in **Storage** can be promoted to a "후보" with a 👍 / 👎 / 🤷 vote. Each collaborator votes once. Owner sees a tally and can "Promote to Itinerary" in one click. | Vote counts stored per `itemId`; idempotent by `userId`. No version conflict. | P2 |

---

### CATEGORY D — Map & Timeline Polish (make the itinerary *look* better)

> **North star:** The itinerary should read like a beautiful boarding pass, not a spreadsheet.

| ID   | Idea | Problem it solves | UX sketch | Priority |
|------|------|-------------------|-----------|----------|
| D-1  | **Numbered, color-coded route line on the Kakao Map** | The map shows pins, but the *sequence* per day is invisible. | Numbered pins (1, 2, 3…) per day, connected by a soft polyline in the day's accent color. Hover a pin → corresponding timeline card lifts & glows. Hover a timeline card → its map pin pulses. Two-way affordance. | P0 |
| D-2  | **Travel-time annotations between items** | Users underestimate how long it takes to get from A to B. | Between two consecutive `PlaceCard`s, render a tiny "transit chip": *🚗 12분 · 5.4km* (or 🚶 / 🚇 toggle). Computed via Kakao Maps directions API. Click → opens a small bottom sheet with route options. | P0 |
| D-3  | **Day color chips & "ghost time" gaps** | All days look the same. Hard to scan. Also, empty stretches of a day are invisible. | Each Day gets a distinct soft pastel (auto-cycled). Empty 2+ hour gaps render as a dashed-line "ghost" slot with a `+ 일정 추가` button — gentle pressure to fill the day without nagging. | P1 |
| D-4  | **Compact / Map-first / Timeline-first view modes** | Power users want a dense overview; new users want a guided tour. | Top-right segmented control: `🗺 Map ▸ 📋 Split ▸ 📜 Timeline`. Persist per-user (personal state). Default = Split. | P2 |
| D-5  | **Drag-to-reorder with snap-to-time** | Reordering today is freeform — items lose their `time`. | When dragging a card across a day with existing times, snap to nearest 30-min slot and rewrite the `time` field. Visual snap-line with the new time floating beside the cursor. | P1 |
| D-6  | **Print-ready / PDF "Boarding Pass" export** | Travelers want offline access on the plane. | One-click export: a beautifully laid out PDF using the ticket motif — cover page, per-day summary, map snapshots, addresses + phone numbers in case data fails abroad. | P2 |

---

### CATEGORY E — AI & Storage (improve AI interaction and travel item discovery)

> **North star:** The AI should feel like a knowledgeable local friend, not a search box. The Storage should feel like a wishlist that learns.

| ID   | Idea | Problem it solves | UX sketch | Priority |
|------|------|-------------------|-----------|----------|
| E-1  | **AI suggestions are draggable directly into the itinerary** | Currently suggestions live in chat — user has to manually re-add. | `SuggestionCard` in chat gets the same `draggable="true"` contract as Storage items, with a `source: 'chat'` payload. Drop on Day → goes into shared state; drop on Storage → goes into personal state. Unified DnD model. | P0 |
| E-2  | **Persona-aware AI replies use the current trip context** | The AI replies generically. It should know we're planning Day 2 in Busan and that lodging is already decided. | Every AI request includes a `tripContext` payload: `{ destination, days, decidedLodging, decidedTransport, currentSelectedDate }`. AI replies cite the context: *"부산 Day 2 점심에 맞춰서 광안리 근처로 골랐어요."* | P0 |
| E-3  | **"Tell me more" expansion on any Storage item** | Storage cards are flat. No depth. | Each Storage card has a `Sparkles` icon → opens a flyout with AI-generated: opening hours summary, parking tips, "go before or after lunch" verdict, and 2–3 nearby alternatives. Cached per `itemId` so it's cheap. | P1 |
| E-4  | **Smart Storage grouping (auto-cluster by area)** | Once Storage has 20+ items, it's a wall. | Storage auto-clusters by `district` (e.g., *"종로구 · 5개"*, *"해운대 · 3개"*). Collapsible groups. Manual override possible. | P1 |
| E-5  | **"Build me a Day"** — one-click AI day composer from Storage | Decision fatigue when assembling a day. | Header button on a Day: *"보관함에서 자동 구성"*. AI picks 4–6 items from Storage that (a) cluster geographically, (b) match the day's persona, (c) respect meal times. Shown as a preview — user accepts or rejects with one click. | P0 |
| E-6  | **Budget-aware nudges** | Cost creeps silently. By the time you notice, you're over budget. | If `totalCost` crosses a user-set budget, the Summary card subtly highlights it in `amber` and the AI offers: *"숙소 등급을 한 단계 낮추면 12만원 절감할 수 있어요."* Never blocks, always offers. | P2 |
| E-7  | **Voice memo → AI parses → Storage item** | Walking around, you don't want to type. | Mic button in chat: record up to 30s. STT → AI extracts name + intent + category → drops into Storage as a structured `PlaceItem` with the original audio attached for later review. | P3 |

---

## 3. Suggested Phase Ordering (rough)

| Phase | Theme | Bundle |
|-------|-------|--------|
| 24    | **Dashboard polish + read-only collab signals** | A-1, A-2, A-3, A-4, B-2 |
| 25    | **Trustworthy collaboration** | B-1, B-3, B-6, C-1, C-4 |
| 26    | **Map & timeline become beautiful** | D-1, D-2, D-5 |
| 27    | **AI becomes useful, not chatty** | E-1, E-2, E-5 |
| 28    | **Decisioning & history** | B-4, C-2, C-3, C-5 |
| 29    | **Power features** | D-3, D-4, D-6, E-3, E-4, E-6 |
| 30+   | **Stretch** | A-5, B-5, E-7 |

---

## 4. Cross-Cutting Concerns (Tech Debt to Watch)

- **Concurrency contract:** Every shared-state mutation must go through `tripStore` actions that increment `version` and stamp `updatedAt` + `lastEditedBy`. Components must never mutate `TripPlan` directly.
- **Smart polling cadence:** Active workspace polls every 5s; background tabs back off to 30s; idle (>2min) pauses. Presence heartbeats decoupled at 10s.
- **Mock layer discipline:** All new endpoints land first in `src/api/` with a `mock: true` flag, so backend integration is a one-line swap.
- **Accessibility:** All status colors (past/ongoing, owner/editor/viewer) must pair with an icon or text label — never color alone.
- **Mobile readiness:** Sidebar rail collapses to bottom tab bar < 768px. Plan workspace layout collapses to stacked accordions. Not in scope yet, but every component built now should avoid layout assumptions that break this.

---

## 5. Open Questions (for next product review)

1. Should *viewers* see presence avatars and the activity feed, or only editors?
2. Do we surface "who invited whom" anywhere, or is it implicit in the owner-only manage screen?
3. For E-5 ("Build me a Day"), do we let the AI also pull items *not* in Storage, or strictly compose from what the user has curated?
4. Trip archival: at what point does a "past" trip move out of the main dashboard into an "Archive" view? Auto after 90 days?
5. Free-tier vs. paid feature split — does collaboration gate behind a plan? (Pricing model not yet defined.)
