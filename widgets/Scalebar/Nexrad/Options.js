define([
  'dojo/_base/declare',
  'dijit/_WidgetBase',
  'dijit/_TemplatedMixin',
  'dijit/_WidgetsInTemplateMixin',
  'dijit/form/Form',
  'dijit/form/Button',
  'dijit/form/HorizontalSlider',
  'dijit/TooltipDialog',
  'esri/request',
  'dojo/store/Memory',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/dom-style',
  'dojo/dom-construct',
  'dojo/dom-class',
  'dojo/json',
  'jimu/portalUrlUtils',
  './Options',
  'dojo/text!./templates/Options.html',
  'dojo/aspect',
  'jimu/dijit/LoadingShelter',
  'jimu/dijit/Message'
], function(
  declare,
  _WidgetBase,
  _TemplatedMixin,
  _WidgetsInTemplateMixin,
  Form,
  Button,
  HorizontalSlider,
  TooltipDialog,
  esriRequest,
  Memory,
  lang,
  array,
  domStyle,
  domConstruct,
  domClass,
  dojoJSON,
  portalUrlUtils,
  Options,
  optionsTemplate,
  printResultTemplate,
  aspect,
  LoadingShelter,
  Message) {
  // Options dijit
  var OptionsDijit = declare([_WidgetBase, _TemplatedMixin, _WidgetsInTemplateMixin], {
    widgetsInTemplate: true,
    templateString: optionsTemplate,
    baseClass: "optionsDijit",
    playIcon: require.toUrl("./widgets/Nexrad/images/play.png"),
    pauseIcon: require.toUrl("./widgets/Nexrad/images/pause.png"),
    postCreate: function() {
      this.inherited(arguments);
      this.shelter = new LoadingShelter({
        hidden: true
      });
      this.shelter.placeAt(this.domNode);
      this.shelter.startup();
      this.shelter.show();

    },

    _handleError: function(err) {
      console.log('nexrad widget load error: ', err);
      new Message({
        message: err.message || err
      });
    },

    play: function() {
   
    },

	pause: function() {
   
    },

    changeOpacity: function() {
      domConstruct.empty(this.printResultsNode);
      domStyle.set(this.clearActionBarNode, 'display', 'none');
      this.count = 1;
    }
  });
});