![code cov](https://github.com/orgoro/coverage/actions/workflows/test.yml/badge.svg)

# Python Cov: Python Coverage Reporter GitHub Action

> 🐍 parse and publish coverage xml to a PR, enforce coverage rate on new & modified files

## Usage

Create a new workflow `.yml` file in the `.github/workflows/` directory.

### Minimal Configuration
```yml
name: 'coverage'
on:
    pull_request:
        branches:
            - master
            - main
jobs:
    coverage:
        runs-on: ubuntu-latest
        steps:
            - uses: orgoro/python-cov
              with:
                  report: path/to/coverage.xml
```

## Inputs

| input               | optional | description                                      | example                |
|---------------------|----------|--------------------------------------------------|------------------------|
| `coverageFile`      | ❌        | path to python .xml coverage report              | ./path/to/coverage.xml |
| `token`             | ✅        | your github token                                | 🤫                     |
| `thresholdAll`      | ✅        | the minimal average line coverage                | 0.8                    |
| `thresholdNew`      | ✅        | the minimal average new files line coverage      | 0.9                    |
| `thresholdModified` | ✅        | the minimal average modified files line coverage | 0.8                    |