/* eslint-disable no-undef */
module.exports = {
  app: [
    {
      name: 'api-twitter',
      script: 'node dist/index.js',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
