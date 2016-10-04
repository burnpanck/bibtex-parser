"use strict";

var parse = require("../parse-bibtex.js");

var test = require("tape");

var fs = require("fs");


fs.readdir(__dirname + "/samples", function (err, files) {
  files.forEach(function (file) {
    var content = fs.readFileSync(__dirname + "/samples/" + file).toString();
    test(file, function (t) {
      var parsed;
      t.doesNotThrow(function () {
          var parsed = parse(content, {strict: false, key_transform: String.prototype.toLowerCase})
          var names = [];
          for (var key in parsed)
              if (parsed.hasOwnProperty(key) && key != "@comments")
                  names.push(key);
          t.ok(parsed, "parsed something");
          t.equal(typeof parsed, "object");
          t.ok(parsed['@comments'], "@comments entry exists");
          t.ok(names.length > 0, "response has more than comments");
      });
      t.end();
    })
  })
});
