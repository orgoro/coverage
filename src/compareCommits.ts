import {context} from '@actions/github'
import {octokit} from './client'

export class CommitsComparison {
  constructor(public newFiles: string[], public modifiedFiles: string[]) {}
}

export async function compareCommits(
  base: string,
  head: string
): Promise<CommitsComparison> {
  const response = await octokit.rest.repos.compareCommits({
    base,
    head,
    owner: context.repo.owner,
    repo: context.repo.repo
  })

  const newFiles: string[] = []
  const modifiedFiles: string[] = []
  const files = response.data.files ?? []

  for (const file of files) {
    switch (file.status) {
      case 'added':
        newFiles.push(file.filename)
        break
      case 'modified':
        modifiedFiles.push(file.filename)
        break
    }
  }

  return new CommitsComparison(newFiles, modifiedFiles)
}
