import * as THREE from "three"

export function createWireframe(geometry) {
  const line = new THREE.LineSegments(geometry)
  line.material.wireframe = true
  line.material.depthTest = true
  line.material.transparent = true
  line.material.opacity = 0.2
  return line
}
