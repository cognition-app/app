var path = require('path')
var webpack = require('webpack')
var HtmlWebpackPlugin = require('html-webpack-plugin')

var host = 'localhost'
var port = '9876'

module.exports = {
  entry: {
    app: [
      '@babel/polyfill',
      'webpack/hot/only-dev-server',
      path.join(__dirname, 'src') + '/index.tsx',
    ],
    tests: [
      '@babel/polyfill',
      'webpack/hot/only-dev-server',
      path.join(__dirname, 'src') + '/index.test.tsx',
    ],
    client: 'webpack-dev-server/client?http://' + host + ':' + port,
  },
  mode: 'development',
  devtool: 'eval',
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.[name].js',
    library: 'cognition',
    libraryTarget: 'amd',
  },
  module: {
    rules: [
      {
        test: /\.[tj]sx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      },
      {
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre'
      },
    ],
  },
  resolve: {
    modules: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(__dirname),
    ],
    extensions: [
      '.js',
      '.jsx',
      '.ts',
      '.tsx',
      '.json',
    ],
  },
  externals: [
    require('webpack-require-http'),
    /^http.+$/,
  ],
  plugins: [
    new webpack.NamedModulesPlugin(),
    new HtmlWebpackPlugin({
      excludeChunks: ['tests'],
      title: 'App',
      template: 'src/index.html',
      filename: 'index.html',
    }),
    new HtmlWebpackPlugin({
      excludeChunks: ['app'],
      title: 'Tests',
      filename: 'tests.html',
    }),
  ],
  devServer: {
    host: host,
    port: port,
    // https: true,
    // open: true,
  },
}
