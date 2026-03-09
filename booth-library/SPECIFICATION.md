# Booth Library Specification

## Overview

This application is a SvelteKit-based client-side tool for browsing and organizing items from a BOOTH library export.

Primary purpose:

- Import BOOTH library item data as JSON
- Search items by title or shop name
- Filter items by tags
- Maintain per-item tags and bulk tag assignment
- Open item pages on BOOTH
- Persist the library locally in the browser

The main screen is implemented in [src/routes/+page.svelte](/G:/Codex/svelte-booth/booth-library/src/routes/+page.svelte) and renders [ProductGrid.svelte](/G:/Codex/svelte-booth/booth-library/src/lib/components/ProductGrid.svelte).

## Runtime and Deployment

- Framework: SvelteKit with Svelte 5 runes
- Bundler: Vite
- Styling: Tailwind import is present, but the core UI styling is implemented with component-scoped CSS
- Deployment target: static site build
- Production base path: `/svelte-booth`

Relevant files:

- [svelte.config.js](/G:/Codex/svelte-booth/booth-library/svelte.config.js)
- [vite.config.ts](/G:/Codex/svelte-booth/booth-library/vite.config.ts)
- [package.json](/G:/Codex/svelte-booth/booth-library/package.json)

## Data Model

### Product

Defined in [src/lib/stores/productStore.ts](/G:/Codex/svelte-booth/booth-library/src/lib/stores/productStore.ts).

```ts
interface Product {
  url: string;
  title: string;
  price?: number;
  imageUrl: string;
  tags: string[];
  shop?: string;
}
```

Behavioral expectations:

- `url`, `title`, and `imageUrl` are treated as required
- `shop` is optional
- `tags` is always normalized to an array during JSON import
- `url` is the logical unique key for merge, update, and delete operations

## Persistence

The application persists state in `localStorage`.

Keys used:

- `booth-library-products`: product list
- `booth-library-tags`: tag master list
- `booth-library-page-size`: selected page size
- `booth-library-shop-sort`: shop list sort preference

Initialization behavior:

- On first load, if no stored product data exists, seed data is loaded from [src/lib/init.json](/G:/Codex/svelte-booth/booth-library/src/lib/init.json)
- Seed items are immediately written into `localStorage`
- Tags are derived from stored or seeded products and inserted into the tag master store

Cross-tab behavior:

- The app listens for the browser `storage` event and updates products, tags, and page size when another tab modifies the same keys
- The app also refreshes products and tags on `visibilitychange` when the tab becomes visible again

## Main User Flows

### 1. Browse library items

The main page shows a paginated grid of product cards.

Each card displays:

- Product image
- Product title
- Shop name, when present
- Assigned tags
- Action buttons on hover

Card actions:

- Open tag editor dialog
- Open BOOTH item URL in a new tab
- Delete the product

### 2. Search items

Search is implemented in [ProductGrid.svelte](/G:/Codex/svelte-booth/booth-library/src/lib/components/ProductGrid.svelte).

Search targets:

- Product title
- Shop name

Matching rules:

- Case-insensitive substring match
- Empty query means no search filtering

Additional behavior:

- A clear button resets the current search query
- Selecting a shop from the shop list dialog sets the search query to that shop name

### 3. Filter by tags

Users can filter the grid by selecting tags from the tag list.

Filtering rules:

- If no tags are selected, all eligible products are shown
- If one or more tags are selected, a product must contain all selected tags

Special hidden tag behavior:

- Products tagged with the special tag `非表示` are excluded by default
- They become visible only when the `非表示` tag itself is selected as a filter
- The hidden tag is rendered separately at the end of the tag list when present

Tag list behavior:

- Clicking a tag toggles it in the current filter
- Right-clicking a tag attempts to delete it from the tag master
- A tag can only be deleted if no product still uses it
- If deletion fails, an error toast is shown

### 4. Pagination and grid density

The main grid supports both pagination and adjustable column count.

Page size options:

- 20
- 100
- 500

Rules:

- Changing page size resets the current page to page 1
- Changing filters also resets the current page to page 1
- Previous and next buttons are bounded to valid page numbers

Grid column options:

- 3
- 4
- 6
- 8

Rules:

- Column count affects the CSS grid layout
- Column count is not persisted to `localStorage`

### 5. Import BOOTH export JSON

Import is handled by [JsonUploader.svelte](/G:/Codex/svelte-booth/booth-library/src/lib/components/JsonUploader.svelte).

Input expectations:

- User pastes JSON into a dialog textarea
- JSON root must be an array
- Each accepted object must include:
  - `title` as string
  - `url` as string
  - `imageUrl` as string
- `shop` may be omitted
- `tags` defaults to `[]` when missing or invalid

Import behavior:

- Invalid JSON or a non-array payload produces an error toast
- If no valid products remain after validation, import is rejected
- Existing products are matched by `url`
- When an imported product already exists:
  - `title` is updated
  - `imageUrl` is updated
  - `shop` is updated only when the new value is present
- New products are prepended ahead of existing products
- Tags from newly added products are added to the tag master

The import dialog also explains an expected upstream workflow:

- Use Tampermonkey
- Install the `BOOTH Item Extractor` userscript
- Run extraction on the BOOTH library page
- Paste the resulting JSON into the app

### 6. Export current library

The import dialog also supports export.

Export behavior:

- Exports the full current product list
- Output format is pretty-printed JSON
- Download filename is `booth-library-export.json`
- Export success triggers a success toast

### 7. Edit product tags

Per-item tag editing is handled by [TagDialog.svelte](/G:/Codex/svelte-booth/booth-library/src/lib/components/TagDialog.svelte).

Capabilities:

- View current tags for the selected product
- Remove a tag by clicking an existing tag
- Add a tag from the global tag master if the product does not already have it
- Add a new custom tag by text input

Constraints:

- Max tag length: 10 characters
- Max tags per product: 20
- Closing the dialog auto-adds the in-progress typed tag if input is non-empty and valid

Tag master behavior:

- Adding a new custom tag also inserts it into the global tag master
- Removing a tag from a product does not automatically remove it from the tag master

### 8. Bulk selection and bulk tag assignment

Bulk selection is implemented in [ProductGrid.svelte](/G:/Codex/svelte-booth/booth-library/src/lib/components/ProductGrid.svelte).

Flow:

- User enables bulk select mode from the tag area
- Product cards become selectable
- Clicking product cards toggles selection
- Clicking a tag while products are selected assigns that tag to all selected products that do not already have it

Rules:

- After bulk tag assignment, selection is cleared
- Bulk select mode is exited automatically after assignment
- Entering bulk mode emits an informational toast

### 9. Delete product

Deletion is confirmed through [DeleteConfirmDialog.svelte](/G:/Codex/svelte-booth/booth-library/src/lib/components/DeleteConfirmDialog.svelte).

Behavior:

- Clicking the delete action opens a confirmation modal
- Confirming deletion removes the product from the store
- Tags used only by the deleted product are also removed from the tag master
- Successful deletion emits a success toast

### 10. Shop list dialog

Shop browsing is handled by [ShopListDialog.svelte](/G:/Codex/svelte-booth/booth-library/src/lib/components/ShopListDialog.svelte).

Capabilities:

- Show unique shops extracted from current products
- Show product count per shop
- Sort by shop name or by item count
- Toggle ascending and descending order
- Persist sort preference in `localStorage`

Interaction:

- Clicking a shop closes the dialog and sets the main search query to that shop name

### 11. Help and fixed navigation

The persistent bottom-right navigation is implemented in [FixedNavigation.svelte](/G:/Codex/svelte-booth/booth-library/src/lib/components/FixedNavigation.svelte).

Available actions:

- Open help dialog
- Open the BOOTH library page in a new tab
- Open an X/Twitter share intent in a new tab

The help dialog documents:

- Main search and tagging functions
- JSON import workflow
- Tag usage notes
- Local-storage-based persistence
- Operational cautions

### 12. Splash screen and toast notifications

Splash behavior:

- A splash screen is shown on initial mount
- It remains visible for 1.5 seconds
- It fades out using Svelte's `fade` transition

Toast behavior:

- Toasts support `success`, `error`, and `info`
- Toasts are shown at the top-right
- Each toast auto-dismisses after 3 seconds

## Non-Functional Characteristics

- Entirely client-side state management using Svelte stores
- No backend, authentication, or server persistence
- Static deployment friendly
- Designed primarily for desktop browsing, though no explicit mobile-specific layout logic exists

## Known Implementation Notes

These are observable from the current code and should be treated as current-state notes, not intended product goals.

- The `about` page appears to be a placeholder and is not integrated into the main flow: [src/routes/about/+page.svelte](/G:/Codex/svelte-booth/booth-library/src/routes/about/+page.svelte)
- Existing tests are minimal and do not cover the main application workflows
- The page test expects an `h1`, but the main page component currently does not render one directly; only the splash screen contains an `h1`
- Help text and implementation are not fully aligned on tag limits; the help dialog says 10 tags per product, while [TagDialog.svelte](/G:/Codex/svelte-booth/booth-library/src/lib/components/TagDialog.svelte) enforces a maximum of 20
- Some UI copy still contains minor text issues even when read as UTF-8, for example the `Extract Current Pages` sentence in [JsonUploader.svelte](/G:/Codex/svelte-booth/booth-library/src/lib/components/JsonUploader.svelte)

## Suggested Scope Statement

At the current implementation level, the application should be understood as:

"A static, browser-local BOOTH library organizer that imports extracted library JSON, supports search and tag-based classification, and stores all user-maintained state in localStorage."
