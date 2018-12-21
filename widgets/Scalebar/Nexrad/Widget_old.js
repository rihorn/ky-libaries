define([
    'dojo/_base/declare',
    'dojo/_base/array',
    'dojo/_base/html',
    'dijit/_WidgetsInTemplateMixin',
    'dijit/form/Select',
    "esri/geometry/Point",
    'esri/SpatialReference',
    'jimu/BaseWidget',
    'jimu/utils',
    'dojo/_base/lang',
    'dojo/on',
    'dojo/number',
    "dojo/dom-style",
    "dojo/dom-class",
    "dojo/dom-construct",
    "dojo/aspect",
    "dojo/Deferred",
    "esri/request",
    "esri/geometry/Extent",
    "esri/layers/WMSLayer",
    "esri/layers/WMSLayerInfo",
    "esri/config"
  ],
  function(
    declare,
    array,
    html,
    _WidgetsInTemplateMixin,
    Select,
    Point,
    SpatialReference,
    BaseWidget,
    utils,
    lang,
    on,
    dojoNumber,
    domStyle,
    domClass,
    domConstruct,
    aspect,
    Deferred,
    esriRequest,
    Extent,
    WMSLayer,
    WMSLayerInfo,
    esriConfig
  ) {
  	var nexradWMSLayer, nexradInfo;
    var layerNameArray = ["nexrad-n0r-900913", "nexrad-n0r-900913-m50m",
                          "nexrad-n0r-900913-m45m", "nexrad-n0r-900913-m40m", "nexrad-n0r-900913-m35m",
                          "nexrad-n0r-900913-m30m", "nexrad-n0r-900913-m25m", "nexrad-n0r-900913-m20m",
                          "nexrad-n0r-900913-m15m", "nexrad-n0r-900913-m10m", "nexrad-n0r-900913-m05m"];
    var iCount = 0, iMax = 10;
    var ninterval;
    var opacity;
   	var interval;
    var opacitySelect = this.opacitySelect;
    var intervalSelect = this.intervalSelect;
	var metrics = {
      0: 0,
      1: -50,
      2: -45,
      3: -40,
      4: -35,
      5: -30,
      6: -25,
      7: -20,
      8: -15,
      9: -10,
      10: -5
    };
	var bStarted = false;

    var clazz = declare([BaseWidget, _WidgetsInTemplateMixin], {
      
      baseClass: 'jimu-widget-nexrad',
      name: 'Nexrad',

      startup: function() {
        this.inherited(arguments);
		this._initNexrad();
      },

	  _initNexrad: function() {
	  	init = this;
	  	var layer0 = new WMSLayerInfo({ name: layerNameArray[0], title: layerNameArray[0] });
	    var layer1 = new WMSLayerInfo({ name: layerNameArray[1], title: layerNameArray[1] });
	    var layer2 = new WMSLayerInfo({ name: layerNameArray[2], title: layerNameArray[2] });
	    var layer3 = new WMSLayerInfo({ name: layerNameArray[3], title: layerNameArray[3] });
	    var layer4 = new WMSLayerInfo({ name: layerNameArray[4], title: layerNameArray[4] });
	    var layer5 = new WMSLayerInfo({ name: layerNameArray[5], title: layerNameArray[5] });
	    var layer6 = new WMSLayerInfo({ name: layerNameArray[6], title: layerNameArray[6] });
	    var layer7 = new WMSLayerInfo({ name: layerNameArray[7], title: layerNameArray[7] });
	    var layer8 = new WMSLayerInfo({ name: layerNameArray[8], title: layerNameArray[8] });
	    var layer9 = new WMSLayerInfo({ name: layerNameArray[9], title: layerNameArray[9] });
	    var layer10 = new WMSLayerInfo({ name: layerNameArray[10], title: layerNameArray[10] });
		var resourceInfo = {
	      extent: new Extent(-126.40869140625, 31.025390625, -109.66552734375, 41.5283203125, {
	        wkid: 4326
	      }),
	      layerInfos: [layer0, layer1, layer2, layer3, layer4, layer5, layer6, layer7, layer8, layer9, layer10]
	    };
	    
	    opacity = this.config.opacity * 100;
	    //console.log("Initial opacity: " + opacity);
	    interval = this.config.interval / 1000;
	    //console.log("Initial interval: " + interval);
	    
	    // Set the select boxes
	    this.intervalSelect.set("value", (this.config.interval / 1000).toString());
	    this.opacitySelect.set("value", (this.config.opacity * 100).toString());
	    //this.intervalSelect.value = this.interval;
	    //this.opacitySelect.value = this.opacity;
	    
	    nexradWMSLayer = new WMSLayer(this.config.url, {
	      id: "NEXRAD Base Reflectivity",
	      disableClientCaching: "true",
	      opacity: opacity,
	      version: "1.1.1",
	      format: "png",
	      resourceInfo: resourceInfo
	    });
	    nexradWMSLayer.setVisibleLayers([layerNameArray[0]]);
	    
	    this.own(on(nexradWMSLayer, "update-end", lang.hitch(this, this.onLayerUpdate)));
	  	this.own(on(this.pauseButton, "click", lang.hitch(this, this.onPauseClick)));
	  	//this.own(on(this.playButton, "click", lang.hitch(this, this.onPlayClick)));
	  	this.own(on(this.opacitySelect, "change", lang.hitch(this, this.onOpacityChanged)));
	  	this.own(on(this.intervalSelect, "change", lang.hitch(this, this.onIntervalChanged)));
	  },

	  start: function() {
	  	ninterval = setInterval(function(){
	        if (iCount === iMax) {
	            iCount = 0;
	        }
	        else {
	            iCount++;
	        }
	        nexradWMSLayer.setVisibleLayers([layerNameArray[iCount]]);
        }, interval);
        this.bStarted = true;
	  },

	  onOpen: function() {
      	domClass.add(this.nexradContainer, "nexrad-container");
		this.map.addLayers([nexradWMSLayer]);
		this.start();
      },

	  onPauseClick: function() {
	  	if (html.hasClass(this.pauseButton, 'nexrad-options-pause'))
	  	{
	  		domClass.replace(this.pauseButton, 'nexrad-options-play', 'nexrad-options-pause');
	  		clearInterval(ninterval);
	  		
	  	}
	  	else
	  	{
	  		domClass.replace(this.pauseButton, 'nexrad-options-pause', 'nexrad-options-play');
	  		clearInterval(ninterval);
	  		this.start();
	  	}
	  },
	  
	  onPlayClick: function() {
	  	this.start();
	  },

	  onIntervalChanged: function() {
	  	//console.log("Old interval: " + interval);
	  	interval = this.intervalSelect.value * 1000;
	  	//console.log("New interval: " + interval);
	  	clearInterval(ninterval);
	  	this.start();
	  },

	  onOpacityChanged: function() {
	  	//console.log("Old opacity: " + opacity);
	  	opacity = this.opacitySelect.value / 100;
	  	//console.log("New opacity: " + opacity);
	  	nexradWMSLayer.setOpacity(opacity);
	  },

	  onLayerUpdate: function() {
	  	
	  	// Get current date/time
    	var dCurrent = new Date();
    	dCurrent.setMinutes(dCurrent.getMinutes() + metrics[iCount]);
		
		var sDate = (dCurrent.getMonth() + 1) + '-' + dCurrent.getDate() + '-' + dCurrent.getFullYear();
		var nHours = dCurrent.getHours();
		var nMins = dCurrent.getMinutes();
		var sMins = nMins, sHours = nHours;
		if (nHours < 10) {sHours = "0" + nHours; }
		if (nMins < 10) { sMins = "0" + nMins; }
		var sTime = sHours + ':' + sMins;
		
		this.nexradInfo.innerHTML = sDate + ' ' + sTime + ' EST';
	  },
    });

    return clazz;
  });