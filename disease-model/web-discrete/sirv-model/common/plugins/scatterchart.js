//scatterchart.js
//c. 2014 rms
//chartid = div id
//wd, ht = dimension
//m = margin {left, right, top, bottom}

function scatterchart(chartid, wd, ht, xlab, ylab, m, r, captn, tooltipYes, trnsn) {
	var width, height;
	var r = (r)?r:3
	var margin = (m)?m:{top:10, bottom:40, left:30, right:10};
	var width,height,x,y,xAxis,yAxis,svg,Data = [];
	var xFunc = function(d){return d.x};
	var yFunc = function(d){return d.y};
	var caption = captn;
	var prelude, hook;
	var transn = (trnsn == null) ? true : trnsn; 
	var tooltip;
	
	function setup(w, h) {
		width = w-margin.left-margin.right;
		height = h-margin.top-margin.bottom;

		x = d3.scale.linear()
		.range([0, width]);
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
		hook = prelude = d3.select(chartid);
		hook.select("table").remove();
		hook.select("svg").remove();
		if (caption) {
			prelude = prelude.append("table").append("tr")
			.append("caption")
			.text(caption)
			.append("td");
		}
		svg = prelude.append("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr("class", "schart")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
		tooltip = hook.append("div")
    	.attr("class", "tooltip")
    	.style("opacity", 0);
	}

	function initAxes() {
		calibrateXY();
		var xaxis = svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(xAxis);
		var yaxis = svg.append("g")
		.attr("class", "y axis")
		.call(yAxis);
		if (xlab) xaxis.append("text")
		.attr("transform", "translate(0,30)")		
		.attr("x", "20")
		.attr("dx", ".79em")
		.style("text-anchor", "end")
		.text(xlab);
		if (ylab) yaxis.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", 6)
		.attr("dy", ".71em")
		.style("text-anchor", "end")
		.text(ylab);
	}

	function calibrateXY() {
		if (Data.length == 0) {
			x.domain([0, width]);			
			y.domain([0, height]);
		} else {
			var xExtent = d3.extent(Data, xFunc);
			var yExtent = d3.extent(Data, yFunc);
			x.domain(xExtent);
			y.domain(yExtent);			
		}
		hook.select(".x.axis").call(xAxis);
		hook.select(".y.axis").call(yAxis);
	}

	function show() {
		var scatter = svg.selectAll(".scatter").data(Data);
		scatter
		.enter().append("g")
		.attr("class", "scatter")
		.append("circle")
		.attr("cx", xFunc)
		.attr("cy", yFunc)
		.attr("r", r)
		.attr("fill", "steelblue")
	    .on("mouseover", function(d) {
    	  	tooltip.transition()
        	       .duration(200)
            	   .style("opacity", .9);
          	tooltip.html("[" + xFunc(d) + ", " + yFunc(d) + "]")
               .style("left", (d3.event.pageX + 5) + "px")
               .style("top", (d3.event.pageY - 28) + "px");
      	})
      	.on("mouseout", function(d) {
        	  tooltip.transition()
               .duration(500)
               .style("opacity", 0);
      	});
		scatter
		.exit().remove();
		if (transn) {
			scatter.select("circle")			
			.transition()
			.attr("cx", function(d){return x(d.x);})
			.attr("cy", function(d){return y(d.y);});
		} else {
			scatter.select("circle")			
			.attr("cx", function(d){return x(d.x);})
			.attr("cy", function(d){return y(d.y);});
		}
	}

	function clearData() {
		Data = [];
		datamap = new Object();
	}

	function resize(w, h) {
		setup(w, h);
		initAxes();
		show();
	}

	function render(xyDat) {
		Data = xyDat;
		calibrateXY();
		show();
	}

	function reset(dt) {
		if (dt) data = dt;
		else clearData();
		setup(wd, ht);
		initSVG();
		initAxes();
	}
	
	function idMaker(i,j) {return "s"+i+":"+j;}

	function getData() {
		return Data
	}

	reset();
	return {render: render, reset: reset, getData: getData};
}
