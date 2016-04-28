//Novascript d3 net grid viewer
//Author:  rms

function fnetviewer(divid, wd, ht, mr, mw, colrs, chg, ld, rws, cls, fo, gr, ar) {
	var rows = (rws)?rws:10, cols = (cls)?cls:10;
	var maxWt = mw;
	var maxFlow = 0;
	var width = wd, height = ht;
	var maxRad = mr, defRad = 10;
	var charg = (chg) ? chg : -800;
	var linkDist = (ld) ? ld : 200;
	var linkCol = d3.rgb("magenta");
	var foci = fo;
	var gravity = (gr==null)?0.1:gr;
	var alphaRate = (ar==null)?0.1:ar;
	var Nodes = [], Links = [], NodeMap = new Object(), LinkMap = new Object;
	var colors = arrayify(colrs);
	var wscale = d3.scale.linear()
	.domain([0, maxWt])
	.range([0, colors.length])
	var cscale = d3.scale.linear()
	.domain(d3.range(colors.length))
	.range(colors);
	var rscale = d3.scale.linear()
	.domain([-1, maxWt])
	.range([0, maxRad]);
	var svg, circles, lines, defs, force;

	function initSVG() {
		d3.select(divid).select("svg").remove();
		svg = d3.select(divid).append("svg")
		.attr("width", width)
		.attr("height", height)
		.attr("class", "g_main_agent")
		.attr("transform", "translate(0, 0)");

		force = d3.layout.force()
		.charge(charg)
		.linkDistance(linkDist)
		.gravity(gr)
		.size([width, height])

		var defs = svg.append("svg:defs");

		defs.append("svg:clipPath")
		.attr("id", "crect")
		.append("svg:rect")
		.attr('x', 0)
		.attr('y', 0)
		.attr("width", width)
		.attr("height", height);

		defs.selectAll("marker")
		.data(["a_black", "a_red", "a_magenta"])
		.enter().append("marker")
		.attr("id", function(d) { return d; })
		.attr("viewBox", "0 -5 10 10")
		.attr("refX", 8)
		.attr("refY", 0)
		.attr("markerWidth", 3)
		.attr("markerHeight", 3)
		.attr("orient", "auto")
		.attr("fill", function(d){return d.substring(2);})
		.append("path")
		.attr("d", "M0,-5L10,0L0,5");

		svg.append("rect")
		.attr("class", "click-capture")
		.attr('x', 0)
		.attr('y', 0)
		.attr("width", width)
		.attr("height", height)
		.style("fill", "#ffffff");
	}

	function clearData() {Nodes = []; NodeMap = new Object(); Links = []; LinkMap = new Object();}

	function updateNet(nodes, links) {
		lscale = d3.scale.linear()
		.domain([0, d3.max(links, function(d){return d.strength})])
		.range([0, 16]);
		maxFlow = Math.max(maxFlow, d3.max(links, function(d){return (d.flow)?d.flow:0}));

		var link = svg.selectAll(".link")
		.data(force.links())

		link
		.enter().append("path")
		.attr("class", "link")
		.attr("d", function(d){return "M"+d.source.x+","+d.source.y+"L"+d.target.x+","+d.target.y;})
		.attr("stroke-width", function(d){return Math.sqrt(lscale(d.strength))})
		.attr("stroke", "black")
		.attr("stroke-opacity", .6)
		.attr("marker-end", "url(\#a_black)")
		.on("mouseover", 
				function(d){d.mousein = true; d3.select(this)
			.attr("stroke", "red")
			.attr("marker-end", "url(\#a_red)")
			.append("svg:title")
			.text((d.flow) ? d.flow : 0);
		})
		.on("mouseout", 
				function(d){d.mousein = false; d3.select(this)
			.attr("stroke", linkColor)
			.attr("marker-end", function(){"url(\#a_"+((d.flow > 0)?"magenta":"black")+")"})
			.attr("stroke", "black")
			.attr("marker-end", "url(\#a_black)")
			.selectAll("title").remove();
		})

		link
		.attr("stroke", function(d){return (d.mousein) ? "red" : linkColor(d)})		
		.attr("marker-end", function(d) {return (d.mousein) ? "url(\#a_red)" : "url(\#a_"+((d.flow > 0)?"magenta":"black")+")"})

		var node = svg.selectAll(".node")
		.data(force.nodes());
		
		node
		.enter().append("circle")
		.attr("class", "node")
		.attr("r", function(d){return d.r})
		.style("fill", function(d) { return d.color; })
		.on("mouseover", 
				function(d){d3.select(this)
			.append("svg:title")
			.text(function(){return d.wt;})
		})
		.on("mouseout",  function(d){d3.select(this).selectAll("title").remove();})
		.call(force.drag)
		force.on("tick", tick);

		node
		.attr("r", function(d){return d.r})
		.style("fill", function(d) { return d.color; });

	}

	function tick(e) {
		var link = svg.selectAll(".link")		
		link.attr("d", function(d) {
			diffX = d.target.x - d.source.x;
			diffY = d.target.y - d.source.y;
			pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));
			offsetX = (pathLength > 0) ? (diffX * (d.target.r) * 1.2) / pathLength : 0;
			offsetY = (pathLength > 0) ? (diffY * (d.target.r) * 1.2) / pathLength : 0;	  
			return "M" + d.source.x + "," + d.source.y + "L" + (d.target.x - offsetX) + "," + (d.target.y - offsetY);
		});
		
		if (foci != null) {
			var k = alphaRate*e.alpha;
			force.nodes().forEach(function(o, i) {
    			o.y += (foci[o.group].y - o.y) * k;
    			o.x += (foci[o.group].x - o.x) * k;
  			});
		}
		var node = svg.selectAll(".node")
		.data(force.nodes());
		
		node.attr("cx", function(d) { return d.x; })
		.attr("cy", function(d) { return d.y; });
	};
	
	function linkColor(d) {
 		if (d.flow) {
 			var s = 10*d.flow/maxFlow;
 			return d3.rgb(s*linkCol.r, s*linkCol.g, s*linkCol.b)
 		}
		return "black"
	}
	
	function resize(width0, height0) {
		width = width0;
		height = height0;
		initSVG();
		updateNet(Nodes, Links);
	}

	function populate(nodes, links) {
		if (nodes.length == 0) return;
		for (var i in nodes) {
			var rec = buildDat(nodes[i]); 
			Nodes.push(rec);
			NodeMap[nodes[i].id] = rec 
		}
		Links = [];
		for (var i in links) {
			Links.push(cloneObject(links[i]));
			LinkMap[linkId(links[i])] = Links[i]
		}
		force
		.nodes(Nodes)
		.links(Links)
		.start();
		updateNet(Nodes, Links);
	}

	function render(nodes, links) {
		for (var i in nodes) {
			var rec0 = nodes[i];
			var rec = NodeMap[rec0.id];
			if (!rec) {
				rec = {};
				Nodes.push(rec);
				NodeMap[rec0.id] = rec;
			}
			buildDat(rec0, rec);
		}
		for (var i in links) {
			link0 = links[i];
			link = LinkMap[linkId(link0)];
			if (!link) continue;
			for (key in link0) {
				if (key != "source" && key != "target")
					link[key] = link0[key];
			}
		}
		updateNet(Nodes, Links);
	}

	function buildDat(dat, rec) {
		if (!rec) rec = {};
		rec.id = dat.id;
		rec.cy = Math.floor(dat.id/cols); 
		rec.cx = dat.id % cols
		rec.wt = dat.wt;
		rec.group = dat.group;
		rec.r = (dat.r) ? dat.r : (dat.wt) ? rscale(dat.wt) : defRad;
		rec.color = (dat.color != null)?dat.color:(dat.wt != null)?
				cscale(wscale(dat.wt))
				:"black";
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
			delete NodeMap[idList[i]];
		}
		Nodes = new Array();
		for (var id in NodeMap) Nodes.push(NodeMap[id]);
	}

	function reset(nodes, links) {
		clearData();
		initSVG();
		populate(nodes, links);
	}

	function linkId(link) {
		return link.source*10000 + link.target 
	}
	
	function idToCoords(id) {
		return {cy: Math.floor(id/cols), cx: id % cols}
	}

	function coordsToId(coords) {
		return coords.cy*cols + coords.cx;
	}
	
	function cloneObject(obj) {
    	if (obj === null || typeof obj !== 'object') {
        	return obj;
    	}
	    var temp = obj.constructor(); // give temp the original obj's constructor
	    for (var key in obj) {
    	    temp[key] = cloneObject(obj[key]);
    }
 
    return temp;
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
