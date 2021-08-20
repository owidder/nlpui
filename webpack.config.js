const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CopyWebpackPlugin = require('copy-webpack-plugin');

const {foldersToBuild} = require("./scripts/searchFolders");

const PUBLIC_PATH = "public";
const TEMPLATES_PATH = "templates";
const DEFAULT_TEMPLATE = "default.html";
const PAGES_PATH = "src/pages";

const fs = require('fs');
const appDirectory = fs.realpathSync(process.cwd());
const absPath = relPath => path.resolve(appDirectory, relPath);

const VERSION = require("./package.json").version;

const folders = foldersToBuild(PAGES_PATH);

console.log(`version = ${VERSION}`);
console.log(`mode = ${process.env.NODE_ENV}`)
console.log(folders);

const htmlWebpackPlugins = (chunks) => folders.map(folder => {
    return new HtmlWebpackPlugin({
        filename: `${folder}/${folder}.html`,
        inject: true,
        chunks: [folder, ...chunks],
        template: `${TEMPLATES_PATH}/${DEFAULT_TEMPLATE}`,
    })
})

const common = {
    mode: process.env.NODE_ENV,
    entry: {
        zer0slides: "./src/index.tsx"
    },
    output: {
        path: path.resolve(__dirname, "build")
    },
    devtool: 'source-map',
    devServer: {
        contentBase: path.join(__dirname, "public"),
        compress: true,
        port: 9000,
        proxy: {
            "/api": "http://localhost:3225"
        }
    },
    module: {
        strictExportPresence: true,
        rules: [
            {
                test: /\.(js|jsx|mjs)$/,
                loader: require.resolve('source-map-loader'),
                enforce: 'pre',
                include: absPath("src"),
            },
            {
                oneOf: [
                    {
                        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
                        loader: "url-loader",
                        options: {
                            limit: 10000,
                            name: 'static/media/[name].[hash:8].[ext]',
                        },
                    },
                    {
                        test: /\.(js|jsx|mjs)$/,
                        include: absPath("src"),
                        loader: "babel-loader",
                        options: {
                            compact: true,
                        },
                    },
                    {
                        test: /\.(ts|tsx)$/,
                        include: absPath("src"),
                        use: [
                            {
                                loader: require.resolve('ts-loader'),
                                options: {
                                    // see: https://github.com/TypeStrong/ts-loader#faster-builds
                                    transpileOnly: true,
                                },
                            },
                        ],
                    },
                    {
                        test: /\.less$/,
                        use: ["style-loader", "css-loader", "less-loader"]
                    },
                    {
                        test: /\.scss$/,
                        use: ["style-loader", "css-loader", "sass-loader"]
                    },
                    {
                        test: /\.css$/,
                        use: [{loader: MiniCssExtractPlugin.loader}, "css-loader"]
                    },
                    {
                        test: /\.special.html$/,
                        use: 'raw-loader'
                    },
                    // "file" loader makes sure those assets get served by WebpackDevServer.
                    // When you `import` an asset, you get its (virtual) filename.
                    // In production, they would get copied to the `build` folder.
                    // This loader doesn't use a "test" so it will catch all modules
                    // that fall through the other loaders.
                    {
                        // Exclude `js` files to keep "css" loader working as it injects
                        // its runtime that would otherwise processed through "file" loader.
                        // Also exclude `html` and `json` extensions so they get processed
                        // by webpacks internal loaders.
                        exclude: [/\.(js|jsx|mjs)$/, /\.html$/, /\.json$/],
                        loader: require.resolve('file-loader'),
                        options: {
                            name: 'static/media/[name].[hash:8].[ext]',
                        },
                    },
                ],
            },
            // ** STOP ** Are you adding a new loader?
            // Make sure to add the new loader(s) before the "file" loader.
        ],
    },
    plugins: [
        new CopyWebpackPlugin([PUBLIC_PATH, {from: "data/static", to: "cosine-browser"}]),
        new CopyWebpackPlugin([PUBLIC_PATH, {from: "data/lsi", to: "lsi"}]),
    ],
    resolve: {
        extensions: [".tsx", ".ts", ".js"]
    },
}

const entries = folders.reduce((currentEntries, folder) => {
    return {...currentEntries, [folder]: `./src/pages/${folder}/index.tsx`}
}, {})

console.log(entries);

const pages = {
    ...common,
    entry: entries,
    output: {
        ...common.output,
        filename: 'static/js/[name].[contenthash:8].js',
    },
    plugins: [
        ...common.plugins,
        ...htmlWebpackPlugins([]),
        new MiniCssExtractPlugin({
            filename: "static/css/[name].[contenthash:8].css",}),
    ]
}

module.exports = [pages]
