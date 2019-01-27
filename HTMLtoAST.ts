function warn(message: string) {
  console.warn(message)
}

function error(message: string) {
  console.error(message)
}

function getHtmlTemplate(root: string): string {
  return document.querySelector(root).outerHTML
}

interface Option {
  el?: string
  template?: string
}

function log (mes) {
  return function (target) {
    console.log(mes)
  }
}

@log('AST解析开始')
class AST {

  constructor (option) {
    const {el, template} = option
    const html = el? getHtmlTemplate(el): template
    console.log(template)
    return this.praseHTML(html)
  }

  praseHTML (html: string) {
    let AstStack = undefined
    let root = undefined
    const stack = []
    const note = /^<!--/
    const tagName = '([a-zA-Z_][\\w\\-\\.]*)'
    const startTag = new RegExp(`^<(${tagName})`)
    const startTagClose = new RegExp('^\\s*(\/?)>') // 结束匹配
    const attribute = /^\s*([^'"<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"|'([^']*)'))/ // 属性匹配
    const endTag = new RegExp(`^</${tagName}\\s*>`)
    while(html) {
  
      // 注释 <!---->
      if (note.test(html)) {
        const noteEnd = html.indexOf('-->')
        if (noteEnd !== -1) {
          noteNode(html.substring(4, noteEnd))
          advance(noteEnd + 3)
          continue
        }
      }
  
  
      // 声明 <!DOCTYPE>
      let DTD = html.match(/^<(!DOCTYPE[^>]*)>/i)
      if (DTD) {
        dtdNode(DTD[1])
        advance(DTD[0].length)
        continue
      }
      
  
      // 开始标签
      const startTag = parseStartTag()
      if (startTag) {
        const {flag, tag} = startTag
        const attrs = []
        if (!flag) {
          while (startTag.attrs.length) {
            const attr = startTag.attrs.shift()
            attrs.push({
              attr: attr[1],
              value: attr[3]
            })
          }
          startNode(tag, attrs, flag)
        }
      }
  
      // 文本
      if (/^[^<]/.test(html)) {
        const texts = html.indexOf('<', 1) // vue 中字符级别的优化
        if (texts > 0) {
          const rest = html.slice(0, texts)
          textNode(rest)
          advance(texts)
        } else { // 待定
          textNode(html)
        }
      }
  
      // 结束标签
      let end
      if(end = html.match(endTag)) {
        advance(end[0].length)
        endNode()
      }
    }
  
    function textNode(text: string) {
      AstStack['children'].push({
        type: 3,
        value: text,
        isText: true
      })
    }

    function dtdNode(text: string) {
      AstStack['children'].push({
        type: 10,
        value: text,
        isDTD: true
      })
    }
  
    function noteNode(note: string) {
      AstStack['children'].push({
        type: 8,
        value: note,
        isNote: true
      })
    }
  
    function startNode(tagName, attrs, flag) {
      const node = createNode(tagName, attrs)
      if (!root) {
        root = node
      } else {
        AstStack.children.push(node)
      }
      if (!flag) {
        AstStack = node
        stack.push(node)
      }
    }
  
    function endNode() {
      if (!stack.length) return
      stack.length-- // 还有这种操作，除去数组最后一个元素
      AstStack = stack[stack.length - 1]
    }
  
    function createNode (tagName, attrs) {
      return {
        tag: tagName,
        attrs,
        children: [],
        type: 1
      }
    }
  
    function parseStartTag() {
      const tag = html.match(startTag)
      if (tag) {
        const match = {
          attrs: [],
          tag: tag[1],
          flag: false
        }
        advance(tag[0].length)
        let end, attr
        while (!(end = html.match(startTagClose)) && (attr = html.match(attribute))) {
          advance(attr[0].length)
          match.attrs.push(attr)
        }
        if (end) {
          match.flag = end[1]
          advance(end[0].length)
          return match
        }
      }
    }
  
    function advance($n: number) {
      html = html.substring($n).trim()
    }
  
    return root
  }
}