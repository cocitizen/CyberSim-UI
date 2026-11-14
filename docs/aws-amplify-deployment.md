# AWS Amplify Deployment (React UI)

This document describes how to deploy the CyberSim UI using **AWS
Amplify Hosting**.

Amplify provides a simplified workflow for hosting static web
applications directly from a Git repository.

## Overview

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
    "source": "</^[^.]+$|\\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>",
    "target": "/index.html",
    "status": "200"
  }
]
```

Every static asset extension the build emits must be listed. Otherwise the
file is served as `index.html` (HTTP 200, `text/html`). A missing `woff2`
once caused exactly this for the brand fonts. To check, request an asset
that does not exist, such as `/static/media/test.woff2`: it should return
404, not an HTML page.

Changing this rule does not clear responses CloudFront has already cached,
which can last up to a year for hashed assets. Redeploy afterwards (push to
`main`, or `aws amplify start-job --job-type RELEASE`) so Amplify
invalidates its cache.

The production sites (`city`, `rodrum`, and `beta.cybersim.app`) are served
by the Amplify app named `CyberSim-UI-v2`. The account also has
similarly named apps (`CyberSim-UI`, `cybersim-lightsail-test`); confirm the
app ID with `aws amplify list-domain-associations` before changing rules.

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
