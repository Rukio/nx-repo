# protos

This library is used to generate Typescript files from protos that can then be used in projects that reference its type definitions. The project uses a YAML file, [buf.gen.ts.yaml](../../../../buf.gen.ts.yaml) that defines the settings and output of the generation.

## Generating

Run `npx nx run protos:generate` to generate the ts files in library.
