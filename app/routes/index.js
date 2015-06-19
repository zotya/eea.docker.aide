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

  var query = '{"query":{"ids":{"values":["' + req.query.aideid + '"]}}}';
  query = encodeURIComponent(query);
  var options = {
    host: host + "/api",
    path: "?source="+ query
  };

  request(options.host + options.path, function (error, response, body) {
    if (!error && response.statusCode == 200) {
        try{
            var data = JSON.parse(body);
            tmp_resultobj = {};
            tmp_resultobj["records"] = [];

            for ( var item = 0; item < data.hits.hits.length; item++ ) {
                tmp_resultobj["records"].push(data.hits.hits[item]._source);
                tmp_resultobj["records"][tmp_resultobj["records"].length - 1]._id = data.hits.hits[item]._id;
            }
            resultobj = {};
            var value;
            for (var idx = 0; idx < fieldsMapping.length; idx++) {
                value = tmp_resultobj["records"][0][field_base + fieldsMapping[idx]['field']];
                label = fieldsMapping[idx]['title'];
                if (label.substr(label.length - 5,5) === "_link"){
                    value = encodeURIComponent(value);
                }
                resultobj[fieldsMapping[idx]['name']] = {'label':label, 'value':value};
            }
            resultobj['exceedence_link'] = {'label':'exceedence_link', value:encodeURIComponent(resultobj['_id'].value)};
            resultobj['_shorttitle'].value = resultobj['_id'].value.split('/')[resultobj['_id'].value.split('/').length - 1];
            var options = {data: resultobj,
                        field_base: field_base};
            searchServer.EEAFacetFramework.render(req, res, 'details', options);

        }
        catch(err){
            var options = {data: "",
                        field_base: field_base,
                        aideid: req.query.aideid};
            searchServer.EEAFacetFramework.render(req, res, 'details', options);
        }

    }
    else {
        if (!error && response.statusCode !== 200){
            console.log(response.statusCode);
        }
        else {
            console.log(error);
        }
    }
  });

};
