// ==UserScript==
// @name         知乎MathJax替换为KaTeX
// @version      0.9.3
// @author       Mirion
// @match        https://zhuanlan.zhihu.com/*
// @match        https://www.zhihu.com/question/*
// @match        https://www.zhihu.com/follow
// @match		 https://www.zhihu.com/
// @require      https://cdn.jsdelivr.net/npm/katex@0.16.2/dist/katex.min.js
// @resource     KATEX_CSS https://cdn.jsdelivr.net/npm/katex@0.16.2/dist/katex.min.css
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==

(function () {
	'use strict'

	let options = {
		// 自动区分行内、行间公式（不区分的话katex将使用default配置，区分的话行内、行间公式分别使用inline,display配置，配置参数详见https://katex.org/docs/options.html）
		autoDistinguish: true,
		default: {
			displayMode: false
		},
		inline: {
			displayMode: true
		},
		display: {
			displayMode: true
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
	let macros = {}
	katex.renderToString(String.raw `
		\def\label#1{}
		\def\bbox[#1]#2{\boxed{#2}}
	`, {
		globalGroup: true,
		macros: macros
	})
	Object.assign(options.default.macros = options.default.macros || {}, macros)
	Object.assign(options.inline.macros = options.inline.macros || {}, macros)
	Object.assign(options.display.macros = options.display.macros || {}, macros)

	let url = window.location.href
	if (url.startsWith('https://zhuanlan.zhihu.com/')) { // 文章
		renderByKatex(document)
	} else if (url.startsWith('https://www.zhihu.com/question/')) { // 问题
		// TODO
	} else if (url === 'https://www.zhihu.com/follow' || url === 'https://www.zhihu.com/') { // 首页
		let observer = new MutationObserver(records => {
			//renderByKatex(records[0].target) // ! 失败，麻
		})
		document.querySelectorAll('.RichContent').forEach(el => {
			observer.observe(el, {
				attributes: true
			})
		})
	}

	function renderByKatex(parent) {
		parent.querySelectorAll('.ztext-math').forEach(el => {
			try {
				let latex = normalize(el.dataset.tex)
				let opt = options.default
				if (options.autoDistinguish) {
					el.parentElement.childNodes.forEach(i => { // 清除空节点，防止影响判断
						if (i.nodeType === 3 && i.data.trim() === '') {
							i.remove()
						}
					})
					if (isDisplayFormula(el, latex)) {
						el.setAttribute('display-formula', '')
						opt = options.display

						removeBr(el.previousSibling)
						removeBr(el.nextSibling)

						function removeBr(e) { // 清除两侧多余换行
							if (e !== null && e.nodeType === 1 && e.tagName === 'BR') {
								e.remove()
							}
						}
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
	}

	// 修正mathjax中正常但会使katex报错的latex代码
	function normalize(str) {
		return (str + ' ') // 兼容末尾单独的\
			.replace(/(?<!\\)\s+(?![a-zA-Z\s])|(?<![a-zA-Z\\])\s+(?=[a-zA-Z])/g, '') // 清楚多余的空白字符，防止影响判断
			.replace(/\\begin{array}(\[.*?\])?&/g, '\\begin{array}c') // 兼容\begin{array}&
	}

	// 行内、行间判定算法
	function isDisplayFormula(el, latex) {
		if (el.parentElement.tagName !== 'P' && el.parentElement.childElementCount === 1) { // 非p元素的唯一子元素
			return false
		}
		if (latex.endsWith('\\\\ ')) { // 知乎上通常以这种方式督促公式居中，所以判定为行间公式
			return true
		}
		if (/(\\begin{(equation|align|aligned|gather|alignat|CD|darray|dcases|drcases)}|\\(tag))/.test(latex)) { // 检测通常出现在行间公式中的命令
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

})()