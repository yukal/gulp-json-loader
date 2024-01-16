'use strict';

// Use nodeJS native test modules, see:
// 
// https://nodejs.org/api/test.html
// https://nodejs.org/api/assert.html
// 
// node@16: node --test ./test
// node@18: node --test --experimental-test-coverage ./test
//          node --test --experimental-test-coverage --test-reporter=lcov --test-reporter-destination=lcov.info

const path = require('node:path');
const assert = require('node:assert');
const { describe, it } = require('node:test');

const JsonLoader = require('../lib/gulp-json-loader');

const {
  constants,
  // BrushColors,

  brush,
  reportAction,
  loadImportsAsync,
  loadImportsRecursively,
  loadJsonData,
  // factory,
} = JsonLoader.forTest();

const Imports = require('./data');

const getAbsolutePath = (subdir) => path.join(process.cwd(), subdir);
const getPugFile = (filename) => ({
  path: getAbsolutePath(`./src/data/pages/${filename}.pug`)
});

describe('Gulp Json Loader', () => {
  describe('factory()', () => {
    it('init with default settings', () => {
      const testMode = true;
      const settings = undefined;

      const { context } = JsonLoader(settings, testMode);

      assert.deepEqual(context, {
        pathHtml: getAbsolutePath('./src/html'),
        pathData: getAbsolutePath('./src/data'),
        sourcePath: 'src',
        dataEntry: '$',
        locales: 'uk-UA',
        cachedData: {},
        report: true,
      });
    });

    it('init with a specific Data entry', () => {
      const testMode = true;
      const settings = {
        dataEntry: '$Data',
      };

      const { context } = JsonLoader(settings, testMode);
      assert.equal(context.dataEntry, '$Data');
    });

    it('init with a specific html & data paths', () => {
      const testMode = true;
      const settings = {
        pathHtml: './src/pug',
        pathData: './src/json',
      };

      const { context } = JsonLoader(settings, testMode);

      assert.equal(context.pathHtml, getAbsolutePath('./src/pug'));
      assert.equal(context.pathData, getAbsolutePath('./src/json'));
      assert.equal(context.dataEntry, 'data');
    });

    it('init with a specific source path', () => {
      const testMode = true;
      const settings = {
        sourcePath: 'source',
      };

      const { context } = JsonLoader(settings, testMode);

      assert.equal(context.pathHtml, getAbsolutePath('./source/html'));
      assert.equal(context.pathData, getAbsolutePath('./source/data'));
      assert.equal(context.sourcePath, 'source');
      assert.equal(context.dataEntry, 'data');
    });

    it('convert root sign into an internal path', () => {
      const testMode = true;
      const settings = {
        sourcePath: '/',
      };

      const { context } = JsonLoader(settings, testMode);

      assert.equal(context.pathHtml, getAbsolutePath('./html'));
      assert.equal(context.pathData, getAbsolutePath('./data'));
    });

    it('throw error on referencing an external path', () => {
      const testMode = true;
      const settings = {
        sourcePath: '../',
      };

      try {
        JsonLoader(settings, testMode);
        assert.fail('should throw an error');
      } catch (error) {
        assert.equal(error.message, constants.ERR_EXTERNAL_PATH);
      }
    });
  });

  describe('loadJsonData()', () => {
    it('successfully load JSON data', async () => {
      const ctx = {
        // sourcePath: 'src',
        pathHtml: getAbsolutePath('./src/html'),
        pathData: getAbsolutePath('./src/data'),
        dataEntry: '$',
        locales: 'en-EN',
        cachedData: {},
        report: false,
      };

      const pocket = await loadJsonData.call(ctx, getPugFile('about'));

      const cacheKeyImports = 'src/data/imports/genres.json';
      const cacheKeyData = 'src/data/pages/about.json';

      // Check out loaded data
      assert.equal(pocket.filename, 'about');
      assert.deepEqual(pocket.$, {
        name: 'About Us',
        href: 'about-us.html',
        visible: true,
        imports: {
          genres: Imports.genres
        }
      });

      // Check out cached data
      assert.deepEqual(ctx.cachedData[cacheKeyData], pocket);
      assert.deepEqual(ctx.cachedData[cacheKeyImports], pocket.$.imports.genres);
    });
  });

  describe('loadImportsAsync()', () => {
    it('import from file', async () => {
      const context = {
        pathData: getAbsolutePath('./src/data'),
        report: false,
      };
      const imports = ['genres'];
      const cachedData = {};

      const importedData = await loadImportsAsync(context, imports, cachedData);
      const cacheKey = 'src/data/imports/genres.json';

      assert.deepEqual(importedData.genres, Imports.genres);
      assert.deepEqual(cachedData[cacheKey], Imports.genres);
    });

    it('import from cache', async () => {
      const context = {
        pathData: getAbsolutePath('./src/data'),
        report: false,
      };
      const imports = ['genres'];
      const cacheKey = 'src/data/imports/genres.json';
      const cachedData = {
        [cacheKey]: [
          { href: '#href1', name: 'Caption1' },
          { href: '#href2', name: 'Caption2' },
        ]
      };

      const importedData = await loadImportsAsync(context, imports, cachedData);

      assert.deepEqual(importedData, {
        genres: cachedData[cacheKey]
      });
    });

    it('return empty object on empty array passing', async () => {
      const context = {};
      const cachedData = {};
      const imports = [];

      const importedData = await loadImportsAsync(context, imports, cachedData);
      assert.deepEqual(importedData, {});
    });

    it('throw error on non-array passed', async () => {
      const context = {};
      const cachedData = {};
      const imports = undefined;

      try {
        await loadImportsAsync(context, imports, cachedData);
        assert.fail('should throw an error');
      } catch (err) {
        assert.equal(err.message, 'Imports should be an Array');
      }
    });
  });

  describe('loadImportsRecursively()', () => {
    it('successfully load data', async () => {
      const cacheKeyMenu = 'src/data/imports/menu.json';
      const cacheKeyGenres = 'src/data/imports/genres.json';

      const options = {
        ctx: {
          pathData: getAbsolutePath('./src/data'),
          report: false,
        },
        imports: ['menu', 'genres'],
        pocket: {},
        cachedData: {
          [cacheKeyMenu]: Imports.menu
        },
      };

      await loadImportsRecursively(options, (error, pocket) => {
        assert.equal(error, null);

        assert.deepEqual(pocket.menu, Imports.menu);
        assert.deepEqual(pocket.genres, Imports.genres);

        assert.equal(options.cachedData.hasOwnProperty(cacheKeyMenu), true);
        assert.equal(options.cachedData.hasOwnProperty(cacheKeyGenres), true);
      });
    });

    it('throw error on referencing an external path', async () => {
      const options = {
        ctx: {
          pathData: getAbsolutePath('../'),
          report: false,
        },
        imports: ['menu'],
        pocket: {},
        cachedData: {},
      };

      await loadImportsRecursively(options, (error, pocket) => {
        assert.equal(error.message, constants.ERR_EXTERNAL_PATH);
        assert.equal(pocket, null);
      });
    });
  });
});
