# Proto

## Usage

To add protos to your python lib, add the dep to the project's pyproject.toml:

```
[tool.poetry.dependencies]
proto = {path = "../path/to/lib/proto", develop = true}
```

and run:

```shell
cd py/projects/my-project/
poetry update
```

## Regenerate

```shell
cd services
make gen-proto-python
```
