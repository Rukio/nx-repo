function createUMDConfig({ entryPath, fileName, libName, config }) {
  return {
    ...config,
    entry: {
      [fileName]: entryPath,
    },
    output: {
      ...config.output,
      libraryTarget: 'umd',
      library: libName,
      filename: '[name].js',
      umdNamedDefine: true,
    },
    optimization: {
      ...config.optimization,
      runtimeChunk: false,
    },
    resolve: {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        // don't need to include "@fontsource/open-sans" imported from design-system as this font is already included on external resource
        '@fontsource/open-sans': false,
      },
    },
  };
}

module.exports = (config) => {
  return [
    createUMDConfig({
      entryPath: './src/entries/RequestCareWidgetEntry/index.ts',
      fileName: 'RequestCareWidget',
      libName: 'RequestCareWidget',
      config,
    }),
  ];
};
