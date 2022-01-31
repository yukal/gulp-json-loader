'use strict';

const { assert, expect } = require('chai');
const JsonLoader = require('../lib/gulp-json-loader');

const {
  constants,
  // BrushColors,

  getAbsolutePath,
  brush,
  reportAction,
  loadImportsAsync,
  loadImportsRecursively,
  loadJsonData,
  // factory,
} = JsonLoader.forTest();

const Imports = require('./data');

const getPugFile = (filename) => ({
  path: getAbsolutePath(`./src/data/pages/${filename}.pug`)
});

describe('Gulp Json Loader', () => {

  it('getAbsolutePath()', () => {
    const absolutePath1 = getAbsolutePath('./src/html');
    const expected1 = process.cwd() + '/src/html';

    const absolutePath2 = getAbsolutePath('src', 'pug');
    const expected2 = process.cwd() + '/src/pug';

    expect(constants.APP_PATH).equal(process.cwd());
    expect(absolutePath1).equal(expected1);
    expect(absolutePath2).equal(expected2);
  });

  describe('factory()', () => {
    it('Run with default settings', () => {
      const testMode = true;
      const settings = undefined;

      const bindData = JsonLoader(settings, testMode);

      expect(bindData).property('pathHtml', getAbsolutePath('./src/html'));
      expect(bindData).property('pathData', getAbsolutePath('./src/data'));
      expect(bindData).property('sourcePath', 'src');
      expect(bindData).property('dataEntry', '$');
      expect(bindData).property('locales', 'ru-UA');
      expect(bindData).property('CachedData').eql({});
      expect(bindData).property('report', true);
    });

    it('Run with a specific Data entry', () => {
      const testMode = true;
      const settings = {
        dataEntry: '$Data',
      };

      const bindData = JsonLoader(settings, testMode);

      expect(bindData).property('pathHtml', getAbsolutePath('./src/html'));
      expect(bindData).property('pathData', getAbsolutePath('./src/data'));
      expect(bindData).property('sourcePath', 'src');
      expect(bindData).property('dataEntry', '$Data');
      expect(bindData).property('locales', 'en-EN');
      expect(bindData).property('CachedData').eql({});
      expect(bindData).property('report', true);
    });

    it('Run with a specific html & data paths', () => {
      const testMode = true;
      const settings = {
        pathHtml: './src/pug',
        pathData: './src/json',
      };

      const bindData = JsonLoader(settings, testMode);

      expect(bindData).property('pathHtml', getAbsolutePath('./src/pug'));
      expect(bindData).property('pathData', getAbsolutePath('./src/json'));
      expect(bindData).property('sourcePath', 'src');
      expect(bindData).property('dataEntry', 'data');
      expect(bindData).property('locales', 'en-EN');
      expect(bindData).property('CachedData').eql({});
      expect(bindData).property('report', true);
    });

    it('Run with a specific source path', () => {
      const testMode = true;
      const settings = {
        sourcePath: 'source',
      };

      const bindData = JsonLoader(settings, testMode);

      expect(bindData).property('pathHtml', getAbsolutePath('./source/html'));
      expect(bindData).property('pathData', getAbsolutePath('./source/data'));
      expect(bindData).property('sourcePath', 'source');
      expect(bindData).property('dataEntry', 'data');
      expect(bindData).property('locales', 'en-EN');
      expect(bindData).property('CachedData').eql({});
      expect(bindData).property('report', true);
    });

    it('Convert root sign into an internal path', () => {
      const testMode = true;
      const settings = {
        sourcePath: '/',
      };

      const bindData = JsonLoader(settings, testMode);

      expect(bindData).property('pathHtml', getAbsolutePath('./html'));
      expect(bindData).property('pathData', getAbsolutePath('./data'));
    });

    it('throw an error on referencing an external path', () => {
      const testMode = true;
      const settings = {
        sourcePath: '../',
      };

      try {
        JsonLoader(settings, testMode);
        assert.fail('should throw an error');
      } catch (error) {
        expect(error.message).equal(constants.ERR_TOP_DIR);
      }
    });
  });

  describe('loadJsonData()', () => {
    it('successfully load JSON data', async () => {
      const load = JsonLoader({ report: false });
      const pocket = await load(getPugFile('about'));

      const cacheKeyImports = 'src/data/imports/genres.json';
      const cacheKeyData = 'src/data/pages/about.json';

      // Check out loaded data
      expect(pocket).property('filename', 'about');
      expect(pocket).property('data').eql({
        name: 'About Us',
        href: 'about-us.html',
        visible: true,
        imports: {
          genres: Imports.genres
        }
      });

      // Check out cached data
      // expect(CachedData).property(cacheKeyData).eql(pocket);
      // expect(CachedData).property(cacheKeyImports).eql(pocket.$.imports.genres);
    });
  });

});
