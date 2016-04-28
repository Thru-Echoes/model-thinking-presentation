// insecticide model

/***************************************************************************************************
                                        MODEL DESCRIPTION
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
This model shows the effect of an insecticide on some population of Predator and prey. It shows:
1. How the insecticide effects the Prey growth/birth rate which inturn effects the efficiency of predation.
2. How the insecticide effects the Predator growth/birth rate which is additionally affected by the amount of
prey available, which is also being affected by the insecticide.
/**************************************************************************************************/

// Background Color Code  --- Incase needed

function insect(n, ta, G) {
    'use strict';
    /***********************************************************************************************
                                            INSECTICIDE
    - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    INPUT:  v() = insecticide
            n = current time
            ta = time at which insecticide was introduced
            g =
    RETURN: maps when the insecticide was introduced and its decay rate.
    ***********************************************************************************************/
    try {
        var insectRetrn;
        if (n < ta) {
            insectRetrn = 0;
        } else {
            insectRetrn = Math.exp(G * (ta - n));
        }
        return insectRetrn;
    } catch (err) {
        console.log("Error in function insect():" + err);
        debugger;
    }
}

Novaol.recordJS({
    specifies: "Capsule",
    components: {
        Prey: {
            specifies: 'Variable',
            initial: 'this.initPrey',
            nonNegative: false,
            prime: function() { // Lotka Volterra Prey stock
                'use strict';
                try {
                    var preyRetrn;
                    var tmpPseudo = (this.pseudoprey === 0) ? 0.00001 : this.pseudoprey;
                    if (this.Prey <= tmpPseudo) {
                        preyRetrn = 0;
                    } else {
                        preyRetrn = this.R1 * this.Prey * (1 - this.Prey / this.K) -
                            this.D1 * (this.Prey / (this.C + this.Prey)) * this.Predator -
                            this.A1 * this.Prey * insect(TIME(), this.ta, this.G);
                    }
                    return preyRetrn;
                } catch (err) {
                    console.log("Error within prey stock: " + err);
                    debugger;
                }
            }
        },

        Predator: {
            specifies: 'Variable',
            initial: 'this.initPred',
            nonNegative: false,
            prime: function() { // Lotka Volterra predator stock
                'use strict';
                try {
                    var PredRetrn;
                    var tmpPseudo = (this.pseudopredator === 0) ? 0.00001 : this.pseudopredator;
                    if (this.Predator <= tmpPseudo) {
                        PredRetrn = 0;
                    } else {
                        PredRetrn = this.R2 * this.Predator * this.D1 * (this.Prey / (
                                this.C + this.Prey)) - this.D2 * this.Predator - this.A2 *
                            this.A1 * insect(TIME(), this.ta, this.G) * this.Predator;
                    }
                    return PredRetrn;
                } catch (err) {
                    console.log("Error within predator stock: " + err);
                    debugger;
                }
            }
        },
        initPred: { // value sliders
            specifies: "Slider",
        },
        initPrey: {
            specifies: "Slider",
        },
        G: {
            specifies: "Slider",
        },
        ta: {
            specifies: "Slider",
        },
        K: {
            specifies: "Slider",
        },
        C: {
            specifies: "Slider",
        },
        A1: {
            specifies: "Slider",
        },
        R1: {
            specifies: "Slider",
        },
        A2: {
            specifies: "Slider",
        },
        D1: {
            specifies: "Slider",
        },
        R2: {
            specifies: "Slider",
        },
        D2: {
            specifies: "Slider",
        },
        pseudoprey: {
            specifies: "Slider",
        },
        pseudopredator: {
            specifies: "Slider",
        },
        PredPrey: {
            specifies: "Plugin",
            base: PL_Linechart,
            properties: function() {
                return novaol.getAll("params.PredPrey");
            },
            pins: {
                inpt: function() {
                    return [this.Predator, this.Prey];
                }
            }
        },
        PredPrey_Table: {
            specifies: "Plugin",
            base: PL_Table,
            properties: function() {
                return novaol.getAll("params.PredPrey_Table");
            },
            pins: {
                inpt: function() {
                    return [this.Predator, this.Prey];
                }
            }
        },
    },
});
