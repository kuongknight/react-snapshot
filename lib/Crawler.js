'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* Loads a URL then starts looking for links.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      Emits a full page whenever a new link is found. */


var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _globToRegexp = require('glob-to-regexp');

var _globToRegexp2 = _interopRequireDefault(_globToRegexp);

var _chromy = require('chromy');

var _chromy2 = _interopRequireDefault(_chromy);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Crawler = function () {
  function Crawler(baseUrl, options) {
    _classCallCheck(this, Crawler);

    this.baseUrl = baseUrl;

    var _url$parse = _url2.default.parse(baseUrl),
        protocol = _url$parse.protocol,
        host = _url$parse.host;

    this.protocol = protocol;
    this.host = host;
    this.paths = [].concat(_toConsumableArray(options.include));
    this.exclude = options.exclude.map(function (g) {
      return (0, _globToRegexp2.default)(g, { extended: true, globstar: true });
    });
    this.processed = {};
    this.chromy = new _chromy2.default({ visible: false }).chain().console(function (text) {
      return console.log(text);
    });
  }

  _createClass(Crawler, [{
    key: 'crawl',
    value: function crawl(handler) {
      this.handler = handler;
      console.log('\uD83D\uDD77   Starting crawling ' + this.baseUrl);
      return this.snap().then(function () {
        console.log('\uD83D\uDD78   Finished crawling.');
        _chromy2.default.cleanup();
      });
    }
  }, {
    key: 'snap',
    value: function snap() {
      var _this = this;

      var urlPath = this.paths.shift();
      if (!urlPath) return Promise.resolve();
      urlPath = _url2.default.resolve('/', urlPath); // Resolve removes trailing slashes
      if (this.processed[urlPath]) {
        return this.snap();
      } else {
        this.processed[urlPath] = true;
      }

      return this.chromy.goto(this.protocol + '//' + this.host + urlPath).evaluate(function () {
        var tagAttributeMap = {
          'a': 'href',
          'iframe': 'src'
        };

        var html = window.document.documentElement.outerHTML;

        var urls = Object.keys(tagAttributeMap).reduce(function (arr, tagName) {
          var urlAttribute = tagAttributeMap[tagName];
          var elements = document.querySelectorAll(tagName + '[' + urlAttribute + ']');
          var urls = Array.from(elements).map(function (element) {
            if (element.getAttribute('target') === '_blank') return;
            return element.getAttribute(urlAttribute);
          });
          return arr.concat(urls);
        }, []);
        return {
          html: html,
          urls: urls
        };
      }).result(function (res) {
        res.urls.forEach(function (u) {
          var href = _url2.default.parse(u);
          if (href.protocol || href.host || href.path === null) return;
          var relativePath = _url2.default.resolve(urlPath, href.path);
          if (_path2.default.extname(relativePath) !== '.html' && _path2.default.extname(relativePath) !== '') return;
          if (_this.processed[relativePath]) return;
          if (_this.exclude.filter(function (regex) {
            return regex.test(relativePath);
          }).length > 0) return;
          _this.paths.push(relativePath);
        });
        _this.handler({ urlPath: urlPath, html: res.html });
      }).end().then(function () {
        return _this.snap();
      });
    }
  }]);

  return Crawler;
}();

exports.default = Crawler;
module.exports = exports['default'];