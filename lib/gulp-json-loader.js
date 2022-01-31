'use strict';

/**
 * GulpJsonLoader
 *
 * @file
 * @ingroup Plugins
 * @version 1.2
 * @license MIT
 * @author Alexander Yukal <yukal@email.ua>
 */

const Util = require('util');
const Path = require('path');
const Fs = require('fs');

const APP_PATH = process.cwd();
const DEFAULT_SOURCE_PATH = 'src';
const BREAK_LINE = process.platform === 'win32' ? '\r\n' : '\n';
const ERR_TOP_DIR = 'Working with external paths is prohibited!';

const BrushColors = {
  red: 1,
  cyan: 6,
  grey: 8
};

const getAbsolutePath = (path, subdir = '') => {
  if (path.startsWith('/')) {
    path = '.' + path;
  }

  path = Path.join(APP_PATH, path);

  return subdir
    ? Path.join(path, subdir)
    : path;
}

/**
 * brush
 * Adding the ANSI escape codes to a textual data
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code
 *
 * @param {string} colorName Color name
 * @param {string} str Text data
 */
const brush = (colorName, str) => {
  const color = BrushColors[colorName];
  return `\x1b[38;5;${color}m${str}\x1b[0m`;
}

const reportAction = (ctx, pathJson, filename, action) => {
  const currTime = new Date().toLocaleString(ctx.locales, {
    timeStyle: 'medium',
  });

  const coloredCurrentTime = brush('grey', currTime);
  const coloredRelativePath = pathJson
    .replace(APP_PATH, '.')
    .replace(filename, brush('cyan', filename));

  if (action === 'Cached') {
    action = brush('grey', action);
  }

  const message = Util.format(
    '[%s] %s %s%s',
    coloredCurrentTime,
    action,
    coloredRelativePath,
    BREAK_LINE
  );

  process.stdout.write(message);
}

const loadImportsAsync = (ctx, imports, CachedData) => {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(imports)) {
      reject(new Error('Imports should be an Array'));
    } else {
      const pocket = {};
      loadImportsRecursively({ ctx, imports, pocket, CachedData, resolve, reject });
    }
  });
};

const loadImportsRecursively = async (options) => {
  const { ctx, imports, pocket, CachedData, resolve, reject, idx = 0 } = options;
  const { report, pathData } = ctx;

  if (idx < imports.length) {
    let action = 'Cached';

    const jsonRelativePath = imports[idx] + '.json';
    const jsonFullPath = Path.join(pathData, 'imports', jsonRelativePath);
    const jsonFilename = Path.basename(jsonFullPath, '.json');
    const cacheKey = jsonFullPath.replace(`${APP_PATH}/`, '');

    if (!jsonFullPath.startsWith(APP_PATH)) {
      reject(new Error(ERR_TOP_DIR));
      return;
    }

    if (!CachedData.hasOwnProperty(cacheKey)) {
      try {

        const jsonData = await Fs.promises.readFile(jsonFullPath, 'utf8');

        CachedData[cacheKey] = JSON.parse(jsonData);
        action = 'Loaded';

      } catch (error) {

        reject(error);
        return;

      }
    }

    report && reportAction(ctx, jsonFullPath, jsonFilename, action);

    Object.defineProperty(pocket, jsonFilename, {
      value: CachedData[cacheKey],
      enumerable: true
    });

    options.idx = idx + 1;
    loadImportsRecursively(options);

  } else {
    resolve(pocket);
  }
}

async function loadJsonData(file) {
  const { report, pathHtml, pathData, dataEntry, CachedData } = this;

  const pathJson = file.path
    .replace(pathHtml, `${pathData}/pages`)
    .slice(0, -3) + 'json';

  const cacheKey = pathJson.replace(`${APP_PATH}/`, '');

  const filename = Path.basename(file.path, '.pug');
  const pocket = { filename };

  if (CachedData.hasOwnProperty(cacheKey)) {
    report && reportAction(this, pathJson, filename, 'Cached');
    return CachedData[cacheKey];
  }

  let jsonData = '';

  try {
    jsonData = await Fs.promises.readFile(pathJson, 'utf8');
    jsonData = JSON.parse(jsonData);
  } catch (err) {
    return pocket;
  }

  report && reportAction(this, pathJson, filename, 'Loaded');

  if (jsonData.hasOwnProperty('imports')) {
    const { data = {}, imports = [] } = jsonData;

    try {

      const importedData = await loadImportsAsync(this, imports, CachedData);

      Object.defineProperty(data, 'imports', {
        value: importedData,
        enumerable: true,
      });

    } catch (err) {

      const coloredErrorMesage = brush('red', err.message);
      process.stderr.write(coloredErrorMesage + BREAK_LINE);

      return;

    }

    Object.defineProperty(pocket, dataEntry, {
      value: data,
      enumerable: true,
    });
  }

  CachedData[cacheKey] = pocket;

  return pocket;
}

const factory = (options, testMode = false) => {
  if (!options) {
    const packagePath = Path.join(APP_PATH, 'package.json');
    const Package = require(packagePath);

    options = Package.hasOwnProperty(Package.name)
      ? Package[Package.name]
      : {};
  }

  const { report = true, locales = 'en-EN', dataEntry = 'data' } = options;

  const sourcePath = options.hasOwnProperty('sourcePath')
    ? options.sourcePath
    : DEFAULT_SOURCE_PATH;

  const pathHtml = options.hasOwnProperty('pathHtml')
    ? getAbsolutePath(options.pathHtml)
    : getAbsolutePath(sourcePath, 'html');

  const pathData = options.hasOwnProperty('pathData')
    ? getAbsolutePath(options.pathData)
    : getAbsolutePath(sourcePath, 'data');

  if (!pathHtml.startsWith(APP_PATH) || !pathData.startsWith(APP_PATH)) {
    // Please put your source files into your project directory.
    throw new Error(ERR_TOP_DIR);
  }

  const bindData = {
    sourcePath,
    pathHtml,
    pathData,
    dataEntry,
    locales,
    report,
    CachedData: {}
  };

  return testMode ? bindData : loadJsonData.bind(bindData);
}

factory.forTest = () => {
  return {
    // Package,
    // BrushColors,

    constants: {
      APP_PATH,
      DEFAULT_SOURCE_PATH,
      BREAK_LINE,
      ERR_TOP_DIR,
    },

    getAbsolutePath,
    brush,
    reportAction,
    loadImportsAsync,
    loadImportsRecursively,
    loadJsonData,
    // factory,
  };
}

module.exports = factory;
