# Using Rope Walk Cordage Orders

Sign in at `/login` with **cenius@cenius.ai / cenius** (printed on the card; the "Use demo
credentials" button fills both fields). The token is kept in `localStorage`, so a reload of
any gated page keeps you signed in.

## Dashboard (`/`)

A factual summary of the walk: active orders (with the draft/confirmed split), total
scheduled metres, hemp and sisal kilograms still in stock, the next three runs with fibre,
lay direction and length, and the five most recent orders. Tiles and rows link through to
their screens. If the API is unreachable you get an error card with **Retry** rather than
blank panels.

## Order book (`/orders`)

A dense table of every order: customer, fibre, lay direction, lay length (mm), diameter
(mm), finished length (m), quantity, status and when it last changed.

- The left rail filters by search text, fibre (hemp/sisal) and status (draft/confirmed/
  complete). Filters combine; **Clear all filters** resets them. "0 of 12 orders" with the
  filter still applied is shown as its own state so you can tell "nothing matches" from
  "the book is empty".
- **Sort** reorders by newest, longest, customer or status.
- **New order** opens the create form.

## Creating an order (`/orders/new`)

The form captures the whole rope lay and fibre spec: customer, fibre, strand count, lay
direction (Z right-hand / S left-hand), lay length in millimetres, rope diameter in
millimetres, finished length in metres, quantity, status and notes. Numeric defaults are
plausible, so the form submits as soon as a customer is named.

Validation runs in the browser and again on the server: a negative or zero lay length, a
fractional strand count, or a length above 20 000 m produces an inline message at the field
(server errors arrive as field-level 422 details) and nothing is saved. The submit button
disables while the request is in flight, and a double click cannot create two records. A
successful create lands you on the new order's detail page.

## Order detail (`/orders/:id`)

The full spec as a labelled definition list (fibre, strands, lay direction and hand, lay
length, diameter, finished length, quantity, total metres, raised, last updated) plus notes
and the order's place on the run list.

- **Edit spec** swaps in the same form, pre-filled; saving shows the new values immediately
  and they survive a reload.
- **Delete** opens a confirmation dialog (Escape or Cancel dismisses it); confirming removes
  the order and its run-list entry and returns to the order book.
- Orders that are still drafts say plainly that only confirmed orders are scheduled.

## Ropewalk schedule (`/schedule`)

**Generate schedule** takes every confirmed order and lays out the run list with the
longest finished length first — long lays go up the walk before short ones. Each row shows
its sequence number, customer, fibre, rope length, planned metres (length × quantity), an
editable run date and a status selector (planned / in progress / done).

- Changing a run date or status saves immediately; the row flashes briefly and the value
  survives a reload.
- **Regenerate schedule** rebuilds the list from the currently confirmed orders but keeps
  every run already marked done — its date, status and position are untouched.
- Before the first generation the page explains the sequencing rule and offers the same
  generate action.

## Bale stock (`/stock`)

The fibre store ledger. Per-fibre tiles show hemp and sisal kilograms plus bale counts
(in stock and opened bales only), and a count of used bales.

- **Add bale** opens a form for the reference (e.g. `HEMP-1211`), fibre, weight in
  kilograms, received date and status. Weight must be greater than 0 kg and at most 2 000
  kg; the reference must be at least 2 characters. Saving adds the row and updates the
  totals without a reload.
- In the table you can retype a bale's weight (commit with Enter or by leaving the field) or
  change its status; the totals follow.
- **Delete** asks for confirmation, then removes the bale and drops the totals.

## Ropemaker profile (`/profile`)

Shows the signed-in account's email (read-only), display name and ropewalk name. Editing
either name and saving shows an inline "Profile saved" confirmation and persists to the
backend — a reload shows the new values. Blanking a name is rejected inline before the
request is sent. **Sign out** clears the stored token and returns to `/login`; visiting any
gated route afterwards redirects back to the login page.

## Small screens

Below 900px the sidebar becomes a top bar with the same navigation (the current page is
highlighted) and the identity collapses to initials plus sign out. Below 640px the form
grid becomes a single column, tables scroll inside their own container so the page never
scrolls sideways, and every control is at least 44px tall.
