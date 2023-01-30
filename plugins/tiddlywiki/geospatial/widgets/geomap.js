/*\
title: $:/plugins/tiddlywiki/geospatial/geomap.js
type: application/javascript
module-type: widget

Leaflet map widget

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var GeomapWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
GeomapWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
GeomapWidget.prototype.render = function(parent,nextSibling) {
	// Housekeeping
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	// Render a wrapper for the map
	var domNode = this.document.createElement("div");
	domNode.style.width = "100%";
	domNode.style.height = "600px";
	// Insert it into the DOM
	parent.insertBefore(domNode,nextSibling);
	this.domNodes.push(domNode);
	// Render the map
	if($tw.browser) {
		this.renderMap(domNode);
	}
};

GeomapWidget.prototype.renderMap = function(domNode) {
	var self = this;
	// Get Leaflet
	var L = require("$:/plugins/tiddlywiki/geospatial/leaflet.js");
	// Create and position the map
	const map = L.map(domNode).setView([51.505, -0.09], 13);
	map.fitWorld();
	// Setup the tile layer
	const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
	}).addTo(map);
	// Disable Leaflet attribution
	map.attributionControl.setPrefix("");
	// Create default icon
	const iconProportions = 365/560,
		iconHeight = 50;
	const myIcon = new L.Icon({
		iconUrl: $tw.utils.makeDataUri(this.wiki.getTiddlerText("$:/plugins/tiddlywiki/geospatial/images/markers/pin"),"image/svg+xml"),
		iconSize:     [iconHeight * iconProportions, iconHeight], // Size of the icon
		iconAnchor:   [(iconHeight * iconProportions) / 2, iconHeight], // Position of the anchor within the icon
		popupAnchor:  [0, -iconHeight] // Position of the popup anchor relative to the icon anchor
	});
	// Add scale
	L.control.scale().addTo(map);
	// Add overlays
	if(this.geomapLayerFilter) {
		$tw.utils.each(this.wiki.filterTiddlers(this.geomapLayerFilter,this),function(title) {
			var tiddler = self.wiki.getTiddler(title);
			if(tiddler) {
				var layer = L.geoJSON($tw.utils.parseJSONSafe(tiddler.fields.text || "[]",[]),{
					style: function(geoJsonFeature) {
						return {
							color: tiddler.getFieldString("color") || "yellow"
						}
					}
				}).addTo(map);
			}
		});
	}
	// Add markers
	if(this.geomapMarkerFilter) {
		$tw.utils.each(this.wiki.filterTiddlers(this.geomapMarkerFilter,this),function(title) {
			var tiddler = self.wiki.getTiddler(title);
			if(tiddler) {
				var lat = $tw.utils.parseNumber(tiddler.fields.lat || "0"),
					long = $tw.utils.parseNumber(tiddler.fields.long || "0"),
					alt = $tw.utils.parseNumber(tiddler.fields.alt || "0"),
					caption = tiddler.fields.caption || title,
					icon = myIcon;
				if(tiddler.fields["icon-url"]) {
					icon = new L.Icon({
						iconUrl: tiddler.fields["icon-url"],
						iconSize:     [32, 32], // Size of the icon
						iconAnchor:   [16, 32], // Position of the anchor within the icon
						popupAnchor:  [16, -32] // Position of the popup anchor relative to the icon anchor
					});
				}
				var m = L.marker([lat,long,alt],{icon: icon,draggable: false}).bindPopup(caption).addTo(map);
			}
		});
	}
};

/*
Compute the internal state of the widget
*/
GeomapWidget.prototype.execute = function() {
	this.geomapLayerFilter = this.getAttribute("layers");
	this.geomapMarkerFilter = this.getAttribute("markers");
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
GeomapWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	if($tw.utils.count(changedAttributes) > 0) {
		this.refreshSelf();
		return true;
	} else {
		return false;	
	}
};

exports.geomap = GeomapWidget;

})();
