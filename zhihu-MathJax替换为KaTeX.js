"use strict";
// ==UserScript==
// @name         [知乎]MathJax替换为KaTeX
// @version      0.9.5
// @author       Mirion
// @match        https://zhuanlan.zhihu.com/*
// @match        https://www.zhihu.com/question/*
// @match        https://www.zhihu.com/follow
// @match		 https://www.zhihu.com/
// @require      https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.js
// @resource     KATEX_CSS https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/katex.min.css
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @run-at       document-end
// ==/UserScript==
(function () {
    'use strict';
    GM_addStyle(GM_getResourceText('KATEX_CSS').replaceAll('fonts/', 'https://cdn.jsdelivr.net/npm/katex@0.16.4/dist/fonts/'));
    GM_addStyle('.katex-display>.katex{white-space:normal}.katex-display>.base{margin:0.25em 0}.katex-display{margin:0.5em 0}'); // 自动换行
    // 补充KaTeX缺少的宏
    const macros = {
        '\\idotsint': '\\int\\cdots\\int'
    };
    katex.renderToString(`
		\\def\\label#1{}
		\\def\\bbox[#1]#2{\\boxed{#2}}
	`, {
        globalGroup: true,
        macros
    });
    const url = window.location.href;
    if (url.startsWith('https://zhuanlan.zhihu.com/')) { // 文章
        renderByKatex(document.getElementsByClassName('Post-RichTextContainer')[0]);
    }
    else if (url.startsWith('https://www.zhihu.com/question/')) { // 问题
        // TODO
    }
    else if (url === 'https://www.zhihu.com/follow' || url === 'https://www.zhihu.com/') { // 首页
        // TODO
    }
    function renderByKatex(element) {
        Array.prototype.forEach.call(element.getElementsByClassName('ztext-math'), (el) => {
            normalize(el);
            katex.render(el.dataset.tex, el, {
                throwOnError: false,
                displayMode: isDisplayFormula(el),
                macros
            });
        });
    }
    function normalize(element) {
        element.parentElement.childNodes.forEach(el => {
            el.nodeType === Node.TEXT_NODE && el.data.trim() === '' && el.remove();
        });
        element.dataset.tex = ('\\displaystyle ' + element.dataset.tex) // 行内公式以行间模式显示
            .replace(/(?<=[^\\](\\\\)+)\\$/, '') // 去除末尾单独的'\'，否则KaTeX会报错
            .replace(/{(align|alignat|gather|equation)}/g, '{$1*}') // 使用这些环境时MathJax不会自动编号，因此KaTeX也不应该自动编号
            .replace(/\\(left|middle|right|big|bigl|bigm|bigr|Big|Bigl|Bigm|Bigr|bigg|biggl|biggm|biggr|Bigg|Biggl|Biggm|Bigg){(.)}/g, '\\$1$2'); // KaTeX不允许形如'\big{/}'的代码
    }
    function isDisplayFormula(element) {
        const latex = element.dataset.tex;
        if (/\\(\\|tag)|{((align|alignat|gather|equation)\*|CD|aligned|alignedat|gathered)}/.test(latex)) { // 行间环境和常出现行间模式的环境和命令
            return true;
        }
        if (element.parentElement.tagName !== 'P' && element.parentElement.childElementCount === 1) { // 非段落的唯一子元素
            return false;
        }
        if ([element.previousSibling, element.nextSibling].every(el => el === null || el.nodeType === Node.ELEMENT_NODE && (el.tagName === 'BR' || el.className === 'ztext-math'))) { // 两侧为空
            return true;
        }
        return false;
    }
})();
