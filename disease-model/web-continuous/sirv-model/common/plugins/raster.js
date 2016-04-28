//Novascript d3 raster viewer

function raster(divid, u, rws, cls, colrs, tooltipY, ux) {
	var unitx = (ux)?ux:u;
	var unity = u;
	var width = unitx*cls, height = unity*rws, rows = rws, cols = cls;
	var Data = [], DataMap = new Object();
	var colors = arrayify(colrs);
	var svg = null;
	var tooltipYes = tooltipY;
	var mousedown = false;
	var dragcol = 0;
	var initBucket = new Object();
	var tooltip;
	var tooltipId;
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
		if (!svg) {
			svg = d3.select(divid).append("svg")
			.attr("width", width)
			.attr("height", height)
			.append("g")
			.attr("id", "g_main_parent")
			.append("g")
			.attr("class", "g_main_cell")
			.attr("transform", "translate(0, 0)")
		} else {
			svg = d3.select(divid).select("#g_main_parent")
			.append("g")
			.attr("class", "g_main_cell")
			.attr("id", "g_main_canvas")
			.attr("transform", "translate(0, 0)")
		}
		var defs = svg.append("svg:defs");
		defs.append("svg:clipPath")
		.attr("id", "crect")
		.append("svg:rect")
		.attr('x', 0)
		.attr('y', 0)
		.attr("width", width)
		.attr("height", height);
		var tmp = svg
		.on("ondragstart", function(){return false;})
		.on("ondrag", function(){
			mousedown = true;
			cx = d3.mouse(this)[0];
			cy = d3.mouse(this)[1];
			rec = DataMap[idMaker(Math.floor(cy/unity), Math.floor(cx/unitx))];
			if (rec) {
				initBucket[rec.id] = rec;
				dragcol = rec.colorIdx;
				updateCells([rec]);
			}
		})
		.on("mousedown", function(){
			mousedown = true;
			cx = d3.mouse(this)[0];
			cy = d3.mouse(this)[1];
			rec = DataMap[idMaker(Math.floor(cy/unity), Math.floor(cx/unitx))];
			if (rec) dragcol = rec.colorIdx;
		})
		.on("mouseup", function(){mousedown = false;})
		.on("mousemove", function(){
			if (mousedown) {
				cx = d3.mouse(this)[0];
				cy = d3.mouse(this)[1];
				rec = DataMap[idMaker(Math.floor(cy/unity), Math.floor(cx/unitx))];
				recordData(rec, dragcol);
				tooltipId = null;
				if (tooltipYes) return tooltip.style("visibility", "hidden");				
			} else if (tooltipYes) {
				cx = d3.mouse(this)[0];
				cy = d3.mouse(this)[1];
				var id = idMaker(Math.floor(cy/unity), Math.floor(cx/unitx));
				rec = DataMap[id];
				tooltipId = id;
				return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px").text(rec.colorIdx);
			}
		})
		.on("click", function () {
			cx = d3.mouse(this)[0];
			cy = d3.mouse(this)[1];
			rec = DataMap[idMaker(Math.floor(cy/unity), Math.floor(cx/unitx))];
			var keys = Object.keys(colors);
    		var idx = nsutil.binaryIndexOf(keys, rec.colorIdx);
    		var key1;
    		if (+keys[idx] > rec.colorIdx) {
				key1 = +keys[idx];
    		} else {
				key1 = +keys[(idx+1)%keys.length];
    		}
			recordData(rec, key1);
			if (tooltipYes) tooltip.text(rec.colorIdx);
			mousedown = false;
		});
		if (tooltipYes) {
			tmp = tmp
			.on("mouseover", function(){
				cx = d3.mouse(this)[0];
				cy = d3.mouse(this)[1];
				var id = idMaker(Math.floor(cy/unity), Math.floor(cx/unitx));
				rec = DataMap[id];
				tooltipId = id;
				return tooltip.style("visibility", "visible").text(rec.colorIdx);
			})
			.on("mouseout", function(){tooltipId = null; return tooltip.style("visibility", "hidden");});
		}
		tmp
		.append("rect")
		.attr("id", "mouserect")
		.attr("class", "click-capture")
		.attr('x', 0)
		.attr('y', 0)
		.attr("width", width)
		.attr("height", height);
		svg.append("g")
		.attr("id", "cellmatrix");
	}

	function recordData(rec, colorIdx) {
		if (rec) {
			initBucket[rec.id] = rec;
			rec.colorIdx = colorIdx;
			updateCells([rec]);
		}
	}

	function clearData() {Data = []; DataMap = new Object(); initBucket = new Object();}

	function updateCells(dat) {
		var select = svg.select("#cellmatrix").selectAll("rect").data(dat, function(d){return d.id;});
		select
		.enter().append("rect")
		.attr("clip-path", "url(#crect)")
		.attr("id", function(d){return d.id})
		.attr("x", 0)
		.attr("y", 0)
		.attr("width", unitx+1)
		.attr("height", unity+1)
		.attr("transform", function(d){return "translate("+unitx*d.c+", "+unity*d.r+")";})
		.attr("fill", updateACell);
		select
		.attr("fill", updateACell);
	}

	function updateACell(d) {
		DataMap[d.id].colorIdx = d.colorIdx; 
		if (tooltipId == d.id) tooltip.text(d.colorIdx);
		return colorPick(d.colorIdx, colors);		
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
		updateCells(Data);
	}

	function randomColor() {
		var ans = "#"
			for (var i = 0; i < 3; i++) 
				ans = ans + Math.floor(16*Math.random()).toString(16);
		return ans;
	}

	function reset(xyDat) {
		clearData();
		initSVG();
		for (var i in xyDat) {
			var dat = xyDat[i];
			Data.push(dat);
			DataMap[dat.id] = dat;
		}
		for (var i = 0; i < rows; i++) 
			for (var j = 0; j < cols; j++) {
				var id = idMaker(i, j);
				if (DataMap[id]) continue;
				var rec = {id: id, r: i, c: j, colorIdx: 0};
				Data.push(rec);
				DataMap[id] = rec;
			}
		updateCells(Data);
	}

	function render(xyDat) {
		updateCells(xyDat);
	}

	function getInitBucket() {
		return initBucket;
	}

	function idMaker(i,j) {return "C"+i+":"+j;}
	reset();

	function parseId(id){
		var tmp = id.substring(1).split(":");
		return {row:+tmp[0], col:+tmp[1]};o
	}

	function addEventListener(evt, f, useCapture) {
		document.getElementById("g_main_parent").addEventListener(evt, f, useCapture);
	}

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
		var ans = tripleToJs(blend);
		return ans;
	}
*/
	return {render: render, reset: reset, getInitBucket: getInitBucket, idMaker: idMaker, parseId: parseId,
		addEventListener: addEventListener}
}

