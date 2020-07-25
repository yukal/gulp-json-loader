'use strict';

const Path = require('path');
const Fs = require('fs');
const asyncReadFile = Fs.promises.readFile;

async function loadJsonData(file) {
    // if (typeof(file) == 'string') {
    //     file = { path: `${__dirname}/src/data/${file}` };
    // }

    const pathHtml = `${loadJsonData.rootpath}/src/html`;
    const pathData = `${loadJsonData.rootpath}/src/data`;
    const pathJson = file.path.replace(pathHtml, pathData).slice(0,-3) + 'json';
    const filename = Path.basename(file.path, '.pug');
    const pocket = { filename, data: {} };

    return Fs.promises.access(pathJson, Fs.constants.R_OK)
        .then(async () => {
            let jsonData = {};

            try {
                jsonData = await asyncReadFile(pathJson, 'utf8');
                jsonData = JSON.parse(jsonData);
            } catch(err) {
                process.stdout.write(err.toString());
            }

            if (jsonData.hasOwnProperty('imports')) {
                Object.defineProperty(jsonData.data, 'imports', {
                    value: await loadImports(jsonData.imports, pathData),
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

async function loadImports(imports, fromPath) {
    const data = {};

    if (Array.isArray(imports) && imports.length) {
        const pathFile = imports.shift();
        const pathJson = `${fromPath}/${pathFile}.json`;
        const filename = Path.basename(pathJson, '.json');

        try {

            const jsonData = await asyncReadFile(pathJson, 'utf8');
            const parsedData = JSON.parse(jsonData);

            Object.defineProperty(data, filename, {
                value: parsedData,
                enumerable: true
            });

        } catch(err) {

            process.stdout.write(err.toString());

        }

        if (imports.length) {
            const jsonData = await loadImports(imports, fromPath);
            Object.assign(data, jsonData);
        }
    }

    return data;
}

module.exports = function(rootpath) {
    loadJsonData.rootpath = rootpath;
    return loadJsonData;
}
