const path = require('path');

module.exports = {
  mode: 'production',
  entry: `${path.resolve(__dirname, 'Index.ts')}`,
  output: {
    filename: 'Index.js',
    path: path.resolve(__dirname, 'docs')
  },
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  module: {
    unknownContextCritical : false,
    rules: [
      {
        test: /\.(ts|tsx|js)?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  }
}