import * as core from '@actions/core'
import {context} from '@actions/github'
import {octokit} from './client'
import {AverageCoverage, Coverage, FilesCoverage} from './coverage'
import {markdownTable} from 'markdown-table'

export async function publishMessage(
  pr: number,
  message: string
): Promise<void> {
  const title = `# ☂️ Cov Reporter`
  const body = title.concat(message)
  core.info(body)

  const comments = await octokit.rest.issues.listComments({
    ...context.repo,
    issue_number: pr
  })
  const exist = comments.data.find(commnet => {
    return commnet.body?.startsWith(title)
  })

  if (exist) {
    await octokit.rest.issues.updateComment({
      ...context.repo,
      issue_number: pr,
      comment_id: exist.id,
      body
    })
  } else {
    await octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: pr,
      body
    })
  }
}

function averageCover(cover: Coverage[]): string {
  const filterd = cover.filter(file => file.cover >= 0)
  const sum = filterd.reduce((acc, curr) => curr.cover + acc, 0)
  return `**${((100 * sum) / filterd.length).toFixed()}%**`
}

function formatFilesTable(
  cover: Coverage[]
): {coverTable: string; pass: boolean} {
  const avgCover = averageCover(cover)
  const pass = cover.reduce((acc, curr) => acc && curr.pass, true)
  const averageIndicator = pass ? '🟢' : '🔴'
  const coverTable = markdownTable(
    [
      ['File', 'Coverage', 'Status'],
      ...cover.map(coverFile => {
        const coverPrecent = `${(coverFile.cover * 100).toFixed()}%`
        const indicator = coverFile.pass ? '🟢' : '🔴'
        return [coverFile.file, coverPrecent, indicator]
      }),
      ['**TOTAL**', avgCover, averageIndicator]
    ],
    {align: ['l', 'c', 'c']}
  )
  return {coverTable, pass}
}
function toPercent(value: number): string {
  return `${(100 * value).toFixed()}%`
}
function formatAverageTable(
  cover: AverageCoverage
): {coverTable: string; pass: boolean} {
  const averageIndicator = cover.pass ? '🟢' : '🔴'
  const coverTable = markdownTable(
    [
      ['Lines', 'Covered', 'Coverage', 'Threshold', 'Status'],
      [
        `${cover.total}`,
        `${cover.covered}`,
        toPercent(cover.ratio),
        toPercent(cover.threshold),
        averageIndicator
      ]
    ],
    {align: ['c', 'c', 'c', 'c', 'c']}
  )
  return {coverTable, pass: cover.pass}
}

export function messagePr(filesCover: FilesCoverage): void {
  let message = ''
  let passOverall = true

  const {coverTable: avgCoverTable, pass: passTotal} = formatAverageTable(
    filesCover.averageCover
  )
  core.startGroup('Overall coverage')
  message = message.concat(`\n## Overall Coverage\n${avgCoverTable}`)
  passOverall = passOverall && passTotal
  const coverAll = toPercent(filesCover.averageCover.ratio)
  passTotal
    ? core.info(`Average coverage ${coverAll} ✅`)
    : core.error(`Average coverage ${coverAll} ❌`)
  core.endGroup()

  core.startGroup('New files coverage')
  if (filesCover.newCover?.length) {
    const {coverTable, pass: passNew} = formatFilesTable(filesCover.newCover)
    passOverall = passOverall && passNew
    message = message.concat(`\n## New Files\n${coverTable}`)
    passNew
      ? core.info('New files coverage ✅')
      : core.error('New Files coverage ❌')
  } else {
    message = message.concat(`\n## New Files\nNo new files...`)
    core.info('No covered new files in this PR ')
  }
  core.endGroup()

  core.startGroup('Modified files coverage')
  if (filesCover.modifiedCover?.length) {
    const {coverTable, pass: passModified} = formatFilesTable(
      filesCover.modifiedCover
    )
    passOverall = passOverall && passModified
    message = message.concat(`\n## Modified Files\n${coverTable}`)
    passModified
      ? core.info('Modified files coverage ✅')
      : core.error('Modified Files coverage ❌')
  } else {
    message = message.concat(`\n## Modified Files\nNo modified files...`)
    core.info('No covered modified files in this PR ')
  }
  core.endGroup()

  message = `\n> current status: ${passOverall ? '✅' : '❌'}`.concat(message)
  publishMessage(context.issue.number, message)

  core.startGroup('Final result')
  if (passOverall) {
    core.info('Coverage is green ✅')
  } else {
    core.setFailed('Coverage is lower then configured treshold 😭')
  }
  core.endGroup()
}
