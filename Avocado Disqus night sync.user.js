// ==UserScript==
// @name         Avocado Disqus night-mode sync
// @namespace    the-avocado.org
// @version      3.0
// @description  Make the Disqus comments follow the site's night-mode toggle (never prefers-color-scheme). Parent side re-inits the embed for the correct native backgrounds; frame side keeps the theme marker the userstyle keys off in sync, so text and background always match.
// @match        *://the-avocado.org/*
// @match        *://*.disqus.com/*
// @run-at       document-start
// ==/UserScript==

// Two halves cooperate across the cross-origin boundary:
//   • Parent (the-avocado.org): on toggle, re-inits Disqus with the matching
//     colorScheme so Disqus renders its own light/dark backgrounds, and tells the
//     frame the current mode.
//   • Frame (disqus.com): sets the dark markers on <html>/<body> that the CSS
//     userstyle keys off. DISQUS.reset() re-renders the comments but leaves those
//     markers stale, which otherwise leaves dark text on a light background; this
//     reasserts them (and reapplies if Disqus overwrites them).

(function () {
	'use strict';

	var SITE = 'https://the-avocado.org';
	var DISQUS = 'https://disqus.com';

	if (location.hostname.indexOf('disqus.com') !== -1) {
		// ---------- Frame side: keep the userstyle's theme markers in sync ----------
		var mode = null; // 'dark' | 'light', unknown until the parent tells us

		function apply() {
			if (!mode) return;
			var dark = mode === 'dark';
			var html = document.documentElement;
			if (html.getAttribute('data-theme') !== mode) html.setAttribute('data-theme', mode);
			if (html.getAttribute('data-color-scheme') !== mode) html.setAttribute('data-color-scheme', mode);
			if (document.body) {
				if (document.body.classList.contains('dark') !== dark) document.body.classList.toggle('dark', dark);
				if (document.body.classList.contains('theme-dark') !== dark) document.body.classList.toggle('theme-dark', dark);
			}
		}

		addEventListener('message', function (e) {
			if (e.origin !== SITE || !e.data || e.data.type !== 'avo-theme') return;
			mode = e.data.dark ? 'dark' : 'light';
			apply();
		});

		// Disqus re-renders (esp. after reset) can overwrite the markers; reassert.
		new MutationObserver(apply).observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme', 'data-color-scheme', 'class'],
		});

		// Announce readiness so the parent (re)sends the current mode — messages
		// sent before this listener existed are lost. Retry across load phases.
		function announce() {
			try {
				parent.postMessage({ type: 'avo-theme-ready' }, SITE);
			} catch (_) {}
		}
		announce();
		addEventListener('DOMContentLoaded', announce, { once: true });
		addEventListener('load', announce, { once: true });
	} else {
		// ---------- Parent side: switch Disqus's native theme + tell the frame ----------
		function isDark() {
			return document.body.classList.contains('wp-night-mode-on');
		}

		function tellFrames() {
			var frames = document.querySelectorAll('iframe[src*="disqus.com"]');
			for (var i = 0; i < frames.length; i++) {
				try {
					frames[i].contentWindow.postMessage({ type: 'avo-theme', dark: isDark() }, DISQUS);
				} catch (_) {}
			}
		}

		function reinit() {
			if (!window.DISQUS || typeof window.DISQUS.reset !== 'function') return;
			var scheme = isDark() ? 'dark' : 'light';
			var siteConfig = typeof window.disqus_config === 'function' ? window.disqus_config : null;
			window.DISQUS.reset({
				reload: true,
				config: function () {
					// Preserve the existing thread wiring so we reload the SAME thread.
					if (siteConfig) {
						siteConfig.call(this);
					} else {
						if (window.disqus_identifier) this.page.identifier = window.disqus_identifier;
						if (window.disqus_url) this.page.url = window.disqus_url;
						if (window.disqus_title) this.page.title = window.disqus_title;
					}
					this.page.colorScheme = scheme; // track the site toggle, not the OS
				},
			});
		}

		// A frame just announced itself — send it the current mode.
		addEventListener('message', function (e) {
			if (e.origin === DISQUS && e.data && e.data.type === 'avo-theme-ready') tellFrames();
		});

		var timer = null;
		var lastDark = null;
		function onToggle() {
			var now = isDark();
			if (now === lastDark) return;
			var first = lastDark === null;
			lastDark = now;
			tellFrames(); // fix the frame's markers right away
			if (!first) {
				// Reload Disqus so its own backgrounds switch. Debounced.
				clearTimeout(timer);
				timer = setTimeout(reinit, 150);
			}
		}

		function start() {
			lastDark = isDark();
			tellFrames(); // initial push (also covers a frame that loaded first)
			new MutationObserver(onToggle).observe(document.body, {
				attributes: true,
				attributeFilter: ['class'],
			});
		}
		if (document.body) start();
		else addEventListener('DOMContentLoaded', start, { once: true });
	}
})();
