// Enhanced debugging
var xDebug = function (isDebug, theClass) {
    /**********************************************
    Extra debugging function - binds to console.log()
    - - - - - - - - - - - - - - - - - - - - - - - -
    INPUT:  isDebug = boolean
            theClass = class we are working in
                (e.g. this)

    NOTE: class needs 'var isDebug = T / F'
    RETURN: Use as debugger (ex. in try-catch)
    **********************************************/

    this.debug = {};

    if (isDebug && theClass.isDebug) {
        for (var m in console) {
            if (typeof console[m] == 'function') {
                this.debug[m] = console[m].bind(window.console, theClass.toString() + ": ");
            }
        }
    } else {
        for (var n in console) {
            if (typeof console[n] == 'function') {
                this.debug[n] = function () {};
            }
        }
    }
    return this.debug;
};

var isDebug = true; // global debug state

var debug = xDebug(isDebug, this);

debug.log("Hello log");
debug.trace("Hello trace");
