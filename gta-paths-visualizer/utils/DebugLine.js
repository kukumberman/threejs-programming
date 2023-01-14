import * as THREE from "three"

export default class {
  constructor() {
    const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 1, 0)]
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({ color: "white" })
    this.mesh = new THREE.Line(geometry, material)
  }

  /**
   *
   * @param {THREE.Vector3} from
   * @param {THREE.Vector3} to
   */
  update(from, to) {
    const buffer = this.mesh.geometry.attributes.position

    buffer.array[0] = from.x
    buffer.array[1] = from.y
    buffer.array[2] = from.z
    buffer.array[3] = to.x
    buffer.array[4] = to.y
    buffer.array[5] = to.z

    buffer.needsUpdate = true
  }
}
