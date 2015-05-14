/**
 * Created by stopka on 26.3.15.
 */
(function () {
    var app = angular.module('detail', []);
    app.filter('escapeHtml', function($sce) {
        return function(val) {
            return $sce.trustAsHtml(val);
        };
    });
    app.controller('DetailController', [ '$http','$location','$log', function ($http,$location,$log) {
        var detail = this;

        //document specifying variables
        detail.form = {
            id: null,
            core: null,
            query: ""
        };

        //Higlighted content text
        detail.highlight = null;

        //Document data
        detail.doc = null;

        //More like this documents
        detail.similars = {};

        //Builds link to open document detail
        detail.getDocLink=function(doc){
            return 'detail.html#?id='+doc.id+'&core='+detail.form.core;
        };

        //parses url to variables
        detail.parseLocation=function(){
            data = $location.search();
            $log.debug(data);
            detail.loading=true;
            detail.form.id=data['id'];
            detail.form.core=data['core'];
            if(typeof data['query'] !== 'undefined') {
                detail.form.query=data['query'];
            }
        };

        //initial loading
        detail.onStart=function(){
            detail.parseLocation();
            detail.search();
        };

        //loads documet data from server
        detail.search = function () {
            form = detail.form;
            params="";
            detail.loading=true;
            $http.get('/solr/'+encodeURI(form.core)+'/detail?wt=json&q='+encodeURI('id:"'+form.id+'" '+form.query)).success(function (data) {
                if(typeof data.response.docs[0] !== 'undefined'){
                    detail.doc = data.response.docs[0];
                }
                if(typeof data.highlighting[detail.form.id] !== 'undefined') {
                    detail.highlight = data.highlighting[detail.form.id];
                }
                if(typeof data.moreLikeThis[detail.form.id] !== 'undefined') {
                    detail.similars = data.moreLikeThis[detail.form.id];
                }
                detail.loading=false;
            })
        };

        //init!
        detail.onStart();
    }]);
})();