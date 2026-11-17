#!/bin/sh
# Forced command for the GitHub Actions deploy key on sb.
# Installed as /home/lukasz/opt/web/limecontrol/receive.sh and referenced from
# ~/.ssh/authorized_keys:
#   restrict,command="/home/lukasz/opt/web/limecontrol/receive.sh" ssh-ed25519 AAAA... github-limecontrol-deploy
#
# Usage (from CI):  tar czf - compose.yaml images.tar | ssh sb "deploy <git-sha>"
#   images.tar = docker save limecontrol-app:<sha> limecontrol-site:<sha>
set -eu

DEPLOY_PATH=/home/lukasz/opt/web/limecontrol
SITE_URL=https://limecontrol.eu
APP_URL=https://app.limecontrol.eu
KEEP_IMAGES=3

log() { printf '[deploy] %s\n' "$*"; }
fail() { printf '[deploy] ERROR: %s\n' "$*" >&2; exit 1; }

case "${SSH_ORIGINAL_COMMAND:-}" in
  "deploy "*) TAG=${SSH_ORIGINAL_COMMAND#deploy } ;;
  *) fail 'Only "deploy <git-sha>" is permitted.' ;;
esac
case "$TAG" in
  *[!0-9a-f]*|'') fail 'Tag must be a lowercase hex git SHA.' ;;
esac
[ "${#TAG}" -ge 7 ] && [ "${#TAG}" -le 40 ] || fail 'Tag length must be 7-40.'

cd "$DEPLOY_PATH"
exec 9>"$DEPLOY_PATH/.deploy.lock"
flock -w 600 9 || fail 'Another deployment is in progress.'

INCOMING="$DEPLOY_PATH/incoming"
rm -rf "$INCOMING"
mkdir -p "$INCOMING"
trap 'rm -rf "$INCOMING"' EXIT

log "Receiving bundle for $TAG"
tar xzf - -C "$INCOMING" compose.yaml images.tar
[ -s "$INCOMING/images.tar" ] || fail 'images.tar missing from bundle.'

docker load -i "$INCOMING/images.tar"
APP_IMAGE="limecontrol-app:$TAG"
SITE_IMAGE="limecontrol-site:$TAG"
docker image inspect "$APP_IMAGE" >/dev/null || fail "$APP_IMAGE not in bundle."
docker image inspect "$SITE_IMAGE" >/dev/null || fail "$SITE_IMAGE not in bundle."

[ -f .env ] && cp .env .env.previous
[ -f compose.yaml ] && cp compose.yaml compose.yaml.previous
cp "$INCOMING/compose.yaml" compose.yaml
printf 'APP_IMAGE=%s\nSITE_IMAGE=%s\n' "$APP_IMAGE" "$SITE_IMAGE" > .env

compose() { docker compose -f compose.yaml --env-file .env "$@"; }

wait_healthy() {
  i=0
  while [ $i -lt 40 ]; do
    ok=1
    for svc in app site; do
      cid=$(compose ps -q "$svc" 2>/dev/null || true)
      st=$( [ -n "$cid" ] && docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid" 2>/dev/null || echo missing)
      case "$st" in
        healthy) ;;
        unhealthy|exited|dead) log "$svc is $st"; return 1 ;;
        *) ok=0 ;;
      esac
    done
    [ $ok -eq 1 ] && return 0
    sleep 3; i=$((i + 1))
  done
  log 'Timed out waiting for healthchecks.'
  return 1
}

smoke() {
  curl -fsS --retry 5 --retry-delay 3 --retry-all-errors --max-time 15 -o /dev/null "$APP_URL/api/health" &&
  curl -fsS --retry 5 --retry-delay 3 --retry-all-errors --max-time 15 "$SITE_URL/" | grep -q 'LimeControl'
}

rollback() {
  log 'Deployment failed, rolling back.'
  compose logs --no-color --tail=60 || true
  if [ -f .env.previous ] && [ -f compose.yaml.previous ]; then
    cp compose.yaml.previous compose.yaml
    cp .env.previous .env
    compose up -d --remove-orphans || true
    log "Restored: $(tr '\n' ' ' < .env)"
  else
    log 'No previous release to restore.'
  fi
  exit 1
}

log "Starting $APP_IMAGE and $SITE_IMAGE"
compose up -d --remove-orphans || rollback
wait_healthy || rollback

# Touch $DEPLOY_PATH/.skip-public-smoke while DNS/TLS is not ready yet.
if [ ! -f "$DEPLOY_PATH/.skip-public-smoke" ]; then
  smoke || { log 'Public HTTPS smoke test failed.'; rollback; }
  log 'Public smoke tests passed.'
fi

# Keep only the newest $KEEP_IMAGES tags per image (disk on sb is tight).
for repo in limecontrol-app limecontrol-site; do
  docker image ls "$repo" --format '{{.CreatedAt}}\t{{.Repository}}:{{.Tag}}' \
    | sort -r | tail -n +$((KEEP_IMAGES + 1)) | cut -f2 \
    | xargs -r docker image rm >/dev/null 2>&1 || true
done

log "Deployed $TAG"
