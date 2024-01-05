# Python

## Directories

The initial directory structure will be identical to Opendoor's approach: https://medium.com/opendoor-labs/our-python-monorepo-d34028f2b6fa

- [`projects`](projects/)
  - Each project contains code for a service, and has it own deps
  - projects DO NOT import from each other, any shared code lives in lib
- [`lib`](lib/)
  - a custom package you can install via poetry/pip
- [`tools`](tools/)
  - independent tooling written in python + linters etc

## Style guide

// TODO: Decide on DH canonical style recommendations

- Google style guide - https://google.github.io/styleguide/pyguide.html
- Pep style guide: https://peps.python.org/pep-0008/

Document code with NumPy Style Docstrings: https://sphinxcontrib-napoleon.readthedocs.io/en/latest/example_numpy.html

## Tests

- tests are added to each package/lib independently
- Will configure all python tests to run when any python lib/package gets changed. Eventually we may use bazel to run dependent tests only
- To run all test within the py directory you can run `make test-python`. This command will run the `gen-proto-python` command to download the needed dependencies. All results will be stored in `services/generated/test` (this folder will be automatically generated if it does not exist)

## Poetry

# Note:

when the version of python is updated, you'll need to run:

```shell
poetry env remove python${python_major"."minor_vers}
poetry env use python${python_major"."minor_vers}
poetry install
```

IE if you bump asdf python from 3.10.6 to 3.10.9, you'd run:

```shell
poetry env remove python3.10
poetry env use python3.10
poetry install
```
