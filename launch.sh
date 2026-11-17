#!/bin/sh

set -e

if [[ $(systemctl is-active docker) != "active" ]]; then
    echo "
 -> Docker daemon not running, starting with systemctl <-
    "
    sudo systemctl start docker
fi

docker compose pull
docker compose down && docker compose up -d
