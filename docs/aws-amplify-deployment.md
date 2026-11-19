# AWS Amplify Deployment (React UI)

This document describes how to deploy the CyberSim UI using **AWS
Amplify Hosting**.

Amplify provides a simplified workflow for hosting static web
applications directly from a Git repository.

## Overview

### Isolated Lightsail trial

The running trial uses a separate **manual-release** Amplify app,
`cybersim-lightsail-test`, branch `lightsail`. Current app ID is
`d2cjzpyvq3fv5r`; use fresh Terraform deployment output after recreating the app.
Frontend: **`https://lightsail.cybersim.app`**; default URL:
`https://lightsail.d2cjzpyvq3fv5r.amplifyapp.com`. API:
`https://api-lightsail.cybersim.app`. Production hosting is separate.

The owner deployed UI revision `35c7ab73214432fe89a9cf14a11cd3d2d062657e`, built
for that API and synthetic scenario `lightsail`. On 2026-11-19 the owner reported
the UI/custom hostname working; independent page/bundle/HTTPS checks passed.
Full game/reconnect/load/recovery acceptance is still pending. Backend and SSM
setup belong to the [Backend runbook](../../CyberSim-Backend/docs/aws-lightsail-deployment.md#fresh-install-sequence).

Before formal hosting acceptance, integrate the current remote `origin/main`
fixes into this trial branch. Read-only fetch/comparison on 2026-11-19 found eight
mainline commits not in the trial branch: projector clock/win/end-screen and
form-error fixes, plus companion documentation. Local `main` was stale; compare
with `origin/main`. The deployed `35c7ab7` artifact predates those fixes.

Commit the reviewed local branch work, merge/rebase current `origin/main`, resolve
the overlapping docs while preserving completed backlog items, then run affected
UI tests/lint/build. Have the owner upload a newly pinned artifact before judging
those behaviors during trial acceptance. No merge/build/upload is performed by
this documentation change. Local commit and branch publication are distinct;
branch pushes require the owner's instruction.

For a new release, build from a clean reviewed commit using existing UI
dependencies. Set the private-root and reviewed **full** UI commit in the Mac
shell; the build helper builds HEAD, not the commit named in its output path.
Use a new directory and check the resulting manifest. To deploy a retained,
verified artifact, from this repository:

```bash
export CYBERSIM_PRIVATE_ROOT="$HOME/.local/share/cybersim/lightsail/test"
export UI_COMMIT=35c7ab73214432fe89a9cf14a11cd3d2d062657e
python3 -B scripts/lightsail-frontend.py deploy --config "$CYBERSIM_PRIVATE_ROOT/access/deployment.json" --artifact "$CYBERSIM_PRIVATE_ROOT/releases/frontend/$UI_COMMIT"
```

The command is a dry run. The owner appends `--execute` for the approved upload.
It validates AWS account, standalone manual app, branch/API/scenario and ZIP
checksum. Signed upload URLs stay withheld. Success means **deployment started**;
verify the Amplify job and browser result before claiming completion. No Git
push or repository connection is required, and there is no automatic app build.
Only public frontend configuration belongs in the artifact.

### Trial custom domain

A CNAME alone does not register a hostname with Amplify or issue its certificate.
For a fresh trial app, the owner:

1. Opens that app's **Hosting → Custom domains → Add domain**; enters
   `cybersim.app` and chooses manual DNS configuration.
2. Maps **only `lightsail`** to branch **`lightsail`**, removing proposed apex/
   `www` mappings from this new association. Leave existing production app and
   DNS mappings unchanged. Use Amplify's managed certificate.
3. Copies the exact generated routing CNAME and certificate-validation CNAME
   into Cloudflare, both **DNS only** (gray cloud). Use the generated target,
   typically CloudFront; never the Lightsail IP or a guessed Amplify alias.
4. Preserves the certificate-validation CNAME in DNS-only mode for renewal.
   DNS-only is sufficient for the frontend; Amplify already supplies CDN/HTTPS.
5. Verifies public DNS, valid HTTPS and the actual page. The console's background
   domain check can lag a serving site. If pending persists, inspect the exact
   expected records/status rather than repeatedly editing correct DNS. Keep the
   default Amplify URL available during setup.

The current association was owner-created and is **not managed by the Terraform
root**. A replacement Amplify app needs a reviewed domain reassociation and new
DNS validation; stale app IDs/targets are not reusable setup constants.
[AWS Cloudflare instructions](https://docs.aws.amazon.com/amplify/latest/userguide/to-add-a-custom-domain-managed-by-cloudflare.html).

Both current frontend hostnames begin with `lightsail`, selecting that scenario
through `src/util/scenario.js`. For another scenario slug, map its hostname to
the **same trial app/branch**, configure its exact allowed origin in Backend and
load its content into the isolated test DB. No new frontend build is needed
solely for the hostname, since this bundle's API stays the trial API. Do not
reuse an existing production scenario hostname. The current guarded Backend
loader supports only the synthetic fixture; a broader import workflow remains
follow-up work. `REACT_APP_SCENARIO_SLUG` does not override a subdomain.

The remaining sections describe the general **Git-connected** Amplify workflow,
not the manual-release trial procedure above.

Deployment flow:

1.  Push code to GitHub
2.  Amplify automatically builds the application
3.  Amplify hosts the static site globally via CDN

Benefits:

-   Simpler than CodePipeline
-   Automatic builds on commit
-   Built‑in CDN
-   Managed SSL certificates

## Prerequisites

-   GitHub repository containing the CyberSim UI
-   AWS account
-   Backend API deployed and reachable

## Required Environment Variable

The UI must know where the backend API lives.

    REACT_APP_API_URL

Example:

    REACT_APP_API_URL=https://api.example.org


If deploying the UI before the backend exists, use a placeholder:

    REACT_APP_API_URL=https://example.invalid

Note that REACT_APP_API_URL, like all Amplify environmental variables,
is injected at build time.

Changing it in Amplify requires a redeploy (new build).

## Create Amplify App

1.  Open AWS Console
2.  Navigate to **AWS Amplify**
3.  Click **Create App**
4.  Choose:

```{=html}
<!-- -->
```
    Host web app

5.  Select **GitHub** as the source provider.
6.  Authorize AWS to access your repository.
7.  Select repository:

```{=html}
<!-- -->
```
    CyberSim-UI

8.  Select branch:

```{=html}
<!-- -->
```
    main

## Build Settings

Amplify should automatically detect a React application.

Typical build settings:

    npm ci
    npm run build

Build output directory:

    build

## Environment Variables

Add the backend URL:

    REACT_APP_API_URL=<backend_api_url>

Example:

    REACT_APP_API_URL=https://cybersim-api.example.org


## SPA Routing Rewrite Rule

Because CyberSim uses React Router, Amplify must rewrite client-side routes
to index.html without interfering with static assets.

In **Amplify → App Settings → Rewrites and Redirects**, use this rule:

```
[
  {
    "source": "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|ttf|map|json)$)([^.]+$)/>",
    "target": "/index.html",
    "status": "200"
  }
]
```

## Deploy

After configuration:

1.  Click **Save and Deploy**
2.  Amplify will run the build
3.  The site will be deployed automatically

A public URL will be generated.

Example:

    https://main.<random>.amplifyapp.com

## Custom Domain (Optional)

Amplify supports custom domains.

Steps:

1.  Open Amplify app
2.  Go to **Domain Management**
3.  Add domain
4.  Configure DNS records

Amplify will automatically provision SSL certificates.

## Updating the Application

Future deployments are automatic.

Workflow:

1.  Commit code
2.  Push to `main`
3.  Amplify rebuilds and redeploys

No manual infrastructure steps are required.
