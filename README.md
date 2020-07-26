# gulp-json-loader
A little tool for the [gulp-data](https://www.npmjs.com/package/gulp-data) plugin. 
It useful for automatically data loading in the development including the PUG pages.

### What for
I tried to find any simple solution to assign my variables to a current Html file in a building 
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
First of all, any time, when the queue reaches to Html part, it starts the merging process of 
all the json files. Each any Html file, Carl! It means that sometimes the process is performing 
unnecessary actions. What if you don't need to include the data in some of the files, it still 
will run enforced actions, any time, again and again, merge... merge... merge. Yes, you can solve 
it by running a once merge, and then always include it as a combined object from the json file, 
as the solution in an article above. But it still not a good solution to including the json file 
there where you should not include.

So I decided to fix this problem in my vision.

### How does it work
When the build process's queue reaches Html, it automatically searches the json file with the 
same name as Html in the data directory.

### Structure
To automatically asigning data to the pages, you must be following the canonical paths. The json data 
directory structure must be exactly the same as the Html directory structure. If you missed the 
file in data-directory it would be ignored and the data loading is will not happen, but then would 
raise an error if you try to access your data from the Html file while the building process is 
running.

```bash
src                  src
├─ data              ├─ html
└─ html              └─ data
   ├─ about.pug         ├─ about.json
   ├─ menu.pug          ├─ menu.json
   └─ partials          └─ partials
      └─ ...               └─ ...
```

### Usage

Somewhere in gulpfile.js:
```javascript
const gulp = require('gulp');
const plugins = require('gulp-load-plugins')();
const jsonLoader = require('./lib/gulp-json-loader')(__dirname);

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
    // As a result, you will be able to access the <data> variable
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
```

### TODO
To avoid collisions with the same file names, we should split the responsibility of pages 
and libraries in the data directory using the nested paths cutting them with a dot symbol.
