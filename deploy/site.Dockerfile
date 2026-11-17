# Static landing site (limecontrol.eu). Build context: repository root.
FROM nginxinc/nginx-unprivileged:1.28-alpine
COPY deploy/nginx-site.conf /etc/nginx/conf.d/default.conf
COPY site/ /usr/share/nginx/html/
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
