import * as core from '@actions/core'
import {getOctokit} from '@actions/github'

const token = core.getInput('token')

export const octokit = getOctokit(token)
