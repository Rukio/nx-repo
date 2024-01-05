# Generating types

The API definition is converted to Typescript files and types using a single Nx command implemented in this library, the only requirement, aside from having the npm dependencies installed, is to have the proto generators installed, which if you don't have them already, the current Nx configuration will do it for you:

```sh
# This command will execute
# "npx nx run caremanager-data-access-types:setup-common-gen" every time before runing the types generator to make sure
# the most recent versions get installed.
npx nx run caremanager-data-access-types:generate-types
```

## The Typescript generator scripts

The `generate-types.sh` script reads the `.proto` files from the `proto` folder, converts them to a `openapi` spec file, and from that spec file, it generates the TS files and types using the `openapi-generator-cli` cli, which the CareManager app uses for calling the API inside the UI components.
