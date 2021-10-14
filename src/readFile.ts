import * as fs from 'fs'

const readFile = (path: string) => {
  try {
    return fs.readFileSync(path, 'utf8')
  } catch (error) {
    throw new Error(`could not read file ${path}`)
  }
}

export default readFile
