import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { lerp, inverseLerp } from "./utils/math.js"
import gtavcJson from "./resources/gtavc-custom.json" assert { type: "json" }
import gta3Json from "./resources/gta3-transformed.json" assert { type: "json" }

const params = {
  camera: {
    fov: 80,
  },
  grid: {
    size: 10,
    divisions: 10,
  },
  plane: {
    size: 10,
  },
  point: {
    radius: 0.005,
    externalColor: "red",
    internalColor: "blue",
    lineColor: "orange",
  },
  bufferSize: 10_000,
}

const mapsize = params.plane.size

const gtaViceCity = {
  textures: ["gtavcmap.png", "ViceCityHDMap-GTAVC.png"],
  x_gamelimit: 2000,
  y_gamelimit: 2000,
  data: gtavcJson.data,
  px(x) {
    return lerp(-mapsize * 0.5, mapsize * 0.5, inverseLerp(-this.x_gamelimit, this.x_gamelimit, x))
  },
  py(y) {
    return -lerp(-mapsize * 0.5, mapsize * 0.5, inverseLerp(-this.y_gamelimit, this.y_gamelimit, y))
  },
  pz(z) {
    return 0 //unknown
  },
}

const gta3 = {
  textures: ["gta3map.png", "gta3map_colored.jpg"],
  x_gamelimit: 2000,
  y_gamelimit: 2000,
  data: gta3Json.data,
  px(x) {
    return lerp(-mapsize * 0.5, mapsize * 0.5, inverseLerp(-this.x_gamelimit, this.x_gamelimit, x))
  },
  py(y) {
    return -lerp(-mapsize * 0.5, mapsize * 0.5, inverseLerp(-this.y_gamelimit, this.y_gamelimit, y))
  },
  pz(z) {
    return 0 //unknown
  },
}

const NodeType = {
  Ped: "0",
  Road: "1",
  Water: "2",
}

const camera = new THREE.PerspectiveCamera(params.camera.fov, 1, 0.001, 1000)
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x202020)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(1000, 1000)
renderer.setPixelRatio(window.devicePixelRatio)

const controls = new OrbitControls(camera, renderer.domElement)
controls.screenSpacePanning = false
controls.zoomSpeed = 3

const gridHelper = new THREE.GridHelper(
  params.grid.size,
  params.grid.divisions,
  0x00ff00,
  0x808080
)

scene.add(gridHelper)

document.body.appendChild(renderer.domElement)

window.addEventListener("resize", onResize)

onResize()

function animate() {
  renderer.render(scene, camera)
}

function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
}

const spheres = new THREE.InstancedMesh(
  new THREE.ConeGeometry(params.point.radius, params.point.radius * 2),
  new THREE.MeshBasicMaterial({ wireframe: true }),
  params.bufferSize
)
spheres.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
scene.add(spheres)

const color = new THREE.Color()
const matrix = new THREE.Matrix4()
// matrix.makeRotationFromEuler(
//   new THREE.Euler(-90 * THREE.MathUtils.DEG2RAD, 0, 0)
// )
// matrix.scale(new THREE.Vector3(2, 5, 2))

const lineMaterial = new THREE.LineBasicMaterial({
  color: params.point.lineColor,
})

function createLine(ax, ay, bx, by) {
  const height = 0
  const points = []
  points.push(new THREE.Vector3(ax, height, ay))
  points.push(new THREE.Vector3(bx, height, by))
  const geometry = new THREE.BufferGeometry().setFromPoints(points)
  const line = new THREE.Line(geometry, lineMaterial)
  scene.add(line)
}

function createPoint(index, x, y, colorName, height = 0) {
  matrix.setPosition(x, height, y)
  spheres.setMatrixAt(index, matrix)
  spheres.setColorAt(index, color.setColorName(colorName))
}

function reduceNodesType(gta, type) {
  return gta.data.reduce((result, item) => {
    const dataByType = item[type]
    if (dataByType) {
      result.push(dataByType)
    }
    return result
  }, [])
}

function createMap(gta, data) {
  const texture = new THREE.TextureLoader()
    .setPath("./resources/maps/")
    .load(gta.textures[1])
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(params.plane.size, params.plane.size),
    new THREE.MeshBasicMaterial({ map: texture })
  )

  plane.position.y = -0.01
  plane.rotation.x = -90 * THREE.MathUtils.DEG2RAD

  camera.position.set(0, 2, 5)
  scene.add(plane)

  let index = 0
  data.forEach((group) => {
    group.forEach((node) => {
      const nodeType = node[0]
      if (nodeType === "0") {
        return
      }

      const x = node[3] / 16
      const y = node[4] / 16
      const z = node[5] / 16
      const nextNode = node[1]

      let colorName = "magenta"
      if (nodeType == 1) {
        colorName = params.point.externalColor
      } else if (nodeType == 2) {
        colorName = params.point.internalColor
      }

      const ax = gta.px(x)
      const ay = gta.py(y)

      if (nextNode != -1) {
        const nextNodeData = group[nextNode]
        const bx = nextNodeData[3] / 16
        const by = nextNodeData[4] / 16
        createLine(ax, ay, gta.px(bx), gta.py(by))
      }

      const pointHeight = gta.pz(z)
      createPoint(index, ax, ay, colorName, pointHeight)
      index++
    })
  })
  console.log(index)
}

const selectedGta = [gtaViceCity, gta3][0]

const ped = reduceNodesType(selectedGta, NodeType.Ped) //9514 in vc, 7207 in 3
const road = reduceNodesType(selectedGta, NodeType.Road) //4588 in vc, 4466 in 3
const water = reduceNodesType(selectedGta, NodeType.Water) //630 in vc, 0 in 3

createMap(selectedGta, road)

renderer.setAnimationLoop(animate)
