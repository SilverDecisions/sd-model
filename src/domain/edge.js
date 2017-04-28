import {ObjectWithComputedValues} from "./object-with-computed-values";

export class Edge extends ObjectWithComputedValues {
    parentNode;
    childNode;

    name = '';
    probability = undefined;
    payoff = [0, 0];

    $DISPLAY_VALUE_NAMES = ['probability', 'payoff', 'optimal'];

    constructor(parentNode, childNode, name, payoff, probability,) {
        super();
        this.parentNode = parentNode;
        this.childNode = childNode;

        if (name !== undefined) {
            this.name = name;
        }
        if (probability !== undefined) {
            this.probability = probability;
        }
        if (payoff !== undefined) {
            this.payoff = payoff
        }

    }

    setName(name) {
        this.name = name;
        return this;
    }

    setProbability(probability) {
        this.probability = probability;
        return this;
    }

    setPayoff(payoff, index = 0) {
        this.payoff[index] = payoff;
        return this;
    }

    computedBaseProbability(val) {
        return this.computedValue(null, 'probability', val);
    }

    computedBasePayoff(val, index = 0) {
        return this.computedValue(null, 'payoff[' + index + ']', val);
    }

    displayProbability(val) {
        return this.displayValue('probability', val);
    }

    displayPayoff(val, index = 0) {
        return this.displayValue('payoff[' + index + ']', val);
    }
}
