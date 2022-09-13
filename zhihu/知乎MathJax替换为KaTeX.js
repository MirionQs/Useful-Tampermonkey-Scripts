// ==UserScript==
// @name         知乎MathJax替换为KaTeX
// @version      0.9.2
// @author       Mirion
// @match        https://zhuanlan.zhihu.com/*
// @require      https://cdn.jsdelivr.net/npm/katex@0.16.2/dist/katex.min.js
// @resource     KATEX_CSS https://cdn.jsdelivr.net/npm/katex@0.16.2/dist/katex.min.css
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function () {
	'use strict';

	let options = {
		// 自动区分行内、行间公式（不区分的话katex将使用default配置，区分的话行内、行间公式分别使用inline,display配置，配置参数详见https://katex.org/docs/options.html）
		autoDistinguish: true,
		default: {
			displayMode: false,
			macros: {}
		},
		inline: {
			displayMode: true,
			macros: {}
		},
		display: {
			displayMode: true,
			macros: {}
		}
	}

	// 修正css样式
	GM_addStyle(GM_getResourceText('KATEX_CSS').replaceAll('fonts/', 'https://cdn.jsdelivr.net/npm/katex@0.16.2/dist/fonts/'))
	GM_addStyle(`
		.katex-display>.katex { /* 行间公式自动换行 */
			white-space: normal;
		}

		.eqn-num { /* 隐藏自动编号 */
			display: none !important;
		}

		[inline-formula] .katex-display,
		[inline-formula] .katex-display>.katex,
		[inline-formula] .katex-display>.katex>.katex-html {
			display: inline;
		}
	`)

	// 修正katex中缺失的命令
	katex.renderToString(String.raw `
		\def\label#1{}
	`, {
		globalGroup: true,
		macros: options.default.macros
	})
	options.inline.macros = options.display.macros = options.default.macros

	document.querySelectorAll('.ztext-math').forEach(el => {
		try {
			let latex = normalize(el.dataset.tex)
			let opt = options.default
			if (options.autoDistinguish) {
				el.parentElement.childNodes.forEach(i => { // 清除空结点，方便判定
					if (i.nodeType === 3 && i.data.trim() === '') {
						i.remove()
					}
				})
				if (isDisplayFormula(el, latex)) {
					opt = options.display
					el.setAttribute('display-formula', '')
				} else {
					opt = options.inline
					el.setAttribute('inline-formula', '')
				}
			}
			katex.render(latex, el, opt)
		} catch (err) {
			el.innerHTML = '<code style="color: red;">' + err + '</code>'
		}
	})

	function normalize(str) {
		// 去除多余空白字符
		str = ' ' + str.replace(/\s+/g, ' ') + ' '
		let t = ''
		for (let i = 1; i < str.length - 1; ++i) {
			if (/\s/.test(str[i])) {
				if (str[i - 1] === '\\' || /[a-zA-Z]/.test(str[i - 1]) && /[a-zA-Z]/.test(str[i + 1])) {
					t += str[i]
				} else {
					continue
				}
			} else {
				t += str[i]
			}
		}
		// 修正mathjax中正常但会使katex报错的latex代码
		return t
			.replace(/\\begin{array}(\[.*?\])?&/g, '\\begin{array}c') // 兼容\begin{array}&
			.replace(/\\bbox(\[.*?\])?/g, '\\boxed') // 兼容\bbox（退化成\boxed）
	}

	function isDisplayFormula(el, latex) {
		if (el.parentElement.tagName !== 'P' && el.parentElement.childElementCount === 1) { // 非p元素的唯一子元素
			return false
		}
		if (/(\\begin{(equation|align|aligned|gather|alignat|CD|darray|dcases|drcases)}|\\(tag))/.test(latex)) { // 检测通常用在行间公式中的命令
			return true
		}
		if (latex.endsWith('\\\\ ')) { // 知乎上通常以这种方式督促公式居中，所以判定为行间公式
			return true
		}
		if (isEmpty(el.previousSibling) && isEmpty(el.nextSibling)) { // 两侧为空
			return true
		}
		return false

		function isEmpty(e) {
			return e === null ||
				e.nodeType === 1 && (e.tagName === 'BR' || e.className === 'ztext-math')
		}
	}

})();