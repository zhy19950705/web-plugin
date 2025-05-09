module.exports = {
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'zhy19950705',
          name: 'web-plugin',
        },
        prerelease: false,
      },
    },
  ],
};