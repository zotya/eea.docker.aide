function addHeaders(){
    $("#facetview_results").append("<thead>" +
                                        "<tr>" +
                                            "<th>Details</th>"+
                                            "<th>Namespace</th>"+
                                            "<th>Station</th>"+
                                            "<th>AggregationType</th>"+
                                            "<th>ReportingMetric</th>"+
                                            "<th>Year</th>"+
                                            "<th>Pollutant</th>"+
                                            "<th>AQvalue</th>"+
                                            "<th>DataCapture</th>"+
                                            "<th>ValidityFlag</th>"+
                                            "<th>VerificationFlag</th>"+
                                            "<th>StationType</th>"+
                                            "<th>StationArea</th>"+
                                            "<th>StationLatitude</th>"+
                                            "<th>StationLongitude</th>"+
                                            "<th>AnalyticalTechnique</th>"+
                                            "<th>MeasurementType</th>"+
                                            "<th>InletHeight</th>"+
                                            "<th>KerbDistance</th>"+
                                            "<th>Zone</th>"+
                                            "<th>ZoneLabel</th>"+
                                            "<th>ZoneType</th>"+
                                            "<th>ZoneCountryLabel</th>"+
                                            "<th>SamplingPoint</th>"+
                                            "<th>Sample</th>"+
                                            "<th>Procedure</th>"+
                                        "</tr>"+
                                    "</thead>");
}

function fixQueries(){
    $(".detail_link").each(function(idx, detail_link){
        var href = $(detail_link).attr("href");
        var base = href.split("=")[0];
        var aideid = href.split("=")[1];
        $(detail_link)
            .attr("href", base + "=" + encodeURIComponent(aideid));
    });
}
function fixDataTitles(){
    var th_list = [];
    $("#facetview_results thead th").each(function(idx, th){
        th_list.push($(th).text());

    })
    $("#facetview_results tr").each(function(tr_idx, tr){
        $(tr).find("td").each(function(td_idx, td){
            $(td).attr("data-title", th_list[td_idx]);
        });
    });
}

function viewReady(){
    addHeaders();
    fixQueries();
    fixDataTitles();
}

jQuery(document).ready(function($) {
    var default_sort = [{}, {}];
    default_sort[0][field_base + 'inspireNamespace'] = {"order": 'asc'};
    default_sort[1][field_base + 'beginPosition_year'] = {"order": 'asc'};
    $('.facet-view-simple').facetview({
        search_url: './api',
        search_index: 'elasticsearch',
        datatype: 'json',
        initial_search: false,
        enable_rangeselect: true,
        enable_geoselect: true,
        default_sort: default_sort,
        rangefacets: [field_base + 'airqualityValue_aqvalue', field_base + 'datacapturePct_datacapture'],
        geofacets: [field_base + 'station_geo_pos'],
        post_init_callback: function() {
          add_EEA_settings();
        },
        post_search_callback: function() {
          add_EEA_settings();
          viewReady();
        },

        facets: [
//            {'field':'_id', 'display': '_id', 'order': 'term'},
            {'field':field_base + 'inspireNamespace', 'display': 'Namespace', 'size':'50', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'beginPosition_year', 'display': 'Year', 'size':'50', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']}, //?
            {'field':field_base + 'pollutant', 'display': 'Pollutant', 'size':'50', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'aggregationType', 'display': 'AggregationType', 'size':'50', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'airqualityValue_aqvalue', 'display': 'AQvalue', 'size':'10000000', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'datacapturePct_datacapture', 'display': 'DataCapture', 'size':'10000000', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'samplingPoint_stationtype', 'display': 'StationType', 'size':'50', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'station_stationarea', 'display': 'StationArea', 'size':'50', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'procedure_analyticaltechnique', 'display': 'AnalyticalTechnique', 'size':'50', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'samplingPoint_zone', 'display': 'Zone', 'size':'50', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'samplingPoint_zoneCountryLabel', 'display': 'ZoneCountryLabel', 'size':'50', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'station_geo_pos', 'display': 'Geo location', 'size':'2', 'order': 'term', 'facet_display_options': ['sort', 'checkbox'], 'operator':'OR'}
        ],


        result_display: [
            [
                {
                    'pre':'<a class="detail_link" href="./details?aideid=',
                    'field': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#about',
                    'post': '">Details</a></td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "inspireNamespace",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "station",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "aggregationType",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "aggregationType_reportingmetric",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "beginPosition_year",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "pollutant",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "airqualityValue_aqvalue",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "datacapturePct_datacapture",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "observationValidity",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "observationVerification",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "samplingPoint_stationtype",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "station_stationarea",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "station_lat_stationlatitude",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "station_lon_stationlongitude",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "procedure_analyticaltechnique",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "procedure_measurementtype",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "sample_inletHeight",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "sample_kerbdistance",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "samplingPoint_zone",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "samplingPoint_zoneLabel",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "samplingPoint_zoneType",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "samplingPoint_zoneCountryLabel",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "samplingPoint_samplingPoint",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "sample_sample",
                    'post': '</td>'
                },
                {
                    'pre': '<td>',
                    'field': field_base + "procedure_procedure",
                    'post': '</td>'
                }

            ]
        ],

        paging: {
            from: 0,
            size: 10
        }
    });

});
