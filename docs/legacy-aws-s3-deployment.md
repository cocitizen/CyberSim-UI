# AWS S3 Deployment (Legacy)

This document describes the legacy deployment approach for the CyberSim
UI using: - Amazon S3 static hosting - AWS CodePipeline - AWS CodeBuild

This approach is retained for reference. New deployments should use
**AWS Amplify Hosting**.

## Overview

Deployment flow:

1.  Code pushed to GitHub
2.  CodePipeline triggers a build
3.  CodeBuild runs the React build
4.  Output static files deployed to S3

## Required Environment Variable

The UI must know the backend API location.

    REACT_APP_API_URL

Example:

    REACT_APP_API_URL=https://api.example.org

## S3 Static Website Hosting

Create an S3 bucket for the UI.

Recommended settings:

-   Disable ACLs
-   Disable "Block all public access"
-   Versioning optional
-   Encryption: SSE-S3

After creation:

1.  Go to **Properties**
2.  Enable **Static website hosting**
3.  Set index document:

```{=html}
<!-- -->
```
    index.html

### Bucket Policy

    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": "*",
          "Action": "s3:GetObject",
          "Resource": "arn:aws:s3:::<BUCKET_NAME>/*"
        }
      ]
    }

## CodePipeline

Pipeline stages:

1.  **Source**
2.  **Build**
3.  **Deploy**

### Source

Provider: GitHub (v2)

Repository:

    <ORG>/CyberSim-UI

Branch:

    main

Enable automatic trigger on push.

### Build

Provider: AWS CodeBuild

Environment variable:

    REACT_APP_API_URL

Build type:

    Single build

### Deploy

Provider:

    Amazon S3

Enable:

    Extract file before deploy

No deployment path required.

## CodeBuild

CodeBuild compiles the React app into static assets.

Recommended environment:

-   Image: `aws/codebuild/amazonlinux2-x86_64-standard:5.0`
-   Environment type: Linux EC2
-   Privileged mode: Disabled

Build instructions come from:

    buildspec.yml

Steps executed:

1.  Install Node
2.  Install dependencies
3.  Run React build
4.  Output files placed in:

```{=html}
<!-- -->
```
    build/

CodePipeline then uploads these files to the S3 bucket.
