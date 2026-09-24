# Full-Text Search

This project has adopted **OpenSearch** as its distributed search engine and analytics suite for all **full-text search** operations and associated data analysis.

## Local development (Docker)

`docker-compose.dev.yml` starts a single node without the security plugin
(plain http, no password), enough to try indexing and search on your machine.

```bash
docker compose -f opensearch/docker-compose.dev.yml up -d
```

Set the OpenSearch variables in `.env.staging` (username and password are
required by the code but ignored by an unsecured node):

```
OPENSEARCH_HOST="http://localhost:9200"
OPENSEARCH_USERNAME="admin"
OPENSEARCH_PASSWORD="admin"
OPENSEARCH_INDEX_NAME="innovazione_dev_"
```

Then build (the indexing JSON files are produced at build time), index, and
run the dev server:

```bash
bun run build:staging      # writes dist/client/indexing/<lang>.json
bun run index:staging      # (re)creates innovazione_dev_it / innovazione_dev_en
bun run staging            # /it/ricerca calls /api/search.json
```

Useful checks:

```bash
curl -s "http://localhost:9200/_cat/indices?v"
curl -s "http://localhost:9200/innovazione_dev_it/_count"
curl -s "http://localhost:4321/api/search.json?query=cloud&lang=it"
```

OpenSearch Dashboards (http://localhost:5601) is optional:

```bash
docker compose -f opensearch/docker-compose.dev.yml --profile dashboards up -d
```

Stop with `down`; add `-v` to drop the indexed data as well.

## Installation and Configuration (full setup)

`docker-compose.yml` is the official two-node cluster with the security
plugin enabled (https, admin password from `OPENSEARCH_INITIAL_ADMIN_PASSWORD`,
see `.env.example`). To install and configure an OpenSearch instance, please
refer to the official documentation
[OpenSearch with Docker compose](https://opensearch.org/downloads/).
