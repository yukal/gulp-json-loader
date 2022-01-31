# gulp-json-loader
A little tool for the [gulp-data](https://www.npmjs.com/package/gulp-data) plugin. 
It useful for automatically data loading in the development including the PUG files.

### What for
I tried to find any simple solution to assign my variables to a current PUG file in a building 
process, but some of the solutions are the same with solutions between the 2014th and 2019th 
years and, actually do not satisfy my needs as I want. And the most popular solution I have 
found looks like:

```javascript
// Somewhere in gulp task
.pipe(data(() => JSON.parse(fs.readFileSync('data.json')) ))

// Sometimes it can looks like this one
.pipe(data(() => require('data.json') ))
```

After a while, in search of the solution I have found one more way in solving this decision 
in a [detailed article](https://tusharghate.com/rendering-pug-templates-with-multiple-data-files),
but still not satisfied.

So, what's wrong with these solutions?
First of all, any time, when the queue reaches to Html part, it starts the merging process of all 
the JSON files. Each any Html file, Carl! It means that sometimes the process is performing 
unnecessary actions. What if you don't need to include the data in some of the Html file, it still 
will run enforced actions, any time, again and again, merge... merge... merge. Yes, you can solve 
it by running a once merge, and then always include it as a combined object from the JSON file, as 
the solution in an article above. But it still not a good solution to including the JSON file there 
where you should not include.

And I decided to fix this problem in my vision.

### How does it work
When the build process's queue reaches Html, it automatically searches the JSON file with the same 
name as in the directory with Html files, or PUG files (it depends on how you set up your project).

### Structure
To automatically asigning data to the pages, you must be following the canonical paths. The 
structure of directory with the JSON files should contains with two required folders inside: 
**pages** and **imports**. The **pages** directory structure must be exactly the same structure as 
the directory with PUG files. Here in example the PUG files located in **html** directory. The 
**imports** directory is provided for the JSON files which you can include as a partial data.
If you missed any of the JSON files in the data/pages directory, the loading of the JSON files will 
not happen and the error will not rise except one thing - It would not happen if you will not try 
to get the data variable from current context while the building process is running.

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
const jsonLoader = jsonLoaderFactory({
    // sourcePath: __dirname,
    pathHtml: 'src/html',
    pathData: 'src/data',
    report: true,
});

function html() {
    return gulp.src('src/html/**/*.pug')
        .pipe(plugins.data(jsonLoader))
        .pipe(plugins.pug({
            pretty: true
        }))
        .pipe(gulp.dest('dest'))
    ;
}
```

Somewhere in json file:
```javascript
{
    "data": {                         // Here, in the data node, you can add any data
        "name": "Catalog",            // that belongs to your page
        "href": "#catalog",
        "visible": true
    },
    "imports": [                      // Sometimes you need to include other parts of the data.
        "partials/catalog_1",         // To avoid the duplicate data you can split the files
        "partials/catalog_2",         // and include them partially
        "partials/genres"
    ]
}
```

Somewhere in pug file:
```pug
block content
    // As a result, you will be able to access the <data> variable.
    // All imported data will be available in the data.imports namespace
    //- - console.log(data)

    div= filename
    div: a(href=data.href)= data.name

    ul.genres
        each Genre in data.imports.genres
            li
                a(href=Genre.href)= Genre.name
```

Run command to build html page with data
```bash
$ gulp html

# Or
$ npx gulp html
```

### TODO
To avoid collisions with the same file names, we should split the responsibility of pages 
and libraries in the data directory using the nested paths cutting them with a dot symbol.

## Libraries Using `gulp-json-loader`

- [gulp-data](https://www.npmjs.com/package/gulp-data)

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)
