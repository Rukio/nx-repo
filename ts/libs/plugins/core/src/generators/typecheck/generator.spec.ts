import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';
import { libraryGenerator } from '@nx/js';
import { applicationGenerator } from '@nx/react';
import generator, { buildTypeCheckTask, taskName } from './generator';
import { Linter } from '@nx/linter';
import * as fs from 'fs';

describe('typecheck task generator', () => {
  let tree: Tree;

  beforeEach(() => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' });
  });

  it('should run successfully for libraries', async () => {
    const libName = 'test-lib';
    await libraryGenerator(tree, { name: libName });
    await generator(tree, { name: libName });
    const config = readProjectConfiguration(tree, libName);
    expect(config).toBeDefined();
    expect(config.targets[taskName]).toBeDefined();
    expect(config.targets[taskName]).toStrictEqual(
      buildTypeCheckTask(`libs/${libName}`, 'library')
    );
  });

  it('should run successfully for applications', async () => {
    const appName = 'test-app';
    await applicationGenerator(tree, {
      name: appName,
      style: 'none',
      e2eTestRunner: 'none',
      linter: Linter.EsLint,
    });
    await generator(tree, { name: appName });
    const config = readProjectConfiguration(tree, appName);
    expect(config).toBeDefined();
    expect(config.targets[taskName]).toBeDefined();
    expect(config.targets[taskName]).toStrictEqual(
      buildTypeCheckTask(`apps/${appName}`, 'application')
    );
  });

  it('should run successfully for project without alternate tsconfigs', async () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const appName = 'test-app-minimal-tsconfigs';
    await applicationGenerator(tree, {
      name: appName,
      style: 'none',
      e2eTestRunner: 'none',
      linter: Linter.EsLint,
    });
    await generator(tree, { name: appName });
    const config = readProjectConfiguration(tree, appName);
    expect(config).toBeDefined();
    expect(config.targets[taskName]).toBeDefined();
    expect(config.targets[taskName]).toStrictEqual(
      buildTypeCheckTask(`apps/${appName}`, 'application')
    );
  });

  it('fails without project name', async () => {
    expect(() => generator(tree, {} as never)).rejects.toThrowError(
      /Cannot find configuration for/
    );
  });
});
