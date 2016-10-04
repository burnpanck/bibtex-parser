"use strict";

var parse = require("../parse-bibtex.js");

var test = require("tape");

test("default-upper", function (t) {
    var result = parse("@ARTICLE{FooBAR, Foo={bar}}", {});
    t.deepEqual(result['FOOBAR'], {'FOO': 'bar', 'entryType': 'ARTICLE'});
    t.end();
});

test("lower", function (t) {
    var result = parse("@ARTICLE{FooBAR, Foo={bar}}", {key_transform: function (s) {return s.toLowerCase();}});
    t.deepEqual(result['foobar'], {'foo': 'bar', 'entryType': 'ARTICLE'});
    t.end();
});

test("null", function (t) {
    var result = parse("@ARTICLE{FooBAR, Foo={bar}}", {key_transform: null});
    t.deepEqual(result['FooBAR'], {'Foo': 'bar', 'entryType': 'ARTICLE'});
    t.end();
});