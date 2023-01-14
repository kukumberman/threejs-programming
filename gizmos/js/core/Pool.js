import * as THREE from "three"

function attachColorBufferToGeometry(geometry) {
  const COLOR_PER_VERTEX = 3
  const color = new Array(geometry.attributes.position.count * COLOR_PER_VERTEX).fill(1)
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(color, COLOR_PER_VERTEX))
}

function fillColorBufferWithColor(geometry, color) {
  const { r, g, b } = color
  const buffer = geometry.attributes.color
  for (let i = 0; i < buffer.array.length; i += 3) {
    buffer.array[i + 0] = r
    buffer.array[i + 1] = g
    buffer.array[i + 2] = b
  }
}

export class Pool {
  constructor() {
    this.index = 0
    this.capacity = 100
    this.collection = []
  }

  populate() {
    for (let i = 0, length = this.capacity; i < length; i++) {
      const o = this.createObject()
      this.collection.push(o)
    }
  }

  /**
   *
   * @returns {THREE.Object3D}
   */
  get() {
    if (this.index < this.collection.length) {
      const o = this.collection[this.index]
      this.index++
      return o
    } else {
      this.capacity++
      this.index++
      const o = this.createObject()
      this.collection.push(o)
      return o
    }
  }
}

export class LinePool extends Pool {
  constructor() {
    super()
    this.populate()
  }

  createObject() {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 1),
    ])
    const line = new THREE.Line(geometry)
    return line
  }
}

export class GeometryPool extends Pool {
  constructor(geometry, material) {
    super()
    this.geometry = geometry
    this.material = material
    this.populate()
  }

  createObject() {
    const geometry = this.geometry.clone()
    attachColorBufferToGeometry(geometry)
    return new THREE.Mesh(geometry, this.material)
  }

  applyColor(object3d, color) {
    fillColorBufferWithColor(object3d.geometry, color)
  }
}

export class UnityStyleSpherePool extends Pool {
  constructor() {
    super()
    this.material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      depthTest: false,
    })
    this.populate()
  }
  createObject() {
    return this._createCircleGizmo(1)
  }

  _createLineCircle(radius, resolution) {
    const curve = new THREE.EllipseCurve(0, 0, radius, radius)
    const points = curve.getSpacedPoints(resolution)
    const geometry = new THREE.BufferGeometry().setFromPoints(points)

    attachColorBufferToGeometry(geometry)
    const circle = new THREE.Line(geometry, this.material)
    return circle
  }

  _createCircleGizmo(radius) {
    const resolution = 24

    const a = this._createLineCircle(radius, resolution)

    const b = this._createLineCircle(radius, resolution)
    b.rotateY(90 * THREE.MathUtils.DEG2RAD)

    const c = this._createLineCircle(radius, resolution)
    c.rotateX(90 * THREE.MathUtils.DEG2RAD)

    const group = new THREE.Group()
    group.add(a, b, c)
    return group
  }

  applyColor(group, color) {
    for (let i = 0, length = group.children.length; i < length; i++) {
      const children = group.children[i]
      fillColorBufferWithColor(children.geometry, color)
    }
  }
}
