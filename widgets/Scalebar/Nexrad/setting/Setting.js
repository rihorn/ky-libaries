define([
    'dojo/_base/declare',
    'dijit/_WidgetsInTemplateMixin',
    'jimu/BaseWidgetSetting',
    'dijit/form/TextBox',
    'dijit/form/NumberTextBox'
  ],
  function(
    declare,
    _WidgetsInTemplateMixin,
    BaseWidgetSetting) {
    return declare([BaseWidgetSetting, _WidgetsInTemplateMixin], {
      baseClass: 'jimu-widget-nexrad-setting',

      startup: function() {
        this.inherited(arguments);
        if (!this.config) {
          this.config = {};
        }
        this.setConfig(this.config);
      },

      setConfig: function(config) {
        this.config = config;
        if (config.url) {
          this.url.set('value', config.url);
        }
        if (config.interval) {
          this.interval.set('value', config.interval);
        }
        if (config.opacity) {
          this.opacity.set('value', config.opacity);
        }
        
        
      },

      getConfig: function() {
        if (!this.url.get('value') || !this.interval.get('value') 
         || !this.opacity.get('value')) {
          alert(this.nls.warning);
          return false;
        }
        this.config.url = this.url.get('value');
        this.config.interval = parseInt(this.interval.get('value'), 10);
        this.config.opacity = parseInt(this.opacity.get('value'), 10);

        return this.config;
      }

    });
  });