require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DataModel = undefined;

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _sdUtils = require('sd-utils');

var _domain = require('./domain');

var domain = _interopRequireWildcard(_domain);

var _validationResult = require('./validation-result');

function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
        return obj;
    } else {
        var newObj = {};if (obj != null) {
            for (var key in obj) {
                if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
            }
        }newObj.default = obj;return newObj;
    }
}

function _toConsumableArray(arr) {
    if (Array.isArray(arr)) {
        for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
            arr2[i] = arr[i];
        }return arr2;
    } else {
        return Array.from(arr);
    }
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

/*
 * Data model manager
 * */
var DataModel = exports.DataModel = function () {
    //code evaluation errors
    //global expression scope
    function DataModel(data) {
        _classCallCheck(this, DataModel);

        this.nodes = [];
        this.edges = [];
        this.texts = [];
        this.payoffNames = [];
        this.defaultWTP = 1;
        this.minimumWTP = 0;
        this.maximumWTP = Infinity;
        this.expressionScope = {};
        this.code = "";
        this.$codeError = null;
        this.$codeDirty = false;
        this.$version = 1;
        this.validationResults = [];
        this.maxStackSize = 20;
        this.undoStack = [];
        this.redoStack = [];
        this.undoRedoStateChangedCallback = null;
        this.nodeAddedCallback = null;
        this.nodeRemovedCallback = null;
        this.textAddedCallback = null;
        this.textRemovedCallback = null;
        this.callbacksDisabled = false;

        if (data) {
            this.load(data);
        }
    }

    // undo / redo
    // is code changed without reevaluation?
    //global expression code
    //floating texts


    _createClass(DataModel, [{
        key: 'getJsonReplacer',
        value: function getJsonReplacer() {
            var filterLocation = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
            var filterComputed = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
            var replacer = arguments[2];
            var filterPrivate = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

            return function (k, v) {

                if (filterPrivate && _sdUtils.Utils.startsWith(k, '$') || k == 'parentNode') {
                    return undefined;
                }
                if (filterLocation && k == 'location') {
                    return undefined;
                }
                if (filterComputed && k == 'computed') {
                    return undefined;
                }

                if (replacer) {
                    return replacer(k, v);
                }

                return v;
            };
        }
    }, {
        key: 'serialize',
        value: function serialize() {
            var stringify = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;
            var filterLocation = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
            var filterComputed = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
            var replacer = arguments[3];
            var filterPrivate = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;

            var data = {
                code: this.code,
                expressionScope: this.expressionScope,
                trees: this.getRoots(),
                texts: this.texts
            };

            if (!stringify) {
                return data;
            }

            return _sdUtils.Utils.stringify(data, this.getJsonReplacer(filterLocation, filterComputed, replacer, filterPrivate), []);
        }

        /*Loads serialized data*/

    }, {
        key: 'load',
        value: function load(data) {
            var _this = this;

            //roots, texts, code, expressionScope
            var callbacksDisabled = this.callbacksDisabled;
            this.callbacksDisabled = true;

            this.clear();

            data.trees.forEach(function (nodeData) {
                var node = _this.createNodeFromData(nodeData);
            });

            if (data.texts) {
                data.texts.forEach(function (textData) {
                    var location = new domain.Point(textData.location.x, textData.location.y);
                    var text = new domain.Text(location, textData.value);
                    _this.texts.push(text);
                });
            }

            this.clearExpressionScope();
            this.code = data.code || '';

            if (data.expressionScope) {
                _sdUtils.Utils.extend(this.expressionScope, data.expressionScope);
            }
            this.callbacksDisabled = callbacksDisabled;
        }
    }, {
        key: 'getDTO',
        value: function getDTO() {
            var filterLocation = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
            var filterComputed = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
            var filterPrivate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

            var dto = {
                serializedData: this.serialize(true, filterLocation, filterComputed, null, filterPrivate),
                $codeError: this.$codeError,
                $codeDirty: this.$codeDirty,
                validationResults: this.validationResults.slice()

            };
            return dto;
        }
    }, {
        key: 'loadFromDTO',
        value: function loadFromDTO(dto, dataReviver) {
            var _this2 = this;

            this.load(JSON.parse(dto.serializedData, dataReviver));
            this.$codeError = dto.$codeError;
            this.$codeDirty = dto.$codeDirty;
            this.validationResults.length = 0;
            dto.validationResults.forEach(function (v) {
                _this2.validationResults.push(_validationResult.ValidationResult.createFromDTO(v));
            });
        }

        /*This method updates only computation results/validation*/

    }, {
        key: 'updateFrom',
        value: function updateFrom(dataModel) {
            if (this.$version > dataModel.$version) {
                _sdUtils.log.warn("DataModel.updateFrom: version of current model greater than update");
                return;
            }
            var byId = {};
            dataModel.nodes.forEach(function (n) {
                byId[n.$id] = n;
            });
            this.nodes.forEach(function (n, i) {
                if (byId[n.$id]) {
                    n.loadComputedValues(byId[n.$id].computed);
                }
            });
            dataModel.edges.forEach(function (e) {
                byId[e.$id] = e;
            });
            this.edges.forEach(function (e, i) {
                if (byId[e.$id]) {
                    e.loadComputedValues(byId[e.$id].computed);
                }
            });
            this.expressionScope = dataModel.expressionScope;
            this.$codeError = dataModel.$codeError;
            this.$codeDirty = dataModel.$codeDirty;
            this.validationResults = dataModel.validationResults;
        }
    }, {
        key: 'getGlobalVariableNames',
        value: function getGlobalVariableNames() {
            var filterFunction = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

            var res = [];
            _sdUtils.Utils.forOwn(this.expressionScope, function (value, key) {
                if (filterFunction && _sdUtils.Utils.isFunction(value)) {
                    return;
                }
                res.push(key);
            });
            return res;
        }

        /*create node from serialized data*/

    }, {
        key: 'createNodeFromData',
        value: function createNodeFromData(data, parent) {
            var _this3 = this;

            var node, location;

            if (data.location) {
                location = new domain.Point(data.location.x, data.location.y);
            } else {
                location = new domain.Point(0, 0);
            }

            if (domain.DecisionNode.$TYPE == data.type) {
                node = new domain.DecisionNode(location);
            } else if (domain.ChanceNode.$TYPE == data.type) {
                node = new domain.ChanceNode(location);
            } else if (domain.TerminalNode.$TYPE == data.type) {
                node = new domain.TerminalNode(location);
            }
            if (data.$id) {
                node.$id = data.$id;
            }
            if (data.$fieldStatus) {
                node.$fieldStatus = data.$fieldStatus;
            }
            node.name = data.name;

            if (data.code) {
                node.code = data.code;
            }
            if (data.expressionScope) {
                node.expressionScope = data.expressionScope;
            }
            if (data.computed) {
                node.loadComputedValues(data.computed);
            }

            var edgeOrNode = this.addNode(node, parent);
            data.childEdges.forEach(function (ed) {
                var edge = _this3.createNodeFromData(ed.childNode, node);
                if (_sdUtils.Utils.isArray()) {
                    edge.payoff = ed.payoff;
                } else {
                    edge.payoff = [ed.payoff, 0];
                }

                edge.probability = ed.probability;
                edge.name = ed.name;
                if (ed.computed) {
                    edge.loadComputedValues(ed.computed);
                }
                if (ed.$id) {
                    edge.$id = ed.$id;
                }
                if (ed.$fieldStatus) {
                    edge.$fieldStatus = ed.$fieldStatus;
                }
            });

            return edgeOrNode;
        }

        /*returns node or edge from parent to this node*/

    }, {
        key: 'addNode',
        value: function addNode(node, parent) {
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

    }, {
        key: 'injectNode',
        value: function injectNode(node, edge) {
            var parent = edge.parentNode;
            var child = edge.childNode;
            this.nodes.push(node);
            node.$parent = parent;
            edge.childNode = node;
            this._addChild(node, child);
            this._fireNodeAddedCallback(node);
        }
    }, {
        key: '_addChild',
        value: function _addChild(parent, child) {
            var self = this;
            var edge = new domain.Edge(parent, child);
            self._setEdgeInitialProbability(edge);
            self.edges.push(edge);

            parent.childEdges.push(edge);
            child.$parent = parent;
            return edge;
        }
    }, {
        key: '_setEdgeInitialProbability',
        value: function _setEdgeInitialProbability(edge) {
            if (edge.parentNode instanceof domain.ChanceNode) {
                edge.probability = '#';
            } else {
                edge.probability = undefined;
            }
        }

        /*removes given node and its subtree*/

    }, {
        key: 'removeNode',
        value: function removeNode(node) {
            var $l = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

            var self = this;
            node.childEdges.forEach(function (e) {
                return self.removeNode(e.childNode, $l + 1);
            });

            self._removeNode(node);
            var parent = node.$parent;
            if (parent) {
                var parentEdge = _sdUtils.Utils.find(parent.childEdges, function (e, i) {
                    return e.childNode === node;
                });
                if ($l == 0) {
                    self.removeEdge(parentEdge);
                } else {
                    self._removeEdge(parentEdge);
                }
            }
            this._fireNodeRemovedCallback(node);
        }

        /*removes given nodes and their subtrees*/

    }, {
        key: 'removeNodes',
        value: function removeNodes(nodes) {
            var _this4 = this;

            var roots = this.findSubtreeRoots(nodes);
            roots.forEach(function (n) {
                return _this4.removeNode(n, 0);
            }, this);
        }
    }, {
        key: 'convertNode',
        value: function convertNode(node, typeToConvertTo) {
            var _this5 = this;

            var newNode;
            if (!node.childEdges.length && node.$parent) {
                newNode = this.createNodeByType(typeToConvertTo, node.location);
            } else {
                if (node instanceof domain.DecisionNode && typeToConvertTo == domain.ChanceNode.$TYPE) {
                    newNode = this.createNodeByType(typeToConvertTo, node.location);
                } else if (typeToConvertTo == domain.DecisionNode.$TYPE) {
                    newNode = this.createNodeByType(typeToConvertTo, node.location);
                }
            }

            if (newNode) {
                newNode.name = node.name;
                this.replaceNode(newNode, node);
                newNode.childEdges.forEach(function (e) {
                    return _this5._setEdgeInitialProbability(e);
                });
                this._fireNodeAddedCallback(newNode);
            }
        }
    }, {
        key: 'createNodeByType',
        value: function createNodeByType(type, location) {
            if (type == domain.DecisionNode.$TYPE) {
                return new domain.DecisionNode(location);
            } else if (type == domain.ChanceNode.$TYPE) {
                return new domain.ChanceNode(location);
            } else if (type == domain.TerminalNode.$TYPE) {
                return new domain.TerminalNode(location);
            }
        }
    }, {
        key: 'replaceNode',
        value: function replaceNode(newNode, oldNode) {
            var parent = oldNode.$parent;
            newNode.$parent = parent;

            if (parent) {
                var parentEdge = _sdUtils.Utils.find(newNode.$parent.childEdges, function (e) {
                    return e.childNode === oldNode;
                });
                parentEdge.childNode = newNode;
            }

            newNode.childEdges = oldNode.childEdges;
            newNode.childEdges.forEach(function (e) {
                return e.parentNode = newNode;
            });

            var index = this.nodes.indexOf(oldNode);
            if (~index) {
                this.nodes[index] = newNode;
            }
        }
    }, {
        key: 'getRoots',
        value: function getRoots() {
            return this.nodes.filter(function (n) {
                return !n.$parent;
            });
        }
    }, {
        key: 'findSubtreeRoots',
        value: function findSubtreeRoots(nodes) {
            return nodes.filter(function (n) {
                return !n.$parent || nodes.indexOf(n.$parent) === -1;
            });
        }

        /*creates detached clone of given node*/

    }, {
        key: 'cloneSubtree',
        value: function cloneSubtree(nodeToCopy, cloneComputedValues) {
            var self = this;
            var clone = this.cloneNode(nodeToCopy);

            nodeToCopy.childEdges.forEach(function (e) {
                var childClone = self.cloneSubtree(e.childNode, cloneComputedValues);
                childClone.$parent = clone;
                var edge = new domain.Edge(clone, childClone, e.name, e.payoff, e.probability);
                if (cloneComputedValues) {
                    edge.computed = _sdUtils.Utils.cloneDeep(e.computed);
                    childClone.computed = _sdUtils.Utils.cloneDeep(e.childNode.computed);
                }
                clone.childEdges.push(edge);
            });
            if (cloneComputedValues) {
                clone.computed = _sdUtils.Utils.cloneDeep(nodeToCopy.computed);
            }
            return clone;
        }

        /*attaches detached subtree to given parent*/

    }, {
        key: 'attachSubtree',
        value: function attachSubtree(nodeToAttach, parent) {
            var self = this;
            var nodeOrEdge = self.addNode(nodeToAttach, parent);

            var childEdges = self.getAllDescendantEdges(nodeToAttach);
            childEdges.forEach(function (e) {
                self.edges.push(e);
                self.nodes.push(e.childNode);
            });

            return nodeOrEdge;
        }
    }, {
        key: 'cloneNodes',
        value: function cloneNodes(nodes) {
            var roots = [];
            //TODO
        }

        /*shallow clone without parent and children*/

    }, {
        key: 'cloneNode',
        value: function cloneNode(node) {
            var clone = _sdUtils.Utils.clone(node);
            clone.$id = _sdUtils.Utils.guid();
            clone.location = _sdUtils.Utils.clone(node.location);
            clone.computed = _sdUtils.Utils.clone(node.computed);
            clone.$parent = null;
            clone.childEdges = [];
            return clone;
        }
    }, {
        key: 'findNodeById',
        value: function findNodeById(id) {
            return _sdUtils.Utils.find(this.nodes, function (n) {
                return n.$id == id;
            });
        }
    }, {
        key: 'findEdgeById',
        value: function findEdgeById(id) {
            return _sdUtils.Utils.find(this.edges, function (e) {
                return e.$id == id;
            });
        }
    }, {
        key: 'findById',
        value: function findById(id) {
            var node = this.findNodeById(id);
            if (node) {
                return node;
            }
            return this.findEdgeById(id);
        }
    }, {
        key: '_removeNode',
        value: function _removeNode(node) {
            // simply removes node from node list
            var index = this.nodes.indexOf(node);
            if (index > -1) {
                this.nodes.splice(index, 1);
            }
        }
    }, {
        key: 'removeEdge',
        value: function removeEdge(edge) {
            var index = edge.parentNode.childEdges.indexOf(edge);
            if (index > -1) {
                edge.parentNode.childEdges.splice(index, 1);
            }
            this._removeEdge(edge);
        }
    }, {
        key: '_removeEdge',
        value: function _removeEdge(edge) {
            //removes edge from edge list without removing connected nodes
            var index = this.edges.indexOf(edge);
            if (index > -1) {
                this.edges.splice(index, 1);
            }
        }
    }, {
        key: '_removeNodes',
        value: function _removeNodes(nodesToRemove) {
            this.nodes = this.nodes.filter(function (n) {
                return nodesToRemove.indexOf(n) === -1;
            });
        }
    }, {
        key: '_removeEdges',
        value: function _removeEdges(edgesToRemove) {
            this.edges = this.edges.filter(function (e) {
                return edgesToRemove.indexOf(e) === -1;
            });
        }
    }, {
        key: 'getAllDescendantEdges',
        value: function getAllDescendantEdges(node) {
            var self = this;
            var result = [];

            node.childEdges.forEach(function (e) {
                result.push(e);
                if (e.childNode) {
                    result.push.apply(result, _toConsumableArray(self.getAllDescendantEdges(e.childNode)));
                }
            });

            return result;
        }
    }, {
        key: 'getAllDescendantNodes',
        value: function getAllDescendantNodes(node) {
            var self = this;
            var result = [];

            node.childEdges.forEach(function (e) {
                if (e.childNode) {
                    result.push(e.childNode);
                    result.push.apply(result, _toConsumableArray(self.getAllDescendantNodes(e.childNode)));
                }
            });

            return result;
        }
    }, {
        key: 'getAllNodesInSubtree',
        value: function getAllNodesInSubtree(node) {
            var descendants = this.getAllDescendantNodes(node);
            descendants.unshift(node);
            return descendants;
        }
    }, {
        key: 'isUndoAvailable',
        value: function isUndoAvailable() {
            return !!this.undoStack.length;
        }
    }, {
        key: 'isRedoAvailable',
        value: function isRedoAvailable() {
            return !!this.redoStack.length;
        }
    }, {
        key: 'createStateSnapshot',
        value: function createStateSnapshot(revertConf) {
            return {
                revertConf: revertConf,
                nodes: _sdUtils.Utils.cloneDeep(this.nodes),
                edges: _sdUtils.Utils.cloneDeep(this.edges),
                texts: _sdUtils.Utils.cloneDeep(this.texts),
                payoffNames: _sdUtils.Utils.cloneDeep(this.payoffNames),
                defaultWTP: _sdUtils.Utils.cloneDeep(this.defaultWTP),
                minimumWTP: _sdUtils.Utils.cloneDeep(this.minimumWTP),
                maximumWTP: _sdUtils.Utils.cloneDeep(this.maximumWTP),
                expressionScope: _sdUtils.Utils.cloneDeep(this.expressionScope),
                code: this.code,
                $codeError: this.$codeError
            };
        }
    }, {
        key: 'saveStateFromSnapshot',
        value: function saveStateFromSnapshot(state) {
            this.redoStack.length = 0;

            this._pushToStack(this.undoStack, state);

            this._fireUndoRedoCallback();

            return this;
        }
    }, {
        key: 'saveState',
        value: function saveState(revertConf) {
            this.saveStateFromSnapshot(this.createStateSnapshot(revertConf));
            return this;
        }
    }, {
        key: 'undo',
        value: function undo() {
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
                defaultWTP: self.defaultWTP,
                minimumWTP: self.minimumWTP,
                maximumWTP: self.maximumWTP,
                expressionScope: self.expressionScope,
                code: self.code,
                $codeError: self.$codeError

            });

            this._setNewState(newState);

            this._fireUndoRedoCallback();

            return this;
        }
    }, {
        key: 'redo',
        value: function redo() {
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
                defaultWTP: self.defaultWTP,
                minimumWTP: self.minimumWTP,
                maximumWTP: self.maximumWTP,
                expressionScope: self.expressionScope,
                code: self.code,
                $codeError: self.$codeError
            });

            this._setNewState(newState, true);

            this._fireUndoRedoCallback();

            return this;
        }
    }, {
        key: 'clear',
        value: function clear() {
            this.nodes.length = 0;
            this.edges.length = 0;
            this.undoStack.length = 0;
            this.redoStack.length = 0;
            this.texts.length = 0;
            this.clearExpressionScope();
            this.code = '';
            this.$codeError = null;
            this.$codeDirty = false;
        }
    }, {
        key: 'addText',
        value: function addText(text) {
            this.texts.push(text);

            this._fireTextAddedCallback(text);
        }
    }, {
        key: 'removeTexts',
        value: function removeTexts(texts) {
            var _this6 = this;

            texts.forEach(function (t) {
                return _this6.removeText(t);
            });
        }
    }, {
        key: 'removeText',
        value: function removeText(text) {
            var index = this.texts.indexOf(text);
            if (index > -1) {
                this.texts.splice(index, 1);
                this._fireTextRemovedCallback(text);
            }
        }
    }, {
        key: 'clearExpressionScope',
        value: function clearExpressionScope() {
            var _this7 = this;

            _sdUtils.Utils.forOwn(this.expressionScope, function (value, key) {
                delete _this7.expressionScope[key];
            });
        }
    }, {
        key: 'reversePayoffs',
        value: function reversePayoffs() {
            this.payoffNames.reverse();
            this.edges.forEach(function (e) {
                return e.payoff.reverse();
            });
        }
    }, {
        key: '_setNewState',
        value: function _setNewState(newState, redo) {
            var nodeById = _sdUtils.Utils.getObjectByIdMap(newState.nodes);
            var edgeById = _sdUtils.Utils.getObjectByIdMap(newState.edges);
            this.nodes = newState.nodes;
            this.edges = newState.edges;
            this.texts = newState.texts;
            this.payoffNames = newState.payoffNames;
            this.defaultWTP = newState.defaultWTP;
            this.minimumWTP = newState.minimumWTP;
            this.maximumWTP = newState.maximumWTP;
            this.expressionScope = newState.expressionScope;
            this.code = newState.code;
            this.$codeError = newState.$codeError;

            this.nodes.forEach(function (n) {
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
    }, {
        key: '_pushToStack',
        value: function _pushToStack(stack, obj) {
            if (stack.length >= this.maxStackSize) {
                stack.shift();
            }
            stack.push(obj);
        }
    }, {
        key: '_fireUndoRedoCallback',
        value: function _fireUndoRedoCallback() {
            if (!this.callbacksDisabled && this.undoRedoStateChangedCallback) {
                this.undoRedoStateChangedCallback();
            }
        }
    }, {
        key: '_fireNodeAddedCallback',
        value: function _fireNodeAddedCallback(node) {
            if (!this.callbacksDisabled && this.nodeAddedCallback) {
                this.nodeAddedCallback(node);
            }
        }
    }, {
        key: '_fireNodeRemovedCallback',
        value: function _fireNodeRemovedCallback(node) {
            if (!this.callbacksDisabled && this.nodeRemovedCallback) {
                this.nodeRemovedCallback(node);
            }
        }
    }, {
        key: '_fireTextAddedCallback',
        value: function _fireTextAddedCallback(text) {
            if (!this.callbacksDisabled && this.textAddedCallback) {
                this.textAddedCallback(text);
            }
        }
    }, {
        key: '_fireTextRemovedCallback',
        value: function _fireTextRemovedCallback(text) {
            if (!this.callbacksDisabled && this.textRemovedCallback) {
                this.textRemovedCallback(text);
            }
        }
    }]);

    return DataModel;
}();

},{"./domain":3,"./validation-result":13,"sd-utils":"sd-utils"}],2:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Edge = undefined;

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _objectWithComputedValues = require('./object-with-computed-values');

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

function _possibleConstructorReturn(self, call) {
    if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Edge = exports.Edge = function (_ObjectWithComputedVa) {
    _inherits(Edge, _ObjectWithComputedVa);

    function Edge(parentNode, childNode, name, payoff, probability) {
        _classCallCheck(this, Edge);

        var _this = _possibleConstructorReturn(this, (Edge.__proto__ || Object.getPrototypeOf(Edge)).call(this));

        _this.name = '';
        _this.probability = undefined;
        _this.payoff = [0, 0];
        _this.$DISPLAY_VALUE_NAMES = ['probability', 'payoff', 'optimal'];

        _this.parentNode = parentNode;
        _this.childNode = childNode;

        if (name !== undefined) {
            _this.name = name;
        }
        if (probability !== undefined) {
            _this.probability = probability;
        }
        if (payoff !== undefined) {
            _this.payoff = payoff;
        }

        return _this;
    }

    _createClass(Edge, [{
        key: 'setName',
        value: function setName(name) {
            this.name = name;
            return this;
        }
    }, {
        key: 'setProbability',
        value: function setProbability(probability) {
            this.probability = probability;
            return this;
        }
    }, {
        key: 'setPayoff',
        value: function setPayoff(payoff) {
            var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

            this.payoff[index] = payoff;
            return this;
        }
    }, {
        key: 'computedBaseProbability',
        value: function computedBaseProbability(val) {
            return this.computedValue(null, 'probability', val);
        }
    }, {
        key: 'computedBasePayoff',
        value: function computedBasePayoff(val) {
            var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

            return this.computedValue(null, 'payoff[' + index + ']', val);
        }
    }, {
        key: 'displayProbability',
        value: function displayProbability(val) {
            return this.displayValue('probability', val);
        }
    }, {
        key: 'displayPayoff',
        value: function displayPayoff(val) {
            var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

            return this.displayValue('payoff[' + index + ']', val);
        }
    }]);

    return Edge;
}(_objectWithComputedValues.ObjectWithComputedValues);

},{"./object-with-computed-values":8}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _node = require('./node/node');

Object.keys(_node).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _node[key];
    }
  });
});

var _decisionNode = require('./node/decision-node');

Object.keys(_decisionNode).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _decisionNode[key];
    }
  });
});

var _chanceNode = require('./node/chance-node');

Object.keys(_chanceNode).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _chanceNode[key];
    }
  });
});

var _terminalNode = require('./node/terminal-node');

Object.keys(_terminalNode).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _terminalNode[key];
    }
  });
});

var _edge = require('./edge');

Object.keys(_edge).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _edge[key];
    }
  });
});

var _point = require('./point');

Object.keys(_point).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _point[key];
    }
  });
});

var _text = require('./text');

Object.keys(_text).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _text[key];
    }
  });
});

},{"./edge":2,"./node/chance-node":4,"./node/decision-node":5,"./node/node":6,"./node/terminal-node":7,"./point":10,"./text":11}],4:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ChanceNode = undefined;

var _node = require('./node');

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

function _possibleConstructorReturn(self, call) {
    if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var ChanceNode = exports.ChanceNode = function (_Node) {
    _inherits(ChanceNode, _Node);

    function ChanceNode(location) {
        _classCallCheck(this, ChanceNode);

        return _possibleConstructorReturn(this, (ChanceNode.__proto__ || Object.getPrototypeOf(ChanceNode)).call(this, ChanceNode.$TYPE, location));
    }

    return ChanceNode;
}(_node.Node);

ChanceNode.$TYPE = 'chance';

},{"./node":6}],5:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.DecisionNode = undefined;

var _node = require('./node');

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

function _possibleConstructorReturn(self, call) {
    if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var DecisionNode = exports.DecisionNode = function (_Node) {
    _inherits(DecisionNode, _Node);

    function DecisionNode(location) {
        _classCallCheck(this, DecisionNode);

        return _possibleConstructorReturn(this, (DecisionNode.__proto__ || Object.getPrototypeOf(DecisionNode)).call(this, DecisionNode.$TYPE, location));
    }

    return DecisionNode;
}(_node.Node);

DecisionNode.$TYPE = 'decision';

},{"./node":6}],6:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Node = undefined;

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _point = require('../point');

var _objectWithComputedValues = require('../object-with-computed-values');

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

function _possibleConstructorReturn(self, call) {
    if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Node = exports.Node = function (_ObjectWithComputedVa) {
    _inherits(Node, _ObjectWithComputedVa);

    //code evaluation errors

    function Node(type, location) {
        _classCallCheck(this, Node);

        var _this = _possibleConstructorReturn(this, (Node.__proto__ || Object.getPrototypeOf(Node)).call(this));

        _this.childEdges = [];
        _this.name = '';
        _this.code = '';
        _this.$codeDirty = false;
        _this.$codeError = null;
        _this.expressionScope = null;
        _this.$DISPLAY_VALUE_NAMES = ['childrenPayoff', 'aggregatedPayoff', 'probabilityToEnter', 'optimal'];

        _this.location = location;
        if (!location) {
            _this.location = new _point.Point(0, 0);
        }
        _this.type = type;
        return _this;
    } // is code changed without reevaluation?
    //Point

    _createClass(Node, [{
        key: 'setName',
        value: function setName(name) {
            this.name = name;
            return this;
        }
    }, {
        key: 'moveTo',
        value: function moveTo(x, y, withChildren) {
            //move to new location
            if (withChildren) {
                var dx = x - this.location.x;
                var dy = y - this.location.y;
                this.childEdges.forEach(function (e) {
                    return e.childNode.move(dx, dy, true);
                });
            }

            this.location.moveTo(x, y);
            return this;
        }
    }, {
        key: 'move',
        value: function move(dx, dy, withChildren) {
            //move by vector
            if (withChildren) {
                this.childEdges.forEach(function (e) {
                    return e.childNode.move(dx, dy, true);
                });
            }
            this.location.move(dx, dy);
            return this;
        }
    }]);

    return Node;
}(_objectWithComputedValues.ObjectWithComputedValues);

},{"../object-with-computed-values":8,"../point":10}],7:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.TerminalNode = undefined;

var _node = require('./node');

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

function _possibleConstructorReturn(self, call) {
    if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }return call && ((typeof call === 'undefined' ? 'undefined' : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === 'undefined' ? 'undefined' : _typeof(superClass)));
    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var TerminalNode = exports.TerminalNode = function (_Node) {
    _inherits(TerminalNode, _Node);

    function TerminalNode(location) {
        _classCallCheck(this, TerminalNode);

        return _possibleConstructorReturn(this, (TerminalNode.__proto__ || Object.getPrototypeOf(TerminalNode)).call(this, TerminalNode.$TYPE, location));
    }

    return TerminalNode;
}(_node.Node);

TerminalNode.$TYPE = 'terminal';

},{"./node":6}],8:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ObjectWithComputedValues = undefined;

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _sdUtils = require('sd-utils');

var _objectWithIdAndEditableFields = require('./object-with-id-and-editable-fields');

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

function _possibleConstructorReturn(self, call) {
    if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var ObjectWithComputedValues = exports.ObjectWithComputedValues = function (_ObjectWithIdAndEdita) {
    _inherits(ObjectWithComputedValues, _ObjectWithIdAndEdita);

    function ObjectWithComputedValues() {
        var _ref;

        var _temp, _this, _ret;

        _classCallCheck(this, ObjectWithComputedValues);

        for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
        }

        return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = ObjectWithComputedValues.__proto__ || Object.getPrototypeOf(ObjectWithComputedValues)).call.apply(_ref, [this].concat(args))), _this), _this.computed = {}, _temp), _possibleConstructorReturn(_this, _ret);
    }

    _createClass(ObjectWithComputedValues, [{
        key: 'computedValue',
        //computed values

        /*get or set computed value*/
        value: function computedValue(ruleName, fieldPath, value) {
            var path = 'computed.';
            if (ruleName) {
                path += ruleName + '.';
            }
            path += fieldPath;
            if (value === undefined) {
                return _sdUtils.Utils.get(this, path, null);
            }
            _sdUtils.Utils.set(this, path, value);
            return value;
        }
    }, {
        key: 'clearComputedValues',
        value: function clearComputedValues(ruleName) {
            var _this2 = this;

            if (ruleName == undefined) {
                this.computed = {};
                return;
            }
            if (_sdUtils.Utils.isArray(ruleName)) {
                ruleName.forEach(function (n) {
                    _this2.computed[n] = {};
                });
                return;
            }
            this.computed[ruleName] = {};
        }
    }, {
        key: 'clearDisplayValues',
        value: function clearDisplayValues() {
            this.computed['$displayValues'] = {};
        }
    }, {
        key: 'displayValue',
        value: function displayValue(fieldPath, value) {
            return this.computedValue(null, '$displayValues.' + fieldPath, value);
        }
    }, {
        key: 'loadComputedValues',
        value: function loadComputedValues(computed) {
            this.computed = computed;
        }
    }]);

    return ObjectWithComputedValues;
}(_objectWithIdAndEditableFields.ObjectWithIdAndEditableFields);

},{"./object-with-id-and-editable-fields":9,"sd-utils":"sd-utils"}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ObjectWithIdAndEditableFields = undefined;

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _sdUtils = require('sd-utils');

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var ObjectWithIdAndEditableFields = exports.ObjectWithIdAndEditableFields = function () {
    function ObjectWithIdAndEditableFields() {
        _classCallCheck(this, ObjectWithIdAndEditableFields);

        this.$id = _sdUtils.Utils.guid();
        this.$fieldStatus = {};
    } //internal id


    _createClass(ObjectWithIdAndEditableFields, [{
        key: 'getFieldStatus',
        value: function getFieldStatus(fieldPath) {
            if (!_sdUtils.Utils.get(this.$fieldStatus, fieldPath, null)) {
                _sdUtils.Utils.set(this.$fieldStatus, fieldPath, {
                    valid: {
                        syntax: true,
                        value: true
                    }
                });
            }
            return _sdUtils.Utils.get(this.$fieldStatus, fieldPath);
        }
    }, {
        key: 'setSyntaxValidity',
        value: function setSyntaxValidity(fieldPath, valid) {
            var fieldStatus = this.getFieldStatus(fieldPath);
            fieldStatus.valid.syntax = valid;
        }
    }, {
        key: 'setValueValidity',
        value: function setValueValidity(fieldPath, valid) {
            var fieldStatus = this.getFieldStatus(fieldPath);
            fieldStatus.valid.value = valid;
        }
    }, {
        key: 'isFieldValid',
        value: function isFieldValid(fieldPath) {
            var syntax = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
            var value = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

            var fieldStatus = this.getFieldStatus(fieldPath);
            if (syntax && value) {
                return fieldStatus.valid.syntax && fieldStatus.valid.value;
            }
            if (syntax) {
                return fieldStatus.valid.syntax;
            }
            return fieldStatus.valid.value;
        }
    }]);

    return ObjectWithIdAndEditableFields;
}();

},{"sd-utils":"sd-utils"}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Point = exports.Point = function () {
    function Point(x, y) {
        _classCallCheck(this, Point);

        if (x instanceof Point) {
            y = x.y;
            x = x.x;
        } else if (Array.isArray(x)) {
            y = x[1];
            x = x[0];
        }
        this.x = x;
        this.y = y;
    }

    _createClass(Point, [{
        key: "moveTo",
        value: function moveTo(x, y) {
            if (Array.isArray(x)) {
                y = x[1];
                x = x[0];
            }
            this.x = x;
            this.y = y;
            return this;
        }
    }, {
        key: "move",
        value: function move(dx, dy) {
            //move by vector
            if (Array.isArray(dx)) {
                dy = dx[1];
                dx = dx[0];
            }
            this.x += dx;
            this.y += dy;
            return this;
        }
    }]);

    return Point;
}();

},{}],11:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Text = undefined;

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _point = require("./point");

var _sdUtils = require("sd-utils");

var _objectWithIdAndEditableFields = require("./object-with-id-and-editable-fields");

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

function _possibleConstructorReturn(self, call) {
    if (!self) {
        throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }return call && ((typeof call === "undefined" ? "undefined" : _typeof(call)) === "object" || typeof call === "function") ? call : self;
}

function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
        throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : _typeof(superClass)));
    }subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } });if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
}

var Text = exports.Text = function (_ObjectWithIdAndEdita) {
    _inherits(Text, _ObjectWithIdAndEdita);

    //Point

    function Text(location, value) {
        _classCallCheck(this, Text);

        var _this = _possibleConstructorReturn(this, (Text.__proto__ || Object.getPrototypeOf(Text)).call(this));

        _this.value = '';

        _this.location = location;
        if (!location) {
            _this.location = new _point.Point(0, 0);
        }

        if (value) {
            _this.value = value;
        }
        return _this;
    }

    _createClass(Text, [{
        key: "moveTo",
        value: function moveTo(x, y) {
            //move to new location
            this.location.moveTo(x, y);
            return this;
        }
    }, {
        key: "move",
        value: function move(dx, dy) {
            //move by vector
            this.location.move(dx, dy);
            return this;
        }
    }]);

    return Text;
}(_objectWithIdAndEditableFields.ObjectWithIdAndEditableFields);

},{"./object-with-id-and-editable-fields":9,"./point":10,"sd-utils":"sd-utils"}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.domain = undefined;

var _dataModel = require('./data-model');

Object.keys(_dataModel).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _dataModel[key];
    }
  });
});

var _validationResult = require('./validation-result');

Object.keys(_validationResult).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _validationResult[key];
    }
  });
});

var _domain = require('./domain');

var domain = _interopRequireWildcard(_domain);

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
      }
    }newObj.default = obj;return newObj;
  }
}

exports.domain = domain;

},{"./data-model":1,"./domain":3,"./validation-result":13}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ValidationResult = undefined;

var _createClass = function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
}();

var _sdUtils = require("sd-utils");

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var ValidationResult = exports.ValidationResult = function () {
    function ValidationResult() {
        _classCallCheck(this, ValidationResult);

        this.errors = {};
        this.warnings = {};
        this.objectIdToError = {};
    }

    _createClass(ValidationResult, [{
        key: "addError",
        value: function addError(error, obj) {
            if (_sdUtils.Utils.isString(error)) {
                error = { name: error };
            }
            var name = error.name;
            var errorsByName = this.errors[name];
            if (!errorsByName) {
                errorsByName = [];
                this.errors[name] = errorsByName;
            }
            var objE = this.objectIdToError[obj.$id];
            if (!objE) {
                objE = [];
                this.objectIdToError[obj.$id] = objE;
            }
            errorsByName.push(obj);
            objE.push(error);
        }
    }, {
        key: "addWarning",
        value: function addWarning(name, obj) {
            var e = this.warnings[name];
            if (!e) {
                e = [];
                this.warnings[name] = e;
            }
            e.push(obj);
        }
    }, {
        key: "isValid",
        value: function isValid() {
            return Object.getOwnPropertyNames(this.errors).length === 0;
        }
    }], [{
        key: "createFromDTO",
        value: function createFromDTO(dto) {
            var v = new ValidationResult();
            v.errors = dto.errors;
            v.warnings = dto.warnings;
            v.objectIdToError = dto.objectIdToError;
            return v;
        }
    }]);

    return ValidationResult;
}();

},{"sd-utils":"sd-utils"}],"sd-model":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _index = require('./src/index');

Object.keys(_index).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _index[key];
    }
  });
});

},{"./src/index":12}]},{},[])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGRhdGEtbW9kZWwuanMiLCJzcmNcXGRvbWFpblxcZWRnZS5qcyIsInNyY1xcZG9tYWluXFxpbmRleC5qcyIsInNyY1xcZG9tYWluXFxub2RlXFxjaGFuY2Utbm9kZS5qcyIsInNyY1xcZG9tYWluXFxub2RlXFxkZWNpc2lvbi1ub2RlLmpzIiwic3JjXFxkb21haW5cXG5vZGVcXG5vZGUuanMiLCJzcmNcXGRvbWFpblxcbm9kZVxcdGVybWluYWwtbm9kZS5qcyIsInNyY1xcZG9tYWluXFxvYmplY3Qtd2l0aC1jb21wdXRlZC12YWx1ZXMuanMiLCJzcmNcXGRvbWFpblxcb2JqZWN0LXdpdGgtaWQtYW5kLWVkaXRhYmxlLWZpZWxkcy5qcyIsInNyY1xcZG9tYWluXFxwb2ludC5qcyIsInNyY1xcZG9tYWluXFx0ZXh0LmpzIiwic3JjXFxpbmRleC5qcyIsInNyY1xcdmFsaWRhdGlvbi1yZXN1bHQuanMiLCJpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDQUE7O0FBRUE7O0ksQUFBWTs7QUFDWjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7OztJLEFBR2Esb0IsQUFBQSx3QkFjVTtBQUZHO0FBcUJ0Qjt1QkFBQSxBQUFZLE1BQU07OEJBQUE7O2FBL0JsQixBQStCa0IsUUEvQlYsQUErQlU7YUE5QmxCLEFBOEJrQixRQTlCVixBQThCVTthQTVCbEIsQUE0QmtCLFFBNUJWLEFBNEJVO2FBM0JsQixBQTJCa0IsY0EzQkosQUEyQkk7YUExQmxCLEFBMEJrQixhQTFCTCxBQTBCSzthQXpCbEIsQUF5QmtCLGFBekJMLEFBeUJLO2FBeEJsQixBQXdCa0IsYUF4QkwsQUF3Qks7YUFyQmxCLEFBcUJrQixrQkFyQkEsQUFxQkE7YUFwQmxCLEFBb0JrQixPQXBCWCxBQW9CVzthQW5CbEIsQUFtQmtCLGFBbkJMLEFBbUJLO2FB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QUFJLEFBQ2pCO2dCQUFJLElBQUksS0FBQSxBQUFLLFNBQWIsQUFBUSxBQUFjLEFBQ3RCO2dCQUFHLENBQUgsQUFBSSxHQUFFLEFBQ0Y7b0JBQUEsQUFBRSxBQUNGO3FCQUFBLEFBQUssU0FBTCxBQUFjLFFBQWQsQUFBb0IsQUFDdkI7QUFDRDtjQUFBLEFBQUUsS0FBRixBQUFPLEFBQ1Y7Ozs7a0NBRVEsQUFDTDttQkFBTyxPQUFBLEFBQU8sb0JBQW9CLEtBQTNCLEFBQWdDLFFBQWhDLEFBQXdDLFdBQS9DLEFBQTBELEFBQzdEOzs7O3NDLEFBRW9CLEtBQUksQUFDckI7Z0JBQUksSUFBSSxJQUFSLEFBQVEsQUFBSSxBQUNaO2NBQUEsQUFBRSxTQUFTLElBQVgsQUFBZSxBQUNmO2NBQUEsQUFBRSxXQUFXLElBQWIsQUFBaUIsQUFDakI7Y0FBQSxBQUFFLGtCQUFrQixJQUFwQixBQUF3QixBQUN4QjttQkFBQSxBQUFPLEFBQ1Y7Ozs7Ozs7Ozs7Ozs7Ozs7QUMvQ0wsMkNBQUE7aURBQUE7O2dCQUFBO3dCQUFBO29CQUFBO0FBQUE7QUFBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQge1V0aWxzfSBmcm9tICdzZC11dGlscydcbmltcG9ydCB7bG9nfSBmcm9tIFwic2QtdXRpbHNcIjtcbmltcG9ydCAqIGFzIGRvbWFpbiBmcm9tICcuL2RvbWFpbidcbmltcG9ydCB7VmFsaWRhdGlvblJlc3VsdH0gZnJvbSAnLi92YWxpZGF0aW9uLXJlc3VsdCdcblxuLypcbiAqIERhdGEgbW9kZWwgbWFuYWdlclxuICogKi9cbmV4cG9ydCBjbGFzcyBEYXRhTW9kZWwge1xuXG4gICAgbm9kZXMgPSBbXTtcbiAgICBlZGdlcyA9IFtdO1xuXG4gICAgdGV4dHMgPSBbXTsgLy9mbG9hdGluZyB0ZXh0c1xuICAgIHBheW9mZk5hbWVzID0gW107XG4gICAgZGVmYXVsdFdUUCA9IDE7XG4gICAgbWluaW11bVdUUCA9IDA7XG4gICAgbWF4aW11bVdUUCA9IEluZmluaXR5O1xuXG5cbiAgICBleHByZXNzaW9uU2NvcGUgPSB7fTsgLy9nbG9iYWwgZXhwcmVzc2lvbiBzY29wZVxuICAgIGNvZGUgPSBcIlwiOy8vZ2xvYmFsIGV4cHJlc3Npb24gY29kZVxuICAgICRjb2RlRXJyb3IgPSBudWxsOyAvL2NvZGUgZXZhbHVhdGlvbiBlcnJvcnNcbiAgICAkY29kZURpcnR5ID0gZmFsc2U7IC8vIGlzIGNvZGUgY2hhbmdlZCB3aXRob3V0IHJlZXZhbHVhdGlvbj9cbiAgICAkdmVyc2lvbj0xO1xuXG4gICAgdmFsaWRhdGlvblJlc3VsdHMgPSBbXTtcblxuICAgIC8vIHVuZG8gLyByZWRvXG4gICAgbWF4U3RhY2tTaXplID0gMjA7XG4gICAgdW5kb1N0YWNrID0gW107XG4gICAgcmVkb1N0YWNrID0gW107XG4gICAgdW5kb1JlZG9TdGF0ZUNoYW5nZWRDYWxsYmFjayA9IG51bGw7XG4gICAgbm9kZUFkZGVkQ2FsbGJhY2sgPSBudWxsO1xuICAgIG5vZGVSZW1vdmVkQ2FsbGJhY2sgPSBudWxsO1xuXG4gICAgdGV4dEFkZGVkQ2FsbGJhY2sgPSBudWxsO1xuICAgIHRleHRSZW1vdmVkQ2FsbGJhY2sgPSBudWxsO1xuXG4gICAgY2FsbGJhY2tzRGlzYWJsZWQgPSBmYWxzZTtcblxuICAgIGNvbnN0cnVjdG9yKGRhdGEpIHtcbiAgICAgICAgaWYoZGF0YSl7XG4gICAgICAgICAgICB0aGlzLmxvYWQoZGF0YSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRKc29uUmVwbGFjZXIoZmlsdGVyTG9jYXRpb249ZmFsc2UsIGZpbHRlckNvbXB1dGVkPWZhbHNlLCByZXBsYWNlciwgZmlsdGVyUHJpdmF0ZSA9dHJ1ZSl7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoaywgdikge1xuXG4gICAgICAgICAgICBpZiAoKGZpbHRlclByaXZhdGUgJiYgVXRpbHMuc3RhcnRzV2l0aChrLCAnJCcpKSB8fCBrID09ICdwYXJlbnROb2RlJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmlsdGVyTG9jYXRpb24gJiYgayA9PSAnbG9jYXRpb24nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmaWx0ZXJDb21wdXRlZCAmJiBrID09ICdjb21wdXRlZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocmVwbGFjZXIpe1xuICAgICAgICAgICAgICAgIHJldHVybiByZXBsYWNlcihrLCB2KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXJpYWxpemUoc3RyaW5naWZ5PXRydWUsIGZpbHRlckxvY2F0aW9uPWZhbHNlLCBmaWx0ZXJDb21wdXRlZD1mYWxzZSwgcmVwbGFjZXIsIGZpbHRlclByaXZhdGUgPXRydWUpe1xuICAgICAgICB2YXIgZGF0YSA9ICB7XG4gICAgICAgICAgICBjb2RlOiB0aGlzLmNvZGUsXG4gICAgICAgICAgICBleHByZXNzaW9uU2NvcGU6IHRoaXMuZXhwcmVzc2lvblNjb3BlLFxuICAgICAgICAgICAgdHJlZXM6IHRoaXMuZ2V0Um9vdHMoKSxcbiAgICAgICAgICAgIHRleHRzOiB0aGlzLnRleHRzXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYoIXN0cmluZ2lmeSl7XG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBVdGlscy5zdHJpbmdpZnkoZGF0YSwgdGhpcy5nZXRKc29uUmVwbGFjZXIoZmlsdGVyTG9jYXRpb24sIGZpbHRlckNvbXB1dGVkLCByZXBsYWNlciwgZmlsdGVyUHJpdmF0ZSksIFtdKTtcbiAgICB9XG5cblxuICAgIC8qTG9hZHMgc2VyaWFsaXplZCBkYXRhKi9cbiAgICBsb2FkKGRhdGEpIHtcbiAgICAgICAgLy9yb290cywgdGV4dHMsIGNvZGUsIGV4cHJlc3Npb25TY29wZVxuICAgICAgICB2YXIgY2FsbGJhY2tzRGlzYWJsZWQgPSB0aGlzLmNhbGxiYWNrc0Rpc2FibGVkO1xuICAgICAgICB0aGlzLmNhbGxiYWNrc0Rpc2FibGVkID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLmNsZWFyKCk7XG5cblxuICAgICAgICBkYXRhLnRyZWVzLmZvckVhY2gobm9kZURhdGE9PiB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMuY3JlYXRlTm9kZUZyb21EYXRhKG5vZGVEYXRhKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGRhdGEudGV4dHMpIHtcbiAgICAgICAgICAgIGRhdGEudGV4dHMuZm9yRWFjaCh0ZXh0RGF0YT0+IHtcbiAgICAgICAgICAgICAgICB2YXIgbG9jYXRpb24gPSBuZXcgZG9tYWluLlBvaW50KHRleHREYXRhLmxvY2F0aW9uLngsIHRleHREYXRhLmxvY2F0aW9uLnkpO1xuICAgICAgICAgICAgICAgIHZhciB0ZXh0ID0gbmV3IGRvbWFpbi5UZXh0KGxvY2F0aW9uLCB0ZXh0RGF0YS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy50ZXh0cy5wdXNoKHRleHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2xlYXJFeHByZXNzaW9uU2NvcGUoKTtcbiAgICAgICAgdGhpcy5jb2RlID0gZGF0YS5jb2RlIHx8ICcnO1xuXG4gICAgICAgIGlmIChkYXRhLmV4cHJlc3Npb25TY29wZSkge1xuICAgICAgICAgICAgVXRpbHMuZXh0ZW5kKHRoaXMuZXhwcmVzc2lvblNjb3BlLCBkYXRhLmV4cHJlc3Npb25TY29wZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jYWxsYmFja3NEaXNhYmxlZCA9IGNhbGxiYWNrc0Rpc2FibGVkO1xuICAgIH1cblxuICAgIGdldERUTyhmaWx0ZXJMb2NhdGlvbj1mYWxzZSwgZmlsdGVyQ29tcHV0ZWQ9ZmFsc2UsIGZpbHRlclByaXZhdGUgPWZhbHNlKXtcbiAgICAgICAgdmFyIGR0byA9IHtcbiAgICAgICAgICAgIHNlcmlhbGl6ZWREYXRhOiB0aGlzLnNlcmlhbGl6ZSh0cnVlLCBmaWx0ZXJMb2NhdGlvbiwgZmlsdGVyQ29tcHV0ZWQsIG51bGwsIGZpbHRlclByaXZhdGUpLFxuICAgICAgICAgICAgJGNvZGVFcnJvcjogdGhpcy4kY29kZUVycm9yLFxuICAgICAgICAgICAgJGNvZGVEaXJ0eTogdGhpcy4kY29kZURpcnR5LFxuICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdHM6IHRoaXMudmFsaWRhdGlvblJlc3VsdHMuc2xpY2UoKVxuXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBkdG9cbiAgICB9XG5cbiAgICBsb2FkRnJvbURUTyhkdG8sIGRhdGFSZXZpdmVyKXtcbiAgICAgICAgdGhpcy5sb2FkKEpTT04ucGFyc2UoZHRvLnNlcmlhbGl6ZWREYXRhLCBkYXRhUmV2aXZlcikpO1xuICAgICAgICB0aGlzLiRjb2RlRXJyb3IgPSBkdG8uJGNvZGVFcnJvcjtcbiAgICAgICAgdGhpcy4kY29kZURpcnR5ID0gZHRvLiRjb2RlRGlydHk7XG4gICAgICAgIHRoaXMudmFsaWRhdGlvblJlc3VsdHMubGVuZ3RoPTA7XG4gICAgICAgIGR0by52YWxpZGF0aW9uUmVzdWx0cy5mb3JFYWNoKHY9PntcbiAgICAgICAgICAgIHRoaXMudmFsaWRhdGlvblJlc3VsdHMucHVzaChWYWxpZGF0aW9uUmVzdWx0LmNyZWF0ZUZyb21EVE8odikpXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgLypUaGlzIG1ldGhvZCB1cGRhdGVzIG9ubHkgY29tcHV0YXRpb24gcmVzdWx0cy92YWxpZGF0aW9uKi9cbiAgICB1cGRhdGVGcm9tKGRhdGFNb2RlbCl7XG4gICAgICAgIGlmKHRoaXMuJHZlcnNpb24+ZGF0YU1vZGVsLiR2ZXJzaW9uKXtcbiAgICAgICAgICAgIGxvZy53YXJuKFwiRGF0YU1vZGVsLnVwZGF0ZUZyb206IHZlcnNpb24gb2YgY3VycmVudCBtb2RlbCBncmVhdGVyIHRoYW4gdXBkYXRlXCIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGJ5SWQgPSB7fVxuICAgICAgICBkYXRhTW9kZWwubm9kZXMuZm9yRWFjaChuPT57XG4gICAgICAgICAgICBieUlkW24uJGlkXSA9IG47XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLm5vZGVzLmZvckVhY2goKG4saSk9PntcbiAgICAgICAgICAgIGlmKGJ5SWRbbi4kaWRdKXtcbiAgICAgICAgICAgICAgICBuLmxvYWRDb21wdXRlZFZhbHVlcyhieUlkW24uJGlkXS5jb21wdXRlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBkYXRhTW9kZWwuZWRnZXMuZm9yRWFjaChlPT57XG4gICAgICAgICAgICBieUlkW2UuJGlkXSA9IGU7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmVkZ2VzLmZvckVhY2goKGUsaSk9PntcbiAgICAgICAgICAgIGlmKGJ5SWRbZS4kaWRdKXtcbiAgICAgICAgICAgICAgICBlLmxvYWRDb21wdXRlZFZhbHVlcyhieUlkW2UuJGlkXS5jb21wdXRlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmV4cHJlc3Npb25TY29wZSA9IGRhdGFNb2RlbC5leHByZXNzaW9uU2NvcGU7XG4gICAgICAgIHRoaXMuJGNvZGVFcnJvciA9IGRhdGFNb2RlbC4kY29kZUVycm9yO1xuICAgICAgICB0aGlzLiRjb2RlRGlydHkgPSBkYXRhTW9kZWwuJGNvZGVEaXJ0eTtcbiAgICAgICAgdGhpcy52YWxpZGF0aW9uUmVzdWx0cyAgPSBkYXRhTW9kZWwudmFsaWRhdGlvblJlc3VsdHM7XG4gICAgfVxuXG4gICAgZ2V0R2xvYmFsVmFyaWFibGVOYW1lcyhmaWx0ZXJGdW5jdGlvbiA9IHRydWUpe1xuICAgICAgICB2YXIgcmVzID0gW107XG4gICAgICAgIFV0aWxzLmZvck93bih0aGlzLmV4cHJlc3Npb25TY29wZSwgKHZhbHVlLCBrZXkpPT57XG4gICAgICAgICAgICBpZihmaWx0ZXJGdW5jdGlvbiAmJiBVdGlscy5pc0Z1bmN0aW9uKHZhbHVlKSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLnB1c2goa2V5KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuXG4gICAgLypjcmVhdGUgbm9kZSBmcm9tIHNlcmlhbGl6ZWQgZGF0YSovXG4gICAgY3JlYXRlTm9kZUZyb21EYXRhKGRhdGEsIHBhcmVudCkge1xuICAgICAgICB2YXIgbm9kZSwgbG9jYXRpb247XG5cbiAgICAgICAgaWYoZGF0YS5sb2NhdGlvbil7XG4gICAgICAgICAgICBsb2NhdGlvbiA9IG5ldyBkb21haW4uUG9pbnQoZGF0YS5sb2NhdGlvbi54LCBkYXRhLmxvY2F0aW9uLnkpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGxvY2F0aW9uID0gbmV3IGRvbWFpbi5Qb2ludCgwLDApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRvbWFpbi5EZWNpc2lvbk5vZGUuJFRZUEUgPT0gZGF0YS50eXBlKSB7XG4gICAgICAgICAgICBub2RlID0gbmV3IGRvbWFpbi5EZWNpc2lvbk5vZGUobG9jYXRpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKGRvbWFpbi5DaGFuY2VOb2RlLiRUWVBFID09IGRhdGEudHlwZSkge1xuICAgICAgICAgICAgbm9kZSA9IG5ldyBkb21haW4uQ2hhbmNlTm9kZShsb2NhdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoZG9tYWluLlRlcm1pbmFsTm9kZS4kVFlQRSA9PSBkYXRhLnR5cGUpIHtcbiAgICAgICAgICAgIG5vZGUgPSBuZXcgZG9tYWluLlRlcm1pbmFsTm9kZShsb2NhdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYoZGF0YS4kaWQpe1xuICAgICAgICAgICAgbm9kZS4kaWQgPSBkYXRhLiRpZDtcbiAgICAgICAgfVxuICAgICAgICBpZihkYXRhLiRmaWVsZFN0YXR1cyl7XG4gICAgICAgICAgICBub2RlLiRmaWVsZFN0YXR1cyA9IGRhdGEuJGZpZWxkU3RhdHVzO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUubmFtZSA9IGRhdGEubmFtZTtcblxuICAgICAgICBpZihkYXRhLmNvZGUpe1xuICAgICAgICAgICAgbm9kZS5jb2RlID0gZGF0YS5jb2RlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkYXRhLmV4cHJlc3Npb25TY29wZSkge1xuICAgICAgICAgICAgbm9kZS5leHByZXNzaW9uU2NvcGUgPSBkYXRhLmV4cHJlc3Npb25TY29wZVxuICAgICAgICB9XG4gICAgICAgIGlmKGRhdGEuY29tcHV0ZWQpe1xuICAgICAgICAgICAgbm9kZS5sb2FkQ29tcHV0ZWRWYWx1ZXMoZGF0YS5jb21wdXRlZCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZWRnZU9yTm9kZSA9IHRoaXMuYWRkTm9kZShub2RlLCBwYXJlbnQpO1xuICAgICAgICBkYXRhLmNoaWxkRWRnZXMuZm9yRWFjaChlZD0+IHtcbiAgICAgICAgICAgIHZhciBlZGdlID0gdGhpcy5jcmVhdGVOb2RlRnJvbURhdGEoZWQuY2hpbGROb2RlLCBub2RlKTtcbiAgICAgICAgICAgIGlmKFV0aWxzLmlzQXJyYXkoKSl7XG4gICAgICAgICAgICAgICAgZWRnZS5wYXlvZmYgPSBlZC5wYXlvZmY7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBlZGdlLnBheW9mZiA9IFtlZC5wYXlvZmYsIDBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlZGdlLnByb2JhYmlsaXR5ID0gZWQucHJvYmFiaWxpdHk7XG4gICAgICAgICAgICBlZGdlLm5hbWUgPSBlZC5uYW1lO1xuICAgICAgICAgICAgaWYoZWQuY29tcHV0ZWQpe1xuICAgICAgICAgICAgICAgIGVkZ2UubG9hZENvbXB1dGVkVmFsdWVzKGVkLmNvbXB1dGVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGVkLiRpZCl7XG4gICAgICAgICAgICAgICAgZWRnZS4kaWQgPSBlZC4kaWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihlZC4kZmllbGRTdGF0dXMpe1xuICAgICAgICAgICAgICAgIGVkZ2UuJGZpZWxkU3RhdHVzID0gZWQuJGZpZWxkU3RhdHVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZWRnZU9yTm9kZTtcbiAgICB9XG5cbiAgICAvKnJldHVybnMgbm9kZSBvciBlZGdlIGZyb20gcGFyZW50IHRvIHRoaXMgbm9kZSovXG4gICAgYWRkTm9kZShub2RlLCBwYXJlbnQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLm5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgIHZhciBlZGdlID0gc2VsZi5fYWRkQ2hpbGQocGFyZW50LCBub2RlKTtcbiAgICAgICAgICAgIHRoaXMuX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhub2RlKTtcbiAgICAgICAgICAgIHJldHVybiBlZGdlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fZmlyZU5vZGVBZGRlZENhbGxiYWNrKG5vZGUpO1xuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG5cbiAgICAvKmluamVjdHMgZ2l2ZW4gbm9kZSBpbnRvIGdpdmVuIGVkZ2UqL1xuICAgIGluamVjdE5vZGUobm9kZSwgZWRnZSkge1xuICAgICAgICB2YXIgcGFyZW50ID0gZWRnZS5wYXJlbnROb2RlO1xuICAgICAgICB2YXIgY2hpbGQgPSBlZGdlLmNoaWxkTm9kZTtcbiAgICAgICAgdGhpcy5ub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICBub2RlLiRwYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgIGVkZ2UuY2hpbGROb2RlID0gbm9kZTtcbiAgICAgICAgdGhpcy5fYWRkQ2hpbGQobm9kZSwgY2hpbGQpO1xuICAgICAgICB0aGlzLl9maXJlTm9kZUFkZGVkQ2FsbGJhY2sobm9kZSk7XG4gICAgfVxuXG4gICAgX2FkZENoaWxkKHBhcmVudCwgY2hpbGQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgZWRnZSA9IG5ldyBkb21haW4uRWRnZShwYXJlbnQsIGNoaWxkKTtcbiAgICAgICAgc2VsZi5fc2V0RWRnZUluaXRpYWxQcm9iYWJpbGl0eShlZGdlKTtcbiAgICAgICAgc2VsZi5lZGdlcy5wdXNoKGVkZ2UpO1xuXG4gICAgICAgIHBhcmVudC5jaGlsZEVkZ2VzLnB1c2goZWRnZSk7XG4gICAgICAgIGNoaWxkLiRwYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgIHJldHVybiBlZGdlO1xuICAgIH1cblxuICAgIF9zZXRFZGdlSW5pdGlhbFByb2JhYmlsaXR5KGVkZ2UpIHtcbiAgICAgICAgaWYgKGVkZ2UucGFyZW50Tm9kZSBpbnN0YW5jZW9mIGRvbWFpbi5DaGFuY2VOb2RlKSB7XG4gICAgICAgICAgICBlZGdlLnByb2JhYmlsaXR5ID0gJyMnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWRnZS5wcm9iYWJpbGl0eSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgLypyZW1vdmVzIGdpdmVuIG5vZGUgYW5kIGl0cyBzdWJ0cmVlKi9cbiAgICByZW1vdmVOb2RlKG5vZGUsICRsID0gMCkge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgbm9kZS5jaGlsZEVkZ2VzLmZvckVhY2goZT0+c2VsZi5yZW1vdmVOb2RlKGUuY2hpbGROb2RlLCAkbCArIDEpKTtcblxuICAgICAgICBzZWxmLl9yZW1vdmVOb2RlKG5vZGUpO1xuICAgICAgICB2YXIgcGFyZW50ID0gbm9kZS4kcGFyZW50O1xuICAgICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgICAgICB2YXIgcGFyZW50RWRnZSA9IFV0aWxzLmZpbmQocGFyZW50LmNoaWxkRWRnZXMsIChlLCBpKT0+IGUuY2hpbGROb2RlID09PSBub2RlKTtcbiAgICAgICAgICAgIGlmICgkbCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVFZGdlKHBhcmVudEVkZ2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9yZW1vdmVFZGdlKHBhcmVudEVkZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2ZpcmVOb2RlUmVtb3ZlZENhbGxiYWNrKG5vZGUpO1xuICAgIH1cblxuICAgIC8qcmVtb3ZlcyBnaXZlbiBub2RlcyBhbmQgdGhlaXIgc3VidHJlZXMqL1xuICAgIHJlbW92ZU5vZGVzKG5vZGVzKSB7XG5cbiAgICAgICAgdmFyIHJvb3RzID0gdGhpcy5maW5kU3VidHJlZVJvb3RzKG5vZGVzKTtcbiAgICAgICAgcm9vdHMuZm9yRWFjaChuPT50aGlzLnJlbW92ZU5vZGUobiwgMCksIHRoaXMpO1xuICAgIH1cblxuICAgIGNvbnZlcnROb2RlKG5vZGUsIHR5cGVUb0NvbnZlcnRUbyl7XG4gICAgICAgIHZhciBuZXdOb2RlO1xuICAgICAgICBpZighbm9kZS5jaGlsZEVkZ2VzLmxlbmd0aCAmJiBub2RlLiRwYXJlbnQpe1xuICAgICAgICAgICAgbmV3Tm9kZSA9IHRoaXMuY3JlYXRlTm9kZUJ5VHlwZSh0eXBlVG9Db252ZXJ0VG8sIG5vZGUubG9jYXRpb24pO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGlmKG5vZGUgaW5zdGFuY2VvZiBkb21haW4uRGVjaXNpb25Ob2RlICYmIHR5cGVUb0NvbnZlcnRUbz09ZG9tYWluLkNoYW5jZU5vZGUuJFRZUEUpe1xuICAgICAgICAgICAgICAgIG5ld05vZGUgPSB0aGlzLmNyZWF0ZU5vZGVCeVR5cGUodHlwZVRvQ29udmVydFRvLCBub2RlLmxvY2F0aW9uKTtcbiAgICAgICAgICAgIH1lbHNlIGlmKHR5cGVUb0NvbnZlcnRUbz09ZG9tYWluLkRlY2lzaW9uTm9kZS4kVFlQRSl7XG4gICAgICAgICAgICAgICAgbmV3Tm9kZSA9IHRoaXMuY3JlYXRlTm9kZUJ5VHlwZSh0eXBlVG9Db252ZXJ0VG8sIG5vZGUubG9jYXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYobmV3Tm9kZSl7XG4gICAgICAgICAgICBuZXdOb2RlLm5hbWU9bm9kZS5uYW1lO1xuICAgICAgICAgICAgdGhpcy5yZXBsYWNlTm9kZShuZXdOb2RlLCBub2RlKTtcbiAgICAgICAgICAgIG5ld05vZGUuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PnRoaXMuX3NldEVkZ2VJbml0aWFsUHJvYmFiaWxpdHkoZSkpO1xuICAgICAgICAgICAgdGhpcy5fZmlyZU5vZGVBZGRlZENhbGxiYWNrKG5ld05vZGUpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBjcmVhdGVOb2RlQnlUeXBlKHR5cGUsIGxvY2F0aW9uKXtcbiAgICAgICAgaWYodHlwZT09ZG9tYWluLkRlY2lzaW9uTm9kZS4kVFlQRSl7XG4gICAgICAgICAgICByZXR1cm4gbmV3IGRvbWFpbi5EZWNpc2lvbk5vZGUobG9jYXRpb24pXG4gICAgICAgIH1lbHNlIGlmKHR5cGU9PWRvbWFpbi5DaGFuY2VOb2RlLiRUWVBFKXtcbiAgICAgICAgICAgIHJldHVybiBuZXcgZG9tYWluLkNoYW5jZU5vZGUobG9jYXRpb24pXG4gICAgICAgIH1lbHNlIGlmKHR5cGU9PWRvbWFpbi5UZXJtaW5hbE5vZGUuJFRZUEUpe1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBkb21haW4uVGVybWluYWxOb2RlKGxvY2F0aW9uKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVwbGFjZU5vZGUobmV3Tm9kZSwgb2xkTm9kZSl7XG4gICAgICAgIHZhciBwYXJlbnQgPSBvbGROb2RlLiRwYXJlbnQ7XG4gICAgICAgIG5ld05vZGUuJHBhcmVudCA9IHBhcmVudDtcblxuICAgICAgICBpZihwYXJlbnQpe1xuICAgICAgICAgICAgdmFyIHBhcmVudEVkZ2UgPSBVdGlscy5maW5kKG5ld05vZGUuJHBhcmVudC5jaGlsZEVkZ2VzLCBlPT5lLmNoaWxkTm9kZT09PW9sZE5vZGUpO1xuICAgICAgICAgICAgcGFyZW50RWRnZS5jaGlsZE5vZGUgPSBuZXdOb2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgbmV3Tm9kZS5jaGlsZEVkZ2VzID0gb2xkTm9kZS5jaGlsZEVkZ2VzO1xuICAgICAgICBuZXdOb2RlLmNoaWxkRWRnZXMuZm9yRWFjaChlPT5lLnBhcmVudE5vZGU9bmV3Tm9kZSk7XG5cbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5ub2Rlcy5pbmRleE9mKG9sZE5vZGUpO1xuICAgICAgICBpZih+aW5kZXgpe1xuICAgICAgICAgICAgdGhpcy5ub2Rlc1tpbmRleF09bmV3Tm9kZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldFJvb3RzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ub2Rlcy5maWx0ZXIobj0+IW4uJHBhcmVudCk7XG4gICAgfVxuXG4gICAgZmluZFN1YnRyZWVSb290cyhub2Rlcykge1xuICAgICAgICByZXR1cm4gbm9kZXMuZmlsdGVyKG49PiFuLiRwYXJlbnQgfHwgbm9kZXMuaW5kZXhPZihuLiRwYXJlbnQpID09PSAtMSk7XG4gICAgfVxuXG4gICAgLypjcmVhdGVzIGRldGFjaGVkIGNsb25lIG9mIGdpdmVuIG5vZGUqL1xuICAgIGNsb25lU3VidHJlZShub2RlVG9Db3B5LCBjbG9uZUNvbXB1dGVkVmFsdWVzKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGNsb25lID0gdGhpcy5jbG9uZU5vZGUobm9kZVRvQ29weSk7XG5cbiAgICAgICAgbm9kZVRvQ29weS5jaGlsZEVkZ2VzLmZvckVhY2goZT0+IHtcbiAgICAgICAgICAgIHZhciBjaGlsZENsb25lID0gc2VsZi5jbG9uZVN1YnRyZWUoZS5jaGlsZE5vZGUsIGNsb25lQ29tcHV0ZWRWYWx1ZXMpO1xuICAgICAgICAgICAgY2hpbGRDbG9uZS4kcGFyZW50ID0gY2xvbmU7XG4gICAgICAgICAgICB2YXIgZWRnZSA9IG5ldyBkb21haW4uRWRnZShjbG9uZSwgY2hpbGRDbG9uZSwgZS5uYW1lLCBlLnBheW9mZiwgZS5wcm9iYWJpbGl0eSk7XG4gICAgICAgICAgICBpZiAoY2xvbmVDb21wdXRlZFZhbHVlcykge1xuICAgICAgICAgICAgICAgIGVkZ2UuY29tcHV0ZWQgPSBVdGlscy5jbG9uZURlZXAoZS5jb21wdXRlZClcbiAgICAgICAgICAgICAgICBjaGlsZENsb25lLmNvbXB1dGVkID0gVXRpbHMuY2xvbmVEZWVwKGUuY2hpbGROb2RlLmNvbXB1dGVkKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xvbmUuY2hpbGRFZGdlcy5wdXNoKGVkZ2UpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGNsb25lQ29tcHV0ZWRWYWx1ZXMpIHtcbiAgICAgICAgICAgIGNsb25lLmNvbXB1dGVkID0gVXRpbHMuY2xvbmVEZWVwKG5vZGVUb0NvcHkuY29tcHV0ZWQpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNsb25lO1xuICAgIH1cblxuICAgIC8qYXR0YWNoZXMgZGV0YWNoZWQgc3VidHJlZSB0byBnaXZlbiBwYXJlbnQqL1xuICAgIGF0dGFjaFN1YnRyZWUobm9kZVRvQXR0YWNoLCBwYXJlbnQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgbm9kZU9yRWRnZSA9IHNlbGYuYWRkTm9kZShub2RlVG9BdHRhY2gsIHBhcmVudCk7XG5cbiAgICAgICAgdmFyIGNoaWxkRWRnZXMgPSBzZWxmLmdldEFsbERlc2NlbmRhbnRFZGdlcyhub2RlVG9BdHRhY2gpO1xuICAgICAgICBjaGlsZEVkZ2VzLmZvckVhY2goZT0+IHtcbiAgICAgICAgICAgIHNlbGYuZWRnZXMucHVzaChlKTtcbiAgICAgICAgICAgIHNlbGYubm9kZXMucHVzaChlLmNoaWxkTm9kZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBub2RlT3JFZGdlO1xuICAgIH1cblxuICAgIGNsb25lTm9kZXMobm9kZXMpIHtcbiAgICAgICAgdmFyIHJvb3RzID0gW11cbiAgICAgICAgLy9UT0RPXG4gICAgfVxuXG4gICAgLypzaGFsbG93IGNsb25lIHdpdGhvdXQgcGFyZW50IGFuZCBjaGlsZHJlbiovXG4gICAgY2xvbmVOb2RlKG5vZGUpIHtcbiAgICAgICAgdmFyIGNsb25lID0gVXRpbHMuY2xvbmUobm9kZSlcbiAgICAgICAgY2xvbmUuJGlkID0gVXRpbHMuZ3VpZCgpO1xuICAgICAgICBjbG9uZS5sb2NhdGlvbiA9IFV0aWxzLmNsb25lKG5vZGUubG9jYXRpb24pO1xuICAgICAgICBjbG9uZS5jb21wdXRlZCA9IFV0aWxzLmNsb25lKG5vZGUuY29tcHV0ZWQpO1xuICAgICAgICBjbG9uZS4kcGFyZW50ID0gbnVsbDtcbiAgICAgICAgY2xvbmUuY2hpbGRFZGdlcyA9IFtdO1xuICAgICAgICByZXR1cm4gY2xvbmU7XG4gICAgfVxuXG4gICAgZmluZE5vZGVCeUlkKGlkKSB7XG4gICAgICAgIHJldHVybiBVdGlscy5maW5kKHRoaXMubm9kZXMsIG49Pm4uJGlkID09IGlkKTtcbiAgICB9XG5cbiAgICBmaW5kRWRnZUJ5SWQoaWQpIHtcbiAgICAgICAgcmV0dXJuIFV0aWxzLmZpbmQodGhpcy5lZGdlcywgZT0+ZS4kaWQgPT0gaWQpO1xuICAgIH1cblxuICAgIGZpbmRCeUlkKGlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5maW5kTm9kZUJ5SWQoaWQpO1xuICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZEVkZ2VCeUlkKGlkKTtcbiAgICB9XG5cbiAgICBfcmVtb3ZlTm9kZShub2RlKSB7Ly8gc2ltcGx5IHJlbW92ZXMgbm9kZSBmcm9tIG5vZGUgbGlzdFxuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLm5vZGVzLmluZGV4T2Yobm9kZSk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICB0aGlzLm5vZGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW1vdmVFZGdlKGVkZ2UpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gZWRnZS5wYXJlbnROb2RlLmNoaWxkRWRnZXMuaW5kZXhPZihlZGdlKTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIGVkZ2UucGFyZW50Tm9kZS5jaGlsZEVkZ2VzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcmVtb3ZlRWRnZShlZGdlKTtcbiAgICB9XG5cbiAgICBfcmVtb3ZlRWRnZShlZGdlKSB7IC8vcmVtb3ZlcyBlZGdlIGZyb20gZWRnZSBsaXN0IHdpdGhvdXQgcmVtb3ZpbmcgY29ubmVjdGVkIG5vZGVzXG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuZWRnZXMuaW5kZXhPZihlZGdlKTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHRoaXMuZWRnZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9yZW1vdmVOb2Rlcyhub2Rlc1RvUmVtb3ZlKSB7XG4gICAgICAgIHRoaXMubm9kZXMgPSB0aGlzLm5vZGVzLmZpbHRlcihuPT5ub2Rlc1RvUmVtb3ZlLmluZGV4T2YobikgPT09IC0xKTtcbiAgICB9XG5cbiAgICBfcmVtb3ZlRWRnZXMoZWRnZXNUb1JlbW92ZSkge1xuICAgICAgICB0aGlzLmVkZ2VzID0gdGhpcy5lZGdlcy5maWx0ZXIoZT0+ZWRnZXNUb1JlbW92ZS5pbmRleE9mKGUpID09PSAtMSk7XG4gICAgfVxuXG4gICAgZ2V0QWxsRGVzY2VuZGFudEVkZ2VzKG5vZGUpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG5cbiAgICAgICAgbm9kZS5jaGlsZEVkZ2VzLmZvckVhY2goZT0+IHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGUpO1xuICAgICAgICAgICAgaWYgKGUuY2hpbGROb2RlKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goLi4uc2VsZi5nZXRBbGxEZXNjZW5kYW50RWRnZXMoZS5jaGlsZE5vZGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBnZXRBbGxEZXNjZW5kYW50Tm9kZXMobm9kZSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgICAgICBub2RlLmNoaWxkRWRnZXMuZm9yRWFjaChlPT4ge1xuICAgICAgICAgICAgaWYgKGUuY2hpbGROb2RlKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goZS5jaGlsZE5vZGUpO1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKC4uLnNlbGYuZ2V0QWxsRGVzY2VuZGFudE5vZGVzKGUuY2hpbGROb2RlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZ2V0QWxsTm9kZXNJblN1YnRyZWUobm9kZSkge1xuICAgICAgICB2YXIgZGVzY2VuZGFudHMgPSB0aGlzLmdldEFsbERlc2NlbmRhbnROb2Rlcyhub2RlKTtcbiAgICAgICAgZGVzY2VuZGFudHMudW5zaGlmdChub2RlKTtcbiAgICAgICAgcmV0dXJuIGRlc2NlbmRhbnRzO1xuICAgIH1cblxuICAgIGlzVW5kb0F2YWlsYWJsZSgpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy51bmRvU3RhY2subGVuZ3RoXG4gICAgfVxuXG4gICAgaXNSZWRvQXZhaWxhYmxlKCkge1xuICAgICAgICByZXR1cm4gISF0aGlzLnJlZG9TdGFjay5sZW5ndGhcbiAgICB9XG5cbiAgICBjcmVhdGVTdGF0ZVNuYXBzaG90KHJldmVydENvbmYpe1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmV2ZXJ0Q29uZjogcmV2ZXJ0Q29uZixcbiAgICAgICAgICAgIG5vZGVzOiBVdGlscy5jbG9uZURlZXAodGhpcy5ub2RlcyksXG4gICAgICAgICAgICBlZGdlczogVXRpbHMuY2xvbmVEZWVwKHRoaXMuZWRnZXMpLFxuICAgICAgICAgICAgdGV4dHM6IFV0aWxzLmNsb25lRGVlcCh0aGlzLnRleHRzKSxcbiAgICAgICAgICAgIHBheW9mZk5hbWVzOiBVdGlscy5jbG9uZURlZXAodGhpcy5wYXlvZmZOYW1lcyksXG4gICAgICAgICAgICBkZWZhdWx0V1RQOiBVdGlscy5jbG9uZURlZXAodGhpcy5kZWZhdWx0V1RQKSxcbiAgICAgICAgICAgIG1pbmltdW1XVFA6IFV0aWxzLmNsb25lRGVlcCh0aGlzLm1pbmltdW1XVFApLFxuICAgICAgICAgICAgbWF4aW11bVdUUDogVXRpbHMuY2xvbmVEZWVwKHRoaXMubWF4aW11bVdUUCksXG4gICAgICAgICAgICBleHByZXNzaW9uU2NvcGU6IFV0aWxzLmNsb25lRGVlcCh0aGlzLmV4cHJlc3Npb25TY29wZSksXG4gICAgICAgICAgICBjb2RlOiB0aGlzLmNvZGUsXG4gICAgICAgICAgICAkY29kZUVycm9yOiB0aGlzLiRjb2RlRXJyb3JcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgc2F2ZVN0YXRlRnJvbVNuYXBzaG90KHN0YXRlKXtcbiAgICAgICAgdGhpcy5yZWRvU3RhY2subGVuZ3RoID0gMDtcblxuICAgICAgICB0aGlzLl9wdXNoVG9TdGFjayh0aGlzLnVuZG9TdGFjaywgc3RhdGUpO1xuXG4gICAgICAgIHRoaXMuX2ZpcmVVbmRvUmVkb0NhbGxiYWNrKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2F2ZVN0YXRlKHJldmVydENvbmYpIHtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGVGcm9tU25hcHNob3QodGhpcy5jcmVhdGVTdGF0ZVNuYXBzaG90KHJldmVydENvbmYpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdW5kbygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgbmV3U3RhdGUgPSB0aGlzLnVuZG9TdGFjay5wb3AoKTtcbiAgICAgICAgaWYgKCFuZXdTdGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcHVzaFRvU3RhY2sodGhpcy5yZWRvU3RhY2ssIHtcbiAgICAgICAgICAgIHJldmVydENvbmY6IG5ld1N0YXRlLnJldmVydENvbmYsXG4gICAgICAgICAgICBub2Rlczogc2VsZi5ub2RlcyxcbiAgICAgICAgICAgIGVkZ2VzOiBzZWxmLmVkZ2VzLFxuICAgICAgICAgICAgdGV4dHM6IHNlbGYudGV4dHMsXG4gICAgICAgICAgICBwYXlvZmZOYW1lczogc2VsZi5wYXlvZmZOYW1lcyxcbiAgICAgICAgICAgIGRlZmF1bHRXVFA6IHNlbGYuZGVmYXVsdFdUUCxcbiAgICAgICAgICAgIG1pbmltdW1XVFA6IHNlbGYubWluaW11bVdUUCxcbiAgICAgICAgICAgIG1heGltdW1XVFA6IHNlbGYubWF4aW11bVdUUCxcbiAgICAgICAgICAgIGV4cHJlc3Npb25TY29wZTogc2VsZi5leHByZXNzaW9uU2NvcGUsXG4gICAgICAgICAgICBjb2RlOiBzZWxmLmNvZGUsXG4gICAgICAgICAgICAkY29kZUVycm9yOiBzZWxmLiRjb2RlRXJyb3JcblxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl9zZXROZXdTdGF0ZShuZXdTdGF0ZSk7XG5cbiAgICAgICAgdGhpcy5fZmlyZVVuZG9SZWRvQ2FsbGJhY2soKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICByZWRvKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBuZXdTdGF0ZSA9IHRoaXMucmVkb1N0YWNrLnBvcCgpO1xuICAgICAgICBpZiAoIW5ld1N0YXRlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9wdXNoVG9TdGFjayh0aGlzLnVuZG9TdGFjaywge1xuICAgICAgICAgICAgcmV2ZXJ0Q29uZjogbmV3U3RhdGUucmV2ZXJ0Q29uZixcbiAgICAgICAgICAgIG5vZGVzOiBzZWxmLm5vZGVzLFxuICAgICAgICAgICAgZWRnZXM6IHNlbGYuZWRnZXMsXG4gICAgICAgICAgICB0ZXh0czogc2VsZi50ZXh0cyxcbiAgICAgICAgICAgIHBheW9mZk5hbWVzOiBzZWxmLnBheW9mZk5hbWVzLFxuICAgICAgICAgICAgZGVmYXVsdFdUUDogc2VsZi5kZWZhdWx0V1RQLFxuICAgICAgICAgICAgbWluaW11bVdUUDogc2VsZi5taW5pbXVtV1RQLFxuICAgICAgICAgICAgbWF4aW11bVdUUDogc2VsZi5tYXhpbXVtV1RQLFxuICAgICAgICAgICAgZXhwcmVzc2lvblNjb3BlOiBzZWxmLmV4cHJlc3Npb25TY29wZSxcbiAgICAgICAgICAgIGNvZGU6IHNlbGYuY29kZSxcbiAgICAgICAgICAgICRjb2RlRXJyb3I6IHNlbGYuJGNvZGVFcnJvclxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl9zZXROZXdTdGF0ZShuZXdTdGF0ZSwgdHJ1ZSk7XG5cbiAgICAgICAgdGhpcy5fZmlyZVVuZG9SZWRvQ2FsbGJhY2soKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5ub2Rlcy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLmVkZ2VzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMudW5kb1N0YWNrLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMucmVkb1N0YWNrLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMudGV4dHMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5jbGVhckV4cHJlc3Npb25TY29wZSgpO1xuICAgICAgICB0aGlzLmNvZGUgPSAnJztcbiAgICAgICAgdGhpcy4kY29kZUVycm9yID0gbnVsbDtcbiAgICAgICAgdGhpcy4kY29kZURpcnR5ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgYWRkVGV4dCh0ZXh0KSB7XG4gICAgICAgIHRoaXMudGV4dHMucHVzaCh0ZXh0KTtcblxuICAgICAgICB0aGlzLl9maXJlVGV4dEFkZGVkQ2FsbGJhY2sodGV4dCk7XG4gICAgfVxuXG4gICAgcmVtb3ZlVGV4dHModGV4dHMpIHtcbiAgICAgICAgdGV4dHMuZm9yRWFjaCh0PT50aGlzLnJlbW92ZVRleHQodCkpO1xuICAgIH1cblxuICAgIHJlbW92ZVRleHQodGV4dCkge1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLnRleHRzLmluZGV4T2YodGV4dCk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICB0aGlzLnRleHRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB0aGlzLl9maXJlVGV4dFJlbW92ZWRDYWxsYmFjayh0ZXh0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsZWFyRXhwcmVzc2lvblNjb3BlKCkge1xuICAgICAgICBVdGlscy5mb3JPd24odGhpcy5leHByZXNzaW9uU2NvcGUsICh2YWx1ZSwga2V5KT0+IHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmV4cHJlc3Npb25TY29wZVtrZXldO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXZlcnNlUGF5b2Zmcygpe1xuICAgICAgICB0aGlzLnBheW9mZk5hbWVzLnJldmVyc2UoKTtcbiAgICAgICAgdGhpcy5lZGdlcy5mb3JFYWNoKGU9PmUucGF5b2ZmLnJldmVyc2UoKSlcbiAgICB9XG5cbiAgICBfc2V0TmV3U3RhdGUobmV3U3RhdGUsIHJlZG8pIHtcbiAgICAgICAgdmFyIG5vZGVCeUlkID0gVXRpbHMuZ2V0T2JqZWN0QnlJZE1hcChuZXdTdGF0ZS5ub2Rlcyk7XG4gICAgICAgIHZhciBlZGdlQnlJZCA9IFV0aWxzLmdldE9iamVjdEJ5SWRNYXAobmV3U3RhdGUuZWRnZXMpO1xuICAgICAgICB0aGlzLm5vZGVzID0gbmV3U3RhdGUubm9kZXM7XG4gICAgICAgIHRoaXMuZWRnZXMgPSBuZXdTdGF0ZS5lZGdlcztcbiAgICAgICAgdGhpcy50ZXh0cyA9IG5ld1N0YXRlLnRleHRzO1xuICAgICAgICB0aGlzLnBheW9mZk5hbWVzID0gbmV3U3RhdGUucGF5b2ZmTmFtZXM7XG4gICAgICAgIHRoaXMuZGVmYXVsdFdUUCA9IG5ld1N0YXRlLmRlZmF1bHRXVFA7XG4gICAgICAgIHRoaXMubWluaW11bVdUUCA9IG5ld1N0YXRlLm1pbmltdW1XVFA7XG4gICAgICAgIHRoaXMubWF4aW11bVdUUCA9IG5ld1N0YXRlLm1heGltdW1XVFA7XG4gICAgICAgIHRoaXMuZXhwcmVzc2lvblNjb3BlID0gbmV3U3RhdGUuZXhwcmVzc2lvblNjb3BlO1xuICAgICAgICB0aGlzLmNvZGUgPSBuZXdTdGF0ZS5jb2RlO1xuICAgICAgICB0aGlzLiRjb2RlRXJyb3IgID0gbmV3U3RhdGUuJGNvZGVFcnJvclxuXG4gICAgICAgIHRoaXMubm9kZXMuZm9yRWFjaChuPT4ge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuLmNoaWxkRWRnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZWRnZSA9IGVkZ2VCeUlkW24uY2hpbGRFZGdlc1tpXS4kaWRdO1xuICAgICAgICAgICAgICAgIG4uY2hpbGRFZGdlc1tpXSA9IGVkZ2U7XG4gICAgICAgICAgICAgICAgZWRnZS5wYXJlbnROb2RlID0gbjtcbiAgICAgICAgICAgICAgICBlZGdlLmNoaWxkTm9kZSA9IG5vZGVCeUlkW2VkZ2UuY2hpbGROb2RlLiRpZF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKG5ld1N0YXRlLnJldmVydENvbmYpIHtcbiAgICAgICAgICAgIGlmICghcmVkbyAmJiBuZXdTdGF0ZS5yZXZlcnRDb25mLm9uVW5kbykge1xuICAgICAgICAgICAgICAgIG5ld1N0YXRlLnJldmVydENvbmYub25VbmRvKG5ld1N0YXRlLnJldmVydENvbmYuZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVkbyAmJiBuZXdTdGF0ZS5yZXZlcnRDb25mLm9uUmVkbykge1xuICAgICAgICAgICAgICAgIG5ld1N0YXRlLnJldmVydENvbmYub25SZWRvKG5ld1N0YXRlLnJldmVydENvbmYuZGF0YSk7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICB9XG4gICAgICAgIHRoaXMucmV2ZXJ0Q29uZiA9IG5ld1N0YXRlLnJldmVydENvbmY7XG4gICAgfVxuXG5cbiAgICBfcHVzaFRvU3RhY2soc3RhY2ssIG9iaikge1xuICAgICAgICBpZiAoc3RhY2subGVuZ3RoID49IHRoaXMubWF4U3RhY2tTaXplKSB7XG4gICAgICAgICAgICBzdGFjay5zaGlmdCgpO1xuICAgICAgICB9XG4gICAgICAgIHN0YWNrLnB1c2gob2JqKTtcbiAgICB9XG5cbiAgICBfZmlyZVVuZG9SZWRvQ2FsbGJhY2soKSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLnVuZG9SZWRvU3RhdGVDaGFuZ2VkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMudW5kb1JlZG9TdGF0ZUNoYW5nZWRDYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhub2RlKSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLm5vZGVBZGRlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLm5vZGVBZGRlZENhbGxiYWNrKG5vZGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpcmVOb2RlUmVtb3ZlZENhbGxiYWNrKG5vZGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc0Rpc2FibGVkICYmIHRoaXMubm9kZVJlbW92ZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy5ub2RlUmVtb3ZlZENhbGxiYWNrKG5vZGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpcmVUZXh0QWRkZWRDYWxsYmFjayh0ZXh0KSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLnRleHRBZGRlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLnRleHRBZGRlZENhbGxiYWNrKHRleHQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpcmVUZXh0UmVtb3ZlZENhbGxiYWNrKHRleHQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc0Rpc2FibGVkICYmIHRoaXMudGV4dFJlbW92ZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy50ZXh0UmVtb3ZlZENhbGxiYWNrKHRleHQpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHtPYmplY3RXaXRoQ29tcHV0ZWRWYWx1ZXN9IGZyb20gXCIuL29iamVjdC13aXRoLWNvbXB1dGVkLXZhbHVlc1wiO1xuXG5leHBvcnQgY2xhc3MgRWRnZSBleHRlbmRzIE9iamVjdFdpdGhDb21wdXRlZFZhbHVlcyB7XG4gICAgcGFyZW50Tm9kZTtcbiAgICBjaGlsZE5vZGU7XG5cbiAgICBuYW1lID0gJyc7XG4gICAgcHJvYmFiaWxpdHkgPSB1bmRlZmluZWQ7XG4gICAgcGF5b2ZmID0gWzAsIDBdO1xuXG4gICAgJERJU1BMQVlfVkFMVUVfTkFNRVMgPSBbJ3Byb2JhYmlsaXR5JywgJ3BheW9mZicsICdvcHRpbWFsJ107XG5cbiAgICBjb25zdHJ1Y3RvcihwYXJlbnROb2RlLCBjaGlsZE5vZGUsIG5hbWUsIHBheW9mZiwgcHJvYmFiaWxpdHksKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMucGFyZW50Tm9kZSA9IHBhcmVudE5vZGU7XG4gICAgICAgIHRoaXMuY2hpbGROb2RlID0gY2hpbGROb2RlO1xuXG4gICAgICAgIGlmIChuYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByb2JhYmlsaXR5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMucHJvYmFiaWxpdHkgPSBwcm9iYWJpbGl0eTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGF5b2ZmICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMucGF5b2ZmID0gcGF5b2ZmXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHNldE5hbWUobmFtZSkge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXRQcm9iYWJpbGl0eShwcm9iYWJpbGl0eSkge1xuICAgICAgICB0aGlzLnByb2JhYmlsaXR5ID0gcHJvYmFiaWxpdHk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldFBheW9mZihwYXlvZmYsIGluZGV4ID0gMCkge1xuICAgICAgICB0aGlzLnBheW9mZltpbmRleF0gPSBwYXlvZmY7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNvbXB1dGVkQmFzZVByb2JhYmlsaXR5KHZhbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb21wdXRlZFZhbHVlKG51bGwsICdwcm9iYWJpbGl0eScsIHZhbCk7XG4gICAgfVxuXG4gICAgY29tcHV0ZWRCYXNlUGF5b2ZmKHZhbCwgaW5kZXggPSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVkVmFsdWUobnVsbCwgJ3BheW9mZlsnICsgaW5kZXggKyAnXScsIHZhbCk7XG4gICAgfVxuXG4gICAgZGlzcGxheVByb2JhYmlsaXR5KHZhbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kaXNwbGF5VmFsdWUoJ3Byb2JhYmlsaXR5JywgdmFsKTtcbiAgICB9XG5cbiAgICBkaXNwbGF5UGF5b2ZmKHZhbCwgaW5kZXggPSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRpc3BsYXlWYWx1ZSgncGF5b2ZmWycgKyBpbmRleCArICddJywgdmFsKTtcbiAgICB9XG59XG4iLCJleHBvcnQgKiBmcm9tICcuL25vZGUvbm9kZSdcbmV4cG9ydCAqIGZyb20gJy4vbm9kZS9kZWNpc2lvbi1ub2RlJ1xuZXhwb3J0ICogZnJvbSAnLi9ub2RlL2NoYW5jZS1ub2RlJ1xuZXhwb3J0ICogZnJvbSAnLi9ub2RlL3Rlcm1pbmFsLW5vZGUnXG5leHBvcnQgKiBmcm9tICcuL2VkZ2UnXG5leHBvcnQgKiBmcm9tICcuL3BvaW50J1xuZXhwb3J0ICogZnJvbSAnLi90ZXh0J1xuIiwiaW1wb3J0IHtOb2RlfSBmcm9tICcuL25vZGUnXG5cbmV4cG9ydCBjbGFzcyBDaGFuY2VOb2RlIGV4dGVuZHMgTm9kZXtcblxuICAgIHN0YXRpYyAkVFlQRSA9ICdjaGFuY2UnO1xuXG4gICAgY29uc3RydWN0b3IobG9jYXRpb24pe1xuICAgICAgICBzdXBlcihDaGFuY2VOb2RlLiRUWVBFLCBsb2NhdGlvbik7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtOb2RlfSBmcm9tICcuL25vZGUnXG5cbmV4cG9ydCBjbGFzcyBEZWNpc2lvbk5vZGUgZXh0ZW5kcyBOb2Rle1xuXG4gICAgc3RhdGljICRUWVBFID0gJ2RlY2lzaW9uJztcblxuICAgIGNvbnN0cnVjdG9yKGxvY2F0aW9uKXtcbiAgICAgICAgc3VwZXIoRGVjaXNpb25Ob2RlLiRUWVBFLCBsb2NhdGlvbik7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtQb2ludH0gZnJvbSAnLi4vcG9pbnQnXG5pbXBvcnQge09iamVjdFdpdGhDb21wdXRlZFZhbHVlc30gZnJvbSAnLi4vb2JqZWN0LXdpdGgtY29tcHV0ZWQtdmFsdWVzJ1xuXG5leHBvcnQgY2xhc3MgTm9kZSBleHRlbmRzIE9iamVjdFdpdGhDb21wdXRlZFZhbHVlc3tcblxuICAgIHR5cGU7XG4gICAgY2hpbGRFZGdlcz1bXTtcbiAgICBuYW1lPScnO1xuXG4gICAgbG9jYXRpb247IC8vUG9pbnRcblxuICAgIGNvZGU9Jyc7XG4gICAgJGNvZGVEaXJ0eSA9IGZhbHNlOyAvLyBpcyBjb2RlIGNoYW5nZWQgd2l0aG91dCByZWV2YWx1YXRpb24/XG4gICAgJGNvZGVFcnJvciA9IG51bGw7IC8vY29kZSBldmFsdWF0aW9uIGVycm9yc1xuXG4gICAgZXhwcmVzc2lvblNjb3BlPW51bGw7XG5cbiAgICAkRElTUExBWV9WQUxVRV9OQU1FUyA9IFsnY2hpbGRyZW5QYXlvZmYnLCAnYWdncmVnYXRlZFBheW9mZicsICdwcm9iYWJpbGl0eVRvRW50ZXInLCAnb3B0aW1hbCddXG5cbiAgICBjb25zdHJ1Y3Rvcih0eXBlLCBsb2NhdGlvbil7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMubG9jYXRpb249bG9jYXRpb247XG4gICAgICAgIGlmKCFsb2NhdGlvbil7XG4gICAgICAgICAgICB0aGlzLmxvY2F0aW9uID0gbmV3IFBvaW50KDAsMCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50eXBlPXR5cGU7XG4gICAgfVxuXG4gICAgc2V0TmFtZShuYW1lKXtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbW92ZVRvKHgseSwgd2l0aENoaWxkcmVuKXsgLy9tb3ZlIHRvIG5ldyBsb2NhdGlvblxuICAgICAgICBpZih3aXRoQ2hpbGRyZW4pe1xuICAgICAgICAgICAgdmFyIGR4ID0geC10aGlzLmxvY2F0aW9uLng7XG4gICAgICAgICAgICB2YXIgZHkgPSB5LXRoaXMubG9jYXRpb24ueTtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PmUuY2hpbGROb2RlLm1vdmUoZHgsIGR5LCB0cnVlKSlcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubG9jYXRpb24ubW92ZVRvKHgseSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIG1vdmUoZHgsIGR5LCB3aXRoQ2hpbGRyZW4peyAvL21vdmUgYnkgdmVjdG9yXG4gICAgICAgIGlmKHdpdGhDaGlsZHJlbil7XG4gICAgICAgICAgICB0aGlzLmNoaWxkRWRnZXMuZm9yRWFjaChlPT5lLmNoaWxkTm9kZS5tb3ZlKGR4LCBkeSwgdHJ1ZSkpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sb2NhdGlvbi5tb3ZlKGR4LCBkeSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cbiIsImltcG9ydCB7Tm9kZX0gZnJvbSAnLi9ub2RlJ1xuXG5leHBvcnQgY2xhc3MgVGVybWluYWxOb2RlIGV4dGVuZHMgTm9kZXtcblxuICAgIHN0YXRpYyAkVFlQRSA9ICd0ZXJtaW5hbCc7XG5cbiAgICBjb25zdHJ1Y3Rvcihsb2NhdGlvbil7XG4gICAgICAgIHN1cGVyKFRlcm1pbmFsTm9kZS4kVFlQRSwgbG9jYXRpb24pO1xuICAgIH1cbn1cbiIsImltcG9ydCB7VXRpbHN9IGZyb20gJ3NkLXV0aWxzJ1xuXG5pbXBvcnQge09iamVjdFdpdGhJZEFuZEVkaXRhYmxlRmllbGRzfSBmcm9tIFwiLi9vYmplY3Qtd2l0aC1pZC1hbmQtZWRpdGFibGUtZmllbGRzXCI7XG5cbmV4cG9ydCBjbGFzcyBPYmplY3RXaXRoQ29tcHV0ZWRWYWx1ZXMgZXh0ZW5kcyBPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkc3tcblxuICAgIGNvbXB1dGVkPXt9OyAvL2NvbXB1dGVkIHZhbHVlc1xuXG4gICAgLypnZXQgb3Igc2V0IGNvbXB1dGVkIHZhbHVlKi9cbiAgICBjb21wdXRlZFZhbHVlKHJ1bGVOYW1lLCBmaWVsZFBhdGgsIHZhbHVlKXtcbiAgICAgICAgdmFyIHBhdGggPSAnY29tcHV0ZWQuJztcbiAgICAgICAgaWYocnVsZU5hbWUpe1xuICAgICAgICAgICAgcGF0aCs9cnVsZU5hbWUrJy4nO1xuICAgICAgICB9XG4gICAgICAgIHBhdGgrPWZpZWxkUGF0aDtcbiAgICAgICAgaWYodmFsdWU9PT11bmRlZmluZWQpe1xuICAgICAgICAgICAgcmV0dXJuICBVdGlscy5nZXQodGhpcywgcGF0aCwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgVXRpbHMuc2V0KHRoaXMsIHBhdGgsIHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIGNsZWFyQ29tcHV0ZWRWYWx1ZXMocnVsZU5hbWUpe1xuICAgICAgICBpZihydWxlTmFtZT09dW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHRoaXMuY29tcHV0ZWQ9e307XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYoVXRpbHMuaXNBcnJheShydWxlTmFtZSkpe1xuICAgICAgICAgICAgcnVsZU5hbWUuZm9yRWFjaChuPT57XG4gICAgICAgICAgICAgICAgdGhpcy5jb21wdXRlZFtuXT17fTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29tcHV0ZWRbcnVsZU5hbWVdPXt9O1xuICAgIH1cblxuICAgIGNsZWFyRGlzcGxheVZhbHVlcygpe1xuICAgICAgICB0aGlzLmNvbXB1dGVkWyckZGlzcGxheVZhbHVlcyddPXt9O1xuICAgIH1cblxuICAgIGRpc3BsYXlWYWx1ZShmaWVsZFBhdGgsIHZhbHVlKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcHV0ZWRWYWx1ZShudWxsLCAnJGRpc3BsYXlWYWx1ZXMuJytmaWVsZFBhdGgsIHZhbHVlKTtcbiAgICB9XG5cbiAgICBsb2FkQ29tcHV0ZWRWYWx1ZXMoY29tcHV0ZWQpe1xuICAgICAgICB0aGlzLmNvbXB1dGVkID0gY29tcHV0ZWQ7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtVdGlsc30gZnJvbSAnc2QtdXRpbHMnXG5cbmV4cG9ydCBjbGFzcyBPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkcyB7XG5cbiAgICAkaWQgPSBVdGlscy5ndWlkKCk7IC8vaW50ZXJuYWwgaWRcbiAgICAkZmllbGRTdGF0dXM9e307XG5cbiAgICBnZXRGaWVsZFN0YXR1cyhmaWVsZFBhdGgpe1xuICAgICAgICBpZighVXRpbHMuZ2V0KHRoaXMuJGZpZWxkU3RhdHVzLCBmaWVsZFBhdGgsIG51bGwpKXtcbiAgICAgICAgICAgIFV0aWxzLnNldCh0aGlzLiRmaWVsZFN0YXR1cywgZmllbGRQYXRoLCB7XG4gICAgICAgICAgICAgICAgdmFsaWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgc3ludGF4OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBVdGlscy5nZXQodGhpcy4kZmllbGRTdGF0dXMsIGZpZWxkUGF0aCk7XG4gICAgfVxuXG4gICAgc2V0U3ludGF4VmFsaWRpdHkoZmllbGRQYXRoLCB2YWxpZCl7XG4gICAgICAgIHZhciBmaWVsZFN0YXR1cyA9IHRoaXMuZ2V0RmllbGRTdGF0dXMoZmllbGRQYXRoKTtcbiAgICAgICAgZmllbGRTdGF0dXMudmFsaWQuc3ludGF4ID0gdmFsaWQ7XG4gICAgfVxuXG4gICAgc2V0VmFsdWVWYWxpZGl0eShmaWVsZFBhdGgsIHZhbGlkKXtcbiAgICAgICAgdmFyIGZpZWxkU3RhdHVzID0gdGhpcy5nZXRGaWVsZFN0YXR1cyhmaWVsZFBhdGgpO1xuICAgICAgICBmaWVsZFN0YXR1cy52YWxpZC52YWx1ZSA9IHZhbGlkO1xuICAgIH1cblxuICAgIGlzRmllbGRWYWxpZChmaWVsZFBhdGgsIHN5bnRheD10cnVlLCB2YWx1ZT10cnVlKXtcbiAgICAgICAgdmFyIGZpZWxkU3RhdHVzID0gdGhpcy5nZXRGaWVsZFN0YXR1cyhmaWVsZFBhdGgpO1xuICAgICAgICBpZihzeW50YXggJiYgdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZFN0YXR1cy52YWxpZC5zeW50YXggJiYgZmllbGRTdGF0dXMudmFsaWQudmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYoc3ludGF4KSB7XG4gICAgICAgICAgICByZXR1cm4gZmllbGRTdGF0dXMudmFsaWQuc3ludGF4XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpZWxkU3RhdHVzLnZhbGlkLnZhbHVlO1xuICAgIH1cblxuXG59XG4iLCJleHBvcnQgY2xhc3MgUG9pbnQge1xuICAgIHg7XG4gICAgeTtcbiAgICBjb25zdHJ1Y3Rvcih4LHkpe1xuICAgICAgICBpZih4IGluc3RhbmNlb2YgUG9pbnQpe1xuICAgICAgICAgICAgeT14Lnk7XG4gICAgICAgICAgICB4PXgueFxuICAgICAgICB9ZWxzZSBpZihBcnJheS5pc0FycmF5KHgpKXtcbiAgICAgICAgICAgIHk9eFsxXTtcbiAgICAgICAgICAgIHg9eFswXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLng9eDtcbiAgICAgICAgdGhpcy55PXk7XG4gICAgfVxuXG4gICAgbW92ZVRvKHgseSl7XG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoeCkpe1xuICAgICAgICAgICAgeT14WzFdO1xuICAgICAgICAgICAgeD14WzBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMueD14O1xuICAgICAgICB0aGlzLnk9eTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbW92ZShkeCxkeSl7IC8vbW92ZSBieSB2ZWN0b3JcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShkeCkpe1xuICAgICAgICAgICAgZHk9ZHhbMV07XG4gICAgICAgICAgICBkeD1keFswXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLngrPWR4O1xuICAgICAgICB0aGlzLnkrPWR5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7UG9pbnR9IGZyb20gXCIuL3BvaW50XCI7XG5pbXBvcnQge1V0aWxzfSBmcm9tIFwic2QtdXRpbHNcIjtcbmltcG9ydCB7T2JqZWN0V2l0aElkQW5kRWRpdGFibGVGaWVsZHN9IGZyb20gXCIuL29iamVjdC13aXRoLWlkLWFuZC1lZGl0YWJsZS1maWVsZHNcIjtcblxuZXhwb3J0IGNsYXNzIFRleHQgZXh0ZW5kcyBPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkc3tcblxuICAgIHZhbHVlPScnO1xuICAgIGxvY2F0aW9uOyAvL1BvaW50XG5cbiAgICBjb25zdHJ1Y3Rvcihsb2NhdGlvbiwgdmFsdWUpe1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmxvY2F0aW9uPWxvY2F0aW9uO1xuICAgICAgICBpZighbG9jYXRpb24pe1xuICAgICAgICAgICAgdGhpcy5sb2NhdGlvbiA9IG5ldyBQb2ludCgwLDApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG1vdmVUbyh4LHkpeyAvL21vdmUgdG8gbmV3IGxvY2F0aW9uXG4gICAgICAgIHRoaXMubG9jYXRpb24ubW92ZVRvKHgseSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIG1vdmUoZHgsIGR5KXsgLy9tb3ZlIGJ5IHZlY3RvclxuICAgICAgICB0aGlzLmxvY2F0aW9uLm1vdmUoZHgsIGR5KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgZG9tYWluIGZyb20gJy4vZG9tYWluJ1xuZXhwb3J0IHtkb21haW59XG5leHBvcnQgKiBmcm9tICcuL2RhdGEtbW9kZWwnXG5leHBvcnQgKiBmcm9tICcuL3ZhbGlkYXRpb24tcmVzdWx0J1xuIiwiaW1wb3J0IHtVdGlsc30gZnJvbSBcInNkLXV0aWxzXCI7XG5cbmV4cG9ydCBjbGFzcyBWYWxpZGF0aW9uUmVzdWx0e1xuXG5cbiAgICBlcnJvcnMgPSB7fTtcbiAgICB3YXJuaW5ncyA9IHt9O1xuICAgIG9iamVjdElkVG9FcnJvcj17fTtcblxuICAgIGFkZEVycm9yKGVycm9yLCBvYmope1xuICAgICAgICBpZihVdGlscy5pc1N0cmluZyhlcnJvcikpe1xuICAgICAgICAgICAgZXJyb3IgPSB7bmFtZTogZXJyb3J9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBuYW1lID0gZXJyb3IubmFtZTtcbiAgICAgICAgdmFyIGVycm9yc0J5TmFtZSA9IHRoaXMuZXJyb3JzW25hbWVdO1xuICAgICAgICBpZighZXJyb3JzQnlOYW1lKXtcbiAgICAgICAgICAgIGVycm9yc0J5TmFtZT1bXTtcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzW25hbWVdPWVycm9yc0J5TmFtZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb2JqRSA9IHRoaXMub2JqZWN0SWRUb0Vycm9yW29iai4kaWRdO1xuICAgICAgICBpZighb2JqRSl7XG4gICAgICAgICAgICBvYmpFPVtdO1xuICAgICAgICAgICAgdGhpcy5vYmplY3RJZFRvRXJyb3Jbb2JqLiRpZF09IG9iakU7XG4gICAgICAgIH1cbiAgICAgICAgZXJyb3JzQnlOYW1lLnB1c2gob2JqKTtcbiAgICAgICAgb2JqRS5wdXNoKGVycm9yKTtcbiAgICB9XG5cbiAgICBhZGRXYXJuaW5nKG5hbWUsIG9iail7XG4gICAgICAgIHZhciBlID0gdGhpcy53YXJuaW5nc1tuYW1lXTtcbiAgICAgICAgaWYoIWUpe1xuICAgICAgICAgICAgZT1bXTtcbiAgICAgICAgICAgIHRoaXMud2FybmluZ3NbbmFtZV09ZTtcbiAgICAgICAgfVxuICAgICAgICBlLnB1c2gob2JqKVxuICAgIH1cblxuICAgIGlzVmFsaWQoKXtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRoaXMuZXJyb3JzKS5sZW5ndGggPT09IDBcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlRnJvbURUTyhkdG8pe1xuICAgICAgICB2YXIgdiA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XG4gICAgICAgIHYuZXJyb3JzID0gZHRvLmVycm9ycztcbiAgICAgICAgdi53YXJuaW5ncyA9IGR0by53YXJuaW5ncztcbiAgICAgICAgdi5vYmplY3RJZFRvRXJyb3IgPSBkdG8ub2JqZWN0SWRUb0Vycm9yO1xuICAgICAgICByZXR1cm4gdjtcbiAgICB9XG59XG4iLCJleHBvcnQgKiBmcm9tICcuL3NyYy9pbmRleCdcbiJdfQ==
