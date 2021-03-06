const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const {allTokens} = require("./grammar/parsing");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

// extract the names of the TokenTypes to avoid name mangling them.
const allTokenNames = allTokens.map(tokenType => tokenType.name);

module.exports = {
    mode: "production",
    entry: "./index.js",
    output: {
        path: path.resolve(__dirname, "./build/"),
        filename: "parser.min.js",
        library: "FormulaParser",
        libraryTarget: "umd",
        // https://github.com/webpack/webpack/issues/6784#issuecomment-375941431
        globalObject: "typeof self !== 'undefined' ? self : this"
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    compress: true,
                    mangle: {
                        // Avoid mangling TokenType names.
                        reserved: allTokenNames
                    },
                }
            })
        ],

    },
    plugins: [
        // new BundleAnalyzerPlugin(),
    ],
};
