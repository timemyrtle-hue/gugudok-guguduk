// 간단한 로컬 서버: node serve.js 후 http://localhost:5173 접속
// (마이크 음성 인식은 localhost 같은 보안 주소에서 가장 잘 동작해요)
var http = require('http');
var fs = require('fs');
var path = require('path');

var root = __dirname;
var types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.png': 'image/png' };

var server = http.createServer(function (req, res) {
  var url = decodeURIComponent(req.url.split('?')[0]);
  var file = path.join(root, url === '/' ? 'index.html' : url);
  if (file.indexOf(root) !== 0) { res.writeHead(403); return res.end(); }
  fs.readFile(file, function (err, data) {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
});
var port = process.env.PORT || 5173;
server.listen(port, function () { console.log('http://localhost:' + port); });
