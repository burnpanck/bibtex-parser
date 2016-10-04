// Original work by Henrik Muehe (c) 2010
//
// CommonJS port by Mikola Lysenko 2013
//
// Update by Xavier Trochu <xavier.trochu@edpsciences.org> 2016:
//  allow a non strict mode which accepts simple strings without quotes as value.
//  add some other options for the parser

// Issues:
//  no comment handling within strings
//  no variable values yet

// Grammar implemented here:
//  bibtex -> (string | preamble | comment | entry)*;
//  string -> '@STRING' '{' key_equals_value '}';
//  preamble -> '@PREAMBLE' '{' value '}';
//  comment -> '@COMMENT' '{' value '}';
//  entry -> '@' key '{' key ',' key_value_list '}';
//  key_value_list -> key_equals_value (',' key_equals_value)*;
//  key_equals_value -> key '=' value;
//  value -> value_quotes | value_braces | key;
//  value_quotes -> '"' .*? '"'; // not quite
//  value_braces -> '{' .*? '"'; // not quite
(function () {
  "use strict";

  var defaults = {
    strict: true,
    key_rx: /[a-zA-Z0-9_:\\./\-+;'"&]/,
    key_transform: function (s) { return s.toUpperCase() },
    directive_transform: function (s) { return s.toUpperCase() },
    type_key: 'entryType',
    return_comments: true
  };

  function BibtexParser(opts) {

    var k;
    for (k in defaults) {
      this[k] = typeof opts !== "undefined" && opts !== null && typeof opts[k] !== "undefined" ? opts[k] : defaults[k];
    }

    this.entries = {};
    this.comments = [];
    this.strings = {
      JAN: "January",
      FEB: "February",
      MAR: "March",
      APR: "April",
      MAY: "May",
      JUN: "June",
      JUL: "July",
      AUG: "August",
      SEP: "September",
      OCT: "October",
      NOV: "November",
      DEC: "December"
    };
  }

  BibtexParser.prototype.setInput = function(t) {
    this.input = t;
    this.pos = 0;
  };

  BibtexParser.prototype.isWhitespace = function(s) {
    return (s == ' ' || s == '\r' || s == '\t' || s == '\n');
  };

  BibtexParser.prototype.match = function(s) {
    this.skipWhitespace();
    if (this.input.substring(this.pos, this.pos+s.length) == s) {
      this.pos += s.length;
    } else {
      throw "Token mismatch, expected " + s + ", found " + this.input.substring(this.pos);
    }
    this.skipWhitespace();
  };

  BibtexParser.prototype.tryMatch = function(s) {
    this.skipWhitespace();
    return this.input.substring(this.pos, this.pos + s.length) == s;
  };

  BibtexParser.prototype.skipWhitespace = function() {
    while (this.pos < this.input.length && this.isWhitespace(this.input[this.pos])) {
      this.pos++;
    }
    if (this.input[this.pos] == "%") {
      while(this.pos < this.input.length && this.input[this.pos] != "\n") {
        this.pos++;
      }
      this.skipWhitespace();
    }
  };

  BibtexParser.prototype.value_braces = function() {
    var bracecount = 0;
    this.match("{");
    var start = this.pos;
    while(true) {
      if (this.input[this.pos] == '}' && this.input[this.pos-1] != '\\') {
        if (bracecount > 0) {
          bracecount--;
        } else {
          var end = this.pos;
          this.match("}");
          return this.input.substring(start, end);
        }
      } else if (this.input[this.pos] == '{') {
        bracecount++;
      } else if (this.pos == this.input.length-1) {
        throw "Unterminated value";
      }
      this.pos++;
    }
  };

  BibtexParser.prototype.value_quotes = function() {
    this.match('"');
    var start = this.pos;
    while(true) {
      if (this.input[this.pos] == '"' && this.input[this.pos-1] != '\\') {
          var end = this.pos;
          this.match('"');
          return this.input.substring(start, end);
      } else if (this.pos == this.input.length-1) {
        throw "Unterminated value:" + this.input.substring(start);
      }
      this.pos++;
    }
  };

  BibtexParser.prototype.single_value = function() {
    var start = this.pos;
    if (this.tryMatch("{")) {
      return this.value_braces();
    } else if (this.tryMatch('"')) {
      return this.value_quotes();
    } else {
      var k = this.key();
      if (this.strings[k.toUpperCase()]) {
        return this.strings[k];
      } else if (!this.strict || k.match(/^[0-9]+$/)) {
        return k;
      } else {
        throw "Value expected:" + this.input.substring(start);
      }
    }
  };

  BibtexParser.prototype.value = function() {
    var values = [];
    values.push(this.single_value());
    while (this.tryMatch("#")) {
      this.match("#");
      values.push(this.single_value());
    }
    return values.join("");
  };

  BibtexParser.prototype.key = function(no_transform) {
    var start = this.pos;
    while(true) {
      if (this.pos == this.input.length) {
        throw "Runaway key";
      }
    
      if (this.input[this.pos].match(this.key_rx)) {
        this.pos++
      } else {
        var key = this.input.substring(start, this.pos);
        if (!no_transform && this.key_transform)
          key = this.key_transform(key);
        return key;
      }
    }
  };

  BibtexParser.prototype.key_equals_value = function() {
    var key = this.key();
    if (this.tryMatch("=")) {
      this.match("=");
      var val = this.value();
      return [ key, val ];
    } else {
      throw "... = value expected, equals sign missing:" + this.input.substring(this.pos);
    }
  };

  BibtexParser.prototype.key_value_list = function(entry) {
    var kv = this.key_equals_value();
    entry[kv[0]] = kv[1];
    while (this.tryMatch(",")) {
      this.match(",");
      // fixes problems with commas at the end of a list
      if (this.tryMatch("}")) {
        break;
      }
      kv = this.key_equals_value();
      entry[kv[0]] = kv[1];
    }
  };

  BibtexParser.prototype.entry_body = function(directive) {
    var key = this.key();
    var body = {};
    body[this.type_key] = directive.substring(1);
    this.entries[key] = body;
    this.match(",");
    this.key_value_list(body);
  };

  BibtexParser.prototype.directive = function () {
    this.match("@");
    var key = this.key(true);
    return "@"+key;
  };

  BibtexParser.prototype.string = function () {
    var kv = this.key_equals_value();
    this.strings[kv[0].toUpperCase()] = kv[1];
  };

  BibtexParser.prototype.preamble = function() {
    this.value();
  };

  BibtexParser.prototype.comment = function() {
    var start = this.pos;
    while(true) {
      if (this.pos == this.input.length) {
        throw "Runaway comment";
      }
    
      if (this.input[this.pos] != '}') {
        this.pos++
      } else {
        this.comments.push(this.input.substring(start, this.pos));
        return;
      }
    }
  };

  BibtexParser.prototype.entry = function(directive) {
    this.entry_body(directive);
  };

  BibtexParser.prototype.bibtex = function() {
    while(this.tryMatch("@")) {
      var directive = this.directive();
      var d = directive.toUpperCase();
      this.match("{");
      if (d == "@STRING") {
        this.string();
      } else if (d == "@PREAMBLE") {
        this.preamble();
      } else if (d == "@COMMENT") {
        this.comment();
      } else {
        if (this.directive_transform)
          directive = this.directive_transform(directive);
        this.entry(directive);
      }
      this.match("}");
    }

    if (this.return_comments)
      this.entries['@comments'] = this.comments;
  };

  //Runs the parser
  function doParse(input, opts) {
    var b = new BibtexParser(opts);
    b.setInput(input);
    b.bibtex();
    return b.entries
  }

  module.exports = doParse;
})();
