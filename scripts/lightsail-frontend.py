#!/usr/bin/env python3
"""Build a pinned trial frontend locally, or explicitly upload it after approval."""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parents[1]
API = "https://api-lightsail.cybersim.app"


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def build(output):
    if subprocess.check_output(["git", "status", "--porcelain"], cwd=ROOT).strip():
        raise SystemExit("Commit/review frontend changes before preparing a release artifact.")
    commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=ROOT, text=True).strip()
    output.mkdir(mode=0o700, exist_ok=False)
    with tempfile.TemporaryDirectory(prefix="cybersim-lightsail-ui-") as tmp:
        context = Path(tmp)
        archive = subprocess.check_output(["git", "archive", "HEAD"], cwd=ROOT)
        with tarfile.open(fileobj=io.BytesIO(archive)) as source:
            members = [m for m in source.getmembers() if not Path(m.name).name.startswith('.env')]
            source.extractall(context, members=members, filter="data")
        (context / "node_modules").symlink_to(ROOT / "node_modules", target_is_directory=True)
        env = {key: value for key, value in os.environ.items() if not key.startswith("REACT_APP_")}
        env.update(REACT_APP_API_URL=API, REACT_APP_SCENARIO_SLUG="lightsail", GENERATE_SOURCEMAP="false")
        subprocess.run(["node", str(ROOT / "node_modules/react-scripts/scripts/build.js")], cwd=context, env=env, check=True)
        with zipfile.ZipFile(output / "frontend.zip", "w", zipfile.ZIP_DEFLATED) as target:
            for path in sorted((context / "build").rglob("*")):
                if path.is_file():
                    target.write(path, path.relative_to(context / "build"))
    manifest = {"commit": commit, "api_url": API, "scenario_slug": "lightsail",
                "archive_sha256": sha256(output / "frontend.zip")}
    (output / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Trial frontend artifact prepared from {commit}; no upload performed.")


def deploy(config_file, artifact, execute):
    config = json.loads(config_file.read_text())
    manifest = json.loads((artifact / "manifest.json").read_text())
    if (config.get("environment") != "test" or config.get("account_id") != "592016371171"
            or config.get("amplify_branch") != "lightsail"
            or config.get("api_hostname") != "api-lightsail.cybersim.app"
            or manifest.get("api_url") != API
            or manifest.get("scenario_slug") != "lightsail"
            or sha256(artifact / "frontend.zip") != manifest.get("archive_sha256")):
        raise SystemExit("Trial frontend identity or artifact verification failed.")
    print(f"Trial frontend upload: app={config['amplify_app_id']}, branch=lightsail, commit={manifest['commit']}; execute={execute}")
    if not execute:
        print("No AWS calls or upload made. Execute only after the reviewed live-trial approval.")
        return

    def aws(service, operation, *args):
        result = subprocess.run(["aws", service, operation, "--region", "us-east-1", "--output", "json", "--no-cli-pager", *args], capture_output=True, text=True)
        if result.returncode:
            raise SystemExit(f"AWS {service} {operation} failed; raw output withheld.")
        return json.loads(result.stdout)

    if aws("sts", "get-caller-identity")["Account"] != "592016371171":
        raise SystemExit("Wrong AWS account.")
    app_id = config["amplify_app_id"]
    app = aws("amplify", "get-app", "--app-id", app_id)["app"]
    if app["name"] != "cybersim-lightsail-test" or app.get("repository"):
        raise SystemExit("Target is not the standalone manual-release trial app.")
    job = aws("amplify", "create-deployment", "--app-id", app_id, "--branch-name", "lightsail")
    # Presigned upload URLs are temporary credentials. Never print or preserve them.
    request = urllib.request.Request(job["zipUploadUrl"], data=(artifact / "frontend.zip").read_bytes(), method="PUT", headers={"Content-Type": "application/zip"})
    try:
        with urllib.request.urlopen(request, timeout=120):
            pass
    except Exception:
        raise SystemExit("Trial frontend upload failed; signed URL withheld.") from None
    result = aws("amplify", "start-deployment", "--app-id", app_id, "--branch-name", "lightsail", "--job-id", job["jobId"])
    print(f"Reviewed trial deployment started: job {result['jobSummary']['jobId']}. Verify job status and acceptance separately.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="action", required=True)
    build_parser = commands.add_parser("build")
    build_parser.add_argument("--output", type=Path, required=True)
    deploy_parser = commands.add_parser("deploy")
    deploy_parser.add_argument("--config", type=Path, required=True)
    deploy_parser.add_argument("--artifact", type=Path, required=True)
    deploy_parser.add_argument("--execute", action="store_true")
    args = parser.parse_args()
    if args.action == "build":
        build(args.output.resolve())
    else:
        deploy(args.config, args.artifact, args.execute)


if __name__ == "__main__":
    main()
