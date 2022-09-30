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
    if (eventName !== 'pull_request') {
      core.setFailed(`action support only pull requests but event is ${eventName}`)
      return
    }
    const {pull_request} = context.payload
    const base = pull_request?.base.sha
    const head = pull_request?.head.sha

    core.info(`comparing commits: base ${base} <> head ${head}`)
    const files = await compareCommits(base, head)
    core.info(`git new files: ${JSON.stringify(files.newFiles)} modified files: ${JSON.stringify(files.modifiedFiles)}`)

    const report = readFile(coverageFile)
    const filesCoverage = parseCoverageReport(report, files)
    const passOverall = scorePr(filesCoverage)

    if (!passOverall) {
      core.setFailed('Coverage is lower then configured threshold 😭')
    }
  } catch (error) {
    const message = JSON.stringify(error instanceof Error ? error.message : error)
    core.setFailed(message)
  }
}

run()
