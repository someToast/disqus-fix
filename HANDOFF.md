# Project Handoff: Disqus Fix Userstyle

Last updated: 2026-08-08

## Project Summary

This repository contains CSS userstyles for The Avocado (`the-avocado.org`) and its embedded Disqus comments. The active stylesheet adjusts layout, typography, colors, menus, popovers, voting controls, avatars, and dark-mode behavior on both the parent WordPress page and the Disqus iframe.

Repository: <https://github.com/someToast/disqus-fix>

Local repository:

```text
/Users/rob/Documents/dev/Disqus fix
```

Live userstyle copy:

```text
/Users/rob/Library/Mobile Documents/com~apple~CloudDocs/UserScripts/Disqus fix II.user.css
```

## Source of Truth

- `Disqus fix II.user.css` is the active stylesheet and should receive future changes.
- `Disqus fix.user.css` is the original/legacy stylesheet retained for reference.
- `README.md` contains brief installation and repository information.
- After editing the active stylesheet, copy it to the live iCloud path shown above.

Current active userstyle version: `3.2`.

The stylesheet applies to:

```text
*://the-avocado.org/*
*://*.disqus.com/*
```

## Work Completed

### General cleanup

- Reviewed the original stylesheet for redundancy and maintainability issues.
- Created `Disqus fix II.user.css` as the revised working version.
- Standardized indentation, block formatting, selector layout, comments, whitespace, and zero values.
- Added reusable custom properties for accent colors, radii, avatar sizes, dark-mode text, and the parent-page dark background.
- Retained the original stylesheet as a comparison/reference file.

### Parent-page dark mode

- Added white body text under the site's `body.wp-night-mode-on` state.
- Dimmed entry hero images only in dark mode.
- Removed opaque fills from the entry-header wrapper and inner text subtree while retaining a dark gradient overlay.
- Restyled desktop dropdown menus and the expanded mobile hamburger menu to remove heavy white frames.
- Reduced sidebar horizontal rules and header menu dividers to 50% opacity.
- Added targeted border-color overrides for Jetpack sharing/like containers.
- Added CSS-only iOS safe-area treatment using `color-scheme`, a dark root/body background, and top/bottom safe-area overlays.

### Header logo

- The original bitmap logo has a white background.
- In dark mode, the bitmap is hidden and replaced through a `::before` pseudo-element containing an embedded SVG/data URI.
- The embedded SVG applies a keying filter intended to make the white background transparent while retaining the green logo.

### Disqus layout and controls

- Adjusted post-header spacing, timestamps, avatars, badges, comment spacing, and realtime indicators.
- Moved the featured comment above the new-post editor with flex ordering.
- Removed the comment share link and replaced the post-menu dropdown icon with a CSS caret.
- Restyled profile hover cards, action buttons, voter lists, voting arrows, selected vote colors, editor controls, sorting tabs, toolbar buttons, menus, moderator badges, and pinned-post icons.
- Added separate parent/reply avatar sizing variables and rounded-corner variables.

### Disqus dark/light popovers

- Added dark styling for profile and vote-count popovers.
- Covered several observed Disqus theme markers:

```text
html[data-theme="dark"]
body[data-theme="dark"]
html[data-color-scheme="dark"]
body[data-color-scheme="dark"]
body.dark
body.theme-dark
```

- Added explicit light-mode resets so popover backgrounds and text do not remain dark after the parent page returns to light mode.

### Repository setup

- Initialized the local git repository on branch `main`.
- Created the private GitHub repository `someToast/disqus-fix`.
- Added and pushed `README.md` and `.gitignore`.
- Latest known commit at handoff preparation: `625cfb7` (`Add project README and gitignore`).

## Open Issues and Risks

### 1. Disqus theme changes may require a page reload

The parent-page light/dark toggle changes `body.wp-night-mode-on`, but Disqus is a separate iframe document. CSS inside the iframe cannot observe the parent document's class directly. The iframe's own theme markers have not consistently changed when the parent toggle is switched, so Disqus styling may not fully update until the page is reloaded.

Last observed state:

- Dark Disqus profile/voter popovers work after the iframe loads in dark mode.
- Switching between light and dark mode can still require a full page reload for all Disqus styles to stick.

Likely durable solutions require JavaScript rather than user CSS alone, such as listening for the parent toggle and recreating/reconfiguring the Disqus iframe, or injecting an explicit theme marker into the iframe when same-origin/security constraints permit it.

### 2. iOS Safari browser chrome cannot be fully controlled by CSS

The userstyle includes CSS-only dark backgrounds and safe-area overlays. This can improve the page edges visible through Safari's translucent UI, but a `.user.css` file cannot add or update:

```html
<meta name="theme-color" content="#111111">
```

Therefore the actual Safari status/address-bar tint may remain light or inconsistent. A companion JavaScript userscript could inject and update the `theme-color` meta element when `wp-night-mode-on` changes.

### 3. Several selectors are brittle

Some rules depend on implementation details that may change:

- Generated Disqus classes such as `._container_ylcfx_1`, `._toolbar_k0g7a_47`, and related hashed names.
- Specific WordPress/Jetpack markup and one post-specific selector: `#post-515870`.
- Deep structural selectors under `#content > header`.
- Disqus refresh-version class names such as `--refresh-v2`.

When a rule stops working, inspect the live DOM before changing it. Prefer stable `data-role`, semantic, or prefix selectors where available.

### 4. The embedded logo replacement is difficult to maintain

The SVG-keyed logo is stored as a very large inline base64 data URI. It is hard to inspect, review, or modify and may fail if the source logo dimensions or markup change. If the site later provides a transparent logo asset, replace the embedded data URI with that asset. A companion userscript could also replace the image source directly.

### 5. No automated visual tests

Validation has been manual on desktop and mobile screenshots. There is no CSS lint configuration, DOM fixture, screenshot suite, or browser automation in the repository. Future changes should be checked in at least these states:

- Desktop parent page, light mode
- Desktop parent page, dark mode
- Mobile navigation expanded, dark mode
- Disqus comments, light mode
- Disqus comments, dark mode
- Disqus profile popover and vote-count voter popover in both themes
- iOS Safari near the top and bottom safe areas

## Recommended Next Steps

1. Create a small companion `.user.js` only if live theme switching or Safari `theme-color` becomes a priority.
2. Replace generated/hash-based Disqus selectors with stable selectors as the live DOM permits.
3. Remove the post-specific `#post-515870` selector after verifying a general Jetpack selector covers the same border.
4. Consider reducing the repeated dark-mode popover selector lists with `:is()` after confirming target-browser support in the installed userstyle manager.
5. Add a lightweight lint/format check if the stylesheet will continue to grow.

## Development Workflow

Inspect changes before editing because the live site's WordPress and Disqus markup can change independently.

After editing the active stylesheet:

```sh
cp '/Users/rob/Documents/dev/Disqus fix/Disqus fix II.user.css' '/Users/rob/Library/Mobile Documents/com~apple~CloudDocs/UserScripts/Disqus fix II.user.css'
git diff -- 'Disqus fix II.user.css'
git add 'Disqus fix II.user.css'
git commit -m 'Describe the userstyle change'
git push origin main
```

Before pushing, verify that unrelated user changes are preserved and that the working tree contains only the intended files.

## Current Git State at Handoff Preparation

- Branch: `main`
- Tracking: `origin/main`
- Working tree was clean before adding this handoff document.
- Remote: `https://github.com/someToast/disqus-fix.git`

