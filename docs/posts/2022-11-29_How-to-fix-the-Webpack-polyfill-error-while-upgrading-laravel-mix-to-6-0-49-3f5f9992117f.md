---
layout: BookLayout
title: "How to fix the Webpack polyfill error while upgrading laravel mix to 6.0.49"
date: 2022-11-29T00:00:00.000Z
---

# How to fix the Webpack polyfill error while upgrading laravel mix to 6.0.49

![Webpack Laravel Mix](https://cdn-images-1.medium.com/max/800/1*Auphje3KOnBUy-_XOvEt8Q.jpeg)

The upgrade guide to laravel-mix to 6 is available in an [official document](https://laravel-mix.com/docs/6.0/upgrade). But you may encounter compiling errors related to webpack couldn't find standard libraries like fs, HTTP, HTTPS, URL etc.

Webpack version less than 5 is used to polyfill for node.js core modules by default but not in webpack 5 and newer. If your setup/packages need these polyfills, you will encounter `can't resolve` errors.

In order to successfully compile you need to provide those polyfills to the webpack config. Below I have included frequently used polyfills library setup steps and configuration codes.

## 1. Install necessary npm packages as your need

```bash
npm install --dev browserify-zlib
npm install --dev https-browserify
npm install --dev node-polyfill-webpack-plugin
npm install --dev stream-browserify
npm install --dev stream-http
npm install --dev resolve-url-loader
```

## 2. Update your webpack config in webpack.config.js file

```javascript
// webpack.config.js
resolve: {
    fallback: {
        stream: require.resolve("stream-browserify"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        zlib: require.resolve("browserify-zlib"),
        url: require.resolve("url"),
    },
    preferRelative: false,
    // ...
}

plugins: [
    // ...
    new NodePolyfillPlugin(),
    new webpack.ProvidePlugin({
        http: "stream-http",
        https: "https-browserify",
    }),
    // ...
],
```

We found noticeable speed while compiling compare to webpack < 5 versions. However, we are on the way to migrating laravel mix to Vite to boost our frontend development.

Since Vite is only available from Laravel 9. Soon I will post laravel-mix to Vite migration for any Laravel version.

Till then sayonara.
