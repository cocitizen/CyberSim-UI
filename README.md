# CyberSim UI

CyberSim is a tabletop simulation platform designed to help organizations practice responding to complex digital crises.

It provides a structured environment where teams experience realistic scenarios, make time-bound decisions, and reflect on tradeoffs across operations, communications, security, and public trust.

This repository contains the CyberSim UI: a React application that provides the interactive simulation interface.

## Origins

The CyberSim facilitation app was originally developed by Rising Stack for the National Democratic Institute (NDI), with support from Microsoft and the National Endowment for Democracy, as part of broader efforts to strengthen civic resilience in the digital age.

## How CyberSim Works

CyberSim consists of two applications:

-   **CyberSim Backend** --- Node.js API that manages the database and
    scenario data
-   **CyberSim UI** --- React application that runs the simulation
    interface

The backend stores game data in **PostgreSQL**, while the source
scenario data is maintained in **Airtable**.

The UI communicates with the backend API using the environment variable:

    REACT_APP_API_URL

Example:

    REACT_APP_API_URL=http://localhost:3001

------------------------------------------------------------------------

# CyberSim UI Deployment Guide

The CyberSim Game comprises two distinct applications:

-   Node.js backend API
-   React frontend UI

This guide covers deployment of the **React UI application**.

For instructions on deploying the backend application see:

https://github.com/cocitizen/CyberSim-Backend#readme

------------------------------------------------------------------------

## Environment Component Naming Convention

Environment component names follow this format:
- **CyberSim Backend API** (Node.js / Express): manages game state, scenario data, and persistence
- **CyberSim UI** (React): renders the simulation interface for facilitators and participants

The backend stores game data in PostgreSQL. Source scenario content is maintained in Airtable and imported into the backend database.

For backend setup and deployment, see:  
https://github.com/cocitizen/CyberSim-Backend

## Technology Stack

- React (Create React App)
- JavaScript
- Static build output (`build/`)

## Configuration

The UI communicates with the backend using:

```
REACT_APP_API_URL
```

Example (local development):

```
REACT_APP_API_URL=http://localhost:3001
```

## Multi-Scenario Support

CyberSim supports running multiple scenarios from the same codebase and
backend. The active scenario is determined by the hostname:

| Hostname | Resolved scenario |
|---|---|
| `cso.cybersim.app` | `cso` |
| `campaign.cybersim.app` | `campaign` |
| `cybersim.app` (bare domain) | env var fallback |
| `localhost` | env var fallback |

The subdomain is extracted from `window.location.hostname` and passed to the
backend when creating a game and when fetching static scenario data. Existing
games already carry their scenario on the backend, so joining a game with a
different frontend scenario can mix static data from one scenario with runtime
state from another.

For the full new-scenario checklist, including Airtable, backend
configuration, DNS, and import/load steps, see:

```
CyberSim-Backend/docs/scenario-setup.md
```

For local development or bare-domain deployments, set the scenario explicitly on
the frontend — it is the single source of truth for which scenario you load:

```
REACT_APP_SCENARIO_SLUG=cso
```

The backend has no scenario variable of its own: it is multi-scenario and binds
each game to the slug the frontend sends. So make sure `REACT_APP_SCENARIO_SLUG`
matches the scenario your backend actually has data and games for.
(`IMPORT_SCENARIO_SLUG` is unrelated — it only tells the backend Airtable import
script which scenario to import.)

If neither the subdomain nor the env var is set, the UI defaults to `cso` (and
logs a console warning).

## Requirements

- Node.js (v22 recommended)
- npm

## Local Development

Clone the repository:

```bash
git clone <REPO_LINK>
cd CyberSim-UI
```

Install dependencies:

```bash
npm install
```

Create environment file:

```bash
cp .env.example .env
```

Set your backend API URL in `.env`, for example:

```bash
REACT_APP_API_URL=http://localhost:3001
```

For local testing against a non-default scenario, set the slug on the frontend
(the backend has no scenario variable — it binds each game to the slug the
frontend sends):

```bash
# CyberSim-UI/.env
REACT_APP_SCENARIO_SLUG=tnr

# CyberSim-Backend/.env — only when using the Airtable import script
IMPORT_SCENARIO_SLUG=tnr
```

Start the UI:

```bash
npm start
```

The UI runs at:

```
http://localhost:3000
```

## Available Scripts

Start development server:

```bash
npm start
```

Run tests:

```bash
npm test
```

Build production bundle:

```bash
npm run build
```

The production bundle is output to:

```
build/
```

## Deployment

This UI is a static React application.

You have two AWS deployment options:

- **Legacy:** S3 + CodePipeline  
  `docs/legacy-aws-s3-deployment.md`

- **Recommended:** AWS Amplify Hosting  
  `docs/aws-amplify-deployment.md`

In all deployment approaches, ensure:

```
REACT_APP_API_URL
```

is set to the live backend API URL.

## Scenario Setup

Scenario content is imported or loaded through the backend. For the full
new-scenario workflow, including Airtable, backend environment variables,
subdomain setup, import/load steps, and verification, see:

```
CyberSim-Backend/docs/scenario-setup.md
```
