// ==UserScript==
// @name         [知乎]MathJax替换为KaTeX
// @version      0.9.4
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

	GM_addStyle(GM_getResourceText('KATEX_CSS').replaceAll('fonts/', 'https://cdn.jsdelivr.net/npm/katex@0.16.2/dist/fonts/'))

	// 预定义宏
	let macros = {}
	katex.renderToString(String.raw `
		\def\label#1{}
		\def\bbox[#1]#2{\boxed{#2}}
	`, {
		globalGroup: true,
		macros: macros
	})

	let url = window.location.href
	if (url.startsWith('https://zhuanlan.zhihu.com/')) { // 文章
		renderByKatex(document)
	} else if (url.startsWith('https://www.zhihu.com/question/')) { // 问题
		// TODO
	} else if (url === 'https://www.zhihu.com/follow' || url === 'https://www.zhihu.com/') { // 首页
		// TODO
	}

	function renderByKatex(parent) {
		parent.querySelectorAll('.ztext-math').forEach(el => el.className = 'math-formula') // 阻止MathJax
		parent.querySelectorAll('.math-formula').forEach(el => {
			el.parentElement.childNodes.forEach(i => { // 清除空节点
				if (i.nodeType === 3 && i.data.trim() === '') {
					i.remove()
				}
			})
			let latex = normalize(el.dataset.tex)
			try {
				el.innerHTML = katex.renderToString(latex, {
					macros: macros
				})
				if (isDisplayFormula(el, latex)) {
					[el.previousSibling, el.nextSibling].forEach(i => { // 清除两侧换行
						if (i !== null && i.nodeType === 1 && i.tagName === 'BR') {
							i.remove()
						}
					})
					el.style = 'display: block; text-align: center;'
				}
			} catch (e) {
				el.innerHTML = '<code style="color: red;">' + e + '</code>'
			}
		})
	}

	function normalize(latex) {
		return ('\\displaystyle ' + latex + ' ')
			.replace(/(?<!\\)\s+(?![a-zA-Z\s])|(?<![a-zA-Z\\])\s+(?=[a-zA-Z])/g, '') // 清除多余空白
			.replaceAll('{align}', '{aligned}') // align只能用于display模式
			.replace(/{array}(\[.*?\])?&/g, '{array}c') // 兼容\begin{array}&
	}

	function isDisplayFormula(el, latex) {
		if (latex.endsWith('\\\\ ')) { // 知乎上的行间公式写法
			return true
		}
		if (/({(equation|align|aligned|gather|alignat|CD|darray|dcases|drcases)}|\\(tag))/.test(latex)) { // 检测通常出现在行间公式中的命令
			return true
		}
		if (el.parentElement.tagName !== 'P' && el.parentElement.childElementCount === 1) { // 非p元素的唯一子元素
			return false
		}
		if ([el.previousSibling, el.nextSibling].every(i =>
				i === null ||
				i.nodeType === 1 && (i.tagName === 'BR' || i.className === 'math-formula')
			)) { // 两侧为空
			return true
		}
		return false
	}
})()