import {Ast} from './Type';

export default class Dom {
  private Tree = []
  static createEle(ele: string): Element {
    return document.createElement(ele);
  }
  
  static appendEle(par: Element, child: Element) {
    par.appendChild(child);
  }
  
  static setAttr(Ele: Element, attrs: Array<object>) {
    for (let i = 0, len = attrs.length; i < len; i++) {
      let $a = attrs[i]['attr'];
      const Attr = document.createAttribute($a);
      Attr.nodeValue = attrs[i]['value'] || $a;
      Ele.setAttributeNode(Attr);
    }
  }
  
  static setText(Ele: Element, text: string, type: number) {
    let $t;
    if (type === 8) {
      $t = document.createComment(text);
    } else {
      $t = document.createTextNode(text);
    }
    /* 
    else if (type === 10) {
      text = `<!DOCTYPE html>`
    } */
    Ele.appendChild($t)
    return $t
  }

  static removeEle(Ele: Element, child: Element) {
    Ele.removeChild(child);
  }

  static replace(par: Element, value: string, node: Element, type: number) {
    let Txt = this.setText(par, value, type)
    par.replaceChild(Txt, node)
    return Txt
  }

  static removeAttr(Ele: Element, attr: string) {
    Ele.removeAttribute(attr);
  }

  static insertBeforeNode(par: Element, newnode: Element, existingnode: Element) {
    par.insertBefore(newnode, existingnode)
  }

  static getEle(Ele: string): Element {
    if ('querySelector' in document) {
      return document.querySelector(Ele);
    } else { 
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
      return this.createEle('div')
    }
  }

  // 递归生成层级树
  createTree (ast, $i?: number) {
    ast = ast[0];
    let index = $i || 0;
    let {tag, type, children} = ast;
    let Ele = Dom.createEle('div');
    if (type === 1) {
      Dom.setText(Ele, tag, type);
    } else if (type === 3) {
      Dom.setText(Ele, '&T', 1);
    } else if (type === 8) {
      Dom.setText(Ele, '&C', 1);
    } else {
      Dom.setText(Ele, '&D', 1);
    }

    this.Tree[index]? this.Tree[index].push({Ele, Attr: {tag, type}})
                      : this.Tree[index] = [{Ele, Attr: {tag, type}}];
    if (children && children.length) {
      index++
      for (let i = 0, len = children.length; i < len; i++) {
        this.createTree([children[i]], index);
      }
    }

    return this.Tree
  }

  // 递归
  h (ast: Ast, parent?: Element) {
    ast = ast[0]
    let {children, tag, attrs, value, type} = ast;
    let Ele, Txt;
    if (parent) ast.parent = parent
    switch (type) {
      case 1:
        Ele = Dom.createEle(tag);
        ast.Ele = Ele;
        if (attrs && attrs.length) Dom.setAttr(Ele, attrs);
        if (value) Txt = Dom.setText(Ele, value, type);
        if (parent) Dom.appendEle(parent, ast.Ele)
        break;
      default:
        if (value) Txt = Dom.setText(parent, value, type);
    }
  
    ast.Txt = Txt
    if (children && children.length) {
      for (let i = 0, len = children.length; i < len; i++) {
         this.h([children[i]], ast.Ele)
      }
    }

    return ast
  }
}