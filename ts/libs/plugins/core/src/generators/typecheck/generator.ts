import {
  formatFiles,
  ProjectType,
  readProjectConfiguration,
  TargetConfiguration,
  Tree,
  updateProjectConfiguration,
} from '@nx/devkit';
import { existsSync } from 'fs';
import { join } from 'path';
import { RunCommandsOptions } from 'nx/src/executors/run-commands/run-commands.impl';
import { TypeCheckGeneratorSchema } from './schema';

export const taskName = 'typecheck';

export const buildTypeCheckTask = (
  projectRoot: string,
  projectType: ProjectType
): TargetConfiguration<Pick<RunCommandsOptions, 'commands' | 'cwd'>> => {
  const tsconfigs: string[] = [];
  if (projectType === 'application') {
    tsconfigs.push('tsconfig.app.json');
  } else if (projectType === 'library') {
    tsconfigs.push('tsconfig.lib.json');
  }

  const potentialConfigs: string[] = [
    //spec
    'tsconfig.spec.json',

    // storybook
    '.storybook/tsconfig.json',

    // cypress
    'cypress/tsconfig.json',
    'cypress/tsconfig.cy.json',
    'tsconfig.cy.json',
  ];
  for (const c of potentialConfigs) {
    if (existsSync(join(projectRoot, c))) {
      tsconfigs.push(c);
    }
  }

  return {
    executor: 'nx:run-commands',
    outputs: [],
    options: {
      commands: tsconfigs.map((c) => ({
        command: `tsc -p ${c} --pretty --noEmit`,
        forwardAllArgs: false,
      })),
      cwd: projectRoot,
    },
  };
};

export default async function (tree: Tree, options: TypeCheckGeneratorSchema) {
  const { name: projectName } = options;
  const projectConfig = readProjectConfiguration(tree, projectName);
  projectConfig.targets[taskName] = buildTypeCheckTask(
    projectConfig.root,
    projectConfig.projectType
  );
  updateProjectConfiguration(tree, projectName, projectConfig);
  await formatFiles(tree);
}
