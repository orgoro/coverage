import * as core from '@actions/core'
import {context} from '@actions/github'
import {parseCoverageReport} from './coverage'
import {compareCommits} from './compareCommits'
import {scorePr} from './scorePr'
import readFile from './readFile'

async function run(): Promise<void> {
  try {
    const coverageFile: string = core.getInput('coverageFile', {required: true})
    core.debug(`coverageFile: ${coverageFile}`)

    const eventName = context.eventName
    let base: string
    let head: string
    let issue_number: number
    if (eventName === 'pull_request') {
      const {pull_request} = context.payload
      base = pull_request?.base.sha
      head = pull_request?.head.sha
      issue_number = context.issue.number
    } else if (eventName === 'workflow_run' && context.payload.workflow_run.event === 'pull_request') {
      const pull_request = context.payload.workflow_run.pull_requests[0]
      base = pull_request.base.sha
      head = pull_request.head.sha
      issue_number = pull_request.number
    } else {
      core.setFailed(`action support only pull requests or workflow runs triggered by pull requests`)
      return
    }
    core.info(`comparing commits: base ${base} <> head ${head}`)
    const files = await compareCommits(base, head)
    core.info(`git new files: ${JSON.stringify(files.newFiles)} modified files: ${JSON.stringify(files.modifiedFiles)}`)

    const report = readFile(coverageFile)
    const filesCoverage = parseCoverageReport(report, files)
    const passOverall = scorePr(filesCoverage, issue_number)

    if (!passOverall) {
      core.setFailed('Coverage is lower than configured threshold 😭')
    }
  } catch (error) {
    const message = JSON.stringify(error instanceof Error ? error.message : error)
    core.setFailed(message)
  }
}

run()
