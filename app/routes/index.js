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

  var host = "http://localhost:" + nconf.get('http:port');

  var query = '{"query":{"ids":{"values":["' + req.query.aideid + '"]}}}';
  query = encodeURIComponent(query);
  var options = {
    host: host + "/api",
    path: "?source="+ query
  };


  searchServer.EEAFacetFramework.renderDetails({
    req:req,
    res:res,
    field_base:field_base,
    options:options,
    prerender:function(tmp_options){
        tmp_options.data['_shorttitle'] = {label:'_shorttitle', value : req.query.aideid.split("/")[req.query.aideid.split("/").length-1]}
        return(tmp_options);
    },
    error_fallback:function(tmp_options){
        tmp_options.aideid = req.query.aideid.split("/")[req.query.aideid.split("/").length-1];
        return(tmp_options);
    }
  });

};
