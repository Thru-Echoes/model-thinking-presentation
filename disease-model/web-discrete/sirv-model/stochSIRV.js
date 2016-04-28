/**
 * @fileOverview Stochastic SIRV Model (JS script) in Nova for TeenTech SF 2016.
 * @author <a href="mailto:omuellerklein@berkeley.edu">Oliver Muellerklein</a>
 * @version 0.5
 */

/* Trial values */
/*var PLOT_RETURN = [];
var PLOT_COUNT = 0;
PLOT_RETURN.push("Infecteds");
PLOT_COUNT = 1;
if (INCLUDE_SUS) {
    PLOT_RETURN.push("Susceptibles");
    PLOT_COUNT++;
}

if (INCLUDE_INF) {
    PLOT_RETURN.push("Infecteds");
    PLOT_COUNT++;
}*/

var isType = function(obj) {
    return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
};

Novaol.recordJS({
    specifies: "Capsule",
    components: {
        Susceptibles: {
            specifies: 'Sequence',
            initial: 999,
            nonNegative: false,
            /*next: 'this.Susceptibles - this.Infecteds - Math.min(this.VaccRate, (this.Susceptibles - this.Infecteds))'*/
            next: function() {

                try {

                    var tmpReturn;
                    var tmpLHS = this.Susceptibles - this.Infecteds;
                    var tmpRHS = Math.min(this.VaccRate, tmpLHS);
                    tmpReturn = tmpLHS - tmpRHS;

                    /* var tmpTotal;
                    tmpTotal = this.Susceptibles - this.Infecteds - Math.min(this.VaccRate,
                        this.Susceptibles - this.Infecteds); */

                    return tmpReturn;

                } catch (err) {
                    console.log("Error within Susceptibles stock: " + err);
                    debugger;
                }
            }
        },
        Infecteds: {
            specifies: 'Sequence',
            initial: 1,
            nonNegative: false,
            /*next: 'this.Infecteds + BINOMIAL(this.Susceptibles, this.cTerm) - BINOMIAL(this.Infecteds, this.rTerm) - this.IsolRate'*/
            next: function() {

                try {

                    var tmpTotal;
                    tmpTotal = this.Infecteds + BINOMIAL(this.Susceptibles, this.cTerm) - this.IsolRate - BINOMIAL((this.Infecteds - this.IsolRate), this.rTerm);

                    /* var tmpReturn;
                    var tmpLHS = this.Infecteds + BINOMIAL(this.Susceptibles, this.cTerm);
                    var tmpRHS = BINOMIAL(this.Infecteds, this.rTerm) - this.IsolRate;
                    tmpReturn = tmpLHS - tmpRHS; */

                    return tmpTotal;

                } catch (err) {
                    console.log("Error within Infecteds stock: " + err);
                    debugger;
                }
            }
        },
        IsolRate: {
            specifies: "Term",
            /*exp: "BINOMIAL(this.Infecteds, this.ProbIsolation)"*/
            exp: function() {
                var tmpReturn;
                var tmpLHS = this.Infecteds;
                var tmpRHS = this.ProbIsolation;
                tmpReturn = BINOMIAL(tmpLHS, tmpRHS);
                return tmpReturn;
            }
        },
        rTerm: {
            specifies: "Term",
            /*exp: "this.rSlider"*/
            exp: function() {
                return this.rSlider;
            },
        },
        bTerm: {
            specifies: "Term",
            /*exp: "this.bSlider"*/
            exp: function() {
                return this.bSlider;
            },
        },
        VaccRate: {
            specifies: "Term",
            /*exp: "this.NumberVacc"*/
            exp: function() {
                return this.NumberVacc;
            },
        },
        cTerm: {
            specifies: "Term",
            /*exp: "1 - Math.exp(-this.bTerm * this.Infecteds / (this.Susceptibles + this.Infecteds))"*/
            exp: function() {
                var tmpLHS;
                var tmpRHS;
                var tmpReturn;
                var nanTest;

                if (this.Susceptibles === 0) {

                    tmpReturn = 0;

                /*nanTest = ((this.Susceptibles + this.Infecteds) === 0) ? true : false;
                if (nanTest) {
                    tmpReturn = 1 - Math.exp(-this.bTerm);*/
                } else {
                    tmpLHS = -this.bTerm * this.Infecteds;
                    tmpRHS = this.Susceptibles + this.Infecteds;
                    tmpReturn = 1 - Math.exp(tmpLHS / tmpRHS);

                    /* var tmpTotal;
                    tmpTotal = 1 - Math.exp(-this.bTerm * this.Infecteds / (this.Susceptibles +
                        this.Infecteds)); */
                }

                return tmpReturn;
            },
        },
        ProbIsolation: {
            specifies: "Slider",
        },
        rSlider: {
            specifies: "Slider",
        },
        bSlider: {
            specifies: "Slider",
        },
        NumberVacc: {
            specifies: "Slider",
        },
        sirvPlot: {
            specifies: "Plugin",
            base: PL_Linechart,
            properties: function() {
                return novaol.getAll("params.sirvPlot");

            },
            pins: {
                inpt: function() {
                    /*var plotReturn = [];
                    for (var i = 0; i < PLOT_COUNT; i++) {
                        plotReturn.push(this[PLOT_RETURN[i]]);
                    }
                    return plotReturn;*/
                    return [this.Infecteds];
                }
            }
        },
        sirvTable: {
            specifies: "Plugin",
            base: PL_Table,
            properties: function() {
                return novaol.getAll("params.sirvTable");
            },
            pins: {
                inpt: function() {
                    /*return [this.Susceptibles, this.Infecteds];*/
                    var tmpReturn = [this.Susceptibles, this.Infecteds];
                    return tmpReturn;
                }
            }
        }
    },
});
