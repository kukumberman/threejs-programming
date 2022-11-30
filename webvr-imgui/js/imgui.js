import {
  createWireframe,
  hookFunction,
  planeCurve,
  getWorldCorners,
} from "./utils.js"
import * as THREE from "three"
import { VRButton } from "three/addons/webxr/VRButton.js"
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js"

const canvas = document.querySelector("canvas")

let currentVideoTime = 0
let videoDuration = 0
const videoElement = document.createElement("video")
const videoSource = "https://threejs.org/examples/textures/sintel.ogv"
videoElement.src = videoSource

const magicCanvas = document.createElement("canvas")
magicCanvas.width = 1000
magicCanvas.height = 600
document.body.appendChild(magicCanvas)

let camera, renderer, scene
let imguiPlane

const rotationSinTime = 0.0002
const maxRotationAngle = 0
const windowSize = { x: 300, y: 300 }
let show_another_window = true
let show_demo_window = false
let clickCounter = 0

const logs = ["[log] Hello, World", "[log] test"]

const canvasTexture = new THREE.CanvasTexture(magicCanvas)

threejsInit()

canvasTexture.minFilter = THREE.LinearFilter
canvasTexture.anisotropy = renderer.capabilities.getMaxAnisotropy()

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
const mouseInMesh01 = new THREE.Vector2()
const mouseProjected = new THREE.Vector2()
let intersectsWithPlane = false
let elapsedTime = 0
const clock = new THREE.Clock()

const tempMatrix = new THREE.Matrix4()

document.body.appendChild(VRButton.createButton(renderer))

main()

const debugSphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.01),
  new THREE.MeshBasicMaterial({ color: "red" })
)
debugSphere.name = "Gizmo Sphere"
scene.add(debugSphere)

const imguiPlanesGroup = new THREE.Group()
imguiPlanesGroup.name = "ImGui Container"
scene.add(imguiPlanesGroup)

imguiPlanesGroup.attach(imguiPlane)

hookFunction(console, "log", (originalFunction, ...args) => {
  logs.push(`[log] ${args[0]}`)
  originalFunction(...args)
})

async function main() {
  await ImGui.default()
  ImGui.CreateContext()
  ImGui_Impl.Init(magicCanvas)
  ImGui.StyleColorsDark()

  imguiUpdateStyle()
  onResize()

  canvas.addEventListener("mousemove", onMouseMove)
  canvas.addEventListener("mousedown", onMouseDown)
  canvas.addEventListener("mouseup", onMouseUp)
  canvas.addEventListener("wheel", onMouseWheel)
  window.addEventListener("resize", onResize)
  window.addEventListener("orientationchange", onResize)

  imguiPlane.rotation.x = -maxRotationAngle * THREE.MathUtils.DEG2RAD
  imguiPlane.rotation.y = maxRotationAngle * THREE.MathUtils.DEG2RAD

  // const gl = ImGui_Impl.gl
  // console.log(gl)
  // console.log(gl.getParameter(gl.COLOR_CLEAR_VALUE))
  // console.log(gl.getContextAttributes())

  clock.start()
  renderer.setAnimationLoop(render)
}

function render() {
  elapsedTime = clock.getElapsedTime() * 1000
  handleIntersection(imguiPlane)

  if (renderer.xr.isPresenting) {
    const controller = renderer.xr.getController(1)
    tempMatrix.identity().extractRotation(controller.matrixWorld)
    raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld)
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix)
  }

  imguiFrame(elapsedTime)

  // imguiPlane.rotation.x = Math.cos(elapsedTime * rotationSinTime) * maxRotationAngle * THREE.MathUtils.DEG2RAD
  // imguiPlane.rotation.y = Math.sin(elapsedTime * rotationSinTime) * maxRotationAngle * THREE.MathUtils.DEG2RAD
  // imguiPlane.rotation.z = 180 * THREE.MathUtils.DEG2RAD

  canvasTexture.needsUpdate = true
  renderer.render(scene, camera)
}

function imguiUpdateStyle() {
  ImGui.GetStyle().WindowTitleAlign.x = 0.5
}

function imguiFrame(time) {
  const clear_color = new ImGui.ImVec4(0.45, 0.55, 0.6, 1.0)

  ImGui_Impl.NewFrame(time)
  ImGui.NewFrame()

  imguiRenderFrame(time)

  ImGui.EndFrame()

  ImGui.Render()
  const gl = ImGui_Impl.gl
  //! commented manully
  // gl && gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  gl &&
    gl.clearColor(clear_color.x, clear_color.y, clear_color.z, clear_color.w)
  gl && gl.clear(gl.COLOR_BUFFER_BIT)
  // gl.useProgram(0); // You may want this if using this code in an OpenGL 3+ context where shaders may be bound

  ImGui_Impl.RenderDrawData(ImGui.GetDrawData())
}

function imguiDispose() {
  ImGui_Impl.Shutdown()
  ImGui.DestroyContext()
}

function imguiRenderFrame(time) {
  const io = ImGui.GetIO()
  let window_flags = 0

  ImGui.SetNextWindowPos(new ImGui.ImVec2(0, 0), ImGui.Cond.Always)
  ImGui.SetNextWindowSize(
    new ImGui.ImVec2(windowSize.x, windowSize.y),
    ImGui.Cond.Always
  )

  window_flags = 0
  window_flags |= ImGui.WindowFlags.NoMove
  window_flags |= ImGui.WindowFlags.NoResize
  window_flags |= ImGui.WindowFlags.NoCollapse

  ImGui.Begin("Debug", null, window_flags)
  {
    ImGui.Text("Hello, World!")
    ImGui.Text(`Time: ${time.toFixed(0)} ms`)
    ImGui.Text(`Framerate: ${io.Framerate.toFixed(2)}`)
    ImGui.Text(`Framecount: ${ImGui.GetFrameCount()}`)
    ImGui.Text(`Version: ${ImGui.GetVersion()}`)
    if (ImGui.Button("Click me")) {
      clickCounter++
    }
    ImGui.SameLine()
    ImGui.Text(`counter = ${clickCounter}`)

    ImGui.Checkbox(
      "Another Window",
      (value = show_another_window) => (show_another_window = value)
    )
    ImGui.Checkbox(
      "Show Demo Window",
      (value = show_demo_window) => (show_demo_window = value)
    )

    // ImGui.Dummy(new ImGui.ImVec2(0, 20))
    // const digits = 2
    // ImGui.Text(`${mouse.x.toFixed(digits)} ${mouse.y.toFixed(digits)}`)

    // if (intersectsWithPlane) {
    //   ImGui.Text(`${mouseInMesh01.x.toFixed(digits)} ${mouseInMesh01.y.toFixed(digits)}`)
    //   ImGui.Text(`${mouseProjected.x.toFixed(digits)} ${mouseProjected.y.toFixed(digits)}`)
    // }
  }
  const previousWindowPosition = ImGui.GetWindowPos()
  const previousWindowSize = ImGui.GetWindowSize()
  ImGui.End()

  ImGui.SetNextWindowPos(
    new ImGui.ImVec2(previousWindowPosition.x + previousWindowSize.x + 10, 0),
    ImGui.Cond.Always
  )
  ImGui.SetNextWindowSize(
    new ImGui.ImVec2(windowSize.x, windowSize.y),
    ImGui.Cond.Always
  )

  videoWindow()

  // ImGui.Begin("Console", null, window_flags)
  // {
  //   logs.forEach(text => {
  //     ImGui.TextWrapped(`${text}`)
  //   });
  // }
  // ImGui.End()

  if (show_another_window) {
    window_flags = 0
    window_flags |= ImGui.WindowFlags.AlwaysAutoResize
    window_flags |= ImGui.WindowFlags.NoCollapse

    ImGui.Begin(
      "Another Window",
      (value = show_another_window) => (show_another_window = value),
      window_flags
    )
    {
      ImGui.Text("Hello from another window!")
      if (ImGui.Button("Close Me")) {
        show_another_window = false
      }
    }
    ImGui.End()
  }

  if (show_demo_window) {
    ImGui_Demo.ShowDemoWindow(
      (value = show_demo_window) => (show_demo_window = value)
    )
  }

  const color = ImGui.ColorConvertFloat4ToU32(new ImGui.ImVec4(0, 1, 0, 1))
  ImGui.GetForegroundDrawList().AddCircleFilled(io.MousePos, 5, color)
}

function threejsInit() {
  const aspect = canvas.width / canvas.height
  camera = new THREE.PerspectiveCamera(80, aspect, 0.01, 10)
  camera.position.set(0, 1, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true, canvas })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(canvas.width, canvas.height)
  renderer.xr.enabled = true

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xaabbcc)

  imguiPlane = createInteractivePlane()
  imguiPlane.position.set(0, 1, -1)
  scene.add(imguiPlane)

  const gridHelper = new THREE.GridHelper(10, 10)
  scene.add(gridHelper)

  createLight(scene)
  createControllers(renderer, scene)

  window.renderer = renderer
}

function createInteractivePlane() {
  const aspect = magicCanvas.width / magicCanvas.height
  const height = 1
  const width = height * aspect
  const segments = 10
  const bend = 0.1

  const geometry = new THREE.PlaneGeometry(width, height, segments, segments)
  const material = new THREE.MeshBasicMaterial({
    map: canvasTexture,
    side: THREE.DoubleSide,
  })

  planeCurve(geometry, bend)

  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = "Plane"

  const wireframe = createWireframe(mesh.geometry)
  wireframe.name = "Wireframe"
  mesh.add(wireframe)

  return mesh
}

function onMouseMove(event) {
  mouse.x = event.offsetX
  mouse.y = event.offsetY

  const ndc = new THREE.Vector2()
  ndc.x = (mouse.x / canvas.width) * 2 - 1
  ndc.y = -(mouse.y / canvas.height) * 2 + 1

  raycaster.setFromCamera(ndc, camera)
}

//https://github.com/flyover/imgui-js/blob/253cbb758765de2ca082e38f0b08f07016b6a68f/example/src/imgui_impl.ts#L133
function onMouseDown(event) {
  if (!intersectsWithPlane) {
    return
  }
  const io = ImGui.GetIO()
  io.MousePos.x = mouseProjected.x
  io.MousePos.y = mouseProjected.y
  io.MouseDown[0] = true
}

function onMouseUp(event) {
  const io = ImGui.GetIO()
  io.MouseDown[0] = false
}

function onMouseWheel(event) {
  const io = ImGui.GetIO()
  let scale = 1.0
  switch (event.deltaMode) {
    case event.DOM_DELTA_PIXEL:
      scale = 0.01
      break
    case event.DOM_DELTA_LINE:
      scale = 0.2
      break
    case event.DOM_DELTA_PAGE:
      scale = 1.0
      break
  }
  io.MouseWheelH = event.deltaX * scale
  io.MouseWheel = -event.deltaY * scale // Mouse wheel: 1 unit scrolls about 5 lines text.
  if (io.WantCaptureMouse) {
    event.preventDefault()
  }
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function handleIntersection(plane) {
  const results = raycaster.intersectObject(plane, false)
  intersectsWithPlane = results.length > 0

  if (intersectsWithPlane > 0) {
    const intersection = results[0]
    const point = intersection.point

    debugSphere.position.set(point.x, point.y, point.z)

    //! wrong math if plane is rotated (or curved as in this project) - code left just for reference
    // const worldCorners = getWorldCorners(plane)
    // mouseInMesh01.x = THREE.MathUtils.inverseLerp(
    //   worldCorners[0].x,
    //   worldCorners[1].x,
    //   point.x
    // )
    // mouseInMesh01.y = THREE.MathUtils.inverseLerp(
    //   worldCorners[1].y,
    //   worldCorners[2].y,
    //   point.y
    // )

    //! solves the problem
    mouseInMesh01.x = intersection.uv.x
    mouseInMesh01.y = 1 - intersection.uv.y

    mouseProjected.x = mouseInMesh01.x * magicCanvas.width
    mouseProjected.y = mouseInMesh01.y * magicCanvas.height

    const io = ImGui.GetIO()
    io.MousePos.x = mouseProjected.x
    io.MousePos.y = mouseProjected.y
  }
}

function createLight(scene) {
  scene.add(new THREE.HemisphereLight(0x808080, 0x606060))

  const light = new THREE.DirectionalLight(0xffffff)
  light.position.set(0, 6, 0)
  light.castShadow = true
  light.shadow.camera.top = 2
  light.shadow.camera.bottom = -2
  light.shadow.camera.right = 2
  light.shadow.camera.left = -2
  light.shadow.mapSize.set(4096, 4096)

  scene.add(light)
}

function createControllers(renderer, scene) {
  const distance = 2
  const geometry = new THREE.BufferGeometry()
  geometry.setFromPoints([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, -distance),
  ])
  const line = new THREE.Line(geometry)

  line.translateZ(0.05)
  line.material.color.set(0x0000ff)
  line.material.depthTest = false
  line.renderOrder = 1

  const controller1 = renderer.xr.getController(0)
  controller1.add(line.clone())
  controller1.addEventListener("selectstart", onSelectStart)
  controller1.addEventListener("selectend", onSelectEnd)
  controller1.addEventListener("squeezestart", onSqueezeStart)
  controller1.addEventListener("squeezeend", onSqueezeEnd)
  scene.add(controller1)

  const controller2 = renderer.xr.getController(1)
  controller2.add(line.clone())
  controller2.addEventListener("selectstart", onSelectStart)
  controller2.addEventListener("selectend", onSelectEnd)
  controller2.addEventListener("squeezestart", onSqueezeStart)
  controller2.addEventListener("squeezeend", onSqueezeEnd)
  scene.add(controller2)

  const controllerModelFactory = new XRControllerModelFactory()

  const controllerGrip1 = renderer.xr.getControllerGrip(0)
  controllerGrip1.add(
    controllerModelFactory.createControllerModel(controllerGrip1)
  )
  scene.add(controllerGrip1)

  const controllerGrip2 = renderer.xr.getControllerGrip(1)
  controllerGrip2.add(
    controllerModelFactory.createControllerModel(controllerGrip2)
  )
  scene.add(controllerGrip2)
}

function onSelectStart(event) {
  const io = ImGui.GetIO()
  io.MousePos.x = mouseProjected.x
  io.MousePos.y = mouseProjected.y
  io.MouseDown[0] = true
}

function onSelectEnd(event) {
  const io = ImGui.GetIO()
  io.MouseDown[0] = false
}

function onSqueezeStart(event) {
  const controller = event.target

  const intersections = getIntersections(controller)

  if (intersections.length > 0) {
    const intersection = intersections[0]
    const object = intersection.object
    controller.attach(object)
    controller.userData.selected = object
  }
}

function onSqueezeEnd(event) {
  const controller = event.target

  if (controller.userData.selected !== undefined) {
    const object = controller.userData.selected
    imguiPlanesGroup.attach(object)
    controller.userData.selected = undefined
  }
}

function getIntersections(controller) {
  tempMatrix.identity().extractRotation(controller.matrixWorld)

  raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld)
  raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix)

  return raycaster.intersectObjects(imguiPlanesGroup.children, false)
}

function videoWindow() {
  // https://github.com/flyover/imgui-js/blob/bf6360af2087613b95c13db5be59fc31170482f5/example/src/main.ts
  // https://flyover.github.io/imgui-js/example/

  ImGui.Begin("Video", null)

  ImGui.Text("Hold to repeat:")
  ImGui.SameLine()
  ImGui.PushButtonRepeat(true)

  if (ImGui.Button("<")) {
    clickCounter -= 1
  }

  if (ImGui.IsItemClicked(0)) {
    console.log("minus clicked")
  } else if (ImGui.IsItemDeactivated(0)) {
    console.log("minus released")
  }

  ImGui.SameLine()
  if (ImGui.Button(">")) {
    clickCounter += 1
  }

  if (ImGui.IsItemClicked(0)) {
    console.log("plus clicked")
  } else if (ImGui.IsItemDeactivated(0)) {
    console.log("plus released")
  }

  ImGui.PopButtonRepeat()

  ImGui.SameLine()
  ImGui.Text(`${clickCounter}`)

  // const progress01 = Math.sin(Date.now() * 0.001) * 0.5 + 0.5
  // ImGui.ProgressBar(progress01)
  // ImGui.ProgressBar(progress01, new ImGui.ImVec2(-1, 10), "Custom text")

  videoDuration = videoElement.duration

  ImGui.SliderFloat(
    "##time",
    (value = currentVideoTime) => (currentVideoTime = value),
    0,
    videoDuration
  )

  if (ImGui.IsItemClicked(0)) {
    console.log("timeline clicked")
  }

  if (ImGui.IsItemDeactivated(0)) {
    if (ImGui.IsItemHovered()) {
      console.log("timeline released inside")
    } else {
      console.log("timeline released outside")
    }
  }

  if (ImGui.Button(videoElement.paused ? "Play" : "Pause")) {
    if (videoElement.paused) {
      videoElement.play()
    } else {
      videoElement.pause()
    }
  }

  ImGui.End()
}
