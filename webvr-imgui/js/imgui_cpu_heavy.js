import * as THREE from "three"

const canvas = document.querySelector("canvas")
const gl = canvas.getContext("webgl")

const windowSize = { x: 300, y: 300 }
window.pixelsBuffer = new Uint8Array(gl.canvas.width * gl.canvas.height * 4)

let show_another_window = true
let show_demo_window = true

const renderTexture = gl.createTexture()
const framebuffer = gl.createFramebuffer()

main()

async function main() {
  const texture = new THREE.DataTexture(
    pixelsBuffer,
    gl.canvas.width,
    gl.canvas.height
  )

  initRenderTexture()

  await ImGui.default()
  imguiBegin()

  render(0)

  const threejs = threejsInit(texture)
  threejs.render()

  animate(0)

  function render(time) {
    enableFramebuffer()
    imguiFrame(time)
    readPixels()
    disableFramebuffer()
    texture.needsUpdate = true
  }

  function animate(time) {
    requestAnimationFrame(animate)
    render(time)
    threejs.render()
  }
}

function initRenderTexture() {
  gl.bindTexture(gl.TEXTURE_2D, renderTexture)

  // set the filtering so we don't need mips
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.canvas.width,
    gl.canvas.height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  )

  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    renderTexture,
    0
  )

  gl.bindTexture(gl.TEXTURE_2D, null)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
}

function enableFramebuffer() {
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER)
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    console.error("these attachments don't work")
  }
}

function disableFramebuffer() {
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
}

function readPixels() {
  gl.readPixels(
    0,
    0,
    gl.canvas.width,
    gl.canvas.height,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    pixelsBuffer
  )
}

function threejsInit(texture) {
  const aspect = gl.canvas.width / gl.canvas.height
  const camera = new THREE.PerspectiveCamera(70, aspect, 0.01, 10)
  camera.position.set(0, 0, 1)

  const params = { antialias: true, canvas, context: gl }
  const renderer = new THREE.WebGLRenderer(params)
  renderer.setSize(gl.canvas.width, gl.canvas.height)

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0xaaaaaa)

  const size = 1
  const geometry = new THREE.PlaneGeometry(size * aspect, size)
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
  })

  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)
  mesh.rotation.y = 0 * THREE.MathUtils.DEG2RAD

  function wireframe(geometry) {
    const line = new THREE.LineSegments(geometry)
    line.material.wireframe = true
    line.material.depthTest = false
    line.material.transparent = true
    line.material.opacity = 0.2
    return line
  }

  const w = wireframe(mesh.geometry)
  mesh.add(w)

  return {
    scene,
    camera,
    renderer,
    material,
    render() {
      mesh.rotation.y += 0.01
      this.renderer.render(this.scene, this.camera)
    },
  }
}

function imguiBegin() {
  ImGui.CreateContext()
  ImGui_Impl.Init(gl)
  ImGui.StyleColorsDark()
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
  // gl && gl.clearColor(clear_color.x, clear_color.y, clear_color.z, clear_color.w);
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

  ImGui.Begin("Debug", null, window_flags)
  {
    ImGui.Text("Hello, World!")
    ImGui.Text(`Time: ${time}`)
    ImGui.Text(`Framerate: ${io.Framerate.toFixed(2)}`)
    ImGui.Text(`Framecount: ${ImGui.GetFrameCount()}`)
    ImGui.Text(`Version: ${ImGui.GetVersion()}`)
    if (ImGui.Button("Click me")) {
      console.log("clicked")
    }
    ImGui.Checkbox(
      "Another Window",
      (value = show_another_window) => (show_another_window = value)
    )
    ImGui.Checkbox(
      "Show Demo Window",
      (value = show_demo_window) => (show_demo_window = value)
    )
  }
  const previousWindowPosition = ImGui.GetWindowPos()
  const previousWindowSize = ImGui.GetWindowSize()
  ImGui.End()

  ImGui.SetNextWindowPos(
    new ImGui.ImVec2(previousWindowPosition.x + previousWindowSize.x + 10, 0),
    ImGui.Cond.Always
  )

  if (show_another_window) {
    window_flags = 0
    window_flags |= ImGui.WindowFlags.NoMove
    window_flags |= ImGui.WindowFlags.AlwaysAutoResize

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
    ImGui.ShowDemoWindow(
      (value = show_demo_window) => (show_demo_window = value)
    )
  }
}
