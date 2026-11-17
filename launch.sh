#!/bin/bash

set -e

if [[ $(systemctl is-active docker) != "active" ]]; then
    echo "
 -> Docker daemon not running, starting with systemctl <-
    "
    sudo systemctl start docker
fi

echo "
Please note, startup may take a while
"

docker compose pull
docker compose down && docker compose up -d
