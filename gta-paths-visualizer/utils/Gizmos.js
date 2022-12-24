import * as THREE from "three"
import { LinePool, GeometryPool, UnityStyleSpherePool } from "./Pool.js"

const useUnityStyleSphere = true

export default class Gizmos {
  /**
   *
   * @param {THREE.Scene} scene
   */
  constructor(scene) {
    this._scene = scene
    this._container = new THREE.Group()
    this._container.name = "Gizmos"
    this._scene.add(this._container)

    this._color = new THREE.Color()

    this._lines = new LinePool()

    const wireMaterial = new THREE.MeshBasicMaterial({
      wireframe: true,
      vertexColors: true,
      transparent: true,
      depthTest: false,
    })

    const solidMaterial = new THREE.MeshBasicMaterial({
      wireframe: false,
      vertexColors: true,
    })

    const widthSegments = 12
    const heightSegments = 6
    const sphereGeometry = new THREE.SphereGeometry(1, widthSegments, heightSegments)

    this._wireSpheres = useUnityStyleSphere
      ? new UnityStyleSpherePool()
      : new GeometryPool(sphereGeometry, wireMaterial)

    const boxGeometry = new THREE.BoxGeometry(1, 1, 1, 1, 1, 1)
    this._wireCubes = new GeometryPool(boxGeometry, wireMaterial)

    this._spheres = new GeometryPool(sphereGeometry, solidMaterial)
    this._cubes = new GeometryPool(boxGeometry, solidMaterial)
  }

  setColor(value) {
    this._color.set(value)
  }

  begin() {
    this.setColor("white")
    this._container.clear()
  }

  end() {
    this._lines.index = 0
    this._wireSpheres.index = 0
    this._wireCubes.index = 0
  }

  /**
   *
   * @param {THREE.Vector3} from
   * @param {THREE.Vector3} to
   */
  line(from, to) {
    const line = this._lines.get()
    const buffer = line.geometry.attributes.position

    buffer.array[0] = from.x
    buffer.array[1] = from.y
    buffer.array[2] = from.z
    buffer.array[3] = to.x
    buffer.array[4] = to.y
    buffer.array[5] = to.z

    buffer.needsUpdate = true
    line.geometry.computeBoundingBox()
    line.geometry.computeBoundingSphere()
    line.material.color.setHex(this._color.getHex())

    this._container.add(line)
  }

  /**
   *
   * @param {THREE.Vector3} center
   * @param {number} radius
   */
  wireSphere(center, radius) {
    const sphere = this._wireSpheres.get()
    this._applyToSphere(sphere, center, radius)
    this._wireSpheres.applyColor(sphere, this._color)
    this._container.add(sphere)
  }

  /**
   *
   * @param {THREE.Vector3} center
   * @param {THREE.Vector3} size
   */
  wireCube(center, size) {
    const cube = this._wireCubes.get()
    this._applyToCube(cube, center, size)
    this._wireCubes.applyColor(cube, this._color)
    this._container.add(cube)
  }

  /**
   *
   * @param {THREE.Vector3} center
   * @param {number} radius
   */
  sphere(center, radius) {
    const sphere = this._spheres.get()
    this._applyToSphere(sphere, center, radius)
    this._spheres.applyColor(sphere, this._color)
    this._container.add(sphere)
  }

  /**
   *
   * @param {THREE.Vector3} center
   * @param {THREE.Vector3} size
   */
  cube(center, size) {
    const cube = this._cubes.get()
    this._applyToCube(cube, center, size)
    this._cubes.applyColor(cube, this._color)
    this._container.add(cube)
  }

  _applyToSphere(sphere, center, radius) {
    sphere.position.set(center.x, center.y, center.z)
    sphere.scale.setScalar(radius)
  }

  _applyToCube(cube, center, size) {
    cube.position.set(center.x, center.y, center.z)
    cube.scale.set(size.x, size.y, size.z)
  }
}
