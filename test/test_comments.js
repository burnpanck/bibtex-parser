"use strict";

var parse = require("../parse-bibtex.js");

var test = require("tape");

test("comments", function (t) {
    var result = parse("@ARTICLE{FooBAR, Foo={bar}}", {});
    t.deepEqual(result['@comments'], []);
    t.end();
});

test("add-comments", function (t) {
    var result = parse("@comment{foo}\n@ARTICLE{FooBAR, Foo={bar}}", {});
    t.deepEqual(result['@comments'], ['foo']);
    t.end();
});

test("no-comments", function (t) {
    var result = parse("@ARTICLE{FooBAR, Foo={bar}}", {return_comments: false});
    t.equal(typeof result['@comments'], "undefined");
    t.end();
});

