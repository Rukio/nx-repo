# GRPC Proxy
A thin and very hardcoded GRPC Proxy

Needed until we move off Aptible, as Aptible does not respect Health Checks for TCP, causing downtime when a service is not live or ready yet. This is respected in HTTP, an http server to run adjacent to a grpc server in a single loop will require some refactoring.



NOTE:
requires that an env variable containing the git sha exists, "GIT_SHA".

## To Run:
```shell
cd grpc_proxy
GIT_SHA="$(git rev-parse HEAD)" poetry run python grpc_proxy/server.py
```

Default port: 10000, can be overriden via env var 'GRPC_PROXY_PORT'
