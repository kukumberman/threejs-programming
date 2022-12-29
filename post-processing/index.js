import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js"
import { RenderPass } from "three/addons/postprocessing/RenderPass.js"
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js"
import CustomShader from "./js/CustomShader.js"

let camera, controls
let renderer
let scene
let composer

const textureName = "./textures/rain_drops.png"

const customEffect = new ShaderPass(CustomShader)

const clock = new THREE.Clock()

main()

async function main() {
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  document.body.appendChild(renderer.domElement)

  scene = new THREE.Scene()

  camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.z = 0.01

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableZoom = false
  controls.enablePan = false
  controls.rotateSpeed = -0.5

  createEnvironment(scene)

  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  const loader = new THREE.TextureLoader()
  const texture = await loader.loadAsync(textureName)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping

  customEffect.uniforms["u_rainDropsTexture"].value = texture

  composer.addPass(customEffect)

  window.addEventListener("resize", onWindowResize)

  renderer.setAnimationLoop(animate)
}

function getTexturesFromAtlasFile(atlasImgUrl, tilesNum) {
  const textures = []

  for (let i = 0; i < tilesNum; i++) {
    const texture = new THREE.Texture()
    textures[i] = texture
  }

  new THREE.ImageLoader().load(atlasImgUrl, (image) => {
    let canvas, context
    const tileWidth = image.height

    for (let i = 0; i < textures.length; i++) {
      canvas = document.createElement("canvas")
      context = canvas.getContext("2d")
      canvas.height = tileWidth
      canvas.width = tileWidth
      context.drawImage(image, tileWidth * i, 0, tileWidth, tileWidth, 0, 0, tileWidth, tileWidth)
      const texture = textures[i]
      texture.image = canvas
      texture.needsUpdate = true
    }
  })

  return textures
}

function createEnvironment(scene) {
  const textures = getTexturesFromAtlasFile("./textures/sun_temple_stripe.jpg", 6)

  const materials = []

  for (let i = 0; i < 6; i++) {
    materials.push(new THREE.MeshBasicMaterial({ map: textures[i] }))
  }

  const skyBox = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), materials)
  skyBox.geometry.scale(1, 1, -1)
  scene.add(skyBox)
}

function onWindowResize() {
  const width = window.innerWidth
  const height = window.innerHeight

  camera.aspect = width / height
  camera.updateProjectionMatrix()

  renderer.setSize(width, height)
  composer.setSize(width, height)

  const uniformResolution = customEffect.uniforms["u_resolution"]
  uniformResolution.value[0] = width
  uniformResolution.value[1] = height
}

function animate() {
  const deltaTime = clock.getDelta()

  customEffect.uniforms["u_time"].value = clock.elapsedTime
  // renderer.render(scene, camera)
  composer.render()
}
