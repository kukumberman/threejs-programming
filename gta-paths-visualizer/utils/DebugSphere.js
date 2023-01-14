import * as THREE from "three"

export default class {
  constructor(radius) {
    const geometry = new THREE.SphereGeometry(radius, 10, 5)
    const material = new THREE.MeshBasicMaterial({ color: "white", wireframe: true })
    this.mesh = new THREE.Mesh(geometry, material)
  }

  /**
   *
   * @param {THREE.Vector3} point
   */
  update(point) {
    this.mesh.position.set(point.x, point.y, point.z)
  }
}
