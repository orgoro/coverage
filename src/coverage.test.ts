import {parseFilesCoverage, parseDiffCoverageReport, parseSource, parseAverageCoverage} from './coverage'
import fs from 'fs'
import {parse} from 'path/posix'

const coverageFilePathV1 = './coverage.xml'
const coverageFilePathV2 = './coverage-v2.xml'
const coverageDiffFilePath = './coverage-diff.json'

describe('tests', () => {
  it.each([coverageFilePathV1, coverageFilePathV2])('parses average coverage', coverageFilePath => {
    const report = fs.readFileSync(coverageFilePath, 'utf8')
    const parsed = parseAverageCoverage(report, 0.8)
    expect(parsed).toBeDefined()
    const {ratio, covered, total, pass, threshold} = parsed
    expect(total).toBe(1000)
    expect(covered).toBe(940)
    expect(ratio).toBe(0.94)
    expect(threshold).toBe(0.8)
    expect(pass).toBeTruthy()
  })
  it('parses coverage as expected when float', () => {
    const report = fs.readFileSync(coverageFilePathV1, 'utf8')
    const parsed = parseFilesCoverage(report, 'src', ['src/coverage.ts'], 0.8)
    expect(parsed).toBeDefined()
    expect(parsed![0]).toBeDefined()
    expect(parsed![0].pass).toBeTruthy()
    expect(parsed![0].cover).toBe(0.99)
  })

  it('parses coverage as expected when zero', () => {
    const report = fs.readFileSync(coverageFilePathV1, 'utf8')
    const parsed = parseFilesCoverage(report, 'src', ['src/main.ts'], 0.01)
    expect(parsed).toBeDefined()
    expect(parsed![0]).toBeDefined()
    expect(parsed![0].pass).toBeFalsy()
    expect(parsed![0].cover).toBe(0)
  })

  it('parses source', () => {
    const report = fs.readFileSync(coverageFilePathV1, 'utf8')
    const parsed = parseSource(report)
    expect(parsed).toBe('src')
  })

  it('parses coverage diff', () => {
    const report = fs.readFileSync(coverageDiffFilePath, 'utf8')
    const parsed = parseDiffCoverageReport(report, ['src/coverage.ts'], 0.8)
    const expected = [{file: 'src/coverage.ts', cover: 0.69, pass: false}]

    expect(parsed).toBeDefined()
    expect(parsed).toEqual(expected)
  })
})
