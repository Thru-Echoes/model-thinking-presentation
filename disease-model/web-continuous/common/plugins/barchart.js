//barchart.js
//c. 2014 rms
//chartid = div id
//wd, ht = dimension
//m = margin {left, right, top, bottom}

function barchart(chartid, wd, ht, X, Y, ylab, m, col, capt) {
	var margin = (m)?m:{top:10, bottom:20, left:30, right:10};
	var wd = wd, ht = ht, X = X, Y = Y, ylab = ylab, col = col;
	var caption = capt;
	var width,height,x,y,xAxis,yAxis,svg,data = [], Height;
	
	if (Y == null) Y = [0, height];
	else if (typeof Y == "number") Y = [0, Y];

	var fstTime = true;

	function setup(w, h) {
		fstTime = true;
		width = w-margin.left-margin.right;
		height = h-margin.top-margin.bottom;

		x = d3.scale.ordinal()
		.rangeRoundBands([0, width], .1);
		y = d3.scale.linear()
		.range([height, 0]);
		xAxis = d3.svg.axis()
		.scale(x)
		.orient("bottom");
		yAxis = d3.svg.axis()
		.scale(y)
		.orient("left")
		.ticks(10);
	}

	function initSVG() {
		d3.select(chartid).select("svg").remove();
		svg = d3.select(chartid).append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("class", "barchart")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	}

	function initAxes() {
		var bott, topp;
//		if (data.length == 0) {
			x.domain((X)?X:[0, width]);			
			y.domain([Y[0], Y[1]]);
			bott = Y[0], topp = Y[1];
//		} else {
//			bott = Y[0];
//			topp = d3.max(data, function(d){return d.y});
//			x.domain((X)?X:data.map(function(d){return d.x}));			
//			y.domain([bott, topp]);			
//		}
		Height = (bott >= 0) ? height : (topp/(topp - bott)) * height;
	}

	function show() {
		var bar = svg.selectAll(".bar").data(data);
		bar
		.enter().append("g")
		.attr("class", "bar")
		.attr("transform", function(d, i){ return "translate("+x(d.x)+",0)"; })
		.append("rect")
		.attr("width", x.rangeBand())
		.attr("fill", function(d, i){return (col)?col[i]:"steelblue"})
		.attr("y", function(d){return (d.y >= 0) ? y(d.y) : y(0);})
		.attr("height", function(d){return (d.y >= 0) ? Height-y(d.y) : Height-y(-d.y);});
		bar.select("rect")			
		.transition()
		.attr("y", function(d){return (d.y >= 0) ? y(d.y) : y(0);})
		.attr("height", function(d){return (d.y >= 0) ? Height-y(d.y) : Height-y(-d.y);});
		if (fstTime) {
			fstTime = false;
			svg.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + Height + ")")
			.call(xAxis);
			var yaxis = svg.append("g")
			.attr("class", "y axis")
			.call(yAxis);
			if (ylab) yaxis.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 6)
			.attr("dy", ".71em")
			.style("text-anchor", "end")
			.text(ylab);
			if (caption) {
				svg.append("text")
				.attr("transform", "translate(10,-20)")
				.text(caption);
			}
		}
	}

	function clearData() {
		data = [];
	}

	function resize(w, h) {
		setup(w, h);
		initAxes();
		show();
	}

	function render(xyDat) {
		data = xyDat;
		show();
	}

	function reset(dt) {
		if (dt) data = dt;
		else clearData();
		setup(wd, ht);
		initSVG();
		initAxes();
		if (dt) show();
	}
	reset();
	return {render: render, reset: reset};
}
