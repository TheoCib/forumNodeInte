const path = require("path");
const glob = require('glob');
const webpack = require("webpack");
const { argv } = require('yargs');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const PurifyCSSPlugin = require('purifycss-webpack');
const CleanWebpackPlugin = require('clean-webpack-plugin')
const ManifestPlugin = require('webpack-manifest-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin');

const production = !! ( ( argv.env && argv.env.production) || argv.p );

if (process.env.NODE_ENV === undefined) {
    process.env.NODE_ENV = production ? 'production' : 'development';
}

const isProduction = process.env.NODE_ENV === 'production';

const cssLoaders = [
    {
        loader: 'css-loader', // Translates CSS into CommonJS
        options: {
            // url: false,
            // sourceMap: ! isProduction,
            sourceMap: true, // Source maps required by resolve-url-loader
        }
    },
];

const proxyUrl = 'http://localhost:3000';

if (isProduction) {
    cssLoaders.push({
        loader: 'postcss-loader',
        options: {
            sourceMap: !isProduction,
            plugins: (loader) => [
                require("autoprefixer")({
                    browsers: ["last 2 versions", "ie > 9"]
                })
            ]
        }
    });
}

webpackConfig = {
    entry: [path.join(__dirname, 'assets/stylesheets/style.scss'), path.join(__dirname, 'assets/javascripts/main.js')],
    output: {
        path: path.resolve(__dirname, 'public/'),
        publicPath: '../',
        filename: "scripts/[name].js",
    },
    devtool: 'cheap-module-eval-source-map',
    watch: ! isProduction,
    stats: {
        hash: false,
        version: false,
        timings: false,
        children: false,
        errors: false,
        errorDetails: false,
        warnings: false,
        chunks: false,
        modules: false,
        reasons: false,
        source: false,
        publicPath: false,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: [/(node_modules|bower_components)/],
                loader: 'babel-loader'
            },
            {
                test: /\.css$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader', // Converts the CSS into inline stylesheets
                    use: cssLoaders
                })
            },
            {
                test: /\.scss$/,
                use: ExtractTextPlugin.extract({
                    fallback: 'style-loader', // Converts the CSS into inline stylesheets
                    use: [
                        ...cssLoaders,
                        {
                            loader: 'sass-loader', // Compiles Sass to CSS
                            options: {
                                sourceMap: ! isProduction
                            }
                        }
                    ]
                })
            },
            {
                test: /\.(jp(e)?g|png|gif|svg)$/,
                use: [
                    {
                        loader: 'url-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'images/',
                            // Images larger than 10 KB wonâ€™t be inlined
                            limit: 10 * 1024
                        }
                    },
                    'img-loader'
                ]
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, // Supports @font-face rule
                loader: "file-loader",
                options: {
                    name: '[name].[ext]',
                    outputPath: 'fonts/',
                }
            },
        ]
    },
    plugins: [
        new CleanWebpackPlugin(['public/stylesheets', 'public/scripts'], {
            root: path.resolve(__dirname),
            verbose: false,
            dry: false,
            watch: true,
        }),
        new webpack.optimize.UglifyJsPlugin({
            parallel: true,
            sourceMap: !isProduction
        }),
        new ExtractTextPlugin({
            filename: "stylesheets/[name].css",
            allChunks: true,
            disable: false
        }),
        new ManifestPlugin({
            writeToFileEmit: true
        }),
        new FriendlyErrorsWebpackPlugin()
    ]
}


// if (isProduction) {
//     webpackConfig.plugins.push(
//         new CleanWebpackPlugin(['public'], {
//             root: path.resolve(__dirname),
//             verbose: true,
//             dry: true
//         }),
//         new PurifyCSSPlugin({
//             paths: glob.sync(path.join(__dirname, 'views/**/*.twig')),
//             minimize: isProduction
//         }),
//         new ManifestPlugin({
//             publicPath: path.resolve(__dirname),
// writeToFileEmit: true
//         })
//     );
// }

if ( ! isProduction) {
    webpackConfig.stats = false;
    webpackConfig.plugins.push(
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new BrowserSyncPlugin(
            {
                // browse to http://localhost:8001/ during development
                // host: 'localhost',
                // port: 3000,
                // proxy the Webpack Dev Server endpoint
                // (which should be serving on http://localhost:8001/)
                // through BrowserSync
                proxy: proxyUrl,
                watch: true,
                // files: [
                //     '**/*.php'
                // ],
                delay: 100,
            },
            // plugin options
            // {
            // prevent BrowserSync from reloading the page
            // and let Webpack Dev Server take care of this
            // reload: false
            // }
        )
    );
}

module.exports = webpackConfig;