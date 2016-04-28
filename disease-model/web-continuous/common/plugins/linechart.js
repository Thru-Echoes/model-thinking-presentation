//linechart.js
//c. 2014 rms
//chartid = div id
//wd, ht = dimension
//m = margin {left, right, top, bottom}
//lo, hi = x axis range
//[xF], [yF] = x/y selectors (default to "x" and "y")

var lcgraphs = {}


function linechart(chartid, wd, ht, m, lo, hi, yF, xF, ylo, yhi, sp, comp, mc, cols, cmpMd, intlMode, cap, leg) {
	var path, x, y, xAxis, yAxis, line, svg, svgdat, width = wd, height = ht, margin = m;
	var chartid1 = chartid.substring(1);
	var xLo = lo, xHi = hi;
	var manColor = (mc)?mc:false;
	var compareMode = (cmpMd)?cmpMd:false
	var initialMode = (intlMode == "compare") ? 1 : 0;
	var colors = cols || ["blue", "red", "green", "cyan", "magenta"];
	var yLo = (ylo)?ylo:0, yHi = (yhi)?yhi:0;
	var sep = (sp)?sp:100;
	var caption = cap, legend = leg;
	var compare = (comp)?comp:false;
	var Data = [], FlashOffset = 40;
	var oldData = [];
	var yFunc = (yF) ? yF : function(d){return d.y;}
	var xFunc = (xF) ? xF : function(d){return d.x;}
	var fixedAxes = (ylo || yhi) ? true : false;
	var sortfns = {
		ya: function (a, b) {return yF(a) - yF(b)},
		yd: function (a, b) {return yF(b) - yF(a)},
		xa: function (a, b) {return xF(a) - xF(b);},
		xd: function (a, b) {return xF(b) - xF(a);}
	}
	var colorpicker = null, modepicker = null;

	function setup(width0, height0) {
		width = width0 - margin.left - margin.right - 20;
		height = height0 - margin.top - margin.bottom - 20;
		x = d3.scale.linear()
		.range([0, width]);
		y = d3.scale.linear()
		.range([height, 0]);
		xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom");
		yAxis = d3.svg.axis()
		.scale(y)
		.orient("left");
		line = d3.svg.line()
		.x(function(d) { return x(xFunc(d)); })
		.y(function(d) { return y(yFunc(d)); });
	}

	function initSVG() {
		d3.select(chartid).select("svg").remove();
		var svg0;
		var table, tablerow, labelenter;	
		if (manColor) {
			if (colorpicker == null) {
				table = d3.select(chartid).insert("table")
				.attr("id", chartid1+"_color")
				tablerow = table.append("tr");
				colorpicker = tablerow
				.append("td")
				.style({
					width: "300px",
					"padding-left": "5px",
					"padding-bottom": "5px",					
				})
				.insert("form")
				labelenter = colorpicker.selectAll("span").data(colors)
				.enter().append("span")
				.style({
					"padding-left": "5px"
				})
				labelenter
				.append("input")
				.attr("id", function(d){return d+"_button"})
				.attr("type", "radio")
				.attr("name", chartid1+"_colorButton")
				.attr("value", function(d){return d})
				.property("checked", function(d, i){return (i == 0)});
				labelenter.append("label")
				.attr("for", function(d){return d+"_button"})
				.append("svg")
				.attr({
					width: "10px",
					height: "10px",
				})
				.append("rect")
				.attr({
					width: "10px",
					height: "10px",
					fill: function(d){return d}
				})
			}
		}
		if (compareMode) {
			if (modepicker == null) {
				if (!manColor) {
					table = d3.select(chartid).insert("table")
					.attr("id", chartid1+"_color")
					tablerow = table.append("tr");
					tablerow.insert("td")
					.style({
					width: "300px",
					"padding-left": "5px",
					"padding-bottom": "5px",
					})
				}
				modepicker = tablerow.insert("td")
				.style({
					"white-space": "nowrap",
					"padding-right": "5px",
					"text-align": "right"
				})
				labelenter = modepicker.selectAll("span").data(["normal", "compare"])
				.enter().append("span")
				.style({
					"padding-left": "5px"
				})
				labelenter
				.append("input")
				.attr("id", function(d){return d+"_button"})
				.attr("type", "radio")
				.attr("name", chartid1+"_modeButton")
				.attr("onClick", function(d, i){
					return "document.getElementById('"+chartid1+"_c_reset').disabled = "+(i == 0)+
							"; lcgraphs['"+chartid1+"']()";
				})
				.attr("value", function(d){return d})
				.property("checked", function(d, i){return (i == initialMode)});
				labelenter.append("label")
				.attr("for", function(d){return d+"_button"})
				.text(function(d){return d})
				modepicker
				.append("span").style("padding-left", "5px")
				.append("button")
				.attr({
					name: "compare_reset",
					id: chartid1+"_c_reset",
					onClick: "d3.select('"+chartid+"').select('svg').select('.datapaths').selectAll('path').remove();"+
							"lcgraphs['"+chartid1+"']();"					
				})
				.property("disabled", initialMode == 0)
				.text("Reset")
			}
		} 
		if (compareMode || manColor) svg0 = d3.select(chartid).insert("svg", chartid+"_color");
		else svg0 = d3.select(chartid).append("svg");
		svg = svg0
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("class", "g_main_linechart")
		.attr("transform", "translate(" + margin.left + "," + margin.top +  ")");
		if (caption) 
			svg.append("text")
			.attr("transform", "translate(0, -20)")
			.text(caption);
		if (legend) {
			var ldat = [];
			for (var i = 0; i < legend.length; i++) ldat.push({txt: legend[i], col: colors[i%colors.length]});
			svg.selectAll(".legend").data(ldat)
			.enter().append("g")
			.attr("class", "legend")
			.attr("transform", function(d, idx){return "translate("+(150+idx*50)+", -20)";})
			.each(function(d) {
					d3.select(this).append("text")
					.attr("transform", "translate(0, -5)")
					.text(function(d){return d.txt;});
					d3.select(this).append("rect")
						.attr("transform", "translate(10, 0)")
						.attr({
							width: "10px",
							height: "10px",
							fill: function(d){return d.col}
						});
			});
		}
		svgdat = svg.append("g")
		.attr("class", "datapaths");

		svg
		.on("mousemove", function () {
			cx = d3.mouse(this)[0];
			cy = d3.mouse(this)[1];
			redrawline(cx, cy);
			flash(cx, cy, this);
		})
		.on("mouseover", function () {
			d3.selectAll('.line_over').style("display", "block");
			cx = d3.mouse(this)[0];
			cy = d3.mouse(this)[1];
			redrawline(cx, cy);
			flash(cx, cy, this);
		})
		.on("mouseout", function () {
			d3.selectAll('.line_over').style("display", "none");
			d3.selectAll(".ttip").remove();
			d3.selectAll(".flash_rect").remove();            
		})
		.append('rect')
		.attr('class', 'click-capture')
		.style('visibility', 'hidden')
		.attr('x', 0)
		.attr('y', 0)
		.attr("width", width)
		.attr("height", height);

		svg.append("line")
		.attr("class", 'line_over')
		.attr("x1", 0)
		.attr("y1", 0)
		.attr("x2", 0)
		.attr("y2", height)
		.attr("stroke-dasharray", (5,5))
		.attr("display", "none");

		drawAxes();  	
	}

	function drawAxes() {    
		svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);

		svg.append("g")
		.attr("class", function(d,i){return "y axis"})
		.call(yAxis);
	}

	function clearData() {Data = [[]];}

	function initAxes() {
		x.domain([xLo, xHi]);
		y.domain([yLo, yHi]);
		initSVG();
	}

	function calibrateY() {
		if (fixedAxes) return;
		var Data1 = oldData.concat(Data);		
		if (Data1.length == 1) {
			yExtent = d3.extent(Data1[0], yFunc);
			y.domain(yExtent);
		} else {
			var yExtents = new Array();
			for (var i = 0; i < Data1.length; i++) {
				if (Data1[i].length == 0) continue;
				yExtents[i] = d3.extent(Data1[i], yFunc);
			}
			var los = yExtents.map(function(z){return z[0];})
			var his = yExtents.map(function(z){return z[1];})
			var lo = Math.min.apply(null, los);
			var hi = Math.max.apply(null, his);
			y.domain([lo, hi]);
		}
		d3.select(chartid).select(".y.axis").call(yAxis);
	}

	function showPath(Data1) {
		path = svg.select(".datapaths").selectAll("path");
		path.remove();
		path = svg.select(".datapaths").selectAll("path").data(Data1, function(d, i){return (d.chartId)?d.chartId:i;})
		.attr("class", "line")
		.attr("stroke", function(d){return (!d.stroke)?"steelblue":(d.stroke instanceof Array)?d.stroke[d.seq]:d.stroke;})
		.attr("d", line)
		.enter().append("path")
		.attr("class", "line")
		.attr("stroke", function(d){
			return (!d.stroke)?"steelblue":(d.stroke instanceof Array)?d.stroke[d.seq]:d.stroke;
		})
		.attr("d", line);
	}

	function redrawline(cx, cy) {
		if (cx < xLo) d3.selectAll('.line_over').style("display", "none");
		else d3.selectAll('.line_over')
		.attr("x1", cx)
		.attr("y1", 0)
		.attr("x2", cx)
		.attr("y2", height)
		.style("display", "block");
	}

	function flash(cx, cy, that) {
		var x0 = x.invert(cx);
		d3.selectAll(".ttip").remove();
		d3.selectAll(".flash_rect").remove();
		if (x0 < xLo || x0 > xHi) return;
		d3.select(that).selectAll(".ttip").data(Data)
		.enter().append("text")
		.attr("class", "ttip")
		.attr("transform", function(d,i){return "translate("+i*sep+", "+(height+FlashOffset)+")"})
		.style("fill", function(d){return (!d.stroke)?"steelblue":(d.stroke instanceof Array)?d.stroke[d.seq]:d.stroke;})
		.style("fill", function(d){return (d.stroke)?d.stroke:"steelblue";})
		.text(function(d){
			var y0 = datComp(x.invert(cx), d);
			if (typeof y0 == "number") return sprintf("%10.5f, %10.5f", x0, y0);
			return sprintf("%10.5f, ------", x0);
		});
	}

	function datComp(x, dat) {
		var ans = null;
		for (var j = 0; j < dat.length; j++) {
			if (xFunc(dat[j]) == x) return yFunc(dat[j]);
			if (xFunc(dat[j]) > x && j > 0) {
				var x0 = xFunc(dat[j-1]);
				var y0 = yFunc(dat[j-1]);
				var x1 = xFunc(dat[j]);
				var y1 = yFunc(dat[j]);
				return y0 + (y1 - y0)*(x - x0)/(x1 - x0)
			}
		}
		return null
	}

	function resize(w, h) {
		setup(w, h);
		initAxes();
		calibrateY()
		showPath(oldData.concat(Data));
	}

	function render(xyDat, sort) {
		Data = (xyDat[0] instanceof Array) ? xyDat : [xyDat];
		if (manColor)
			Data[0].stroke = getRadioValue(chartid1+"_colorButton");
		if (sort) {
			for (var i = 0; i < xyDat.length; i++) {
				xyDat[i].sort(sortfns[sort]);
			}
		}
		calibrateY();
		showPath(oldData.concat(Data));
	}

	function resetCompare() {
		path = svg.select(".datapaths").selectAll("path");
		path.remove();
		clearData();
	}
	
	function isCompareMode() {
		return compare || getRadioValue(chartid1+"_modeButton") == "compare";
	}

	function reset(props) {
		if (props && "hi" in props) xHi = props.hi;
		setup(wd, ht)
		if (isCompareMode() && Data.length > 0 && Data[0].length > 0) oldData.push(Data[0]);
		clearData();
		initAxes();
		calibrateY();
		showPath(oldData);
	}

	function getData() {
		return Data
	}
	
	function getRadioValue(name) {
		var elts =  document.getElementsByName(name);
    	for (var i = 0; i < elts.length; i++) 
    		if (elts[i].checked) return elts[i].value;
    	return null;
	}
	
	function fullReset() {
		reset();
		oldData = [];
		reset();
	}
	
	lcgraphs[chartid1] = fullReset;
	
	reset();
	
	return {render: render, reset: reset, resetCompare: resetCompare, getData: getData};
}
