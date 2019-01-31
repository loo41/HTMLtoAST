export default class Util {
  static insertRearward <T>(array: T[], index: number, inx: number): T[] {
    array.splice(index, 0, array[inx])
    if (inx > index) {
      array.splice(inx + 1, 1)
    } else {
      array.splice(inx, 1)
    }
    return array;
  }
  static isSomeArrayObj($1, $2) {
    if ($1.length !== $2.length) return false
    return $1.every((item, index) => {
      if (!$2[index]) return false
      if (item['attr'] === $2[index]['attr']) return true
    })
  }
}
