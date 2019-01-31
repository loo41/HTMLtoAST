import Ast from './HTMLtoAST';
import Diff from './Diff';
import { Option } from './Type';
import Dom from './Dom';

class Index {
  static oldAst = [];
  static main(option: Option) {
    let ast: Ast = new Ast(option);
    let astDom = new Diff().diff(Index.oldAst, [ast], option.ele);
    Index.createDomTree(new Dom().createTree([ast]), option['dom']);
    Index.oldAst = [astDom]
  }
  static createDomTree(Tree: Array<Array<object>>, dom) {
    const warper: Element = Dom.createEle('div');
    Tree.forEach(element => {
      const list: Element = Dom.createEle('div');
      list.className = "list-style"
      Dom.appendEle(warper, list);
      for (let i = 0, len = element.length; i < len; i++) {
        Dom.appendEle(list, element[i]['Ele']);
        element[i]['Ele'].onclick = function () {
          Index.seeData(element[i]['Attr']);
        }
      }
    });
    if (Dom.getEle(dom).children.length > 1) {
      Dom.removeEle(Dom.getEle(dom), Dom.getEle(dom).lastElementChild);
    }
    Dom.appendEle(Dom.getEle(dom), warper);
  }
  static seeData (Attr: object) {
    const message = Dom.createEle('div');
    message.className = 'message';
    let mes;
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
    setTimeout(() => {
      document.body.removeChild(message);
    }, 2000);
  }
}

export = {
  Index,
  Dom
}