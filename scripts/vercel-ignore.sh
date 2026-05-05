#!/usr/bin/env bash
# Vercel Ignored Build Step.
# Exit 0 = ignore/skip deployment. Exit 1 = continue deployment.
set -euo pipefail

subject="$(git log -1 --pretty=%s 2>/dev/null || true)"
author="$(git log -1 --pretty=%an 2>/dev/null || true)"

# Explicit skip marker. This is enforced here because not every Vercel setup
# honors [skip ci] before creating a preview deployment.
if printf '%s' "$subject" | grep -qiE '\[(skip ci|ci skip|skip vercel)\]'; then
  echo "Skipping Vercel deployment because commit subject requests it: $subject"
  exit 0
fi

# The Codex/Dobby sprint branch can receive many small coordination and QA
# commits. Preview deployments from that branch were producing noisy Vercel
# failure emails for Leo, so keep it quiet by default. If we deliberately need
# a Vercel preview for a specific commit, include [deploy preview] or
# [vercel deploy] in the commit subject.
branch="${VERCEL_GIT_COMMIT_REF:-}"
if [ "$branch" = "codex/openclaw-playground" ] && ! printf '%s' "$subject" | grep -qiE '\[(deploy preview|vercel deploy)\]'; then
  echo "Skipping Vercel deployment for noisy Codex/Dobby sprint branch $branch. Add [deploy preview] to deploy intentionally."
  exit 0
fi

# Dobby review commits only update generated coordination docs/context. They are
# needed by Codex, but they should not create preview deployments or email noise.
files="$(git diff --name-only HEAD^ HEAD 2>/dev/null || git show --pretty= --name-only HEAD)"
if [ -n "$files" ] && printf '%s' "$author" | grep -qi 'OpenClaw Dobby'; then
  while IFS= read -r path; do
    [ -z "$path" ] && continue
    case "$path" in
      context.md|docs/DOBBY_QA.md|docs/WORK_QUEUE.md) ;;
      *) echo "Running Vercel deployment because Dobby commit touched app/config path: $path"; exit 1 ;;
    esac
  done <<< "$files"

  echo "Skipping Vercel deployment for Dobby docs/context-only feedback commit."
  exit 0
fi

echo "Running Vercel deployment."
exit 1
