//Novascript d3 agent viewer

function agentviewer(divid, wd, ht, u, rws, cls, dur, img, fll) {
	var width = wd, height = ht, unit = u, rows = rws, cols = cls;
	var duration = (dur) ? dur : 20;
	var wrows = unit*rows, wcols = unit*cols;
	var Data = [], DataMap = new Object();
	var svg, arcs, DefRadius = 15;
	var doImage = (img)?img:false;
	var fill = fll;
	
	function initSVG() {
		d3.select(divid).select("svg").remove();
		svg = d3.select(divid).append("svg")
		.attr("width", width)
		.attr("height", height)
		.append("g")
		.attr("class", "g_main_agent")
		.attr("transform", "translate(0, 0)");

		var defs = svg.append("svg:defs");

		defs.append("svg:clipPath")
		.attr("id", "crect")
		.append("svg:rect")
		.attr('x', 0)
		.attr('y', 0)
		.attr("width", width)
		.attr("height", height);

		var click = svg.append("rect")
		.attr("class", "click-capture")
		.attr('x', 0)
		.attr('y', 0)
		.attr("width", width)
		.attr("height", height)
		
		if (fill) click.style("fill", fill);
	}

	function pushData(x, y, r, id, color) {
		Data.push({x:x, y:y, r:r, id:id, color:color});
	}

	function clearData() {Data = []; DataMap = new Object();}

	function updateAgent(dat) {
		var dat0 = [];
		var dat1 = [];
		for (var i in dat) {
			if (dat[i].wrapped) dat1.push(dat[i]);
			else dat0.push(dat[i]);
		}
		if (doImage) {
			var select = svg.selectAll("image").data(dat)
			select.exit().remove();
			var select0 = svg.selectAll("image").data(dat0)			
			select0
			.enter().append("image")
			.attr("id", function(d){return "A"+d.id})
			.attr("clip-path", "url(#crect)")			
			.attr("transform", function(d){return "translate("+(unit*d.cx-d.image.size[0]/2)+","+(unit*d.cy-d.image.size[1]/2)+")";})
			.attr("xlink:href", function(d){return d.image.src})
			.attr("x", 0)
			.attr("y", 0)
			.attr("height", function(d){return d.image.size[1]})
			.attr("width",  function(d){return d.image.size[0]});
			select0
			.attr("xlink:href", function(d){return d.image.src})
			.attr("height", function(d){return d.image.size[1]})
			.attr("width",  function(d){return d.image.size[0]});
			select0.transition().duration(duration)
			.attr("transform", function(d){return "translate("+(unit*d.cx-d.image.size[0]/2)+","+(unit*d.cy-d.image.size[1]/2)+")";});
			var select1 = svg.selectAll("image").data(dat1)
			select1
			.attr("transform", function(d){return "translate("+(unit*d.cx-d.image.size[0]/2)+","+(unit*d.cy-d.image.size[1]/2)+")";})
			.attr("xlink:href", function(d){return d.image.src})
			.attr("height", function(d){return d.image.size[1]})
			.attr("width",  function(d){return d.image.size[0]});
		} else {
			var select = svg.selectAll("circle").data(dat)
			select.exit().remove();
			var select0 = svg.selectAll("circle").data(dat0)
			select0
			.enter().append("circle")
			.attr("clip-path", "url(#crect)")
			.attr("id", function(d){return "A"+d.id})
			.attr("cx", function(d){return unit*d.cx})
			.attr("cy", function(d){return unit*d.cy})
			.attr("r", function(d){return (d.r) ? d.r : DefRadius})
			.attr("fill", function(d){return d.col})
			select0
			.attr("r", function(d){return (d.r) ? d.r : DefRadius})
			.attr("fill", function(d){return d.col})
			select0.transition().duration(duration)
			.attr("cx", function(d){return wrap(unit*d.cx, wcols)})
			.attr("cy", function(d){return wrap(unit*d.cy, wrows)});
			var select1 = svg.selectAll("circle").data(dat1, function(d){return d.id;});
			select1
			.attr("cx", function(d){return wrap(unit*d.cx, wcols)})
			.attr("cy", function(d){return wrap(unit*d.cy, wrows)})
			.attr("r", function(d){return d.r;})
			.style("fill", function(d){return d.col});
		}
		
	}

	function resize(width0, height0) {
		width = width0;
		height = height0;
		initSVG();
		updateAgent(Data);
	}

	function populate(datl) {
		for (var i in datl) {
			var dat = datl[i];
			var rec = {id: dat.id, cx: dat.cx, cy: dat.cy, r: (dat.r)?dat.r:5+15*Math.random(),
					col: (dat.col)?dat.col:randomColor(), wrapped: false}
			if (dat.image) rec.image = dat.image;
			Data.push(rec);
			DataMap[dat.id] = rec 
		}
		updateAgent(Data);
	}

	function randomColor() {
		var ans = "#"
			for (var i = 0; i < 3; i++) 
				ans = ans + Math.floor(16*Math.random()).toString(16);
		return ans;
	}

	function wrap(v, b) {
		return (v + b) % b;
	}

	function create(datl) {
		if (datl.length > 0) populate(datl);
	}

	function kill(idList) {
		if (idList.length == 0) return;
		for (var i in idList) {
			delete DataMap[idList[i]];
		}
		Data = new Array();
		for (var id in DataMap) Data.push(DataMap[id]);
	}

	function reset(datl) {
		clearData();
		initSVG();
		if (datl.length > 0) populate(datl);
	}

	function render(xyDat) {
		var dat = [];
		for (var i in xyDat) {
			var rec0 = xyDat[i]
			var rec = DataMap[rec0.id];
			if (!rec) continue;
			var keys = Object.keys(rec0);
			for (var key in keys) rec[keys[key]] = rec0[keys[key]];
		}
		updateAgent(Data);
	}

	reset([]);

	return {render: render, reset: reset, create: create, kill: kill}
}
