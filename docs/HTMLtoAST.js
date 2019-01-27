var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
function warn(message) {
    console.warn(message);
}
function error(message) {
    console.error(message);
}
function getHtmlTemplate(root) {
    return document.querySelector(root).outerHTML;
}
function log(mes) {
    return function (target) {
        console.log(mes);
    };
}
var AST = /** @class */ (function () {
    function AST(option) {
        var el = option.el, template = option.template;
        var html = el ? getHtmlTemplate(el) : template;
        console.log(template);
        return this.praseHTML(html);
    }
    AST.prototype.praseHTML = function (html) {
        var AstStack = undefined;
        var root = undefined;
        var stack = [];
        var note = /^<!--/;
        var tagName = '([a-zA-Z_][\\w\\-\\.]*)';
        var startTag = new RegExp("^<(" + tagName + ")");
        var startTagClose = new RegExp('^\\s*(\/?)>'); // 结束匹配
        var attribute = /^\s*([^'"<>\/=]+)(?:\s*(=)?\s*(?:"([^"]*)"|'([^']*)'))?/; // 属性匹配
        var endTag = new RegExp("^</" + tagName + "\\s*>");
        var specialLabel = ['style', 'script']; // 特殊标签
        while (html) {
            // 注释 <!---->
            if (note.test(html)) {
                var noteEnd = html.indexOf('-->');
                if (noteEnd !== -1) {
                    noteNode(html.substring(4, noteEnd));
                    advance(noteEnd + 3);
                    continue;
                }
            }
            // 声明 <!DOCTYPE>
            var DTD = html.match(/^<(!DOCTYPE[^>]*)>/i);
            if (DTD) {
                dtdNode(DTD[1]);
                advance(DTD[0].length);
                continue;
            }
            // 开始标签
            var startTag_1 = parseStartTag();
            if (startTag_1) {
                var flag = startTag_1.flag, tag = startTag_1.tag;
                var attrs = [];
                while (startTag_1.attrs.length) {
                    var attr = startTag_1.attrs.shift();
                    attrs.push({
                        attr: attr[1],
                        value: attr[3] || null
                    });
                }
                var index = void 0;
                if (index = specialLabel.indexOf(tag) !== -1) {
                    delLabel(index, startTag_1);
                    continue;
                }
                if (!flag) {
                    startNode(tag, attrs, flag);
                }
                else {
                    AstStack['children'].push({
                        type: 1,
                        tag: tag,
                        attrs: attrs,
                        value: null,
                        children: []
                    });
                    continue;
                }
            }
            // 文本
            if (/^[^<]/.test(html)) {
                var texts = html.indexOf('<', 1); // vue 中字符级别的优化
                if (texts > 0) {
                    var rest = html.slice(0, texts);
                    textNode(rest);
                    advance(texts);
                }
                else { // 待定
                    textNode(html);
                }
            }
            // 结束标签
            var end = void 0;
            if (end = html.match(endTag)) {
                advance(end[0].length);
                endNode();
            }
        }
        // 处理特殊标签
        function delLabel(index, startTag) {
            var tag = startTag.tag;
            var special = new RegExp("</" + tag + "\\s*>");
            var specialLabel = html.match(special) ? html.match(special) : error('没有结束标签');
            AstStack['children'].push({
                type: 1,
                tag: tag,
                value: html.substring(0, specialLabel['index']),
                isSpecial: true,
            });
            advance(specialLabel['index'] + specialLabel[0].length);
        }
        function textNode(text) {
            AstStack['children'].push({
                type: 3,
                value: text,
                isText: true
            });
        }
        function dtdNode(text) {
            AstStack['children'].push({
                type: 10,
                value: text,
                isDTD: true
            });
        }
        function noteNode(note) {
            AstStack['children'].push({
                type: 8,
                value: note,
                isNote: true
            });
        }
        function startNode(tagName, attrs, flag) {
            var node = createNode(tagName, attrs);
            if (!root) {
                root = node;
            }
            else {
                AstStack.children.push(node);
            }
            if (!flag) {
                AstStack = node;
                stack.push(node);
            }
        }
        function endNode() {
            if (!stack.length)
                return;
            stack.length--; // 还有这种操作，除去数组最后一个元素
            AstStack = stack[stack.length - 1];
        }
        function createNode(tagName, attrs) {
            return {
                tag: tagName,
                attrs: attrs,
                children: [],
                value: null,
                type: 1
            };
        }
        function parseStartTag() {
            var tag = html.match(startTag);
            if (tag) {
                var match = {
                    attrs: [],
                    tag: tag[1],
                    flag: false
                };
                advance(tag[0].length);
                var end = void 0, attr = void 0;
                while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
                    advance(attr[0].length);
                    match.attrs.push(attr);
                }
                if (end) {
                    match.flag = end[1];
                    advance(end[0].length);
                    return match;
                }
            }
        }
        function advance($n) {
            html = html.substring($n).trim();
        }
        return root;
    };
    AST = __decorate([
        log('AST解析开始')
    ], AST);
    return AST;
}());
