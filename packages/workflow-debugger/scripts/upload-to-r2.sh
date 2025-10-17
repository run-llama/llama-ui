#!/usr/bin/env bash
set -euo pipefail

# Required env vars:
# - R2_ACCOUNT_ID
# - R2_ACCESS_KEY_ID
# - R2_SECRET_ACCESS_KEY
# - R2_BUCKET
# - R2_PUBLIC_URL (e.g. https://pub-xxxxxxxxxxxxxxxxxxxx.r2.dev)

SOURCE_DIR=packages/workflow-debugger/dist
R2_PREFIX=workflow-debugger/
R2_PUBLIC_URL=${R2_PUBLIC_URL:-}

if [[ -z "${R2_ACCOUNT_ID:-}" || -z "${R2_ACCESS_KEY_ID:-}" || -z "${R2_SECRET_ACCESS_KEY:-}" || -z "${R2_BUCKET:-}" || -z "${R2_PUBLIC_URL:-}" ]]; then
  echo "Missing required env vars. Need R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL" >&2
  exit 1
fi

ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

echo "Uploading assets from ${SOURCE_DIR} to R2 bucket ${R2_BUCKET} (prefix: ${R2_PREFIX})"

export AWS_ACCESS_KEY_ID="${R2_ACCESS_KEY_ID}"
export AWS_SECRET_ACCESS_KEY="${R2_SECRET_ACCESS_KEY}"
export AWS_EC2_METADATA_DISABLED=true

shopt -s nullglob

upload_file() {
  local file="$1"
  local dest="s3://${R2_BUCKET}/${R2_PREFIX}$(basename "$file")"
  echo "Uploading ${file} -> ${dest}"
  aws s3 cp "$file" "$dest" \
    --endpoint-url "$ENDPOINT" \
    --cache-control "no-store, no-cache, must-revalidate, max-age=0"
}

for f in "${SOURCE_DIR}"/*.js; do
  upload_file "$f"
done

for f in "${SOURCE_DIR}"/*.css; do
  upload_file "$f"
done

echo "Upload complete."

# Determine exact JS and CSS artifact URLs
JS_FILE=$(ls -1 "${SOURCE_DIR}"/*.js | head -n1)
CSS_FILE=$(ls -1 "${SOURCE_DIR}"/*.css | head -n1)

if [[ -z "${JS_FILE:-}" || -z "${CSS_FILE:-}" ]]; then
  echo "Error: Could not find JS or CSS in ${SOURCE_DIR}" >&2
  exit 1
fi

JS_NAME=$(basename "$JS_FILE")
CSS_NAME=$(basename "$CSS_FILE")

JS_URL="${R2_PUBLIC_URL%/}/${R2_PREFIX}${JS_NAME}"
CSS_URL="${R2_PUBLIC_URL%/}/${R2_PREFIX}${CSS_NAME}"

# Human-readable output
echo "JS_URL=${JS_URL}"
echo "CSS_URL=${CSS_URL}"

# Step outputs for GitHub Actions
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  {
    echo "js_url=${JS_URL}"
    echo "css_url=${CSS_URL}"
  } >> "$GITHUB_OUTPUT"
fi


