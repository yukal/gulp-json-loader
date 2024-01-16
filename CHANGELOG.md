## [v1.2.1](https://github.com/yukal/gulp-json-loader/compare/f7485d8fa2a84bc3ab4a2156ef62add21f8ae615...a6ca46f363d6f343b1941d5b25eaa31a0529542d) – 2024-01-16

### Refactors

*  update tests ([da00c2ad](https://github.com/yukal/gulp-json-loader/commit/da00c2ad5e2d1e292c8150e8818a4b4173f0fbaa))

### Chores

* **readme:**  update and fix typos and grammar ([19e0dbb7](https://github.com/yukal/gulp-json-loader/commit/19e0dbb7d40ee335ce156f1cc0b8541dfd3f47d0))
* **package:**  update package within dependencies ([2a825757](https://github.com/yukal/gulp-json-loader/commit/2a825757948e66895ad8ddd67a9adb99e8795b8f))

### Continuous Integration

- **action:**  use latest stable nodejs ([bf570a7a](https://github.com/yukal/gulp-json-loader/commit/bf570a7a3cb03f555916c05ec4faf83817627ba6))
- **action:**  update node matrix ([a6ca46f3](https://github.com/yukal/gulp-json-loader/commit/a6ca46f363d6f343b1941d5b25eaa31a0529542d))

## [v1.2.1](https://github.com/yukal/gulp-json-loader/compare/v1.2.1...f7485d8fa2a84bc3ab4a2156ef62add21f8ae615)

### Build System / Dependencies

- **deps-dev:**  bump chai from 4.3.8 to 4.3.10 ([a0f02551](https://github.com/yukal/gulp-json-loader/commit/a0f02551bddefad86d2864cf1e42527d6ebbed0f))
- **deps-dev:**  bump chai from 4.3.7 to 4.3.8 ([e5d80951](https://github.com/yukal/gulp-json-loader/commit/e5d80951f8f1245879924bd71db2b621e5409d91))
- **deps-dev:**  bump mocha from 10.1.0 to 10.2.0 ([367897bb](https://github.com/yukal/gulp-json-loader/commit/367897bb4ed1b9812edc867a8c1fc18ffa92d974))
- **deps:**  bump decode-uri-component from 0.2.0 to 0.2.2 ([4252fa92](https://github.com/yukal/gulp-json-loader/commit/4252fa92d0e6f31d0d31d22a4e23c4b6fc4b3fdf))

### Other Changes

*  codestyle ([515d18d4](https://github.com/yukal/gulp-json-loader/commit/515d18d40e607e7157a646eb27b5c10e83720b5f))

## v1.1.0
- Updated core
  - Imposed restrictions on accessing external directories.
  - There is no need to pass the config data to GulpJsonLoader, now it's optional
    and defined from defaults. But if you want to change them, you might tune it in
    both ways: using an old-style passing an object with options to GulpJsonLoader
    factory or just pass the settings into a package.json. See package.json.

- Updated dependencies
  - gulp-load-plugins: ^2.0.7
  - gulp-pug: ^5.0.0

- Improvement of variables names
  - To distinguish variables from stylistic PAG syntax it is preferable to name
    variables in a different way as opposed to decoration text. That's why I name 
    variables with a capital letter and a dollar sign at the beginning.
    See PUG files to find out more about it.

  - The entry name of the Data loaded from the JSON file is defined in a global
    space as a "data" entry, now you can change this name as you like.
    See package.json and PUG files to find out more about it.

- Implemented data caching
  - The data that has already been loaded will be getting from the cache

- Added tests
