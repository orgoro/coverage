import {CommitsComparison} from './compareCommits'
import * as core from '@actions/core'

export class Coverage {
  constructor(
    public file: string,
    public cover: number,
    public pass: boolean = true
  ) {}
}

export class FilesCoverage {
  constructor(
    public modifiedCover: Coverage[] | undefined,
    public newCover: Coverage[] | undefined
  ) {}
}

export function parseCoverageReport(
  report: string,
  files: CommitsComparison
): FilesCoverage {
  const threshModified = parseFloat(core.getInput('thresholdModified'))
  const modifiedCover = getFilesCoverage(
    report,
    files.modifiedFiles,
    threshModified
  )

  const threshNew = parseFloat(core.getInput('thresholdNew'))
  const newCover = getFilesCoverage(report, files.newFiles, threshNew)
  return new FilesCoverage(modifiedCover, newCover)
}

export function getFilesCoverage(
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
