;(async function () {
  {
    const localStorageStorage = new Map()
    const localStorage = {
      getItem(k) {
        return localStorageStorage.get(k)
      },
      setItem(k, v) {
        return localStorageStorage.set(k, v)
      },
    }
    Object.defineProperty(window, "localStorage", {
      get() {
        return localStorage
      },
    })
  }

  function createWireframe(geometry) {
    const line = new THREE.LineSegments(geometry)
    line.material.wireframe = true
    line.material.depthTest = false
    line.material.transparent = true
    line.material.opacity = 0.2
    return line
  }

  await ImGui.default()

  let show_demo_window = true

  const canvas = document.querySelector("canvas")
  // const gl = canvas.getContext("webgl")

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    canvas,
    // context: gl,
  })

  const scene = new THREE.Scene()

  const camera = new THREE.PerspectiveCamera(50, canvas.width / canvas.height, 0.1, 10000)
  camera.position.set(0, 0, 3)
  scene.add(camera)

  // const light = new THREE.DirectionalLight(0xffffff, 0.8)
  // light.position.set(0, 0, 350)
  // light.lookAt(new THREE.Vector3(0, 0, 0))
  // scene.add(light)

  const t = new THREE.TextureLoader().load(
    "https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprite1.png"
  )

  const geometry = new THREE.BoxGeometry(1, 1, 1)
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    map: t,
  })
  const mesh = new THREE.Mesh(geometry, material)
  scene.add(mesh)

  mesh.name = "cube"
  mesh.rotation.y = 45 * THREE.MathUtils.DEG2RAD
  mesh.rotation.x = 20 * THREE.MathUtils.DEG2RAD

  const w = createWireframe(mesh.geometry)
  mesh.add(w)

  const clear_color = new ImGui.ImVec4(0.3, 0.3, 0.3, 1.0)

  ImGui.CreateContext()
  ImGui.StyleColorsDark()
  ImGui_Impl.Init(renderer.getContext())

  let done = false
  window.requestAnimationFrame(_loop)
  function _loop(time) {
    ImGui_Impl.NewFrame(time)
    ImGui.NewFrame()

    ImGui.SetNextWindowPos(new ImGui.ImVec2(20, 20), ImGui.Cond.FirstUseEver)
    ImGui.SetNextWindowSize(new ImGui.ImVec2(400, 250), ImGui.Cond.FirstUseEver)
    ImGui.Begin("Debug")

    ImGui.Checkbox("Show Demo Window", (value = show_demo_window) => (show_demo_window = value))

    ImGui.ColorEdit4("clear color", clear_color)
    ImGui.Separator()
    ImGui.Text(`Scene: ${scene.uuid.toString()}`)
    ImGui.Separator()
    ImGui.Text(`Material: ${material.uuid.toString()}`)
    ImGui.ColorEdit3("color", material.color)
    const side_enums = [THREE.FrontSide, THREE.BackSide, THREE.DoubleSide]
    const side_names = {}
    side_names[THREE.FrontSide] = "FrontSide"
    side_names[THREE.BackSide] = "BackSide"
    side_names[THREE.DoubleSide] = "DoubleSide"
    if (ImGui.BeginCombo("side", side_names[material.side])) {
      side_enums.forEach((side) => {
        const is_selected = material.side === side
        if (ImGui.Selectable(side_names[side], is_selected)) {
          material.side = side
        }
        if (is_selected) {
          ImGui.SetItemDefaultFocus()
        }
      })
      ImGui.EndCombo()
    }
    ImGui.Separator()
    ImGui.Text(`Mesh: ${mesh.uuid.toString()}`)
    ImGui.Checkbox("visible", (value = mesh.visible) => (mesh.visible = value))
    ImGui.InputText("name", (value = mesh.name) => (mesh.name = value))
    ImGui.SliderFloat3("position", mesh.position, -100, 100)
    ImGui.SliderFloat3("rotation", mesh.rotation, -360, 360)
    ImGui.SliderFloat3("scale", mesh.scale, -2, 2)

    if (show_demo_window) {
      ImGui_Demo.ShowDemoWindow((value = show_demo_window) => (show_demo_window = value))
    }

    ImGui.End()

    ImGui.EndFrame()

    ImGui.Render()

    renderer.setClearColor(
      new THREE.Color(clear_color.x, clear_color.y, clear_color.z),
      clear_color.w
    )
    camera.aspect = canvas.width / canvas.height
    camera.updateProjectionMatrix()
    renderer.setSize(canvas.width, canvas.height)
    renderer.render(scene, camera)

    ImGui_Impl.RenderDrawData(ImGui.GetDrawData())

    // TODO: restore WebGL state in ImGui Impl
    renderer.state.reset()

    window.requestAnimationFrame(done ? _done : _loop)
  }

  function _done() {
    ImGui_Impl.Shutdown()
    ImGui.DestroyContext()
  }
})()
