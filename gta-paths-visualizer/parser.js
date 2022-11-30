const fs = require("fs")
const path = require("path")

const NodeType = {
  Ped: "0",
  Road: "1",
  Water: "2",
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
}

function cross(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ]
}

function qrotate(x, y, z, rx, ry, rz, rw) {
  return [
    2.0 * dot([x, y, z], [rx, ry, rz]) * rx +
      (rw * rw - dot([rx, ry, rz], [rx, ry, rz])) * x +
      2.0 * rw * cross([x, y, z], [rx, ry, rz])[0],
    2.0 * dot([x, y, z], [rx, ry, rz]) * ry +
      (rw * rw - dot([rx, ry, rz], [rx, ry, rz])) * y +
      2.0 * rw * cross([x, y, z], [rx, ry, rz])[1],
    2.0 * dot([x, y, z], [rx, ry, rz]) * rz +
      (rw * rw - dot([rx, ry, rz], [rx, ry, rz])) * z +
      2.0 * rw * cross([x, y, z], [rx, ry, rz])[2],
  ]
}

/**
 *
 * @param {Array} array
 * @param {number} chunkSize
 * @returns
 */
function splitArrayIntoChunks(array, chunkSize) {
  const length = Math.ceil(array.length / chunkSize)
  const result = []

  for (let i = 0; i < length; i++) {
    const startIndex = i * chunkSize
    const endIndex = Math.min(startIndex + chunkSize, array.length)
    const chunk = array.slice(startIndex, endIndex)
    result.push(chunk)
  }

  return result
}

/**
 *
 * @param {string} textContent
 * @returns
 */
function parseGtaViceCityPathsFile(textContent) {
  const regExp = /(?:path$)(.*?)(?:end)/gms
  const result = regExp.exec(textContent)

  const lines = result[0].split("\r\n")
  lines.shift()
  lines.pop()

  const formattedLines = lines
    .map((line) => line.trim())
    .map((line) => line.split(", "))

  const groups = splitArrayIntoChunks(formattedLines, 13)

  const data = []

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i]

    const groupType = group[0][0]

    const nodes = []

    for (let j = 1; j < group.length; j++) {
      const node = group[j]
      nodes.push(node)
    }

    data.push({
      [groupType]: nodes,
    })
  }

  return { data }
}

function parseGtaVC(gameDirectory) {
  const pathToFile = path.join(gameDirectory, "data", "maps", "paths.ipl")
  const textContent = fs.readFileSync(pathToFile, "utf8")
  return parseGtaViceCityPathsFile(textContent)
}

function parseViceCity() {
  const directoryPath = "D:/Steam/steamapps/common/Grand Theft Auto Vice City"
  const result = parseGtaVC(directoryPath)
  const json = true ? JSON.stringify(result) : JSON.stringify(result, null, 2)
  fs.writeFileSync("./resources/gtavc-custom.json", json)
}

function transformGroup(pos, rot, group) {
  const x = parseFloat(pos.x)
  const y = parseFloat(pos.y)
  const z = parseFloat(pos.z)

  const rx = parseFloat(rot.x)
  const ry = parseFloat(rot.y)
  const rz = parseFloat(rot.z)
  const rw = parseFloat(rot.w)

  return group.map((node) => {
    const BASE_SCALE = 16
    const nodeX = node[3] / BASE_SCALE
    const nodeY = node[4] / BASE_SCALE
    const nodeZ = node[5] / BASE_SCALE
    const rotated = qrotate(nodeX, nodeY, nodeZ, rx, ry, rz, rw)
    return [
      node[0],
      node[1],
      node[2],
      ((x + rotated[0]) * BASE_SCALE).toString(),
      ((y + rotated[1]) * BASE_SCALE).toString(),
      ((z + rotated[2]) * BASE_SCALE).toString(),
      node[6],
      node[7],
      node[8],
    ]
  })
}

function modifySeemannData(name) {
  const pathToFile = path.resolve(`./resources/${name}.json`)
  const originalJson = JSON.parse(fs.readFileSync(pathToFile, "utf8"))
  const data = []

  originalJson.data.forEach((group, i) => {
    const { pos, rot, node } = group

    if (node.car) {
      data.push({
        [NodeType.Road]: transformGroup(pos, rot, node.car),
      })
    }

    if (node.ped) {
      data.push({
        [NodeType.Ped]: transformGroup(pos, rot, node.ped),
      })
    }
  })

  const result = { data }
  const json = true ? JSON.stringify(result) : JSON.stringify(result, null, 2)
  fs.writeFileSync(`./resources/${name}-transformed.json`, json)
}

function main() {
  // parseViceCity()
  modifySeemannData("gta3")
  // modifySeemannData("gtavc")
}

main()
