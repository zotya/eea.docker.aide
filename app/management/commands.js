var elastic_settings = require('nconf').get('elastic');

var esAPI = require('eea-searchserver').esAPI;

var analyzers = require('./river_config/analyzers.js');
var config = require('./river_config/config.js');

function getOptions() {
    var nconf = require('nconf')
    var elastic = nconf.get()['elastic'];
    return {
        'es_host': elastic.host + ':' + elastic.port + elastic.path
    };
}

var analyzers = analyzers.mappings;

var callback = function(text, showBody) {
    if (showBody === undefined){
        showBody = true;
    }
    return function(err, statusCode, header, body) {
        console.log(text);
        if (err) {
            console.log(err.message);
        } else {
            console.log('  Successfuly ran query');
            console.log('  ResponseCode: ' + statusCode);
            if (showBody === true){
                console.log('  ' + body);
            }
        }
    };
}

function removeData() {
    var elastic = require('nconf').get('elastic');
    new esAPI(getOptions())
        .DELETE(elastic.index, callback('Deleting index! (if it exists)'))
        .execute();
}

function fetchQuery(query, fetchcallback) {
    var batch_head = '{"index":{}}'

    var elastic = require('nconf').get('elastic');
    var SparqlClient = require('sparql-client');
    var client = new SparqlClient(config.endpoint);

    client.query(query).execute(function(error, results){
        var rows_str = "";
        for (var i = 0; i < results.results.bindings.length; i++){
            var toindex = {};
            for (var j = 0; j < results.head.vars.length; j++){
                if (results.results.bindings[i][results.head.vars[j]] !== undefined){
                    toindex[results.head.vars[j]] = results.results.bindings[i][results.head.vars[j]].value;
                }
            }
            rows_str += batch_head.split("{}").join('{"_id":"' + results.results.bindings[i]["_id"].value + '"}');
            rows_str += "\n";
            rows_str += JSON.stringify(toindex);
            rows_str += "\n";
        }
        new esAPI(getOptions())
            .POST(elastic.index+"/"+elastic.type+"/_bulk", rows_str, callback("indexed " + results.results.bindings.length + " rows", false))
            .execute();
        fetchcallback(results.results.bindings.length);
    });
}

var bigTotal = 0;
function fetchQueries(queries, idx){
    if (idx === undefined){
        idx = 0;
    }

    if (idx === queries.length){
        return;
    }
    console.log("Fetching query #", idx + 1, " of ", queries.length);
    console.log("Filters:");
    console.log(queries[idx].filters);
    fetchQuery(queries[idx].query, function(indexed){
        bigTotal += indexed;
        console.log("Total indexed:", bigTotal);
        fetchQueries(queries, idx + 1)
    });
}

function createQueries(base_query, filters_query, callback){
    var queries = [];
    var elastic = require('nconf').get('elastic');
    var SparqlClient = require('sparql-client');
    var client = new SparqlClient(config.endpoint);
    client.query(filters_query).execute(function(error, results){
        for (var i = 0; i < results.results.bindings.length; i++){
            var tmp_query = {query:base_query, filters:{}};
            for (var j = 0; j < results.head.vars.length; j++){
                var attr = results.head.vars[j];
                var value = results.results.bindings[i][results.head.vars[j]].value;
                tmp_query.query = tmp_query.query.split("<" + attr + ">").join(value);
                tmp_query.filters[attr] = value;
            }
            queries.push(tmp_query);
        }
        callback(queries);
    });
}

function createIndex() {
    var elastic = require('nconf').get('elastic');
    var SparqlClient = require('sparql-client');
    var client = new SparqlClient(config.endpoint);
    var elastic = require('nconf').get('elastic');
    createQueries(config.queryTemplate, config.filtersQuery, function(queries){
        new esAPI(getOptions())
            .DELETE(elastic.index, callback('Deleting index (if it exists)'))
            .PUT(elastic.index, analyzers, 
                    function(){
                        fetchQueries(queries);
                    })
            .execute();
    });
}

function showHelp() {
    console.log('List of available commands:');
    console.log(' runserver: Run the app web server');
    console.log('');
    console.log(' create_index: Setup Elastic index and trigger indexing');
    console.log('');
    console.log(' remove_data: Remove the ES index of this application');
    console.log('');
    console.log(' help: Show this menux');
    console.log('');
}

module.exports = { 
    'remove_data': removeData,
    'create_index': createIndex,
    'help': showHelp
}
