const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  snapshotSerializers: ['@emotion/jest/serializer'],
};
