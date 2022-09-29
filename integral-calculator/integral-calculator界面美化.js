// ==UserScript==
// @name         Integral Calculator界面美化
// @version      1.0.0
// @author       Mirion
// @match        https://www.integral-calculator.com/*
// @grant        GM_addStyle
// ==/UserScript==

(function () {
	'use strict';
	GM_addStyle(`
		#news,
		#how-it-works,
		#result-text,
		.left-col,
		#icon-explanation,
		#plot,
		#page-about,
		#menu .tab,
		#input-hint {
			display: none !important;
		}

		#menu {
			margin-left: 1em;
		}

		#pages {
			min-height: 21em;
		}

		#page-options {
			display: block !important;
		}

		.middle-right-col,
		.middle-col {
			margin-left: 0;
			width: auto;
		}

		#expression-preview,
		#expression-form {
			width: auto;
		}
    `)
})();