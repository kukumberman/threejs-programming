export class Group {
  constructor() {
    this.nodes = []
  }
}

export class Node {
  constructor() {
    this.type = 0
    this.nextNode = -1
    this.x = 0
    this.y = 0
    this.z = 0
    this.customId = -1
    this.worldX = 0
    this.worldY = 0
    this.worldZ = 0
  }

  get isValid() {
    return this.type > 0
  }

  get hasNext() {
    return this.nextNode !== -1
  }

  get isExternal() {
    return this.type === 1
  }

  get isInternal() {
    return this.type === 2
  }
}
