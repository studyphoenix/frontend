#!/bin/bash

npx swagger-typescript-api@13.13.0 generate --path https://raw.githubusercontent.com/studyphoenix/backend/refs/heads/main/docs/swagger.json -o ./src/ts/types -n api.d.ts --no-client
sed --in-place '1d;2d;3d' ./src/ts/types/api.d.ts
npm run lint-fix
