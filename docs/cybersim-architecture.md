# CyberSim Architecture

## 1. System Overview

CyberSim is a tabletop simulation platform designed to help
organizations learn digital security fundamentals and practice
responding to complex digital crises through a fun, fast-paced game
anchored in the real (and risky) worlds they know.

The platform provides a structured environment where teams interact with
simulated crisis events, make decisions under time and financial
pressure, and explore tradeoffs across operations, communications,
security, and winning.

CyberSim consists of two primary software components:

``` text
CyberSim UI (React)
   │
   │ hosted on
   ▼
AWS Amplify (static hosting + CDN)
   │
   │ HTTP API
   ▼
CyberSim Backend (Node / Express)
   │
   │ SQL via Knex
   ▼
PostgreSQL Database
```

Scenario content is authored in Airtable, then imported into the backend
database.

CyberSim is usually run as an in-person event with a dozen participants
and three facilitators. Participants are typically not technology
experts, but are rather average people from civil society, political
parties and campaigns, or parliament who are interested in raising their
organizational and individual cybersecurity expertise. The session takes
place over a frantic 60 (typically)  minutes, simulating some time-bound event such
as a political campaign, where the ostensible goal is to, eg, win
election - but they will be constantly derailed by cybersecurity events
which will have very real impacts on their campaign.

## 2. Major Components

### 2.1 CyberSim UI

The UI is a React application that renders the simulation interface for
the facilitators to manage the various cybersecurity events and player
responses, and manages automatic injections through a simulation timer.
The UI also provides a "projector" mode designed to be shown to the
participants, tracking their level of success, available funds, and
which IT systems are available to them.

Responsibilities include:

-   Rendering the game interface
-   Displaying scenario events ("injections")
-   Managing the opening "purchase" phase of mitigations
-   Capturing team decisions and responses
-   Communicating with the backend API
-   Displaying a dashboard of game status for participants

#### Technology

-   React (Create React App)
-   JavaScript
-   Static build output (`build/`)

#### Backend Communication

The UI communicates with the backend using the environment variable:

    REACT_APP_API_URL

Example:

    REACT_APP_API_URL=http://localhost:3001

#### Scenario Import Trigger

The UI can trigger the backend admin scenario import flow. That flow
loads scenario data from Airtable into the database.

### 2.2 CyberSim Backend

The backend provides the simulation engine and persistence layer.

It manages:

-   game state
-   scenario data
-   database persistence
-   Airtable imports

#### Technology Stack

-   Node.js runtime
-   Express API framework
-   PostgreSQL database
-   Knex query builder
-   Docker containerization

#### Responsibilities

The backend API performs several roles:

  Responsibility    Description
  ----------------- -------------------------------------------
  Game engine       Tracks the state of a running simulation
  Scenario data     Stores injections, responses, mitigations
  Persistence       Saves game state and outcomes
  Import pipeline   Loads scenario data from Airtable
  Health checks     Supports infrastructure monitoring

Health endpoints include:

    GET /health
    GET /health/db
    GET /health/airtable

#### Core API surface

The backend exposes two distinct interaction patterns:

1.  REST endpoints for health checks, static scenario data, and
    administrative import operations
2.  Socket.IO events for live game play and runtime state updates

### REST endpoints

Health / operational

    GET /
    GET /health
    GET /health/db
    GET /health/airtable

Static scenario / reference data

    GET /mitigations
    GET /locations
    GET /dictionary
    GET /systems
    GET /injections
    GET /responses
    GET /actions
    GET /curveballs

Administrative

    POST /admin/scenarios/import

### Live gameplay interface

Actual simulation play is driven primarily through **Socket.IO**, not
ordinary REST endpoints.

Frontend emits events such as:

    JOINGAME
    STARTSIMULATION
    PAUSESIMULATION
    FINISHSIMULATION
    CHANGEMITIGATION
    PERFORMACTION
    PERFORMCURVEBALL
    RESTORESYSTEM
    DELIVERINJECTION
    RESPONDTOINJECTION
    NONCORRECTRESPONDTOINJECTION

Backend emits:

    GAMEUPDATED

Synchronization model:

1.  Client emits event
2.  Backend updates PostgreSQL-backed game state
3.  Backend reloads aggregated game payload
4.  Backend broadcasts updated state to all clients in the room

## 3. Data Architecture

### PostgreSQL Database

CyberSim stores simulation data in PostgreSQL.

Responsibilities:

-   storing scenario data
-   tracking game progress
-   recording player responses
-   persisting simulation history

### Schema Model

Static scenario content:

-   injection
-   response
-   mitigation
-   system
-   action
-   curveball
-   location
-   dictionary
-   role

Static join tables:

-   injection_response
-   action_role

Runtime tables:

-   game
-   game_injection
-   game_system
-   game_mitigation
-   game_log

### Runtime state pattern

A new game clones static scenario data into runtime tables so each
simulation run is isolated.

## 4. Scenario Authoring Pipeline

Scenario content is authored in Airtable and imported into PostgreSQL.

Flow:

    Airtable
       │
    Admin scenario import
       │
    CyberSim Backend
       │
    PostgreSQL

Required environment variables:

    AIRTABLE_ACCESS_TOKEN
    AIRTABLE_BASE_IDS
    IMPORT_PASSWORD

## 5. Local Development Architecture

    React UI (localhost:3000)
            │
    Backend API (localhost:3001)
            │
    PostgreSQL (Docker container)

## 6. Production Infrastructure

    Internet
       │
    Cloudflare DNS
       │
    api.cybersim.app
       │
    AWS Application Load Balancer
       │
    Elastic Beanstalk EC2
       │
    Docker container
       │
    Node / Express API
       │
    PostgreSQL (Amazon RDS)

Infrastructure components:

  Component              Purpose
  ---------------------- -------------------------
  Cloudflare DNS         Domain management
  Amazon Amplify         React front end hosting
  Amazon Load Balancer   HTTPS termination
  Elastic Beanstalk      Container hosting
  Docker                 Application runtime
  PostgreSQL (RDS)       Persistent database

## 7. UI Deployment

    GitHub push
       │
    Amplify build
       │
    Static site deployed to CDN

## 8. Testing

    npm run test

Tests use:

    cybersim_test

Database is reset and reseeded during test runs.

## 11. Working Diagram

    Scenario Authoring
          │
       Airtable
          │
    Admin scenario import
          │
    CyberSim Backend
    (Node / Express / Knex)
          │
    PostgreSQL
          │
    Simulation State

    Participants / Facilitators
          │
    CyberSim UI (React)
          │
    AWS Amplify
          │
    Backend REST API
