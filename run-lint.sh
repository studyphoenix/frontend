#!/bin/bash

if [[ $1 == "local" ]]; then
    npm run lint-fix
    npm run type-check
else
    docker run -v .:/mnt -e VITE_BACKENDLESS=true --name linter ghcr.io/janishutz/vue-dev-runner
    docker exec linter bash -c "npm run lint-fix && npm run type-check"
    docker stop linter
    docker rm linter
fi
