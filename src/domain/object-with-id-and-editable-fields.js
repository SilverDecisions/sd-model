import {Utils} from 'sd-utils'

export class ObjectWithIdAndEditableFields {

    id = Utils.guid(); //internal id
    $fieldStatus={};

    $ObjectWithIdAndEditableFields = true;

    getFieldStatus(fieldPath){
        if(!Utils.get(this.$fieldStatus, fieldPath, null)){
            Utils.set(this.$fieldStatus, fieldPath, {
                valid: {
                    syntax: true,
                    value: true
                }
            });
        }
        return Utils.get(this.$fieldStatus, fieldPath);
    }

    setSyntaxValidity(fieldPath, valid){
        var fieldStatus = this.getFieldStatus(fieldPath);
        fieldStatus.valid.syntax = valid;
    }

    setValueValidity(fieldPath, valid){
        var fieldStatus = this.getFieldStatus(fieldPath);
        fieldStatus.valid.value = valid;
    }

    isFieldValid(fieldPath, syntax=true, value=true){
        var fieldStatus = this.getFieldStatus(fieldPath);
        if(syntax && value) {
            return fieldStatus.valid.syntax && fieldStatus.valid.value;
        }
        if(syntax) {
            return fieldStatus.valid.syntax
        }
        return fieldStatus.valid.value;
    }


}
