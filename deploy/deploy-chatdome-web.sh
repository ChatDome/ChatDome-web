#!/usr/bin/env bash
set -Eeuo pipefail

# Deploy ChatDome-web from a GitHub archive into an Nginx web root.
#
# Default behavior:
#   - Downloads the latest main branch archive.
#   - Extracts it into a temporary directory.
#   - Verifies index.html exists before touching the live site.
#   - Publishes only static assets to SITE_ROOT.
#   - Removes known sensitive leftovers from SITE_ROOT.
#   - Tests and reloads Nginx when available.
#
# Common overrides:
#   SITE_ROOT=/var/www/example.com/html ./deploy-chatdome-web.sh
#   REF_PATH=refs/tags/v0.2.1 ./deploy-chatdome-web.sh
#   RELOAD_NGINX=0 ./deploy-chatdome-web.sh

REPO_OWNER="${REPO_OWNER:-ChatDome}"
REPO_NAME="${REPO_NAME:-ChatDome-web}"
REF_PATH="${REF_PATH:-refs/heads/main}"
SITE_ROOT="${SITE_ROOT:-/var/www/chatdome.com/html}"
RELOAD_NGINX="${RELOAD_NGINX:-1}"

ARCHIVE_URL="${ARCHIVE_URL:-https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/${REF_PATH}.tar.gz}"
TMP_PARENT="${TMP_PARENT:-/tmp}"
WORK_DIR=""

if [[ "${EUID}" -eq 0 ]]; then
    SUDO=()
else
    SUDO=(sudo)
fi

log() {
    printf '[deploy] %s\n' "$*"
}

fail() {
    printf '[deploy] ERROR: %s\n' "$*" >&2
    exit 1
}

require_cmd() {
    command -v "$1" >/dev/null 2>&1 || fail "missing required command: $1"
}

cleanup() {
    if [[ -n "${WORK_DIR}" && -d "${WORK_DIR}" ]]; then
        rm -rf -- "${WORK_DIR}"
    fi
}

assert_site_root_safe() {
    [[ -n "${SITE_ROOT}" ]] || fail "SITE_ROOT is empty"
    [[ "${SITE_ROOT}" == /* ]] || fail "SITE_ROOT must be an absolute path"

    case "${SITE_ROOT}" in
        /|/var|/var/|/var/www|/var/www/|/home|/home/|/tmp|/tmp/)
            fail "SITE_ROOT is too broad: ${SITE_ROOT}"
            ;;
    esac
}

download_archive() {
    local output="$1"

    if command -v wget >/dev/null 2>&1; then
        wget -q --show-progress -O "${output}" "${ARCHIVE_URL}"
        return
    fi

    if command -v curl >/dev/null 2>&1; then
        curl -fL --retry 3 --retry-delay 2 -o "${output}" "${ARCHIVE_URL}"
        return
    fi

    fail "missing downloader: install wget or curl"
}

cleanup_sensitive_leftovers() {
    # This is intentionally limited to direct children of SITE_ROOT.
    "${SUDO[@]}" find "${SITE_ROOT}" -mindepth 1 -maxdepth 1 \
        \( -name '.git' -o -name '.env' -o -name '.env.*' -o -name '.vscode' -o -name '.idea' -o -name '.DS_Store' \) \
        -exec rm -rf -- {} +
}

main() {
    assert_site_root_safe
    if [[ "${EUID}" -ne 0 ]]; then
        require_cmd sudo
    fi
    require_cmd mktemp
    require_cmd tar
    require_cmd rsync
    require_cmd find

    local archive extract_dir
    WORK_DIR="$(mktemp -d "${TMP_PARENT%/}/chatdome-web-deploy.XXXXXX")"
    archive="${WORK_DIR}/source.tar.gz"
    extract_dir="${WORK_DIR}/source"

    trap cleanup EXIT

    log "repo: ${REPO_OWNER}/${REPO_NAME}"
    log "ref: ${REF_PATH}"
    log "site root: ${SITE_ROOT}"

    mkdir -p "${extract_dir}"
    log "downloading ${ARCHIVE_URL}"
    download_archive "${archive}"

    log "extracting archive"
    tar -xzf "${archive}" -C "${extract_dir}" --strip-components=1

    [[ -f "${extract_dir}/index.html" ]] || fail "index.html not found after extraction"
    [[ -f "${extract_dir}/styles.css" ]] || fail "styles.css not found after extraction"

    log "creating site root if needed"
    "${SUDO[@]}" mkdir -p "${SITE_ROOT}"

    log "syncing static files"
    "${SUDO[@]}" rsync -av --delete \
        --exclude='.well-known/' \
        --exclude='.git/' \
        --exclude='.env' \
        --exclude='.env.*' \
        --exclude='.vscode/' \
        --exclude='.idea/' \
        --exclude='.DS_Store' \
        --exclude='ChatDome.png' \
        --exclude='README.md' \
        --exclude='deploy/' \
        --exclude='*.sh' \
        "${extract_dir}/" \
        "${SITE_ROOT}/"

    log "removing sensitive leftovers from site root"
    cleanup_sensitive_leftovers

    if [[ "${RELOAD_NGINX}" == "1" ]] && command -v nginx >/dev/null 2>&1; then
        log "testing nginx config"
        "${SUDO[@]}" nginx -t

        if command -v systemctl >/dev/null 2>&1; then
            log "reloading nginx"
            "${SUDO[@]}" systemctl reload nginx
        else
            log "reloading nginx with nginx -s reload"
            "${SUDO[@]}" nginx -s reload
        fi
    else
        log "nginx reload skipped"
    fi

    log "done"
}

main "$@"
