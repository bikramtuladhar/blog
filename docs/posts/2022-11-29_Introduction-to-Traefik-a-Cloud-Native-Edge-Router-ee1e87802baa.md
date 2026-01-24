---
layout: BookLayout
title: "Introduction to Traefik a Cloud Native Edge Router"
date: 2022-11-29T00:00:00.000Z
---

# Introduction to Traefik a Cloud Native Edge Router

Traefik is a modern HTTP reverse proxy and load balancer that makes deploying micro-services easy. Traefik integrates with your existing infrastructure components ([Docker](https://www.docker.com/), [Swarm mode](https://docs.docker.com/engine/swarm/), [Kubernetes](https://kubernetes.io), [Marathon](https://mesosphere.github.io/marathon/), [Consul](https://www.consul.io/), [Etcd](https://coreos.com/etcd/), [Rancher](https://rancher.com), [Amazon ECS](https://aws.amazon.com/ecs), ...) and configures itself automatically and dynamically. Last week Bikram Tuladhar shared his experience with Traefik and its configuration with us.

Traefik can be installed with docker or binaries for macOs, Linux or windows OS.

## Run with Docker

Download sample Traefik conf toml file:

```bash
wget https://raw.githubusercontent.com/containous/traefik/master/traefik.sample.toml -O traefik.toml
```

```bash
docker run -d -p 8080:8080 -p 80:80 -v $PWD/traefik.toml:/etc/traefik/traefik.toml traefik
```

## Run Traefik with docker compose

```yaml
version: '3'

services:
  # The reverse proxy service (Traefik)
  reverse-proxy:
    image: traefik  # The official Traefik docker image
    restart: always
    command: --api --docker  # Enables the web UI and tells Traefik to listen to docker
    ports:
      - "443:443"
    expose:
      - 8080  # The Web UI (enabled by --api)
    networks:
      - web
    environment:
      DO_AUTH_TOKEN: $$token$$
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # So that Traefik can listen to the Docker events
      - $HOME/traefik/traefik.toml:/etc/traefik/traefik.toml
      - $HOME/traefik/acme.json:/etc/traefik/acme.json
    labels:
      traefik.enable: true
      traefik.frontend.rule: "Host:traefik.example.com"
      # get md5 from htpasswd or http://www.htaccesstools.com/htpasswd-generator/
      # and then double all $ to $$ to avoid docker-compose
      traefik.frontend.auth.basic: "admin:$$apr1$$AbYGkYc0$$NuXfCsy4.s8KSlV9JKZEo0"
      traefik.port: 8080
  # A container that exposes a simple API
  whoami:
    image: emilevauge/whoami  # A container that exposes an API to show its IP address
    labels:
      - "traefik.frontend.rule=Host:whoami.docker.localhost"
networks:
  web:
    external: true
```

## Assign domain using Docker labels

```yaml
version: '3'

services:
  web:
    image: nginx:latest
    restart: always
    expose:
      - 80
    networks:
      - web
    labels:
      traefik.enable: true
      traefik.frontend.rule: "Host:example.com.np"
      traefik.port: 80
networks:
  web:
    external: true
```

## Running Traefik as reverse proxy using its File service

```toml
# Enable debug mode
debug = true

# Log level
logLevel = "DEBUG"

# Entrypoints to be used by frontends that do not specify any entrypoint.
defaultEntryPoints = ["https"]

# Entrypoints definition
[entryPoints]
  [entryPoints.http]
    address = ":80"
  [entryPoints.https]
    address = ":443"
    [entryPoints.https.tls]

# Enable API and dashboard
[api]

# Enable ping
[ping]

# Enable Docker configuration backend
[docker]
# domain = "docker.localhost"
exposedByDefault = false

[acme]
email = "user@example.com"
storage = "/etc/traefik/acme.json"
caServer = "https://acme-v02.api.letsencrypt.org/directory"
onHostRule = true
entryPoint = "https"
  [acme.dnsChallenge]
    provider = "digitalocean" # DNS Provider name (cloudflare, OVH, gandi...)
    delayBeforeCheck = 0

[[acme.domains]]
  main = "example.com"
[[acme.domains]]
  main = "traefik.example.com"
[[acme.domains]]
  main = "sub-domain.example.com"

[file]
watch = true

[backends]
  [backends.backend1]
    [backends.backend1.servers]
      [backends.backend1.servers.server0]
        url = "http://127.0.0.1:8088"
        weight = 10

[frontends]
  [frontends.frontend1]
    entryPoints = ["http", "https"]
    backend = "backend1"
    passHostHeader = true
    [frontends.frontend1.routes]
      [frontends.frontend1.routes.route0]
        rule = "Host: sub-domain.example.com"
```

Above the Traefik conf will set reverse proxy for port 8088.

You can find details documentation in their [site](https://docs.traefik.io/).
