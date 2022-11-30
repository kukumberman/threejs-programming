import * as THREE from "three"
import { createWireframe } from "./utils.js"

const params = {
  radius: 10,
  offsetRadius: 1,
  widthSegments: 100,
  heightSegments: 50,
  rotationSpeed: 0.1,
}

const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(90, 1, 0.1, 100)
const renderer = new THREE.WebGLRenderer({ antialias: true })

const clock = new THREE.Clock()

camera.position.setZ(20)

renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(500, 500)
renderer.setAnimationLoop(animate)

document.body.appendChild(renderer.domElement)

window.addEventListener("resize", onResize)

onResize()

function animate() {
  const deltaTime = clock.getDelta()
  globe.rotation.y += params.rotationSpeed * deltaTime
  renderer.render(scene, camera)
}

function onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight)
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
}

// https://www.solarsystemscope.com/textures/
const texture = new THREE.TextureLoader().load(
  "./resources/2k_earth_daymap.jpg"
)

const m1 = new THREE.ShaderMaterial({
  uniforms: {
    u_texture: { value: texture },
  },
  vertexShader: `
  varying vec2 v_uv;
  varying vec3 v_normal;

  void main() {
    v_uv = uv;
    v_normal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  fragmentShader: `
  uniform sampler2D u_texture;
  
  varying vec2 v_uv;
  varying vec3 v_normal;
  
  void main() {
    vec3 direction = vec3(0.0, 0.0, 1.0);
    vec3 u_atmosphereColor = vec3(0.3, 0.6, 1.0);
    float u_intensity = 1.0;

    float intensity = 1.0 - dot(v_normal, direction);
    vec3 atmosphereColor = u_atmosphereColor * pow(intensity, u_intensity);

    vec3 textureColor = texture2D(u_texture, v_uv).xyz;
    gl_FragColor = vec4(textureColor + atmosphereColor, 1.0);
  }
  `,
})

const m2 = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  vertexShader: `
  varying vec3 v_normal;

  void main() {
    v_normal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  fragmentShader: `
  varying vec3 v_normal;

  void main() {
    vec3 direction = vec3(0, 0, 1.0);
    vec3 u_atmosphereColor = vec3(0.3, 0.6, 1.0);
    float u_intensity = 1.0;

    float intensity = pow(0.5 - dot(v_normal, direction), u_intensity);
    vec3 atmosphereColor = u_atmosphereColor * intensity;
    gl_FragColor = vec4(atmosphereColor, 1.0);
  }
  `,
})

const globe = new THREE.Mesh(
  new THREE.SphereGeometry(
    params.radius,
    params.widthSegments,
    params.heightSegments
  ),
  m1
)

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(
    params.radius + params.offsetRadius,
    params.widthSegments,
    params.heightSegments
  ),
  m2
)

scene.add(globe, atmosphere)

const wireframe = createWireframe(globe.geometry)
globe.add(wireframe)

clock.start()
