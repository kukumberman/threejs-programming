import * as THREE from "three"
import { Application } from "./js/Application.js"

const textureName = "./textures/rain_drops.png"

const app = new Application()
app.run()

window.addEventListener("resize", onWindowResize)
document.body.appendChild(app.canvas)

main()

async function main() {
  const loader = new THREE.TextureLoader()
  const texture = await loader.loadAsync(textureName)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping

  app.setEffectTexture(texture)
}

function onWindowResize() {
  app.setSize(window.innerWidth, window.innerHeight)
}
