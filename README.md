# Expense Tracker

Isang simpleng React expense tracker para sa Software Quality Engineering final project. Ang app ay nag-a-add, nagde-delete, at nagfi-filter ng expenses, at nagpapakita ng total at per-category subtotals. **In-memory state lang** — walang database at walang `localStorage`.

Repo: `https://github.com/SkyTheLight/expense-tracker`

## Requirements

- Node.js **18+** (npm 9+)
- Docker (para sa local image test at CD deployment)
- Jenkins + SonarQube (para sa CI/CD pipeline; titingnan sa `<JENKINS_URL>` at `<SONARQUBE_URL>`)

## Setup

```bash
git clone https://github.com/SkyTheLight/expense-tracker.git
cd expense-tracker
npm ci
npm run dev
```

Dev server: `http://localhost:5173`

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm test` | Run lahat ng Vitest tests (`vitest run`) |
| `npm run coverage` | Run tests + V8 coverage; text report at `coverage/lcov.info` |
| `npm run build` | Gumawa ng production bundle sa `dist/` |

Current state: **18 tests passing**, **100% coverage** (`src/App.jsx`, `src/expenses.js`).

## Structure

```text
src/
  expenses.js        pure functions: validateExpense, calculateTotal,
                     calculateByCategory, filterByCategory
  App.jsx            UI (form, list, summary, filter, delete)
  App.css            plain CSS
  main.jsx           entry point
  expenses.test.js   unit tests
  App.test.jsx       component tests
```

## Branch strategy at CI

| Branch | Ginagawa ng CI |
| --- | --- |
| `feature/*` | `npm ci` → `npm test` → `npm run coverage` → SonarQube PR analysis → `npm run build` |
| `develop` | Parehong validation + SonarQube branch analysis + build (integration branch) |
| `main` | Lahat ng nasa itaas **+ Archive Artifact** (main lang) |

Flow: `feature/*` → PR sa `develop` → merge sa `develop` → PR sa `main` → merge sa `main` → CI nag-archive ng artifact → CD nag-deploy.

Jenkins links: CI `<JENKINS_CI_JOB_URL>` · CD `<JENKINS_CD_JOB_URL>` · SonarQube `<SONARQUBE_URL>`

### CI stages (Jenkinsfile ni B)

1. **Checkout** — `npm ci`
2. **Test** — `npm test`
3. **Coverage** — `npm run coverage` (ipapasa ang `coverage/lcov.info` sa SonarQube)
4. **SonarQube** — analysis + quality gate (**80% coverage minimum**)
5. **Build** — `npm run build`
6. **Archive Artifact** — `main` lang:

```groovy
sh 'sh package-artifact.sh ${BUILD_NUMBER}'
archiveArtifacts artifacts: 'react-app-*.tar.gz', fingerprint: true
```

## Artifact

`package-artifact.sh <build-number>` (o `BUILD_NUMBER` env var) ay gumagawa ng:

```text
react-app-<BUILD_NUMBER>.tar.gz
├── dist/
└── Dockerfile
```

**Walang `node_modules`** sa loob — hindi na nagre-rebuild ng React sa deployment. Kung walang `dist/`, may error hanggang hindi una i-run ang `npm run build`.

Local check:

```bash
npm run build
sh package-artifact.sh 1
tar -tzf react-app-1.tar.gz    # dist/ at Dockerfile lang
```

## CD / Deployment

Copy artifact mula sa CI, tapus:

```sh
tar -xzf react-app-${CI_BUILD_NUMBER}.tar.gz
docker build -t expense-tracker:${ENVIRONMENT}-${CI_BUILD_NUMBER} .
docker rm -f expense-tracker-${ENVIRONMENT} || true
docker run -d --name expense-tracker-${ENVIRONMENT} -p <PORT>:80 expense-tracker:${ENVIRONMENT}-${CI_BUILD_NUMBER}
```

| Parameter | Halimbawa | Meaning |
| --- | --- | --- |
| `CI_BUILD_NUMBER` | `42` | Build number mula Jenkins; ginagamit sa artifact + image tag |
| `ENVIRONMENT` | `DEV` | Deployment target (lowercase sa container name at tag) |

Port mapping (gawa ni C):

| ENVIRONMENT | Port |
| --- | --- |
| `DEV` | 3001 |
| `TEST` | 3002 |
| `ACC` | 3003 |
| `PROD` | 3004 |

Dockerfile: `nginx:1.27-alpine`, serves `dist/` sa `/usr/share/nginx/html/`, `EXPOSE 80`, at may `HEALTHCHECK` gamit ang `wget`.

### Jenkins CD pipeline (`Jenkinsfile.cd`)

Hiwalay na **Pipeline** job ito — hindi Multibranch — gamit ang repo bilang SCM at **Script Path** na `Jenkinsfile.cd`. Hindi nito binabago ang existing na CI `Jenkinsfile`.

**Required plugins (i-verify sa Jenkins bago gamitin; hindi pa nakumpirmang naka-install):**

- Pipeline: Declarative + Pipeline: Job
- Git SCM
- **Copy Artifact Plugin** (`copyArtifacts`) — kailangan para kumuha ng artifact mula sa `expense-tracker/main`
- Docker CLI sa Jenkins agent na may access sa Docker daemon (kung nasa container ang Jenkins, kailangang i-mount ang Docker socket)

| Parameter | Type | Meaning |
| --- | --- | --- |
| `CI_BUILD_NUMBER` | String | Build number ng `expense-tracker/main` na nag-archive ng artifact (hal. `9`) |
| `ENVIRONMENT` | Choice | `DEV`, `TEST`, `ACC`, `PROD` |

**Stages:** Validate and report parameters → Approve PROD deployment (`input`, **PROD lang**) → Copy CI artifact → Extract artifact → Docker deploy → Health check. Walang `npm ci`, `npm test`, o `npm run build` sa CD — ang na-archive nang artifact mula CI lang ang ine-deploy.

**Image at container:** `expense-tracker:<lowercase-env>-<CI_BUILD_NUMBER>` at `expense-tracker-<lowercase-env>`. Ang container lang ng napiling environment ang tinatanggal bago mag-start; hindi naaapektuhan ang ibang environment.

**Health check:** Hintay hanggang `healthy` ang container (180s timeout, 5s polling). Kapag nabigo, ipi-print ang `docker ps`, `docker logs`, at `docker inspect`, tapos i-fail ang build — hindi ito magre-report ng successful deployment.

**Paano mag-deploy ng existing CI build:**

1. Sa Jenkins, buksan ang CD job → **Build with Parameters**.
2. Itakda ang `CI_BUILD_NUMBER` sa build number ng `main` na may artifact (hal. `9` → `react-app-9.tar.gz`).
3. Piliin ang `ENVIRONMENT`.
4. Para sa `PROD`, i-approve muna ang pending `input` bago mag-deploy.
5. I-verify sa console ang application URL at ang `Deployment result`.

## SonarQube

- Coverage input: `coverage/lcov.info` (V8 provider, `text` + `lcov` reporters)
- Gate: **≥ 80% overall coverage** (current: 100%)
- Excluded sa coverage: `src/main.jsx` at test files
- Server: `<SONARQUBE_URL>` · project key: `<SONAR_PROJECT_KEY>` · token: `<SONAR_TOKEN>`

## npm audit

Buong output ay naka-save sa `audit-before.txt` (naka-commit).

- `npm audit` → **10 vulnerabilities** (6 moderate, 1 high, 3 critical)
- Lahat ay **dev dependencies**: `@vitest/mocker`, `vitest`, `vite`, `esbuild`, `vite-node`, `glob`, `minimatch`, `test-exclude`, `@vitest/coverage-v8`, `tinypool`
- Production dependencies (`react`, `react-dom`) ay malinis; walang kasamang Node packages sa `dist/` artifact
- `npm audit fix` (walang `--force`) ay sinubukan — walang breaking change, at ang 10 findings ay nananatili
- Tunay na remediation ay **breaking major upgrade**: `vitest@5.1.1`, `@vitest/coverage-v8@5.1.1`, `vite@8.3.8`. Kailangang i-bump nang sabay, i-verify ulit ang `npm test` / `npm run coverage` / `npm run build`, tapus i-confirm ang `npm audit`. **Hintay sa review bago i-apply.**
- Halimbawang finding: `tinypool <=2.1.1` (critical) — prototype pollution sa worker options ng Vitest na pwede maging RCE; naaayos sa pag-upgrade ng Vitest.
