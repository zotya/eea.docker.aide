var elastic_settings = require('nconf').get('elastic');

var esAPI = require('eea-searchserver').esAPI;

var analyzers = require('./river_config/analyzers.js');
var config = require('./river_config/config.js');

var syncReq = {
    "type": "eeaRDF",
    "eeaRDF" : {
        "endpoint" : config.endpoint,
        "queryType" : config.queryType,
        "query" : [],
        "addLanguage" : false,
        "includeResourceURI" : true,
        "normProp" : config.normProp

    },
    "index" : {
        "index" : elastic_settings.index,
        "type" : elastic_settings.type
    }
};

function getOptions() {
    var nconf = require('nconf')
    var elastic = nconf.get()['elastic'];
    return {
        'es_host': elastic.host + ':' + elastic.port + elastic.path
    };
}

var analyzers = analyzers.mappings;

var callback = function(text) {
    return function(err, statusCode, header, body) {
        console.log(text);
        if (err) {
            console.log(err.message);
        } else {
            console.log('  Successfuly ran query');
            console.log('  ResponseCode: ' + statusCode);
            console.log('  ' + body);
        }
    };
}

function removeRiver() {
    new esAPI(getOptions())
        .DELETE('_river/aide', callback('Deleting river! (if it exists)'))
        .execute();
}

function removeData() {
    var elastic = require('nconf').get('elastic');
    new esAPI(getOptions())
        .DELETE(elastic.index, callback('Deleting index! (if it exists)'))
        .execute();
}

function buildQueries(results) {
    var slist = "";
    var step = 0;
    for (var i = 0; i < results.results.bindings.length; i++){
        if (step > 0){
            slist = slist + ", ";
        }
        slist = slist + '"' + results.results.bindings[i].s.value +'"'
        step++;
        if ((step === config.filterLength) || (i === results.results.bindings.length - 1)){
            var filter = config.filterTemplate.split("<slist>").join(slist);
            var query = config.queryTemplate.split("<filter>").join(filter);
            syncReq.eeaRDF.query.push(query);
            step = 0;
            slist = "";
        }
    }
}

function reindex() {
    var elastic = require('nconf').get('elastic');

    client.query(config.sQuery)
        .execute(function(error, results){
            buildQueries(results);
            new esAPI(getOptions())
                .DELETE(elastic.index, callback('Deleting index! (if it exists)'))
                .PUT(elastic.index, analyzers,
                     callback('Setting up new index and analyzers'))
                .DELETE('_river/aide', callback('Deleting river! (if it exists)'))
                .PUT('_river/aide/_meta', syncReq, callback('Adding river back'))
                .execute();
        });
}

function createIndex() {
    var elastic = require('nconf').get('elastic');

    var SparqlClient = require('sparql-client');
    var client = new SparqlClient(config.endpoint);

    client.query(config.sQuery)
        .execute(function(error, results){
            buildQueries(results);
            new esAPI(getOptions())
                .PUT(elastic.index, analyzers,
                     callback('Setting up new index and analyzers'))
                .DELETE('_river/aide', callback('Deleting river! (if it exists)'))
                .PUT('_river/aide/_meta', syncReq, callback('Adding river back'))
                .execute();
        });
}

function showHelp() {
    console.log('List of available commands:');
    console.log(' runserver: Run the app web server');
    console.log('');
    console.log(' create_index: Setup Elastic index and trigger indexing');
    console.log(' reindex: Remove data and recreate index');
    console.log('');
    console.log(' remove_data: Remove the ES index of this application');
    console.log(' remove_river: Remove the running river indexer if any');
    console.log('');
    console.log(' help: Show this menu');
    console.log('');
}

module.exports = { 
    'remove_river': removeRiver,
    'remove_data': removeData,
    'reindex': reindex,
    'create_index': createIndex,
    'help': showHelp
}
