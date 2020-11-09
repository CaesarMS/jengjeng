const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require("copy-webpack-plugin");
const webpack = require("webpack");

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    app: "./src/app.js",
    login: "./src/login.js",
    profil: "./src/profil.js",
    pembelian: "./src/pembelian.js",
    jual: "./src/jual.js",
    produk: "./src/produk.js",
    penjualan: "./src/penjualan.js",
    atur: "./src/atur.js",
    detail: "./src/detail.js",
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new HtmlWebpackPlugin({
      inject: 'body',
      template: './login.html',
      chunks: ['login'],
      filename: 'login.html'
    }),
    new HtmlWebpackPlugin({
      inject: 'body',
      template: './index.html',
      chunks: ['app'],
      filename: 'index.html'
    }),
    new HtmlWebpackPlugin({
      inject: 'body',
      template: './profil.html',
      chunks: ['profil'],
      filename: 'profil.html'
    }),
    new HtmlWebpackPlugin({
      inject: 'body',
      template: './pembelian.html',
      chunks: ['pembelian'],
      filename: 'pembelian.html'
    }),
    new HtmlWebpackPlugin({
      inject: 'body',
      template: './jual.html',
      chunks: ['jual'],
      filename: 'jual.html'
    }),
    new HtmlWebpackPlugin({
      inject: 'body',
      template: './produk.html',
      chunks: ['produk'],
      filename: 'produk.html'
    }),
    new HtmlWebpackPlugin({
      inject: 'body',
      template: './penjualan.html',
      chunks: ['penjualan'],
      filename: 'penjualan.html'
    }),
    new HtmlWebpackPlugin({
      inject: 'body',
      template: './atur.html',
      chunks: ['atur'],
      filename: 'atur.html'
    }),
    new HtmlWebpackPlugin({
      inject: 'body',
      template: './detail.html',
      chunks: ['detail'],
      filename: 'detail.html'
    }),
    new CopyWebpackPlugin([{ from: "./img", to: "img" }]),
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery",
      mixitup: "mixitup",
      moment: "moment",
      daterangepicker: "daterangepicker"
    })
  ],
  module: {
    rules: [
      {
       test: /\.css$/,
       use: [ 'style-loader', 'css-loader' ]
      },
      {
        test: /\.(eot|ttf|woff|woff2|png|jpe?g|gif|svg)$/,
        loader: 'url-loader?limit=100000'
      },
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      }
    ]
  }
  // devServer: { contentBase: path.join(__dirname, "dist"), compress: true },
};
