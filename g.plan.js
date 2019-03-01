
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.G = {})));
}(this, (function (exports) { 'use strict';

var version = "1.4.0+HEAD.3337f36";

var Scale = function(){
	// the cached instance
	var instance;
	var pixel_count = 1;
  var actual_measure = 1;
	// rewrite the constructor
	Scale = function() {
		return instance;
	};

	// carry over the prototype
	Scale.prototype = this;

	// the instance
	instance = new Scale();

	// reset the constructor pointer
	instance.constructor = Scale;

	// all the functionality
	instance.scale = function(input){
		return (d3.scaleLinear().domain([0,actual_measure]).range([0,pixel_count]))(input);
	};
	instance.setScale=function(p_count,a_measure){
		pixel_count = p_count;
		actual_measure =  a_measure;
	};
	return instance;

};
/**
* The central class of the API — it is used to create a plan on a page and manipulate it.
*
* ```js
* // Example: initialize the map on the "plan" div with a given center and zoom
* var plan = G.plan('plan', {
*    view_port_width: 1200,
*    view_port_height: 600,
*    plan_image: 'floorplan.jpg'
*});
*```
* @class Plan
*/

var Plan = function(container, options){
	let _container = d3.select("#"+container)
	let _options ={
    view_port_width: undefined,
    view_port_height: undefined,
    plan_image: undefined,
  }

	_options.view_port_width = options.options;
	_options.view_port_height = options.view_port_height;
	_options.plan_image = options.plan_image;
	initializePlan(container);
	Object.defineProperty(this,'options',{
		get: function(){
			return _options;
		}
	})

	function initializePlan(){
		var svgInstance = _container.append("svg").attr("class","geo-plan").attr('width', '100%').attr('height', "100%");
    var zoom_container=svgInstance.append("g").attr('class','zoom-container').attr("transform", "translate(0,0)scale(1)");
		zoom_container.append("image").attr("xlink:href",_options.plan_image)

	}

	this.instance = function(){
		return d3.select('svg.geo-plan').select('g.zoom-container');
	}
	this.root = function(){
		return d3.select('svg.geo-plan')
	}
}

/**
* L.Layer Class Used to draw and manipulate various layer on base layer.
*
* ```js
* // Example: create a layer and add it to plan
* var layer = G.layer(
*   id: 'XDCCMFF-DMKMFF-DDD',
*   name: "Zones",
*}).addTo(plan)
*```
* @class Layer
*/

var Layer = function(id, name){
  this.id = id || new Date().getTime().toString(16).toUpperCase();
	this.name = name || this.id
	/**
	* Add a layer to target plan
	* @method addTo
	* @param {Plan} plan target plan object to add the layer.
	* @return {void}
	*/
	this.addTo = function(target){
		target.instance().append('g').attr('id',"layer_"+this.id);
	}
	this.instance = function(){
		return d3.select('g#'+"layer_"+this.id);
	}
}

var Shape = function(id,name,options){
	this.id  = id || new Date().getTime().toString(16).toUpperCase();
	this.name = name;
	let _options ={
		fill: '#000000',
		'fill-opacity': '.2',
		stroke: 'black',
		'stroke-width': 1,
		'text-color': '#000000',
		'font-size': 15
	};

	Object.defineProperty(this,'options',{
		get: function(){
			return _options;
		},
		set: function(options){
			_options =options;
		}
	})
}

var Circle = function(id,name,options){
	this.prototype = new Shape(id,name,options)
	let _options = this.prototype.options
	Object.assign(_options,options)
	_options.cx =  G.scale.scale(_options.cx);
	_options.cy =  G.scale.scale(_options.cy);
	_options.r =  G.scale.scale(_options.r);
	Object.defineProperty(this,'options',{
		get: function(){
			return _options;
		},
		set: function(options){
			_options =options;
		}
	})
	this.addTo = function(target){
		var g_container =target.instance().append('g').attr('id','g_circle_'+id)
		var circle =g_container.append('circle').datum(_options)
		circle.attrs(_options);
		g_container.append('text').text(this.prototype.name).attrs({x: _options.cx,y: _options.cy,fill: this.prototype.options['text-color'],'text-anchor':"middle", 'alignment-baseline':"central"})
		.style("font-size", function(d){return Math.min(2 * _options.r, (2 * _options.r - 8) / this.getComputedTextLength() * _options['font-size'],_options['font-size']) + "px"; });
	}
}

var Rectangle = function(id,name,options){
	this.prototype = new Shape(id,name,options)
	let _options = this.prototype.options
	Object.assign(_options,options)
	_options.x =  G.scale.scale(_options.x);
	_options.y =  G.scale.scale(_options.y);
	_options.width =  G.scale.scale(_options.width);
	_options.height =  G.scale.scale(_options.height);

	Object.defineProperty(this,'options',{
		get: function(){
			return _options;
		},
		set: function(options){
			_options =options;
		}
	})
	this.addTo = function(target){
		var g_container =target.instance().append('g').attr('id','g_rect_'+id)
		var rectangle =g_container.append('rect').datum(_options)
		var center ={
			x: _options.x + _options.width /2,
			y: _options.y + _options.height /2,
		}
		rectangle.attrs(_options);
		g_container.append('text').text(this.prototype.name).attrs({x: center.x,y: center.y,fill: this.prototype.options['text-color'], 'text-anchor':"middle", 'alignment-baseline':"central"})
		.style("font-size", function(d){return Math.min(_options.width, (_options.width - 8) / this.getComputedTextLength() * _options['font-size'], _options['font-size']) + "px"; });
	}
}

var Polygon = function(id,name,options){
	this.prototype = new Shape(id,name,options)
	let _options = this.prototype.options
	Object.assign(_options,options)
	_options.points = _options.points.map(function(d) { return [G.scale.scale(d[0]),G.scale.scale(d[1])].join(",")}).join(" ");

	this.addTo = function(target){
		var g_container =target.instance().append('g').attr('id','g_poly_'+id)
		var polygon =g_container.append('polygon').datum(_options)

		polygon.attrs(_options);
		var bBox = polygon.node().getBBox();
		var center ={
			x: bBox.x + bBox.width /2,
			y: bBox.y + bBox.height /2,
		}
		g_container.append('text').text(this.prototype.name).attrs({x: center.x,y: center.y,fill: this.prototype.options['text-color'], 'text-anchor':"middle", 'alignment-baseline':"central"})
		.style("font-size", function(d){ return Math.min(bBox.width, (bBox.width - 8) / this.getComputedTextLength() * _options['font-size'],_options['font-size']) + "px"; });
	}
}

var Zoom = function(target){
	let _target = target;
	var zoom = d3.zoom().scaleExtent([1, 10]).on("zoom", function(){
		return _target.instance().attrs({
	    transform: d3.event.transform
	  });
	});
	this.enableScrollZoom = function(status){
		if(status){
			_target.root().call(zoom)
		}else{
			_target.root().on('.zoom', null);
		}
	}
	this.fitBounds = function(elem){
		var d = elem.node().getBBox();
		var svg = _target.root();
    var width = svg.node().getBoundingClientRect().width;
    var height = svg.node().getBoundingClientRect().height;
    var center ={
    	x: d.x + d.width / 2,
    	y: d.y + d.height / 2
    };
		var transform = to_bounding_box(width, height, center, d.width, d.height, height / 10);
		return _target.root().transition().duration(2000).call(zoom.transform, transform);
	}
}

function createPlan(container,options){
  return new Plan(container,options)
}

function createLayer(id,name){
  return new Layer(id,name)
}

function createCircle(id,name,options){
  return new Circle(id,name,options)
}

function createRectangle(id,name,options){
  return new Rectangle(id,name,options)
}
function createPolygon(id,name,options){
  return new Polygon(id,name,options)
}

function createZoom(target){
  return new Zoom(target)
}


function to_bounding_box(W, H, center, w, h, margin) {
  var k, kh, kw, x, y;
  kw = (W - margin) / w;
  kh = (H - margin) / h;
  k = d3.min([kw, kh]);
  x = W / 2 - center.x * k;
  y = H / 2 - center.y * k;
	//return {x: x, y: y, k: k};
  return d3.zoomIdentity.translate(x, y).scale(k);
};

exports.plan = createPlan;
exports.layer = createLayer;
exports.circle = createCircle;
exports.rectangle = createRectangle;
exports.polygon = createPolygon;
exports.zoom = createZoom;
exports.scale = new Scale();

var oldL = window.G;
exports.noConflict = function() {
	window.G = oldL;
	return this;
}

// Always export us to window global (see #2364)
window.G = exports;

})));
//# sourceMappingURL=leaflet-src.js.map
