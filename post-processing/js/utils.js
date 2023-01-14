import * as THREE from "three"

export function getTexturesFromAtlasFile(atlasImgUrl, tilesNum) {
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
