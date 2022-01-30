'use strict';

const Format = require('util').format;
const Path = require('path');
const Fs = require('fs');
const asyncReadFile = Fs.promises.readFile;
const BR = (process.platform === 'win32' ? '\r\n' : '\n');

async function loadJsonData(file) {
  const { report, pathHtml, pathData } = this;
  const pathJson = file.path.replace(pathHtml, `${pathData}/pages`).slice(0, -3) + 'json';
  const filename = Path.basename(file.path, '.pug');
  const pocket = { filename };

  return Fs.promises.access(pathJson, Fs.constants.R_OK)
    .then(async () => {
      let jsonData = {};

      try {
        jsonData = await asyncReadFile(pathJson, 'utf8');
        jsonData = JSON.parse(jsonData);
      } catch (err) {
        process.stderr.write(err + BR);
        return pocket;
      }

      report && reportAction(pathJson, filename);

      if (jsonData.hasOwnProperty('imports')) {
        if (!jsonData.hasOwnProperty('data')) {
          jsonData.data = {};
        }

        Object.defineProperty(jsonData.data, 'imports', {
          value: await loadImports.call(this, jsonData.imports),
          enumerable: true,
          // configurable: true
        });
        delete jsonData.imports;
      }

      return Object.assign(pocket, jsonData);
    })
    .catch(() => pocket)
  ;
}

async function loadImports(imports) {
  const { report, pathHtml, pathData } = this;
  const data = {};

  if (Array.isArray(imports) && imports.length) {
    const pathFile = imports.shift();
    const pathJson = `${pathData}/imports/${pathFile}.json`;
    const filename = Path.basename(pathJson, '.json');

    try {

      const jsonData = await asyncReadFile(pathJson, 'utf8');
      const parsedData = JSON.parse(jsonData);

      Object.defineProperty(data, filename, {
        value: parsedData,
        enumerable: true
      });

    } catch (err) {

      process.stderr.write(err + BR);

    }

    report && reportAction(pathJson, filename);

    if (imports.length) {
      // TODO: Find another solution with asynchronous queue.
      // 
      // I know that recursion is a bad practice with its excessive 
      // consumption of resources but unfortunately, I didn't find 
      // any other solution by now
      const jsonData = await loadImports.call(this, imports);
      Object.assign(data, jsonData);
    }
  }

  return data;
}

function reportAction(pathJson, filename) {
  const currTime = brush('grey', new Date().toLocaleTimeString());
  const relativePath = pathJson
    .replace(process.cwd(), '.')
    .replace(filename, brush('cyan', filename))
  ;
  process.stdout.write(Format('[%s] Loaded %s%s', currTime, relativePath, BR));
}

/**
 * brush
 * Adding the ANSI escape codes to a textual data
 * @see https://en.wikipedia.org/wiki/ANSI_escape_code
 * 
 * @param {string} colorName Color name
 * @param {string} str Text data
 */
function brush(colorName, str) {
  const colors = {
    cyan: 6,
    grey: 8
  }
  const color = colors[colorName];
  return `\x1b[38;5;${color}m${str}\x1b[0m`;
}

function getAbsolutePath(sourcePath, postfix = '') {
  let absolutePath = sourcePath;

  if (absolutePath.substr(0, 2) === './') {
    absolutePath = absolutePath.slice(2);
  }

  if (absolutePath[0] !== '/') {
    absolutePath = process.cwd() + '/' + absolutePath;
  }

  return absolutePath + postfix;
}

function manager(options) {
  let opts = {};

  if (!(typeof (options) == 'object' && options !== null)) {
    throw new Error('options is required');
  }

  opts.report = options.hasOwnProperty('report') ? options.report : false;

  if (options.hasOwnProperty('pathHtml') && options.hasOwnProperty('pathData')) {
    opts.pathHtml = getAbsolutePath(options.pathHtml);
    opts.pathData = getAbsolutePath(options.pathData);
  }

  else if (options.hasOwnProperty('sourcePath')) {
    opts.pathHtml = getAbsolutePath(options.sourcePath, '/src/html');
    opts.pathData = getAbsolutePath(options.sourcePath, '/src/data');
  }

  else {
    throw new Error('required "sourcePath" parameter or pare of "pathHtml" and "pathData" parameters');
  }

  return loadJsonData.bind(opts);
}

module.exports = manager;
