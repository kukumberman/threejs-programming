import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js"
import CustomShader from "./CustomShader.js"
import { getTexturesFromAtlasFile } from "./utils.js"

export class Application {
  constructor() {
    this.camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 100)
    this.camera.position.z = 0.01

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)

    this.customEffect = new ShaderPass(CustomShader)

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(new RenderPass(this.scene, this.camera))

    this.clock = new THREE.Clock()
    this.deltaTime = 0

    const controls = new OrbitControls(this.camera, this.renderer.domElement)
    controls.enableZoom = false
    controls.enablePan = false
    controls.rotateSpeed = -0.5

    this.createEnvironment()
  }

  get canvas() {
    return this.renderer.domElement
  }

  run() {
    this.renderer.setAnimationLoop(this.animate.bind(this))
  }

  setSize(width, height) {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(width, height)
    this.composer.setSize(width, height)

    const uniformResolution = this.customEffect.uniforms["u_resolution"]
    uniformResolution.value[0] = width
    uniformResolution.value[1] = height
  }

  /**
   *
   * @param {THREE.Texture} texture
   */
  setEffectTexture(texture) {
    this.customEffect.uniforms["u_rainDropsTexture"].value = texture
    this.composer.addPass(this.customEffect)
  }

  animate() {
    this.deltaTime = this.clock.getDelta()
    this.customEffect.uniforms["u_time"].value = this.clock.elapsedTime
    // this.renderer.render(this.scene, this.camera)
    this.composer.render()
  }

  createEnvironment() {
    const textures = getTexturesFromAtlasFile("./textures/sun_temple_stripe.jpg", 6)

    const materials = []

    for (let i = 0; i < 6; i++) {
      materials.push(new THREE.MeshBasicMaterial({ map: textures[i] }))
    }

    const skyBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials)
    skyBox.geometry.scale(1, 1, -1)
    this.scene.add(skyBox)
  }
}
