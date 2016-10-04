"use strict";

var parse = require("../parse-bibtex.js");

var test = require("tape");

test("default-upper", function (t) {
    var result = parse("@Article{FooBAR, Foo={bar}}", {});
    t.deepEqual(result['FOOBAR'], {'FOO': 'bar', 'entryType': 'ARTICLE'});
    t.end();
});

test("lower", function (t) {
    var result = parse("@Article{FooBAR, Foo={bar}}", {directive_transform: function (s) {return s.toLowerCase();}});
    t.deepEqual(result['FOOBAR'], {'FOO': 'bar', 'entryType': 'article'});
    t.end();
});

test("null", function (t) {
    var result = parse("@Article{FooBAR, Foo={bar}}", {directive_transform: null});
    t.deepEqual(result['FOOBAR'], {'FOO': 'bar', 'entryType': 'Article'});
    t.end();
});