import {parseFilesCoverage} from './coverage'
import fs from 'fs'


describe('tests', () => {
  it('parses coverage as expected', () => {
    const report = fs.readFileSync('./coverage.xml', 'utf8')
    const parsed = parseFilesCoverage(report, ['src/coverage.ts'], 0.8)
    expect(parsed).toBeDefined()
    expect(parsed![0]).toBeDefined()
    expect(parsed![0].pass).toBeTruthy()
    expect(parsed![0].cover).toBe(0.99)
  })
})

