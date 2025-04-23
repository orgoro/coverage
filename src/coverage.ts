import * as core from '@actions/core'

import {CommitsComparison} from './compareCommits'

// Nobody writes classes in TS, just stick to basic jsons and use typescripts types
export type Coverage = {
  cover: number
  file: string
  pass: boolean
}

export type AverageCoverage = {
  ratio: number
  covered: number
  total: number
  pass: boolean
  threshold: number
}

export type FilesCoverage = {
  averageCover: AverageCoverage
  newCover?: Coverage[]
  modifiedCover?: Coverage[]
}

export function parseCoverageReport(report: string, files: CommitsComparison, diffReport: string): FilesCoverage {
  const threshAll = parseFloat(core.getInput('thresholdAll'))
  const avgCover = parseAverageCoverage(report, threshAll)

  const source = core.getInput('sourceDir') || parseSource(report)
  const threshModified = parseFloat(core.getInput('thresholdModified'))
  const threshNew = parseFloat(core.getInput('thresholdNew'))
  let modifiedCover: Coverage[] | undefined
  if (diffReport === '') {
    modifiedCover = parseFilesCoverage(report, source, files.modifiedFiles, threshModified)
  } else {
    modifiedCover = parseDiffCoverageReport(diffReport, files.modifiedFiles, threshModified)
    core.info(`modifiedCover: ${JSON.stringify(modifiedCover)}`)
  }
  const newCover = parseFilesCoverage(report, source, files.newFiles, threshNew)
  return {averageCover: avgCover, newCover, modifiedCover}
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&')
}

export function parseFilesCoverage(
  report: string,
  source: string,
  files: string[] | undefined,
  threshold: number
): Coverage[] | undefined {
  const coverages = files?.map(file => {
    const fileName = escapeRegExp(file.replace(`${source}/`, ''))
    const regex = new RegExp(`.*filename="${fileName}".*line-rate="(?<cover>[0-9]+[.]*[0-9]*)".*`)
    const match = report.match(regex)
    const cover = match?.groups ? parseFloat(match.groups['cover']) : -1
    return {file, cover, pass: cover >= threshold}
  })
  return coverages?.filter(cover => cover.cover >= 0)
}

export function parseDiffCoverageReport(
  report: string,
  files: string[] | undefined,
  threshold: number
): Coverage[] | undefined {
  const jsonReport = JSON.parse(report)
  const coverages = files?.map(file => {
    const fileReport = jsonReport.src_stats[file]
    const cover = fileReport?.percent_covered ? fileReport.percent_covered / 100 : -1
    core.info(`file: ${file} cover: ${cover}`)
    core.info(jsonReport.src_stats)
    return {file, cover, pass: cover >= threshold}
  })
  return coverages?.filter(cover => cover.cover >= 0)
}

export function parseSource(report: string): string {
  const regex = new RegExp(`.*<source>(?<source>.*)</source>.*`)
  const match = report.match(regex)
  if (match?.groups && match.length === 2) {
    const source = match.groups['source'].replace(`${process.cwd()}/`, '')
    core.info(`source: ${source}`)
    return source
  } else {
    core.setFailed('❌ could not parse source from coverage report - or multiple sources found')
    return 'unknown'
  }
}
function setFailed(): AverageCoverage {
  core.setFailed('❌ could not parse total coverage - make sure xml report is valid')
  return {ratio: -1, covered: -1, threshold: -1, total: -1, pass: false}
}

export function parseAverageCoverage(report: string, threshold: number): AverageCoverage {
  const lineRegex = new RegExp(`.*<coverage.*>`)
  const totalRegex = new RegExp(`.*lines-valid="(?<total>[\\d\\.]+)".*`)
  const coveredRegex = new RegExp(`.*lines-covered="(?<covered>[\\d\\.]+)".*`)
  const ratioRegex = new RegExp(`.*line-rate="(?<ratio>[\\d\\.]+).*"`)

  const match = report.match(lineRegex)
  let result = null
  if (match?.length === 1) {
    const totalMatch = match[0].match(totalRegex)
    const coveredMatch = match[0].match(coveredRegex)
    const ratioMatch = match[0].match(ratioRegex)

    if (totalMatch?.groups && coveredMatch?.groups && ratioMatch?.groups) {
      const total = parseFloat(totalMatch.groups['total'])
      const covered = parseFloat(coveredMatch.groups['covered'])
      const ratio = parseFloat(ratioMatch.groups['ratio'])
      result = {ratio, covered, threshold, total, pass: ratio >= threshold}
    }
  }
  return result ?? setFailed()
}
