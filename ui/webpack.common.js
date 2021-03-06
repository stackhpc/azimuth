const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const AddAssetHtmlPlugin = require('add-asset-html-webpack-plugin');

module.exports = {
    entry: './src/main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        "presets": [
                            "@babel/preset-env",
                            "@babel/preset-react"
                        ],
                        "plugins": [
                            "@babel/plugin-proposal-object-rest-spread",
                            "@babel/plugin-proposal-class-properties"
                        ]
                    }
                }
            },
            {
                test: /\.css$/i,
                use: ["css-loader"]
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                use: ["file-loader"]
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Cloud Portal',
            template: 'assets/index.template.html',
            favicon: 'assets/favicon.ico',
            hash: true
        }),
        // Add CSS links with hashes for cache busting
        new AddAssetHtmlPlugin([
            {
                filepath: './assets/bootstrap.css',
                typeOfAsset: 'css',
                hash: true,
                includeSourcemap: false
            },
            {
                filepath: './assets/pulse-overrides.css',
                typeOfAsset: 'css',
                hash: true,
                includeSourcemap: false
            },
            {
                filepath: './assets/tweaks.css',
                typeOfAsset: 'css',
                hash: true,
                includeSourcemap: false
            }
        ])
    ]
};
