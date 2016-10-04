"use strict";

var parse = require("../parse-bibtex.js");

var test = require("tape");

test("default", function (t) {
    t.doesNotThrow(function () {
        var result = parse("@Article{Foo&BAR, Foo={bar}}", {});
        t.deepEqual(result['FOO&BAR'], {'FOO': 'bar', 'entryType': 'ARTICLE'});
    });
    t.end();
});

test("limited", function (t) {
    t.throws(function () {
        var result = parse("@Article{Foo&BAR, Foo={bar}}", {key_rx: /[a-zA-Z]/});
        t.deepEqual(result['FOO&BAR'], {'FOO': 'bar', 'entryType': 'ARTICLE'});
    }, /Token mismatch, expected ,, found &BAR/);
    t.end();
});

test("extra", function (t) {
    t.throws(function () {
        var result = parse("@Article{Foo>BAR, Foo={bar}}", {});
        t.deepEqual(result['FOO&BAR'], {'FOO': 'bar', 'entryType': 'ARTICLE'});
    }, /Token mismatch, expected ,, found >BAR/);
    t.end();
});

test("nothrow", function (t) {
    t.throws(function () {
        var result = parse("@Article{Foo>BAR, Foo={bar}}", {key_rx: /[^%, ]/});
        t.deepEqual(result['FOO&BAR'], {'FOO': 'bar', 'entryType': 'ARTICLE'});
    });
    t.end();
});
