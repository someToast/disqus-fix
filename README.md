# disqus-fix

Userstyle overrides for The Avocado and embedded Disqus threads.

## Files

- `Disqus fix II.user.css`: current working stylesheet (active version)
- `Avocado Disqus night sync.user.js`: userscript that makes the Disqus comments
  follow the site's night-mode toggle (not the OS `prefers-color-scheme`). On
  toggle the parent side re-inits the embed (`DISQUS.reset`) with a matching
  `colorScheme` so Disqus renders its own light/dark backgrounds, and the frame
  side sets the theme markers the stylesheet keys off so text and background
  stay in sync.

## What This Changes

- Dark mode and light mode appearance tuning
- Header/menu border and background cleanup
- Disqus typography, spacing, avatar sizing, and vote/menu styling
- Disqus popover/profile/voter menu theming
- Mobile menu and iOS-safe visual edge improvements

## Install / Update

1. Install a userstyle manager (for example, Stylus).
2. Add `Disqus fix II.user.css` as a style.
3. Make sure the style is enabled for:
   - `*://the-avocado.org/*`
   - `*://*.disqus.com/*`

## Development

Edit `Disqus fix II.user.css`, then commit and push updates.

