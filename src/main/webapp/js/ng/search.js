/**
 * Created by stopka on 26.3.15.
 */
(function () {
    var app = angular.module('search', []);
    app.filter('escapeHtml', function($sce) {
        return function(val) {
            return $sce.trustAsHtml(val);
        };
    });
    app.controller('SearcherController', [ '$http','$location','$log', function ($http,$location,$log) {
        var searcher = this;

        //is data loading
        searcher.loading=true;

        // retrieved sorl cores
        searcher.cores = {};

        //form input variables
        searcher.form = {
            solrhost:"http://localhost:8080/solr",
            core: "",
            query: "",
            advanced: {
                enabled: false,
                clustering: {
                    engine: ''
                }
            }
        };

        //retrived search result
        searcher.response = {};

        //higlighted content text snippets
        searcher.highlights = {};

        //filtered documents to show
        searcher.results = [];

        //cluster data retrieved
        searcher.clusters = {
            selected: true,
            list: []
        };

        //holds paging info
        searcher.pager={
            rows: 30,
            page: 0,

            //counts number of pages of search results
            getPagesCount: function(){
                if(searcher.response==null||searcher.response.numFound==0){
                    return 0;
                }
                return Math.ceil(searcher.response.numFound/this.rows);
            },
            //builds part of query to retrieve selected page
            getQuery: function(){
                return '&start='+(this.rows*this.page)+'&rows='+this.rows;
            },
            //return list of pages to show
            get: function(){
                result=[];
                for(i=Math.max(this.page-7,0);i<Math.min(this.page+7,this.getPagesCount());i++){
                    result.push(i);
                }
                return result;
            },
            //sets current page
            //+ -: increments or decrements; ++ -- last or first
            set: function(val){
                max=this.getPagesCount();
                if(val==='+'){
                    this.page++;
                }
                if(val==='++'){
                    this.page=max-1;
                }
                if(val==='--'){
                    this.page=0;
                }
                if(typeof(val) == "number"){
                    this.page=val;
                }
                if(this.page<0){
                    this.page=0;
                }
                if(this.page>=max){
                    this.page=max-1;
                }
                searcher.search();
            }
        };

        //service to load availible cores
        $http.get(searcher.form.solrhost+'/admin/cores?wt=json').success(function (data) {
            searcher.cores = data.status;
            searcher.form.core = data.defaultCoreName;
            searcher.parseLocation();
            searcher.search();
        });

        //creates link to open document detail
        searcher.getDocLink=function(doc){
            return 'detail.html#?id='+doc.id+'&core='+searcher.form.core+'&query='+searcher.form.query;
        };

        //parses location and sets state variables
        searcher.parseLocation=function(){
            data = $location.search();
            $log.debug(data);
            if(typeof data['page'] !== 'undefined'){
                searcher.pager.page=data['page'];
            }
            if(typeof data['core'] !== 'undefined'){
                searcher.form.core=data['core'];
            }
            if(typeof data['query'] !== 'undefined') {
                searcher.form.query=data['query'];
            }
            if(typeof data['advanced.enabled'] !== 'undefined') {
                searcher.form.advanced.enabled=data['advanced.enabled'];
            }
            if(typeof data['advanced.clustering.engine'] !== 'undefined') {
                searcher.form.advanced.clustering.engine=data['advanced.clustering.engine'];
            }
        };

        //return clusters th document is in
        searcher.getDocClusters=function(id){
            result = [];
            for(i=0;i<searcher.clusters.list.length;i++) {
                if (searcher.clusters.list[i].docs.indexOf(id) >= 0) {
                    result[result.length] = searcher.clusters.list[i];
                }
            }

            return result;
        }

        //sets state variables to adress bar
        searcher.poluteLocation=function(){
            form = searcher.form;
            $location.search('core',form.core);
            $location.search('query',form.query);
            $location.search('page',searcher.pager.page);
            if(form.advanced.enabled){
                advanced = form.advanced;
                $location.search('advanced.enabled',advanced.enabled);
                $location.search('advanced.clustering.engine',advanced.clustering.engine);
            }
        };

        //does the search query and processes the result
        searcher.search = function (new_search) {
            if(new_search){
                searcher.pager.page=0;
            }
            searcher.poluteLocation();
            searcher.loading=true;
            form = searcher.form;
            params='';
            if(form.advanced.enabled){
                params+='clustering.results='+(form.advanced.clustering.engine?"true":"false")+'&clustering.engine='+form.advanced.clustering.engine;
            }
            $http.get(searcher.form.solrhost+"/"+form.core+'/searcher?wt=json'+searcher.pager.getQuery()+'&q='+form.query+params).success(function (data) {
                searcher.response = data.response;
                searcher.highlights = data.highlighting
                searcher.clusters.list = data.clusters?data.clusters:[];
                searcher.selectCluster(-1);
                searcher.loading=false;
            });
        };

        //toggles cluster selection, filters documents to selected clusters
        searcher.selectCluster=function(id){
            if(id==-1){
                searcher.results = searcher.response.docs;
                searcher.clusters.selected=true;
                for(i=0;i<searcher.clusters.list.length;i++){
                    searcher.clusters.list[i].selected=false;
                }
                return;
            }
            searcher.clusters.selected=false;
            searcher.clusters.list[id].selected=!searcher.clusters.list[id].selected
            doclist=[];
            for(i=0;i<searcher.clusters.list.length;i++){
                if(searcher.clusters.list[i].selected==true){
                    doclist=doclist.concat(searcher.clusters.list[i].docs)
                }
            }
            if(doclist.length==0){
                searcher.selectCluster(-1)
                return;
            }
            searcher.results=[];
            for(i=0;i<searcher.response.docs.length;i++){
                if($.inArray(searcher.response.docs[i].id,doclist)>=0){
                    searcher.results.push(searcher.response.docs[i]);
                }
            }
        };

        //toggles advanced options
        searcher.toggleAdvanced = function () {
            searcher.form.advanced.enabled = !searcher.form.advanced.enabled;
        };
    }]);
})();