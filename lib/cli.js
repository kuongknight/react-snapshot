'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _url = require('url');

var _url2 = _interopRequireDefault(_url);

var _Server = require('./Server');

var _Server2 = _interopRequireDefault(_Server);

var _Crawler = require('./Crawler');

var _Crawler2 = _interopRequireDefault(_Crawler);

var _Writer = require('./Writer');

var _Writer2 = _interopRequireDefault(_Writer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function () {
  var basePath = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : process.cwd();

  var pkg = JSON.parse(_fs2.default.readFileSync(_path2.default.join(basePath, 'package.json')));
  var basename = function (p) {
    return p.endsWith('/') ? p : p + '/';
  }(pkg.homepage ? _url2.default.parse(pkg.homepage).pathname : '');

  var options = Object.assign({
    include: [],
    exclude: []
  }, pkg.reactSnapshot || {});

  options.exclude = options.exclude.map(function (p) {
    return _path2.default.join(basename, p).replace(/\\/g, '/');
  });
  options.include = options.include.map(function (p) {
    return _path2.default.join(basename, p).replace(/\\/g, '/');
  });
  options.include.unshift(basename);

  var buildDir = _path2.default.resolve(basePath, './build');

  var writer = new _Writer2.default(buildDir);
  writer.move('index.html', '200.html');

  var server = new _Server2.default(buildDir, basename, 0, pkg.proxy);
  return server.start().then(function () {
    var crawler = new _Crawler2.default('http://localhost:' + server.port() + basename, options);
    return crawler.crawl(function (_ref) {
      var urlPath = _ref.urlPath,
          html = _ref.html;

      if (!urlPath.startsWith(basename)) {
        console.log('\u2757 Refusing to crawl ' + urlPath + ' because it is outside of the ' + basename + ' sub-folder');
        return;
      }
      urlPath = urlPath.replace(basename, '/');
      var filename = urlPath;
      if (urlPath.endsWith('/')) {
        filename = urlPath + 'index.html';
      } else if (_path2.default.extname(urlPath) === '') {
        filename = urlPath + '.html';
      }
      console.log('\u270F\uFE0F   Saving ' + urlPath + ' as ' + filename);
      writer.write(filename, html);
    });
  }).then(function () {
    return server.stop();
  }, function (err) {
    return console.log('\uD83D\uDD25 ' + err);
  });
};

module.exports = exports['default'];