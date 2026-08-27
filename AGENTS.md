# CyberSim UI contributor map

CyberSim spans four repositories. This repository is the default home for system-wide and ambiguously owned project knowledge.

| Repository | Primary authority |
| --- | --- |
| `CyberSim-UI` | System overview and decisions; system backlog; frontend behavior, testing, and deployment |
| `CyberSim-Backend` | API and runtime behavior; database and migrations; scenario import; Backend operations and deployment |
| `cybersim-website` | Public website implementation and published product claims |
| `cybersim-resources` | Current facilitation materials, editable sources, and resource releases |

For component-specific truth, use the owning repository. For cross-repository or ambiguously owned knowledge, start here. Link to authoritative information rather than copying it.

## Authoritative project knowledge

- System overview: `README.md` and `docs/cybersim-architecture.md`
- System decisions and consequential open questions: `docs/decisions.md`
- Planned and potential work: `docs/cybersim-backlog.md`
- Frontend deployment: `docs/aws-amplify-deployment.md`
- Backend, scenario, and Airtable operations: the relevant documents in `CyberSim-Backend/docs/`

## Working conventions

- Before starting: identify the intended result, affected repositories, relevant constraints, and verification method.
- If pausing: preserve recoverable work and record what remains and the next action in the active backlog item or pull request.
- If finishing: run proportionate checks, describe any checks not performed, and update durable documentation whose truth changed.
- For cross-repository work, name companion branches or pull requests explicitly. Ask whether the change also alters a public claim, a decision another repository assumes, or a facilitation resource.
- Do not commit secrets, `.env` files, generated builds, dependency directories, or private conversation/session state.
- Draft external communications for human review; do not send, publish, deploy, or otherwise communicate externally without explicit authorization.

## UI validation

- Lint: `npm run lint`
- Unit tests (non-watch): `npm test -- --watchAll=false`
- Production build: `npm run build`
- End-to-end tests: `npm run test:e2e` when the affected behavior warrants the full UI/Backend scenario suite

The local pre-commit hook runs linting. Record the checks actually performed in the pull request; hooks may be bypassed or unavailable in another environment.
