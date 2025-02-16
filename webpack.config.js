const path = require('path');
module.exports = {
  
  entry: './api/server.js',
  target: 'node',
  mode: process.env.NODE_ENV || 'production',
  devtool: process.env.NODE_ENV === 'development' ? 'source-map' : false,
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'server.bundle.js'
  },
  externals: [nodeExternals()],
  module: {
    exprContextCritical: false,
    rules: [
      {
        test: /\.node$/,
        loader: 'node-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.json', '.node'],
    alias: {
      // Puoi definire alias per semplificare gli import
      redis: path.resolve(__dirname, 'config/redis.js'),
      modules: path.resolve(__dirname, 'modules'),
      api: path.resolve(__dirname, 'api')
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    })
  ]
};