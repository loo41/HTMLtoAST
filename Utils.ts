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
}