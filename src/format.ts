import {AverageCoverage, Coverage} from './coverage'
import {markdownTable} from 'markdown-table'
import * as core from '@actions/core'

const passIcon = core.getInput('passIcon') || '🟢'
const failIcon = core.getInput('failIcon') || '🔴'
const passOrFailIndicator = (predicate: boolean): string => (predicate ? passIcon : failIcon)

function averageCover(cover: Coverage[]): string {
  const filterd = cover.filter(file => file.cover >= 0)
  const sum = filterd.reduce((acc, curr) => curr.cover + acc, 0)
  return `**${((100 * sum) / filterd.length).toFixed()}%**`
}

export function toPercent(value: number): string {
  return `${(100 * value).toFixed()}%`
}

export function formatFilesTable(cover: Coverage[]): {coverTable: string; pass: boolean} {
  const avgCover = averageCover(cover)
  const pass = cover.every(x => x.pass)
  const averageIndicator = passOrFailIndicator(pass)
  const coverTable = markdownTable(
    [
      ['File', 'Coverage', 'Status'],
      ...cover.map(coverFile => {
        const coverPrecent = `${(coverFile.cover * 100).toFixed()}%`
        const indicator = passOrFailIndicator(coverFile.pass)
        const formatedFile = coverFile.file.replace('_', '\\_')
        return [formatedFile, coverPrecent, indicator]
      }),
      ['**TOTAL**', avgCover, averageIndicator]
    ],
    {align: ['l', 'c', 'c']}
  )
  return {coverTable, pass}
}

export function formatAverageTable(cover: AverageCoverage): {coverTable: string; pass: boolean} {
  const averageIndicator = passOrFailIndicator(cover.pass)
  const coverTable = markdownTable(
    [
      ['Lines', 'Covered', 'Coverage', 'Threshold', 'Status'],
      [`${cover.total}`, `${cover.covered}`, toPercent(cover.ratio), toPercent(cover.threshold), averageIndicator]
    ],
    {align: ['c', 'c', 'c', 'c', 'c']}
  )
  return {coverTable, pass: cover.pass}
}
