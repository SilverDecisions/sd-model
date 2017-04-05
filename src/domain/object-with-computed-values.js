import {Utils} from 'sd-utils'

import {ObjectWithIdAndEditableFields} from "./object-with-id-and-editable-fields";

export class ObjectWithComputedValues extends ObjectWithIdAndEditableFields{

    computed={}; //computed values

    /*get or set computed value*/
    computedValue(ruleName, fieldName, value){
        var path = 'computed.';
        if(ruleName){
            path+=ruleName+'.';
        }
        path+=fieldName;
        if(value===undefined){
            return  Utils.get(this, path, null);
        }
        Utils.set(this, path, value);
        return value;
    }

    clearComputedValues(ruleName){
        if(ruleName==undefined){
            this.computed={};
            return;
        }
        if(Utils.isArray(ruleName)){
            ruleName.forEach(n=>{
                this.computed[n]={};
            });
            return;
        }
        this.computed[ruleName]={};
    }

    clearDisplayValues(){
        this.computed['$displayValues']={};
    }

    displayValue(fieldName, value){
        return this.computedValue(null, '$displayValues.'+fieldName, value);
    }

    loadComputedValues(computed){
        this.computed = computed;
    }
}
