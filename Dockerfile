FROM node:24-alpine

# https://github.com/Yelp/dumb-init
# ADD --chmod=755 https://github.com/Yelp/dumb-init/releases/download/v1.2.5/dumb-init_1.2.5_x86_64 /usr/bin/dumb-init
RUN apk add --no-cache dumb-init

USER node
WORKDIR /app

# node -e "require('https').get('https://example.com', v => console.log('OK', v.statusCode)).on('error', e => console.error(e))"
ENV LISTEN=0.0.0.0 \
    PORT=3000 \
    NAVPLACE_LOGGER=stdout \
    NODE_ENV=production \
    NODE_OPTIONS=--use-openssl-ca

# Leverage Docker's cache system.
# package.json will be changed less often than other files, so copy it first
# and install all dependencies.
COPY --chown=node:node package*.json .
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .

ARG NAVPLACE_CREATED
ARG NAVPLACE_REVISION
ARG NAVPLACE_SOURCE="https://github.com/vbarbarosh/navplace"
ARG AUTHWALL_VERSION

LABEL org.opencontainers.image.title="vbarbarosh/NAVPLACE" \
      org.opencontainers.image.description="Minimal login gateway for protecting internal apps" \
      org.opencontainers.image.created="${NAVPLACE_CREATED}" \
      org.opencontainers.image.revision="${NAVPLACE_REVISION}" \
      org.opencontainers.image.source="${NAVPLACE_SOURCE}" \
      org.opencontainers.image.version="${NAVPLACE_VERSION}" \
      org.opencontainers.image.licenses="MIT"

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/http/index.js"]
