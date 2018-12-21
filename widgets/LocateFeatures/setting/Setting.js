///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'dojo/_base/query',
  'dojo/on',
  'dijit/_WidgetsInTemplateMixin',
  'jimu/BaseWidgetSetting',
  'jimu/dijit/TabContainer',
  'jimu/dijit/SimpleTable',
  'jimu/dijit/_FeaturelayerSourcePopup',
  './SingleLayerSetting',
  'esri/request'
],
function(declare, lang, array, html, query, on, _WidgetsInTemplateMixin, BaseWidgetSetting,
  TabContainer, SimpleTable, _FeaturelayerSourcePopup, SingleLayerSetting, esriRequest) {
  return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
    baseClass: 'jimu-widget-locatefeatures-setting',
    currentSLS: null,

    postCreate:function(){
      this.inherited(arguments);

      if(this.config){
        this.setConfig(this.config);
      }
    },

    setConfig:function(config){
      if(this.currentSLS){
        this.currentSLS.destroy();
      }
      this.currentSLS = null;
      this.layerList.clear();

      this.config = config;
      var layers = this.config && this.config.layers;
      var validConfig = layers && layers.length >= 0;
      if(validConfig){
        array.forEach(layers,lang.hitch(this, function(singleConfig, index){
          var addResult = this.layerList.addRow({name: singleConfig.name || ''});
          var tr = addResult.tr;
          tr.singleConfig = lang.clone(singleConfig);
          if(index === 0){
            this.layerList.selectRow(tr);
          }
        }));
      }
    },

    getConfig: function () {
      if(this.currentSLS){
        var currentSingleConfig = this.currentSLS.getConfig();
        if(currentSingleConfig){
          this.currentSLS.tr.singleConfig = lang.clone(currentSingleConfig);
        }
        else{
          return false;
        }
      }
      var config = {
        layers:[]
      };
      var trs = this.layerList.getRows();
      for(var i = 0; i < trs.length; i++){
        var tr = trs[i];
        config.layers.push(lang.clone(tr.singleConfig));
      }
      this.config = lang.clone(config);
      return config;
    },

    _createSingleLayerSetting:function(tr){
      var args = {
        map: this.map,
        nls: this.nls,
        config: tr.singleConfig,
        tr: tr,
        _layerDefinition: tr._layerDefinition,
        appConfig: this.appConfig
      };
      this.currentSLS = new SingleLayerSetting(args);
      this.currentSLS.placeAt(this.singleLayerContainer);

      this.own(on(this.currentSLS,'name-change', lang.hitch(this, function(layerName){
        this.layerList.editRow(tr, {name: layerName});
      })));

      this.own(on(this.currentSLS, 'show-shelter', lang.hitch(this, function(){
        this.shelter.show();
      })));

      this.own(on(this.currentSLS, 'hide-shelter', lang.hitch(this, function(){
        this.shelter.hide();
      })));

      //first bind event, then setConfig, don't startup here
      this.currentSLS.setConfig(this.currentSLS.config);
      
      return this.currentSLS;
    },

    _onAddNewClicked:function(){
      if(this.currentSLS){
        var singleConfig = this.currentSLS.getConfig();
        if(singleConfig){
          this.currentSLS.tr.singleConfig = singleConfig;
          this.currentSLS.destroy();
          this.currentSLS = null;
        }
        else{
          return;
        }
      }

      var args = {
        titleLabel: this.nls.setDataSource,

        featureArgs: {
          multiple: false,
          createMapResponse: this.map.webMapResponse,
          portalUrl: this.appConfig.portalUrl,
          style: {
            height: '100%'
          }
        }
      };

      var featurePopup = new _FeaturelayerSourcePopup(args);
      this.own(on(featurePopup, 'ok', lang.hitch(this, function(item){

        featurePopup.close();
        
        //console.log("1: " + item.name);
        
        var layerName = item.name||"";
        var addResult = this.layerList.addRow({name: layerName});
        if (addResult.success) {
          var tr = addResult.tr;
          this.layerList.selectRow(tr);
          if(this.currentSLS){
            this.currentSLS.setNewLayerDefinition(item.name, item.url, item.definition, layerName);
          }
        }
      })));

      this.own(on(featurePopup, 'cancel', lang.hitch(this, function(){
        featurePopup.close();
      })));

      featurePopup.startup();
    },

    _getSuitableLayerName: function(name){
      var finalName = name;
      var data = this.layerList.getData();
      var allNames = array.map(data, lang.hitch(this, function(rowData){
        return rowData.name;
      }));

      var flag = 2;
      while(array.indexOf(allNames, finalName) >= 0){
        name += ' ' + flag;
        flag++;
      }

      return name;
    },

    _onLayerItemRemoved:function(tr){
      if(this.currentSLS){
        if(this.currentSLS.tr === tr){
          this.currentSLS.destroy();
          this.currentSLS = null;
        }
      }
    },

    _onLayerItemSelected:function(tr){
      if(this.currentSLS){
        if(this.currentSLS.tr !== tr){
          var singleConfig = this.currentSLS.getConfig();
          if(singleConfig){
            this.currentSLS.tr.singleConfig = singleConfig;
            this.currentSLS.destroy();
            this.currentSLS = null;
            this._createSingleLayerSetting(tr);
          }
          else{
            this.layerList.selectRow(this.currentSLS.tr);
          }
        }
      }
      else{
        this._createSingleLayerSetting(tr);
      }
    }
    
  });
});