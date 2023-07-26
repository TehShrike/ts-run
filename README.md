# ts-run

Build Typescript with esbuild + execute with node.

```sh
npm i @tehshrike/ts-run
```

Sourcemaps won't work until [nodejs/node/46454](https://github.com/nodejs/node/issues/46454) is fixed, but otherwise it's a pretty handy way to execute TypeScript.

## How do you use it

From the command-line, or in npm run scripts.

The first argument should be the entry point to be bundled+executed.

All following arguments are passed as arguments to the executed script.
