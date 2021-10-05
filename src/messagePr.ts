import * as core from '@actions/core'
import {context} from '@actions/github'
import {octokit} from './client'
import {Coverage, FilesCoverage} from './coverage'
import {markdownTable} from 'markdown-table'

export async function publishMessage(
  pr: number,
  message: string
): Promise<void> {
  const title = `# 👀 Coverage Watcher`
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
  return filterd.length
    ? `**${((100 * sum) / filterd.length).toFixed()}%**`
    : `**-**`
}

function formatTable(cover: Coverage[]): {coverTable: string; pass: boolean} {
  const avgCover = averageCover(cover)
  const pass = cover.reduce((acc, curr) => acc && curr.pass, true)
  const averageIndicator = pass ? '🟢' : '🔴'
  const coverTable = markdownTable(
    [
      ['Status', 'Coverage', 'File'],
      ...cover.map(coverFile => {
        const coverPrecent =
          coverFile.cover >= 0 ? `${(coverFile.cover * 100).toFixed()}%` : '-'
        const indicator = coverFile.pass ? '🟢' : '🔴'
        return [indicator, coverPrecent, coverFile.file]
      }),
      [averageIndicator, avgCover, '']
    ],
    {align: ['c', 'c', 'l']}
  )
  return {coverTable, pass}
}

export function messagePr(filesCover: FilesCoverage): void {
  let message = ''
  let passOverall = true
  if (filesCover.newCover?.length) {
    const {coverTable, pass} = formatTable(filesCover.newCover)
    passOverall = passOverall && pass
    message = message.concat(`\n## New Files\n${coverTable}`)
  } else {
    message = message.concat(`\n## New Files\nNo new files...`)
  }

  if (filesCover.modifiedCover?.length) {
    const {coverTable, pass} = formatTable(filesCover.modifiedCover)
    passOverall = passOverall && pass
    message = message.concat(`\n## Modified Files\n${coverTable}`)
  } else {
    message = message.concat(`\n## Modified Files\nNo modified files...`)
  }

  publishMessage(context.issue.number, message)

  if (!passOverall) {
    core.setFailed('Coverage is lower then configured treshold')
  }
}
