var async = require('async');
var fs = require('fs');
var request = require('superagent');
var cheerio = require('cheerio');

var cloneIdToGenbank = function(id, cb) {
  request.get('http://www.informatics.jax.org/searchtool/Search.do?query=' + id)
    .end(function(err, res) {
      if (!res) {
        return cb(null);
      }

      var $ = cheerio.load(res.text);
      var ret = [];
      $('td:contains("Other Results By ID")').closest('table').find('td:nth-child(2)').each(function() {
        var text = $(this).text();
        var res = text.match(/[A-Z]{2}[0-9]{6}/g);
        if (res && res[0]) {
          ret.push(res[0]);
        }
      });
      return cb(ret);
    });
};

fs.readFile('ids.txt', function(err, data) {
  var lines = data.toString().split('\n');

  var ret = {};
  var num = 0;

  function update(id, genbank) {
    console.log('Found ids for ' + (++num) + ' with ' + id + ' -- ' + genbank);

    if (num % 20 == 0) {

      fs.writeFile('results.txt', JSON.stringify(ret), function() {
        console.log('Wrote file.');
      });

    }
  }

  async.eachLimit(lines, 10, function(line, done) {
    if (line == '') {
      done();
    }

    console.log('Waiting on ' + line);

    cloneIdToGenbank(line, function(genbank) {
      ret[line] = genbank;
      update(line, genbank);
      done();
    });

  }, function() {

    fs.writeFile('results.txt', JSON.stringify(data), function() {
      console.log('Done!');
    });

  });

});
