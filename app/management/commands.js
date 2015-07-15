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
        slist = slist + '<' + results.results.bindings[i].s.value +'>'
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

    var SparqlClient = require('sparql-client');
    var client = new SparqlClient(config.endpoint);

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

function createIndexFromQuery() {
    var SparqlClient = require('sparql-client');
    var client = new SparqlClient(config.endpoint);

    var tmp_query = 'PREFIX rod: <http://rod.eionet.europa.eu/schema.rdf#>PREFIX skos: <http://www.w3.org/2004/02/skos/core#>PREFIX dcterms: <http://purl.org/dc/terms/>PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>PREFIX cr: <http://cr.eionet.europa.eu/ontologies/contreg.rdf#>PREFIX aq: <http://rdfdata.eionet.europa.eu/airquality/ontology/>PREFIX aqr: <http://reference.eionet.europa.eu/aq/ontology/> PREFIX aqdd: <http://dd.eionet.europa.eu/property/> SELECT DISTINCT ?Country ?Namespace (YEAR(?beginPosition) as ?ReportingYear) ?NetworkId ?NetworkName?StationId ?EUStationCode ?StationName ?SamplingPointId (bif:either(?AQD > 0,"YES","NO") as ?UsedForAQD) ?AggregationType ?ReportingMetric ?Pollutant (ROUND(?AQvalue * 100)/100.0 AS ?AQvalue) ?ExceedanceThreshold (REPLACE(str(?Unit),"http://dd.eionet.europa.eu/vocabulary/uom/concentration/","") as ?Unit) (ROUND(?DataCapture * 100)/100.0 AS ?DataCapture) ?VerificationFlag ?StationType ?StationArea ROUND(?StationLat * 10000)/10000.0 AS ?StationLatitude ROUND(?StationLong * 10000)/10000.0 AS ?StationLongitude?Zone?ZoneLabel?ZoneType?ZoneAdjustmentUsed(bif:either(?Exceedance > 0,"YES","NO") as ?ZoneDeclaredExceedance)  WHERE {{SELECT DISTINCT * WHERE {  ?areURI a aqr:AssessmentRegime;            dcterms:source ?source;            aqr:inspireId ?AssessmentId;            aqr:inspireNamespace ?Namespace;            aqr:pollutant ?PollutantURI;            aqr:zone ?ZoneURI;            aqr:assessmentMethods ?assMURI .OPTIONAL{?areURI aqr:assessmentThreshold ?assURI} . OPTIONAL{?ZoneURI aqr:zoneCode ?Zone} .OPTIONAL{?ZoneURI rdfs:label ?ZoneLabel} .OPTIONAL{?ZoneURI aqr:zoneType ?zonetypeURI} .OPTIONAL{?zonetypeURI rdfs:label ?ZoneType} .?assMURI aqr:assessmentType <http://dd.eionet.europa.eu/vocabulary/aq/assessmenttype/fixed> .     ?assMURI aqr:samplingPointAssessmentMetadata ?SamplingPointURI .?SamplingPointURI aqr:belongsTo ?NetURI .?SamplingPointURI aqr:broader ?staURI .?SamplingPointURI aqr:inspireId ?SamplingPointId .OPTIONAL{?SamplingPointURI aqr:relevantEmissions ?relemiURI} .OPTIONAL{?relemiURI aqr:stationClassification ?typeURI} .OPTIONAL{?typeURI rdfs:label ?StationType} .OPTIONAL{?NetURI aqr:inspireId ?NetworkId} .OPTIONAL{?NetURI aqr:name ?NetworkName} .?staURI aqr:inspireId ?StationId .?staURI aqr:EUStationCode ?EUStationCode .?staURI aqr:name ?StationName .?staURI aqr:areaClassification ?areaURI .?areaURI rdfs:label ?StationArea .OPTIONAL{?SamplingPointURI aqr:usedAQD ?AQD} .OPTIONAL{?assURI aqr:protectionTarget ?ProtectionTargetURI} .OPTIONAL{?assURI aqr:objectiveType ?ObjectiveTypeURI} .           OPTIONAL{?assURI aqr:reportingMetric ?ReportingMetricURI} .OPTIONAL{?ReportingMetricURI rdfs:label ?ReportingMetric} .OPTIONAL{?ObjectiveTypeURI rdfs:label ?ObjectiveType} .?statsURI aqr:samplingPoint ?SamplingPointURI .?statsURI aqr:airqualityValue ?AQvalue .?statsURI aqr:datacapturePct ?DataCapture .?statsURI aqr:observationVerification ?verURI .?verURI rdfs:label ?VerificationFlag .?statsURI aqr:aggregationType ?AggregationTypeURI .OPTIONAL{?AggregationTypeURI rdfs:label ?AggregationType} .?statsURI aqr:beginPosition ?beginPosition .?statsURI aqr:station_lat ?StationLat .?statsURI aqr:station_lon ?StationLong .OPTIONAL{?statsURI aqr:unit ?Unit} .?envelope rod:hasFile ?source .?envelope rod:obligation <http://rod.eionet.europa.eu/obligations/671> .?envelope rod:locality ?locURI .?locURI rdfs:label ?Country .?thresURI aqdd:relatedPollutant ?PollutantURI .?thresURI aqdd:aggregationProcess ?AggregationTypeURI .?thresURI aqdd:hasReportingMetric ?ReportingMetricURI .?thresURI aqdd:exceedanceThreshold ?ExceedanceThreshold .?attURI a aqr:Attainment ;aqr:inspireId ?AttainmentId ;aqr:environmentalObjective ?envURI ;aqr:assessment ?areURI ;aqr:zone ?ZoneURI ;aqr:pollutant ?PollutantURI .?areURI aqr:inspireId ?AssessmentId .?PollutantURI skos:notation ?Pollutant .OPTIONAL{?attURI aqr:exceedanceFinal ?Exceedance} .OPTIONAL{?attURI aqr:finalDeductionMethod ?corrURI} .OPTIONAL{?corrURI rdfs:label ?ZoneAdjustmentUsed} .OPTIONAL{?envURI aqr:reportingMetric ?ReportingMetricURI} .OPTIONAL{?envURI aqr:objectiveType ?ObjectiveTypeURI} .OPTIONAL{?envURI aqr:protectionTarget ?ProtectionTargetURI} .OPTIONAL{?AggregationTypeURI aqdd:broaderMetric ?ReportingMetricURI} .FILTER regex(?Namespace,"ES.BDCA.AQD") .FILTER regex(?PollutantURI, "http://dd.eionet.europa.eu/vocabulary/aq/pollutant/7$") .FILTER (YEAR(?beginPosition) = 2013) .}} } ORDER BY ?Country ASC(?PollutantURI) DESC(?AggregationType) limit 1'

    client.query(tmp_query).execute(function(error, results){
        for (var i = 0; i < results.results.bindings.length; i++){
            var toindex = {};
            for (var j = 0; j < results.head.vars.length; j++){
                if (results.results.bindings[i][results.head.vars[j]] !== undefined){
                    toindex[results.head.vars[j]] = results.results.bindings[i][results.head.vars[j]].value;
                }
            }
            console.log(toindex);
        }
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
    console.log(' help: Show this menux');
    console.log('');
}

module.exports = { 
    'remove_river': removeRiver,
    'remove_data': removeData,
    'reindex': reindex,
    'create_index': createIndex,
    'create_index_from_query': createIndexFromQuery,
    'help': showHelp
}
