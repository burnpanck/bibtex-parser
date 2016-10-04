"use strict";

var parse = require("../parse-bibtex.js");

var test = require("tape");

test("string", function (t) {
    var result = parse("@string { bar = {Foobar}}\n@Article{FooBAR, Foo=bar}", {});
    t.deepEqual(result['FOOBAR'], {'FOO': 'Foobar', 'entryType': 'ARTICLE'});
    t.end();
});

test("concat", function (t) {
    var result = parse("@string { bar = {Foobar}}\n@Article{FooBAR, Foo=bar # {baz}}", {});
    t.deepEqual(result['FOOBAR'], {'FOO': 'Foobarbaz', 'entryType': 'ARTICLE'});
    t.end();
});
