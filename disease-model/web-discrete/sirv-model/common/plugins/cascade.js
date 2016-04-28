function cascade(hk, cnt, cls, sz, bg, cap) {
	var hook = hk, count = cnt, cols = cls;
	var rows = Math.floor(cnt/cls);
	var slotsize = (sz)?sz:7;
	var backg = (bg)?bg:"lavender";
	var caption = cap;
	rows += ((cnt % cls > 0) ? 1 : 0);
	var ctr = 0;
	var idList = [[]], DataList = [], slots;
	
	
	var setup = function() {
		for (var i = 0; i < rows; i++) {
			for (var j = 0; j < cols; j++) {
				if (ctr++ >= cnt) break;
				var ord =  j*rows+i;
				var dat = {};
				idList[i].push(dat);
				DataList[ord] = dat;
			}
			if (ctr < cnt) idList.push([]);
		}
		d3.select(hook).select("table").remove();
		var table = d3.select(hook).append("table")
		.attr("id", hook+"_cascade")
		.attr("class", "cascade")
		.style("background-color", backg)
		.style("padding", "5px");
		if (caption != null) 
			table.append("caption").text(caption);
		slots = table.selectAll("tr").data(idList)
		.enter().append("tr")
		.selectAll("td").data(function(d){return d;})
		slots.enter().append("td")
		.style("padding", "3px")
		.append("input")
		.style("text-align", "right")
		.attr("type", "text")
		.attr("size", slotsize)
		.attr("readonly", true);
	}

	var update = function(dat) {
		for (var i in dat) {
			var d = dat[i];
			var d0 = DataList[i];
			if (d0 != null) d0.value = d;
		}
		slots.selectAll("input")
		.attr("value", function(d){return d.value})		
	}
	
	setup();
	
	function reset(dat) {setup(); if (dat != null) update(dat);}
	
	return {reset: reset, update: update}; 

}