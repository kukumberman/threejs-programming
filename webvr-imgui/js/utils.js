import * as THREE from "three"

export function getWorldCorners(object3d) {
  const array = new Array(4).fill().map(() => new THREE.Vector3(0, 0, 0))
  getWorldCornersNonAlloc(object3d, array)
  return array
}

export function getWorldCornersNonAlloc(object3d, array) {
  const size = {
    x: object3d.geometry.parameters.width * 0.5,
    y: object3d.geometry.parameters.height * 0.5,
  }

  array[0].set(-size.x, size.y, 0)
  array[1].set(size.x, size.y, 0)
  array[2].set(size.x, -size.y, 0)
  array[3].set(-size.x, -size.y, 0)

  for (let i = 0; i < array.length; i++) {
    array[i] = object3d.localToWorld(array[i])
  }
}

export function createWireframe(geometry) {
  const line = new THREE.LineSegments(geometry)
  line.material.wireframe = true
  line.material.depthTest = false
  line.material.transparent = true
  line.material.opacity = 0.2
  return line
}

/**
 * https://discourse.threejs.org/t/simple-curved-plane/26647/10
 * @param {*} geometry
 * @param {*} bend
 */
export function planeCurve(geometry, bend) {
  const hw = geometry.parameters.width * 0.5

  const a = new THREE.Vector2(-hw, 0)
  const b = new THREE.Vector2(0, bend)
  const c = new THREE.Vector2(hw, 0)

  const ab = new THREE.Vector2().subVectors(a, b)
  const bc = new THREE.Vector2().subVectors(b, c)
  const ac = new THREE.Vector2().subVectors(a, c)

  const r =
    (ab.length() * bc.length() * ac.length()) / (2 * Math.abs(ab.cross(ac)))

  const center = new THREE.Vector2(0, bend - r)
  const baseV = new THREE.Vector2().subVectors(a, center)
  const baseAngle = baseV.angle() - Math.PI * 0.5
  const arc = baseAngle * 2

  const uv = geometry.attributes.uv
  const positionBuffer = geometry.attributes.position
  const mainV = new THREE.Vector2()

  for (let i = 0; i < uv.count; i++) {
    const uvRatio = 1 - uv.getX(i)
    const y = positionBuffer.getY(i)
    mainV.copy(c).rotateAround(center, arc * uvRatio)
    positionBuffer.setXYZ(i, mainV.x, y, -mainV.y)
  }

  positionBuffer.needsUpdate = true
}

export function hookFunction(object, functionName, customFunction) {
  const originalFunction = object[functionName]
  object[functionName] = function (...args) {
    customFunction(originalFunction, ...args)
  }
}
