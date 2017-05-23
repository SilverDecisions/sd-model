import {Utils} from 'sd-utils'
import {log} from "sd-utils";
import * as domain from './domain'
import {ValidationResult} from './validation-result'

/*
 * Data model manager
 * */
export class DataModel {

    nodes = [];
    edges = [];

    texts = []; //floating texts
    payoffNames = [];
    defaultCriterion1Weight = 1;
    weightLowerBound = 0;
    weightUpperBound = Infinity;


    expressionScope = {}; //global expression scope
    code = "";//global expression code
    $codeError = null; //code evaluation errors
    $codeDirty = false; // is code changed without reevaluation?
    $version=1;

    validationResults = [];

    // undo / redo
    maxStackSize = 20;
    undoStack = [];
    redoStack = [];
    undoRedoStateChangedCallback = null;
    nodeAddedCallback = null;
    nodeRemovedCallback = null;

    textAddedCallback = null;
    textRemovedCallback = null;

    callbacksDisabled = false;

    constructor(data) {
        if(data){
            this.load(data);
        }
    }

    getJsonReplacer(filterLocation=false, filterComputed=false, replacer, filterPrivate =true){
        return function (k, v) {

            if ((filterPrivate && Utils.startsWith(k, '$')) || k == 'parentNode') {
                return undefined;
            }
            if (filterLocation && k == 'location') {
                return undefined;
            }
            if (filterComputed && k == 'computed') {
                return undefined;
            }

            if (replacer){
                return replacer(k, v);
            }

            return v;
        }
    }

    serialize(stringify=true, filterLocation=false, filterComputed=false, replacer, filterPrivate =true){
        var data =  {
            code: this.code,
            expressionScope: this.expressionScope,
            trees: this.getRoots(),
            texts: this.texts,
            payoffNames: this.payoffNames,
            defaultCriterion1Weight: this.defaultCriterion1Weight,
            weightLowerBound: this.weightLowerBound,
            weightUpperBound: this.weightUpperBound
        };

        if(!stringify){
            return data;
        }

        return Utils.stringify(data, this.getJsonReplacer(filterLocation, filterComputed, replacer, filterPrivate), []);
    }


    /*Loads serialized data*/
    load(data) {
        //roots, texts, code, expressionScope
        var callbacksDisabled = this.callbacksDisabled;
        this.callbacksDisabled = true;

        this.clear();


        data.trees.forEach(nodeData=> {
            var node = this.createNodeFromData(nodeData);
        });

        if (data.texts) {
            data.texts.forEach(textData=> {
                var location = new domain.Point(textData.location.x, textData.location.y);
                var text = new domain.Text(location, textData.value);
                this.texts.push(text);
            })
        }

        this.clearExpressionScope();
        this.code = data.code || '';

        if (data.expressionScope) {
            Utils.extend(this.expressionScope, data.expressionScope);
        }

        if(data.payoffNames !== undefined){
            this.payoffNames = data.payoffNames;
        }

        if(data.defaultCriterion1Weight !== undefined){
            this.defaultCriterion1Weight = data.defaultCriterion1Weight;
        }

        if(data.weightLowerBound !== undefined){
            this.weightLowerBound = data.weightLowerBound;
        }

        if(data.weightUpperBound !== undefined){
            this.weightUpperBound = data.weightUpperBound;
        }


        this.callbacksDisabled = callbacksDisabled;
    }

    getDTO(filterLocation=false, filterComputed=false, filterPrivate =false){
        var dto = {
            serializedData: this.serialize(true, filterLocation, filterComputed, null, filterPrivate),
            $codeError: this.$codeError,
            $codeDirty: this.$codeDirty,
            validationResults: this.validationResults.slice()

        };
        return dto
    }

    loadFromDTO(dto, dataReviver){
        this.load(JSON.parse(dto.serializedData, dataReviver));
        this.$codeError = dto.$codeError;
        this.$codeDirty = dto.$codeDirty;
        this.validationResults.length=0;
        dto.validationResults.forEach(v=>{
            this.validationResults.push(ValidationResult.createFromDTO(v))
        })
    }

    /*This method updates only computation results/validation*/
    updateFrom(dataModel){
        if(this.$version>dataModel.$version){
            log.warn("DataModel.updateFrom: version of current model greater than update")
            return;
        }
        var byId = {}
        dataModel.nodes.forEach(n=>{
            byId[n.$id] = n;
        });
        this.nodes.forEach((n,i)=>{
            if(byId[n.$id]){
                n.loadComputedValues(byId[n.$id].computed);
            }
        });
        dataModel.edges.forEach(e=>{
            byId[e.$id] = e;
        });
        this.edges.forEach((e,i)=>{
            if(byId[e.$id]){
                e.loadComputedValues(byId[e.$id].computed);
            }
        });
        this.expressionScope = dataModel.expressionScope;
        this.$codeError = dataModel.$codeError;
        this.$codeDirty = dataModel.$codeDirty;
        this.validationResults  = dataModel.validationResults;
    }

    getGlobalVariableNames(filterFunction = true){
        var res = [];
        Utils.forOwn(this.expressionScope, (value, key)=>{
            if(filterFunction && Utils.isFunction(value)){
                return;
            }
            res.push(key);
        });
        return res;
    }

    /*create node from serialized data*/
    createNodeFromData(data, parent) {
        var node, location;

        if(data.location){
            location = new domain.Point(data.location.x, data.location.y);
        }else{
            location = new domain.Point(0,0);
        }

        if (domain.DecisionNode.$TYPE == data.type) {
            node = new domain.DecisionNode(location);
        } else if (domain.ChanceNode.$TYPE == data.type) {
            node = new domain.ChanceNode(location);
        } else if (domain.TerminalNode.$TYPE == data.type) {
            node = new domain.TerminalNode(location);
        }
        if(data.$id){
            node.$id = data.$id;
        }
        if(data.$fieldStatus){
            node.$fieldStatus = data.$fieldStatus;
        }
        node.name = data.name;

        if(data.code){
            node.code = data.code;
        }
        if (data.expressionScope) {
            node.expressionScope = data.expressionScope
        }
        if(data.computed){
            node.loadComputedValues(data.computed);
        }

        var edgeOrNode = this.addNode(node, parent);
        data.childEdges.forEach(ed=> {
            var edge = this.createNodeFromData(ed.childNode, node);
            if(Utils.isArray(ed.payoff)){
                edge.payoff = ed.payoff;
            }else{
                edge.payoff = [ed.payoff, 0];
            }

            edge.probability = ed.probability;
            edge.name = ed.name;
            if(ed.computed){
                edge.loadComputedValues(ed.computed);
            }
            if(ed.$id){
                edge.$id = ed.$id;
            }
            if(ed.$fieldStatus){
                edge.$fieldStatus = ed.$fieldStatus;
            }
        });

        return edgeOrNode;
    }

    /*returns node or edge from parent to this node*/
    addNode(node, parent) {
        var self = this;
        self.nodes.push(node);
        if (parent) {
            var edge = self._addChild(parent, node);
            this._fireNodeAddedCallback(node);
            return edge;
        }

        this._fireNodeAddedCallback(node);
        return node;
    }

    /*injects given node into given edge*/
    injectNode(node, edge) {
        var parent = edge.parentNode;
        var child = edge.childNode;
        this.nodes.push(node);
        node.$parent = parent;
        edge.childNode = node;
        this._addChild(node, child);
        this._fireNodeAddedCallback(node);
    }

    _addChild(parent, child) {
        var self = this;
        var edge = new domain.Edge(parent, child);
        self._setEdgeInitialProbability(edge);
        self.edges.push(edge);

        parent.childEdges.push(edge);
        child.$parent = parent;
        return edge;
    }

    _setEdgeInitialProbability(edge) {
        if (edge.parentNode instanceof domain.ChanceNode) {
            edge.probability = '#';
        } else {
            edge.probability = undefined;
        }

    }

    /*removes given node and its subtree*/
    removeNode(node, $l = 0) {

        var self = this;
        node.childEdges.forEach(e=>self.removeNode(e.childNode, $l + 1));

        self._removeNode(node);
        var parent = node.$parent;
        if (parent) {
            var parentEdge = Utils.find(parent.childEdges, (e, i)=> e.childNode === node);
            if ($l == 0) {
                self.removeEdge(parentEdge);
            } else {
                self._removeEdge(parentEdge);
            }
        }
        this._fireNodeRemovedCallback(node);
    }

    /*removes given nodes and their subtrees*/
    removeNodes(nodes) {

        var roots = this.findSubtreeRoots(nodes);
        roots.forEach(n=>this.removeNode(n, 0), this);
    }

    convertNode(node, typeToConvertTo){
        var newNode;
        if(!node.childEdges.length && node.$parent){
            newNode = this.createNodeByType(typeToConvertTo, node.location);
        }else{
            if(node instanceof domain.DecisionNode && typeToConvertTo==domain.ChanceNode.$TYPE){
                newNode = this.createNodeByType(typeToConvertTo, node.location);
            }else if(typeToConvertTo==domain.DecisionNode.$TYPE){
                newNode = this.createNodeByType(typeToConvertTo, node.location);
            }
        }

        if(newNode){
            newNode.name=node.name;
            this.replaceNode(newNode, node);
            newNode.childEdges.forEach(e=>this._setEdgeInitialProbability(e));
            this._fireNodeAddedCallback(newNode);
        }

    }

    createNodeByType(type, location){
        if(type==domain.DecisionNode.$TYPE){
            return new domain.DecisionNode(location)
        }else if(type==domain.ChanceNode.$TYPE){
            return new domain.ChanceNode(location)
        }else if(type==domain.TerminalNode.$TYPE){
            return new domain.TerminalNode(location)
        }
    }

    replaceNode(newNode, oldNode){
        var parent = oldNode.$parent;
        newNode.$parent = parent;

        if(parent){
            var parentEdge = Utils.find(newNode.$parent.childEdges, e=>e.childNode===oldNode);
            parentEdge.childNode = newNode;
        }

        newNode.childEdges = oldNode.childEdges;
        newNode.childEdges.forEach(e=>e.parentNode=newNode);

        var index = this.nodes.indexOf(oldNode);
        if(~index){
            this.nodes[index]=newNode;
        }
    }

    getRoots() {
        return this.nodes.filter(n=>!n.$parent);
    }

    findSubtreeRoots(nodes) {
        return nodes.filter(n=>!n.$parent || nodes.indexOf(n.$parent) === -1);
    }

    /*creates detached clone of given node*/
    cloneSubtree(nodeToCopy, cloneComputedValues) {
        var self = this;
        var clone = this.cloneNode(nodeToCopy);

        nodeToCopy.childEdges.forEach(e=> {
            var childClone = self.cloneSubtree(e.childNode, cloneComputedValues);
            childClone.$parent = clone;
            var edge = new domain.Edge(clone, childClone, e.name, Utils.cloneDeep(e.payoff), e.probability);
            if (cloneComputedValues) {
                edge.computed = Utils.cloneDeep(e.computed);
                childClone.computed = Utils.cloneDeep(e.childNode.computed)
            }
            clone.childEdges.push(edge);
        });
        if (cloneComputedValues) {
            clone.computed = Utils.cloneDeep(nodeToCopy.computed)
        }
        return clone;
    }

    /*attaches detached subtree to given parent*/
    attachSubtree(nodeToAttach, parent) {
        var self = this;
        var nodeOrEdge = self.addNode(nodeToAttach, parent);

        var childEdges = self.getAllDescendantEdges(nodeToAttach);
        childEdges.forEach(e=> {
            self.edges.push(e);
            self.nodes.push(e.childNode);
        });

        return nodeOrEdge;
    }

    cloneNodes(nodes) {
        var roots = []
        //TODO
    }

    /*shallow clone without parent and children*/
    cloneNode(node) {
        var clone = Utils.clone(node)
        clone.$id = Utils.guid();
        clone.location = Utils.clone(node.location);
        clone.computed = Utils.clone(node.computed);
        clone.$parent = null;
        clone.childEdges = [];
        return clone;
    }

    findNodeById(id) {
        return Utils.find(this.nodes, n=>n.$id == id);
    }

    findEdgeById(id) {
        return Utils.find(this.edges, e=>e.$id == id);
    }

    findById(id) {
        var node = this.findNodeById(id);
        if (node) {
            return node;
        }
        return this.findEdgeById(id);
    }

    _removeNode(node) {// simply removes node from node list
        var index = this.nodes.indexOf(node);
        if (index > -1) {
            this.nodes.splice(index, 1);
        }
    }

    removeEdge(edge) {
        var index = edge.parentNode.childEdges.indexOf(edge);
        if (index > -1) {
            edge.parentNode.childEdges.splice(index, 1);
        }
        this._removeEdge(edge);
    }

    _removeEdge(edge) { //removes edge from edge list without removing connected nodes
        var index = this.edges.indexOf(edge);
        if (index > -1) {
            this.edges.splice(index, 1);
        }
    }

    _removeNodes(nodesToRemove) {
        this.nodes = this.nodes.filter(n=>nodesToRemove.indexOf(n) === -1);
    }

    _removeEdges(edgesToRemove) {
        this.edges = this.edges.filter(e=>edgesToRemove.indexOf(e) === -1);
    }

    getAllDescendantEdges(node) {
        var self = this;
        var result = [];

        node.childEdges.forEach(e=> {
            result.push(e);
            if (e.childNode) {
                result.push(...self.getAllDescendantEdges(e.childNode));
            }
        });

        return result;
    }

    getAllDescendantNodes(node) {
        var self = this;
        var result = [];

        node.childEdges.forEach(e=> {
            if (e.childNode) {
                result.push(e.childNode);
                result.push(...self.getAllDescendantNodes(e.childNode));
            }
        });

        return result;
    }

    getAllNodesInSubtree(node) {
        var descendants = this.getAllDescendantNodes(node);
        descendants.unshift(node);
        return descendants;
    }

    isUndoAvailable() {
        return !!this.undoStack.length
    }

    isRedoAvailable() {
        return !!this.redoStack.length
    }

    createStateSnapshot(revertConf){
        return {
            revertConf: revertConf,
            nodes: Utils.cloneDeep(this.nodes),
            edges: Utils.cloneDeep(this.edges),
            texts: Utils.cloneDeep(this.texts),
            payoffNames: Utils.cloneDeep(this.payoffNames),
            defaultCriterion1Weight: Utils.cloneDeep(this.defaultCriterion1Weight),
            weightLowerBound: Utils.cloneDeep(this.weightLowerBound),
            weightUpperBound: Utils.cloneDeep(this.weightUpperBound),
            expressionScope: Utils.cloneDeep(this.expressionScope),
            code: this.code,
            $codeError: this.$codeError
        }
    }


    saveStateFromSnapshot(state){
        this.redoStack.length = 0;

        this._pushToStack(this.undoStack, state);

        this._fireUndoRedoCallback();

        return this;
    }

    saveState(revertConf) {
        this.saveStateFromSnapshot(this.createStateSnapshot(revertConf));
        return this;
    }

    undo() {
        var self = this;
        var newState = this.undoStack.pop();
        if (!newState) {
            return;
        }

        this._pushToStack(this.redoStack, {
            revertConf: newState.revertConf,
            nodes: self.nodes,
            edges: self.edges,
            texts: self.texts,
            payoffNames: self.payoffNames,
            defaultCriterion1Weight: self.defaultCriterion1Weight,
            weightLowerBound: self.weightLowerBound,
            weightUpperBound: self.weightUpperBound,
            expressionScope: self.expressionScope,
            code: self.code,
            $codeError: self.$codeError

        });

        this._setNewState(newState);

        this._fireUndoRedoCallback();

        return this;
    }

    redo() {
        var self = this;
        var newState = this.redoStack.pop();
        if (!newState) {
            return;
        }

        this._pushToStack(this.undoStack, {
            revertConf: newState.revertConf,
            nodes: self.nodes,
            edges: self.edges,
            texts: self.texts,
            payoffNames: self.payoffNames,
            defaultCriterion1Weight: self.defaultCriterion1Weight,
            weightLowerBound: self.weightLowerBound,
            weightUpperBound: self.weightUpperBound,
            expressionScope: self.expressionScope,
            code: self.code,
            $codeError: self.$codeError
        });

        this._setNewState(newState, true);

        this._fireUndoRedoCallback();

        return this;
    }

    clear() {
        this.nodes.length = 0;
        this.edges.length = 0;
        this.undoStack.length = 0;
        this.redoStack.length = 0;
        this.texts.length = 0;
        this.clearExpressionScope();
        this.code = '';
        this.$codeError = null;
        this.$codeDirty = false;

        this.payoffNames = [];
        this.defaultCriterion1Weight = 1;
        this.weightLowerBound = 0;
        this.weightUpperBound = Infinity;
    }

    addText(text) {
        this.texts.push(text);

        this._fireTextAddedCallback(text);
    }

    removeTexts(texts) {
        texts.forEach(t=>this.removeText(t));
    }

    removeText(text) {
        var index = this.texts.indexOf(text);
        if (index > -1) {
            this.texts.splice(index, 1);
            this._fireTextRemovedCallback(text);
        }
    }

    clearExpressionScope() {
        Utils.forOwn(this.expressionScope, (value, key)=> {
            delete this.expressionScope[key];
        });
    }

    reversePayoffs(){
        this.payoffNames.reverse();
        this.edges.forEach(e=>e.payoff.reverse())
    }

    _setNewState(newState, redo) {
        var nodeById = Utils.getObjectByIdMap(newState.nodes);
        var edgeById = Utils.getObjectByIdMap(newState.edges);
        this.nodes = newState.nodes;
        this.edges = newState.edges;
        this.texts = newState.texts;
        this.payoffNames = newState.payoffNames;
        this.defaultCriterion1Weight = newState.defaultCriterion1Weight;
        this.weightLowerBound = newState.weightLowerBound;
        this.weightUpperBound = newState.weightUpperBound;
        this.expressionScope = newState.expressionScope;
        this.code = newState.code;
        this.$codeError  = newState.$codeError

        this.nodes.forEach(n=> {
            for (var i = 0; i < n.childEdges.length; i++) {
                var edge = edgeById[n.childEdges[i].$id];
                n.childEdges[i] = edge;
                edge.parentNode = n;
                edge.childNode = nodeById[edge.childNode.$id];
            }

        });

        if (newState.revertConf) {
            if (!redo && newState.revertConf.onUndo) {
                newState.revertConf.onUndo(newState.revertConf.data);
            }
            if (redo && newState.revertConf.onRedo) {
                newState.revertConf.onRedo(newState.revertConf.data);
            }


        }
        this.revertConf = newState.revertConf;
    }


    _pushToStack(stack, obj) {
        if (stack.length >= this.maxStackSize) {
            stack.shift();
        }
        stack.push(obj);
    }

    _fireUndoRedoCallback() {
        if (!this.callbacksDisabled && this.undoRedoStateChangedCallback) {
            this.undoRedoStateChangedCallback();
        }
    }

    _fireNodeAddedCallback(node) {
        if (!this.callbacksDisabled && this.nodeAddedCallback) {
            this.nodeAddedCallback(node);
        }
    }

    _fireNodeRemovedCallback(node) {
        if (!this.callbacksDisabled && this.nodeRemovedCallback) {
            this.nodeRemovedCallback(node);
        }
    }

    _fireTextAddedCallback(text) {
        if (!this.callbacksDisabled && this.textAddedCallback) {
            this.textAddedCallback(text);
        }
    }

    _fireTextRemovedCallback(text) {
        if (!this.callbacksDisabled && this.textRemovedCallback) {
            this.textRemovedCallback(text);
        }
    }
}
