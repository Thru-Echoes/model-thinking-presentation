function agentviewerx(divid, u, rws, cls, colrs, dur, tooltipY, imgs) {
	var width = u*cls, height = u*rws, unit = u, rows = rws, cols = cls;
	var duration = (dur) ? dur : 20;
	var AData = [], ADataMap = new Object(), ADataLocMap = new Object();
	var CData = [], CDataMap = new Object();
	var ccolors = null;
	var acolors = null;
	if (colrs.cell) {
		ccolors = arrayify(colrs.cell);
		acolors = arrayify(colrs.agent);
	} else {
		ccolors = arrayify(colrs);
	}
	var images = (imgs)?imgs:null;
	var doImage = (images != null);
	var tooltipYes = tooltipY;
	var svg = null, svgAgent, svgCell, DefRadius = 15;
	var mousedown = false, mousedragged = false;
	var dragcol = 0;
	var initCBucket = new Object();
	var initABucket = new Object();
	var tooltip, tooltipId;
	if (tooltipYes) {
		tooltip = d3.select("body")
		.append("div")
		.style("position", "absolute")
		.style("z-index", "10")
		.style("visibility", "hidden")
		.style("background-color", "#FFFFAA")
		.style("padding-left", "3px")
		.style("padding-right", "3px");
	}
	function initSVG() {
		d3.select(divid).select(".g_main_cell").remove();
		d3.select(divid).select(".g_main_agent").remove();
		if (!svg) {
			svg = d3.select(divid).append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g")
			.attr("id", "g_main_parent");
			var defs = svg.append("svg:defs");
			defs.append("svg:clipPath")
			.attr("id", "crect")
			.append("svg:rect")
			.attr('x', 0)
			.attr('y', 0)
			.attr("width", width)
			.attr("height", height);
		}
		svgCell = svg
		.append("g")
		.attr("class", "g_main_cell")
		.attr("transform", "translate(0, 0)")
		svgAgent = svg
		.append("g")
		.attr("class", "g_main_agent")
		.attr("transform", "translate(0, 0)");
		var tmp = svg
		.on("ondragstart", function(){return false;})
		.on("ondrag", function(){
			mousedown = true;
			mousedragged = true;
			var cx = d3.mouse(this)[0];
			var cy = d3.mouse(this)[1];
			var rec = CDataMap[cIdMaker(Math.floor(cy/unit), Math.floor(cx/unit))];
			if (rec) {
				initCBucket[rec.id] = rec;
				dragcol = rec.colorIdx;
				updateCells([rec]);
			}
		})
		.on("mousedown", function(){
			d3.event.preventDefault();						
			mousedown = true;
			var cx = d3.mouse(this)[0];
			var cy = d3.mouse(this)[1];
			var rec = CDataMap[cIdMaker(Math.floor(cy/unit), Math.floor(cx/unit))];
			if (rec) dragcol = rec.colorIdx;
		})
		.on("mouseup", function(){mousedown = false;})
		.on("mousemove", function(){
			if (mousedown) {
				mousedragged = true;			
				var cx = d3.mouse(this)[0];
				var cy = d3.mouse(this)[1];
				var rec = CDataMap[cIdMaker(Math.floor(cy/unit), Math.floor(cx/unit))];
				recordCellData(rec, dragcol);
				if (tooltipYes) return tooltip.style("visibility", "hidden");								
			} else if (tooltipYes) {
				var cx = d3.mouse(this)[0];
				var cy = d3.mouse(this)[1];
				var id = cIdMaker(Math.floor(cy/unit), Math.floor(cx/unit));
				var rec = DataMap[id];
				tooltipId = id;
				return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px").text(rec.colorIdx);
			}
		})
		.on("click", function () {
			d3.event.preventDefault();			
			if (mousedragged) {
				mousedragged = false;
				return;
			}
			var cx = Math.floor(d3.mouse(this)[0]/unit);
			var cy = Math.floor(d3.mouse(this)[1]/unit);
			if (d3.event.shiftKey) {
				var rec = getAgentUsingCoords(cx, cy);
				if (!rec) {
					var cx0 = cx+0.5;
					var cy0 = cy+0.5;
					var rec = {id: AData.length, cx: cx0, cy: cy0, colorIdx: 0, r: unit/2,
								ix: cx0, iy: cy0};
					if (doImage) rec.image = pickImage(rec.colorIdx);
					addAgent(rec);
					initABucket[rec.id] = rec;
					updateAgent(AData);
				} else {
					var keys = Object.keys((doImage)?images:acolors);
					var idx = nsutil.binaryIndexOf(keys, rec.colorIdx);
					var key1;
					if (+keys[idx] > rec.colorIdx) {
						key1 = +keys[idx];
					} else if (idx < keys.length-1){
						key1 = +keys[idx+1];
					} else key1 = null;
					if (key1 != null) {
						rec.colorIdx = key1;
						if (doImage) rec.image = pickImage(rec.colorIdx);						
						initABucket[rec.id].colorIdx = key1;
					} else {
						removeAgent(rec);
						initABucket = new Object();
						for (var id in ADataMap) initABucket[id] = ADataMap[id]; 
					}
					updateAgent(AData);
				}
			} else {
				var rec = CDataMap[cIdMaker(cy, cx)];
				var keys = Object.keys(ccolors);
				var idx = nsutil.binaryIndexOf(keys, rec.colorIdx);
				var key1;
				if (+keys[idx] > rec.colorIdx) {
					key1 = +keys[idx];
				} else {
					key1 = +keys[(idx+1)%keys.length];
				}
				recordCellData(rec, key1);
				if (tooltipYes) tooltip.text(rec.colorIdx);			
				mousedown = false;
			}
		});
		if (tooltipYes) {
			tmp = tmp
			.on("mouseover", function(){
				var cx = d3.mouse(this)[0];
				var cy = d3.mouse(this)[1];
				var id = cIdMaker(Math.floor(cy/unit), Math.floor(cx/unit));
				var rec = DataMap[id];
				tooltipId = id;
				return tooltip.style("visibility", "visible").text(rec.colorIdx);
			})
			.on("mouseout", function(){tooltipId = null; return tooltip.style("visibility", "hidden");});
		}
		svgCell.append("g")
		.attr("id", "cellmatrix")
	}

	function recordCellData(rec, colorIdx) {
		if (rec) {
			initCBucket[rec.id] = rec;
			rec.colorIdx = colorIdx;
			updateCells([rec]);
		}
	}

	function pushCellData(r, c, id, colorIdx) {
		CData.push({r:x, c:y, id:id, colorIdx:colorIdx});
	}

	function pushAgentData(x, y, r, id, colorIdx) {
		var dat = {x:x, y:y, r:r, id:id, colorIdx:colorIdx};
		if (doImage) rec.image = pickImage(rec.colorIdx);			
		AData.push(dat);
	}

	function clearData() {
		CData = []; CDataMap = new Object(); 
//		initCBucket = new Object();
//		initABucket = new Object();
		AData = []; ADataMap = new Object();
		ADataLocMap = new Object();
	}

	function initCells(dat) {
		var select = svgCell.select("#cellmatrix").selectAll("rect")
		.data(dat, function(d){return d.id;});
		select
		.enter().append("rect")
		.attr("clip-path", "url(#crect)")
		.attr("id", function(d){return d.id})
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", unit+1)
		.attr("height", unit+1)
		.attr("transform", function(d){return "translate("+unit*d.c+", "+unit*d.r+")";})
		.attr("fill", function(d){return colorPick(d.colorIdx, ccolors);})
		updateCells(dat);
	}
	
	function updateCells(dat) {
		var select = svgCell.select("#cellmatrix").selectAll("rect")
		.data(dat, function(d){return d.id;});
		select
		.attr("fill", function(d){return colorPick(d.colorIdx, ccolors);})
	}

	function updateAgent(dat) {
		var dat0 = [];
		var dat1 = [];
		for (var i in dat) {
			if (dat[i].wrapped) dat1.push(dat[i]);
			else dat0.push(dat[i]);
		}
		if (doImage) {
			var select = svgAgent.selectAll("image").data(dat)
			select.exit().remove();
			var select0 = svgAgent.selectAll("image").data(dat0)			
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
			.select("image")
			.attr("xlink:href", function(d){return d.image.src})
			.attr("height", function(d){return d.image.size[1]})
			.attr("width",  function(d){return d.image.size[0]});
		} else {
			var select = svgAgent.selectAll("circle").data(dat, function(d){return d.id;});
			select.exit().remove();
		
			var select0 = svgAgent.selectAll("circle").data(dat0, function(d){return d.id;});
			select0
			.enter().append("circle")
			.attr("clip-path", "url(#crect)")
			.attr("id", function(d){return "A"+d.id})
			.attr("cx", function(d){return unit*d.cx})
			.attr("cy", function(d){return unit*d.cy})
			.attr("r", function(d){return (d.r) ? d.r : DefRadius})
			.attr("fill", function(d){return (d.colorIdx == -1)?d.color:colorPick(d.colorIdx, acolors);})
			select0
			.attr("r", function(d){return (d.r) ? d.r : DefRadius})
			.attr("fill", function(d){return (d.colorIdx == -1)?d.color:colorPick(d.colorIdx, acolors);})
			select0.transition().duration(duration)
			.attr("cx", function(d){return wrap(unit*d.cx, width)})
			.attr("cy", function(d){return wrap(unit*d.cy, height)})
			
			var select1 = svgAgent.selectAll("circle").data(dat1, function(d){return d.id;});
			select1
			.attr("cx", function(d){return wrap(unit*d.cx, width)})
			.attr("cy", function(d){return wrap(unit*d.cy, height)})
			.attr("r", function(d){return d.r;})
			.style("fill", function(d){return (d.colorIdx == -1)?d.color:colorPick(d.colorIdx, acolors);});
		}
	}

	function arrayify(obj) {
		if (!obj) return obj;
		if (Array.isArray(obj)) return obj;
		var keys = Object.keys(obj);
		var ans = new Array();
		for (var key in keys) ans[+keys[key]] = obj[keys[key]];
		return ans;
	}

	function resize(u, rws, cls) {
		unit = u;
		rows = rws;
		cols = cls;
		width = u*cls;
		height = u*rws;
		initSVG();
		initCells(CData);
		updateAgents(AData);
	}

	function populateAgents(datl) {
		for (var i in datl) {
			var dat = datl[i];
			var rec = {id: dat.id, cx: dat.cx, cy: dat.cy, r: (dat.r)?dat.r:5+15*Math.random(),
					colorIdx: (dat.colorIdx == undefined) ? -1 : dat.colorIdx,
					image: (doImage) ? pickImage(dat.colorIdx) : null,
					color: (dat.colorIdx == undefined)?randomColor():0, wrapped: false,
					ix: dat.cx,	iy: dat.cy}
			addAgent(rec);			
		}
		updateAgent(AData);
	}

	function addAgent(rec) {
		AData.push(rec);
		ADataMap[rec.id] = rec;
		var aid = aIdMaker(rec.ix, rec.iy);
		var rrec = ADataLocMap[aid];
		if (!rrec) ADataLocMap[aid] = rec;
		else if (Array.isArray(rrec)) rrec.unshift(rec);
		else {
			var a = [rec, rrec];
			ADataLocMap[aid] = a;
		}
	}
	
	function getAgentUsingCoords(x, y) {
		var aid = aIdMaker(x, y);
		var rrec = ADataLocMap[aid];
		if (Array.isArray(rrec)) return rrec[0];
		return rrec;
	}
	
	function killAgents(idList) {
		for (var i in idList) {
			delete ADataMap[idList[i]];
		}
		var oldMap = ADataMap;
		AData = new Array();
		ADataMap = new Object();
		ADataLocMap = new Object();
		initABucket = new Object();
		for (var id in oldMap) addAgent(oldMap[id]);	
	}
	
	function removeAgent(rec) {
		delete ADataMap[rec.id];
		reId();	
	}
	
	function reId() {
		var oldMap = ADataMap;
		var oldInitABucket = initABucket;		
		AData = new Array();
		ADataMap = new Object();
		ADataLocMap = new Object();
		initABucket = new Object();
		var ctr = 0;
		for (var id in oldMap) {
			var rec = oldMap[id];
			rec.id = ctr++;
			addAgent(rec);
			if (oldInitABucket[id]) initABucket[rec.id] = rec;
		}
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

	function create(datla) {
		if (datla.length > 0) populateAgents(datla);
	}
	
	function kill(datla) {
		if (datla.length > 0) killAgents(datla)
	}

	function reset(datla, datlc) {
		clearData();
		initSVG();
		if (datla.length > 0) populateAgents(datla);
		for (var i in datlc) {
			var dat = datlc[i]
			CData.push(dat);
			CDataMap[dat.id] = dat;
		}
		for (var i = 0; i < rows; i++) 
			for (var j = 0; j < cols; j++) {
				var id = cIdMaker(i, j);
				if (CDataMap[id]) continue;
				var rec = {id: id, r: i, c: j, color: 0};
				CData.push(rec)
				CDataMap[id] = rec;
			}
		initCells(CData);
	}

	function render(xyDatA, xyDatC) {
		var dat = [];
		for (var i in xyDatA) {
			var rec0 = xyDatA[i]
			var rec = ADataMap[rec0.id];
			if (!rec) continue;
			var keys = Object.keys(rec0);
			for (var key in keys) rec[keys[key]] = rec0[keys[key]];
			if (doImage) rec.image = pickImage(rec.colorIdx);
		}
		updateCells(xyDatC);
		updateAgent(AData);
	}
	
	function pickImage(idx) {
		return images[Math.round(idx)];
	}

	function getInitCellBucket() {
		return initCBucket;
	}

	function getInitAgentBucket() {
		return initABucket;
	}

	function cIdMaker(i,j) {return "C"+i+":"+j;}

	function aIdMaker(i, j) {
		return "A"+Math.floor(i)+":"+Math.floor(j);
	}
	
	function parseId(id){
		var tmp = id.substring(1).split(":");
		return {row:+tmp[0], col:+tmp[1]};
	}

	function addEventListener(evt, f, useCapture) {
		document.getElementById("g_main_parent").addEventListener(evt, f, useCapture);
	}

	reset([],[]);
	
	function colorPick(val, colors) {
		if (val == undefined || isNaN(val)) return colors[0];
		if (val in colors) return colors[val];		
		var keys = Object.keys(colors);
		if (val <= +keys[0]) return colors[keys[0]];
		if (val >= +keys[keys.length-1]) return colors[keys[keys.length-1]];
		var i = 0;
		while (!(val >= +keys[i] && val < +keys[i+1])) i++;
		var d = (+keys[i+1])-(+keys[i]);
		var l = (val - (+keys[i]))/d;
		clow = d3.rgb(colors[keys[i]]);
		chi = d3.rgb(colors[keys[i+1]]);
		var ans = d3.interpolate(clow, chi)(l)
		return ans;
	}
	/*
	var colours = {
			"aliceblue":"#f0f8ff","antiquewhite":"#faebd7","aqua":"#00ffff","aquamarine":"#7fffd4",
			"azure":"#f0ffff","beige":"#f5f5dc","bisque":"#ffe4c4","black":"#000000","blanchedalmond":"#ffebcd",
			"blue":"#0000ff", "blueviolet":"#8a2be2","brown":"#a52a2a","burlywood":"#deb887",
			"cadetblue":"#5f9ea0","chartreuse":"#7fff00","chocolate":"#d2691e","coral":"#ff7f50",
			"cornflowerblue":"#6495ed","cornsilk":"#fff8dc","crimson":"#dc143c","cyan":"#00ffff",
			"darkblue":"#00008b","darkcyan":"#008b8b","darkgoldenrod":"#b8860b","darkgray":"#a9a9a9",
			"darkgreen":"#006400","darkkhaki":"#bdb76b","darkmagenta":"#8b008b","darkolivegreen":"#556b2f",
			"darkorange":"#ff8c00","darkorchid":"#9932cc","darkred":"#8b0000","darksalmon":"#e9967a",
			"darkseagreen":"#8fbc8f","darkslateblue":"#483d8b","darkslategray":"#2f4f4f",
			"darkturquoise":"#00ced1","darkviolet":"#9400d3","deeppink":"#ff1493","deepskyblue":"#00bfff",
			"dimgray":"#696969","dodgerblue":"#1e90ff","firebrick":"#b22222","floralwhite":"#fffaf0",
			"forestgreen":"#228b22","fuchsia":"#ff00ff","gainsboro":"#dcdcdc","ghostwhite":"#f8f8ff",
			"gold":"#ffd700","goldenrod":"#daa520","gray":"#808080","green":"#008000","greenyellow":"#adff2f",
			"honeydew":"#f0fff0","hotpink":"#ff69b4", "indianred":"#cd5c5c","indigo ":"#4b0082",
			"ivory":"#fffff0","khaki":"#f0e68c","lavender":"#e6e6fa","lavenderblush":"#fff0f5",
			"lawngreen":"#7cfc00","lemonchiffon":"#fffacd","lightblue":"#add8e6",
			"lightcoral":"#f08080","lightcyan":"#e0ffff","lightgoldenrodyellow":"#fafad2",
			"lightgrey":"#d3d3d3","lightgreen":"#90ee90","lightpink":"#ffb6c1","lightsalmon":"#ffa07a",
			"lightseagreen":"#20b2aa","lightskyblue":"#87cefa","lightslategray":"#778899",
			"lightsteelblue":"#b0c4de","lightyellow":"#ffffe0","lime":"#00ff00","limegreen":"#32cd32",
			"linen":"#faf0e6","magenta":"#ff00ff","maroon":"#800000","mediumaquamarine":"#66cdaa",
			"mediumblue":"#0000cd","mediumorchid":"#ba55d3","mediumpurple":"#9370d8","mediumseagreen":"#3cb371",
			"mediumslateblue":"#7b68ee","mediumspringgreen":"#00fa9a","mediumturquoise":"#48d1cc",
			"mediumvioletred":"#c71585","midnightblue":"#191970","mintcream":"#f5fffa","mistyrose":"#ffe4e1",
			"moccasin":"#ffe4b5","navajowhite":"#ffdead","navy":"#000080","oldlace":"#fdf5e6","olive":
				"#808000","olivedrab":"#6b8e23","orange":"#ffa500","orangered":"#ff4500","orchid":"#da70d6",
				"palegoldenrod":"#eee8aa","palegreen":"#98fb98","paleturquoise":"#afeeee",
				"palevioletred":"#d87093","papayawhip":"#ffefd5","peachpuff":"#ffdab9","peru":"#cd853f",
				"pink":"#ffc0cb","plum":"#dda0dd","powderblue":"#b0e0e6","purple":"#800080",
				"red":"#ff0000","rosybrown":"#bc8f8f","royalblue":"#4169e1",
				"saddlebrown":"#8b4513","salmon":"#fa8072","sandybrown":"#f4a460","seagreen":"#2e8b57",
				"seashell":"#fff5ee","sienna":"#a0522d","silver":"#c0c0c0","skyblue":"#87ceeb",
				"slateblue":"#6a5acd","slategray":"#708090","snow":"#fffafa","springgreen":"#00ff7f",
				"steelblue":"#4682b4","tan":"#d2b48c","teal":"#008080","thistle":"#d8bfd8",
				"tomato":"#ff6347","turquoise":"#40e0d0","violet":"#ee82ee","wheat":"#f5deb3","white":"#ffffff",
				"whitesmoke":"#f5f5f5","yellow":"#ffff00","yellowgreen":"#9acd32"
	};

	function interpolateColor(t, map) {
		if (t == undefined) return map[0];
		if (map[t] != undefined) return map[t];
		var keys = Object.keys(map);
		if (t < keys[0]) return map[0];
		if (t > keys[keys.length-1]) return map[keys[keys.length-1]];
		var idx = nsutil.binaryIndexOf(keys, t);
		var key0, key1;
		if (keys[idx] > t) {
			key1 = keys[idx];
			key0 = keys[idx-1];
		} else {
			key1 = keys[idx+1];
			key0 = keys[idx];
		}
		return blendColors(map[key0], map[key1], (t - key0)/(key1 - key0))
	}

	function blendColors(colourLo, colourHi, r) {
		clo = jsToTriple(colourLo);
		chi = jsToTriple(colourHi);
		var blend = [
		             Math.round(r*chi[0]+(1-r)*clo[0]),
		             Math.round(r*chi[1]+(1-r)*clo[1]),
		             Math.round(r*chi[2]+(1-r)*clo[2]),
		             ];
		return tripleToJs(blend);
	}

	function jsToTriple(colour) {
		var ans = colours[colour.toLowerCase()];
		if (ans == undefined) ans = colour;
		var re = /#(..)(..)(..)/;
		var match = re.exec(ans);
		if (match == undefined) {
			var re = /#(.)(.)(.)/;
			var match = re.exec(ans);
			if (match == undefined) return null;
		}
		return [parseInt("0x"+match[1]),
		        parseInt("0x"+match[2]),
		        parseInt("0x"+match[3])]
	}

	function tripleToJs(triple) {
		var red = (+triple[0]).toString(16);
		var green = (+triple[1]).toString(16);
		var blue = (+triple[2]).toString(16);
		if (red.length == 1) red = "0"+red;
		if (green.length == 1) green = "0"+green;
		if (blue.length == 1) blue = "0"+blue;
		var ans = "#"+red+green+blue;
		for (key in colours) if (colours[key] == ans) return key;
		return ans;
	}
*/
	return {render: render, reset: reset,
		getInitCellBucket: getInitCellBucket, 
		getInitAgentBucket: getInitAgentBucket, 
		cIdMaker: cIdMaker, aIdMaker: aIdMaker, 
		parseId: parseId, create: create, kill: kill,
		addEventListener: addEventListener}
}
