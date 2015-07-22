/*
 * GET home page.
 */


var nconf = require('nconf');

nconf.file({file:'/code/settings.json'});
var field_base = nconf.get("elastic:field_base");
var path = require('path');

var searchServer = require('eea-searchserver')

var fieldsMapping = [];
var mapping = require("../mapping.json");
var fieldsMapping = mapping.details_mapping;

exports.index = function(req, res){
  var options = {title: 'aide'};

  searchServer.EEAFacetFramework.render(req, res, 'index', options);
};

exports.details = function(req, res){

  if (req.query.aideid === undefined){
      res.send('aideid is missing');
      return;
  }

  var request = require('request');

  var host = "http://localhost:" + nconf.get('http:port');

//  var query = '{"query":{"ids":{"values":["' + req.query.aideid + '"]}}}';
  var query = '{"query":{"bool":{"must":[{"term":{"'+field_base + 'areURI":"'+req.query.aideid+'"}}]}}}';
  query = encodeURIComponent(query);
  var options = {
    host: host + "/api",
    path: "?source="+ query
  };
console.log(options)

  request(options.host + options.path, function (error, response, body) {
    console.log("1")
    if (!error && response.statusCode == 200) {
    console.log("2")
        try{
    console.log("3")
            var data = JSON.parse(body);
            tmp_resultobj = {};
            tmp_resultobj["records"] = [];

            for ( var item = 0; item < data.hits.hits.length; item++ ) {
    console.log("4")
                tmp_resultobj["records"].push(data.hits.hits[item]._source);
                tmp_resultobj["records"][tmp_resultobj["records"].length - 1]._id = data.hits.hits[item]._id;
            }
console.log(tmp_resultobj);
    console.log("5")
            resultobj = {};
            var value;
            for (var idx = 0; idx < fieldsMapping.length; idx++) {
    console.log("6")
console.log(field_base);
                console.log(idx);
                console.log(fieldsMapping[idx]['field']);
console.log(field_base);
                console.log(tmp_resultobj["records"][0][field_base + fieldsMapping[idx]['field']]);
                value = tmp_resultobj["records"][0][field_base + fieldsMapping[idx]['field']];
                label = fieldsMapping[idx]['title'];
console.log("6.1");
                if (label.substr(label.length - 5,5) === "_link"){
    console.log("7")
                    value = encodeURIComponent(value);
                }
console.log("6.2");
                resultobj[fieldsMapping[idx]['name']] = {'label':label, 'value':value};
console.log("6.3");
            }
    console.log("8")
            resultobj['exceedence_link'] = {'label':'exceedence_link', value:encodeURIComponent(resultobj['_id'].value)};
            resultobj['_shorttitle'].value = resultobj['_id'].value.split('/')[resultobj['_id'].value.split('/').length - 1];
            var options = {data: resultobj,
                        field_base: field_base};
            searchServer.EEAFacetFramework.render(req, res, 'details', options);

        }
        catch(err){
    console.log("9")
            var options = {data: "",
                        field_base: field_base,
                        aideid: req.query.aideid};
            searchServer.EEAFacetFramework.render(req, res, 'details', options);
        }

    }
    else {
    console.log("10")
        if (!error && response.statusCode !== 200){
    console.log("11")
            console.log(response.statusCode);
        }
        else {
    console.log("12")
            console.log(error);
        }
    }
  });

};
