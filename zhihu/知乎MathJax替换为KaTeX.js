// ==UserScript==
// @name         知乎MathJax替换为KaTeX
// @version      0.9.1
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
		autoDistinguish: true,
		default: {
			displayMode: false,
			css: ''
		},
		inline: {
			displayMode: true,
			css: 'display: inline-block; margin: 0;'
		},
		display: {
			displayMode: true,
			css: ''
		}
	}

	GM_addStyle(GM_getResourceText('KATEX_CSS')
		.replaceAll('fonts/', 'https://cdn.jsdelivr.net/npm/katex@0.16.2/dist/fonts/')
		.replaceAll('.eqn-num', '$') // 制裁自动编号
	)

	document.querySelectorAll('.ztext-math').forEach(el => {
		try {
			let latex = normalize(el.getAttribute('data-tex'))
			let op = options.default
			if (options.autoDistinguish) {
				el.parentElement.childNodes.forEach(i => { // 清除空结点，方便判定
					if (i.nodeType === 3 && i.data.trim() === '') {
						i.remove()
					}
				})
				op = isDisplayFormula(el, latex) ? options.display : options.inline
			}
            console.log(katex)
			katex.render(latex, el, {
				displayMode: op.displayMode
			})
			//el.firstChild.removeAttribute('class') // 清除katex的样式
			el.firstChild.style = op.css
		} catch (err) {
			el.innerHTML = '<code style="color: red;">' + err + '</code>'
		}
	})

	function normalize(s) {
		// 修正MathJax中正常但会使得KaTeX报错的latex代码
		return (s.trim() + ' ') // 兼容末尾单独的\
			.replace(/\\begin{array}\s*(\[.*?\])?\s*&/g, '\\begin{array}c') // 兼容\begin{array}&...
			.replace(/\\color{\s*/g, '\\color{') // 兼容\color{<空格>#...}
			.replace(/\\bbox\s*(\[.*?\])?/g, '\\boxed') // 兼容\bbox...
	}

	function isDisplayFormula(e, latex) {
		if (/(\\begin{(equation|align|gather|alignat|CD|darray|dcases|drcases)}|\\(tag))/.test(latex)) { // 检测通常用在行间公式中的命令
			return true
		}
		if(latex.endsWith('\\\\ ')){ // 知乎上通常以这种方式督促公式居中，所以判定为行间公式
			return true
		}
		if (isEmpty(e.previousSibling) && isEmpty(e.nextSibling)) { // 两侧为空
			return true
		}
		return false

		function isEmpty(e) {
			return e === null ||
				e.nodeType === 1 && (e.tagName === 'BR' || e.className === 'ztext-math')
		}
	}

})();
