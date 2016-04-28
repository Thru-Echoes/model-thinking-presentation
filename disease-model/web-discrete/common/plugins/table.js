
function drawTable(tableid, dimensions, valueF, textF, columns, sortInitial, sortIdx, cap) {
	var textFunc = textF;
	var valueFunc = (valueF instanceof Array) ? valueF : [valueF];
	var sortValueAscending = function(i) {return function (a, b) {return valueFunc[i](a) - valueFunc[i](b);}};
	var sortValueDescending = function(i) {return function(a, b){return valueFunc[i](b) - valueFunc[i](a);}};
	var sortNameAscending = function(a, b){
		var x = textFunc(a), y = textFunc(b);
		var nx = parseFloat(x), ny = parseFloat(y)
		return (isNaN(x) || isNaN(y))  ? x.localeCompare(y) : x - y;
	};
	var sortNameDescending = function(a, b){
		var x = textFunc(a), y = textFunc(b);
		var nx = parseFloat(x), ny = parseFloat(y)
		return (isNaN(x) || isNaN(y))  ? y.localeCompare(x) : y - x; 
	};
	var metricAscending = new Array();
	for (var i in valueFunc) metricAscending[i] = true;
	var nameAscending = true;

	var width = dimensions.width + "px";
	var height = dimensions.height + "px";
	var twidth = (dimensions.width - 25) + "px";
	var divHeight = (dimensions.height - 60) + "px";
	var caption = cap;
	
	d3.select(tableid).select("table").remove();
	var outerTable = d3.select(tableid).append("table").attr("width", width);
	if (caption) outerTable.append("caption").text(caption);

	outerTable
	.append("tr")
	.append("td")
	.append("table").attr("class", "headerTable").attr("width", twidth)
	.append("tr").selectAll("th").data(columns).enter()
	.append("th")
	.text(function (column) { return column; })
	.on("click", function (d) {
		var sort;
		// Choose appropriate sorting function.
		if (d === columns[0]) {
			if (nameAscending) sort = sortNameAscending;
			else sort = sortNameDescending;
			nameAscending = !nameAscending;
		} else for (var i in columns) {
			if (d === columns[i]) {
				if (metricAscending[i-1]) sort = sortValueAscending(i-1);
				else sort = sortValueDescending(i-1);
				metricAscending[i-1] = !metricAscending[i-1];
				break;
			}
		}
		var rows = tbody.selectAll("tr").sort(sort);
	});

	var inner = outerTable
	.append("tr")
	.append("td")
	.append("div").attr("class", "scroll").attr("width", width).attr("style", "height:" + divHeight + ";")
	.append("table").attr("class", "bodyTable").attr("border", 1).attr("width", twidth).attr("height", height).attr("style", "table-layout:fixed");

	var tbody = inner.append("tbody");

	var render = function(data) {
		// Create a row for each object in the data and perform an intial sort.
		var rows = tbody.selectAll("tr").data(data, function(d){return textFunc(d);}).enter().append("tr");
		if (sortInitial) 
			switch (sortInitial) {
			case "na":
				rows = rows.sort(sortNameAscending);
				break;
			case "nd":
				rows = rows.sort(sortNameDescending);
				break;
			case "va":
				rows = rows.sort(sortValueAscending((sortIdx==undefined)?0:sortIdx));
				break;
			case "vd":
				rows = rows.sort(sortValueDescending((sortIdx==undefined)?0:sortIdx));
				break;
			}
		// Create a cell in each row for each column
		var cells = rows.selectAll("td")
		.data(function (d) {
			return columns.map(function (column) {
				var ans = {column: column}
				for (var i in columns) {
					if (column == columns[i]) {
						ans.value = (i == 0) ? textFunc(d) : Math.floor(valueFunc[i-1](d)*1000)/1000;
						break;
					}
				}
				return ans;
			});
		}).enter()
		.append("td")
		.text(function (d) {return d.value;});
		var scrollable = d3.select(tableid).select(".scroll"); 
		scrollable.property("scrollTop", scrollable.property("scrollHeight"));		
	}
	return render;
}
