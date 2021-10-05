import * as core from '@actions/core'
import {context} from '@actions/github'
import {octokit} from './client'
import {Coverage, FilesCoverage} from './coverage'
import {markdownTable} from 'markdown-table'

export async function publishMessage(
  pr: number,
  message: string
): Promise<void> {
  const title = `# 👀 Coverage Watcher 
  `
  const body = title.concat(message)

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

function averageCover(cover: Coverage[]): number {
  return (
    (100 * cover.reduce((acc: number, curr: Coverage) => curr.cover + acc, 0)) /
    cover.length
  )
}

function formatTable(cover: Coverage[]): {coverTable: string; pass: boolean} {
  const avgCover = averageCover(cover)
  const pass = cover.reduce((acc, curr) => acc && curr.pass, true)
  const averageIndicator = pass ? '🟢' : '🔴'
  const coverTable = markdownTable(
    [
      ['Status', 'Coverage', 'File'],
      ...cover.map(coverFile => {
        const coverPrecent = coverFile.cover * 100
        const indicator = coverFile.pass ? '🟢' : '🔴'
        return [indicator, `${coverPrecent}%`, coverFile.file]
      }),
      [averageIndicator, `${avgCover}%`, 'TOTAL']
    ],
    {align: ['c', 'c', 'l']}
  )
  return {coverTable, pass}
}

export function messagePr(filesCover: FilesCoverage): void {
  let message = ''
  let passOverall = true
  if (filesCover.newCover) {
    const {coverTable, pass} = formatTable(filesCover.newCover)
    passOverall = passOverall && pass
    message = message.concat(`
    ## New Files
    
    ${coverTable}
    `)
  } else {
    message = message.concat(`
    ## New Files
    no new files...
    `)
  }

  if (filesCover.modifiedCover) {
    const {coverTable, pass} = formatTable(filesCover.modifiedCover)
    passOverall = passOverall && pass

    message = message.concat(`
    ## Modified Files
    ${coverTable}
    
    `)
  } else {
    message = message.concat(`
    ## Modified Files
    no modified files...
    `)
  }

  publishMessage(context.issue.number, message)

  if (!passOverall) {
    core.setFailed('Coverage is lower then configured treshold')
  }
}
