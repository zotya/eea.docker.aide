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
var fieldsMapping = mapping.fields_mapping;
var details_settings = mapping.details_settings;

exports.index = function(req, res){
  var options = {title: 'aide'};

  searchServer.EEAFacetFramework.render(req, res, 'index', options);
};


exports.details = function(req, res){
  function sort_elements(a, b) {
    return a.pos - b.pos
  }

  if (req.query.aideid === undefined){
      res.send('aideid is missing');
      return;
  }

  var request = require('request');

  var host = "http://localhost:" + nconf.get('http:port');

  var query = '{"query":{"ids":{"values":["' + req.query.aideid + '"]}}}';
//  var query = '{"query":{"bool":{"must":[{"term":{"'+field_base + 'areURI":"'+req.query.aideid+'"}}]}}}';
  query = encodeURIComponent(query);
  var options = {
    host: host + "/api",
    path: "?source="+ query
  };

  sections = details_settings.sections;
  sections.sort(sort_elements);
  var details_fields = {};
  for (var idx = 0; idx < fieldsMapping.length; idx++) {
    if (fieldsMapping[idx].details.visible){
      if (details_fields[fieldsMapping[idx].details.section] === undefined){
        details_fields[fieldsMapping[idx].details.section] = []
      }
      fieldsMapping[idx].details.name = fieldsMapping[idx].name;
      details_fields[fieldsMapping[idx].details.section].push(fieldsMapping[idx].details)
    }
  }
  for (var idx = 0; idx < sections.length; idx++){
    details_fields[sections[idx].name].sort(sort_elements);
    sections[idx].fields = details_fields[sections[idx].name];
  }
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
                value = tmp_resultobj["records"][0][field_base + fieldsMapping[idx]['name']];
                label = fieldsMapping[idx]['details']['title'];

                if (label.substr(label.length - 5,5) === "_link"){
                    value = encodeURIComponent(value);
                }

                resultobj[fieldsMapping[idx]['name']] = {'label':label, 'value':value};
            }
//            resultobj['_shorttitle'].value = resultobj['_id'].value.split('/')[resultobj['_id'].value.split('/').length - 1];
            resultobj['_shorttitle'] = {label:'_shorttitle', value : resultobj['_id'].value}
            var options = {data: resultobj,
                        field_base: field_base,
                        sections: sections};
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
