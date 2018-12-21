define([
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/query',
    'dojo/_base/html',
    'dojo/_base/array',
    'dojo/_base/fx',
    'dojo/promise/all',
    'dojo/on',
    'dojo/Deferred',
    'dojo/dom-construct',
    'dojo/dom-attr',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidget',
    'jimu/dijit/Message',
    'jimu/dijit/LoadingShelter',
    'jimu/dijit/DrawBox',
    'jimu/utils',
    'esri/SpatialReference',
    'esri/tasks/query',
    'esri/tasks/QueryTask',
    'esri/layers/GraphicsLayer',
    'esri/layers/FeatureLayer',
    'esri/renderers/SimpleRenderer',
    'esri/symbols/SimpleMarkerSymbol',
    'esri/Color',
    'esri/graphic',
    'esri/geometry/Point',
    'esri/geometry/Polyline',
    'esri/geometry/Extent',
    'esri/InfoTemplate',
    'esri/symbols/jsonUtils',
    'esri/lang',
    'esri/request',
    'esri/graphicsUtils'
  ],
  function(declare, lang, query, html, array, fx, all, on, Deferred, domConstruct, domAttr, _WidgetsInTemplateMixin,
    BaseWidget, Message, LoadingShelter, DrawBox, jimuUtils, SpatialReference, EsriQuery, QueryTask,
    GraphicsLayer, FeatureLayer, SimpleRenderer, SimpleMarkerSymbol, Color, Graphic, Point, Polyline, Extent, InfoTemplate,
    symbolJsonUtils, esriLang, esriRequest, graphicsUtils) {
    	
    return declare([BaseWidget, _WidgetsInTemplateMixin], {
      name: 'Locate Features',
      baseClass: 'jimu-widget-locatefeatures',
      isValidConfig:false,
      currentAttrs:null,

      operationalLayers:[],

      _resetCurrentAttrs: function(){
        this.currentAttrs = {
          layerTr:null,
          config:null,
          layerInfo:null,
          askForValues: null,
          query:{
            maxRecordCount: 1000,
            where:'',
            nextIndex: 0,
            objectIds:[]//optional
          }
        };
      },

      postMixInProperties: function(){
        this.inherited(arguments);
        var strClearResults = this.nls.clearResults;
        var tip = esriLang.substitute({clearResults:strClearResults},this.nls.operationalTip);
        this.nls.operationalTip = tip;
      },

      postCreate:function(){
        this.inherited(arguments);
        this._initSelf();
      },

      onOpen: function(){
      },

      onClose:function(){
        this.inherited(arguments);
        this._unSelectFeatureTr();
        this._fromCurrentPageToLayerList();
      },

      destroy:function(){
        this.inherited(arguments);
      },

	  _initSelf:function(){
        
        this.isValidConfig = this._isConfigValid();
        if(!this.isValidConfig){
          html.setStyle(this.layersNode,'display','none');
          html.setStyle(this.invalidConfigNode,{
            display:'block',
            left:0
          });
          //html.setStyle(this.btnClearAll, 'display', 'none');
          return;
        }

		var layers = this.config.layers;
        if(layers.length === 0){
          html.setStyle(this.layersNode, 'display', 'none');
          html.setStyle(this.noLayerTipSection, 'display', 'block');
          html.setStyle(this.btnClearAll, 'display', 'none');
          return;
        }

		// Create a graphics layer to contain a point marker for located features //
		this._createMarkerLayer();
		
		// Create a list item for each configured layer //
        array.forEach(layers,lang.hitch(this,function(singleConfig,index){
          var strTr = '<tr class="single-layer">'+
          '<td class="first-td"></td>'+
          '<td class="second-td">'+
            '<div class="layer-name-div"></div>'+
          '</td>'+
          '<td class="third-td">'+
            '<div class="arrow"></div>'+
          '</td>'+
          '</tr>';
          var tr = html.toDom(strTr);
          var layerNameDiv = query(".layer-name-div", tr)[0];
          layerNameDiv.innerHTML = singleConfig.name;
          html.place(tr, this.layersTbody);
          tr.singleConfig = singleConfig;
          if(index%2 === 0){
            html.addClass(tr,'even');
          }
          else{
            html.addClass(tr,'odd');
          }
          
          // Create a graphics layer for each configured layer //
          this._createGraphicsLayer(singleConfig);
        }));
        
        // Disable the control buttons
        html.setStyle(this.buttonSection, 'display', 'none');
        //this._disableControl(this.btnClear);
        //this._disableControl(this.btnCenter);
        //this._disableControl(this.btnZoomTo);
      },

	  _createMarkerLayer: function(){
	  	var markerSymbol = new SimpleMarkerSymbol();
        markerSymbol.setPath("M26.522,12.293l-5.024-0.73c-1.089-0.158-2.378-1.095-2.864-2.081l-2.249-4.554c-0.487-0.986-1.284-0.986-1.771,0l-2.247,4.554c-0.487,0.986-1.776,1.923-2.864,2.081l-5.026,0.73c-1.088,0.158-1.334,0.916-0.547,1.684l3.637,3.544c0.788,0.769,1.28,2.283,1.094,3.368l-0.858,5.004c-0.186,1.085,0.458,1.553,1.432,1.041l4.495-2.363c0.974-0.512,2.566-0.512,3.541,0l4.495,2.363c0.974,0.512,1.618,0.044,1.433-1.041l-0.859-5.004c-0.186-1.085,0.307-2.6,1.095-3.368l3.636-3.544C27.857,13.209,27.611,12.452,26.522,12.293zM22.037,16.089c-1.266,1.232-1.966,3.394-1.67,5.137l0.514,2.984l-2.679-1.409c-0.757-0.396-1.715-0.612-2.702-0.612s-1.945,0.216-2.7,0.61l-2.679,1.409l0.511-2.982c0.297-1.743-0.404-3.905-1.671-5.137l-2.166-2.112l2.995-0.435c1.754-0.255,3.592-1.591,4.373-3.175L15.5,7.652l1.342,2.716c0.781,1.583,2.617,2.92,4.369,3.173l2.992,0.435L22.037,16.089z");
        markerSymbol.setColor(new Color("#FF0000"));
        
        var graphicsLayer = new GraphicsLayer({ className: "locate_features_marker", id: "locate_features_marker" });
        graphicsLayer.renderer = new SimpleRenderer(markerSymbol);
        graphicsLayer.visible = true;
        this.map.addLayer(graphicsLayer, 0);
	  },

	  _createGraphicsLayer: function(config){
	  	var sym = symbolJsonUtils.fromJson(config.resultsSymbol);
        var graphicsLayer = new GraphicsLayer({ className: config.name, id: config.name });
        graphicsLayer.renderer = new SimpleRenderer(sym);
        graphicsLayer.visible = true;
        this.map.addLayer(graphicsLayer, 0);
	  },

      _fromCurrentPageToLayerList: function(){
        html.setStyle(this.layerList, 'display', 'block');

        if(html.getStyle(this.layerFeatures, 'display') === 'block'){
          this._slide(this.layerList, -100, 0);
          this._slide(this.layerFeatures, 0, 100);
        }
      },

      _isConfigValid:function(){
        return this.config && typeof this.config === 'object';
      },

  	  _disableControl:function(node){
        html.setStyle(node, 'display', 'none');
	  },
	  
	  _enableControl:function(node){
        html.setStyle(node, 'display', 'initial');
	  },

      _slide:function(dom, startLeft, endLeft){
        html.setStyle(dom, 'display', 'block');
        html.setStyle(dom, 'left', startLeft+"%");
        fx.animateProperty({
          node: dom,
          properties:{
            left:{
              start: startLeft,
              end: endLeft,
              units:'%'
            }
          },
          duration: 500,
          onEnd: lang.hitch(this,function(){
            html.setStyle(dom, 'left', endLeft);
            if(endLeft === 0){
              html.setStyle(dom, 'display', 'block');
            }
            else{
              html.setStyle(dom, 'display', 'none');
            }
          })
        }).play();
      },

      _onLayerListClicked:function(event){
      	
      	// Get a handle on the clicked element (<tr>);
        var target = event.target||event.srcElement;
        var tr = jimuUtils.getAncestorDom(target,lang.hitch(this,function(dom){
          return html.hasClass(dom,'single-layer');
        }),10);
        if(!tr){
          return;
        }

		// Get the config from the tr; reset current attributes
        var singleConfig = tr.singleConfig;
        this._resetCurrentAttrs();
        this.currentAttrs.layerTr = tr;
        this.currentAttrs.config = lang.clone(singleConfig);
        this.currentAttrs.layerInfo = this.currentAttrs.layerTr.layerInfo;//may be null

		// Get the filter as defined in the config
        var filterInfo = this.currentAttrs.config.filter;
        var parts = filterInfo.parts;
        this.currentAttrs.askForValues = array.some(parts, lang.hitch(this, function(item) {
          if (item.parts) {
            return array.some(item.parts, lang.hitch(this, function(part) {
              return part.interactiveObj;
            }));
          } else {
            return item.interactiveObj;
          }
        }));
        
        query('tr.single-layer',this.layersTbody).removeClass('selected');
        html.addClass(this.currentAttrs.layerTr,'selected');

    	// Set layer info variables
      	this.currentAttrs.layerInfo = this.currentAttrs.layerTr.layerInfo;
      	this.currentAttrs.query.where = this.currentAttrs.config.filter.expr;
      	var layerInfo = this.currentAttrs.layerInfo;
      
      	// Clear the features page
      	this._clearFeaturePage();
      
      	// Hide the feature number div
      	html.setStyle(this.featuresNumberDiv, 'display', 'none');

      	// Navigate the widget to the layer features page
		this._fromLayerListToLayerFeatures(tr.innerHTML);

	  	// Query records
	  	this._queryRecords(null);		
      },

      _getLayerIndexByLayerUrl: function(layerUrl){
        var lastIndex = layerUrl.lastIndexOf("/");
        var a = layerUrl.slice(lastIndex + 1, layerUrl.length);
        return parseInt(a, 10);
      },

      _getServiceUrlByLayerUrl: function(layerUrl){
        var lastIndex = layerUrl.lastIndexOf("/");
        var serviceUrl = layerUrl.slice(0, lastIndex);
        return serviceUrl;
      },

	  _fromLayerListToLayerFeatures:function(name){
	  	
        var layerUrl = this.currentAttrs.config.url;
        var partsObj = lang.clone(this.currentAttrs.config.filter);
	  	
	  	this.featuresTitle.innerHTML = name;
	  	
	  	//slide
        var showDom = this.layerFeatures;
        var hideDom = this.layerList;

        html.setStyle(this.layerList, {
          left: 0,
          display: 'block'
        });

        html.setStyle(showDom, {
          left: '100%',
          display: 'block'
        });

        html.setStyle(hideDom, 'display', 'none');
        this._slide(this.layerList, 0, -100);
        this._slide(showDom, 100, 0);
	  },

      _onBtnFeaturesBackClicked:function(){
        html.setStyle(this.layerList,'display','block');
        html.setStyle(this.layerFeatures,'display','none');
        this._slide(this.layerList, -100, 0);
      },
      
      _onBtnClearClicked:function(){
      	this._unSelectFeatureTr();
      },
      
      _onBtnCenterClicked:function(){
      	this.map.centerAt(this.layerFeatures.featureTr.center);
      },
      
      _onBtnZoomToClicked:function(){
      	this.map.setExtent(this.layerFeatures.featureTr.extent);
      },

      /*--------------------query support objectIds------------------------*/
      _doQuery_SupportObjectIds: function(where, geometry){
      	
      	console.log("_doQuery_SupportObjectIds(" + where + ")");
      	
        html.setStyle(this.featuresNumberDiv, 'display', 'block');

        this.shelter.show();
        var defIDs = this._queryIds(where, geometry);
        defIDs.then(lang.hitch(this, function(objectIds){
          if(!this.domNode){
            return;
          }

		  console.log("1 - OID Count: " + objectIds.length);

          var hasResults = objectIds && objectIds.length > 0;

          if(!hasResults){
            this.shelter.hide();
            return;
          }
          
          console.log("2");
          
          var allCount = objectIds.length;
          this.numSpan.innerHTML = jimuUtils.localizeNumber(allCount);
          this.currentAttrs.query.objectIds = objectIds;
          this.currentAttrs.query.nextIndex = 0;//reset nextIndex
          var maxRecordCount = this.currentAttrs.query.maxRecordCount;

          var partialIds = [];
          if (allCount > maxRecordCount) {
            partialIds = objectIds.slice(0, maxRecordCount);
          } else {
            partialIds = objectIds;
          }

          //do query by objectIds
          console.log("3 - querying by objectids");
          var def = this._queryByObjectIds(partialIds, false);
          def.then(lang.hitch(this, function(response){
            if (!this.domNode) {
              return;
            }
            //this.currentAttrs.query.nextIndex += partialIds.length; //
            this.shelter.hide();
            var features = response.features;
            this.currentAttrs.query.maxRecordCount= features.length;
            this.currentAttrs.query.nextIndex += features.length;

			console.log("Response feature count: " + features.length);

            this._addResultItems(features);
          }), lang.hitch(this, function(err){
            console.error(err);
            if (!this.domNode) {
              return;
            }
            this.shelter.hide();
            this._showQueryErrorMsg();
          }));
        }), lang.hitch(this, function(err){
          console.error(err);
          if(!this.domNode){
            return;
          }
          this.shelter.hide();
          this._showQueryErrorMsg();
        }));
      },

	  _queryRecords: function(geometry) {
	  	
	  	// Set variables for nested functions //
	  	atts = this.currentAttrs;
	  	num = this.numSpan;
	  	shelter = this.shelter;
	  	addResultItems = this._addResultItems;
	  	
        html.setStyle(this.featuresNumberDiv, 'display', 'block');
        shelter.show();
        
        console.log('qr 1');
        
        // Create a query task to get ids only //
        var queryTask = new QueryTask(this.currentAttrs.config.url);     
        console.log('qr 2 - url: ' + this.currentAttrs.config.url);   
        var query = new EsriQuery();
        query.where = this.currentAttrs.query.where;
        console.log('qr 3 - where: ' + this.currentAttrs.query.where);
        if (geometry) { query.geometry = geometry; }
        query.returnGeometry = false;
        query.orderByFields = [this.currentAttrs.config.popup.order];
        console.log('qr 4 - orderby: ' + this.currentAttrs.config.popup.order);
        query.outFields = this._getOutputFields();
        console.log('qr 5 - outfields: ' + query.outFields);
        var config = this.currentAttrs.config;
        var featuresTbody = this.featuresTbody;
        query.returnDistinctValues = true;
        queryTask.execute(query, function(result){
	    	shelter.hide();
            var features = result.features;	
			num.innerHTML = jimuUtils.localizeNumber(features.length);
			console.log('qr 5 - count: ' + jimuUtils.localizeNumber(features.length));
            addResultItems(features, config, featuresTbody);
        });
      },

      _onFeaturesScroll:function(){
        /*
        if(!jimuUtils.isScrollToBottom(this.featuresContainer)){
                  return;
                }
        
                var layerInfo = this.currentAttrs.layerInfo;
        
                var currentVersion = 0;
                if(layerInfo.currentVersion){
                  currentVersion = parseFloat(layerInfo.currentVersion);
                }
        
                if(currentVersion < 10.0){
                  return;
                }
        
                var maxRecordCount = this.currentAttrs.query.maxRecordCount;
                var allObjectIds = this.currentAttrs.query.objectIds;
                var nextIndex = this.currentAttrs.query.nextIndex;
                if(nextIndex >= allObjectIds.length){
                  return;
                }
        
                var countLeft = allObjectIds.length - nextIndex;
                var queryNum = Math.min(countLeft, maxRecordCount);
                var partialIds = allObjectIds.slice(nextIndex, nextIndex + queryNum);
                if(partialIds.length === 0){
                  return;
                }
        
                this.shelter.show();
                //do query by objectIds
                var def = this._queryByObjectIds(partialIds, false);
                def.then(lang.hitch(this, function(response) {
                  if (!this.domNode) {
                    return;
                  }
                  
                  this.shelter.hide();
                  var features = response.features;
                  this.currentAttrs.query.nextIndex += features.length;
                  this._addResultItems(features, this.currentAttrs.config);
                }), lang.hitch(this, function(err) {
                  console.error(err);
                  if (!this.domNode) {
                    return;
                  }
                  this._showQueryErrorMsg();
                  this.shelter.hide();
                }));*/
        
      },

      /*-------------------------common functions----------------------------------*/
      _clearFeaturePage: function(){
        this._unSelectFeatureTr();
        html.empty(this.featuresTbody);
        this.numSpan.innerHTML = '0';
      },

      _unSelectFeatureTr: function(){
        if(this.layerFeatures.featureTr){
          html.removeClass(this.layerFeatures.featureTr,'selected');
          var featureAttrTable = query(".feature-attributes",this.layerFeatures.featureTr)[0];
          html.removeClass(featureAttrTable, 'selected');
          //this._disableControl(this.btnClear);
          //this._disableControl(this.btnCenter);
          //this._disableControl(this.btnZoomTo);
          html.setStyle(this.buttonSection, 'display', 'none');
          this._hideFeatureLocation(this.map);
        }
        this.layerFeatures.featureTr = null;
        
      },

      _selectFeatureTr: function(tr){
        this._unSelectFeatureTr();
        this.layerFeatures.featureTr = tr;
        if(this.layerFeatures.featureTr){
          html.addClass(this.layerFeatures.featureTr, 'selected');
          var featureAttrTable = query(".feature-attributes",tr)[0];
          html.addClass(featureAttrTable, 'selected');
          this._showFeatureLocation(this.map,tr);
          //this._enableControl(this.btnClear);
          //this._enableControl(this.btnCenter);
          //this._enableControl(this.btnZoomTo);
          html.setStyle(this.buttonSection, 'display', 'block');
        }
      },

      _zoomToLayer: function(gl){
        try{
          var ext = graphicsUtils.graphicsExtent(gl.graphics);
          if(ext){
            ext = ext.expand(1.4);
            this.map.setExtent(ext);
          }
        }
        catch(e){
          console.log(e);
        }
      },

      _getOutputFields: function(){
        var objectIdField = this.currentAttrs.config.objectIdField;
        var fields = this.currentAttrs.config.popup.fields;
        var outFields = array.map(fields, lang.hitch(this,function(fieldInfo){
          return fieldInfo.name;
        }));
        if(array.indexOf(outFields, objectIdField) < 0){
          outFields.push(objectIdField);
        }
        return outFields;
      },

      _queryIds: function(where, geometry){
        var queryParams = new EsriQuery();
        console.log("qid1");
        queryParams.where = where;
        console.log("qid2");
        if(geometry){
        	console.log("qid2.1");
          queryParams.geometry = geometry;
        }
        console.log("qid3");
        queryParams.returnGeometry = false;
        console.log("qid4: " + this.currentAttrs.config.url);
        //queryParams.outSpatialReference = this.map.spatialReference;
        var queryTask = new QueryTask(this.currentAttrs.config.url);
        console.log("qid5");
        return queryTask.executeForIds(queryParams);
      },

      _queryByObjectIds: function(objectIds, returnGeometry){
        var queryParams = new EsriQuery();
        queryParams.returnGeometry = !!returnGeometry;
        queryParams.outSpatialReference = this.map.spatialReference;
        queryParams.outFields = this._getOutputFields();
        queryParams.orderByFields = ["NAME"];
        //queryParams.returnGeometry = false;
        queryParams.objectIds = objectIds;
        queryParams.returnDistinctValues = true;
        var queryTask = new QueryTask(this.currentAttrs.config.url);
        return queryTask.execute(queryParams);
      },

	  _queryNoGeometry: function(where, orderby){
        var queryParams = new EsriQuery();
        queryParams.returnGeometry = false;
        queryParams.outSpatialReference = this.map.spatialReference;
        queryParams.outFields = this._getOutputFields();
        queryParams.where = where;
        queryParams.orderByFields = [orderby];
        queryParams.returnDistinctValues = true;
        var queryTask = new QueryTask(this.currentAttrs.config.url);
        return queryTask.execute(queryParams);
      },

      _query: function(where, /*optional*/ geometry, orderby){
        var queryParams = new EsriQuery();
        queryParams.where = where;
        if(geometry){
          queryParams.geometry = geometry;
        }
        queryParams.outSpatialReference = this.map.spatialReference;
        queryParams.returnGeometry = true;
        queryParams.outFields = this._getOutputFields();
        queryParams.orderByFields = [orderby];
        queryParams.returnDistinctValues = true;
        var queryTask = new QueryTask(this.currentAttrs.config.url);
        return queryTask.execute(queryParams);
      },

	  _capitalCase: function (str) {
          return str.replace(/\w\S*/g, function (txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
      },

      _addResultItems: function(features, config, featuresTbody){
      	var createQueryResultItem = this._createQueryResultItem;
      	var tbody = this.featuresTbody;
      	var nls = this.nls;
        var featuresCount = features.length;
        var sym = symbolJsonUtils.fromJson(config.resultsSymbol);
        var popup = config.popup;
        var fieldInfosInAttrContent = array.filter(popup.fields,lang.hitch(this,function(fieldInfo){
          return fieldInfo.showInInfoWindow;
        }));

        array.forEach(features, lang.hitch(this, function(feature, i){
          var trClass = '';
          if(i%2 === 0){
            trClass = 'even';
          }
          else{
            trClass = 'odd';
          }

          //process attributes
          var attributes = feature.attributes;          
          array.forEach(popup.fields, lang.hitch(this, function(fieldInfo){
            var fieldName = fieldInfo.name;
            if(attributes.hasOwnProperty(fieldName)){
              var fieldValue = attributes[fieldName];
              if(fieldInfo.type === 'esriFieldTypeDate'){
                if(fieldValue){
                  var date = new Date(parseInt(fieldValue, 10));
                  fieldValue = date.toLocaleDateString();
                  attributes[fieldName] = fieldValue;
                }
              }
              if(fieldValue === null){
                attributes[fieldName] = nls.noValue;
              }
            }
          }));
          
          var strItem = '<tr class="layer-feature-item" cellpadding="0" cellspacing="0">' +
        			  '<td><span class="title"></span><table class="feature-attributes" >'+
        			  '<tbody></tbody></table></td></tr>';
          var trItem = html.toDom(strItem);
          html.addClass(trItem, trClass);
          html.place(trItem, featuresTbody);
          trItem.feature = feature;
          var spanTitle = query("span.title",trItem)[0];
          var tbody = query("tbody",trItem)[0];
          var title = esriLang.substitute(attributes, popup.title);
          if(!title){
          	  title = nls.noValue;
          }
          spanTitle.innerHTML = title;
          var infoTemplateTitle = title;
          var infoTemplateContent = '';

		  var objectid = attributes[config.objectIdField];
		  array.forEach(fieldInfosInAttrContent, lang.hitch(this, function(fieldInfo, i){
           var fieldName = fieldInfo.name;
           var fieldAlias = fieldInfo.alias || fieldName;
           var fieldValue = attributes[fieldName];
           var fieldValueInWidget = fieldValue;
           var fieldValueInPopup = fieldValue;
           var specialType = fieldInfo.specialType;
           
           
           //console.log("Special Type: " + typeof fieldValue);
           
           if(specialType === 'image'){
             if(fieldValue && typeof fieldValue === 'string'){
               fieldValueInWidget = fieldValue+'" target="_blank">'+fieldValue+'</a>';
               fieldValueInPopup = '<img src="'+fieldValue+'" />';
             }
           }
           else if(specialType === 'link'){
             if(fieldValue && typeof fieldValue === 'string'){
               fieldValueInWidget = '<a href="'+fieldValue+'" target="_blank">Link</a>';
               fieldValueInPopup = fieldValueInWidget;
             }
           }
           else if(specialType === 'area'){
             if(fieldValue && typeof fieldValue === 'number'){
               fieldValueInWidget = fieldValue.toFixed(2) + " mi<sup>2</sup>";
               fieldValueInPopup = fieldValueInWidget;
             }
           }
 
           var strFieldTr = '<tr><td class="attr-name">' + fieldAlias +
           ':</td><td class="attr-value">' + fieldValueInWidget + '</td></tr>';
           var fieldTr = html.toDom(strFieldTr);
           html.place(fieldTr, tbody);
           var rowStr = fieldAlias+": "+fieldValueInPopup;
           if(i !== fieldInfosInAttrContent.length-1){
           rowStr+='<br/>';
          }
          infoTemplateContent += rowStr;
         }));

        trItem.infoTemplateTitle = infoTemplateTitle;
        trItem.infoTemplateContent = infoTemplateContent;
        var infoTemplate = new InfoTemplate();
        infoTemplate.setTitle(infoTemplateTitle);
        infoTemplate.setContent(infoTemplateContent||"<span></span>");
        feature.setInfoTemplate(infoTemplate);
          
        }));
      },

	  _hideFeatureLocation:function(map){
	  	
	  	var name = this.currentAttrs.config.name;
	  	var graphicsLayer = map.getLayer(name);
		var markerLayer = map.getLayer("locate_features_marker");
		graphicsLayer.clear();
		markerLayer.clear();
	  	
	  },

	  _showFeatureLocation:function(map,tr){
	  	
		var name = this.currentAttrs.config.name;
		var objectidfield = this.currentAttrs.config.objectIdField;
		var graphicsLayer = map.getLayer(name);
		var markerLayer = map.getLayer("locate_features_marker");
		
		// Perform secondary query to get detail for the chosen item
		var feature;
		var objectid = tr.feature.attributes[objectidfield];
        var qDetail = new EsriQuery();
        qDetail.returnGeometry = true;
        qDetail.outFields = this._getOutputFields();
        qDetail.where = objectidfield + " = " + objectid;
        var qTaskDetail = new QueryTask(this.currentAttrs.config.url);
        qTaskDetail.execute(qDetail, function (featureSet) {

            // Get the returned object
            var graphic = featureSet.features[0];
            graphic.id = objectid;
            
            // Get the geometry, center point and extent
            var centerpt, extent;
			var geometry = featureSet.features[0].geometry;
            geometry.SpatialReference = new esri.SpatialReference({ wkid: 4326 });
            
            if (geometry.type == "point")
            {
            	centerpt = geometry;
            	var tempextent = new Extent(-9436714.235,4392491.629,-9434571.106,4393837.699, new SpatialReference({ wkid:3857 }));
				extent = tempextent.centerAt(centerpt);            	
            }
            else if (geometry.type == "polyline")
            {
            	extent = geometry.getExtent().expand(1.4);
            	centerpt = extent.getCenter();
            }
            else if (geometry.type == "polygon"){
            	centerpt = geometry.getCentroid();
            	extent = geometry.getExtent().expand(1.4);
            }
            
		    // Set the geometry properties on the tr
		    tr.center = centerpt;
		    tr.extent = extent;

            // Generate the info template, symbology and ID
            //graphic.infoTemplate = itemp(param, dValue, graphic.attributes);

			// Use the center point to create a marker
			var marker = new Graphic(centerpt);
			//markerLayer.add(marker);
			
			// Add the feature graphic; center the map
			graphicsLayer.add(graphic);
			map.centerAt(centerpt);
        });
	  	
	  },

      _createQueryResultItem:function(options){
      	
        var feature = options.feature;
        var titleTemplate = options.titleTemplate;
        var fieldInfosInAttrContent = options.fieldInfosInAttrContent;
        var trClass = options.trClass;

        var attributes = feature && feature.attributes;
        if(!attributes){
          return;
        }

        var strItem = '<tr class="layer-feature-item" cellpadding="0" cellspacing="0">' +
        			  '<td><span class="title"></span><table class="feature-attributes" >'+
        			  '<tbody></tbody></table></td></tr>';
        var trItem = html.toDom(strItem);
        html.addClass(trItem, trClass);
        html.place(trItem, this.featuresTbody);
        trItem.feature = feature;
        var spanTitle = query("span.title",trItem)[0];
        var tbody = query("tbody",trItem)[0];
        var title = esriLang.substitute(attributes, titleTemplate);
        if(!title){
          	title = this.nls.noValue;
        }
        spanTitle.innerHTML = title;
        var infoTemplateTitle = title;
        var infoTemplateContent = '';

		var objectid = attributes[this.currentAttrs.config.objectIdField];
        
		array.forEach(fieldInfosInAttrContent, lang.hitch(this, function(fieldInfo, i){
           var fieldName = fieldInfo.name;
           var fieldAlias = fieldInfo.alias || fieldName;
           var fieldValue = attributes[fieldName];
           var fieldValueInWidget = fieldValue;
           var fieldValueInPopup = fieldValue;
           var specialType = fieldInfo.specialType;
           if(specialType === 'image'){
             if(fieldValue && typeof fieldValue === 'string'){
               fieldValueInWidget = '<a href="'+fieldValue+'" target="_blank">'+fieldValue+'</a>';
               fieldValueInPopup = '<img src="'+fieldValue+'" />';
             }
           }
           else if(specialType === 'link'){
             if(fieldValue && typeof fieldValue === 'string'){
               fieldValueInWidget = '<a href="'+fieldValue+'" target="_blank">Link</a>';
               fieldValueInPopup = fieldValueInWidget;
             }
           }
 
           var strFieldTr = '<tr><td class="attr-name">' + fieldAlias +
           ':</td><td class="attr-value">' + fieldValueInWidget + '</td></tr>';
           var fieldTr = html.toDom(strFieldTr);
           html.place(fieldTr, tbody);
           var rowStr = fieldAlias+": "+fieldValueInPopup;
           if(i !== fieldInfosInAttrContent.length-1){
           rowStr+='<br/>';
          }
          infoTemplateContent += rowStr;
         }));

        trItem.infoTemplateTitle = infoTemplateTitle;
        trItem.infoTemplateContent = infoTemplateContent;
        var infoTemplate = new InfoTemplate();
        infoTemplate.setTitle(infoTemplateTitle);
        infoTemplate.setContent(infoTemplateContent||"<span></span>");
        feature.setInfoTemplate(infoTemplate);
      },

      _showQueryErrorMsg: function(/* optional */ msg){
        new Message({message: msg || this.nls.queryError});
      },

      _onFeaturesTableClicked: function(event){
        var target = event.target||event.srcElement;
        if(!html.isDescendant(target,this.featuresTable)){
          return;
        }
        var tr = jimuUtils.getAncestorDom(target, lang.hitch(this,function(dom){
          return html.hasClass(dom,'layer-feature-item');
        }),10);
        if(!tr){
          return;
        }
            
		if (html.hasClass(tr, 'selected')){
			this._unSelectFeatureTr(tr);
			return;
		}

        this._selectFeatureTr(tr);

        var spanTitle = query("span.title",tr)[0];
        var featureAttrTable = query(".feature-attributes",tr)[0];
        var attrTable = lang.clone(featureAttrTable);

        html.addClass(tr,'selected');
      },

      _onBtnFeaturesBackClicked: function(){
        var showDom,hideDom;

        showDom = this.layerList;
        hideDom = this.layerFeatures;

        html.setStyle(hideDom,'display','none');
        html.setStyle(showDom,{
          display:'block',
          left:'-100%'
        });
        this._slide(showDom, -100, 0);
        this._slide(this.layerFeatures, 0, 100);
        
        this._unSelectFeatureTr();
      }
    });
  });