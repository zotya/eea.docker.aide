function addHeaders(){
    $("#facetview_results").append("<thead>" +
                                        "<tr>" +
                                            "<th>Details</th>"+
                                            "<th>Country</th>"+
                                            "<th>Namespace</th>"+
                                            "<th>Reporting Year</th>"+
                                            "<th>Network Id</th>"+
                                            "<th>Network Name</th>"+
                                            "<th>Station Id</th>"+
                                            "<th>EU Station Code</th>"+
                                            "<th>Station Name</th>"+
                                            "<th>Sampling Point Id</th>"+
                                            "<th>Used For AQD</th>"+
                                            "<th>Aggregation Type</th>"+
                                            "<th>Reporting Metric</th>"+
                                            "<th>Pollutant</th>"+
                                            "<th>AQ Value</th>"+
                                            "<th>Exceedance Threshold</th>"+
                                            "<th>Unit</th>"+
                                            "<th>Data Capture</th>"+
                                            "<th>Verification Flag</th>"+
                                            "<th>Station Type</th>"+
                                            "<th>Station Area</th>"+
                                            "<th>Station Latitude</th>"+
                                            "<th>Station Longitude</th>"+
                                            "<th>Zone</th>"+
                                            "<th>Zone Label</th>"+
                                            "<th>Zone Type</th>"+
                                            "<th>Zone Adjustment Used</th>"+
                                            "<th>Zone Declared Exceedance</th>"+
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
    default_sort[0][field_base + 'Namespace'] = {"order": 'asc'};
    default_sort[1][field_base + 'ReportingYear'] = {"order": 'asc'};
    $('.facet-view-simple').facetview({
        search_url: './api',
        search_index: 'elasticsearch',
        datatype: 'json',
        initial_search: false,
        enable_rangeselect: true,
        enable_geoselect: true,
        default_sort: default_sort,
        rangefacets: [field_base + 'AQvalue', field_base + 'DataCapture'],
        geofacets: [field_base + 'geo_pos'],
        post_init_callback: function() {
          add_EEA_settings();
        },
        post_search_callback: function() {
          add_EEA_settings();
          viewReady();
        },

        facets: [
            {'field':field_base + 'Country', 'display': 'Country', 'size':'40', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'ReportingYear', 'display': 'Reporting Year', 'size':'5', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'Pollutant', 'display': 'Pollutant', 'size':'14', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'AggregationType', 'display': 'Aggregation Type', 'size':'10', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'AQvalue', 'display': 'AQ Value', 'size':'10000000', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'DataCapture', 'display': 'Data Capture', 'size':'10000000', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'StationType', 'display': 'Station Type', 'size':'4', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'StationArea', 'display': 'Station Area', 'size':'50', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'UsedForAQD', 'display': 'Used For AQD', 'size':'2', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'Zone', 'display': 'Zone', 'size':'10', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'ZoneType', 'display': 'Zone Type', 'size':'3', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'ZoneDeclaredExceedance', 'display': 'Zone Declared Exceedance', 'size':'2', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'ZoneAdjustmentUsed', 'display': 'Zone Adjustment Used', 'size':'2', 'order': 'term', 'facet_display_options': ['sort', 'checkbox']},
            {'field':field_base + 'geo_pos', 'display': 'Geo location', 'size':'2', 'order': 'term', 'facet_display_options': ['sort', 'checkbox'], 'operator':'OR'}
        ],

        result_display: [
        [
            {
                'pre':'<a class="detail_link" href="./details?aideid=',
                'field': 'areURI',
                'post': '">Details</a></td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "Country",
                'post': '</td>'
            },
            {
                'pre': '<td class="yyyyyyyyyyY">',
                'field': field_base + "Namespace",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "ReportingYear",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "NetworkId",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "NetworkName",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "StationId",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "EUStationCode",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "StationName",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "SamplingPointId",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "UsedForAQD",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "AggregationType",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "ReportingMetric",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "Pollutant",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "AQvalue",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "ExceedanceThreshold",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "Unit",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "DataCapture",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "VerificationFlag",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "StationType",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "StationArea",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "StationLatitude",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "StationLongitude",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "Zone",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "ZoneLabel",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "ZoneType",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "ZoneAdjustmentUsed",
                'post': '</td>'
            },
            {
                'pre': '<td>',
                'field': field_base + "ZoneDeclaredExceedance",
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
