//JNovaScriptX.js 0.0.2
//Completely Javascript Implementation of NovaScript
//http://novamodeler.com
//(c) 2014-2015 Richard Salter

//Utility functions

var initialize = function(){};
var nsutil = {
		bogus: function(){},
		globify: function(fun) {
					return function() {
						return Capsule.curCap[fun].apply(Capsule.curCap.scope, arguments);
					}
		},
		math : {
			pi : Math.PI,
			pio2 : Math.PI/2,
			mpio2 : -Math.PI/2,
			mpi : -Math.PI,
			pi2 : 2 * Math.PI,
			normalize : function(theta) {
				var ntheta = theta % this.pi2;
				if (ntheta > this.pi) ntheta -= this.pi2;
				else if (ntheta <= this.mpi) ntheta += this.pi2;
				return ntheta;
			},
			distance: function(a, b) {
				return Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y));
			}
		},
		initMovement : function(param){
			var ans = (param == null) ? 0 :
				(typeof param == "number") ? param :
					(typeof param == "string") ? eval(param) :
						(typeof param == "function") ? param.call(this) :
							param.value((this.clock) ? this.clock.current : 0);
			return +ans;
		},
		wrap : function(x, m) {
			if (x >= 0 && x < m)
				return x;
			return ((x % m) + m) % m;
		},
		interpolate : function(t, map) {
			if (map[t] != undefined)
				return map[t];
			var keys = Object.keys(map);
			if (t < keys[0])
				return map[0];
			if (t > keys[keys.length - 1])
				return map[keys[keys.length - 1]];
			var idx = nsutil.binaryIndexOf(keys, t);
			var key0, key1;
			if (keys[idx] > t) {
				key1 = keys[idx];
				key0 = keys[idx - 1];
			} else {
				key1 = keys[idx + 1];
				key0 = keys[idx];
			}
			return map[key0] + ((map[key1] - map[key0]) / (key1 - key0))
			* (t - key0);
		},
		binaryIndexOf : function(arr, searchElement) {
			var minIndex = 0;
			var maxIndex = arr.length - 1;
			var currentIndex;
			var currentElement;
			while (minIndex <= maxIndex) {
				currentIndex = Math.floor((minIndex + maxIndex) / 2);
				currentElement = +arr[currentIndex];
				if (currentElement < searchElement)
					minIndex = currentIndex + 1;
				else if (currentElement > searchElement)
					maxIndex = currentIndex - 1;
				else
					return currentIndex;
			}
			return currentIndex;
		},
		coordsOrNum : function(row, col) {
			if (typeof row == "number" && typeof col == "number")
				return [ row, col ];
			if (Array.isArray(row))
				return row;
			if (typeof row == "object") {
				if ("row" in row || "col" in row)
					return [ row.row, row.col ];
				if ("x" in row || "y" in col)
					return [ row.y, row.x ];
			}
		},
		collect: function(){
			var ret = {};
			var len = arguments.length;
			for (var i=0; i<len; i++) {
				for (p in arguments[i]) {
					if (arguments[i].hasOwnProperty(p)) {
						ret[p] = arguments[i][p];
					}
				}
			}
			return ret;
		},
		request: function(url, callback) {
			var req = new XMLHttpRequest;
			req.open("GET", url, true);
			req.setRequestHeader("Accept", "application/js");
			req.onreadystatechange = function() {
				if (req.readyState === 4) {
					if (req.status < 300) {
						callback(null, eval(req.responseText));
					} else callback(req.status);
				}
			};
			req.send(null);
		},
		download: function(textToWrite, fileNameToSaveAs) {
			var textFileAsBlob = new Blob([textToWrite], {type:'text/csv'});
			var downloadLink = document.createElement("a");
			downloadLink.download = fileNameToSaveAs;
			downloadLink.innerHTML = "Download File";
			if (window.webkitURL != null) {
				// Chrome allows the link to be clicked
				//without actually adding it to the DOM.
				downloadLink.href = window.webkitURL.createObjectURL(textFileAsBlob);
			} else {
				// Firefox requires the link to be added to the DOM
				//before it can be clicked.
				downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
				downloadLink.onclick = function(event){document.body.removeChild(event.target);};
				downloadLink.style.display = "none";
				document.body.appendChild(downloadLink);
			}
			downloadLink.click();
		},
		sortPlugins: function(pluginList) {
			var pluginOrder = function(pl) {
				switch (pl.pluginType) {
				case "Tabulator":
					return 0;
				default:
					return 100;
				}
			}
			return _.sortBy(pluginList, pluginOrder);
		}
}

//Prototypes
//--------------

//--- Component Prototype

function comp_proto(name, kind) {
    try {
        this.name = name;
        this.kind = kind;
        this.exp = "0.0";
        this._exp = "0.0";
    }
    catch (err) {
        console.log("Error in comp_proto(): " + comp_proto);
        debugger;
    }
}

comp_proto.prototype.value = function() {
	return eval(this.exp);
};
comp_proto.prototype.getName = function(obj) {
	return (obj) ? obj.name : "";
}
comp_proto.prototype.setCap = function(cap) {
	this.cap = cap;
	this.controls = cap.controls;
}
comp_proto.prototype.isKind = function(kind) {
	return this.kind == kind;
}
comp_proto.prototype.isIterable = function() {
	return this.isStock() || this.isSequence();
}
comp_proto.prototype.isCapsule = function() {
	return this.isKind("Capsule") || this.isClockedChip() || this.isAgent()
	|| this.isCell();
}
comp_proto.prototype.isSimulator = function() {
	return this.isCapsule() || this.isKind("AgentVector")
	|| this.isKind("CellMatrix") || this.isKind("Simworld")
	|| this.isKind("NodeNetwork") || this.isKind("NetWorld");
}
comp_proto.prototype.isCommand = function() {
	return this.isKind("Command");
}
comp_proto.prototype.isFlow = function() {
	return this.isKind("Flow");
}
comp_proto.prototype.isTerm = function() {
	return this.isKind("Term");
}
comp_proto.prototype.isSequence = function() {
	return this.isKind("Sequence");
}
comp_proto.prototype.isStock = function() {
	return this.isKind("Stock");
}
comp_proto.prototype.isLVariable = function() {
	return this.isKind("LVariable");
}
comp_proto.prototype.isInPin = function() {
	return this.isKind("InPin");
}
comp_proto.prototype.isOutPin = function() {
	return this.isKind("OutPin");
}
comp_proto.prototype.isAgent = function() {
	return this.isKind("Agent");
}
comp_proto.prototype.isCell = function() {
	return this.isKind("Cell");
}
comp_proto.prototype.isNode = function() {
	return this.isKind("Node");
}
comp_proto.prototype.isCodeChip = function() {
	return this.isKind("CodeChip");
}
comp_proto.prototype.isClockedChip = function() {
	return this.isKind("ClockedChip");
}
comp_proto.prototype.isPlugin = function() {
	return this.isKind("Plugin");
}
comp_proto.prototype.isNodeContainer = function() {
	return (this.isKind("NodeNetwork") || this.isKind("NetWorld"));
}
comp_proto.prototype.isConverter = function() {
	return this.isTerm() || this.isInPin() || this.isOutPin();
}

//Plugin prototype

function pl_proto(name, kind, ins, outs, props) {
	comp_proto.call(this, name, "Plugin");
	delete(this.exp);
	this.pluginType = kind;
	this.pins = new Array();
	this.comps = new Array();
	this.preOrPost = "post";
	for (var i = 0; i < ins.length; i++) {
		this[ins[i]] = new InPin(ins[i]);
		this.pins.push(this[ins[i]]);
		this.comps.push(this[ins[i]]);
	}
	for (var i = 0; i < outs.length; i++) {
		this[outs[i]] = new OutPin(outs[i]);
		this.pins.push(this[outs[i]]);
		this.comps.push(this[outs[i]]);
	}
	for (var i = 0; i < props.length; i++) {
		this[props[i]] = new Term(props[i]);
		this.comps.push(this[props[i]]);
	}
	this.scopemaker = pscopemaker(this.comps, this);
	this.scope = new this.scopemaker(0);
}

pl_proto.prototype = Object.create(comp_proto.prototype)
pl_proto.prototype.constructor = pl_proto;
pl_proto.prototype.setCap = function(cap) {
	comp_proto.prototype.setCap.call(this, cap);
	for (var i = 0; i < this.comps.length; i++)
		this.comps[i].setCap(cap);
}
pl_proto.prototype.reset = function(clock){
	this.scope = new this.scopemaker(clock.current);
	this.clock = clock;
};
pl_proto.prototype.prereset = function(clock){}
pl_proto.prototype.strobe = function(t, scope){
	this.scope.setTime(t);
};
pl_proto.prototype.update = function(t, scope){}
//-- Component definitions

//-- Iteratable - common ancestor of Stock and Sequence

function Iterable(name, kind) {
	comp_proto.call(this, name, kind);
	this.last = "0.0";
	this.values = new Object()
	this.init = null;
}

Iterable.prototype = Object.create(comp_proto.prototype);
Iterable.prototype.constructor = Iterable;
Iterable.prototype.value = function(t) {
	return nsutil.interpolate(t, this.values);
};
Iterable.prototype.reset = function(clock) {
	this.values = new Object();
	var start = this.init.call(this.cap.scope);
	for (var i = clock.lo; i <= clock.current; i += clock.dt)
		this.store(i, start);
};
Iterable.prototype.store = function(t, val) {
	this.last = this.values[t] = val;
};
Iterable.prototype.__defineGetter__("initial", function() {
	return this._exp;
});
Iterable.prototype.__defineSetter__("initial", function(e) {
	this._exp = e;
	if (typeof e == "string" || typeof e == "number") {
		eval(sprintf("function init(){return %s;}", e));
		this.init = init;
	} else if (typeof e == "function")
		this.init = e;
});
Iterable.prototype.show = function() {
	return this.values.toSource();
}
Iterable.prototype.clear = function(t) {
	delete this.values[t];
}
Iterable.prototype.current = function() {
	return this.last;
};

//-- Local Variable
function LVariable(name) {
	comp_proto.call(this, name, "LVariable")
	this._value = 0.0;
}

LVariable.prototype = Object.create(comp_proto.prototype);
LVariable.prototype.constructor = LVariable;
LVariable.prototype.__defineGetter__("value", function() {
	return function() {
		return this._value;
	}
});
LVariable.prototype.__defineSetter__("value", function(v) {
	this._value = v;
});
LVariable.prototype.__defineGetter__("initial", function() {
	return this._exp;
});
LVariable.prototype.__defineSetter__("initial", function(e) {
	this._exp = e;
	if (typeof e == "string" || typeof e == "number") {
		eval(sprintf("function init(){return %s;}", e));
		this.init = init;
	} else if (typeof e == "function")
		this.init = e;
});
LVariable.prototype.reset = function(clock) {
	this.value = this.init.call(this.cap.scope);
};


//Components
//--------------



//-- Stock

function Stock(name) {
	Iterable.call(this, name, "Stock");
	this.deriv = "0.0";
	this.inFlow = new Array();
	this.outFlow = new Array();
	this.k0 = this.k1 = this.k2 = this.k3 = null;
}

Stock.prototype = Object.create(Iterable.prototype);
Stock.prototype.constructor = Stock;
Stock.prototype.addInFlow = function(flow) {
	this.inFlow.push(flow);
	flow.outp = this;
	this.fixDeriv()
};
Stock.prototype.addOutFlow = function(flow) {
	this.outFlow.push(flow);
	flow.inp = this;
	this.fixDeriv();
};
Stock.prototype.update = function(t, dt, val) {
	this.store(t + dt, this.values[t] + val);
};
Stock.prototype.getDeriv = function() {
	return this.doDeriv;
}
Stock.prototype.current = function() {
	return this.last;
};
Stock.prototype.fixDeriv = function() {
	if (this.inFlow.length + this.outFlow.length == 0)
		return;
	this.deriv = this.funcify(this.inFlow, this.outFlow);
};
Stock.prototype.__defineSetter__("deriv", function(exp) {
	this._deriv = exp;
	if (typeof exp == "string" || typeof exp == "number") {
		eval(sprintf("function deriv(TIME){return %s;}", exp));
	} else if (typeof exp == "function") {
		function deriv(t) {
			return exp.call(this);
		}
	}
	this.doDeriv = deriv;
});
Stock.prototype.__defineGetter__("deriv", function() {
	return this._deriv;
});
Stock.prototype.toString = function() {
	return sprintf("[Stock %s %s %s]", this.name, this.getName(this.inFlow),
			this.getName(this.outFlow));
};

Stock.prototype.sumFlows = function(flowList) {
	if (flowList.length == 0) return null;
	if (flowList.length == 1) return flowList[0].exp;
	var funs = new Array();
	for (var i = 0; i < flowList.length; i++) {
		var exp = flowList[i].exp;
		if (typeof exp == "function") funs.push(exp);
		else if (typeof exp == "string") {
			eval(sprintf("function flow1(){return %s;}", exp));
			funs.push(flow1);
		}
	}
	return function(){
		var ans = 0;
		for (var i = 0; i < funs.length; i++) ans += funs[i].call(this);
		return ans;
	}
}

Stock.prototype.funcify = function(posList, negList) {
	var pos = this.sumFlows(posList);
	var neg = this.sumFlows(negList);
	if (pos != null) {
		if (neg == null)
			return pos;
		if (typeof pos == "function") {
			if (typeof neg == "function") {
				return function() {
					return pos.call(this) - neg.call(this);
				}
			}
			if (typeof neg == "string") {
				eval(sprintf("function neg1(){return %s;}", neg));
				return function() {
					return pos.call(this) - neg1.call(this);
				}
			}
		}
		if (typeof pos == "string") {
			if (typeof neg == "function") {
				eval(sprintf("function pos1(){return %s;}", pos));
				return function() {
					return pos1.call(this) - neg.call(this);
				}
			}
			if (typeof neg == "string") {
				eval(sprintf("function pos1(){return %s;}", pos));
				eval(sprintf("function neg1(){return %s;}", neg));
				return function(t) {
					return pos1.call(this) - neg1.call(this);
				}
			}
		}
	}
	if (typeof neg == "function")
		return function() {
			return -neg.call(this)
		};
	if (typeof neg == "string") {
		eval(sprintf("function neg1(TIME){return -(%s);}", neg));
		return neg1;
	}
}

//-- Sequence

function Sequence(name) {
	Iterable.call(this, name, "Sequence");
	delete this._deriv;
	delete this.deriv;
	this.next = 0;
}
Sequence.prototype = Object.create(Iterable.prototype);
Sequence.prototype.toString = function() {
	return sprintf("[Sequence %s]", this.name);
};
Sequence.prototype.__defineSetter__("next",
		function(exp) {
	this._next = exp;
	if (typeof exp == "string" || typeof exp == "number") {
		eval(sprintf("function doNext(t){return %s;}", new String(exp)
		.trim()));
	} else if (typeof (exp) == "function") {
		function doNext(t) {
			return exp.call(this);
		}
	}
	this.doNext = doNext;
});
Sequence.prototype.__defineGetter__("next", function() {
	return this._next;
});
Sequence.prototype.update = function(t, dt, val) {
	this.store(t + dt, val);
};

//-- Converter - common ancestor for Term, InPin and OutPin

function Converter(name, kind) {
    try {
        comp_proto.call(this, name, kind);
 		/*if (name == "maxEnvir") {
			GLOBAL_TMP = true;
			debugger;
		} else {
			GLOBAL_TMP = false;
		}*/
        this.cache = new Cachemaker(this.exp);

        // CHECK FOR ERRORS:
        if (isType(this.cache) === "undefined") throw "cache is undefined";
    }
    catch (err) {
        console.log("Error in Converter(): " + err);
        debugger;
    }
}
Converter.prototype = Object.create(comp_proto.prototype);

//!!
Converter.prototype.__defineGetter__("exp", function() {
	return this._exp;
});
Converter.prototype.__defineSetter__("exp", function(e) {
	this._exp = e;
	this.cache = new Cachemaker(e);
	this.value = function(t) {
		return this.cache.f(t, this.cap.scope);
	}
});

Converter.prototype.reset = function(clock) {
	this.cache.reset();
}
Converter.prototype.constructor = Converter;

//-- Flow

function Flow(name, inp, outp) {
	Converter.call(this, name, "Flow");
	this.inp = inp;
	this.outp = outp;
	if (inp)
		inp.addOutFlow(this);
	if (outp)
		outp.addInFlow(this);
	this._exp = "0.0";
}
Flow.prototype = Object.create(Converter.prototype);
Flow.prototype.constructor = Flow;
Flow.prototype.__defineGetter__("exp", function() {
	return this._exp;
});
Flow.prototype.__defineSetter__("exp", function(z) {
	this._exp = z;
	this.cache = new Cachemaker(z);
	this.value = function(t) {
		return this.cache.f(t, this.cap.scope);
	}
	if (this.inp)
		this.inp.fixDeriv();
	if (this.outp)
		this.outp.fixDeriv();
});
//Flow.prototype.reset = function(clock) {}
Flow.prototype.toString = function() {
	return sprintf("[Flow %s %s %s]", this.name, this.getName(this.inp), this
			.getName(this.outp));
};

//-- Term

function Term(name) {
	Converter.call(this, name, "Term");
}
Term.prototype = Object.create(Converter.prototype);
Term.prototype.toString = function() {
	return sprintf("[Term %s]", this.name);
}
Term.prototype.constructor = Term;

//-- Slider

function Slider(name) {
	Converter.call(this, name, "Term");
	this.exp = function(){return +this.controls[name].value;};
}
/*function Slider(name) {
	try {
		Converter.call(this, name, "Term");
        var tmpContrl = this.controls[name];

        // CHECK FOR ERRORS:
        if (isType(tmpContrl) === "undefined") throw "tmpContrl is undefined";
		this.exp = function expFunc() { return +tmpContrl.value; };
	}
	catch (err) {
		console.log("Error in Slider(): " + err);
		debugger;
	}
}*/
Slider.prototype = Object.create(Converter.prototype);
Slider.prototype.toString = function() {
	return sprintf("[Slider %s]", this.name);
}
Slider.prototype.constructor = Slider;

//-- Property

function Property(name) {
	Converter.call(this, name, "Term");
}
Property.prototype = Object.create(Converter.prototype);
Property.prototype.toString = function() {
	return sprintf("[Property %s]", this.name);
}
Property.prototype.constructor = Term;
Property.prototype.__defineGetter__("exp", function() {
	return this._exp;
});
Property.prototype.__defineSetter__("exp", function(e) {
	this._exp = e;
	this.cache = new Cachemaker(e, "fixed");
	this.value = function(t) {
		return this.cache.f(t, this.cap.scope);
	}
});

//-- InPin

function InPin(name) {
	Converter.call(this, name, "InPin");
}
InPin.prototype = Object.create(Converter.prototype);
InPin.prototype.toString = function() {
	return sprintf("[InPin %s]", this.name);
}
InPin.prototype.constructor = InPin;

//-- OutPin

function OutPin(name) {
	Converter.call(this, name, "OutPin");
}
OutPin.prototype = Object.create(Converter.prototype);
OutPin.prototype.toString = function() {
	return sprintf("[OutPin %s]", this.name);
}
OutPin.prototype.constructor = OutPin;

//-- CodeChip

function CodeChip(name, method, initial, inputs, methodname) {
	comp_proto.call(this, name, "CodeChip");
	this.method = ("code" in method) ? method.code : method;
	this.methodname = methodname;
	this.initial = method.initial;
	this.inputs = inputs;
	this.cacheable = ("cacheable" in method) ? method.cacheable : true;
	this.preOrPost = ("when" in method) ? method.preOrPost : "post";
	var mthd;
//	if (this.initial) {
//		var initval = (typeof this.initial == "function") ? this.initial() : this.initial;
//		mthd = this.method.apply(this.cap.scope, initval)
//	} else mthd = this.method;
//	this.value = this.memoize(mthd, this.inputs, this.cacheable);
}
CodeChip.prototype = Object.create(comp_proto.prototype);
CodeChip.prototype.toString = function() {
	return sprintf("[CodeChip %s %s]", this.name, this.methodname);
}
CodeChip.prototype.reset = function(clock) {
	var mthd;
	if (this.initial) {
		var initval = (typeof this.initial == "function") ? this.initial() : this.initial;
		mthd = this.method.apply(this.cap.scope, initval)
	} else mthd = this.method;
	this.value = this.memoize(mthd, this.inputs, this.cacheable);
}

CodeChip.prototype.memoize = function(f, actuals, cacheable) {
	var t0 = -1;
	var cache = null;
	var actuals0 = null;
	if (actuals != null) {
		actuals0 = [];
		for (var i in actuals) {
			actual = actuals[i];
			if (actual == null) actual = "0";
			if (typeof actual == "function") {
				actuals0.push(actual);
			} else if (typeof actual == "string" || typeof actual == "number") {
				eval(sprintf("function aactual(){return %s}", new String(actual).trim()));
				actuals0.push(aactual);
			}
		}
	}

	var g = function(scope) {
		if (actuals != null) {
			var acts = new Array();
			for (var i in actuals0)
				acts[i] = actuals0[i].call(scope);
			return f.apply(scope, acts);
		} else return f.apply(scope, arguments);
	}
	return function(t, scope) {
		if (t0 != t || !cacheable) {
			t0 = t
			cache = g(scope);
		}
		return cache;
	}
}

//-- Command

function Command(name, preOrPost) {
	comp_proto.call(this, name, "Command");
	var exp = this.exp
	if (typeof exp == "string") {
		eval(sprintf("function block(t){%s}", new String(exp).trim()));
		this.value = block.bind(this);
	} else if (typeof exp == "function") {
		function block() {
			exp.call(this);
		}
		this.value = exp.bind(this) // block;
	}
	this.preOrPost = (preOrPost) ? preOrPost : "post";
	this.initCom = name.indexOf("initial") == 0;
	this.finCom = name.indexOf("final") == 0;
}
Command.prototype = Object.create(comp_proto.prototype);
Command.prototype.__defineGetter__("exp", function() {
	return this._exp;
});
Command.prototype.__defineSetter__("exp", function(e) {
	this._exp = e;
	if (typeof e == "string") {
		eval(sprintf("function block(t){%s}", new String(e).trim()));
		this.value = block;
	} else if (typeof e == "function") {
		this.value = e;
	}
});

Command.prototype.reset = function(clock) {
}
Command.prototype.toString = function() {
	return sprintf("[Command %s]", this.name)
};
Command.prototype.execute = function(clock, s) {
	this.value.call(s, clock.current);
}
Command.prototype.constructor = Command;



//Higher Order Components and Aggregators
//--------------


//-- Capsule

function Capsule(name, components, properties, kind, controls) {
	comp_proto.call(this, name, (kind) ? kind : "Capsule");
	//debugger;
	this.controls = controls;
	this.properties = properties;
	this.components = new Object();
	for (var i in components)
		this.components[components[i].name] = components[i];
	this.clock = null;
	this.scope = null;
	this.Super = null;
	this.hasClockedChips = false;
	this.iterables = new Array();
	this.resetables = new Array();
	this.precoms = new Array();
	this.postcoms = new Array();
	this.preplugins = new Array();
	this.inpins = new Object();
	this.outpins = new Object();
	this.simulators = new Array();
	this.plugins = new Array();
	for ( var cidx in this.components) {
		var comp = this.components[cidx];
		this[comp.name] = comp;
		comp.setCap(this);
		if (comp.isClockedChip()) this.hasClockedChips = true;
		if (comp.isSimulator()) {
			comp.Super = this;
			this.simulators.push(comp);
		} else if (comp.isIterable()) {
			this.iterables.push(comp);
		} else if (comp.isCommand()) {
			if (comp.preOrPost == "pre")
				this.precoms.push(comp);
			if (comp.preOrPost == "post")
				this.postcoms.push(comp);
		} else if (comp.isConverter() || comp.isCodeChip()
				|| comp.isLVariable()
				|| (comp.isSimulator() && !comp.isClockedChip())) {
			this.resetables.push(comp);
		} else if (comp.isPlugin()) {
			if (comp.preOrPost == "pre") this.preplugins.push(comp);
			else this.plugins.push(comp);
		}
		if (comp.isInPin()) {
			this.inpins[comp.name] = comp;
		} else if (comp.isOutPin()) {
			this.outpins[comp.name] = comp;
		}
	}
	this.preplugins = nsutil.sortPlugins(this.preplugins);
	this.plugins = nsutil.sortPlugins(this.plugins);
	this.scopemaker = scopemaker(this.components, this);
}

Capsule.prototype = Object.create(comp_proto.prototype);
Capsule.prototype.constructor = Capsule;
Capsule.prototype.curCap = null;

Capsule.prototype.reset = function(clock) {
	var hold = Capsule.curCap;
	Capsule.curCap = this;
	this.clock = clock;
	for (var comp = 0; comp < this.plugins.length; comp++) {
		this.plugins[comp].prereset(clock);
	}
	this.scope = new this.scopemaker(clock.current);
	this.scope.resetting = true;
	for (var comp = 0; comp < this.resetables.length; comp++) {
		this.resetables[comp].reset(clock);
	}
	for (var comp = 0; comp < this.iterables.length; comp++) {
		this.iterables[comp].reset(clock);
	}
	for (var cp = 0; cp < this.simulators.length; cp++) {
		if (this.simulators[cp].isClockedChip()) continue;
		this.simulators[cp].reset(clock);
	}
	for (var comp = 0; comp < this.preplugins.length; comp++) {
		this.preplugins[comp].reset(clock, this.scope);
	}
	for (var comp = 0; comp < this.plugins.length; comp++) {
		this.plugins[comp].reset(clock, this.scope);
	}
	for (var cp = 0; cp < this.simulators.length; cp++) {
		if (this.simulators[cp].isNodeContainer())
			this.simulators[cp].connectNodes();
	}
	this.scope.resetting = false;
	Capsule.curCap = hold;
}

Capsule.prototype.iterate = function(t, epoch, k) {
	this.scope.setTime(t);
	var hold = Capsule.curCap;
	Capsule.curCap = this;
	if (this.clock.method == "Euler"
		|| (this.clock.method == "RK4" && epoch == "k0")) {
		for (var com = 0; com < this.precoms.length; com++) {
			if (this.precoms[com].initCom && !this.clock.isFirst())
				continue;
			if (this.precoms[com].finCom && !this.clock.isLast())
				continue;
			this.precoms[com].execute(this.clock, this.scope);
		}
		for (var plu = 0; plu < this.preplugins.length; plu++) {
			this.preplugins[plu].strobe(this.clock.current, this.scope);
		}
		for (var plu = 0; plu < this.preplugins.length; plu++) {
			this.preplugins[plu].update(this.clock.current, this.scope);
		}
	}
	if (this.hasClockedChips) {
		var k1 = function() {
			for (var sf = 0; sf < this.iterables.length; sf++) {
				integrator(this.clock.method, this.iterables[sf], this.clock.current,
						this.clock.dt, this.scope, epoch);
			}
			Capsule.curCap = hold;
			k();
		}.bind(this)
		kloop(this.simulators, function(x, k2){x.iterate(t, epoch, k2, this.clock);}.bind(this), k1);
	} else {
		for ( var cp in this.simulators) {
			this.simulators[cp].iterate(t, epoch, nsutil.bogus);
		}
		for ( var sf in this.iterables) {
			integrator(this.clock.method, this.iterables[sf], this.clock.current,
					this.clock.dt, this.scope, epoch);
		}
		Capsule.curCap = hold;
		k();
	}
}
Capsule.prototype.strobe = function() {
	return this.iterate.apply(this, arguments)
}
Capsule.prototype.toString = function() {
	return sprintf("[Capsule %s %s]", this.name, Object.keys(this.components));
}
Capsule.prototype.postProcess = function(t) {
	var hold = Capsule.curCap;
	Capsule.curCap = this;
	this.scope.setTime(t);
	for (var cp = 0; cp < this.simulators.length; cp++) {
		if (this.simulators[cp].isClockedChip())
			continue;
		this.simulators[cp].postProcess(t);
	}
	for (var com = 0; com < this.plugins.length; com++) {
		this.plugins[com].strobe(this.clock.current, this.scope);
	}
	for (var com = 0; com < this.plugins.length; com++) {
		this.plugins[com].update(this.clock.current, this.scope);
	}
	for (var com = 0; com < this.postcoms.length; com++) {
		if (this.postcoms[com].initCom && !this.clock.isFirst())
			continue;
		if (this.postcoms[com].finCom && !this.clock.isLast())
			continue;
		this.postcoms[com].execute(this.clock, this.scope);
	}
	Capsule.curCap = hold;
}
Capsule.prototype.terminate = function() {
	for (var com = 0; com < this.postcoms.length; com++) {
		if (this.postcoms[com].finCom)
			this.postcoms[com].execute(this.clock, this.scope);
	}
}
Capsule.prototype.FLIP = function(prob) {
	return Math.random() < prob;
}
Capsule.prototype.POISSON = function(lambda) {
	var l = Math.exp(-lambda);
	var k = 0;
	var p = 1;
	do {
		k++;
		p = Math.random() * p;
	} while (p > l);
	return k - 1;
}

//-- Clocked Chip

function ClockedChip(name, components, properties, clockParams) {
	Capsule.call(this, name, components, properties, "ClockedChip");
	if (Array.isArray(clockParams)) {
		this.clock = Object.create(Clock.prototype);
		Clock.apply(this.clock, clockParams);
	} else
		this.clock = new Clock(clockParams.lo, clockParams.hi, clockParams.dt,
				clockParams.method);
}

ClockedChip.prototype = Object.create(Capsule.prototype);
ClockedChip.prototype.strobe = function() {
	return Capsule.prototype.iterate.apply(this, arguments);
}
ClockedChip.prototype.iterate = function(t, epoch, k, capClock) {
	capClock.halt();
	this.clock.reset(this);
	this.clock.run(function(){k(); capClock.restart();});
}
ClockedChip.prototype.toString = function() {
	return sprintf("[ClockedChip %s %s]", this.name, Object
			.keys(this.components));
}

//-- AgentVector

function AgentVector(name, capgen, counter, rows, cols, simworld) {
	comp_proto.call(this, name, "AgentVector");
	this.recycle = [];
	this.capgen = capgen
	this.counter = counter;
	this.count = (counter == null) ? 0 : (typeof this.counter == "function") ? this.counter() : this.counter;
	this.rows = rows;
	this.cols = cols;
	this.lastId = 0;
	this.inpins = {Init_Count: new InPin("Init_Count")};
	this.inpinExps = new Object();
	this.simworld = simworld;
	this.generate();
	this.pinsDone = false;
	this.inPinSetup();
	this.outPinSetup();
	this.inpinSize = Object.keys(this.vector[0].inpins).length + 1;
	this.outpinSize = Object.keys(this.vector[0].outpins).length + 1;
	this.births = {};
	this.deaths = {};
	this.vscopes = [];
	this.__defineGetter__("AData", function() {
		return function(channel){
			switch (channel) {
			case "AGENTIDS":
				return Object.keys(this.vector);
				break;
			}
		}.bind(this);
	});
}

AgentVector.prototype = Object.create(comp_proto.prototype);
AgentVector.prototype.constructor = AgentVector;
AgentVector.prototype.strobe = function() {
	return this.iterate.apply(this, arguments)
}
AgentVector.prototype.setCap = function(cap) {
	comp_proto.prototype.setCap.call(this, cap);
	this.Super = cap;
	var vector = this.vector;
	for (var i = 0; i < vector.length; i++) {
		vector[i].setCap(cap);
		vector[i].Super = cap;
	}
}

AgentVector.prototype.generate = function(spec) {
	this.vector = new Array();
	var keys = (spec) ? Object.keys(spec) : null;
	for (var i = 0; i < this.count; i++) {
		var cap = this.populateOne(i);
		this.vector.push(cap);
		if (spec) {
			var rec = spec[keys[i]];
			cap.__init_x__ = rec.init_x;
			cap.__init_y__ = rec.init_y;
			cap.__init_heading__ = rec.init_heading;
		}
	}
	this.baseAgentSet = new Array();
	for ( var i in this.vector)
		this.baseAgentSet[i] = this.vector[i];
	this.lastId = this.count;
}
AgentVector.prototype.populateOne = function(i, init) {
	var cap;
	if (this.recycle.length > 0) {
		cap = this.recycle.pop();
		cap.clean();
		Agent.call(cap, cap.name, cap.components, cap.properties, i);
	} else {
		cap = this.capgen(i, Agent);
	}
	cap.agentvector = this;
	cap.Super = this.cap;
	if (this.simworld) {
		cap.simworld = this.simworld;
		cap.mycell = null;
	}
	return cap;
}
AgentVector.prototype.regenerate = function(spec) {
	if (typeof spec == "number") {
		this.count = spec;
		spec = undefined;
	} else {
		this.count = Object.keys(spec).length;
	}
	this.generate(spec);
	if (this.count == 0)
		return;
	if (!this.pinsDone) {
		var cap = this.vector[0];
		var hold = new Object();
		for ( var name in cap.inpins)
			hold[name] = this[name];
		this.inPinSetup();
		for ( var name in hold)
			this[name] = hold[name]
		this.outPinSetup();
	} else {
		for ( var name in this.inpinExps)
			this.inPinVectorFix(this.inpinExps[name], name);
	}
}
AgentVector.prototype.createAgent = function(spec, parent) {
	var newId = this.lastId++;
	var agent = this.populateOne(newId);
	agent.parent = parent.self;
	agent.setCap(this.cap)
	this.initialize(agent, spec, parent);
	this.births[newId] = agent;
	return newId;
}
AgentVector.prototype.killAgent = function(agent) {
	agent.zombie = true;
	this.deaths[agent.id] = agent;
}
AgentVector.prototype.toString = function() {
	return sprintf("[AgentVector %s %s]", this.name, this.capgen.name);
}
AgentVector.prototype.MYCELL = function(id) {
	return this.vector[+id].mycell.scope;
};
AgentVector.prototype.X = function(id) {
	return (this.vector[+id]) ? this.vector[+id]._x_ : null;
};
AgentVector.prototype.Y = function(id) {
	return (this.vector[+id]) ? this.vector[+id]._y_ : null;
};
AgentVector.prototype.THETA = function(id) {
	return (this.vector[+id]) ? this.vector[+id]._theta_ : null;
};
AgentVector.prototype.AGENTS = function(id) {
	if (id == undefined) {
		return this.vscopes;
//		var ans = new Array();
//		var keys = Object.keys(this.vector);
//		for (var i = 0; i < keys.length; i++) {
//			ans[keys[i]] = this.vector[keys[i]].scope;
//		}
//		return ans;
	}
	return (this.vector[+id]) ? this.vector[+id].scope : null;
};
AgentVector.prototype.__defineGetter__("Ids", function() {
	return Object.keys(this.vector)
});
AgentVector.prototype.__defineGetter__("Agentcount", function() {
	return Object.keys(this.vector).length;
});
AgentVector.prototype.inPinSetup = function() {
	if (this.vector.length == 0)
		return;
	var cap = this.vector[0];
	for (var name in cap.inpins) {
		this.__defineGetter__(name, (function(name0) {
			return function() {
				return this.inpinExps[name0]
			}
		})(name));
		this.__defineSetter__(name, (function(name0) {
			return function(f) {
				this.inpinExps[name0] = f;
				this.inPinVectorFix(f, name0);
			}
		})(name));
	}
	this.pinsDone = true;
}
AgentVector.prototype.inPinVectorFix = function(f, name) {
	for (j in this.vector) {
		this.inPinFix(f, name, this.vector[j]);
	}
}
AgentVector.prototype.inPinFix = function(f, name, cap) {
	var id = cap.id;
	if (typeof f == "string" || typeof f == "number") {
		cap.inpins[name].exp = sprintf(
				"(function(myId){return %s;}).call(this, %d)", new String(f).trim(), id);
	} else if (typeof f == "function") {
		cap.inpins[name].exp = function(t, Super) {
			return f.call(this, this.id);
		};
	}
}

AgentVector.prototype.outPinSetup = function() {
	if (this.vector.length == 0) return;
	var cap = this.vector[0];
	for ( var name in cap.outpins) {
		this.__defineGetter__(name, (function(name) {
			return function() {
				return function(k) {
					return this.vector[k].scope[name]
				}.bind(this);
			}
		})(name));
	}
}
AgentVector.prototype.initialize = function(cap, spec, pscope) {
	if (!spec) spec = pscope;
	cap.__init_x__ = nsutil.initMovement.call(this, ("x" in spec) ? spec.x : ("init_x" in spec) ? spec.init_x : pscope._x_);
	cap.__init_y__ = nsutil.initMovement.call(this, ("y" in spec) ? spec.y : ("init_y" in spec) ? spec.init_y : pscope._y_);
	cap.__init_heading__ = nsutil.initMovement.call(this, ("theta" in spec) ? spec.theta : ("init_heading" in spec) ? spec.init_heading : pscope._theta_);
	cap.__init_x__ = nsutil.wrap(cap.__init_x__, this.cols);
	cap.__init_y__ = nsutil.wrap(cap.__init_y__, this.rows);
	cap._x_ = cap.__init_x__;
	cap._y_ = cap.__init_y__;
	cap._theta_ = cap.__init_heading__;
	if ("simworld" in this) this.simworld.houseAgent(cap);
	for ( var name in spec) {
		var rec = spec[name]
		if (cap.components.hasOwnProperty(name)) {
			var comp = cap.components[name];
			if (comp.isIterable() || comp.isLVariable())
				comp.initial = rec;
			else
				comp.exp = rec;
		}
	}
	for ( var name in this.inpinExps)
		this.inPinFix(this.inpinExps[name], name, cap);
}
AgentVector.prototype.iterate = function(t, epoch, k) {
	for ( var name in this.changes)	this.changes[name] = [];
	this.changes._tot_ = new Object();
//	kloop(this.vector, function(x, k1){x.iterate(t, epoch, k1)}, k);
	var id = function(){};
	var v = this.vector;
	for (var i in v) {
		v[i].iterate(t, epoch, id);
	}
	k();

}

AgentVector.prototype.deleteAgentFromCell = function(agent) {
	if (this.simworld) this.simworld.cellmatrix.deleteAgentFromCell(agent);
	else {
		var cell = agent.mycell;
		delete cell.myagents[agent.id]
	}
}

AgentVector.prototype.addAgentToCell = function(agent) {
	if (this.simworld) return this.simworld.cellmatrix.addAgentToCell(agent);
	else {
		var cell = this.bucket[Math.floor(agent._y_)][Math.floor(agent._x_)];
		cell.myagents[agent.id] = agent;
		return cell;
	}
}

function kloop(l, f, k) {
	var keys = Object.keys(l)
	var k1 = function() {
		if (keys.length == 0) k();
		else {
			var key = keys.shift();
			f(l[key], k1, key);
		}
	}
	k1();
}

AgentVector.prototype.terminate = function() {
	for ( var i in this.vector)
		this.vector[i].terminate();
}

AgentVector.prototype.postProcess = function(t) {
	this.scope.setTime(t);
	for ( var i in this.vector)
		this.vector[i].postProcess(t);
	for ( var i in this.births) {
		var newbie = this.births[+i];
		this.vector[+i] = newbie;
		newbie.reset(this.clock);
		this.vscopes[+i] = newbie.scope;
	}
	for ( var i in this.deaths) {
		var agent = this.vector[+i];
		if ("simworld" in this) this.simworld.removeAgent(agent)
		if (agent.id >= this.count)
			this.recycle.push(agent);
		delete this.vector[+i];
		delete this.vscopes[+i];
	}
	this.changes["_births_"] = Object.keys(this.births);
	this.changes["_deaths_"] = Object.keys(this.deaths);
	this.deaths = {};
	this.births = {};
	if (!this.simworld) this.moveCell();
}
AgentVector.prototype.reset = function(clock) {
	delete this.vector;
	delete this.recycle;
	this.clock = clock;
	this.vector = new Array();
	this.recycle = new Array()
	this.scopemaker = scopemaker([], this);
	if (!this.simworld) {
		this.bucket = new Array();
		for (var i = 0; i < this.rows; i++) {
			this.bucket[i] = new Array();
			for (var j = 0; j < this.cols; j++) {
				this.bucket[i][j] = new Object();
				this.bucket[i][j].row = i;
				this.bucket[i][j].col = j;
				this.bucket[i][j].myagents = new Array();
			}
		}
	}
	this.scope = new this.scopemaker(clock.current);
	var oldcount = this.count;
	var incount = this.scope.Init_Count;
	if (incount != null) {
		this.count = (typeof incount == "function") ? incount.call(this.scope) : incount
	} else if (this.counter != null) {
		this.count = (typeof this.counter == "function") ? this.counter().call(this.scope) : this.counter;
	}
	if (oldcount == this.count)
		for ( var i in this.baseAgentSet) {
			this.vector[i] = this.baseAgentSet[i];
			this.vector[i].clean();
		}
	else {
		this.recycle = this.baseAgentSet;
		this.regenerate(this.count);
		this.lastId = this.count;
	}
	this.changes = new Object();
	this.changes.location = [];
	this.changes._tot_ = {};
	this.births = {};
	this.deaths = {};
	this.moved = new Array();
	if (this.vector.length == 0) return;
	this.changes["_births_"] = [];
	this.changes["_deaths_"] = [];
	for ( var idx in this.vector[0].outDataNames) {
		var name = this.vector[0].outDataNames[idx];
		if (name == "_x_" || name == "_y_")
			continue;
		this.changes[name] = [];
	}
	this.vscopes = [];
	for ( var i in this.vector) {
		this.vector[i].reset(clock);
		this.vscopes[i] = this.vector[i].scope;
	}
	if (!this.simworld) this.initInCell();
}
AgentVector.prototype.initInCell = function() {
	for (var idx in this.moved) {
		var agent = this.moved[idx];
		var cell = this.addAgentToCell(agent);
		this.putAgentInCell(agent, cell)
	}
	this.moved = new Array();
}
AgentVector.prototype.moveCell = function() {
	for (var idx in this.moved) {
		var agent = this.moved[idx];
		if (agent.zombie) continue;
		this.deleteAgentFromCell(agent)
		var newCell = this.addAgentToCell(agent)
		this.putAgentInCell(agent, newCell)
	}
	this.moved = new Array();
}
AgentVector.prototype.register = function(prop, agent) {
	this.changes[prop].push(agent.id);
	this.changes._tot_[agent.id] = agent.scope;
	if (prop == "location") this.moved.push(agent);
}

AgentVector.prototype.putAgentInCell = function(agent, cell) {
	agent.mycell = cell;
}
AgentVector.prototype.INBOUNDS = function(i, j) {
	var a = nsutil.coordsOrNum(i, j);
	var x = a[0];
	var y = a[1];
	return (y >= 0 && y < this.rows && x >= 0 && x < this.cols);
}

//- Agent - extended capsule constructor for agentvectors with av primops added
//to prototype

function Agent(name, components, properties, id) {
	Capsule.call(this, name, components, properties, "Agent");
	this.kind = "Agent";
	this.properties = properties;
	this.id = id;
	this._x_ = 0;
	this._y_ = 0;
	this._theta_ = 0;
	this.clean();
	this.zombie = false;
	this.parent = null;
	this.birth = 0;
	this.fresh = true;
	this.outDataNames = ["_x_", "_y_"].concat(Object.keys(this.outpins));
}

Agent.prototype = Object.create(Capsule.prototype)
Agent.prototype.constructor = Agent;
Agent.prototype.toString = function() {
	return sprintf("[Agent %s %s]", this.name, Object.keys(this.components));
}
Agent.prototype.clean = function() {
//	if ("init_x" in this.properties) this.__init_x__ = nsutil.initMovement.call(this, this.properties.init_x);
//	if ("init_y" in this.properties) this.__init_y__ = nsutil.initMovement.call(this, this.properties.init_y);
//	if ("init_heading" in this.properties) this.__init_heading__ = nsutil.initMovement.call(this, this.properties.init_heading);
}
Agent.prototype.reset = function(clock) {
	Capsule.prototype.reset.call(this, clock);
	this._x_ = nsutil.initMovement.call(this, ("init_x" in this.scope) ? this.scope.init_x : ("__init_x__" in this) ? this.__init_x__ : 0);
	this._y_ = nsutil.initMovement.call(this, ("init_y" in this.scope) ? this.scope.init_y : ("__init_y__" in this) ? this.__init_y__ : 0);
	this._theta_ = nsutil.initMovement.call(this, ("init_heading" in this.scope) ? this.scope.init_heading : ("__init_heading__" in this) ? this.__init_heading__ : 0);
	this.__init_x__ = this._x_;
	this.__init_y__ = this._y_;
	this.__init_heading__ = this._theta_;
	this.birth = this.clock.current;
	this.outPinData = new Object();
	if (this.agentvector.simworld) this.simworld.houseAgent(this);
	this.zombie = false;
	var locationFlag = false;
	for ( var idx = 0; idx < this.outDataNames.length; idx++) {
		var name = this.outDataNames[idx];
		var name1 = name;
		this.outPinData[name] = this.scope[name];
		if (name == "_x_" || name == "_y_") {
			if (locationFlag) continue;
			locationFlag = true;
			name1 = "location"
		}
		this.agentvector.register(name1, this);
	}
}
Agent.prototype.iterate = function(t, epoch, k) {
	if (this.zombie) k();
	Capsule.prototype.iterate.call(this, t, epoch, k);
}
Agent.prototype.postProcess = function(t, epoch) {
	Capsule.prototype.postProcess.call(this, t, epoch);
	var locationFlag = false;
	for ( var idx in this.outDataNames) {
		var name = this.outDataNames[idx];
		var name1 = name;
		if (this.outPinData[name] != this.scope[name]) {
			this.outPinData[name] = this.scope[name];
			if (name == "_x_" || name == "_y_") {
				if (locationFlag)
					continue;
				locationFlag = true;
				name1 = "location"
			} else
				name1 = name;
			this.agentvector.register(name1, this);
		}
	}
}
Agent.prototype.MYCELL = function(id) {
	return (id == undefined) ? this.mycell.scope : this.agentvector.MYCELL(id).scope;
};
Agent.prototype.MOVETO = function(x0, y0) {
	if (x0 == this.self._x_ && y0 == this.self._y_) return;
	var xy = nsutil.coordsOrNum(y0, x0);
	y0 = xy[0];
	x0 = xy[1];
	this.self._x_ = nsutil.wrap(x0, this.agentvector.cols);
	this.self._y_ = nsutil.wrap(y0, this.agentvector.rows);
	this.self.wrapped = (this._x_ != x0) || (this._y_ != y0);
}
Agent.prototype.MOVEPLUS = function(x, y) {
	var xy = nsutil.coordsOrNum(y, x);
	y = xy[0];
	x = xy[1];
	var x0 = this.self._x_ + x;
	var y0 = this.self._y_ + y;
	this.self._x_ = nsutil.wrap(x0, this.agentvector.cols);
	this.self._y_ = nsutil.wrap(y0, this.agentvector.rows);
	this.self.wrapped = (this._x_ != x0) || (this._y_ != y0);
}
Agent.prototype.MOVEPLUSR = function(r) {
	var x0 = this.self._x_ + r * Math.cos(this._theta_);
	var y0 = this.self._y_ + r * Math.sin(this._theta_);
	this.self._x_ = nsutil.wrap(x0, this.agentvector.cols);
	this.self._y_ = nsutil.wrap(y0, this.agentvector.rows);
	this.self.wrapped = (this._x_ != x0) || (this._y_ != y0);
}
Agent.prototype.LOCATION = function() {
	var agent = this;
	if (arguments.length > 0) {
		agent = agentvector.vector[id];
	}
	return {x: agent._x_, y: agent._y_, theta: agent._theta_};
}
Agent.prototype.CELL_COORDS = function() {
	var agent = this;
	if (arguments.length > 0) {
		agent = this.agentvector.vector[id];
	}
	return {col: Math.floor(agent._x_), row: Math.floor(agent._y_)};
}
Agent.prototype.NEWTHETA = function(theta) {
	this.self._theta_ = nsutil.math.normalize(theta);
}
Agent.prototype.CELL = function(i, j) {
	var rowcol = nsutil.coordsOrNum(i, j);
	return this.agentvector.simworld.cellmatrix.matrix[Math.floor(rowcol[0])][Math.floor(rowcol[1])].scope;
}
Agent.prototype.CELL_VALUE = function(i, j, field) {
	var rowcol = nsutil.coordsOrNum(i, j);
	return this.agentvector.simworld.cellmatrix.matrix[Math.floor(rowcol[0])][Math.floor(rowcol[1])].scope[field];
}
Agent.prototype.AGENTS = function(id) {
	return this.agentvector.vector[id].scope;
}
Agent.prototype.AGENTS_AT = function(row, col) {
	row = Math.floor(row);
	col = Math.floor(col);
	if (row == undefined && col == undefined) {
		var cell = this.mycell;
		return this.AGENTS_AT(cell.row, cell.col);
	}
	var bucket = (this.agentvector.simworld) ? this.CELL(row, col) :
		this.agentvector.bucket[row][col];
	return Object.keys(bucket.myagents).map(function(z) {
		return bucket.myagents[z].scope;
	});
}
Agent.prototype.AGENTBLOCK = function(dist) {
	var block = this.mycell.BLOCK(dist);
	var ans = new Array();
	for ( var i in block) {
		var myagents = this.CELL(block[i]).myagents;
		var keys = Object.keys(myagents);
		for ( var id in keys)
			ans.push(myagents[keys[id]].scope)
	}
	return ans;
}

Agent.prototype.DISTANCE_TO = function(z) {
	var other = (typeof z == "object") ? z : this.agentvector.vector[z];
	if (other == null) return infinity;
	return nsutil.math.distance(this, other)
}

Agent.prototype.IN_RADIUS = function(r) {
	var ans = new Array();
	var dist;
	for (var id in this.agentvector.vector) {
		if (id == this.id) continue;
		if ((dist = this.DISTANCE_TO(id)) <= r) {
			ans.push({id: id, distance: dist});
		}
	}
	ans.sort(function(x, y){return x.distance-y.distance});
	return ans;
}

Agent.prototype.BOUNCE = function(theta_in) {
	var x = this.self._x_;
	var y = this.self._y_;
	var theta = nsutil.math.normalize(theta_in);
	var rows = this.agentvector.rows;
	var cols = this.agentvector.cols;
	var newtheta = (x > 1 && x < cols-1 && y > 1 && y < rows-1) ? theta :
		(((x <= 1) && (theta > nsutil.math.pio2 || theta < nsutil.math.mpio2)) ||
				(x >= cols-1 && theta > nsutil.math.mpio2 && theta < nsutil.math.pio2)) ?
						nsutil.math.normalize(nsutil.math.pi - theta) :
							((y <= 2 && theta >= nsutil.math.mpi && theta <= 0) || (y >= rows-1 && theta >= 0 && theta <= nsutil.math.pi))?
									nsutil.math.normalize( -theta) : theta;
									return newtheta;
}

Agent.prototype.CREATE = function(spec, n) {
	if (n == 0)
		return null;
	if (n == undefined || n == 1) {
		var newId = this.agentvector.createAgent(spec, this);
		return newId;
	}
	var ans = [];
	for (var i = 0; i < n; i++) {
		ans.push(this.agentvector.createAgent(spec, this));
	}
	return ans;
}
Agent.prototype.KILL = function(id) {
	if (this.agentvector.vector[id])
		this.agentvector.killAgent(this.agentvector.vector[id]);
}
Agent.prototype.SOME_AGENT = function(a, field, val) {
	return a.some(function(x) {
		return x[field] == val
	})
};
AgentVector.prototype.X = function(id) {
	return (this.vector[+id]) ? this.vector[+id]._x_ : null;
}
Agent.prototype.RANDOM_MOVE = function() {
	var curX = this.self._x_
	var curY = this.self._y_;
	if (curX == undefined || curY == undefined)
		return {
		x : x,
		y : y
	};
	var newX = curX;
	var newY = curY;
	for (;;) {
		var flipX = Math.random();
		var dx = (flipX < .33333) ? -1 : (flipX < .66666) ? 0 : 1;
		var flipY = Math.random();
		var dy = (flipY < .33333) ? -1 : (flipY < .66666) ? 0 : 1;
		newX = curX + dx;
		newY = curY + dy;
		if (this.agentvector.INBOUNDS(newX, newY))
			return new Object({
				x : newX,
				y : newY
			});
	}
}

Agent.prototype.__defineGetter__("rows", function(){
	return this.agentvector.rows;
});

Agent.prototype.__defineGetter__("cols", function(){
	return this.agentvector.cols;
});

Agent.prototype.__defineGetter__("mycoords", function(){
	return {
		col: Math.floor(this._x_),
		row: Math.floor(this._y_),
	}
})

Agent.prototype.__defineGetter__("Location", function() {
	return {
		x : this.self._x_,
		y : this.self._y_,
		theta : this.self._theta_
	}
});
Agent.prototype.__defineGetter__("Agentcount", function() {
	return this.agentvector.Agentcount;
});
Agent.prototype.__defineGetter__("myId", function() {
	return this.id;
});

var MYCELL = nsutil.globify("MYCELL");
var MOVETO = nsutil.globify("MOVETO");
var MOVE = nsutil.globify("MOVETO");
var MOVEPLUS = nsutil.globify("MOVEPLUS");
var MOVEPLUSR = nsutil.globify("MOVEPLUSR");
var NEWTHETA = nsutil.globify("NEWTHETA");
var SET_HEADING = nsutil.globify("NEWTHETA");
var CELL = nsutil.globify("CELL");
var AGENTS = nsutil.globify("AGENTS");
var AGENTBLOCK = nsutil.globify("AGENTBLOCK");
var DISTANCE_TO = nsutil.globify("DISTANCE_TO");
var IN_RADIUS = nsutil.globify("IN_RADIUS");
var BOUNCE = nsutil.globify("BOUNCE");
var CREATE = nsutil.globify("CREATE");
var KILL = nsutil.globify("KILL");
var SOME_AGENT = nsutil.globify("SOME_AGENT");
var RANDOM_MOVE = nsutil.globify("RANDOM_MOVE");
var LOCATION = nsutil.globify("LOCATION");
var CELL_COORDS = nsutil.globify("CELL_COORDS");
var TIME = function(){return Capsule.curCap.scope.TIME;}

//-- CellMatrix

function CellMatrix(name, capgen, rows, cols, simworld) {
	comp_proto.call(this, name, "CellMatrix");
	this.capgen = capgen
	this.rows = rows;
	this.cols = cols;
	this.matrix = new Array();
	this.mscopes = new Array();
	this.cellsById = new Object();
	this.inpinExps = new Object();
	this.simworld = simworld;
	for (var i = 0; i < this.rows; i++) {
		this.matrix[i] = new Array();
		this.mscopes[i] = new Array();
		for (var j = 0; j < this.cols; j++) {
			var cap = capgen(i, j, Cell);
			cap.cellmatrix = this;
			cap.Super = this.cap;
			cap.Coords = {row : i,	col : j}
			this.matrix[i].push(cap);
			this.cellsById[cap.id] = cap;
			if (this.simworld)
				cap.myagents = new Object();
		}
	}
	this.inPinSetup();
	this.outPinSetup();
	this.inpinSize = Object.keys(this.matrix[0][0].inpins).length;
	this.outpinSize = Object.keys(this.matrix[0][0].outpins).length;
	if (simworld) {
		this.simworld = simworld;
	}
}

CellMatrix.prototype = Object.create(comp_proto.prototype);
CellMatrix.prototype.constructor = CellMatrix;
CellMatrix.prototype.strobe = function() {
	return this.iterate.apply(this, arguments)
}
CellMatrix.prototype.toString = function() {
	return sprintf("[CellMatrix %s %s]", this.name, this.capgen.name);
}
CellMatrix.prototype.setCap = function(cap) {
	comp_proto.prototype.setCap.call(this, cap);
	this.Super = cap;
	var matrix = this.matrix;
	for (var i = 0; i < matrix.length; i++) {
		for (var j = 0; j < matrix[i].length; j++) {
			matrix[i][j].setCap(cap);
			matrix[i][j].Super = cap;
		}
	}
}

CellMatrix.prototype.CELLS = function(i, j) {
	if (i == undefined && j == undefined)
		return this.mscopes;
//		var mat = new Array();
//		var matrix = this.matrix;
//		for (var i = 0; i < matrix.length; i++) {
//			mat[i] = new Array();
//			for (var j = 0; j < matrix[i].length; j++) mat[i][j] = matrix[i][j].scope;
//		}
//		return mat;
	if (j == undefined)
		return this.cellsById[i].scope;
	return this.mscopes[i][j];
}

var CELL = function(i, j){return Capsule.curCap.CELL(i, j);}

CellMatrix.prototype.CELL = CellMatrix.prototype.CELLS

CellMatrix.prototype.inPinSetup = function() {
	if (this.matrix.length == 0)
		return;
	var cap = this.matrix[0][0];
	for ( var name in cap.inpins) {
		this.__defineGetter__(name, (function(name0) {
			return function() {
				return this.inpinExps[name0]
			}
		})(name));
		this.__defineSetter__(name, (function(name0) {
			return function(f) {
				this.inpinExps[name0] = f;
				this.inPinNodesFix(f, name0);
			}
		})(name));
	}
}

CellMatrix.prototype.inPinNodesFix = function(f, name) {
	for (i in this.matrix) {
		for (j in this.matrix[i]) {
			this.inPinFix(f, name, this.matrix[i][j]);
		}
	}
}

CellMatrix.prototype.inPinFix = function(f, name, cap) {
	var id = cap.id;
	if (typeof f == "string" || typeof f == "number") {
		cap.inpins[name].exp = sprintf(
				"(function(coords){return %s;}).call(this, {row: %d, col:%d})",
				new String(f).trim(), i, j);
	} else if (typeof f == "function") {
		cap.inpins[name].exp = function() {
			return f.call(this, {
				row : this.row,
				col : this.col
			})
		};
	}
}

CellMatrix.prototype.outPinSetup = function() {
	if (this.matrix.length == 0)
		return;
	var cap = this.matrix[0][0];
	for ( var name in cap.outpins) {
		this.__defineGetter__(name, (function(name) {
			return function() {
				return function(i, j) {
					return this.matrix[i][j].scope[name]
				}.bind(this);
			}
		})(name));
	}
}

CellMatrix.prototype.iterate = function(t, epoch, k) {
	for ( var name in this.changes)	this.changes[name] = [];
	this.changes._tot_ = new Object();
//	kloop2(this.matrix, function(x, k1){x.iterate(t, epoch, k1)}, k);
	var m = this.matrix;
	var id = function(){}
	for (var i = 0; i < m.length; i++) {
		for (var j = 0; j < m[i].length; j++) {
			m[i][j].iterate(t, epoch, id);
		}
	}
	k();
}

function kloop2(m, f, k) {
	var rkeys = Object.keys(m)
	if (rkeys.length == 0) k();
	else {
		var ckeys = [];
		var rkey = null;
		var k1 = function() {
			if (ckeys.length == 0) {
				if (rkeys.length == 0) k();
				else {
					rkey = rkeys.shift();
					ckeys = Object.keys(m[rkey]);
					var ckey = ckeys.shift();
					f(m[rkey][ckey], k1);
				}
			} else {
				var ckey = ckeys.shift();
				f(m[rkey][ckey], k1, rkey, ckey);
			}
		}
		k1();
	}
}


CellMatrix.prototype.terminate = function() {
	for (i in this.matrix)
		for (j in this.matrix[i])
			this.matrix[i][j].terminate();
}
CellMatrix.prototype.postProcess = function(t) {
	this.scope.setTime(t);
	for (i in this.matrix)
		for (j in this.matrix[i])
			this.matrix[i][j].postProcess(t);
}
CellMatrix.prototype.reset = function(clock) {
	this.clock = clock;
	this.scopemaker = scopemaker([], this);
	this.scope = new this.scopemaker(clock.current);
	this.changes = new Object();
	this.changes._tot_ = new Object();
	if (this.matrix.length == 0)
		return;
	for ( var name in this.matrix[0][0].outpins)
		this.changes[name] = [];
	for (i in this.matrix)
		for (j in this.matrix[i]) {
			this.matrix[i][j].reset(clock);
			this.mscopes[i][j] = this.matrix[i][j].scope;
		}
}
CellMatrix.prototype.addAgentToCell = function(agent) {
	var cell = this.matrix[Math.floor(agent._y_)][Math.floor(agent._x_)];
	cell.myagents[agent.id] = agent;
	return cell
}
CellMatrix.prototype.deleteAgentFromCell = function(agent) {
	var cell = agent.mycell;
	delete cell.myagents[agent.id]
}
//- Cell - extended capsule constructor for cellmatrices with cm primops added
//to prototype

function Cell(name, components, properties, row, col) {
	Capsule.call(this, name, components, properties, "Cell");
	this.row = row;
	this.col = col;
	this.id = sprintf("C%d:%d", row, col);
}

Cell.prototype = Object.create(Capsule.prototype)
Cell.prototype.toString = function() {
	return sprintf("[Cell %s %s]", this.name, Object.keys(this.components));
}
Cell.prototype.constructor = Cell;
Cell.prototype.reset = function(clock) {
	Capsule.prototype.reset.call(this, clock);
	this.outPinData = new Object();
	if (this.cellmatrix.simworld)
		this.myagents = new Object();
	for ( var name in this.outpins) {
		this.outPinData[name] = this.scope[name];
		this.cellmatrix.changes[name].push(this.id);
		this.cellmatrix.changes._tot_[this.id] = this.scope;
	}
}
Cell.prototype.postProcess = function(t, epoch) {
	Capsule.prototype.postProcess.call(this, t, epoch);
	for ( var name in this.outpins) {
		if (this.outPinData[name] != this.scope[name]) {
			this.outPinData[name] = this.scope[name];
			this.cellmatrix.changes[name].push(this.id);
			this.cellmatrix.changes._tot_[this.id] = this.scope;
		}
	}
}
Cell.prototype.CELLS = function(i, j) {
	return this.cellmatrix.CELLS(i, j);
//	var mat = new Array();
//	var matrix = this.cellmatrix.matrix;
//	for (var i = 0; i < matrix.length; i++) {
//		mat[i] = new Array();
//		for (var j = 0; j < matrix[i].length; j++) mat[i][j] = matrix[i][j].scope;
//	}
//	return mat;
}
Cell.prototype.CELL = function(i, j) {
	var rowcol = nsutil.coordsOrNum(i, j);
	return this.cellmatrix.matrix[rowcol[0]][rowcol[1]].scope;
}
Cell.prototype.CELL_VALUE = function(i, j, prop) {
	var rowcol = nsutil.coordsOrNum(i, j);
	return this.cellmatrix.matrix[rowcol[0]][rowcol[1]].scope[prop];
}
Cell.prototype.MYAGENTS = function(i, j) {
	var that = this;
	if (i == undefined && j == undefined)
		return Object.keys(this.myagents).map(function(z) {
			return that.myagents[z].scope;
		});
	return this.CELL(i, j).MYAGENTS();
}
Cell.prototype.MYAGENT_COUNT = function(i, j) {
	if (i == undefined && j == undefined)
		return Object.keys(this.myagents).length;
	return this.CELL(i, j).MYAGENT_COUNT();
}
Cell.prototype.RING = function(dist) {
	var ans = new Array();
	if (this.row - dist > 0) {
		var i = this.row - dist;
		for (var j = this.col - dist; j <= this.col + dist; j++) {
			if (j < 0 || j >= this.cols)
				continue;
			ans.push({
				row : i,
				col : j
			});
		}
	}
	if (this.col + dist < this.cols) {
		var j = this.col + dist;
		for (var i = this.row - dist + 1; i <= this.row + dist; i++) {
			if (i < 0 || i >= this.rows)
				continue;
			ans.push({
				row : i,
				col : j
			});
		}
	}
	if (this.row + dist < this.rows) {
		var i = this.row + dist;
		for (var j = this.col + dist - 1; j >= this.col - dist; j--) {
			if (j < 0 || j >= this.cols)
				continue;
			ans.push({
				row : i,
				col : j
			});
		}
	}
	if (this.col - dist >= 0) {
		var j = this.col - dist;
		for (var i = this.row + dist - 1; i > this.row - dist; i--) {
			if (i < 0 || i >= this.rows)
				continue;
			ans.push({
				row : i,
				col : j
			});
		}
	}
	return ans;
}
Cell.prototype.WRING = function(dist) {
	var ans = new Array();
	var i = nsutil.wrap(this.row - dist, this.rows);
	for (var j = this.col - dist; j <= this.col + dist; j++) {
		ans.push({
			row : i,
			col : nsutil.wrap(j, this.cols)
		});
	}
	var j = nsutil.wrap(this.col + dist, this.cols);
	for (var i = this.row - dist + 1; i <= this.row + dist; i++) {
		ans.push({
			row : nsutil.wrap(i, this.rows),
			col : j
		});
	}
	i = nsutil.wrap(this.row + dist, this.rows);
	for (var j = this.col + dist - 1; j >= this.col - dist; j--) {
		ans.push({
			row : i,
			col : nsutil.wrap(j, this.cols)
		});
	}
	j = nsutil.wrap(this.col - dist, this.cols);
	for (var i = this.row + dist - 1; i > this.row - dist; i--) {
		ans.push({
			row : nsutil.wrap(i, this.rows),
			col : j
		});
	}
	return ans;
}
Cell.prototype.BLOCK = function(dist) {
	var ans = new Array();
	for (var i = this.row - dist; i <= this.row + dist; i++) {
		for (var j = this.col - dist; j <= this.col + dist; j++) {
			if (i < 0 || i >= this.rows || j < 0 || j >= this.cols)
				continue;
			ans.push({
				row : i,
				col : j
			});
		}
	}
	return ans;
}
Cell.prototype.WBLOCK = function(dist) {
	var ans = new Array();
	for (var i = this.row - dist; i <= this.row + dist; i++) {
		for (var j = this.col - dist; j <= this.col + dist; j++) {
			ans.push({
				row : i,
				col : j
			});
		}
	}
	return ans;
}
Cell.prototype.__defineGetter__("coords", function() {
	return {
		row : this.row,
		col : this.col
	};
});
Cell.prototype.__defineGetter__("rows", function() {
	return this.cellmatrix.rows;
});
Cell.prototype.__defineGetter__("cols", function() {
	return this.cellmatrix.cols;
});


var CELLS = nsutil.globify("CELLS");
var CELL = nsutil.globify("CELL");
var CELL_VALUE = nsutil.globify("CELL_VALUE");
var MYAGENTS = nsutil.globify("MYAGENTS");
var AGENTS_AT = nsutil.globify("AGENTS_AT");
var MYAGENT_COUNT = nsutil.globify("MYAGENT_COUNT");
var RING = nsutil.globify("RING");
var WRING = nsutil.globify("WRING");
var BLOCK = nsutil.globify("BLOCK");
var WBLOCK = nsutil.globify("WBLOCK");

//-- NodeNetwork

function NodeNetwork(name, capgen, count, nconnect, networld) {
	comp_proto.call(this, name, "NodeNetwork");
	this.capgen = capgen;
	this.nconnect = nconnect;
	this.nodes = new Array();
	this.inpinExps = new Object();
	this.networld = networld;
	this.count = count;
	this.connexions = new Array();
	for (var i = 0; i < this.count; i++) {
		var cap = capgen(i, Node);
		cap.nodenetwork = this;
		cap.Super = this.cap;
		cap.id = i
		this.nodes[i] = cap;
		if (this.networld)
			cap.myagents = new Object();
	}
	this.inPinSetup();
	this.outPinSetup();
	this.fstTime = true;
	if (networld) {
		this.networld = networld;
	}
	//	this.connectNodes();
}

NodeNetwork.prototype = Object.create(comp_proto.prototype);
NodeNetwork.prototype.constructor = NodeNetwork;
NodeNetwork.prototype.setCap = function(cap) {
	comp_proto.prototype.setCap.call(this, cap);
	this.Super = cap;
	var nodes = this.nodes;
	for (var i = 0; i < nodes.length; i++) {
		nodes[i].setCap(cap);
		nodes[i].Super = cap;
	}
}
NodeNetwork.prototype.strobe = function() {
	return this.iterate.apply(this, arguments)
}
NodeNetwork.prototype.toString = function() {
	return sprintf("[NodeNetwork %s %s]", this.name, this.capgen.name);
}
NodeNetwork.prototype.NODES = function(i) {
	return this.nodes[i].scope;
}
NodeNetwork.prototype.CONNECTION = function(id1, id2) {
	return this.nodes[id1].connexions_out[id2];
}
NodeNetwork.prototype.CONNECTIONS_OUT = function(id) {
	return this.nodes[i].connexions_out;
}
NodeNetwork.prototype.CONNECTIONS_IN = function(id) {
	return this.nodes[i].connexions_in;
}
NodeNetwork.prototype.OUTFLOW = function(id) {
	return this.nodes[i].outStrength;
}
NodeNetwork.prototype.INFLOW = function(id) {
	return this.nodes[i].inStrength;
}
NodeNetwork.prototype.inPinSetup = function() {
	if (this.nodes.length == 0)
		return;
	var cap = this.nodes[0];
	for ( var name in cap.inpins) {
		this.__defineGetter__(name, (function(name0) {
			return function() {
				return this.inpinExps[name0]
			}
		})(name));
		this.__defineSetter__(name, (function(name0) {
			return function(exp) {
				this.inpinExps[name0] = exp;
				this.inPinNodesFix(exp, name0);
			}
		})(name));
	}
}

NodeNetwork.prototype.inPinNodesFix = function(exp, name) {
	for (j in this.nodes) {
		this.inPinFix(exp, name, this.nodes[j]);
	}
}
NodeNetwork.prototype.inPinFix = function(exp, name, cap) {
	var id = cap.id;
	if (typeof exp == "number" || typeof exp == "function") {
		cap.inpins[name].exp = exp;
	} else if (typeof exp == "string") {
		var tmp = sprintf("function f0(id){var exp = %s; return (typeof exp == 'function') ? %s(%d) : %s;}",
					exp, exp, id, exp);
		eval(tmp);
		cap.inpins[name].exp = f0;
	}
}

NodeNetwork.prototype.outPinSetup = function() {
	if (this.nodes.length == 0)
		return;
	var cap = this.nodes[0];
	for ( var name in cap.outpins) {
		this.__defineGetter__(name, (function(name) {
			return function() {
				var that = this;
				return function(i) {
					return that.nodes[i].scope[name]
				}.bind(this);
			}
		})(name));
	}
}

NodeNetwork.prototype.iterate = function(t, epoch, k) {
	for ( var name in this.changes)	this.changes[name] = [];
	this.changes._tot_ = new Object();
	kloop(this.nodes, function(x, k1){x.iterate(t, epoch, k1)}, k);
}
NodeNetwork.prototype.terminate = function() {
	for (i in this.nodes)
		this.nodes[i].terminate();
}
NodeNetwork.prototype.postProcess = function(t) {
	this.scope.setTime(t);
	for (i in this.nodes)
		this.nodes[i].postProcess(t);
}
NodeNetwork.prototype.reset = function(clock) {
	this.clock = clock;
	this.scopemaker = scopemaker([], this);
	this.scope = new this.scopemaker(clock.current);
	this.changes = new Object();
	this.changes._tot_ = new Object();
	if (this.nodes.length == 0)
		return;
	for ( var name in this.nodes[0].outpins)
		this.changes[name] = [];
	for (i in this.nodes) {
		Capsule.prototype.reset.call(this.nodes[i], clock);
	}
	for (i in this.nodes) {
		this.nodes[i].reset(clock);
	}
}

NodeNetwork.prototype.connectNodes = function(){
	if (!this.fstTime) return;
	this.fstTime = false;
	for (i in this.nodes) {
		var node = this.nodes[i];
		node.connexions_in = new Array();
		node.connexions_out = new Array();
		node.outStrength = 0;
		node.inStrength = 0;
	}
	this.connexions = new Array();
	for (i in this.nodes) {
		this.nodes[i].connectUp(this.nodes, this.nconnect, this.connexions);
	}
	for (i in this.nodes) {
		this.nodes[i].normalizeConnexions();
	}
}
NodeNetwork.prototype.addAgentToNode = function(agent) {
	var node = this.nodes[Math.floor(agent.mynode)];
	node.myagents[agent.id] = agent;
	return node;
}
NodeNetwork.prototype.deleteAgentFromNode = function(agent) {
	var node = agent.mynode;
	delete node.myagents[agent.id]
}

//- Node - extended capsule constructor for nodenetworks with nn primops added
//to prototype

function Node(name, components, properties, id) {
	Capsule.call(this, name, components, properties, "Node");
	this.id = id;
	this.connexions_in = new Array();
	this.connexions_out = new Array();
	this.outStrength = 0;
	this.inStrength = 0;
}

Node.prototype = Object.create(Capsule.prototype)
Node.prototype.toString = function() {
	return sprintf("[Node %s %s]", this.name, Object.keys(this.components));
}
Node.prototype.constructor = Node;
Node.prototype.reset = function(clock) {
	//	Capsule.prototype.reset.call(this, clock);
	this.outPinData = new Object();
	if (this.nodenetwork.networld)
		this.myagents = new Object();
	for ( var name in this.outpins) {
		this.outPinData[name] = this.scope[name];
		this.nodenetwork.changes[name].push(this.id);
		this.nodenetwork.changes._tot_[this.id] = this.scope;
	}
}
Node.prototype.postProcess = function(t, epoch) {
	Capsule.prototype.postProcess.call(this, t, epoch);
	for ( var name in this.outpins) {
		if (this.outPinData[name] != this.scope[name]) {
			this.outPinData[name] = this.scope[name];
			this.nodenetwork.changes[name].push(this.id);
			this.nodenetwork.changes._tot_[this.id] = this.scope;
		}
	}
}
Node.prototype.normalizeConnexions = function() {
	var totStrength = this.outStrength;
	for ( var i in this.connexions_out) {
		var connect = this.connexions_out[i];
		connect.n_strength = connect.strength/totStrength;
	}
}
Node.prototype.connectUp = function(nodes, nconnect, connexions) {
	for (var i in nodes) {
		var other = nodes[i];
		if (other.id == this.id) continue;
		var strength = nconnect.call(this.scope.Super, this.id, other.id);
		if (strength == 0) continue;
		var entry = {
				source: this.id,
				target: other.id,
				strength : strength
		}
		connexions.push(entry);
//		this.connexions_out[other.id] = entry;
		this.connexions_out.push(entry);
		this.outStrength += strength;
//		other.connexions_in[this.id] = entry;
		other.connexions_in.push(entry);
		other.inStrength += strength;
	}
}

Node.prototype.NODE = function(i) {
	return this.nodenetwork.nodes[i].scope;
}
Node.prototype.MYAGENTS = function(i) {
	var that = this;
	if (i == undefined)
		return Object.keys(this.myagents).map(function(z) {
			return that.myagents[z].scope;
		});
	return this.NODE(i).MYAGENTS();
}
Node.prototype.MYAGENT_COUNT = function(i) {
	if (i == undefined)
		return Object.keys(this.myagents).length;
	return this.NODE(i).MYAGENT_COUNT();
}
Node.prototype.NODES = function(i) {
	return this.nodenetwork.NODES(i);
}
Node.prototype.CONNECTION = function(id1, id2) {
	return this.nodenetwork.CONNECTION(id1, id2);
}
Node.prototype.CONNECTIONS_OUT = function() {
	return this.nodenetwork.CONNECTIONS_OUT((arguments.length == 0) ? this.id : arguments[0]);
}
Node.prototype.CONNECTIONS_IN = function() {
	return this.nodenetwork.CONNECTIONS_IN((arguments.length == 0) ? this.id : arguments[0]);
}
Node.prototype.OUTFLOW = function(id) {
	return this.nodenetwork.OUTFLOW(id);
}
Node.prototype.INFLOW = function(id) {
	return this.nodenetwork.INFLOW(id);
}

//-- SimWorld

function Simworld(name, agentgen, cellgen, rows, cols, count) {
	comp_proto.call(this, name, "Simworld");
	this.agentgen = agentgen;
	this.cellgen = cellgen;
	this.rows = rows;
	this.cols = cols;
	this.count = count;
	this.agentvector = new AgentVector(name + "_agent", agentgen, count, rows, cols, this);
	this.cellmatrix = new CellMatrix(name + "_cell", cellgen, rows, cols, this);
	this.agentvector.Super = this.cap;
	this.cellmatrix.Super = this.cap;
	this.createOutPins();
	for (var i = 0; i < this.agentvector.vector.length; i++) {
		var agent = this.agentvector.vector[i];
		this.houseAgent(agent);
	}
}

Simworld.prototype = Object.create(comp_proto.prototype);
Simworld.prototype.constructor = Simworld
Simworld.prototype.setCap = function(cap) {
	comp_proto.prototype.setCap.call(this, cap);
	this.Super = cap;
	this.cellmatrix.setCap(cap);
	this.agentvector.setCap(cap);
}
Simworld.prototype.strobe = function() {
	return this.iterate.apply(this, arguments);
}
Simworld.prototype.toString = function() {
	return sprintf("[Simworld %s %s %s]", this.name, this.agentgen.name,
			this.cellgen.name);
}
Simworld.prototype.createOutPins = function() {
	this.__defineGetter__("AData", function(){return this.agentvector.AData;});
	for (var name in this.agentvector.vector[0].outpins) {
		(function() {
			var nm = name;
			this.__defineGetter__(nm, function(){return this.agentvector[nm]});
		}).call(this);
	}
	for (var name in this.cellmatrix.matrix[0][0].outpins) {
		(function() {
			var nm = name;
			this.__defineGetter__(nm, function(){return this.cellmatrix[nm]});
		}).call(this);
	}
}
Simworld.prototype.houseAgent = function(agent) {
	var x = Math.floor(agent._x_);
	var y = Math.floor(agent._y_);
	this.agentvector.putAgentInCell(agent, this.cellmatrix.matrix[y][x]);
}
Simworld.prototype.AGENTS = function(id) {
	return this.agentvector.AGENTS(id);
}
Simworld.prototype.CELLS = function(i, j) {
	return this.cellmatrix.CELLS(i, j);
}
Simworld.prototype.MYCELL = function(id) {
	return this.agentvector.vector[id].mycell.scope;
};
Simworld.prototype.MYAGENTS = function(row, col) {
	return this.cellmatrix.matrix[row][col].MYAGENTS()
};
Simworld.prototype.__defineGetter__("Agentcount", function() {
	return this.agentvector.Agentcount;
});


Simworld.prototype.reset = function(clock) {
	this.scopemaker = scopemaker([], this);
	this.scope = new this.scopemaker(clock.current);
	this.agentvector.reset(clock);
	this.cellmatrix.reset(clock);
	this.agentvector.initInCell();
}
Simworld.prototype.iterate = function(t, epoch, k) {
	this.agentvector.iterate(t, epoch, function(){this.cellmatrix.iterate(t, epoch, k);}.bind(this));
}
CellMatrix.prototype.terminate = function() {
	this.agentvector.terminate();
	this.cellmatrix.terminate();
}
Simworld.prototype.removeAgent = function(agent) {
	this.cellmatrix.deleteAgentFromCell(agent);
}
Simworld.prototype.postProcess = function(t) {
	this.scope.setTime(t);
	this.agentvector.postProcess(t);
	this.cellmatrix.postProcess(t);
	this.agentvector.moveCell();
}

//Core
//--------------

//-- Clock

function Clock(lo, hi, dt, method) {
	this.lo = lo;
	this.hi = this.getArg(hi);
	this.dt = (dt) ? dt : 1;
	this.current = lo;
	this.flag = false;
	this.newspeed = false;
	this.domultirun = false;
	this.speed = 0;
	this.method = (method) ? method : "Euler";
	this.cleanup = function() {
	}
	this.isRunAll = false;
}
Clock.prototype.stack = new Array();
Clock.prototype.reset = function(simulator) {
	this.current = this.lo;
	this.flag = false;
	this.k = null;
	if (simulator) {
		this.simulator = simulator;
	}
	this.simulator.reset(this);
}
Clock.prototype.stop = function() {
	this.flag = true;
}
Clock.prototype.step = function(k0) {
	var k = function() {
		this.current += this.dt;
		this.simulator.postProcess(this.current);
		if (k0) k0();
	}.bind(this);
	switch (this.method) {
	case "Euler":
		this.simulator.strobe(this.current, this.epochs[0], k);
		break;
	case "RK4":
		var h = [ this.current, this.current + this.dt / 2,
		          this.current + this.dt / 2, this.current + this.dt ];
		kloop(this.epochs, function(x, k1, i){this.simulator.strobe(h[i], x, k1)}.bind(this), k)
		break;
	}
};

Clock.prototype.terminate = function() {
	this.simulator.terminate();
}

Clock.prototype.epochs = [ "k0", "k1", "k2", "k3" ];

Clock.prototype.runAll = function() {
	this.isRunAll = true;
	var top = (arguments.length == 0) ? this.hi : arguments[0];
	for (var i = this.current; i <= top - this.dt; i += this.dt)
		this.step();
	this.isRunAll = false;
}

Clock.prototype.run = function() {
	if (this.running) return;
	var top = (arguments.length <= 1) ? this.hi : arguments[1];
	var that = this;
	this.quitter = function() {
		return this.flag || this.current > top - this.dt;
	}.bind(this);
	this.timer = null;
	this.k = arguments[0];
	this.everyk = arguments[2];
	this.ping = function() {
		if (this.quitter()) {
			this.running = false;
			Clock.curClock = null;
			clearInterval(this.timer);
			if (this.k) this.k.call(this.simulator.scope);
			this.domultirun = false;
			this.newspeed = false;
			return true;
		}
		this.step(this.iterate);
		if (this.everyk) this.everyk.call(this.simulator.scope);
		if (this.newspeed && !this.domultirun) {
			this.newspeed = false;
			this.runit();
		}
		return false;
	}.bind(this);
	this.running = true;
	Clock.curClock = this;
	this.runit();
}

Clock.prototype.multirun = function() {
	for (var i = 0; i < this.postInterval; i++) {
		if (this.ping()) {
			this.domultirun= false;
			return;
		}
	}
}

Clock.prototype.restart = function() {
	Clock.curClock = this;
	this.runit();
}

Clock.prototype.cont = function() {
	if (this.running || this.timer == null) return;
	this.flag = false;
	this.running = true;
	this.runit();
}

Clock.prototype.runit = function() {
	clearInterval(this.timer);
	if (this.postInterval > 0) {
		this.domultirun = true;
		this.timer = setInterval(this.multirun.bind(this), 0);
	} else {
		this.timer = setInterval(this.ping, this.speed);
	}
}

Clock.prototype.halt = function() {
	clearInterval(this.timer);
	this.running = false;
}

Clock.prototype.isFirst = function() {
	return this.current == this.lo;
}

Clock.prototype.isLast = function() {
	return Math.abs(this.current - this.hi) < 0.001
	|| (this.current -  0.001) > this.hi - this.dt;
}

Clock.prototype.resetIterate = function() {
	delete this.iterate;
}

Clock.prototype.setSpeed = function(speed) {
	this.speed = speed;
}

Clock.prototype.process = function() {
	var top = (arguments.length == 0) ? this.hi : arguments[0];
	while (this.current <= top - this.dt && !this.flag) {
		this.step();
	}
}

Clock.prototype.toString = function() {
	return sprintf("[Clock %f %f %f %s]", this.lo, this.hi, this.dt,
			this.method);
};

Clock.prototype.getArg = function(arg) {
	if (typeof arg == "number") return arg;
	return +arg.value;
}


//Plugin ScopeMaker

function pscopemaker(comps, base) {
	var f = function(t) {
		this.TIME = t;
	}
	f.prototype = Object.create(base);
	f.prototype.constructor = f;
	f.prototype.self = base;
	f.prototype.toString = function() {
		return sprintf("[PluginScope %s %f]", this.self.name, this.TIME)
	};
	f.prototype.setTime = function(t) {
		this.TIME = t;
	}
	for (var i = 0; i < comps.length; i++) {
		(function() {
			var cmp = comps[i];
			f.prototype.__defineGetter__(cmp.name, function() {
				return cmp.value(this.TIME, this);
			});
		})();
	}
	return f;
}


//ScopeMaker

function scopemaker(comps, base) {
	var properties = base.properties;
	var f = function(t) {
		this.TIME = t;
	}
	f.prototype = Object.create(base);
	f.prototype.constructor = f;
	f.prototype.self = base;
	f.prototype.toString = function() {
		return sprintf("[Scope %s %f]", this.self.name, this.TIME)
	};
	f.prototype.setTime = function(t) {
		this.TIME = t;
	}
	for (var prop in base.properties) {
		if (prop == "init_x" || prop == "init_y" || prop == "init_heading")
			f.prototype.__defineGetter__(prop,
				(function(p) {
					var p1 = "__"+p+"__";
					return function(){
						return (p1 in base) ? base[p1] : nsutil.initMovement.call(this, properties[p]);
					}
				})(prop));
		else f.prototype.__defineGetter__(prop,
				(function(p){return function(){return properties[p]}})(prop));
	}
	f.prototype.__defineGetter__("Super", function() {
		return (this.self.Super) ? this.self.Super.scope : null;
	});
	for ( var i in comps) {
		if (comps[i].isCommand())
			continue;
		if (comps[i].isCapsule() || comps[i].isPlugin()) {
			(function() {
				var cmp = comps[i];
				f.prototype.__defineGetter__(cmp.name, function() {
					return cmp.scope;
				});
			})();
			continue;
		}
		if (comps[i].isSimulator()) {
			(function() {
				var cmp = comps[i];
				f.prototype.__defineGetter__(cmp.name, function() {
					return cmp;
				});
			})();
			continue;
		}
		if (comps[i].isLVariable)
			(function() {
				var cmp = comps[i];
				f.prototype.__defineSetter__(cmp.name, function(v) {
					return cmp.value = v;
				});
			})();
		(function() {
			var cmp = comps[i];
			f.prototype.__defineGetter__(cmp.name, function() {
				return cmp.value(this.TIME, this);
			});
		})();
	}
	return f;
}

//Integrator

function integrator(method, sf, current, dt, scope, epoch) {
	switch (sf.kind) {
	case 'Sequence':
		if (method == "Euler" || (method == "RK4" && epoch == "k3")) {
			var x = sf.doNext.call(scope, current);
			sf.update(current, dt, x);
		}
		break;
	case 'Stock':
		switch (method) {
		case "Euler":
			var x = sf.getDeriv().call(scope, current);
			sf.update(current, dt, x * dt);
			break;
		case "RK4":
			switch (epoch) {
			case "k0":
				var k1 = sf.getDeriv().call(scope, current);
				sf.update(current, dt / 2, dt / 2 * k1);
				sf["k1"] = k1;
				break;
			case "k1":
				var k2 = sf.getDeriv().call(scope, current + dt / 2);
				sf.update(current, dt / 2, dt / 2 * k2);
				sf["k2"] = k2;
				break;
			case "k2":
				var k3 = sf.getDeriv().call(scope, current + dt / 2);
				sf.update(current, dt, dt * k3);
				sf["k3"] = k3;
				break;
			case "k3":
				var k4 = sf.getDeriv().call(scope, current + dt);
				sf.clear(current + dt / 2);
				sf.update(current, dt, (dt / 6)
						* (sf["k1"] + 2 * sf["k2"] + 2 * sf["k3"] + k4));
				break;
			}
		}
	}
}

//Cache Maker

function Cachemaker(exp, fixed) {
	if (typeof exp == "string" || typeof exp == "number") {
		eval(sprintf("function f0(){return %s;}", new String(exp).trim()));
	} else if (typeof exp != "function") {
		eval(sprintf("function f0(){return %s;}", JSON.stringify(exp).trim()));
	} else {
		function f0() {
			return exp.call(this);
		}
	}
	this.cache = null;
	this.t0 = null;
	this.reset = function() {
		this.cache = null;
		this.t0 = null;
	}
	var that = this;
	this.f = (fixed) ?
		function(t, scope) {
			if (that.cache == null)
				that.cache = f0.call(scope);
			return that.cache;
		} :
		function(t, scope) {
			if (t != undefined && t != that.t0) {
				that.t0 = t;
				that.cache = f0.call(scope);
			}
			return that.cache;
		}
}

/*function Cachemaker(exp, fixed) {
    try {
		if (GLOBAL_TMP) {
			debugger;
		}
        //debugger;
        if (isType(exp) === "string" || isType(exp) === "number") {
			if (GLOBAL_TMP) {
				console.log("In Cachemaker...first if-else");
				debugger;
			}
            eval(sprintf("function f0(){return %s;}", new String(exp).trim()));
        } else if (isType(exp) !== "function") {
			if (GLOBAL_TMP) {
				console.log("In Cachemaker...second if-else");
				debugger;
			}
            eval(sprintf("function f0(){return %s;}", JSON.stringify(exp).trim()));
        } else {
			if (GLOBAL_TMP) {
				console.log("In Cachemaker...in -else!");
				debugger;
			}
            function callExp() {
                var tmpRetrn = exp.call(this);
                if (isType(tmpRetrn) === "undefined") throw "exp.call(this) is undefined";
                return tmpRetrn;
            }
        }
        this.cache = null;
        this.t0 = null;
		this.reset = function getReset() {
			this.cache = null;
			this.t0 = null;
		}
        var that = this;
        if (fixed) {
            this.f = function getFif(t, scope) {
                if (isType(that.cache) === "null") {
                    that.cache = f0.call(scope);
                }
                if (isType(that.cache) === "undefined") throw "that.cache is undefined";
                return that.cache;
            }
        } else {
            this.f = function getFelse(t, scope) {
                    if (t != undefined && t != that.t0) {
                        that.t0 = t;
                        that.cache = f0.call(scope);
                    }
                    if (isType(that.cache) === "undefined") throw "that.cache is undefined";
                    return that.cache;
                }
        }
        // CHECK FOR ERRORS:
        return true;
    }
    catch (err) {
        console.log("Error in cachemaker(): " + err);
        debugger;
    }
}
*/
//Simulation Generator
//--------------


function SimGen(schema, controls, name) {
	var CapGen = function(schema, name, properties, pins) {
		var capparts = capbuilder(schema, name, properties, pins);
		return new Capsule(capparts.name, capparts.comps, capparts.properties, null, controls);
	};
	var LVarGen = function(schema, name, properties) {
		var ans = new LVariable(name);
		ans.initial = funcify(schema.initial);
		return ans;
	};
	var StockGen = function(schema, name, properties) {
		var ans = new Stock(name);
		ans.initial = funcify(schema.initial);
		return ans;
	};
	var FlowGen = function(schema, name, properties, stocks) {
		var ans = new Flow(name, stocks[schema.input], stocks[schema.output]);
		ans.exp = funcify(schema.exp);
		return ans;
	};
	var TermGen = function(schema, name, properties) {
		var ans = new Term(name);
		ans.exp = funcify(schema.exp);
		return ans;
	};
	var SliderGen = function(schema, name, properties) {
		var ans = new Slider(name);
		if ("exp" in schema) ans.exp = funcify(schema.exp);
		return ans;
	};
	var PropGen = function(schema, name, properties) {
		var ans = new Property(name);
		ans.exp = funcify(schema.exp);
		return ans;
	};
	var InPinGen = function(schema, name, properties) {
		var ans = new InPin(name);
		ans.exp = funcify(schema.exp);
		return ans;
	};
	var OutPinGen = function(schema, name, properties) {
		var ans = new OutPin(name);
		ans.exp = funcify(schema.exp);
		return ans;
	};
	var VarGen = function(schema, name, properties) {
		var ans = new Stock(name);
		ans.initial = funcify(schema.initial);
		ans.deriv = funcify(schema.prime);
		return ans;
	};
	var SeqGen = function(schema, name, properties) {
		var ans = new Sequence(name);
		ans.initial = funcify(schema.initial);
		ans.next = funcify(schema.next);
		return ans;
	};
	var ChipGen = function(schema, name, properties) {
		var base = schemaGet(schema.base);
		if (name == undefined && typeof schema.base == "string") name = base;
		var pinz = ("pins" in schema) ? schema.pins : schema.inputs
				var ans = CapGen(base, name, properties, pinz);
		return ans;
	};
	var ClockedChipGen = function(schema, name, properties) {
		var base = schemaGet(schema.base);
		if (name == undefined && typeof schema.base == "string") name = base;
		var pinz = ("pins" in schema) ? schema.pins : schema.inputs;
		var capparts = capbuilder(base, name, properties, pinz);
		return new ClockedChip(capparts.name, capparts.comps, capparts.properties, schema.clock);
	};
	var CommandGen = function(schema, name, properties) {
		var ans = new Command(name, schema.when);
		ans.exp = funcify(schema.exp);
		return ans;
	};
	var AgentGen = function(schema, name, properties, id) {
		var properties1 = merge(properties, {id: id});
		var capparts = capbuilder(schema, name, properties1);
		return new Agent(capparts.name, capparts.comps, capparts.properties, id);
	};
	var AgentVectorGen = function(schema, name, properties) {
		var agentbuilder = function(id) {
			var base = schemaGet(schema.base);
			var name1 = (base.name == undefined && typeof schema.base == "string") ? schema.base : base.name;
			return AgentGen(base, name1 + "_" + id,	properties, id);
		}
		var rows = ("dimension" in schema) ? schema.dimension.rows : schema.rows;
		var cols = ("dimension" in schema) ? schema.dimension.cols : schema.cols;
		var av = new AgentVector(name, agentbuilder, schema.count, rows, cols);
		var pinz = ("pins" in schema) ? schema.pins : schema.inputs
				if (pinz) {
					for ( var pin in pinz) {
						av[pin] = funcify(pinz[pin]);
					}
				}
		return av;
	};
	var CellGen = function(schema, name, properties, r, c) {
		var properties1 = merge(properties, {id: r+"_"+c});
		var capparts = capbuilder(schema, name, properties1);
		return new Cell(capparts.name, capparts.comps, capparts.properties, r, c);
	};
	var CellMatrixGen = function(schema, name, properties) {
		var cellbuilder = function(r, c) {
			var base = schemaGet(schema.base);
			var name1 = (base.name == undefined && typeof schema.base == "string") ? schema.base : base.name;
			return CellGen(base, name1 + "_" + r + "_" + c,
					properties, r, c);
		}
		var cm = new CellMatrix(name, cellbuilder, schema.rows, schema.cols);
		var pinz = ("pins" in schema) ? schema.pins : schema.inputs
				if (pinz) {
					for ( var pin in pinz)
						cm[pin] = funcify(pinz[pin]);
				}
		return cm;
	};
	var NodeGen = function(schema, name, properties, id) {
		var properties1 = merge(properties, {id: id});
		var capparts = capbuilder(schema, name, properties1);
		return new Node(capparts.name, capparts.comps, capparts.properties, id);
	};
	var NodeNetworkGen = function(schema, name, properties) {
		var nodebuilder = function(id) {
			var base = schemaGet(schema.base);
			var name1 = (base.name == undefined && typeof schema.base == "string") ? schema.base : base.name;
			return NodeGen(base, name1 + "_" + id,
					properties, id);
		}
		var nn = new NodeNetwork(name, nodebuilder, schema.count,
				schema.nconnect);
		var pinz = ("pins" in schema) ? schema.pins : schema.inputs
				if (pinz) {
					for ( var pin in pinz)
						nn[pin] = pinz[pin];
				}
		return nn;
	};
	var SimWorldGen = function(schema, name, properties) {
		var agentbuilder = function(id) {
			var agentbase = schemaGet(schema.agentbase);
			var name1 = (agentbase.name == undefined && typeof schema.agentbase == "string") ? schema.agentbase : agentbase.name;
			return AgentGen(agentbase, name1 + "_" + id,
					properties, id);
		}
		var cellbuilder = function(r, c) {
			var cellbase = schemaGet(schema.cellbase);
			var name1 = (cellbase.name == undefined && typeof schema.cellbase == "string") ? schema.cellbase : cellbase.name;
			return CellGen(cellbase, name1 + "_" + r
					+ "_" + c, properties, r, c);
		}
		var sw = new Simworld(name, agentbuilder, cellbuilder, schema.rows,
				schema.cols, schema.count);
		var apinz = ("apins" in schema) ? schema.apins : schema.ainputs;
		var cpinz = ("cpins" in schema) ? schema.cpins : schema.cinputs;
		if (apinz) {
			for (var pin in apinz) {
				sw.agentvector[pin] = funcify(apinz[pin]);
			}
		}
		if (cpinz) {
			for (var pin in cpinz)
				sw.cellmatrix[pin] = funcify(cpinz[pin]);
		}
		return sw;
	};
	var CodeChipGen = function(schema, name, properties, methods) {
		return new CodeChip(name, methods[schema.method], schema.initial,
				schema.inputs, schema.method);
	};
	var PluginGen = function(schema, name, properties) {
		var base = schemaGet(schema.base);
		var name1 = (name == undefined && typeof schema.base == "string") ? schema.base : name;
		var plugin = Object.create(base.prototype);
		var sproperties = (typeof schema.properties == "function") ? schema.properties() : schema.properties;
		var pinz = ("pins" in schema) ? schema.pins : schema.inputs
				base.call(plugin, name1, sproperties || {}, pinz, properties);
		return plugin;
	};
	var capbuilder = function(schema, name, properties, pins) {
		var allProperties = merge(schema.properties, properties);
		var methods = schema.methods;
		var stocks = new Object();
		var comps = new Array();
		for ( var prop in schema.components) {
			var pschema = schema.components[prop]
			if ("specifies" in pschema)  pschema.type = pschema.specifies;
			if (pschema.type == "Stock") {
				stocks[prop] = dispatch[pschema.type](pschema, prop,
						allProperties, methods);
				comps.push(stocks[prop]);
			}
		}
		for ( var prop in schema.components) {
			var pschema = schema.components[prop];
			if ("specifies" in pschema)  pschema.type = pschema.specifies;
			if (pschema.type == "Stock")
				continue;
			if (pschema.type == "InPin" && (pins && pins[prop])) {
				pschema = {
						type : "InPin",
						exp : pins[prop]
				};
			}
			comps.push(dispatch[pschema.type](pschema, prop, allProperties,
					(pschema.type == "Flow") ? stocks : methods));
		}
		var name = (name) ? name : schema.name;
		return {
			name : name,
			comps : comps,
			properties: schema.properties || {}
		};
	}
	var merge = function(p0, p1) {
		var ans = new Object();
		for ( var i in p0)
			ans[i] = p0[i];
		for ( var i in p1)
			ans[i] = p1[i];
		return ans;
	}
	var funcify = function(exp) {
		exp = exp || "0";
		var ans;
		if (typeof exp == "function") return exp;
		if (typeof exp == "string") {
			exp = exp.trim();
			if (exp[exp.length-1] == ";") {
				exp = exp.substring(0, exp.length-1);
			}
		}
		ans = "function f0(){var __ans__ = (" + exp + "); return __ans__;}";
		eval(ans);
		return f0;
	}
	var dispatch = {
			Capsule : CapGen,
			Stock : StockGen,
			Flow : FlowGen,
			Variable : VarGen,
			Sequence : SeqGen,
			Chip : ChipGen,
			Command : CommandGen,
			Term : TermGen,
			Property : PropGen,
			InPin : InPinGen,
			OutPin : OutPinGen,
			AgentVector : AgentVectorGen,
			CellMatrix : CellMatrixGen,
			NodeNetwork : NodeNetworkGen,
			SimWorld : SimWorldGen,
			CodeChip : CodeChipGen,
			LVariable : LVarGen,
			ClockedChip : ClockedChipGen,
			Plugin : PluginGen,
			Slider : SliderGen
	}
	if ("specifies" in schema)  schema.type = schema.specifies;
	var ans = dispatch[schema.type](schema, (name) ? name : schema.name, null, null, controls);
	return ans;
}

//Universal Primops
//--------------

var SIN = Math.sin;
Capsule.prototype.SIN = SIN;
var COS = Math.cos;
Capsule.prototype.COS = COS;
var TAN = Math.tan;
Capsule.prototype.TAN = TAN;
var RANDOM = Math.random;
Capsule.prototype.RANDOM = RANDOM;

var DISTANCE = function(x0, y0, x1, y1) {
	return Math.sqrt(Math.pow(x0-x1, 2)+Math.pow(y0-y1, 2));
}
var BINOMIAL = function(n, p) {
	var ans = 0;
	for (var i = 0; i < n; i++) if (Math.random() < p) ans++;
	return ans;
}
Capsule.prototype.BINOMIAL = BINOMIAL;

var MULTINOMIAL= function(n, p) {
	var ans = [];
	var m = p.length;
	for (var j = 0; j < m; j++) ans[j] = 0;
	for (var i = 0; i < n; i++) {
		var flip = Math.random();
		for (var j = 0; j < m; j++) {
			if (flip < p[j]) {
				ans[j]++;
				break;
			}
			flip -= p[j];
		}
	}
	return ans;
}
Capsule.prototype.MULTINOMIAL = MULTINOMIAL;

var STEP = function(amt, start) {
	if (Clock.curClock.current > start) return amt;
	return 0.0;
}
Capsule.prototype.STEP = STEP

var NORMAL = function(m, s) {
	var x1, x2, rad, y1;
	do {
		x1 = 2 * Math.random() - 1;
		x2 = 2 * Math.random() - 1;
		rad = x1 * x1 + x2 * x2;
	} while(rad >= 1 || rad == 0);
	var c = Math.sqrt(-2 * Math.log(rad) / rad);
	return s*(x1 * c) + m;
}
Capsule.prototype.NORMAL = NORMAL;

var TOTAL = function(f, a) {
	var ans = 0;
	for ( var i in a) {
		ans += f.call(this, a[i]);
	}
	return ans;
}

Capsule.prototype.TOTAL = TOTAL;

var COUNT = function(f, a) {
	return TOTAL.call(this, function(x) {return (f(x)) ? 1 : 0}, a);
}

Capsule.prototype.COUNT = COUNT;

//Managers
//--------------

//schema management

var Schema = function() {
	var store = new Object();
	this.defineSchema = function(name, value) {store[name] = value;}
	this.getSchema = function(name){return store[name];}
}

var currentSchema = new Schema();

function defineSchema(name, value){
	currentSchema.defineSchema(name, value);
}

function schemaGet(base) {return (typeof base == "string") ? currentSchema.getSchema(base) : base;}

//NovaManager

var NovaManager = function(updater, resetter, clock, timefield, hi, dt, speed,
		delay, postdater) {
	return (function() {
		var obj = {
				runStatus : {
					running : false,
					stopped : false,
					reset : false,
					terminated : false
				},
				timeField : timefield,
				delay : delay,
				clocklo : clock.lo,
				clockhi : +hi.value,
				clockdt : (typeof dt == 'number') ? dt : ("valueAsNumber" in dt) ? dt.valueAsNumber : +dt.value,
						clockmethod : clock.method,
						fixSpeed : function(val) {
							clock.speed = val;
							clock.newspeed = true;
						},
						fixClock : function(param, val) {
							obj["clock" + param] = val;
						},
						step : function() {
							if (obj.runStatus.running || clock.current >= clock.hi)
								return;
							obj.runStatus.reset = false;
							clock.flag = false;
							clock.run(null, clock.current+clock.dt);
							obj.runStatus.stopped = true;
						},
						iterate : function(next) {
							obj.timeField.value = clock.current
							updater();
						},
						terminate : function() {
							obj.runStatus.running = false;
							obj.runStatus.stopped = true;
							if (obj.runStatus.terminated) {
								clock.stop();
							} else {
								obj.runStatus.terminated = true;
								clock.terminate();
							}
						},
						stop : function() {
							obj.runStatus.running = false;
							obj.runStatus.stopped = true;
							clock.stop();
						},
						restart : function() {
							if (obj.runStatus.terminated)
								return;
							if (obj.runStatus.running)
								return;
							if (obj.runStatus.stopped) {
								clock.flag = false;
								clock.run(null);
							} else
								obj.run();
						},
						reset : function(msg) {
							clock.halt();
							obj.runStatus.terminated = false;
							obj.runStatus.running = false;
							obj.runStatus.reset = true;
							clock.lo = obj.clocklo;
							clock.hi = hi.valueAsNumber;
							clock.dt = (typeof dt == 'number') ? dt : ("valueAsNumber" in dt) ? dt.valueAsNumber : +dt.value;
							clock.method = obj.clockmethod;
							if (msg == "fast") {
								clock.isRunAll = true;
								clock.resetIterate();
							} else
								clock.iterate = obj.iterate;
							obj.timeField.value = clock.lo
							resetter(msg);
						},
						run : function() {
							if (!obj.runStatus.reset)
								obj.reset();
							obj.runStatus = {
									running : true,
									stopped : false,
									reset : false,
									terminated : false
							}
							clock.run(null);
						},
						showSliderValue : function(textbox, value) {
							var x = document.getElementById(textbox);
							x.value = value;
						},
						needReset : function() {
							obj.runStatus.reset = false;
						},
						noReset : function() {
							obj.runStatus.reset = true;
						}
		};
		obj.timeField.value = clock.lo;
		clock.iterate = obj.iterate;
		if (postdater)
			clock.cleanup = postdater;
		return {
			step : obj.step,
			stop : obj.stop,
			terminate : obj.terminate,
			restart : obj.restart,
			reset : obj.reset,
			run : obj.run,
			fixSpeed : obj.fixSpeed,
			showSliderValue : obj.showSliderValue,
			needReset : obj.needReset,
			fixClock : obj.fixClock,
			clock : clock
		};
	})();
}

//Library
//--------------


/**
 *
 * Javascript sprintf http://www.webtoolkit.info/
 *
 *
 */

sprintfWrapper = {

		init : function() {

			if (typeof arguments == "undefined") {
				return null;
			}
			if (arguments.length < 1) {
				return null;
			}
			if (typeof arguments[0] != "string") {
				return null;
			}
			if (typeof RegExp == "undefined") {
				return null;
			}

			var string = arguments[0];
			var exp = new RegExp(
			/(%([%]|(\-)?(\+|\x20)?(0)?(\d+)?(\.(\d)?)?([bcdfosxX])))/g);
			var matches = new Array();
			var strings = new Array();
			var convCount = 0;
			var stringPosStart = 0;
			var stringPosEnd = 0;
			var matchPosEnd = 0;
			var newString = '';
			var match = null;

			while (match = exp.exec(string)) {
				if (match[9]) {
					convCount += 1;
				}

				stringPosStart = matchPosEnd;
				stringPosEnd = exp.lastIndex - match[0].length;
				strings[strings.length] = string.substring(stringPosStart,
						stringPosEnd);

				matchPosEnd = exp.lastIndex;
				matches[matches.length] = {
						match : match[0],
						left : match[3] ? true : false,
								sign : match[4] || '',
								pad : match[5] || ' ',
								min : match[6] || 0,
								precision : match[8],
								code : match[9] || '%',
								negative : parseInt(arguments[convCount]) < 0 ? true : false,
										argument : String(arguments[convCount])
				};
			}
			strings[strings.length] = string.substring(matchPosEnd);

			if (matches.length == 0) {
				return string;
			}
			if ((arguments.length - 1) < convCount) {
				return null;
			}

			var code = null;
			var match = null;
			var i = null;

			for (i = 0; i < matches.length; i++) {

				if (matches[i].code == '%') {
					substitution = '%'
				} else if (matches[i].code == 'b') {
					matches[i].argument = String(Math.abs(
							parseInt(matches[i].argument)).toString(2));
					substitution = sprintfWrapper.convert(matches[i], true);
				} else if (matches[i].code == 'c') {
					matches[i].argument = String(String.fromCharCode(parseInt(Math
							.abs(parseInt(matches[i].argument)))));
					substitution = sprintfWrapper.convert(matches[i], true);
				} else if (matches[i].code == 'd') {
					matches[i].argument = String(Math
							.abs(parseInt(matches[i].argument)));
					substitution = sprintfWrapper.convert(matches[i]);
				} else if (matches[i].code == 'f') {
					matches[i].argument = String(Math.abs(
							parseFloat(matches[i].argument)).toFixed(
									matches[i].precision ? matches[i].precision : 6));
					substitution = sprintfWrapper.convert(matches[i]);
				} else if (matches[i].code == 'o') {
					matches[i].argument = String(Math.abs(
							parseInt(matches[i].argument)).toString(8));
					substitution = sprintfWrapper.convert(matches[i]);
				} else if (matches[i].code == 's') {
					matches[i].argument = matches[i].argument.substring(0,
							matches[i].precision ? matches[i].precision
									: matches[i].argument.length)
									substitution = sprintfWrapper.convert(matches[i], true);
				} else if (matches[i].code == 'x') {
					matches[i].argument = String(Math.abs(
							parseInt(matches[i].argument)).toString(16));
					substitution = sprintfWrapper.convert(matches[i]);
				} else if (matches[i].code == 'X') {
					matches[i].argument = String(Math.abs(
							parseInt(matches[i].argument)).toString(16));
					substitution = sprintfWrapper.convert(matches[i]).toUpperCase();
				} else {
					substitution = matches[i].match;
				}

				newString += strings[i];
				newString += substitution;

			}
			newString += strings[i];

			return newString;

		},

		convert : function(match, nosign) {
			if (nosign) {
				match.sign = '';
			} else {
				match.sign = match.negative ? '-' : match.sign;
			}
			var l = match.min - match.argument.length + 1 - match.sign.length;
			var pad = new Array(l < 0 ? 0 : l).join(match.pad);
			if (!match.left) {
				if (match.pad == "0" || nosign) {
					return match.sign + pad + match.argument;
				} else {
					return pad + match.sign + match.argument;
				}
			} else {
				if (match.pad == "0" || nosign) {
					return match.sign + match.argument + pad.replace(/0/g, ' ');
				} else {
					return match.sign + match.argument + pad;
				}
			}
		}
}

sprintf = sprintfWrapper.init;
