function tableau(hk, rws, cls, rhd, chd, inp, sz, bg, cap) {
	var hook = hk; 
	var rows = rws, cols = cls;
	var slotsize = (sz)?sz:7;
	var backg = (bg)?bg:"lavender";
	var caption = cap;
	var hdr = rhd;
	var chdr = chd;
	var init = inp;


	var setup = function() {
		var idList = [[]];
		for (var i = 0; i < rows; i++) {
			for (var j = 0; j < cols; j++) {
				var ord =  i*rows+j;
				idList[i].push({id: makeId(i, j), value: (init == null) ? "" : init[i][j]})
			}
			if (i < rows-1) idList.push([]);
		}
		d3.select(hook).select("table").remove();
		var table = d3.select(hook).append("table")
		.attr("id", hook+"_tableau")
		.attr("class", "tableau")
		.style("background-color", backg)
		.style("padding", "5px");
		if (caption != null) 
			table.append("caption").text(caption);
		table = table.append("tr").selectAll("th").data(chd)
		.enter().append("th")
		.style("padding", "3px")
		.text(function(d){return d})
		var slots = d3.select(hook).select("table").selectAll("td").data(idList)
		.enter().append("tr")
		.selectAll("td").data(function(d){return d;}, function(dat){return dat.id;})
		slots.enter().append("td")
		.style("padding", "3px")
		.append("input")
		.style("text-align", "right")
		.attr("id", function(d){return d.id;})
		.attr("type", "text")
		.attr("value", function(d){return d.value;})
		.attr("size", slotsize)
		if (rhd != null) {
			var drows = d3.select(hook).select("table").selectAll("tr").filter(function(d, i){return i > 0;});
			drows.data(rhd).insert("th", ":first-child").text(function(d){return d})
		}
	}
	
	function makeId(i, j) {return hook.substring(1)+"_"+i+":"+j;}
	setup();
	
	function reset(dat){if (dat != null) init = dat; setup();}
	
	function get(i, j) {
		return document.getElementById(makeId(i, j)).value;
	}
	
	return {reset: reset, get: get}
}