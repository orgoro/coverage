import {CommitsComparison} from './compareCommits'
import * as core from '@actions/core'

export class Coverage {
  constructor(
    public file: string,
    public cover: number,
    public pass: boolean
  ) {}
}

export class AverageCoverage {
  constructor(
    public ratio: number,
    public covered: number,
    public total: number,
    public pass: boolean,
    public threshold: number
  ) {}
}

export class FilesCoverage {
  constructor(
    public averageCover: AverageCoverage,
    public newCover: Coverage[] | undefined,
    public modifiedCover: Coverage[] | undefined
  ) {}
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
  return new FilesCoverage(avgCover, newCover, modifiedCover)
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
    return new Coverage(file, cover, cover >= threshold)
  })
  return coverages?.filter(cover => cover.cover > 0)
}

function parseAverageCoverage(
  report: string,
  threshold: number
): AverageCoverage {
  const regex = new RegExp(
    `<coverage.*line-rate="(?<ratio>[\\d\\.]+)" lines-covered="(?<covered>[\\d\\.]+)" lines-valid="(?<total>[\\d\\.]+)"`
  )
  const match = report.match(regex)

  if (match?.groups) {
    const ratio = parseFloat(match.groups['ratio'])
    const covered = parseFloat(match.groups['covered'])
    const total = parseFloat(match.groups['cover'])
    return new AverageCoverage(
      ratio,
      covered,
      total,
      ratio > threshold,
      threshold
    )
  } else {
    core.setFailed(
      '❌ could not parse total coverage - make sure xml report is valid'
    )
    return new AverageCoverage(-1, -1, -1, false, -1)
  }
}
