import Dom from './Dom';
import Util from './Utils';

export default class Diff {
  diff(oldNode: Array<object>, node: Array<object>, ele?: string) {
    if (!oldNode.length) {  // 初次渲染
      const dom = new Dom().h(node);
      Dom.appendEle(Dom.getEle(ele), dom.Ele);
      return dom
    }
    let oldN = oldNode[0], N = node[0];

    if (this.isSomeNode(oldN, N)) {  // 判断是否值得比较 
      this.patch(oldN, N);
    } else {
      const dom = new Dom().h(node);
      Dom.removeEle(Dom.getEle(ele), Dom.getEle(ele).firstElementChild);
      Dom.appendEle(Dom.getEle(ele), dom.Ele);
    }

    return oldN
  }

  patch (oldNode, node) {
    let oldType = oldNode.type;
    if (oldType === 8 
      || oldType === 3
      || (oldType === 1 && (['script', 'style'].indexOf(oldNode['tag']) !== -1) )
      || oldType === 10) {
        if (oldNode.value !== node.value) {
          if (oldType === 1) {
            oldNode.Txt = Dom.replace(oldNode.Ele, node.value, oldNode.Txt, oldType)
          } else {
            oldNode.Txt = Dom.replace(oldNode.parent, node.value, oldNode.Txt, oldType)
          }
        }
    } else {
      // 获取子节点判断是否都存在
      this.updateAttr(oldNode.Ele, oldNode.attrs, node.attrs)
      let oldChild = oldNode.children && oldNode.children.length;
      let child = node.children && node.children.length;
      if (!oldChild && !child) {
        return
      } else if (!oldChild && child) {
        Dom.appendEle(oldNode.parent, new Dom().h(node).Ele)
      } else if (oldChild && !child) {
        Dom.removeEle(oldNode.parent, oldNode.Ele)
      } else {
        this.patchVnode(oldNode.children, node.children)
      }
    }
  }

  updateAttr (Ele: Element, Attrs: Array<object>, newAttr: Array<object>) {
    if (Util.isSomeArrayObj(Attrs, newAttr)) return;
    Attrs.forEach((item) => {
      Dom.removeAttr(Ele, item['attr']);
    })
    Dom.setAttr(Ele, newAttr);
  }

  patchVnode (oldNode: Array<object>, node: Array<object>) {
    let oldstartIndex = 0, startIndex = 0;
    let oldEndIndex = oldNode.length - 1, endIndex = node.length - 1;
    let oldStartVnode = oldNode[0], oldEndVnode = oldNode[oldNode.length - 1];
    let startVnode = node[0], endVnode = node[node.length - 1];
    while (oldstartIndex <= oldEndIndex && startIndex <= endIndex) {
      if (this.isSomeNode(oldStartVnode, startVnode)) {
        this.patch(oldStartVnode, startVnode);
        oldStartVnode = oldNode[++oldstartIndex];
        startVnode = node[++startIndex];
      } else if (this.isSomeNode(oldEndVnode, endVnode)) {
        this.patch(oldEndVnode, endVnode);
        oldEndVnode = oldNode[--oldEndIndex];
        endVnode = node[--endIndex];
      } else if (this.isSomeNode(oldStartVnode, endVnode)) {
        this.patch(oldStartVnode, endVnode);
        // 位置判断
        let inx = oldNode.length - (node.length - endIndex) - 1;
        Dom.insertBeforeNode(
          oldNode[0]['parent'], 
          oldNode[oldstartIndex]['Ele'], 
          oldNode[inx]['Ele']
        );
        Util.insertRearward(oldNode, inx, oldstartIndex);
        endVnode = node[--endIndex];
      } else if (this.isSomeNode(oldEndVnode, startVnode)) {
        this.patch(oldEndVnode, startVnode);
        let inx = startIndex - 1;
        Dom.insertBeforeNode(
          oldNode[0]['parent'], 
          oldNode[oldEndIndex]['Ele'], 
          oldNode[inx]['Ele']
        );
        Util.insertRearward(oldNode, inx, oldEndIndex);
        startVnode = node[++startIndex];
      } else {
        let i = 0, len = oldNode.length, success = false;
        while (len) {
          if (this.isSomeNode(startVnode, oldNode[i])) {
            Dom.insertBeforeNode(oldNode[0]['parent'], oldNode[i]['Ele'], oldNode[oldstartIndex]['Ele']);
            oldNode = Util.insertRearward(oldNode, (oldstartIndex? oldstartIndex: 0), i);
            ++oldstartIndex;
            success = true;
            break;
          }
          ++i;
          --len;
        }
        if (!success) {
          Dom.insertBeforeNode(oldNode[0]['parent'], new Dom().h([startVnode]).Ele, oldNode[oldstartIndex]['Ele']);
          startVnode = node[++startIndex];
        }
      }
    }
    if (oldstartIndex > oldEndIndex) {
      let existingnode = oldNode[oldEndIndex]['Ele']
      let dom, index = oldstartIndex;
      for (let i = startIndex; i <= endIndex; i++) {
        dom = new Dom().h([node[i]]);
        Dom.insertBeforeNode(oldNode[0]['parent'], dom['Ele'], existingnode);
        existingnode = dom['Ele'];
        oldNode.splice(index, 0, dom);
        index = i;
      }
    } else if (startIndex > endIndex) {
      let del = [];
      for (let i = oldstartIndex; i <= oldEndIndex; i++) {
        if (oldNode[i]) {
          Dom.removeEle(oldNode[0]['parent'], oldNode[i]['Ele']);
          del.push(i);
        }
      }
      let $r = del.pop();
      while($r) {
        oldNode.splice($r, 1);
        $r = del.pop();
      }
    }
  }

  isSomeNode(oldNode, node):boolean {
    if (!node) return false;
    const {type, tag} = oldNode;
    if (type === 1 
      && type === node.type
      && tag === node.tag ) {
        return true;
    } else if (type === 3 && type === node.type
      || (type === 8 && type === node.type)
      || (type === 10 && type === node.type)) {
        return true;
    }
    return false;
  }
  
}