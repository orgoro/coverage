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

  const files = response.data.files ?? []

  const [newFiles, modifiedFiles] = files.reduce(
    (acc, curr) =>
      {
        curr.status === 'added'
        ? acc[0].push(curr.filename)
        : acc[1].push(curr.filename)
        return acc;
      },
    [[], []] as string[][]
  )


  return new CommitsComparison(newFiles, modifiedFiles)
}
