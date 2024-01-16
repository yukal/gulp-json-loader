# gulp-json-loader
A little tool for the [gulp-data](https://www.npmjs.com/package/gulp-data) plugin. It useful for automatically data loading in the development including the PUG files.

### What for
I've tried to find a simple solution for assigning my variables into PUG files in a building process. Some of them have similar examples between the 2014th and 2019th years and don't satisfy my technical needs. The most popular solution I have found looks like this:

```javascript
// Somewhere in gulp task
.pipe(data(() => JSON.parse(fs.readFileSync('data.json')) ))

// Sometimes it can looks like this one
.pipe(data(() => require('data.json') ))
```

What's wrong with these examples?
First of all, each time when the queue reaches the HTML part, it starts the merging process of all the JSON files. It means that sometimes the process is performing unnecessary actions. What if we don't need to include the data for some of the HTML files? Well, it still runs enforced actions at any time. We can solve it by once running merge and then always including it as a combined object from the JSON file. But it is still not a good idea to include the JSON file there where we shouldn't.

### How does it work
When the build process queue reaches HTML, it automatically searches the JSON file with the same name as in the directory with kinds of PUG files (it depends on how you set up your project).

### Structure
To assign some data inside your pages, you have to follow canonical paths. The directory structure with JSON files must contain two necessary folders inside pages and imports. The "pages" directory structure must have the same structure as the directory with the pug files. In the example below, pug files are placed inside the "html" directory. The "imports" directory is provided for the JSON files, which you can include as partial data. If you've missed any JSON file inside the data/pages directory, the loading of the JSON files will not happen, and the error will not rise except, It will not rise if you do not try to get the data variable from the current context while the building process is running.

```bash
src                 src
├─ ...              ├─ ...
└─ html             └─ data
   │                   ├─ imports
   │                   │  └─ ...
   │                   └─ pages
   ├─ about.pug           ├─ about.json
   ├─ menu.pug            ├─ menu.json
   ├─ without_data.pug    ├─ [ empty ]   // no data provided
   └─ subdir              └─ subdir
      └─ ...                 └─ ...
```

### Usage

Somewhere in gulpfile.js:
```javascript
// It is optional now, but you able to tune it as you wish.
// You can pass the settings by an object, or you can pass it using package.json
const jsonLoaderSettings = {
  // Chose where the source files are located.
  // Use sourcePath or the pare of pathHtml and pathData

  // sourcePath: 'src',
  pathHtml: 'src/html',
  pathData: 'src/data',

  // The namespace where the Data is located.
  // To get some loaded data from the JSON in a PUG context use syntax:
  // $.href or $.imports.menu
  dataEntry: '$',

  // It needs for the Date object to show a local date
  locales: 'en-GB',

  // Will report about the loaded JSON files
  report: true,
};

const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
const jsonLoaderFactory = require('./lib/gulp-json-loader');
const jsonLoader = jsonLoaderFactory(jsonLoaderSettings);

function html() {
  return gulp.src('src/html/**/*.pug')
    .pipe(plugins.data(jsonLoader))
    .pipe(plugins.pug({
      pretty: true
    }))
    .pipe(gulp.dest('dest'));
}
```

Somewhere in json file:
```javascript
{
  "data": {                       // Here, in the data node, you can add any data
    "name": "Catalog",            // that belongs to your page
    "href": "#catalog",
    "visible": true
  },
  "imports": [                    // Sometimes you need to include other parts of the data.
    "partials/catalog_1",         // To avoid the duplicate data you can split the files
    "partials/catalog_2",         // and include them partially
    "partials/genres"
  ]
}
```

Somewhere in pug file:
```pug
block content
  // As a result, you will be able to access the "$" variable.
  // All imported data will be available in the $.imports namespace
  //- - console.log($)

  div= filename
  div: a(href = $.href)= $.name

  ul.genres
    each $GenreItem in $.imports.genres
      li
        a(href = $GenreItem.href)= $GenreItem.name
```

Run command to build html page with data
```bash
$ gulp html

# Or
$ npx gulp html
```

## Libraries Using `gulp-json-loader`

- [gulp-data](https://www.npmjs.com/package/gulp-data)

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)
