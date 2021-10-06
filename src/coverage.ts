import {CommitsComparison} from './compareCommits'
import * as core from '@actions/core'

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
  newCover: Coverage[] | undefined
  modifiedCover: Coverage[] | undefined
}

export function parseCoverageReport(
  report: string,
  files: CommitsComparison
): FilesCoverage {
  const threshAll = parseFloat(core.getInput('thresholdAll'))
  const avgCover = parseAverageCoverage(report, threshAll)

  const threshModified = parseFloat(core.getInput('thresholdModified'))
  const modifiedCover = parseFilesCoverage(
    report,
    files.modifiedFiles,
    threshModified
  )

  const threshNew = parseFloat(core.getInput('thresholdNew'))
  const newCover = parseFilesCoverage(report, files.newFiles, threshNew)
  return {averageCover: avgCover, newCover, modifiedCover}
}

export function parseFilesCoverage(
  report: string,
  files: string[] | undefined,
  threshold: number
): Coverage[] | undefined {
  const coverages = files?.map(file => {
    const fileName = file.replace(/\//g, '\\/')
    const regex = new RegExp(
      `.*filename="${fileName}" line-rate="(?<cover>[\\d\\.]+)".*`
    )
    const match = report.match(regex)
    const cover = match?.groups ? parseFloat(match.groups['cover']) : -1
    return {file, cover, pass: cover >= threshold}
  })
  return coverages?.filter(cover => cover.cover > 0)
}

function parseAverageCoverage(
  report: string,
  threshold: number
): AverageCoverage {
  const regex = new RegExp(
    `<coverage.*lines-valid="(?<total>[\\d\\.]+)".*lines-covered="(?<covered>[\\d\\.]+)".*line-rate="(?<ratio>[\\d\\.]+)"`
  )
  const match = report.match(regex)

  if (match?.groups) {
    const ratio = parseFloat(match.groups['ratio'])
    const covered = parseFloat(match.groups['covered'])
    const total = parseFloat(match.groups['total'])
    return {ratio, covered, threshold, total, pass: ratio > threshold}
  } else {
    core.setFailed(
      '❌ could not parse total coverage - make sure xml report is valid'
    )
    return {ratio: -1, covered: -1, threshold: -1, total: -1, pass: false}
  }
}
