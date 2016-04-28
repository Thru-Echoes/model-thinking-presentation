//Novascript d3 net grid viewer
// Author:  rms

function netviewer(divid, rws, cls, u, mw, lcol, colrs, fm, bg) {
	var unit = u, rows = rws, cols = cls, dim = rws*cls;
	var maxWt = (mw) ? mw : 100, linkCol = d3.rgb((lcol)?lcol:"#444"), bcol = "#444";
	var maxFlow = 0;
	var fixedMarker = fm;
	var bgCol = (bg)?bg:"#ffffff";
	var width = unit*cols, height = unit*rows;
	var wrows = unit*rows, wcols = unit*cols, rad = 3*unit/7, defRad = rad/2;
	var Data = [], Links = [], DataMap = new Object();
	var colors = arrayify(colrs);
	var svg, circles, lines;
	var wscale = d3.scale.linear()
	.domain([0, maxWt])
	.range([0, colors.length])
	var cscale = d3.scale.linear()
	.domain(d3.range(colors.length))
	.range(colors);
	var rscale = d3.scale.linear()
		.domain([-1, maxWt])
		.range([0, rad]);
	var defs;
	

	function initSVG() {
		d3.select(divid).select("svg").remove();
		svg = d3.select(divid).append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("class", "g_main_agent")
		.attr("transform", "translate(0, 0)");

		defs = svg.append("svg:defs");

		defs.append("svg:clipPath")
		.attr("id", "crect")
		.append("svg:rect")
		.attr('x', 0)
		.attr('y', 0)
		.attr("width", width)
		.attr("height", height);

		defs.selectAll("marker").data(["arrow_red", "arrow_black"])
		.enter().append("svg:marker")
		.attr("id", function(d){return d})
  		.attr("viewBox", "0 0 10 10")
  		.attr("refX", 8)
  		.attr("refY", 5)
  		.attr("markerUnits", "strokeWidth")
  		.attr("markerWidth", 5)
  		.attr("markerHeight", 3)
  		.attr("orient", "auto")
  		.attr("fill", function(d){return d.substring(6);})
  		.append("svg:path")
  		.attr("d", "M 0 0 L 10 5 L 0 10 z");

		svg.append("rect")
		.attr("class", "click-capture")
		.attr('x', 0)
		.attr('y', 0)
		.attr("width", width)
		.attr("height", height)
		.style("fill", bgCol);
		circles = svg.append("g")
		.attr("id", "circles");
		lines = svg.append("g")
		.attr("id", "lines");
	}

	function clearData() {Data = []; Links = []; DataMap = new Object();}
	
	function updateNet(dat, links) {
		lscale = d3.scale.linear()
		.domain([0, d3.max(links, function(d){return d.strength})])
		.range([0, 16]);
		maxFlow = Math.max(maxFlow, d3.max(links, function(d){return (d.flow)?d.flow:0}));
		
		if (!fm) {
			var dselect = defs.selectAll("marker.colormarker").data(links, function(d){return d.source*dim+d.target});
			dselect
			.enter().append("svg:marker")
			.attr("id", function(d){var n = d.source*dim+d.target; return "arrow_"+n})
			.attr("class", "colormarker")
  			.attr("viewBox", "0 0 10 10")
  			.attr("refX", 8)
  			.attr("refY", 5)
  			.attr("markerUnits", "strokeWidth")
  			.attr("markerWidth", 5)
  			.attr("markerHeight", 3)
  			.attr("orient", "auto")
  			.append("svg:path")
  			.attr("d", "M 0 0 L 10 5 L 0 10 z")
  			.attr("fill", linkColor);
			dselect.selectAll("path").data(links, function(d){return d.source*dim+d.target})
  			.attr("fill", linkColor);
		}
		
		var select = lines.selectAll("line").data(links, function(d){return d.source*dim+d.target});
		select
		.enter().append("line")
 		.attr("x1", function(d){return d.endpts.x1}) 
 		.attr("x2", function(d){return d.endpts.x2}) 
 		.attr("y1", function(d){return d.endpts.y1}) 
 		.attr("y2", function(d){return d.endpts.y2}) 
 		.attr("stroke", linkColor)
 		.attr("stroke-width", function(d){return Math.sqrt(lscale(d.strength))})
		.attr("marker-end", markerURL)
		.on("mouseover", 
				function(d){d.mousein = true; d3.select(this)
							.style("stroke", "red")
							.attr("marker-end", "url(\#arrow_red)")
							.append("svg:title")
   							.text(d.flow)
				})
		.on("mouseout", 
				function(d){d.mousein = false; d3.select(this)
							.style("stroke", linkColor)
							.attr("marker-end", markerURL(d));
							lines.selectAll("title").remove();
				})

		select
		.attr("x1", function(d){
				var source = DataMap[d.source];
				var target = DataMap[d.target];
				var endpts = arcTo(unit*source.cx+rad, unit*source.cy+rad, unit*target.cx+rad, unit*target.cy+rad, source.r, target.r);
				d.endpts = endpts;
				return d.endpts.x1
			}) 
 		.attr("x2", function(d){return d.endpts.x2}) 
 		.attr("y1", function(d){return d.endpts.y1}) 
 		.attr("y2", function(d){return d.endpts.y2})
 		.attr("stroke", linkColor)
		.attr("marker-end", function(d){return (d.mousein)?"url(\#arrow_red)":markerURL(d)});
		
		select.exit().remove()
		
		select = circles.selectAll("circle").data(dat, function(d){return d.id;});		
		select
		.enter().append("circle")
		.attr("clip-path", "url(#crect)")
		.attr("id", function(d){return "A"+d.id})
		.attr("cx", function(d){return unit*d.cx+rad})
		.attr("cy", function(d){return unit*d.cy+rad})
		.attr("r", function(d){return d.r})
		.attr("fill", function(d){return d.color})
		.on("mouseover", 
				function(d){d3.select(this).append("svg:title")
   							.text(function(){return d.wt;})})
		.on("mouseout", 
				function(d){d3.select(this).selectAll("title").remove();})
		
		select
		.attr("r", function(d){return d.r})
		.attr("fill", function(d){return d.color});

	}
	
	function markerURL(d) {
		if (fixedMarker || !d.flow) return "url(\#arrow_black)";	
		var n = d.source*dim+d.target;
		return "url(\#arrow_"+n+")";		
	}
	
	function linkColor(d) {
 		if (d.flow) {
 			var s = 10*d.flow/maxFlow;
 			return d3.rgb(s*linkCol.r, s*linkCol.g, s*linkCol.b)
 		}
		return bcol;
	}
	
	function arcTo(xA, yA, xB, yB, r1, r2) {
		var dx = xB-xA;
		var dy = yB-yA 
		var theta = Math.atan2(dy, dx);
		var d = Math.sqrt(dx*dx+dy*dy);
		var d2 = d - r2;
		var rat = d2/d;
		var x1 = xA+r1*Math.cos(theta);
		var y1 = yA+r1*Math.sin(theta);
		var x2 = xA+(xB - xA) * rat;
		var y2 = yA+(yB - yA) * rat;
		return {x1: x1, x2: x2, y1: y1, y2: y2}
	}

	function resize(width0, height0) {
		width = width0;
		height = height0;
		initSVG();
		updateNet(Data, Links);
	}

	function populate(nodes, links) {
		if (nodes.length == 0) return;
		for (var i in nodes) {
			var rec = buildDat(nodes[i]); 
			Data.push(rec);
			DataMap[nodes[i].id] = rec 
		}
		for (var i in links) {
			connect = links[i];
			var source = DataMap[connect.source];
			var target = DataMap[connect.target];
			var endpts = arcTo(unit*source.cx+rad, unit*source.cy+rad, unit*target.cx+rad, unit*target.cy+rad, source.r, target.r);
			connect.endpts = endpts;
			Links.push(connect);				
		}
		updateNet(Data, Links);
	}

	function render(nodes, links) {
		if (nodes.length == 0) return;
		for (var i in nodes) {
			var rec0 = nodes[i]
			var rec = DataMap[rec0.id];
			if (!rec) {
				rec = {};
				Data.push(rec);
				DataMap[rec0.id] = rec;
			}
			buildDat(rec0, rec);
		}
		updateNet(Data, Links);
	}
	
	function buildDat(dat, rec) {
		if (!rec) rec = {};
		rec.id = dat.id;
		rec.cy = Math.floor(dat.id/cols); 
		rec.cx = dat.id % cols
		rec.wt = dat.wt;
		rec.r = (dat.r) ? dat.r : ("wt" in dat) ? Math.min(rscale(dat.wt), rscale(maxWt)) : defRad;
		rec.color = (dat.color)?dat.color:(dat.wt!=null)?cscale(wscale(dat.wt)):randomColor();
		return rec;
	} 	
	
	function randomColor() {
		var ans = "#"
			for (var i = 0; i < 3; i++) 
				ans = ans + Math.floor(16*Math.random()).toString(16);
		return ans;
	}

	function create(nodes, links) {
		populate(nodes, links);
	}

	function kill(idList) {
		if (idList.length == 0) return;
		for (var i in idList) {
			delete DataMap[idList[i]];
		}
		Data = new Array();
		for (var id in DataMap) Data.push(DataMap[id]);
	}

	function reset(nodes, links) {
		clearData();
		initSVG();
		populate(nodes, links);
	}

	function idToCoords(id) {
		return {cy: Math.floor(id/cols), cx: id % cols}
	}
	
	function coordsToId(coords) {
		return coords.cy*cols + coords.cx;
	}


	function arrayify(obj) {
		if (!obj) return obj;
		if (Array.isArray(obj)) return obj;
		var keys = Object.keys(obj);
		var ans = new Array();
		for (var key in keys) ans[+keys[key]] = obj[keys[key]];
		return ans;
	}

	reset([], []);

	return {render: render, reset: reset, create: create, kill: kill,
		idToCoords: idToCoords, coordsToId: coordsToId}
	
}