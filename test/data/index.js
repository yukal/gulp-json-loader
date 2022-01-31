'use strict';

// Define data as readonly
module.exports = Object.defineProperties({}, {
  menu: {
    value: require('../../src/data/imports/menu.json'),
    enumerable: true,
  },
  genres: {
    value: require('../../src/data/imports/genres.json'),
    enumerable: true,
  },
  catalog1: {
    value: require('../../src/data/imports/catalog/catalog_1.json'),
    enumerable: true,
  },
  catalog2: {
    value: require('../../src/data/imports/catalog/catalog_2.json'),
    enumerable: true,
  },
});
