define("HTMLtoAST", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function warn(message) {
        console.warn(message);
    }
    function error(message) {
        console.error(message);
    }
    function getHtmlTemplate(root) {
        return document.querySelector(root).outerHTML
            || document.body.outerHTML;
    }
    function log(mes) {
        return function (target, string, descriptor) {
            console.log(mes);
        };
    }
    // Node类对象类型
    var NodeType;
    (function (NodeType) {
        NodeType[NodeType["ELEMENT_NODE"] = 1] = "ELEMENT_NODE";
        NodeType[NodeType["TEXT_NODE"] = 3] = "TEXT_NODE";
        NodeType[NodeType["COMMENT_NODE"] = 8] = "COMMENT_NODE";
        NodeType[NodeType["DOCUMENT_TYPE_NODE"] = 10] = "DOCUMENT_TYPE_NODE";
    })(NodeType || (NodeType = {}));
    var AST = /** @class */ (function () {
        function AST(option) {
            var el = option.el, template = option.template;
            var html = el ? getHtmlTemplate(el) : template;
            return this.praseHTML(html);
        }
        // @log('AST解析开始')
        AST.prototype.praseHTML = function (html) {
            var AstStack, root;
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
                            type: NodeType.ELEMENT_NODE,
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
                var specialLabel = html.match(special) ? html.match(special) : error("\u6CA1\u6709\u7ED3\u675F\u6807\u7B7E" + tag);
                AstStack['children'].push({
                    type: NodeType.ELEMENT_NODE,
                    tag: tag,
                    value: html.substring(0, specialLabel['index']),
                    isSpecial: true,
                });
                advance(specialLabel['index'] + specialLabel[0].length);
            }
            function textNode(text) {
                AstStack['children'].push({
                    type: NodeType.TEXT_NODE,
                    value: text,
                    isText: true
                });
            }
            function dtdNode(text) {
                AstStack['children'].push({
                    type: NodeType.DOCUMENT_TYPE_NODE,
                    value: text,
                    isDTD: true
                });
            }
            function noteNode(note) {
                AstStack['children'].push({
                    type: NodeType.COMMENT_NODE,
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
                    type: NodeType.ELEMENT_NODE
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
        return AST;
    }());
    exports.default = AST;
});
define("Dom", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Dom = /** @class */ (function () {
        function Dom() {
            this.Tree = [];
        }
        Dom.createEle = function (ele) {
            return document.createElement(ele);
        };
        Dom.appendEle = function (par, child) {
            par.appendChild(child);
        };
        Dom.setAttr = function (Ele, attrs) {
            for (var i = 0, len = attrs.length; i < len; i++) {
                var $a = attrs[i]['attr'];
                var Attr_1 = document.createAttribute($a);
                Attr_1.nodeValue = attrs[i]['value'] || $a;
                Ele.setAttributeNode(Attr_1);
            }
        };
        Dom.setText = function (Ele, text, type) {
            var $t;
            if (type === 8) {
                $t = document.createComment(text);
            }
            else {
                $t = document.createTextNode(text);
            }
            /*
            else if (type === 10) {
              text = `<!DOCTYPE html>`
            } */
            Ele.appendChild($t);
            return $t;
        };
        Dom.removeEle = function (Ele, child) {
            Ele.removeChild(child);
        };
        Dom.replace = function (par, value, node, type) {
            var Txt = this.setText(par, value, type);
            par.replaceChild(Txt, node);
            return Txt;
        };
        Dom.removeAttr = function (Ele, attr) {
            Ele.removeAttribute(attr);
        };
        Dom.insertBeforeNode = function (par, newnode, existingnode) {
            par.insertBefore(newnode, existingnode);
        };
        Dom.getEle = function (Ele) {
            if ('querySelector' in document) {
                return document.querySelector(Ele);
            }
            else {
                // Typescript 此处有问题
                // 可能没问题，但是我没弄出来，就是他有问题 ^__^
                /*
                let Ident
                if (!(Ident = Ele.match(/^(\.|\#)?/))) {
                  if (Ident[1] == '.') {
                    return document.getElementsByClassName(Ele.substring(1))
                  } else {
                    return document.getElementsById(Ele.substring(1))
                  }
                } else {
                  return this.createEle('div')
                } */
                return this.createEle('div');
            }
        };
        // 递归生成层级树
        Dom.prototype.createTree = function (ast, $i) {
            ast = ast[0];
            var index = $i || 0;
            var tag = ast.tag, type = ast.type, children = ast.children;
            var Ele = Dom.createEle('div');
            if (type === 1) {
                Dom.setText(Ele, tag, type);
            }
            else if (type === 3) {
                Dom.setText(Ele, '&T', 1);
            }
            else if (type === 8) {
                Dom.setText(Ele, '&C', 1);
            }
            else {
                Dom.setText(Ele, '&D', 1);
            }
            this.Tree[index] ? this.Tree[index].push({ Ele: Ele, Attr: { tag: tag, type: type } })
                : this.Tree[index] = [{ Ele: Ele, Attr: { tag: tag, type: type } }];
            if (children && children.length) {
                index++;
                for (var i = 0, len = children.length; i < len; i++) {
                    this.createTree([children[i]], index);
                }
            }
            return this.Tree;
        };
        // 递归
        Dom.prototype.h = function (ast, parent) {
            ast = ast[0];
            var children = ast.children, tag = ast.tag, attrs = ast.attrs, value = ast.value, type = ast.type;
            var Ele, Txt;
            if (parent)
                ast.parent = parent;
            switch (type) {
                case 1:
                    Ele = Dom.createEle(tag);
                    ast.Ele = Ele;
                    if (attrs && attrs.length)
                        Dom.setAttr(Ele, attrs);
                    if (value)
                        Txt = Dom.setText(Ele, value, type);
                    if (parent)
                        Dom.appendEle(parent, ast.Ele);
                    break;
                default:
                    if (value)
                        Txt = Dom.setText(parent, value, type);
            }
            ast.Txt = Txt;
            if (children && children.length) {
                for (var i = 0, len = children.length; i < len; i++) {
                    this.h([children[i]], ast.Ele);
                }
            }
            return ast;
        };
        return Dom;
    }());
    exports.default = Dom;
});
define("Utils", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Util = /** @class */ (function () {
        function Util() {
        }
        Util.insertRearward = function (array, index, inx) {
            array.splice(index, 0, array[inx]);
            if (inx > index) {
                array.splice(inx + 1, 1);
            }
            else {
                array.splice(inx, 1);
            }
            return array;
        };
        Util.isSomeArrayObj = function ($1, $2) {
            if ($1.length !== $2.length)
                return false;
            return $1.every(function (item, index) {
                if (!$2[index])
                    return false;
                if (item['attr'] === $2[index]['attr'])
                    return true;
            });
        };
        return Util;
    }());
    exports.default = Util;
});
define("Diff", ["require", "exports", "Dom", "Utils"], function (require, exports, Dom_1, Utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var Diff = /** @class */ (function () {
        function Diff() {
        }
        Diff.prototype.diff = function (oldNode, node, ele) {
            if (!oldNode.length) { // 初次渲染
                var dom = new Dom_1.default().h(node);
                Dom_1.default.appendEle(Dom_1.default.getEle(ele), dom.Ele);
                return dom;
            }
            var oldN = oldNode[0], N = node[0];
            if (this.isSomeNode(oldN, N)) { // 判断是否值得比较 
                this.patch(oldN, N);
            }
            else {
                var dom = new Dom_1.default().h(node);
                Dom_1.default.removeEle(Dom_1.default.getEle(ele), Dom_1.default.getEle(ele).firstElementChild);
                Dom_1.default.appendEle(Dom_1.default.getEle(ele), dom.Ele);
            }
            return oldN;
        };
        Diff.prototype.patch = function (oldNode, node) {
            var oldType = oldNode.type;
            if (oldType === 8
                || oldType === 3
                || (oldType === 1 && (['script', 'style'].indexOf(oldNode['tag']) !== -1))
                || oldType === 10) {
                if (oldNode.value !== node.value) {
                    if (oldType === 1) {
                        oldNode.Txt = Dom_1.default.replace(oldNode.Ele, node.value, oldNode.Txt, oldType);
                    }
                    else {
                        oldNode.Txt = Dom_1.default.replace(oldNode.parent, node.value, oldNode.Txt, oldType);
                    }
                }
            }
            else {
                // 获取子节点判断是否都存在
                this.updateAttr(oldNode.Ele, oldNode.attrs, node.attrs);
                var oldChild = oldNode.children && oldNode.children.length;
                var child = node.children && node.children.length;
                if (!oldChild && !child) {
                    return;
                }
                else if (!oldChild && child) {
                    Dom_1.default.appendEle(oldNode.parent, new Dom_1.default().h(node).Ele);
                }
                else if (oldChild && !child) {
                    Dom_1.default.removeEle(oldNode.parent, oldNode.Ele);
                }
                else {
                    this.patchVnode(oldNode.children, node.children);
                }
            }
        };
        Diff.prototype.updateAttr = function (Ele, Attrs, newAttr) {
            if (Utils_1.default.isSomeArrayObj(Attrs, newAttr)) {
                return;
            }
            console.log('ppp');
            Attrs.forEach(function (item) {
                Dom_1.default.removeAttr(Ele, item['attr']);
            });
            Dom_1.default.setAttr(Ele, newAttr);
        };
        Diff.prototype.patchVnode = function (oldNode, node) {
            var oldstartIndex = 0, startIndex = 0;
            var oldEndIndex = oldNode.length - 1, endIndex = node.length - 1;
            var oldStartVnode = oldNode[0], oldEndVnode = oldNode[oldNode.length - 1];
            var startVnode = node[0], endVnode = node[node.length - 1];
            while (oldstartIndex <= oldEndIndex && startIndex <= endIndex) {
                if (this.isSomeNode(oldStartVnode, startVnode)) {
                    this.patch(oldStartVnode, startVnode);
                    oldStartVnode = oldNode[++oldstartIndex];
                    startVnode = node[++startIndex];
                }
                else if (this.isSomeNode(oldEndVnode, endVnode)) {
                    this.patch(oldEndVnode, endVnode);
                    oldEndVnode = oldNode[--oldEndIndex];
                    endVnode = node[--endIndex];
                }
                else if (this.isSomeNode(oldStartVnode, endVnode)) {
                    this.patch(oldStartVnode, endVnode);
                    // 位置判断
                    var inx = oldNode.length - (node.length - endIndex) - 1;
                    Dom_1.default.insertBeforeNode(oldNode[0]['parent'], oldNode[oldstartIndex]['Ele'], oldNode[inx]['Ele']);
                    Utils_1.default.insertRearward(oldNode, inx, oldstartIndex);
                    endVnode = node[--endIndex];
                }
                else if (this.isSomeNode(oldEndVnode, startVnode)) {
                    this.patch(oldEndVnode, startVnode);
                    var inx = startIndex - 1;
                    Dom_1.default.insertBeforeNode(oldNode[0]['parent'], oldNode[oldEndIndex]['Ele'], oldNode[inx]['Ele']);
                    Utils_1.default.insertRearward(oldNode, inx, oldEndIndex);
                    startVnode = node[++startIndex];
                }
                else {
                    var i = 0, len = oldNode.length, success = false;
                    while (len) {
                        if (this.isSomeNode(startVnode, oldNode[i])) {
                            Dom_1.default.insertBeforeNode(oldNode[0]['parent'], oldNode[i]['Ele'], oldNode[oldstartIndex]['Ele']);
                            oldNode = Utils_1.default.insertRearward(oldNode, (oldstartIndex ? oldstartIndex : 0), i);
                            ++oldstartIndex;
                            success = true;
                            break;
                        }
                        ++i;
                        --len;
                    }
                    if (!success) {
                        Dom_1.default.insertBeforeNode(oldNode[0]['parent'], new Dom_1.default().h([startVnode]).Ele, oldNode[oldstartIndex]['Ele']);
                        startVnode = node[++startIndex];
                    }
                }
            }
            if (oldstartIndex > oldEndIndex) {
                var existingnode = oldNode[oldEndIndex]['Ele'];
                var dom = void 0, index = oldstartIndex;
                for (var i = startIndex; i <= endIndex; i++) {
                    dom = new Dom_1.default().h([node[i]]);
                    Dom_1.default.insertBeforeNode(oldNode[0]['parent'], dom['Ele'], existingnode);
                    existingnode = dom;
                    oldNode.splice(index, 0, dom);
                    index = i;
                }
            }
            else if (startIndex > endIndex) {
                for (var i = oldstartIndex; i <= oldEndIndex; i++) {
                    if (oldNode[i]) {
                        Dom_1.default.removeEle(oldNode[0]['parent'], oldNode[i]['Ele']);
                    }
                }
            }
        };
        Diff.prototype.isSomeNode = function (oldNode, node) {
            if (!node)
                return false;
            var type = oldNode.type, tag = oldNode.tag;
            if (type === 1
                && type === node.type
                && tag === node.tag) {
                return true;
            }
            else if (type === 3 && type === node.type
                || (type === 8 && type === node.type)
                || (type === 10 && type === node.type)) {
                return true;
            }
            return false;
        };
        return Diff;
    }());
    exports.default = Diff;
});
define("Index", ["require", "exports", "HTMLtoAST", "Diff", "Dom"], function (require, exports, HTMLtoAST_1, Diff_1, Dom_2) {
    "use strict";
    var Index = /** @class */ (function () {
        function Index() {
        }
        Index.main = function (option) {
            var ast = new HTMLtoAST_1.default(option);
            var astDom = new Diff_1.default().diff(Index.oldAst, [ast], option.ele);
            Index.createDomTree(new Dom_2.default().createTree([ast]), option['dom']);
            Index.oldAst = [astDom];
        };
        Index.createDomTree = function (Tree, dom) {
            var warper = Dom_2.default.createEle('div');
            Tree.forEach(function (element) {
                var list = Dom_2.default.createEle('div');
                list.className = "list-style";
                Dom_2.default.appendEle(warper, list);
                var _loop_1 = function (i, len) {
                    Dom_2.default.appendEle(list, element[i]['Ele']);
                    element[i]['Ele'].onclick = function () {
                        Index.seeData(element[i]['Attr']);
                    };
                };
                for (var i = 0, len = element.length; i < len; i++) {
                    _loop_1(i, len);
                }
            });
            if (Dom_2.default.getEle(dom).children.length > 1) {
                Dom_2.default.removeEle(Dom_2.default.getEle(dom), Dom_2.default.getEle(dom).lastElementChild);
            }
            Dom_2.default.appendEle(Dom_2.default.getEle(dom), warper);
        };
        Index.seeData = function (Attr) {
            var message = Dom_2.default.createEle('div');
            message.className = 'message';
            var mes;
            switch (Attr['type']) {
                case 1:
                    mes = '标签节点值为 1';
                    break;
                case 3:
                    mes = '文本节点值为 3';
                    break;
                case 8:
                    mes = '注释节点值为 8';
                    break;
                case 10:
                    mes = '文档节点值为 10';
                    break;
            }
            message.innerHTML = mes;
            document.body.appendChild(message);
            setTimeout(function () {
                document.body.removeChild(message);
            }, 2000);
        };
        Index.oldAst = [];
        return Index;
    }());
    return {
        Index: Index,
        Dom: Dom_2.default
    };
});
