const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  // Punto d'ingresso dell'applicazione
  entry: './api/server.js',
  // Target di build: Node.js (per eseguire il bundle in ambiente server)
  target: 'node',
  // Modalità di build (può essere 'development' per debug o 'production' per build ottimizzata)
  mode: process.env.NODE_ENV || 'production',
  // Configurazione dell'output: in quale cartella e con quale nome salvare il bundle
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'server.bundle.js'
  },
  // Esclude i moduli di Node (come express, mongoose, etc.) dal bundle
  externals: [nodeExternals()],
  // Configurazione per evitare errori su moduli binari
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
      // Ad esempio, per usare "redis" come alias per "config/redis.js" nella root:
      redis: path.resolve(__dirname, 'config/redis.js'),
      // Puoi aggiungere altri alias se necessario
    }  
  }
};
