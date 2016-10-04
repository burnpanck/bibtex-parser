"use strict";

var parse = require("../parse-bibtex.js");

var test = require("tape");

test("strict", function (t) {
    t.throws(function () {var result = parse("@ARTICLE{FooBAR, Foo=bar}", {});}, /Value expected:bar/);
    t.end();
});

test("non-strict", function (t) {
    t.doesNotThrow(function () {var result = parse("@ARTICLE{FooBAR, Foo=bar}", {strict:false});}, /expected value/);
    t.end();
});
