import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import Gizmos from "./core/Gizmos.js"

const params = {
  camera: {
    fov: 90,
    near: 0.01,
    far: 100,
  },
  grid: {
    size: 10,
    divisions: 10,
  },
}

class Application {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      params.camera.fov,
      window.innerWidth / window.innerHeight,
      params.camera.near,
      params.camera.far
    )

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x202020)

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)

    const gridHelper = new THREE.GridHelper(
      params.grid.size,
      params.grid.divisions,
      0x00ff00,
      0x808080
    )
    this.scene.add(gridHelper)

    const controls = new OrbitControls(this.camera, this.renderer.domElement)
    controls.screenSpacePanning = false
    controls.zoomSpeed = 3
    controls.maxDistance = 10

    this.camera.position.set(0, 2, 5)

    this.gizmos = new Gizmos(this.scene)

    this.origin = new THREE.Vector3()
    this.raycaster = new THREE.Raycaster()
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0))
  }

  get canvas() {
    return this.renderer.domElement
  }

  run() {
    this.renderer.setAnimationLoop(this.animate.bind(this))
  }

  setSize(width, height) {
    this.renderer.setSize(width, height)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  setMousePosition(x, y) {
    const ndc = new THREE.Vector2()
    ndc.x = (x / this.canvas.width) * 2 - 1
    ndc.y = -(y / this.canvas.height) * 2 + 1
    this.raycaster.setFromCamera(ndc, this.camera)
  }

  animate() {
    this.raycaster.ray.intersectPlane(this.plane, this.origin)
    this.drawGizmos()
    this.renderer.render(this.scene, this.camera)
  }

  drawGizmos() {
    const gizmos = this.gizmos
    const origin = this.origin

    gizmos.begin()

    gizmos.line(origin, new THREE.Vector3(0, 0, 2).add(origin))

    gizmos.setColor("red")
    gizmos.line(origin, new THREE.Vector3(0, 0, 0))

    gizmos.setColor("black")
    gizmos.wireSphere(origin, 0.5)
    gizmos.wireCube(origin, new THREE.Vector3(1, 1, 1))

    let x = 0

    gizmos.setColor("deeppink")
    gizmos.wireSphere(new THREE.Vector3(x, 0, -2).add(origin), 1)
    gizmos.wireCube(new THREE.Vector3(x, 0, -2).add(origin), new THREE.Vector3(2, 2, 2))

    x += 2
    gizmos.setColor("blue")
    gizmos.sphere(new THREE.Vector3(x, 0, 0).add(origin), 0.5)
    gizmos.cube(new THREE.Vector3(x, 0, -2).add(origin), new THREE.Vector3(1, 1, 1))

    x += 2
    gizmos.setColor("yellow")
    gizmos.sphere(new THREE.Vector3(x, 0, 0).add(origin), 0.5)
    gizmos.cube(new THREE.Vector3(x, 0, -2).add(origin), new THREE.Vector3(1, 1, 1))

    gizmos.end()
  }
}

const app = new Application()
document.body.appendChild(app.canvas)

window.addEventListener("resize", onResize)
app.canvas.addEventListener("mousemove", onMouseMove)

app.run()

function onResize() {
  app.setSize(window.innerWidth, window.innerHeight)
}

function onMouseMove(event) {
  app.setMousePosition(event.offsetX, event.offsetY)
}
