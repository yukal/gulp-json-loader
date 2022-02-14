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

const PLUGIN_NAME = 'gulp-json-loader';

const APP_PATH = process.cwd();
const DEFAULT_SOURCE_PATH = 'src';
const BREAK_LINE = process.platform === 'win32' ? '\r\n' : '\n';
const ERR_EXTERNAL_PATH = 'Working with external paths is prohibited!';

const BrushColors = {
  red: 1,
  cyan: 6,
  grey: 8
};

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

const loadImportsAsync = (ctx, imports, cachedData) => {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(imports)) {

      reject(new Error('Imports should be an Array'));

    } else {

      if (imports.length < 1) {
        resolve({});
        return;
      }

      const options = { ctx, imports, cachedData, pocket: {} };

      loadImportsRecursively(options, (error, pocket) => {
        error !== null ? reject(error) : resolve(pocket);
      });

    }
  });
};

const loadImportsRecursively = async (options, callback) => {
  const { ctx, imports, cachedData, pocket, idx = 0 } = options;
  const { report, pathData } = ctx;

  if (idx < imports.length) {
    let action = 'Cached';

    const jsonRelativePath = imports[idx] + '.json';
    const jsonFullPath = Path.join(pathData, 'imports', jsonRelativePath);
    const jsonFilename = Path.basename(jsonFullPath, '.json');
    const cacheKey = jsonFullPath.replace(`${APP_PATH}/`, '');

    if (!jsonFullPath.startsWith(APP_PATH)) {
      callback(new Error(ERR_EXTERNAL_PATH), null);
      return;
    }

    if (!cachedData.hasOwnProperty(cacheKey)) {
      try {

        const jsonData = await Fs.promises.readFile(jsonFullPath, 'utf8');

        cachedData[cacheKey] = JSON.parse(jsonData);
        action = 'Loaded';

      } catch (error) {

        callback(error, null);
        return;

      }
    }

    report && reportAction(ctx, jsonFullPath, jsonFilename, action);

    Object.defineProperty(pocket, jsonFilename, {
      value: cachedData[cacheKey],
      enumerable: true
    });

    options.idx = idx + 1;
    loadImportsRecursively(options, callback);

  } else if (callback !== undefined) {
    callback(null, pocket);
  }
}

async function loadJsonData(file) {
  const { report, pathHtml, pathData, dataEntry, cachedData } = this;

  const jsonFullPath = file.path
    .replace(pathHtml, `${pathData}/pages`)
    .slice(0, -3) + 'json';

  const cacheKey = jsonFullPath.replace(`${APP_PATH}/`, '');

  const filename = Path.basename(file.path, '.pug');
  const pocket = { filename };

  if (cachedData.hasOwnProperty(cacheKey)) {
    report && reportAction(this, jsonFullPath, filename, 'Cached');
    return cachedData[cacheKey];
  }

  let jsonData = '';

  try {
    jsonData = await Fs.promises.readFile(jsonFullPath, 'utf8');
    jsonData = JSON.parse(jsonData);
  } catch (err) {
    return pocket;
  }

  report && reportAction(this, jsonFullPath, filename, 'Loaded');

  if (jsonData.hasOwnProperty('imports')) {
    const { data = {}, imports = [] } = jsonData;

    try {

      const importedData = await loadImportsAsync(this, imports, cachedData);

      Object.defineProperty(data, 'imports', {
        value: importedData,
        enumerable: true,
      });

    } catch (err) {

      const coloredErrorMesage = brush('red', err.message);
      process.stderr.write(coloredErrorMesage + BREAK_LINE);

      return pocket;

    }

    Object.defineProperty(pocket, dataEntry, {
      value: data,
      enumerable: true,
    });
  }

  cachedData[cacheKey] = pocket;

  return pocket;
}

const factory = (options, testMode = false) => {
  if (!options) {
    const packagePath = Path.join(APP_PATH, 'package.json');
    const Package = require(packagePath);

    options = Package.hasOwnProperty(PLUGIN_NAME)
      ? Package[PLUGIN_NAME]
      : {};
  }

  const { report = true, locales = 'en-EN', dataEntry = 'data' } = options;

  const sourcePath = options.hasOwnProperty('sourcePath')
    ? options.sourcePath
    : DEFAULT_SOURCE_PATH;

  const pathHtml = options.hasOwnProperty('pathHtml')
    ? Path.join(APP_PATH, options.pathHtml)
    : Path.join(APP_PATH, sourcePath, 'html');

  const pathData = options.hasOwnProperty('pathData')
    ? Path.join(APP_PATH, options.pathData)
    : Path.join(APP_PATH, sourcePath, 'data');

  if (!pathHtml.startsWith(APP_PATH) || !pathData.startsWith(APP_PATH)) {
    // Please put your source files into your project directory.
    throw new Error(ERR_EXTERNAL_PATH);
  }

  const context = {
    sourcePath,
    pathHtml,
    pathData,
    dataEntry,
    locales,
    report,
    cachedData: {}
  };

  if (testMode) {
    return {
      context,
      loader: loadJsonData.bind(context),
    }
  }

  return loadJsonData.bind(context);
}

factory.forTest = () => {
  return {
    // Package,
    // BrushColors,

    constants: {
      APP_PATH,
      DEFAULT_SOURCE_PATH,
      BREAK_LINE,
      ERR_EXTERNAL_PATH,
    },

    brush,
    reportAction,
    loadImportsAsync,
    loadImportsRecursively,
    loadJsonData,
    // factory,
  };
}

module.exports = factory;
