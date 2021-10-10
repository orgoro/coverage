import {context} from '@actions/github'
import {octokit} from './client'

export class CommitsComparison {
  constructor(public newFiles: string[], public modifiedFiles: string[]) {}
}

export async function compareCommits(base: string, head: string): Promise<CommitsComparison> {
  const response = await octokit.rest.repos.compareCommits({
    base,
    head,
    owner: context.repo.owner,
    repo: context.repo.repo
  })

  const files = response.data.files ?? []

  const newFiles: string[] = []
  const modifiedFiles: string[] = []

  // Also  uncommon to write for loops in JS these days - unless you want async tasks to run sequentally
  for (const file of files) {
    if (file.status === 'added') newFiles.push(file.filename)
    if (file.status === 'modified') modifiedFiles.push(file.filename)
  }
  return new CommitsComparison(newFiles, modifiedFiles)
}
