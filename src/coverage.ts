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

export function parseCoverageReport(report: string, files: CommitsComparison): FilesCoverage {
  const threshAll = parseFloat(core.getInput('thresholdAll'))
  const avgCover = parseAverageCoverage(report, threshAll)

  const source = parseSource(report)
  const threshModified = parseFloat(core.getInput('thresholdModified'))
  const modifiedCover = parseFilesCoverage(report, source, files.modifiedFiles, threshModified)

  const threshNew = parseFloat(core.getInput('thresholdNew'))
  const newCover = parseFilesCoverage(report, source, files.newFiles, threshNew)
  return {averageCover: avgCover, newCover, modifiedCover}
}

export function parseFilesCoverage(
  report: string,
  source: string,
  files: string[] | undefined,
  threshold: number
): Coverage[] | undefined {
  const coverages = files?.map(file => {
    const fileName = file.replace(`${source}/`, '').replace(/\//g, '\\/')
    const regex = new RegExp(`.*filename="${fileName}".*line-rate="(?<cover>[0-9]+[.]*[0-9]*)".*`)
    const match = report.match(regex)
    const cover = match?.groups ? parseFloat(match.groups['cover']) : -1
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

function parseAverageCoverage(report: string, threshold: number): AverageCoverage {
  const regex = new RegExp(
    `.*<coverage.*lines-valid="(?<total>[\\d\\.]+)".*lines-covered="(?<covered>[\\d\\.]+)".*line-rate="(?<ratio>[\\d\\.]+)"`
  )
  const match = report.match(regex)

  if (match?.groups) {
    const ratio = parseFloat(match.groups['ratio'])
    const covered = parseFloat(match.groups['covered'])
    const total = parseFloat(match.groups['total'])
    return {ratio, covered, threshold, total, pass: ratio > threshold}
  } else {
    core.setFailed('❌ could not parse total coverage - make sure xml report is valid')
    return {ratio: -1, covered: -1, threshold: -1, total: -1, pass: false}
  }
}
