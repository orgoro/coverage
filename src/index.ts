import * as core from '@actions/core'
import {context} from '@actions/github'
import {parseCoverageReport} from './coverage'
import {compareCommits} from './compareCommits'
import {messagePr} from './messagePr'

import * as fs from 'fs'

async function run(): Promise<void> {
  try {
    const coverageFile: string = core.getInput('coverageFile', {required: true})
    core.debug(`coverageFile: ${coverageFile}`)

    const eventName = context.eventName
    if (eventName !== 'pull_request') {
      core.setFailed(`action support only pull requests but event is ${eventName}`)
    }
    const base = context.payload.pull_request?.base.sha
    const head = context.payload.pull_request?.head.sha

    core.info(`comparing commits: base ${base} <> head ${head}`)
    const files = await compareCommits(base, head)
    core.info(`git new files: ${JSON.stringify(files.newFiles)} modified files: ${JSON.stringify(files.modifiedFiles)}`)

    const report = fs.readFileSync(coverageFile, 'utf8')
    const filesCoverage = parseCoverageReport(report, files)
    messagePr(filesCoverage)
  } catch (error) {
    core.setFailed(JSON.stringify(error))
  }
}

run()
