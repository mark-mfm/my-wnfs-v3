# Changelog

### v1.0.0

Release of the Most Basic App (MBA) using Fission's [Webnative SDK](https://github.com/fission-codes/webnative) (v3.5.2) with Angular (v13.3.0). It contains the following features:
- create a new account
- link a 2nd device/browser to an existing account
 - authenticate a link request
- write to and read from a text file using Webnative File System (WNFS)
 - manually "sync" remote changes (writes to WNFS using another device/browser)

The critical piece to get it working with Angular was in `polyfills.js`...
 - after `import zone.js`, added `(window as any).Zone['__zone_symbol__ignoreConsoleErrorUncaughtError'] = true;`

Also needed to add `"skipLibCheck": true` to `tsconfig.js`