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
                texts: this.texts,
                payoffNames: this.payoffNames,
                defaultWTP: this.defaultWTP,
                minimumWTP: this.minimumWTP,
                maximumWTP: this.maximumWTP
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

            if (data.payoffNames !== undefined) {
                this.payoffNames = data.payoffNames;
            }

            if (data.defaultWTP !== undefined) {
                this.defaultWTP = data.defaultWTP;
            }

            if (data.minimumWTP !== undefined) {
                this.minimumWTP = data.minimumWTP;
            }

            if (data.maximumWTP !== undefined) {
                this.maximumWTP = data.maximumWTP;
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
                if (_sdUtils.Utils.isArray(ed.payoff)) {
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

            this.payoffNames = [];
            this.defaultWTP = 1;
            this.minimumWTP = 0;
            this.maximumWTP = Infinity;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGRhdGEtbW9kZWwuanMiLCJzcmNcXGRvbWFpblxcZWRnZS5qcyIsInNyY1xcZG9tYWluXFxpbmRleC5qcyIsInNyY1xcZG9tYWluXFxub2RlXFxjaGFuY2Utbm9kZS5qcyIsInNyY1xcZG9tYWluXFxub2RlXFxkZWNpc2lvbi1ub2RlLmpzIiwic3JjXFxkb21haW5cXG5vZGVcXG5vZGUuanMiLCJzcmNcXGRvbWFpblxcbm9kZVxcdGVybWluYWwtbm9kZS5qcyIsInNyY1xcZG9tYWluXFxvYmplY3Qtd2l0aC1jb21wdXRlZC12YWx1ZXMuanMiLCJzcmNcXGRvbWFpblxcb2JqZWN0LXdpdGgtaWQtYW5kLWVkaXRhYmxlLWZpZWxkcy5qcyIsInNyY1xcZG9tYWluXFxwb2ludC5qcyIsInNyY1xcZG9tYWluXFx0ZXh0LmpzIiwic3JjXFxpbmRleC5qcyIsInNyY1xcdmFsaWRhdGlvbi1yZXN1bHQuanMiLCJpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDQUE7O0FBRUE7O0ksQUFBWTs7QUFDWjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7OztJLEFBR2Esb0IsQUFBQSx3QkFjVTtBQUZHO0FBcUJ0Qjt1QkFBQSxBQUFZLE1BQU07OEJBQUE7O2FBL0JsQixBQStCa0IsUUEvQlYsQUErQlU7YUE5QmxCLEFBOEJrQixRQTlCVixBQThCVTthQTVCbEIsQUE0QmtCLFFBNUJWLEFBNEJVO2FBM0JsQixBQTJCa0IsY0EzQkosQUEyQkk7YUExQmxCLEFBMEJrQixhQTFCTCxBQTBCSzthQXpCbEIsQUF5QmtCLGFBekJMLEFBeUJLO2FBeEJsQixBQXdCa0IsYUF4QkwsQUF3Qks7YUFyQmxCLEFBcUJrQixrQkFyQkEsQUFxQkE7YUFwQmxCLEFBb0JrQixPQXBCWCxBQW9CVzthQW5CbEIsQUFtQmtCLGFBbkJMLEFBbUJLO2FB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a0JBQWtCLElBQXBCLEFBQXdCLEFBQ3hCO21CQUFBLEFBQU8sQUFDVjs7Ozs7Ozs7Ozs7Ozs7OztBQy9DTCwyQ0FBQTtpREFBQTs7Z0JBQUE7d0JBQUE7b0JBQUE7QUFBQTtBQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB7VXRpbHN9IGZyb20gJ3NkLXV0aWxzJ1xuaW1wb3J0IHtsb2d9IGZyb20gXCJzZC11dGlsc1wiO1xuaW1wb3J0ICogYXMgZG9tYWluIGZyb20gJy4vZG9tYWluJ1xuaW1wb3J0IHtWYWxpZGF0aW9uUmVzdWx0fSBmcm9tICcuL3ZhbGlkYXRpb24tcmVzdWx0J1xuXG4vKlxuICogRGF0YSBtb2RlbCBtYW5hZ2VyXG4gKiAqL1xuZXhwb3J0IGNsYXNzIERhdGFNb2RlbCB7XG5cbiAgICBub2RlcyA9IFtdO1xuICAgIGVkZ2VzID0gW107XG5cbiAgICB0ZXh0cyA9IFtdOyAvL2Zsb2F0aW5nIHRleHRzXG4gICAgcGF5b2ZmTmFtZXMgPSBbXTtcbiAgICBkZWZhdWx0V1RQID0gMTtcbiAgICBtaW5pbXVtV1RQID0gMDtcbiAgICBtYXhpbXVtV1RQID0gSW5maW5pdHk7XG5cblxuICAgIGV4cHJlc3Npb25TY29wZSA9IHt9OyAvL2dsb2JhbCBleHByZXNzaW9uIHNjb3BlXG4gICAgY29kZSA9IFwiXCI7Ly9nbG9iYWwgZXhwcmVzc2lvbiBjb2RlXG4gICAgJGNvZGVFcnJvciA9IG51bGw7IC8vY29kZSBldmFsdWF0aW9uIGVycm9yc1xuICAgICRjb2RlRGlydHkgPSBmYWxzZTsgLy8gaXMgY29kZSBjaGFuZ2VkIHdpdGhvdXQgcmVldmFsdWF0aW9uP1xuICAgICR2ZXJzaW9uPTE7XG5cbiAgICB2YWxpZGF0aW9uUmVzdWx0cyA9IFtdO1xuXG4gICAgLy8gdW5kbyAvIHJlZG9cbiAgICBtYXhTdGFja1NpemUgPSAyMDtcbiAgICB1bmRvU3RhY2sgPSBbXTtcbiAgICByZWRvU3RhY2sgPSBbXTtcbiAgICB1bmRvUmVkb1N0YXRlQ2hhbmdlZENhbGxiYWNrID0gbnVsbDtcbiAgICBub2RlQWRkZWRDYWxsYmFjayA9IG51bGw7XG4gICAgbm9kZVJlbW92ZWRDYWxsYmFjayA9IG51bGw7XG5cbiAgICB0ZXh0QWRkZWRDYWxsYmFjayA9IG51bGw7XG4gICAgdGV4dFJlbW92ZWRDYWxsYmFjayA9IG51bGw7XG5cbiAgICBjYWxsYmFja3NEaXNhYmxlZCA9IGZhbHNlO1xuXG4gICAgY29uc3RydWN0b3IoZGF0YSkge1xuICAgICAgICBpZihkYXRhKXtcbiAgICAgICAgICAgIHRoaXMubG9hZChkYXRhKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldEpzb25SZXBsYWNlcihmaWx0ZXJMb2NhdGlvbj1mYWxzZSwgZmlsdGVyQ29tcHV0ZWQ9ZmFsc2UsIHJlcGxhY2VyLCBmaWx0ZXJQcml2YXRlID10cnVlKXtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChrLCB2KSB7XG5cbiAgICAgICAgICAgIGlmICgoZmlsdGVyUHJpdmF0ZSAmJiBVdGlscy5zdGFydHNXaXRoKGssICckJykpIHx8IGsgPT0gJ3BhcmVudE5vZGUnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmaWx0ZXJMb2NhdGlvbiAmJiBrID09ICdsb2NhdGlvbicpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZpbHRlckNvbXB1dGVkICYmIGsgPT0gJ2NvbXB1dGVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZXBsYWNlcil7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcGxhY2VyKGssIHYpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNlcmlhbGl6ZShzdHJpbmdpZnk9dHJ1ZSwgZmlsdGVyTG9jYXRpb249ZmFsc2UsIGZpbHRlckNvbXB1dGVkPWZhbHNlLCByZXBsYWNlciwgZmlsdGVyUHJpdmF0ZSA9dHJ1ZSl7XG4gICAgICAgIHZhciBkYXRhID0gIHtcbiAgICAgICAgICAgIGNvZGU6IHRoaXMuY29kZSxcbiAgICAgICAgICAgIGV4cHJlc3Npb25TY29wZTogdGhpcy5leHByZXNzaW9uU2NvcGUsXG4gICAgICAgICAgICB0cmVlczogdGhpcy5nZXRSb290cygpLFxuICAgICAgICAgICAgdGV4dHM6IHRoaXMudGV4dHMsXG4gICAgICAgICAgICBwYXlvZmZOYW1lczogdGhpcy5wYXlvZmZOYW1lcyxcbiAgICAgICAgICAgIGRlZmF1bHRXVFA6IHRoaXMuZGVmYXVsdFdUUCxcbiAgICAgICAgICAgIG1pbmltdW1XVFA6IHRoaXMubWluaW11bVdUUCxcbiAgICAgICAgICAgIG1heGltdW1XVFA6IHRoaXMubWF4aW11bVdUUFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmKCFzdHJpbmdpZnkpe1xuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gVXRpbHMuc3RyaW5naWZ5KGRhdGEsIHRoaXMuZ2V0SnNvblJlcGxhY2VyKGZpbHRlckxvY2F0aW9uLCBmaWx0ZXJDb21wdXRlZCwgcmVwbGFjZXIsIGZpbHRlclByaXZhdGUpLCBbXSk7XG4gICAgfVxuXG5cbiAgICAvKkxvYWRzIHNlcmlhbGl6ZWQgZGF0YSovXG4gICAgbG9hZChkYXRhKSB7XG4gICAgICAgIC8vcm9vdHMsIHRleHRzLCBjb2RlLCBleHByZXNzaW9uU2NvcGVcbiAgICAgICAgdmFyIGNhbGxiYWNrc0Rpc2FibGVkID0gdGhpcy5jYWxsYmFja3NEaXNhYmxlZDtcbiAgICAgICAgdGhpcy5jYWxsYmFja3NEaXNhYmxlZCA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5jbGVhcigpO1xuXG5cbiAgICAgICAgZGF0YS50cmVlcy5mb3JFYWNoKG5vZGVEYXRhPT4ge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmNyZWF0ZU5vZGVGcm9tRGF0YShub2RlRGF0YSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChkYXRhLnRleHRzKSB7XG4gICAgICAgICAgICBkYXRhLnRleHRzLmZvckVhY2godGV4dERhdGE9PiB7XG4gICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gbmV3IGRvbWFpbi5Qb2ludCh0ZXh0RGF0YS5sb2NhdGlvbi54LCB0ZXh0RGF0YS5sb2NhdGlvbi55KTtcbiAgICAgICAgICAgICAgICB2YXIgdGV4dCA9IG5ldyBkb21haW4uVGV4dChsb2NhdGlvbiwgdGV4dERhdGEudmFsdWUpO1xuICAgICAgICAgICAgICAgIHRoaXMudGV4dHMucHVzaCh0ZXh0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNsZWFyRXhwcmVzc2lvblNjb3BlKCk7XG4gICAgICAgIHRoaXMuY29kZSA9IGRhdGEuY29kZSB8fCAnJztcblxuICAgICAgICBpZiAoZGF0YS5leHByZXNzaW9uU2NvcGUpIHtcbiAgICAgICAgICAgIFV0aWxzLmV4dGVuZCh0aGlzLmV4cHJlc3Npb25TY29wZSwgZGF0YS5leHByZXNzaW9uU2NvcGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoZGF0YS5wYXlvZmZOYW1lcyAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHRoaXMucGF5b2ZmTmFtZXMgPSBkYXRhLnBheW9mZk5hbWVzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoZGF0YS5kZWZhdWx0V1RQICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgdGhpcy5kZWZhdWx0V1RQID0gZGF0YS5kZWZhdWx0V1RQO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoZGF0YS5taW5pbXVtV1RQICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgdGhpcy5taW5pbXVtV1RQID0gZGF0YS5taW5pbXVtV1RQO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYoZGF0YS5tYXhpbXVtV1RQICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgdGhpcy5tYXhpbXVtV1RQID0gZGF0YS5tYXhpbXVtV1RQO1xuICAgICAgICB9XG5cblxuICAgICAgICB0aGlzLmNhbGxiYWNrc0Rpc2FibGVkID0gY2FsbGJhY2tzRGlzYWJsZWQ7XG4gICAgfVxuXG4gICAgZ2V0RFRPKGZpbHRlckxvY2F0aW9uPWZhbHNlLCBmaWx0ZXJDb21wdXRlZD1mYWxzZSwgZmlsdGVyUHJpdmF0ZSA9ZmFsc2Upe1xuICAgICAgICB2YXIgZHRvID0ge1xuICAgICAgICAgICAgc2VyaWFsaXplZERhdGE6IHRoaXMuc2VyaWFsaXplKHRydWUsIGZpbHRlckxvY2F0aW9uLCBmaWx0ZXJDb21wdXRlZCwgbnVsbCwgZmlsdGVyUHJpdmF0ZSksXG4gICAgICAgICAgICAkY29kZUVycm9yOiB0aGlzLiRjb2RlRXJyb3IsXG4gICAgICAgICAgICAkY29kZURpcnR5OiB0aGlzLiRjb2RlRGlydHksXG4gICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0czogdGhpcy52YWxpZGF0aW9uUmVzdWx0cy5zbGljZSgpXG5cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGR0b1xuICAgIH1cblxuICAgIGxvYWRGcm9tRFRPKGR0bywgZGF0YVJldml2ZXIpe1xuICAgICAgICB0aGlzLmxvYWQoSlNPTi5wYXJzZShkdG8uc2VyaWFsaXplZERhdGEsIGRhdGFSZXZpdmVyKSk7XG4gICAgICAgIHRoaXMuJGNvZGVFcnJvciA9IGR0by4kY29kZUVycm9yO1xuICAgICAgICB0aGlzLiRjb2RlRGlydHkgPSBkdG8uJGNvZGVEaXJ0eTtcbiAgICAgICAgdGhpcy52YWxpZGF0aW9uUmVzdWx0cy5sZW5ndGg9MDtcbiAgICAgICAgZHRvLnZhbGlkYXRpb25SZXN1bHRzLmZvckVhY2godj0+e1xuICAgICAgICAgICAgdGhpcy52YWxpZGF0aW9uUmVzdWx0cy5wdXNoKFZhbGlkYXRpb25SZXN1bHQuY3JlYXRlRnJvbURUTyh2KSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAvKlRoaXMgbWV0aG9kIHVwZGF0ZXMgb25seSBjb21wdXRhdGlvbiByZXN1bHRzL3ZhbGlkYXRpb24qL1xuICAgIHVwZGF0ZUZyb20oZGF0YU1vZGVsKXtcbiAgICAgICAgaWYodGhpcy4kdmVyc2lvbj5kYXRhTW9kZWwuJHZlcnNpb24pe1xuICAgICAgICAgICAgbG9nLndhcm4oXCJEYXRhTW9kZWwudXBkYXRlRnJvbTogdmVyc2lvbiBvZiBjdXJyZW50IG1vZGVsIGdyZWF0ZXIgdGhhbiB1cGRhdGVcIilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYnlJZCA9IHt9XG4gICAgICAgIGRhdGFNb2RlbC5ub2Rlcy5mb3JFYWNoKG49PntcbiAgICAgICAgICAgIGJ5SWRbbi4kaWRdID0gbjtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubm9kZXMuZm9yRWFjaCgobixpKT0+e1xuICAgICAgICAgICAgaWYoYnlJZFtuLiRpZF0pe1xuICAgICAgICAgICAgICAgIG4ubG9hZENvbXB1dGVkVmFsdWVzKGJ5SWRbbi4kaWRdLmNvbXB1dGVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRhdGFNb2RlbC5lZGdlcy5mb3JFYWNoKGU9PntcbiAgICAgICAgICAgIGJ5SWRbZS4kaWRdID0gZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZWRnZXMuZm9yRWFjaCgoZSxpKT0+e1xuICAgICAgICAgICAgaWYoYnlJZFtlLiRpZF0pe1xuICAgICAgICAgICAgICAgIGUubG9hZENvbXB1dGVkVmFsdWVzKGJ5SWRbZS4kaWRdLmNvbXB1dGVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZXhwcmVzc2lvblNjb3BlID0gZGF0YU1vZGVsLmV4cHJlc3Npb25TY29wZTtcbiAgICAgICAgdGhpcy4kY29kZUVycm9yID0gZGF0YU1vZGVsLiRjb2RlRXJyb3I7XG4gICAgICAgIHRoaXMuJGNvZGVEaXJ0eSA9IGRhdGFNb2RlbC4kY29kZURpcnR5O1xuICAgICAgICB0aGlzLnZhbGlkYXRpb25SZXN1bHRzICA9IGRhdGFNb2RlbC52YWxpZGF0aW9uUmVzdWx0cztcbiAgICB9XG5cbiAgICBnZXRHbG9iYWxWYXJpYWJsZU5hbWVzKGZpbHRlckZ1bmN0aW9uID0gdHJ1ZSl7XG4gICAgICAgIHZhciByZXMgPSBbXTtcbiAgICAgICAgVXRpbHMuZm9yT3duKHRoaXMuZXhwcmVzc2lvblNjb3BlLCAodmFsdWUsIGtleSk9PntcbiAgICAgICAgICAgIGlmKGZpbHRlckZ1bmN0aW9uICYmIFV0aWxzLmlzRnVuY3Rpb24odmFsdWUpKXtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMucHVzaChrZXkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICAvKmNyZWF0ZSBub2RlIGZyb20gc2VyaWFsaXplZCBkYXRhKi9cbiAgICBjcmVhdGVOb2RlRnJvbURhdGEoZGF0YSwgcGFyZW50KSB7XG4gICAgICAgIHZhciBub2RlLCBsb2NhdGlvbjtcblxuICAgICAgICBpZihkYXRhLmxvY2F0aW9uKXtcbiAgICAgICAgICAgIGxvY2F0aW9uID0gbmV3IGRvbWFpbi5Qb2ludChkYXRhLmxvY2F0aW9uLngsIGRhdGEubG9jYXRpb24ueSk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgbG9jYXRpb24gPSBuZXcgZG9tYWluLlBvaW50KDAsMCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZG9tYWluLkRlY2lzaW9uTm9kZS4kVFlQRSA9PSBkYXRhLnR5cGUpIHtcbiAgICAgICAgICAgIG5vZGUgPSBuZXcgZG9tYWluLkRlY2lzaW9uTm9kZShsb2NhdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoZG9tYWluLkNoYW5jZU5vZGUuJFRZUEUgPT0gZGF0YS50eXBlKSB7XG4gICAgICAgICAgICBub2RlID0gbmV3IGRvbWFpbi5DaGFuY2VOb2RlKGxvY2F0aW9uKTtcbiAgICAgICAgfSBlbHNlIGlmIChkb21haW4uVGVybWluYWxOb2RlLiRUWVBFID09IGRhdGEudHlwZSkge1xuICAgICAgICAgICAgbm9kZSA9IG5ldyBkb21haW4uVGVybWluYWxOb2RlKGxvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBpZihkYXRhLiRpZCl7XG4gICAgICAgICAgICBub2RlLiRpZCA9IGRhdGEuJGlkO1xuICAgICAgICB9XG4gICAgICAgIGlmKGRhdGEuJGZpZWxkU3RhdHVzKXtcbiAgICAgICAgICAgIG5vZGUuJGZpZWxkU3RhdHVzID0gZGF0YS4kZmllbGRTdGF0dXM7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZS5uYW1lID0gZGF0YS5uYW1lO1xuXG4gICAgICAgIGlmKGRhdGEuY29kZSl7XG4gICAgICAgICAgICBub2RlLmNvZGUgPSBkYXRhLmNvZGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRhdGEuZXhwcmVzc2lvblNjb3BlKSB7XG4gICAgICAgICAgICBub2RlLmV4cHJlc3Npb25TY29wZSA9IGRhdGEuZXhwcmVzc2lvblNjb3BlXG4gICAgICAgIH1cbiAgICAgICAgaWYoZGF0YS5jb21wdXRlZCl7XG4gICAgICAgICAgICBub2RlLmxvYWRDb21wdXRlZFZhbHVlcyhkYXRhLmNvbXB1dGVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlZGdlT3JOb2RlID0gdGhpcy5hZGROb2RlKG5vZGUsIHBhcmVudCk7XG4gICAgICAgIGRhdGEuY2hpbGRFZGdlcy5mb3JFYWNoKGVkPT4ge1xuICAgICAgICAgICAgdmFyIGVkZ2UgPSB0aGlzLmNyZWF0ZU5vZGVGcm9tRGF0YShlZC5jaGlsZE5vZGUsIG5vZGUpO1xuICAgICAgICAgICAgaWYoVXRpbHMuaXNBcnJheShlZC5wYXlvZmYpKXtcbiAgICAgICAgICAgICAgICBlZGdlLnBheW9mZiA9IGVkLnBheW9mZjtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIGVkZ2UucGF5b2ZmID0gW2VkLnBheW9mZiwgMF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVkZ2UucHJvYmFiaWxpdHkgPSBlZC5wcm9iYWJpbGl0eTtcbiAgICAgICAgICAgIGVkZ2UubmFtZSA9IGVkLm5hbWU7XG4gICAgICAgICAgICBpZihlZC5jb21wdXRlZCl7XG4gICAgICAgICAgICAgICAgZWRnZS5sb2FkQ29tcHV0ZWRWYWx1ZXMoZWQuY29tcHV0ZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZWQuJGlkKXtcbiAgICAgICAgICAgICAgICBlZGdlLiRpZCA9IGVkLiRpZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGVkLiRmaWVsZFN0YXR1cyl7XG4gICAgICAgICAgICAgICAgZWRnZS4kZmllbGRTdGF0dXMgPSBlZC4kZmllbGRTdGF0dXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBlZGdlT3JOb2RlO1xuICAgIH1cblxuICAgIC8qcmV0dXJucyBub2RlIG9yIGVkZ2UgZnJvbSBwYXJlbnQgdG8gdGhpcyBub2RlKi9cbiAgICBhZGROb2RlKG5vZGUsIHBhcmVudCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYubm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgdmFyIGVkZ2UgPSBzZWxmLl9hZGRDaGlsZChwYXJlbnQsIG5vZGUpO1xuICAgICAgICAgICAgdGhpcy5fZmlyZU5vZGVBZGRlZENhbGxiYWNrKG5vZGUpO1xuICAgICAgICAgICAgcmV0dXJuIGVkZ2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9maXJlTm9kZUFkZGVkQ2FsbGJhY2sobm9kZSk7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIC8qaW5qZWN0cyBnaXZlbiBub2RlIGludG8gZ2l2ZW4gZWRnZSovXG4gICAgaW5qZWN0Tm9kZShub2RlLCBlZGdlKSB7XG4gICAgICAgIHZhciBwYXJlbnQgPSBlZGdlLnBhcmVudE5vZGU7XG4gICAgICAgIHZhciBjaGlsZCA9IGVkZ2UuY2hpbGROb2RlO1xuICAgICAgICB0aGlzLm5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgIG5vZGUuJHBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgZWRnZS5jaGlsZE5vZGUgPSBub2RlO1xuICAgICAgICB0aGlzLl9hZGRDaGlsZChub2RlLCBjaGlsZCk7XG4gICAgICAgIHRoaXMuX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhub2RlKTtcbiAgICB9XG5cbiAgICBfYWRkQ2hpbGQocGFyZW50LCBjaGlsZCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBlZGdlID0gbmV3IGRvbWFpbi5FZGdlKHBhcmVudCwgY2hpbGQpO1xuICAgICAgICBzZWxmLl9zZXRFZGdlSW5pdGlhbFByb2JhYmlsaXR5KGVkZ2UpO1xuICAgICAgICBzZWxmLmVkZ2VzLnB1c2goZWRnZSk7XG5cbiAgICAgICAgcGFyZW50LmNoaWxkRWRnZXMucHVzaChlZGdlKTtcbiAgICAgICAgY2hpbGQuJHBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgcmV0dXJuIGVkZ2U7XG4gICAgfVxuXG4gICAgX3NldEVkZ2VJbml0aWFsUHJvYmFiaWxpdHkoZWRnZSkge1xuICAgICAgICBpZiAoZWRnZS5wYXJlbnROb2RlIGluc3RhbmNlb2YgZG9tYWluLkNoYW5jZU5vZGUpIHtcbiAgICAgICAgICAgIGVkZ2UucHJvYmFiaWxpdHkgPSAnIyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlZGdlLnByb2JhYmlsaXR5ID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICAvKnJlbW92ZXMgZ2l2ZW4gbm9kZSBhbmQgaXRzIHN1YnRyZWUqL1xuICAgIHJlbW92ZU5vZGUobm9kZSwgJGwgPSAwKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBub2RlLmNoaWxkRWRnZXMuZm9yRWFjaChlPT5zZWxmLnJlbW92ZU5vZGUoZS5jaGlsZE5vZGUsICRsICsgMSkpO1xuXG4gICAgICAgIHNlbGYuX3JlbW92ZU5vZGUobm9kZSk7XG4gICAgICAgIHZhciBwYXJlbnQgPSBub2RlLiRwYXJlbnQ7XG4gICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnRFZGdlID0gVXRpbHMuZmluZChwYXJlbnQuY2hpbGRFZGdlcywgKGUsIGkpPT4gZS5jaGlsZE5vZGUgPT09IG5vZGUpO1xuICAgICAgICAgICAgaWYgKCRsID09IDApIHtcbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUVkZ2UocGFyZW50RWRnZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuX3JlbW92ZUVkZ2UocGFyZW50RWRnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZmlyZU5vZGVSZW1vdmVkQ2FsbGJhY2sobm9kZSk7XG4gICAgfVxuXG4gICAgLypyZW1vdmVzIGdpdmVuIG5vZGVzIGFuZCB0aGVpciBzdWJ0cmVlcyovXG4gICAgcmVtb3ZlTm9kZXMobm9kZXMpIHtcblxuICAgICAgICB2YXIgcm9vdHMgPSB0aGlzLmZpbmRTdWJ0cmVlUm9vdHMobm9kZXMpO1xuICAgICAgICByb290cy5mb3JFYWNoKG49PnRoaXMucmVtb3ZlTm9kZShuLCAwKSwgdGhpcyk7XG4gICAgfVxuXG4gICAgY29udmVydE5vZGUobm9kZSwgdHlwZVRvQ29udmVydFRvKXtcbiAgICAgICAgdmFyIG5ld05vZGU7XG4gICAgICAgIGlmKCFub2RlLmNoaWxkRWRnZXMubGVuZ3RoICYmIG5vZGUuJHBhcmVudCl7XG4gICAgICAgICAgICBuZXdOb2RlID0gdGhpcy5jcmVhdGVOb2RlQnlUeXBlKHR5cGVUb0NvbnZlcnRUbywgbm9kZS5sb2NhdGlvbik7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgaWYobm9kZSBpbnN0YW5jZW9mIGRvbWFpbi5EZWNpc2lvbk5vZGUgJiYgdHlwZVRvQ29udmVydFRvPT1kb21haW4uQ2hhbmNlTm9kZS4kVFlQRSl7XG4gICAgICAgICAgICAgICAgbmV3Tm9kZSA9IHRoaXMuY3JlYXRlTm9kZUJ5VHlwZSh0eXBlVG9Db252ZXJ0VG8sIG5vZGUubG9jYXRpb24pO1xuICAgICAgICAgICAgfWVsc2UgaWYodHlwZVRvQ29udmVydFRvPT1kb21haW4uRGVjaXNpb25Ob2RlLiRUWVBFKXtcbiAgICAgICAgICAgICAgICBuZXdOb2RlID0gdGhpcy5jcmVhdGVOb2RlQnlUeXBlKHR5cGVUb0NvbnZlcnRUbywgbm9kZS5sb2NhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZihuZXdOb2RlKXtcbiAgICAgICAgICAgIG5ld05vZGUubmFtZT1ub2RlLm5hbWU7XG4gICAgICAgICAgICB0aGlzLnJlcGxhY2VOb2RlKG5ld05vZGUsIG5vZGUpO1xuICAgICAgICAgICAgbmV3Tm9kZS5jaGlsZEVkZ2VzLmZvckVhY2goZT0+dGhpcy5fc2V0RWRnZUluaXRpYWxQcm9iYWJpbGl0eShlKSk7XG4gICAgICAgICAgICB0aGlzLl9maXJlTm9kZUFkZGVkQ2FsbGJhY2sobmV3Tm9kZSk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGNyZWF0ZU5vZGVCeVR5cGUodHlwZSwgbG9jYXRpb24pe1xuICAgICAgICBpZih0eXBlPT1kb21haW4uRGVjaXNpb25Ob2RlLiRUWVBFKXtcbiAgICAgICAgICAgIHJldHVybiBuZXcgZG9tYWluLkRlY2lzaW9uTm9kZShsb2NhdGlvbilcbiAgICAgICAgfWVsc2UgaWYodHlwZT09ZG9tYWluLkNoYW5jZU5vZGUuJFRZUEUpe1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBkb21haW4uQ2hhbmNlTm9kZShsb2NhdGlvbilcbiAgICAgICAgfWVsc2UgaWYodHlwZT09ZG9tYWluLlRlcm1pbmFsTm9kZS4kVFlQRSl7XG4gICAgICAgICAgICByZXR1cm4gbmV3IGRvbWFpbi5UZXJtaW5hbE5vZGUobG9jYXRpb24pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXBsYWNlTm9kZShuZXdOb2RlLCBvbGROb2RlKXtcbiAgICAgICAgdmFyIHBhcmVudCA9IG9sZE5vZGUuJHBhcmVudDtcbiAgICAgICAgbmV3Tm9kZS4kcGFyZW50ID0gcGFyZW50O1xuXG4gICAgICAgIGlmKHBhcmVudCl7XG4gICAgICAgICAgICB2YXIgcGFyZW50RWRnZSA9IFV0aWxzLmZpbmQobmV3Tm9kZS4kcGFyZW50LmNoaWxkRWRnZXMsIGU9PmUuY2hpbGROb2RlPT09b2xkTm9kZSk7XG4gICAgICAgICAgICBwYXJlbnRFZGdlLmNoaWxkTm9kZSA9IG5ld05vZGU7XG4gICAgICAgIH1cblxuICAgICAgICBuZXdOb2RlLmNoaWxkRWRnZXMgPSBvbGROb2RlLmNoaWxkRWRnZXM7XG4gICAgICAgIG5ld05vZGUuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PmUucGFyZW50Tm9kZT1uZXdOb2RlKTtcblxuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLm5vZGVzLmluZGV4T2Yob2xkTm9kZSk7XG4gICAgICAgIGlmKH5pbmRleCl7XG4gICAgICAgICAgICB0aGlzLm5vZGVzW2luZGV4XT1uZXdOb2RlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0Um9vdHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vZGVzLmZpbHRlcihuPT4hbi4kcGFyZW50KTtcbiAgICB9XG5cbiAgICBmaW5kU3VidHJlZVJvb3RzKG5vZGVzKSB7XG4gICAgICAgIHJldHVybiBub2Rlcy5maWx0ZXIobj0+IW4uJHBhcmVudCB8fCBub2Rlcy5pbmRleE9mKG4uJHBhcmVudCkgPT09IC0xKTtcbiAgICB9XG5cbiAgICAvKmNyZWF0ZXMgZGV0YWNoZWQgY2xvbmUgb2YgZ2l2ZW4gbm9kZSovXG4gICAgY2xvbmVTdWJ0cmVlKG5vZGVUb0NvcHksIGNsb25lQ29tcHV0ZWRWYWx1ZXMpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgY2xvbmUgPSB0aGlzLmNsb25lTm9kZShub2RlVG9Db3B5KTtcblxuICAgICAgICBub2RlVG9Db3B5LmNoaWxkRWRnZXMuZm9yRWFjaChlPT4ge1xuICAgICAgICAgICAgdmFyIGNoaWxkQ2xvbmUgPSBzZWxmLmNsb25lU3VidHJlZShlLmNoaWxkTm9kZSwgY2xvbmVDb21wdXRlZFZhbHVlcyk7XG4gICAgICAgICAgICBjaGlsZENsb25lLiRwYXJlbnQgPSBjbG9uZTtcbiAgICAgICAgICAgIHZhciBlZGdlID0gbmV3IGRvbWFpbi5FZGdlKGNsb25lLCBjaGlsZENsb25lLCBlLm5hbWUsIGUucGF5b2ZmLCBlLnByb2JhYmlsaXR5KTtcbiAgICAgICAgICAgIGlmIChjbG9uZUNvbXB1dGVkVmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgZWRnZS5jb21wdXRlZCA9IFV0aWxzLmNsb25lRGVlcChlLmNvbXB1dGVkKVxuICAgICAgICAgICAgICAgIGNoaWxkQ2xvbmUuY29tcHV0ZWQgPSBVdGlscy5jbG9uZURlZXAoZS5jaGlsZE5vZGUuY29tcHV0ZWQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjbG9uZS5jaGlsZEVkZ2VzLnB1c2goZWRnZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoY2xvbmVDb21wdXRlZFZhbHVlcykge1xuICAgICAgICAgICAgY2xvbmUuY29tcHV0ZWQgPSBVdGlscy5jbG9uZURlZXAobm9kZVRvQ29weS5jb21wdXRlZClcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2xvbmU7XG4gICAgfVxuXG4gICAgLyphdHRhY2hlcyBkZXRhY2hlZCBzdWJ0cmVlIHRvIGdpdmVuIHBhcmVudCovXG4gICAgYXR0YWNoU3VidHJlZShub2RlVG9BdHRhY2gsIHBhcmVudCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBub2RlT3JFZGdlID0gc2VsZi5hZGROb2RlKG5vZGVUb0F0dGFjaCwgcGFyZW50KTtcblxuICAgICAgICB2YXIgY2hpbGRFZGdlcyA9IHNlbGYuZ2V0QWxsRGVzY2VuZGFudEVkZ2VzKG5vZGVUb0F0dGFjaCk7XG4gICAgICAgIGNoaWxkRWRnZXMuZm9yRWFjaChlPT4ge1xuICAgICAgICAgICAgc2VsZi5lZGdlcy5wdXNoKGUpO1xuICAgICAgICAgICAgc2VsZi5ub2Rlcy5wdXNoKGUuY2hpbGROb2RlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG5vZGVPckVkZ2U7XG4gICAgfVxuXG4gICAgY2xvbmVOb2Rlcyhub2Rlcykge1xuICAgICAgICB2YXIgcm9vdHMgPSBbXVxuICAgICAgICAvL1RPRE9cbiAgICB9XG5cbiAgICAvKnNoYWxsb3cgY2xvbmUgd2l0aG91dCBwYXJlbnQgYW5kIGNoaWxkcmVuKi9cbiAgICBjbG9uZU5vZGUobm9kZSkge1xuICAgICAgICB2YXIgY2xvbmUgPSBVdGlscy5jbG9uZShub2RlKVxuICAgICAgICBjbG9uZS4kaWQgPSBVdGlscy5ndWlkKCk7XG4gICAgICAgIGNsb25lLmxvY2F0aW9uID0gVXRpbHMuY2xvbmUobm9kZS5sb2NhdGlvbik7XG4gICAgICAgIGNsb25lLmNvbXB1dGVkID0gVXRpbHMuY2xvbmUobm9kZS5jb21wdXRlZCk7XG4gICAgICAgIGNsb25lLiRwYXJlbnQgPSBudWxsO1xuICAgICAgICBjbG9uZS5jaGlsZEVkZ2VzID0gW107XG4gICAgICAgIHJldHVybiBjbG9uZTtcbiAgICB9XG5cbiAgICBmaW5kTm9kZUJ5SWQoaWQpIHtcbiAgICAgICAgcmV0dXJuIFV0aWxzLmZpbmQodGhpcy5ub2Rlcywgbj0+bi4kaWQgPT0gaWQpO1xuICAgIH1cblxuICAgIGZpbmRFZGdlQnlJZChpZCkge1xuICAgICAgICByZXR1cm4gVXRpbHMuZmluZCh0aGlzLmVkZ2VzLCBlPT5lLiRpZCA9PSBpZCk7XG4gICAgfVxuXG4gICAgZmluZEJ5SWQoaWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmZpbmROb2RlQnlJZChpZCk7XG4gICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5maW5kRWRnZUJ5SWQoaWQpO1xuICAgIH1cblxuICAgIF9yZW1vdmVOb2RlKG5vZGUpIHsvLyBzaW1wbHkgcmVtb3ZlcyBub2RlIGZyb20gbm9kZSBsaXN0XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMubm9kZXMuaW5kZXhPZihub2RlKTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHRoaXMubm9kZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbW92ZUVkZ2UoZWRnZSkge1xuICAgICAgICB2YXIgaW5kZXggPSBlZGdlLnBhcmVudE5vZGUuY2hpbGRFZGdlcy5pbmRleE9mKGVkZ2UpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgZWRnZS5wYXJlbnROb2RlLmNoaWxkRWRnZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZW1vdmVFZGdlKGVkZ2UpO1xuICAgIH1cblxuICAgIF9yZW1vdmVFZGdlKGVkZ2UpIHsgLy9yZW1vdmVzIGVkZ2UgZnJvbSBlZGdlIGxpc3Qgd2l0aG91dCByZW1vdmluZyBjb25uZWN0ZWQgbm9kZXNcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5lZGdlcy5pbmRleE9mKGVkZ2UpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5lZGdlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3JlbW92ZU5vZGVzKG5vZGVzVG9SZW1vdmUpIHtcbiAgICAgICAgdGhpcy5ub2RlcyA9IHRoaXMubm9kZXMuZmlsdGVyKG49Pm5vZGVzVG9SZW1vdmUuaW5kZXhPZihuKSA9PT0gLTEpO1xuICAgIH1cblxuICAgIF9yZW1vdmVFZGdlcyhlZGdlc1RvUmVtb3ZlKSB7XG4gICAgICAgIHRoaXMuZWRnZXMgPSB0aGlzLmVkZ2VzLmZpbHRlcihlPT5lZGdlc1RvUmVtb3ZlLmluZGV4T2YoZSkgPT09IC0xKTtcbiAgICB9XG5cbiAgICBnZXRBbGxEZXNjZW5kYW50RWRnZXMobm9kZSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgICAgICBub2RlLmNoaWxkRWRnZXMuZm9yRWFjaChlPT4ge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goZSk7XG4gICAgICAgICAgICBpZiAoZS5jaGlsZE5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCguLi5zZWxmLmdldEFsbERlc2NlbmRhbnRFZGdlcyhlLmNoaWxkTm9kZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGdldEFsbERlc2NlbmRhbnROb2Rlcyhub2RlKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIG5vZGUuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PiB7XG4gICAgICAgICAgICBpZiAoZS5jaGlsZE5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChlLmNoaWxkTm9kZSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goLi4uc2VsZi5nZXRBbGxEZXNjZW5kYW50Tm9kZXMoZS5jaGlsZE5vZGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBnZXRBbGxOb2Rlc0luU3VidHJlZShub2RlKSB7XG4gICAgICAgIHZhciBkZXNjZW5kYW50cyA9IHRoaXMuZ2V0QWxsRGVzY2VuZGFudE5vZGVzKG5vZGUpO1xuICAgICAgICBkZXNjZW5kYW50cy51bnNoaWZ0KG5vZGUpO1xuICAgICAgICByZXR1cm4gZGVzY2VuZGFudHM7XG4gICAgfVxuXG4gICAgaXNVbmRvQXZhaWxhYmxlKCkge1xuICAgICAgICByZXR1cm4gISF0aGlzLnVuZG9TdGFjay5sZW5ndGhcbiAgICB9XG5cbiAgICBpc1JlZG9BdmFpbGFibGUoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMucmVkb1N0YWNrLmxlbmd0aFxuICAgIH1cblxuICAgIGNyZWF0ZVN0YXRlU25hcHNob3QocmV2ZXJ0Q29uZil7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXZlcnRDb25mOiByZXZlcnRDb25mLFxuICAgICAgICAgICAgbm9kZXM6IFV0aWxzLmNsb25lRGVlcCh0aGlzLm5vZGVzKSxcbiAgICAgICAgICAgIGVkZ2VzOiBVdGlscy5jbG9uZURlZXAodGhpcy5lZGdlcyksXG4gICAgICAgICAgICB0ZXh0czogVXRpbHMuY2xvbmVEZWVwKHRoaXMudGV4dHMpLFxuICAgICAgICAgICAgcGF5b2ZmTmFtZXM6IFV0aWxzLmNsb25lRGVlcCh0aGlzLnBheW9mZk5hbWVzKSxcbiAgICAgICAgICAgIGRlZmF1bHRXVFA6IFV0aWxzLmNsb25lRGVlcCh0aGlzLmRlZmF1bHRXVFApLFxuICAgICAgICAgICAgbWluaW11bVdUUDogVXRpbHMuY2xvbmVEZWVwKHRoaXMubWluaW11bVdUUCksXG4gICAgICAgICAgICBtYXhpbXVtV1RQOiBVdGlscy5jbG9uZURlZXAodGhpcy5tYXhpbXVtV1RQKSxcbiAgICAgICAgICAgIGV4cHJlc3Npb25TY29wZTogVXRpbHMuY2xvbmVEZWVwKHRoaXMuZXhwcmVzc2lvblNjb3BlKSxcbiAgICAgICAgICAgIGNvZGU6IHRoaXMuY29kZSxcbiAgICAgICAgICAgICRjb2RlRXJyb3I6IHRoaXMuJGNvZGVFcnJvclxuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBzYXZlU3RhdGVGcm9tU25hcHNob3Qoc3RhdGUpe1xuICAgICAgICB0aGlzLnJlZG9TdGFjay5sZW5ndGggPSAwO1xuXG4gICAgICAgIHRoaXMuX3B1c2hUb1N0YWNrKHRoaXMudW5kb1N0YWNrLCBzdGF0ZSk7XG5cbiAgICAgICAgdGhpcy5fZmlyZVVuZG9SZWRvQ2FsbGJhY2soKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzYXZlU3RhdGUocmV2ZXJ0Q29uZikge1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZUZyb21TbmFwc2hvdCh0aGlzLmNyZWF0ZVN0YXRlU25hcHNob3QocmV2ZXJ0Q29uZikpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICB1bmRvKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBuZXdTdGF0ZSA9IHRoaXMudW5kb1N0YWNrLnBvcCgpO1xuICAgICAgICBpZiAoIW5ld1N0YXRlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9wdXNoVG9TdGFjayh0aGlzLnJlZG9TdGFjaywge1xuICAgICAgICAgICAgcmV2ZXJ0Q29uZjogbmV3U3RhdGUucmV2ZXJ0Q29uZixcbiAgICAgICAgICAgIG5vZGVzOiBzZWxmLm5vZGVzLFxuICAgICAgICAgICAgZWRnZXM6IHNlbGYuZWRnZXMsXG4gICAgICAgICAgICB0ZXh0czogc2VsZi50ZXh0cyxcbiAgICAgICAgICAgIHBheW9mZk5hbWVzOiBzZWxmLnBheW9mZk5hbWVzLFxuICAgICAgICAgICAgZGVmYXVsdFdUUDogc2VsZi5kZWZhdWx0V1RQLFxuICAgICAgICAgICAgbWluaW11bVdUUDogc2VsZi5taW5pbXVtV1RQLFxuICAgICAgICAgICAgbWF4aW11bVdUUDogc2VsZi5tYXhpbXVtV1RQLFxuICAgICAgICAgICAgZXhwcmVzc2lvblNjb3BlOiBzZWxmLmV4cHJlc3Npb25TY29wZSxcbiAgICAgICAgICAgIGNvZGU6IHNlbGYuY29kZSxcbiAgICAgICAgICAgICRjb2RlRXJyb3I6IHNlbGYuJGNvZGVFcnJvclxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX3NldE5ld1N0YXRlKG5ld1N0YXRlKTtcblxuICAgICAgICB0aGlzLl9maXJlVW5kb1JlZG9DYWxsYmFjaygpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJlZG8oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG5ld1N0YXRlID0gdGhpcy5yZWRvU3RhY2sucG9wKCk7XG4gICAgICAgIGlmICghbmV3U3RhdGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3B1c2hUb1N0YWNrKHRoaXMudW5kb1N0YWNrLCB7XG4gICAgICAgICAgICByZXZlcnRDb25mOiBuZXdTdGF0ZS5yZXZlcnRDb25mLFxuICAgICAgICAgICAgbm9kZXM6IHNlbGYubm9kZXMsXG4gICAgICAgICAgICBlZGdlczogc2VsZi5lZGdlcyxcbiAgICAgICAgICAgIHRleHRzOiBzZWxmLnRleHRzLFxuICAgICAgICAgICAgcGF5b2ZmTmFtZXM6IHNlbGYucGF5b2ZmTmFtZXMsXG4gICAgICAgICAgICBkZWZhdWx0V1RQOiBzZWxmLmRlZmF1bHRXVFAsXG4gICAgICAgICAgICBtaW5pbXVtV1RQOiBzZWxmLm1pbmltdW1XVFAsXG4gICAgICAgICAgICBtYXhpbXVtV1RQOiBzZWxmLm1heGltdW1XVFAsXG4gICAgICAgICAgICBleHByZXNzaW9uU2NvcGU6IHNlbGYuZXhwcmVzc2lvblNjb3BlLFxuICAgICAgICAgICAgY29kZTogc2VsZi5jb2RlLFxuICAgICAgICAgICAgJGNvZGVFcnJvcjogc2VsZi4kY29kZUVycm9yXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX3NldE5ld1N0YXRlKG5ld1N0YXRlLCB0cnVlKTtcblxuICAgICAgICB0aGlzLl9maXJlVW5kb1JlZG9DYWxsYmFjaygpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLm5vZGVzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuZWRnZXMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy51bmRvU3RhY2subGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5yZWRvU3RhY2subGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy50ZXh0cy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLmNsZWFyRXhwcmVzc2lvblNjb3BlKCk7XG4gICAgICAgIHRoaXMuY29kZSA9ICcnO1xuICAgICAgICB0aGlzLiRjb2RlRXJyb3IgPSBudWxsO1xuICAgICAgICB0aGlzLiRjb2RlRGlydHkgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLnBheW9mZk5hbWVzID0gW107XG4gICAgICAgIHRoaXMuZGVmYXVsdFdUUCA9IDE7XG4gICAgICAgIHRoaXMubWluaW11bVdUUCA9IDA7XG4gICAgICAgIHRoaXMubWF4aW11bVdUUCA9IEluZmluaXR5O1xuICAgIH1cblxuICAgIGFkZFRleHQodGV4dCkge1xuICAgICAgICB0aGlzLnRleHRzLnB1c2godGV4dCk7XG5cbiAgICAgICAgdGhpcy5fZmlyZVRleHRBZGRlZENhbGxiYWNrKHRleHQpO1xuICAgIH1cblxuICAgIHJlbW92ZVRleHRzKHRleHRzKSB7XG4gICAgICAgIHRleHRzLmZvckVhY2godD0+dGhpcy5yZW1vdmVUZXh0KHQpKTtcbiAgICB9XG5cbiAgICByZW1vdmVUZXh0KHRleHQpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy50ZXh0cy5pbmRleE9mKHRleHQpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdGhpcy50ZXh0cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgdGhpcy5fZmlyZVRleHRSZW1vdmVkQ2FsbGJhY2sodGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbGVhckV4cHJlc3Npb25TY29wZSgpIHtcbiAgICAgICAgVXRpbHMuZm9yT3duKHRoaXMuZXhwcmVzc2lvblNjb3BlLCAodmFsdWUsIGtleSk9PiB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5leHByZXNzaW9uU2NvcGVba2V5XTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV2ZXJzZVBheW9mZnMoKXtcbiAgICAgICAgdGhpcy5wYXlvZmZOYW1lcy5yZXZlcnNlKCk7XG4gICAgICAgIHRoaXMuZWRnZXMuZm9yRWFjaChlPT5lLnBheW9mZi5yZXZlcnNlKCkpXG4gICAgfVxuXG4gICAgX3NldE5ld1N0YXRlKG5ld1N0YXRlLCByZWRvKSB7XG4gICAgICAgIHZhciBub2RlQnlJZCA9IFV0aWxzLmdldE9iamVjdEJ5SWRNYXAobmV3U3RhdGUubm9kZXMpO1xuICAgICAgICB2YXIgZWRnZUJ5SWQgPSBVdGlscy5nZXRPYmplY3RCeUlkTWFwKG5ld1N0YXRlLmVkZ2VzKTtcbiAgICAgICAgdGhpcy5ub2RlcyA9IG5ld1N0YXRlLm5vZGVzO1xuICAgICAgICB0aGlzLmVkZ2VzID0gbmV3U3RhdGUuZWRnZXM7XG4gICAgICAgIHRoaXMudGV4dHMgPSBuZXdTdGF0ZS50ZXh0cztcbiAgICAgICAgdGhpcy5wYXlvZmZOYW1lcyA9IG5ld1N0YXRlLnBheW9mZk5hbWVzO1xuICAgICAgICB0aGlzLmRlZmF1bHRXVFAgPSBuZXdTdGF0ZS5kZWZhdWx0V1RQO1xuICAgICAgICB0aGlzLm1pbmltdW1XVFAgPSBuZXdTdGF0ZS5taW5pbXVtV1RQO1xuICAgICAgICB0aGlzLm1heGltdW1XVFAgPSBuZXdTdGF0ZS5tYXhpbXVtV1RQO1xuICAgICAgICB0aGlzLmV4cHJlc3Npb25TY29wZSA9IG5ld1N0YXRlLmV4cHJlc3Npb25TY29wZTtcbiAgICAgICAgdGhpcy5jb2RlID0gbmV3U3RhdGUuY29kZTtcbiAgICAgICAgdGhpcy4kY29kZUVycm9yICA9IG5ld1N0YXRlLiRjb2RlRXJyb3JcblxuICAgICAgICB0aGlzLm5vZGVzLmZvckVhY2gobj0+IHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbi5jaGlsZEVkZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVkZ2UgPSBlZGdlQnlJZFtuLmNoaWxkRWRnZXNbaV0uJGlkXTtcbiAgICAgICAgICAgICAgICBuLmNoaWxkRWRnZXNbaV0gPSBlZGdlO1xuICAgICAgICAgICAgICAgIGVkZ2UucGFyZW50Tm9kZSA9IG47XG4gICAgICAgICAgICAgICAgZWRnZS5jaGlsZE5vZGUgPSBub2RlQnlJZFtlZGdlLmNoaWxkTm9kZS4kaWRdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChuZXdTdGF0ZS5yZXZlcnRDb25mKSB7XG4gICAgICAgICAgICBpZiAoIXJlZG8gJiYgbmV3U3RhdGUucmV2ZXJ0Q29uZi5vblVuZG8pIHtcbiAgICAgICAgICAgICAgICBuZXdTdGF0ZS5yZXZlcnRDb25mLm9uVW5kbyhuZXdTdGF0ZS5yZXZlcnRDb25mLmRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlZG8gJiYgbmV3U3RhdGUucmV2ZXJ0Q29uZi5vblJlZG8pIHtcbiAgICAgICAgICAgICAgICBuZXdTdGF0ZS5yZXZlcnRDb25mLm9uUmVkbyhuZXdTdGF0ZS5yZXZlcnRDb25mLmRhdGEpO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJldmVydENvbmYgPSBuZXdTdGF0ZS5yZXZlcnRDb25mO1xuICAgIH1cblxuXG4gICAgX3B1c2hUb1N0YWNrKHN0YWNrLCBvYmopIHtcbiAgICAgICAgaWYgKHN0YWNrLmxlbmd0aCA+PSB0aGlzLm1heFN0YWNrU2l6ZSkge1xuICAgICAgICAgICAgc3RhY2suc2hpZnQoKTtcbiAgICAgICAgfVxuICAgICAgICBzdGFjay5wdXNoKG9iaik7XG4gICAgfVxuXG4gICAgX2ZpcmVVbmRvUmVkb0NhbGxiYWNrKCkge1xuICAgICAgICBpZiAoIXRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgJiYgdGhpcy51bmRvUmVkb1N0YXRlQ2hhbmdlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLnVuZG9SZWRvU3RhdGVDaGFuZ2VkQ2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9maXJlTm9kZUFkZGVkQ2FsbGJhY2sobm9kZSkge1xuICAgICAgICBpZiAoIXRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgJiYgdGhpcy5ub2RlQWRkZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy5ub2RlQWRkZWRDYWxsYmFjayhub2RlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9maXJlTm9kZVJlbW92ZWRDYWxsYmFjayhub2RlKSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLm5vZGVSZW1vdmVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMubm9kZVJlbW92ZWRDYWxsYmFjayhub2RlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9maXJlVGV4dEFkZGVkQ2FsbGJhY2sodGV4dCkge1xuICAgICAgICBpZiAoIXRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgJiYgdGhpcy50ZXh0QWRkZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy50ZXh0QWRkZWRDYWxsYmFjayh0ZXh0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9maXJlVGV4dFJlbW92ZWRDYWxsYmFjayh0ZXh0KSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLnRleHRSZW1vdmVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMudGV4dFJlbW92ZWRDYWxsYmFjayh0ZXh0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCB7T2JqZWN0V2l0aENvbXB1dGVkVmFsdWVzfSBmcm9tIFwiLi9vYmplY3Qtd2l0aC1jb21wdXRlZC12YWx1ZXNcIjtcblxuZXhwb3J0IGNsYXNzIEVkZ2UgZXh0ZW5kcyBPYmplY3RXaXRoQ29tcHV0ZWRWYWx1ZXMge1xuICAgIHBhcmVudE5vZGU7XG4gICAgY2hpbGROb2RlO1xuXG4gICAgbmFtZSA9ICcnO1xuICAgIHByb2JhYmlsaXR5ID0gdW5kZWZpbmVkO1xuICAgIHBheW9mZiA9IFswLCAwXTtcblxuICAgICRESVNQTEFZX1ZBTFVFX05BTUVTID0gWydwcm9iYWJpbGl0eScsICdwYXlvZmYnLCAnb3B0aW1hbCddO1xuXG4gICAgY29uc3RydWN0b3IocGFyZW50Tm9kZSwgY2hpbGROb2RlLCBuYW1lLCBwYXlvZmYsIHByb2JhYmlsaXR5LCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnBhcmVudE5vZGUgPSBwYXJlbnROb2RlO1xuICAgICAgICB0aGlzLmNoaWxkTm9kZSA9IGNoaWxkTm9kZTtcblxuICAgICAgICBpZiAobmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwcm9iYWJpbGl0eSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnByb2JhYmlsaXR5ID0gcHJvYmFiaWxpdHk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBheW9mZiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnBheW9mZiA9IHBheW9mZlxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBzZXROYW1lKG5hbWUpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0UHJvYmFiaWxpdHkocHJvYmFiaWxpdHkpIHtcbiAgICAgICAgdGhpcy5wcm9iYWJpbGl0eSA9IHByb2JhYmlsaXR5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXRQYXlvZmYocGF5b2ZmLCBpbmRleCA9IDApIHtcbiAgICAgICAgdGhpcy5wYXlvZmZbaW5kZXhdID0gcGF5b2ZmO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjb21wdXRlZEJhc2VQcm9iYWJpbGl0eSh2YWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcHV0ZWRWYWx1ZShudWxsLCAncHJvYmFiaWxpdHknLCB2YWwpO1xuICAgIH1cblxuICAgIGNvbXB1dGVkQmFzZVBheW9mZih2YWwsIGluZGV4ID0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb21wdXRlZFZhbHVlKG51bGwsICdwYXlvZmZbJyArIGluZGV4ICsgJ10nLCB2YWwpO1xuICAgIH1cblxuICAgIGRpc3BsYXlQcm9iYWJpbGl0eSh2YWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlzcGxheVZhbHVlKCdwcm9iYWJpbGl0eScsIHZhbCk7XG4gICAgfVxuXG4gICAgZGlzcGxheVBheW9mZih2YWwsIGluZGV4ID0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kaXNwbGF5VmFsdWUoJ3BheW9mZlsnICsgaW5kZXggKyAnXScsIHZhbCk7XG4gICAgfVxufVxuIiwiZXhwb3J0ICogZnJvbSAnLi9ub2RlL25vZGUnXG5leHBvcnQgKiBmcm9tICcuL25vZGUvZGVjaXNpb24tbm9kZSdcbmV4cG9ydCAqIGZyb20gJy4vbm9kZS9jaGFuY2Utbm9kZSdcbmV4cG9ydCAqIGZyb20gJy4vbm9kZS90ZXJtaW5hbC1ub2RlJ1xuZXhwb3J0ICogZnJvbSAnLi9lZGdlJ1xuZXhwb3J0ICogZnJvbSAnLi9wb2ludCdcbmV4cG9ydCAqIGZyb20gJy4vdGV4dCdcbiIsImltcG9ydCB7Tm9kZX0gZnJvbSAnLi9ub2RlJ1xuXG5leHBvcnQgY2xhc3MgQ2hhbmNlTm9kZSBleHRlbmRzIE5vZGV7XG5cbiAgICBzdGF0aWMgJFRZUEUgPSAnY2hhbmNlJztcblxuICAgIGNvbnN0cnVjdG9yKGxvY2F0aW9uKXtcbiAgICAgICAgc3VwZXIoQ2hhbmNlTm9kZS4kVFlQRSwgbG9jYXRpb24pO1xuICAgIH1cbn1cbiIsImltcG9ydCB7Tm9kZX0gZnJvbSAnLi9ub2RlJ1xuXG5leHBvcnQgY2xhc3MgRGVjaXNpb25Ob2RlIGV4dGVuZHMgTm9kZXtcblxuICAgIHN0YXRpYyAkVFlQRSA9ICdkZWNpc2lvbic7XG5cbiAgICBjb25zdHJ1Y3Rvcihsb2NhdGlvbil7XG4gICAgICAgIHN1cGVyKERlY2lzaW9uTm9kZS4kVFlQRSwgbG9jYXRpb24pO1xuICAgIH1cbn1cbiIsImltcG9ydCB7UG9pbnR9IGZyb20gJy4uL3BvaW50J1xuaW1wb3J0IHtPYmplY3RXaXRoQ29tcHV0ZWRWYWx1ZXN9IGZyb20gJy4uL29iamVjdC13aXRoLWNvbXB1dGVkLXZhbHVlcydcblxuZXhwb3J0IGNsYXNzIE5vZGUgZXh0ZW5kcyBPYmplY3RXaXRoQ29tcHV0ZWRWYWx1ZXN7XG5cbiAgICB0eXBlO1xuICAgIGNoaWxkRWRnZXM9W107XG4gICAgbmFtZT0nJztcblxuICAgIGxvY2F0aW9uOyAvL1BvaW50XG5cbiAgICBjb2RlPScnO1xuICAgICRjb2RlRGlydHkgPSBmYWxzZTsgLy8gaXMgY29kZSBjaGFuZ2VkIHdpdGhvdXQgcmVldmFsdWF0aW9uP1xuICAgICRjb2RlRXJyb3IgPSBudWxsOyAvL2NvZGUgZXZhbHVhdGlvbiBlcnJvcnNcblxuICAgIGV4cHJlc3Npb25TY29wZT1udWxsO1xuXG4gICAgJERJU1BMQVlfVkFMVUVfTkFNRVMgPSBbJ2NoaWxkcmVuUGF5b2ZmJywgJ2FnZ3JlZ2F0ZWRQYXlvZmYnLCAncHJvYmFiaWxpdHlUb0VudGVyJywgJ29wdGltYWwnXVxuXG4gICAgY29uc3RydWN0b3IodHlwZSwgbG9jYXRpb24pe1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmxvY2F0aW9uPWxvY2F0aW9uO1xuICAgICAgICBpZighbG9jYXRpb24pe1xuICAgICAgICAgICAgdGhpcy5sb2NhdGlvbiA9IG5ldyBQb2ludCgwLDApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudHlwZT10eXBlO1xuICAgIH1cblxuICAgIHNldE5hbWUobmFtZSl7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIG1vdmVUbyh4LHksIHdpdGhDaGlsZHJlbil7IC8vbW92ZSB0byBuZXcgbG9jYXRpb25cbiAgICAgICAgaWYod2l0aENoaWxkcmVuKXtcbiAgICAgICAgICAgIHZhciBkeCA9IHgtdGhpcy5sb2NhdGlvbi54O1xuICAgICAgICAgICAgdmFyIGR5ID0geS10aGlzLmxvY2F0aW9uLnk7XG4gICAgICAgICAgICB0aGlzLmNoaWxkRWRnZXMuZm9yRWFjaChlPT5lLmNoaWxkTm9kZS5tb3ZlKGR4LCBkeSwgdHJ1ZSkpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmxvY2F0aW9uLm1vdmVUbyh4LHkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBtb3ZlKGR4LCBkeSwgd2l0aENoaWxkcmVuKXsgLy9tb3ZlIGJ5IHZlY3RvclxuICAgICAgICBpZih3aXRoQ2hpbGRyZW4pe1xuICAgICAgICAgICAgdGhpcy5jaGlsZEVkZ2VzLmZvckVhY2goZT0+ZS5jaGlsZE5vZGUubW92ZShkeCwgZHksIHRydWUpKVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubG9jYXRpb24ubW92ZShkeCwgZHkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG4iLCJpbXBvcnQge05vZGV9IGZyb20gJy4vbm9kZSdcblxuZXhwb3J0IGNsYXNzIFRlcm1pbmFsTm9kZSBleHRlbmRzIE5vZGV7XG5cbiAgICBzdGF0aWMgJFRZUEUgPSAndGVybWluYWwnO1xuXG4gICAgY29uc3RydWN0b3IobG9jYXRpb24pe1xuICAgICAgICBzdXBlcihUZXJtaW5hbE5vZGUuJFRZUEUsIGxvY2F0aW9uKTtcbiAgICB9XG59XG4iLCJpbXBvcnQge1V0aWxzfSBmcm9tICdzZC11dGlscydcblxuaW1wb3J0IHtPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkc30gZnJvbSBcIi4vb2JqZWN0LXdpdGgtaWQtYW5kLWVkaXRhYmxlLWZpZWxkc1wiO1xuXG5leHBvcnQgY2xhc3MgT2JqZWN0V2l0aENvbXB1dGVkVmFsdWVzIGV4dGVuZHMgT2JqZWN0V2l0aElkQW5kRWRpdGFibGVGaWVsZHN7XG5cbiAgICBjb21wdXRlZD17fTsgLy9jb21wdXRlZCB2YWx1ZXNcblxuICAgIC8qZ2V0IG9yIHNldCBjb21wdXRlZCB2YWx1ZSovXG4gICAgY29tcHV0ZWRWYWx1ZShydWxlTmFtZSwgZmllbGRQYXRoLCB2YWx1ZSl7XG4gICAgICAgIHZhciBwYXRoID0gJ2NvbXB1dGVkLic7XG4gICAgICAgIGlmKHJ1bGVOYW1lKXtcbiAgICAgICAgICAgIHBhdGgrPXJ1bGVOYW1lKycuJztcbiAgICAgICAgfVxuICAgICAgICBwYXRoKz1maWVsZFBhdGg7XG4gICAgICAgIGlmKHZhbHVlPT09dW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHJldHVybiAgVXRpbHMuZ2V0KHRoaXMsIHBhdGgsIG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIFV0aWxzLnNldCh0aGlzLCBwYXRoLCB2YWx1ZSk7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBjbGVhckNvbXB1dGVkVmFsdWVzKHJ1bGVOYW1lKXtcbiAgICAgICAgaWYocnVsZU5hbWU9PXVuZGVmaW5lZCl7XG4gICAgICAgICAgICB0aGlzLmNvbXB1dGVkPXt9O1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKFV0aWxzLmlzQXJyYXkocnVsZU5hbWUpKXtcbiAgICAgICAgICAgIHJ1bGVOYW1lLmZvckVhY2gobj0+e1xuICAgICAgICAgICAgICAgIHRoaXMuY29tcHV0ZWRbbl09e307XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbXB1dGVkW3J1bGVOYW1lXT17fTtcbiAgICB9XG5cbiAgICBjbGVhckRpc3BsYXlWYWx1ZXMoKXtcbiAgICAgICAgdGhpcy5jb21wdXRlZFsnJGRpc3BsYXlWYWx1ZXMnXT17fTtcbiAgICB9XG5cbiAgICBkaXNwbGF5VmFsdWUoZmllbGRQYXRoLCB2YWx1ZSl7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVkVmFsdWUobnVsbCwgJyRkaXNwbGF5VmFsdWVzLicrZmllbGRQYXRoLCB2YWx1ZSk7XG4gICAgfVxuXG4gICAgbG9hZENvbXB1dGVkVmFsdWVzKGNvbXB1dGVkKXtcbiAgICAgICAgdGhpcy5jb21wdXRlZCA9IGNvbXB1dGVkO1xuICAgIH1cbn1cbiIsImltcG9ydCB7VXRpbHN9IGZyb20gJ3NkLXV0aWxzJ1xuXG5leHBvcnQgY2xhc3MgT2JqZWN0V2l0aElkQW5kRWRpdGFibGVGaWVsZHMge1xuXG4gICAgJGlkID0gVXRpbHMuZ3VpZCgpOyAvL2ludGVybmFsIGlkXG4gICAgJGZpZWxkU3RhdHVzPXt9O1xuXG4gICAgZ2V0RmllbGRTdGF0dXMoZmllbGRQYXRoKXtcbiAgICAgICAgaWYoIVV0aWxzLmdldCh0aGlzLiRmaWVsZFN0YXR1cywgZmllbGRQYXRoLCBudWxsKSl7XG4gICAgICAgICAgICBVdGlscy5zZXQodGhpcy4kZmllbGRTdGF0dXMsIGZpZWxkUGF0aCwge1xuICAgICAgICAgICAgICAgIHZhbGlkOiB7XG4gICAgICAgICAgICAgICAgICAgIHN5bnRheDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gVXRpbHMuZ2V0KHRoaXMuJGZpZWxkU3RhdHVzLCBmaWVsZFBhdGgpO1xuICAgIH1cblxuICAgIHNldFN5bnRheFZhbGlkaXR5KGZpZWxkUGF0aCwgdmFsaWQpe1xuICAgICAgICB2YXIgZmllbGRTdGF0dXMgPSB0aGlzLmdldEZpZWxkU3RhdHVzKGZpZWxkUGF0aCk7XG4gICAgICAgIGZpZWxkU3RhdHVzLnZhbGlkLnN5bnRheCA9IHZhbGlkO1xuICAgIH1cblxuICAgIHNldFZhbHVlVmFsaWRpdHkoZmllbGRQYXRoLCB2YWxpZCl7XG4gICAgICAgIHZhciBmaWVsZFN0YXR1cyA9IHRoaXMuZ2V0RmllbGRTdGF0dXMoZmllbGRQYXRoKTtcbiAgICAgICAgZmllbGRTdGF0dXMudmFsaWQudmFsdWUgPSB2YWxpZDtcbiAgICB9XG5cbiAgICBpc0ZpZWxkVmFsaWQoZmllbGRQYXRoLCBzeW50YXg9dHJ1ZSwgdmFsdWU9dHJ1ZSl7XG4gICAgICAgIHZhciBmaWVsZFN0YXR1cyA9IHRoaXMuZ2V0RmllbGRTdGF0dXMoZmllbGRQYXRoKTtcbiAgICAgICAgaWYoc3ludGF4ICYmIHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmllbGRTdGF0dXMudmFsaWQuc3ludGF4ICYmIGZpZWxkU3RhdHVzLnZhbGlkLnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmKHN5bnRheCkge1xuICAgICAgICAgICAgcmV0dXJuIGZpZWxkU3RhdHVzLnZhbGlkLnN5bnRheFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaWVsZFN0YXR1cy52YWxpZC52YWx1ZTtcbiAgICB9XG5cblxufVxuIiwiZXhwb3J0IGNsYXNzIFBvaW50IHtcbiAgICB4O1xuICAgIHk7XG4gICAgY29uc3RydWN0b3IoeCx5KXtcbiAgICAgICAgaWYoeCBpbnN0YW5jZW9mIFBvaW50KXtcbiAgICAgICAgICAgIHk9eC55O1xuICAgICAgICAgICAgeD14LnhcbiAgICAgICAgfWVsc2UgaWYoQXJyYXkuaXNBcnJheSh4KSl7XG4gICAgICAgICAgICB5PXhbMV07XG4gICAgICAgICAgICB4PXhbMF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy54PXg7XG4gICAgICAgIHRoaXMueT15O1xuICAgIH1cblxuICAgIG1vdmVUbyh4LHkpe1xuICAgICAgICBpZihBcnJheS5pc0FycmF5KHgpKXtcbiAgICAgICAgICAgIHk9eFsxXTtcbiAgICAgICAgICAgIHg9eFswXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLng9eDtcbiAgICAgICAgdGhpcy55PXk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIG1vdmUoZHgsZHkpeyAvL21vdmUgYnkgdmVjdG9yXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZHgpKXtcbiAgICAgICAgICAgIGR5PWR4WzFdO1xuICAgICAgICAgICAgZHg9ZHhbMF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy54Kz1keDtcbiAgICAgICAgdGhpcy55Kz1keTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQge1BvaW50fSBmcm9tIFwiLi9wb2ludFwiO1xuaW1wb3J0IHtVdGlsc30gZnJvbSBcInNkLXV0aWxzXCI7XG5pbXBvcnQge09iamVjdFdpdGhJZEFuZEVkaXRhYmxlRmllbGRzfSBmcm9tIFwiLi9vYmplY3Qtd2l0aC1pZC1hbmQtZWRpdGFibGUtZmllbGRzXCI7XG5cbmV4cG9ydCBjbGFzcyBUZXh0IGV4dGVuZHMgT2JqZWN0V2l0aElkQW5kRWRpdGFibGVGaWVsZHN7XG5cbiAgICB2YWx1ZT0nJztcbiAgICBsb2NhdGlvbjsgLy9Qb2ludFxuXG4gICAgY29uc3RydWN0b3IobG9jYXRpb24sIHZhbHVlKXtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5sb2NhdGlvbj1sb2NhdGlvbjtcbiAgICAgICAgaWYoIWxvY2F0aW9uKXtcbiAgICAgICAgICAgIHRoaXMubG9jYXRpb24gPSBuZXcgUG9pbnQoMCwwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBtb3ZlVG8oeCx5KXsgLy9tb3ZlIHRvIG5ldyBsb2NhdGlvblxuICAgICAgICB0aGlzLmxvY2F0aW9uLm1vdmVUbyh4LHkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBtb3ZlKGR4LCBkeSl7IC8vbW92ZSBieSB2ZWN0b3JcbiAgICAgICAgdGhpcy5sb2NhdGlvbi5tb3ZlKGR4LCBkeSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIGRvbWFpbiBmcm9tICcuL2RvbWFpbidcbmV4cG9ydCB7ZG9tYWlufVxuZXhwb3J0ICogZnJvbSAnLi9kYXRhLW1vZGVsJ1xuZXhwb3J0ICogZnJvbSAnLi92YWxpZGF0aW9uLXJlc3VsdCdcbiIsImltcG9ydCB7VXRpbHN9IGZyb20gXCJzZC11dGlsc1wiO1xuXG5leHBvcnQgY2xhc3MgVmFsaWRhdGlvblJlc3VsdHtcblxuXG4gICAgZXJyb3JzID0ge307XG4gICAgd2FybmluZ3MgPSB7fTtcbiAgICBvYmplY3RJZFRvRXJyb3I9e307XG5cbiAgICBhZGRFcnJvcihlcnJvciwgb2JqKXtcbiAgICAgICAgaWYoVXRpbHMuaXNTdHJpbmcoZXJyb3IpKXtcbiAgICAgICAgICAgIGVycm9yID0ge25hbWU6IGVycm9yfTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmFtZSA9IGVycm9yLm5hbWU7XG4gICAgICAgIHZhciBlcnJvcnNCeU5hbWUgPSB0aGlzLmVycm9yc1tuYW1lXTtcbiAgICAgICAgaWYoIWVycm9yc0J5TmFtZSl7XG4gICAgICAgICAgICBlcnJvcnNCeU5hbWU9W107XG4gICAgICAgICAgICB0aGlzLmVycm9yc1tuYW1lXT1lcnJvcnNCeU5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9iakUgPSB0aGlzLm9iamVjdElkVG9FcnJvcltvYmouJGlkXTtcbiAgICAgICAgaWYoIW9iakUpe1xuICAgICAgICAgICAgb2JqRT1bXTtcbiAgICAgICAgICAgIHRoaXMub2JqZWN0SWRUb0Vycm9yW29iai4kaWRdPSBvYmpFO1xuICAgICAgICB9XG4gICAgICAgIGVycm9yc0J5TmFtZS5wdXNoKG9iaik7XG4gICAgICAgIG9iakUucHVzaChlcnJvcik7XG4gICAgfVxuXG4gICAgYWRkV2FybmluZyhuYW1lLCBvYmope1xuICAgICAgICB2YXIgZSA9IHRoaXMud2FybmluZ3NbbmFtZV07XG4gICAgICAgIGlmKCFlKXtcbiAgICAgICAgICAgIGU9W107XG4gICAgICAgICAgICB0aGlzLndhcm5pbmdzW25hbWVdPWU7XG4gICAgICAgIH1cbiAgICAgICAgZS5wdXNoKG9iailcbiAgICB9XG5cbiAgICBpc1ZhbGlkKCl7XG4gICAgICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0aGlzLmVycm9ycykubGVuZ3RoID09PSAwXG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZUZyb21EVE8oZHRvKXtcbiAgICAgICAgdmFyIHYgPSBuZXcgVmFsaWRhdGlvblJlc3VsdCgpO1xuICAgICAgICB2LmVycm9ycyA9IGR0by5lcnJvcnM7XG4gICAgICAgIHYud2FybmluZ3MgPSBkdG8ud2FybmluZ3M7XG4gICAgICAgIHYub2JqZWN0SWRUb0Vycm9yID0gZHRvLm9iamVjdElkVG9FcnJvcjtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgfVxufVxuIiwiZXhwb3J0ICogZnJvbSAnLi9zcmMvaW5kZXgnXG4iXX0=
