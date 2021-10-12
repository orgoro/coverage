import * as core from '@actions/core'
import {context} from '@actions/github'
import {parseCoverageReport} from './coverage'
import {compareCommits} from './compareCommits'
import {messagePr} from './messagePr'
import {octokit} from './client'

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

    const checkName = 'Coverge Results'
    const checks = await octokit.rest.checks.listForRef({
      ...context.repo,
      ref: head
    })

    const existingCheck = checks.data?.check_runs?.find(check => check.name === checkName)

    let checkId = -1

    if (existingCheck) {
      checkId = existingCheck.id
      core.info(`existing checkId: ${checkId}`)
      await octokit.rest.checks.update({
        ...context.repo,
        check_run_id: checkId,
        status: 'in_progress'
      })
    } else {
      const respond = await octokit.rest.checks.create({
        ...context.repo,
        head_sha: head,
        name: checkName,
        status: 'in_progress'
      })
      checkId = respond.data.id
      core.info(`new checkId: ${checkId}`)
    }

    core.info(`comparing commits: base ${base} <> head ${head}`)
    const files = await compareCommits(base, head)
    core.info(`git new files: ${JSON.stringify(files.newFiles)} modified files: ${JSON.stringify(files.modifiedFiles)}`)

    const report = fs.readFileSync(coverageFile, 'utf8')
    const filesCoverage = parseCoverageReport(report, files)
    const {passOverall, message} = messagePr(filesCoverage)

    if (passOverall) {
      octokit.rest.checks.update({
        ...context.repo,
        run_check_id: checkId,
        status: 'completed',
        conclusion: 'success',
        output: {title: 'Coverage Results ✅', summary: message}
      })
    } else {
      octokit.rest.checks.update({
        ...context.repo,
        run_check_id: checkId,
        status: 'failure',
        conclusion: 'failed',
        output: {title: 'Coverage Results ❌', summary: message}
      })
      core.setFailed('Coverage is lower then configured threshold 😭')
    }
  } catch (error) {
    core.setFailed(JSON.stringify(error))
  }
}

run()
