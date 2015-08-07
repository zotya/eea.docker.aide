/*
 * GET home page.
 */


var nconf = require('nconf');

nconf.file({file:'/code/settings.json'});
var field_base = nconf.get("elastic:field_base");
var path = require('path');

var searchServer = require('eea-searchserver')

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


  searchServer.EEAFacetFramework.getSections(function(sections){
    var fieldsMapping = [];
    for (var sections_idx = 0; sections_idx < sections.length; sections_idx++){
        for (var fields_idx = 0; fields_idx < sections[sections_idx].fields.length; fields_idx++){
            fieldsMapping.push(sections[sections_idx].fields[fields_idx]);
        }
    }
    searchServer.EEAFacetFramework.getLinks(function(links){
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
                        label = fieldsMapping[idx]['title'];

                        if (label.substr(label.length - 5,5) === "_link"){
                            value = encodeURIComponent(value);
                        }

                        resultobj[fieldsMapping[idx]['name']] = {'label':label, 'value':value};
                    }

                    resultobj['_shorttitle'] = {label:'_shorttitle', value : tmp_resultobj["records"][0]['_id'].value}
                    for (var idx = 0; idx < links.length; idx++) {
                        value = tmp_resultobj["records"][0][field_base + links[idx]['name']];
                        if (value !== undefined){
                            value = encodeURIComponent(value);
                            if (resultobj[links[idx].link_for] !== undefined) {
                                resultobj[links[idx].link_for].link = value;
                            }
                        }
                    }
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
    });
  });

};
