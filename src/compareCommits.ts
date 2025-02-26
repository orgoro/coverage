import {context} from '@actions/github'
import {octokit} from './client'

export type CommitsComparison = {
  newFiles: string[]
  modifiedFiles: string[]
}

export async function compareCommits(base: string, head: string): Promise<CommitsComparison> {
  const {owner, repo} = context.repo
  const response = await octokit.rest.repos.compareCommits({base, head, owner, repo})

  const files = response.data.files ?? []
  const newFiles: string[] = []
  const modifiedFiles: string[] = []

  for (const file of files) {
    if (file.status === 'added') newFiles.push(file.filename)
    if (file.status === 'modified' || file.status === 'renamed') modifiedFiles.push(file.filename)
  }
  return {newFiles, modifiedFiles}
}
