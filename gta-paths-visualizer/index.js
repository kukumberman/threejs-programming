import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { lerp, inverseLerp } from "./utils/math.js"
import gtavcJson from "./resources/gtavc-custom.json" assert { type: "json" }
import gta3Json from "./resources/gta3-transformed.json" assert { type: "json" }
import Gizmos from "./utils/Gizmos.js"
import { Group, Node } from "./Node.js"

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
controls.maxDistance = 10
camera.position.set(0, 2, 5)

const gridHelper = new THREE.GridHelper(
  params.grid.size,
  params.grid.divisions,
  0x00ff00,
  0x808080
)

scene.add(gridHelper)

document.body.appendChild(renderer.domElement)

window.addEventListener("resize", onResize)

const canvas = renderer.domElement
canvas.addEventListener("mousemove", (event) => {
  const x = event.offsetX
  const y = event.offsetY

  const ndc = new THREE.Vector2()
  ndc.x = (x / canvas.width) * 2 - 1
  ndc.y = -(y / canvas.height) * 2 + 1

  raycaster.setFromCamera(ndc, camera)
})

canvas.addEventListener("dblclick", (event) => {
  const tmpVector = new THREE.Vector3(0, 0, 0)
  copyNodePositionTo(closestNode, tmpVector)
  controls.target.copy(tmpVector)
  controls.update()
})

onResize()

const gizmos = new Gizmos(scene)
const origin = new THREE.Vector3()
const raycaster = new THREE.Raycaster()
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0))

function gizmosExample() {
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

/**
 *
 * @param {Node} node
 * @param {THREE.Vector3} vector3
 */
function copyNodePositionTo(node, vector3) {
  vector3.x = node.worldX
  vector3.y = 0
  vector3.z = node.worldY
}

function findClosestNode(nodes) {
  const va = new THREE.Vector3()
  const vb = new THREE.Vector3()

  nodes.sort((a, b) => {
    copyNodePositionTo(a, va)
    copyNodePositionTo(b, vb)
    const da = va.distanceToSquared(origin)
    const db = vb.distanceToSquared(origin)
    return da - db
  })

  const candidate = nodes[0]

  return candidate
}

function drawGizmos() {
  gizmos.begin()

  // console.time("find")
  const tmpVector = new THREE.Vector3()
  closestNode = findClosestNode(allNodes)
  copyNodePositionTo(closestNode, tmpVector)
  // console.timeEnd("find")

  gizmos.setColor("red")
  gizmos.wireSphere(tmpVector, 0.01)
  gizmos.line(tmpVector, origin)

  gizmos.end()
}

function animate() {
  raycaster.ray.intersectPlane(plane, origin)

  // gizmosExample()
  drawGizmos()

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

function createGroups(dataArray) {
  const groups = dataArray.map((group) => {
    const g = new Group()
    const nodes = group
      .map((node) => {
        const n = new Node()
        n.type = +node[0]
        n.nextNode = +node[1]
        n.x = node[3] / 16
        n.y = node[4] / 16
        n.z = node[5] / 16
        return n
      })
      .filter((n) => n.isValid)

    g.nodes.push(...nodes)
    return g
  })
  return groups
}

function createMap(gta, groups) {
  const texture = new THREE.TextureLoader().setPath("./resources/maps/").load(gta.textures[1])
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(params.plane.size, params.plane.size),
    new THREE.MeshBasicMaterial({ map: texture })
  )

  plane.position.y = -0.01
  plane.rotation.x = -90 * THREE.MathUtils.DEG2RAD

  scene.add(plane)

  let index = 0

  groups.forEach((group) => {
    group.nodes.forEach((node) => {
      node.worldX = gta.px(node.x)
      node.worldY = gta.py(node.y)
      node.worldZ = gta.pz(node.z)
    })
  })

  groups.forEach((group) => {
    group.nodes.forEach((node) => {
      if (!node.isValid) {
        return
      }
      let colorName = "magenta"
      if (node.isExternal) {
        colorName = params.point.externalColor
      } else if (node.isInternal) {
        colorName = params.point.internalColor
      }
      const ax = node.worldX
      const ay = node.worldY

      if (node.hasNext) {
        const nextNode = group.nodes[node.nextNode]
        const bx = nextNode.worldX
        const by = nextNode.worldY
        createLine(ax, ay, bx, by)
      }

      const pointHeight = node.worldZ
      createPoint(index, ax, ay, colorName, pointHeight)

      index++
    })
  })

  console.log(index)
}

let closestNode = null

const selectedGta = [gtaViceCity, gta3][0]

const ped = reduceNodesType(selectedGta, NodeType.Ped) //9514 in vc, 7207 in 3
const road = reduceNodesType(selectedGta, NodeType.Road) //4588 in vc, 4466 in 3
const water = reduceNodesType(selectedGta, NodeType.Water) //630 in vc, 0 in 3

const groups = createGroups(road)
const allNodes = groups.reduce((result, group) => {
  result.push(...group.nodes)
  return result
}, [])

console.log(allNodes.length)

createMap(selectedGta, groups)

renderer.setAnimationLoop(animate)
