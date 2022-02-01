'use strict';

const Path = require('path');
const { assert, expect } = require('chai');
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

const getAbsolutePath = (subdir) => Path.join(process.cwd(), subdir);
const getPugFile = (filename) => ({
  path: getAbsolutePath(`./src/data/pages/${filename}.pug`)
});

describe('Gulp Json Loader', () => {

  describe('factory()', () => {
    it('init with default settings', () => {
      const testMode = true;
      const settings = undefined;

      const { context } = JsonLoader(settings, testMode);

      expect(context).property('pathHtml', getAbsolutePath('./src/html'));
      expect(context).property('pathData', getAbsolutePath('./src/data'));
      expect(context).property('sourcePath', 'src');
      expect(context).property('dataEntry', '$');
      expect(context).property('locales', 'ru-UA');
      expect(context).property('cachedData').eql({});
      expect(context).property('report', true);
    });

    it('init with a specific Data entry', () => {
      const testMode = true;
      const settings = {
        dataEntry: '$Data',
      };

      const { context } = JsonLoader(settings, testMode);

      expect(context).property('dataEntry', '$Data');
    });

    it('init with a specific html & data paths', () => {
      const testMode = true;
      const settings = {
        pathHtml: './src/pug',
        pathData: './src/json',
      };

      const { context } = JsonLoader(settings, testMode);

      expect(context).property('pathHtml', getAbsolutePath('./src/pug'));
      expect(context).property('pathData', getAbsolutePath('./src/json'));
      expect(context).property('dataEntry', 'data');
    });

    it('init with a specific source path', () => {
      const testMode = true;
      const settings = {
        sourcePath: 'source',
      };

      const { context } = JsonLoader(settings, testMode);

      expect(context).property('pathHtml', getAbsolutePath('./source/html'));
      expect(context).property('pathData', getAbsolutePath('./source/data'));
      expect(context).property('sourcePath', 'source');
      expect(context).property('dataEntry', 'data');
    });

    it('convert root sign into an internal path', () => {
      const testMode = true;
      const settings = {
        sourcePath: '/',
      };

      const { context } = JsonLoader(settings, testMode);

      expect(context).property('pathHtml', getAbsolutePath('./html'));
      expect(context).property('pathData', getAbsolutePath('./data'));
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
        expect(error.message).equal(constants.ERR_EXTERNAL_PATH);
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
      expect(pocket).property('filename', 'about');
      expect(pocket).property('$').eql({
        name: 'About Us',
        href: 'about-us.html',
        visible: true,
        imports: {
          genres: Imports.genres
        }
      });

      // Check out cached data
      expect(ctx.cachedData).property(cacheKeyData).eql(pocket);
      expect(ctx.cachedData).property(cacheKeyImports).eql(pocket.$.imports.genres);
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

      expect(importedData).property('genres').eql(Imports.genres);
      expect(cachedData).property(cacheKey).eql(Imports.genres);
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

      expect(importedData).eql({
        genres: cachedData[cacheKey]
      });
    });

    it('return empty object on empty array passing', async () => {
      const context = {};
      const cachedData = {};
      const imports = [];

      const importedData = await loadImportsAsync(context, imports, cachedData);
      expect(importedData).eql({});
    });

    it('throw error on non-array passed', async () => {
      const context = {};
      const cachedData = {};
      const imports = undefined;

      try {
        await loadImportsAsync(context, imports, cachedData);
        assert.fail('should throw an error');
      } catch (err) {
        expect(err.message).equal('Imports should be an Array');
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
        expect(error).equal(null);

        expect(pocket).property('menu').eql(Imports.menu);
        expect(pocket).property('genres').eql(Imports.genres);

        expect(options.cachedData).property(cacheKeyMenu);
        expect(options.cachedData).property(cacheKeyGenres);
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
        expect(error.message).equal(constants.ERR_EXTERNAL_PATH);
        expect(pocket).equal(null);
      });
    });
  });
});
