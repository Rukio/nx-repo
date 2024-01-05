import type { StorybookConfig } from '@storybook/react-webpack5';
import { readFileSync } from 'fs';
import { CsfOptions, loadCsf } from '@storybook/csf-tools';
import { IndexedCSFFile, StoryIndexer } from '@storybook/types';
import { TransformOptions } from '@babel/core';

const STORIES_PATH =
  '../../../../../../ts/**/src/lib/**/*.stories.@(js|jsx|ts|tsx|mdx)';
const config: StorybookConfig = {
  framework: '@storybook/react-webpack5',
  addons: ['@storybook/addon-essentials', '@nx/react/plugins/storybook'],
  stories: [STORIES_PATH],
  storyIndexers: (indexers, addonOptions) => {
    const indexer: StoryIndexer['indexer'] = async (
      fileName,
      compilationOptions
    ) => {
      const code = readFileSync(fileName, {
        encoding: 'utf-8',
      });
      const makeTitle: CsfOptions['makeTitle'] = (userTitle) => {
        const libsAppsDirRegex = /ts\/(libs|apps)\//;
        const srcDirRegex = /\/src\//;
        const projectName = fileName
          .split(libsAppsDirRegex) // only need the path below libs/apps directory
          .at(-1)
          ?.split(srcDirRegex) // only need the path of the src directory
          .at(0)
          ?.split('/')
          .join('-'); // combine what's left as the project name

        return `${projectName || 'Unknown Project'}/${userTitle}`;
      };

      return loadCsf(code, {
        ...addonOptions,
        ...compilationOptions,
        makeTitle,
        fileName,
      }).parse() as IndexedCSFFile;
    };

    return [
      {
        test: /(stories|story)\.[tj]sx?$/,
        indexer,
      },
      ...(indexers || []),
    ];
  },
  babel: (options: TransformOptions) => ({
    ...options,
    presets: [...(options.presets || []), '@babel/preset-typescript'],
  }),
};
module.exports = config;
