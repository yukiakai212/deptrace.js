# @yukiakai/deptrace

Dependency auditing and upgrade planning for JavaScript and TypeScript projects.

`@yukiakai/deptrace` helps identify:

* Vulnerable dependencies
* Available upgrades
* Upgrade blockers
* Dependency transparency information
* Root dependencies responsible for vulnerable dependency chains

Unlike traditional vulnerability scanners, deptrace does not rely on
advisory-level upgrade suggestions alone.

For each vulnerable dependency, deptrace traces the dependency graph
back to the root dependencies that introduce it and evaluates whether
an upgrade actually removes the vulnerable package from the resolved
dependency tree.

This helps avoid remediation recommendations that appear valid but
still leave vulnerable dependencies reachable after installation.

## Features

* Security auditing
* Latest version auditing
* Root dependency remediation analysis
* Dependency graph resolution
* Dependency chain analysis
* Upgrade planning
* Workspace and monorepo support
* JSON and console reports
* Dependency transparency reporting
* Conservative handling of non-registry dependency sources

---

## Installation

```bash
npm install -g @yukiakai/deptrace
```

then

```bash
npx deptrace
```

---

## Commands

### Security Audit

Analyze project dependencies for known vulnerabilities.

```bash
deptrace security
```

---

### Latest Audit

Analyze available dependency upgrades.

```bash
deptrace latest
```

---

## Examples

Audit the current project:

```bash
deptrace security
```

Check available upgrades:

```bash
deptrace latest
```

Audit multiple projects in a monorepo:

```bash
deptrace security --project-dir packages/*
```

Include prerelease versions:

```bash
deptrace latest --include-prerelease
```

Generate JSON output:

```bash
deptrace security --output-format json
```

Save JSON output:

```bash
deptrace security --output-format json > report.json
```

---

## Options

### Common Options

| Option                        | Description                                                 |
| ----------------------------- | ----------------------------------------------------------- |
| `--project-dir <pattern...>`  | Project directory glob patterns                             |
| `--output-format <format>`    | Output format (`console`, `json`)                           |
| `--show-transparency`         | Show dependency transparency information                    |
| `--allow-external-sources`    | Follow non-registry dependencies during dependency analysis |
| `--include-prerelease`        | Include prerelease versions                                 |
| `--minimum-release-age <age>` | Minimum release age (e.g. `7d`, `24h`, `30m`)               |

---

## External Dependency Sources

By default, deptrace only follows dependencies that can be resolved through package registries.

External dependency sources such as:

* `git:`
* `file:`
* `directory:`
* `workspace:`
* remote tarballs

are ignored during dependency graph expansion unless explicitly enabled.

This behavior makes analysis deterministic and independent from
platform-specific package manager resolution behavior.

Enable external source traversal:

```bash
deptrace latest --allow-external-sources
```

---

## Output Formats

### Console

Human-readable output optimized for local development.

```bash
deptrace latest
```

### JSON

Machine-readable output optimized for automation and CI/CD.

```bash
deptrace latest --output-format json
```

---

## Monorepo Support

Analyze multiple projects using glob patterns.

```bash
deptrace security \
  --project-dir packages/*
```

```bash
deptrace latest \
  --project-dir apps/* \
  --project-dir packages/*
```

---

## Release Age Filtering

New package releases may occasionally contain regressions.

Use release age filtering to avoid recommending versions that were published too recently.

Example:

```bash
deptrace latest --minimum-release-age 7d
```

Supported units:

* `s`
* `m`
* `h`
* `d`

Examples:

```text
30m
12h
7d
30d
```

---

## Why Not npm audit?

deptrace focuses on dependency graph remediation rather than advisory reporting.

npm audit may recommend upgrades based on advisory metadata alone.

deptrace evaluates whether a remediation actually removes or patches the vulnerable dependency in the resolved dependency graph before reporting it as a fix candidate.

---

## License

MIT Yuki Akai
