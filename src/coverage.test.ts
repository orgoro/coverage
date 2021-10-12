import {parseFilesCoverage, parseSource} from './coverage'
import fs from 'fs'
import {parse} from 'path/posix'

describe('tests', () => {
  it('parses coverage as expected when float', () => {
    const report = fs.readFileSync('./coverage.xml', 'utf8')
    const parsed = parseFilesCoverage(report, 'src', ['src/coverage.ts'], 0.8)
    expect(parsed).toBeDefined()
    expect(parsed![0]).toBeDefined()
    expect(parsed![0].pass).toBeTruthy()
    expect(parsed![0].cover).toBe(0.99)
  })

  it('parses coverage as expected when zero', () => {
    const report = fs.readFileSync('./coverage.xml', 'utf8')
    const parsed = parseFilesCoverage(report, 'src', ['src/main.ts'], 0.01)
    expect(parsed).toBeDefined()
    expect(parsed![0]).toBeDefined()
    expect(parsed![0].pass).toBeFalsy()
    expect(parsed![0].cover).toBe(0)
  })

  it('parses source', () => {
    const report = fs.readFileSync('./coverage.xml', 'utf8')
    const parsed = parseSource(report)
    expect(parsed).toBe('src')
  })
})
