// ==UserScript==
// @name         Avocado Disqus night-mode sync
// @namespace    the-avocado.org
// @version      4.0
// @description  Make the Disqus comments follow the site's night-mode toggle (never prefers-color-scheme), hardened for mobile. Primary path: wrap disqus_config so every Disqus init — including the lazy first load on scroll — bakes the live colorScheme, giving a correct native render (backgrounds + theme markers) with no reset and no cross-frame dependency. Fallbacks: re-init in place if the thread is already loaded when the toggle flips, and a best-effort frame-side marker sync.
// @match        *://the-avocado.org/*
// @match        *://*.disqus.com/*
// @run-at       document-start
// ==/UserScript==

(function () {
	'use strict';

	var SITE = 'https://the-avocado.org';
	var DISQUS_ORIGIN = 'https://disqus.com';

	// =========================================================================
	// Frame side (disqus.com): best-effort marker sync, only needed after an
	// in-place DISQUS.reset (which re-renders comments but leaves the <html>
	// theme markers stale). Fresh loads set these natively, so on the common
	// mobile path this half isn't relied upon.
	// =========================================================================
	if (location.hostname.indexOf('disqus.com') !== -1) {
		var mode = null; // 'dark' | 'light'

		function applyMarkers() {
			if (!mode) return;
			var dark = mode === 'dark';
			var html = document.documentElement;
			if (html.getAttribute('data-theme') !== mode) html.setAttribute('data-theme', mode);
			if (html.getAttribute('data-color-scheme') !== mode) html.setAttribute('data-color-scheme', mode);
			var body = document.body;
			if (body) {
				if (body.classList.contains('dark') !== dark) body.classList.toggle('dark', dark);
				if (body.classList.contains('theme-dark') !== dark) body.classList.toggle('theme-dark', dark);
			}
		}

		addEventListener('message', function (e) {
			if (e.origin !== SITE || !e.data || e.data.type !== 'avo-theme') return;
			mode = e.data.dark ? 'dark' : 'light';
			applyMarkers();
		});

		new MutationObserver(applyMarkers).observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme', 'data-color-scheme', 'class'],
		});

		function announce() {
			try {
				parent.postMessage({ type: 'avo-theme-ready' }, SITE);
			} catch (_) {}
		}
		announce();
		addEventListener('DOMContentLoaded', announce, { once: true });
		addEventListener('load', announce, { once: true });
		return;
	}

	// =========================================================================
	// Parent side (the-avocado.org)
	// =========================================================================
	function isDark() {
		return !!(document.body && document.body.classList.contains('wp-night-mode-on'));
	}

	// --- 1) PRIMARY: wrap disqus_config so every init bakes the live scheme ---
	// A getter/setter makes this robust to load order: whenever the site assigns
	// its own disqus_config we capture it; whenever Disqus reads disqus_config it
	// gets our wrapper (site config first — which sets identifier/url/title — then
	// the live colorScheme). This makes the lazy first load on mobile render in
	// the correct theme with no reset and no reliance on the frame-side script.
	var siteConfig = typeof window.disqus_config === 'function' ? window.disqus_config : null;
	function wrappedConfig() {
		if (siteConfig) siteConfig.call(this);
		this.page.colorScheme = isDark() ? 'dark' : 'light';
	}
	try {
		Object.defineProperty(window, 'disqus_config', {
			configurable: true,
			get: function () {
				return wrappedConfig;
			},
			set: function (fn) {
				siteConfig = typeof fn === 'function' ? fn : null;
			},
		});
	} catch (e) {
		window.disqus_config = wrappedConfig; // fallback if the property is locked
	}

	// --- 2) Best-effort: tell any loaded Disqus frame the current mode ---
	function tellFrames() {
		var frames = document.querySelectorAll('iframe[src*="disqus.com"]');
		for (var i = 0; i < frames.length; i++) {
			try {
				frames[i].contentWindow.postMessage({ type: 'avo-theme', dark: isDark() }, DISQUS_ORIGIN);
			} catch (_) {}
		}
	}
	addEventListener('message', function (e) {
		if (e.origin === DISQUS_ORIGIN && e.data && e.data.type === 'avo-theme-ready') tellFrames();
	});

	// --- 3) FALLBACK: in-place re-init when the thread is already loaded ---
	// (Lazy loads are handled by the wrapped config above, so this only fires when
	// you toggle while the comments are already on screen.)
	function commentsLoaded() {
		return !!document.querySelector('iframe[id^="dsq-app"], iframe[src*="disqus.com/embed/comments"]');
	}
	function reinit(attempt) {
		if (!commentsLoaded()) return; // not loaded yet → wrapped config will handle it
		if (!window.DISQUS || typeof window.DISQUS.reset !== 'function') {
			if ((attempt || 0) < 20) {
				setTimeout(function () {
					reinit((attempt || 0) + 1);
				}, 250); // wait for the embed API to come up
			}
			return;
		}
		window.DISQUS.reset({ reload: true, config: wrappedConfig });
		tellFrames();
	}

	var timer = null;
	var applied = null;
	function onToggle() {
		var now = isDark();
		if (now === applied) return; // ignore class churn that isn't a real flip
		applied = now;
		tellFrames();
		clearTimeout(timer);
		timer = setTimeout(function () {
			reinit(0);
		}, 150);
	}

	function start() {
		applied = isDark();
		new MutationObserver(onToggle).observe(document.body, {
			attributes: true,
			attributeFilter: ['class'],
		});
	}
	if (document.body) start();
	else addEventListener('DOMContentLoaded', start, { once: true });
})();
