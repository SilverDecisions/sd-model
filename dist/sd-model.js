require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

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

var _sdUtils = require("sd-utils");

var _domain = require("./domain");

var domain = _interopRequireWildcard(_domain);

var _validationResult = require("./validation-result");

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
        this.defaultCriterion1Weight = 1;
        this.weightLowerBound = 0;
        this.weightUpperBound = Infinity;
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
        key: "getJsonReplacer",
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
        key: "serialize",
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
                payoffNames: this.payoffNames.slice(),
                defaultCriterion1Weight: this.defaultCriterion1Weight,
                weightLowerBound: this.weightLowerBound,
                weightUpperBound: this.weightUpperBound
            };

            if (!stringify) {
                return data;
            }

            return _sdUtils.Utils.stringify(data, this.getJsonReplacer(filterLocation, filterComputed, replacer, filterPrivate), []);
        }

        /*Loads serialized data*/

    }, {
        key: "load",
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

            if (data.payoffNames !== undefined && data.payoffNames !== null) {
                this.payoffNames = data.payoffNames;
            }

            if (data.defaultCriterion1Weight !== undefined && data.defaultCriterion1Weight !== null) {
                this.defaultCriterion1Weight = data.defaultCriterion1Weight;
            }

            if (data.weightLowerBound !== undefined && data.weightLowerBound !== null) {
                this.weightLowerBound = data.weightLowerBound;
            }

            if (data.weightUpperBound !== undefined && data.weightUpperBound !== null) {
                this.weightUpperBound = data.weightUpperBound;
            }

            this.callbacksDisabled = callbacksDisabled;
        }
    }, {
        key: "getDTO",
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
        key: "loadFromDTO",
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
        key: "updateFrom",
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
        key: "getGlobalVariableNames",
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
        key: "createNodeFromData",
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

            node.folded = !!data.folded;

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
        key: "addNode",
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
        key: "injectNode",
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
        key: "_addChild",
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
        key: "_setEdgeInitialProbability",
        value: function _setEdgeInitialProbability(edge) {
            if (edge.parentNode instanceof domain.ChanceNode) {
                edge.probability = '#';
            } else {
                edge.probability = undefined;
            }
        }

        /*removes given node and its subtree*/

    }, {
        key: "removeNode",
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
        key: "removeNodes",
        value: function removeNodes(nodes) {
            var _this4 = this;

            var roots = this.findSubtreeRoots(nodes);
            roots.forEach(function (n) {
                return _this4.removeNode(n, 0);
            }, this);
        }
    }, {
        key: "convertNode",
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
        key: "createNodeByType",
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
        key: "replaceNode",
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
        key: "getRoots",
        value: function getRoots() {
            return this.nodes.filter(function (n) {
                return !n.$parent;
            });
        }
    }, {
        key: "findSubtreeRoots",
        value: function findSubtreeRoots(nodes) {
            return nodes.filter(function (n) {
                return !n.$parent || nodes.indexOf(n.$parent) === -1;
            });
        }

        /*creates detached clone of given node*/

    }, {
        key: "cloneSubtree",
        value: function cloneSubtree(nodeToCopy, cloneComputedValues) {
            var self = this;
            var clone = this.cloneNode(nodeToCopy);

            nodeToCopy.childEdges.forEach(function (e) {
                var childClone = self.cloneSubtree(e.childNode, cloneComputedValues);
                childClone.$parent = clone;
                var edge = _sdUtils.Utils.clone(e);
                edge.$id = _sdUtils.Utils.guid();
                edge.parentNode = clone;
                edge.childNode = childClone;
                edge.payoff = _sdUtils.Utils.cloneDeep(e.payoff);
                edge.computed = {};
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
        key: "attachSubtree",
        value: function attachSubtree(nodeToAttach, parent) {
            var self = this;
            var nodeOrEdge = self.addNode(nodeToAttach, parent);

            nodeToAttach.expressionScope = null;

            var childEdges = self.getAllDescendantEdges(nodeToAttach);
            childEdges.forEach(function (e) {
                self.edges.push(e);
                self.nodes.push(e.childNode);
                e.childNode.expressionScope = null;
            });

            return nodeOrEdge;
        }
    }, {
        key: "cloneNodes",
        value: function cloneNodes(nodes) {
            var roots = [];
            //TODO
        }

        /*shallow clone without parent and children*/

    }, {
        key: "cloneNode",
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
        key: "findNodeById",
        value: function findNodeById(id) {
            return _sdUtils.Utils.find(this.nodes, function (n) {
                return n.$id == id;
            });
        }
    }, {
        key: "findEdgeById",
        value: function findEdgeById(id) {
            return _sdUtils.Utils.find(this.edges, function (e) {
                return e.$id == id;
            });
        }
    }, {
        key: "findById",
        value: function findById(id) {
            var node = this.findNodeById(id);
            if (node) {
                return node;
            }
            return this.findEdgeById(id);
        }
    }, {
        key: "_removeNode",
        value: function _removeNode(node) {
            // simply removes node from node list
            var index = this.nodes.indexOf(node);
            if (index > -1) {
                this.nodes.splice(index, 1);
            }
        }
    }, {
        key: "removeEdge",
        value: function removeEdge(edge) {
            var index = edge.parentNode.childEdges.indexOf(edge);
            if (index > -1) {
                edge.parentNode.childEdges.splice(index, 1);
            }
            this._removeEdge(edge);
        }
    }, {
        key: "_removeEdge",
        value: function _removeEdge(edge) {
            //removes edge from edge list without removing connected nodes
            var index = this.edges.indexOf(edge);
            if (index > -1) {
                this.edges.splice(index, 1);
            }
        }
    }, {
        key: "_removeNodes",
        value: function _removeNodes(nodesToRemove) {
            this.nodes = this.nodes.filter(function (n) {
                return nodesToRemove.indexOf(n) === -1;
            });
        }
    }, {
        key: "_removeEdges",
        value: function _removeEdges(edgesToRemove) {
            this.edges = this.edges.filter(function (e) {
                return edgesToRemove.indexOf(e) === -1;
            });
        }
    }, {
        key: "getAllDescendantEdges",
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
        key: "getAllDescendantNodes",
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
        key: "getAllNodesInSubtree",
        value: function getAllNodesInSubtree(node) {
            var descendants = this.getAllDescendantNodes(node);
            descendants.unshift(node);
            return descendants;
        }
    }, {
        key: "isUndoAvailable",
        value: function isUndoAvailable() {
            return !!this.undoStack.length;
        }
    }, {
        key: "isRedoAvailable",
        value: function isRedoAvailable() {
            return !!this.redoStack.length;
        }
    }, {
        key: "createStateSnapshot",
        value: function createStateSnapshot(revertConf) {
            return {
                revertConf: revertConf,
                nodes: _sdUtils.Utils.cloneDeep(this.nodes),
                edges: _sdUtils.Utils.cloneDeep(this.edges),
                texts: _sdUtils.Utils.cloneDeep(this.texts),
                payoffNames: _sdUtils.Utils.cloneDeep(this.payoffNames),
                defaultCriterion1Weight: _sdUtils.Utils.cloneDeep(this.defaultCriterion1Weight),
                weightLowerBound: _sdUtils.Utils.cloneDeep(this.weightLowerBound),
                weightUpperBound: _sdUtils.Utils.cloneDeep(this.weightUpperBound),
                expressionScope: _sdUtils.Utils.cloneDeep(this.expressionScope),
                code: this.code,
                $codeError: this.$codeError
            };
        }
    }, {
        key: "saveStateFromSnapshot",
        value: function saveStateFromSnapshot(state) {
            this.redoStack.length = 0;

            this._pushToStack(this.undoStack, state);

            this._fireUndoRedoCallback();

            return this;
        }
    }, {
        key: "saveState",
        value: function saveState(revertConf) {
            this.saveStateFromSnapshot(this.createStateSnapshot(revertConf));
            return this;
        }
    }, {
        key: "undo",
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
    }, {
        key: "redo",
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
    }, {
        key: "clear",
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
            this.defaultCriterion1Weight = 1;
            this.weightLowerBound = 0;
            this.weightUpperBound = Infinity;
        }
    }, {
        key: "clearComputedValues",
        value: function clearComputedValues() {
            this.nodes.forEach(function (n) {
                return n.clearComputedValues();
            });
            this.edges.forEach(function (e) {
                return e.clearComputedValues();
            });
        }
    }, {
        key: "addText",
        value: function addText(text) {
            this.texts.push(text);

            this._fireTextAddedCallback(text);
        }
    }, {
        key: "removeTexts",
        value: function removeTexts(texts) {
            var _this6 = this;

            texts.forEach(function (t) {
                return _this6.removeText(t);
            });
        }
    }, {
        key: "removeText",
        value: function removeText(text) {
            var index = this.texts.indexOf(text);
            if (index > -1) {
                this.texts.splice(index, 1);
                this._fireTextRemovedCallback(text);
            }
        }
    }, {
        key: "clearExpressionScope",
        value: function clearExpressionScope() {
            var _this7 = this;

            _sdUtils.Utils.forOwn(this.expressionScope, function (value, key) {
                delete _this7.expressionScope[key];
            });
        }
    }, {
        key: "reversePayoffs",
        value: function reversePayoffs() {
            this.payoffNames.reverse();
            this.edges.forEach(function (e) {
                return e.payoff.reverse();
            });
        }
    }, {
        key: "_setNewState",
        value: function _setNewState(newState, redo) {
            var nodeById = _sdUtils.Utils.getObjectByIdMap(newState.nodes);
            var edgeById = _sdUtils.Utils.getObjectByIdMap(newState.edges);
            this.nodes = newState.nodes;
            this.edges = newState.edges;
            this.texts = newState.texts;
            this.payoffNames = newState.payoffNames;
            this.defaultCriterion1Weight = newState.defaultCriterion1Weight;
            this.weightLowerBound = newState.weightLowerBound;
            this.weightUpperBound = newState.weightUpperBound;
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
        key: "_pushToStack",
        value: function _pushToStack(stack, obj) {
            if (stack.length >= this.maxStackSize) {
                stack.shift();
            }
            stack.push(obj);
        }
    }, {
        key: "_fireUndoRedoCallback",
        value: function _fireUndoRedoCallback() {
            if (!this.callbacksDisabled && this.undoRedoStateChangedCallback) {
                this.undoRedoStateChangedCallback();
            }
        }
    }, {
        key: "_fireNodeAddedCallback",
        value: function _fireNodeAddedCallback(node) {
            if (!this.callbacksDisabled && this.nodeAddedCallback) {
                this.nodeAddedCallback(node);
            }
        }
    }, {
        key: "_fireNodeRemovedCallback",
        value: function _fireNodeRemovedCallback(node) {
            if (!this.callbacksDisabled && this.nodeRemovedCallback) {
                this.nodeRemovedCallback(node);
            }
        }
    }, {
        key: "_fireTextAddedCallback",
        value: function _fireTextAddedCallback(text) {
            if (!this.callbacksDisabled && this.textAddedCallback) {
                this.textAddedCallback(text);
            }
        }
    }, {
        key: "_fireTextRemovedCallback",
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

    // is code changed without reevaluation?
    //Point

    function Node(type, location) {
        _classCallCheck(this, Node);

        var _this = _possibleConstructorReturn(this, (Node.__proto__ || Object.getPrototypeOf(Node)).call(this));

        _this.childEdges = [];
        _this.name = '';
        _this.code = '';
        _this.$codeDirty = false;
        _this.$codeError = null;
        _this.expressionScope = null;
        _this.folded = false;
        _this.$DISPLAY_VALUE_NAMES = ['childrenPayoff', 'aggregatedPayoff', 'probabilityToEnter', 'optimal'];

        _this.location = location;
        if (!location) {
            _this.location = new _point.Point(0, 0);
        }
        _this.type = type;
        return _this;
    } // is node folded along with its subtree

    //code evaluation errors

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
            this.computed = _sdUtils.Utils.cloneDeep(computed);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZGF0YS1tb2RlbC5qcyIsInNyYy9kb21haW4vZWRnZS5qcyIsInNyYy9kb21haW4vaW5kZXguanMiLCJzcmMvZG9tYWluL25vZGUvY2hhbmNlLW5vZGUuanMiLCJzcmMvZG9tYWluL25vZGUvZGVjaXNpb24tbm9kZS5qcyIsInNyYy9kb21haW4vbm9kZS9ub2RlLmpzIiwic3JjL2RvbWFpbi9ub2RlL3Rlcm1pbmFsLW5vZGUuanMiLCJzcmMvZG9tYWluL29iamVjdC13aXRoLWNvbXB1dGVkLXZhbHVlcy5qcyIsInNyYy9kb21haW4vb2JqZWN0LXdpdGgtaWQtYW5kLWVkaXRhYmxlLWZpZWxkcy5qcyIsInNyYy9kb21haW4vcG9pbnQuanMiLCJzcmMvZG9tYWluL3RleHQuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvdmFsaWRhdGlvbi1yZXN1bHQuanMiLCJpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDQUE7O0FBQ0E7O0ksQUFBWTs7QUFDWjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7OztJLEFBR2Esb0IsQUFBQSx3QkFjVTtBQUZHO0FBcUJ0Qjt1QkFBQSxBQUFZLE1BQU07OEJBQUE7O2FBL0JsQixBQStCa0IsUUEvQlYsQUErQlU7YUE5QmxCLEFBOEJrQixRQTlCVixBQThCVTthQTVCbEIsQUE0QmtCLFFBNUJWLEFBNEJVO2FBM0JsQixBQTJCa0IsY0EzQkosQUEyQkk7YUExQmxCLEFBMEJrQiwwQkExQlEsQUEwQlI7YUF6QmxCLEFBeUJrQixtQkF6QkMsQUF5QkQ7YUF4QmxCLEFBd0JrQixtQkF4QkMsQUF3QkQ7YUFyQmxCLEFBcUJrQixrQkFyQkEsQUFxQkE7YUFwQmxCLEFBb0JrQixPQXBCWCxBQW9CVzthQW5CbEIsQUFtQmtCLGFBbkJMLEFBbUJLO2FBbEJsQixBQWtCa0IsYUFsQkwsQUFrQks7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eUIsQUFDcEM7Z0JBQUcsQ0FBSCxBQUFJLE1BQUssQUFDTDt1QkFBQSxBQUFLLEFBQ0w7cUJBQUEsQUFBSyxnQkFBZ0IsSUFBckIsQUFBeUIsT0FBekIsQUFBK0IsQUFDbEM7QUFDRDt5QkFBQSxBQUFhLEtBQWIsQUFBa0IsQUFDbEI7aUJBQUEsQUFBSyxLQUFMLEFBQVUsQUFDYjs7OzttQyxBQUVVLE0sQUFBTSxLQUFJLEFBQ2pCO2dCQUFJLElBQUksS0FBQSxBQUFLLFNBQWIsQUFBUSxBQUFjLEFBQ3RCO2dCQUFHLENBQUgsQUFBSSxHQUFFLEFBQ0Y7b0JBQUEsQUFBRSxBQUNGO3FCQUFBLEFBQUssU0FBTCxBQUFjLFFBQWQsQUFBb0IsQUFDdkI7QUFDRDtjQUFBLEFBQUUsS0FBRixBQUFPLEFBQ1Y7Ozs7a0NBRVEsQUFDTDttQkFBTyxPQUFBLEFBQU8sb0JBQW9CLEtBQTNCLEFBQWdDLFFBQWhDLEFBQXdDLFdBQS9DLEFBQTBELEFBQzdEOzs7O3NDLEFBRW9CLEtBQUksQUFDckI7Z0JBQUksSUFBSSxJQUFSLEFBQVEsQUFBSSxBQUNaO2NBQUEsQUFBRSxTQUFTLElBQVgsQUFBZSxBQUNmO2NBQUEsQUFBRSxXQUFXLElBQWIsQUFBaUIsQUFDakI7Y0FBQSxBQUFFLGtCQUFrQixJQUFwQixBQUF3QixBQUN4QjttQkFBQSxBQUFPLEFBQ1Y7Ozs7Ozs7Ozs7Ozs7Ozs7QUMvQ0wsMkNBQUE7aURBQUE7O2dCQUFBO3dCQUFBO29CQUFBO0FBQUE7QUFBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQge1V0aWxzLCBsb2d9IGZyb20gXCJzZC11dGlsc1wiO1xuaW1wb3J0ICogYXMgZG9tYWluIGZyb20gXCIuL2RvbWFpblwiO1xuaW1wb3J0IHtWYWxpZGF0aW9uUmVzdWx0fSBmcm9tIFwiLi92YWxpZGF0aW9uLXJlc3VsdFwiO1xuXG4vKlxuICogRGF0YSBtb2RlbCBtYW5hZ2VyXG4gKiAqL1xuZXhwb3J0IGNsYXNzIERhdGFNb2RlbCB7XG5cbiAgICBub2RlcyA9IFtdO1xuICAgIGVkZ2VzID0gW107XG5cbiAgICB0ZXh0cyA9IFtdOyAvL2Zsb2F0aW5nIHRleHRzXG4gICAgcGF5b2ZmTmFtZXMgPSBbXTtcbiAgICBkZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCA9IDE7XG4gICAgd2VpZ2h0TG93ZXJCb3VuZCA9IDA7XG4gICAgd2VpZ2h0VXBwZXJCb3VuZCA9IEluZmluaXR5O1xuXG5cbiAgICBleHByZXNzaW9uU2NvcGUgPSB7fTsgLy9nbG9iYWwgZXhwcmVzc2lvbiBzY29wZVxuICAgIGNvZGUgPSBcIlwiOy8vZ2xvYmFsIGV4cHJlc3Npb24gY29kZVxuICAgICRjb2RlRXJyb3IgPSBudWxsOyAvL2NvZGUgZXZhbHVhdGlvbiBlcnJvcnNcbiAgICAkY29kZURpcnR5ID0gZmFsc2U7IC8vIGlzIGNvZGUgY2hhbmdlZCB3aXRob3V0IHJlZXZhbHVhdGlvbj9cbiAgICAkdmVyc2lvbj0xO1xuXG4gICAgdmFsaWRhdGlvblJlc3VsdHMgPSBbXTtcblxuICAgIC8vIHVuZG8gLyByZWRvXG4gICAgbWF4U3RhY2tTaXplID0gMjA7XG4gICAgdW5kb1N0YWNrID0gW107XG4gICAgcmVkb1N0YWNrID0gW107XG4gICAgdW5kb1JlZG9TdGF0ZUNoYW5nZWRDYWxsYmFjayA9IG51bGw7XG4gICAgbm9kZUFkZGVkQ2FsbGJhY2sgPSBudWxsO1xuICAgIG5vZGVSZW1vdmVkQ2FsbGJhY2sgPSBudWxsO1xuXG4gICAgdGV4dEFkZGVkQ2FsbGJhY2sgPSBudWxsO1xuICAgIHRleHRSZW1vdmVkQ2FsbGJhY2sgPSBudWxsO1xuXG4gICAgY2FsbGJhY2tzRGlzYWJsZWQgPSBmYWxzZTtcblxuICAgIGNvbnN0cnVjdG9yKGRhdGEpIHtcbiAgICAgICAgaWYoZGF0YSl7XG4gICAgICAgICAgICB0aGlzLmxvYWQoZGF0YSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRKc29uUmVwbGFjZXIoZmlsdGVyTG9jYXRpb249ZmFsc2UsIGZpbHRlckNvbXB1dGVkPWZhbHNlLCByZXBsYWNlciwgZmlsdGVyUHJpdmF0ZSA9dHJ1ZSl7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoaywgdikge1xuXG4gICAgICAgICAgICBpZiAoKGZpbHRlclByaXZhdGUgJiYgVXRpbHMuc3RhcnRzV2l0aChrLCAnJCcpKSB8fCBrID09ICdwYXJlbnROb2RlJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmlsdGVyTG9jYXRpb24gJiYgayA9PSAnbG9jYXRpb24nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmaWx0ZXJDb21wdXRlZCAmJiBrID09ICdjb21wdXRlZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocmVwbGFjZXIpe1xuICAgICAgICAgICAgICAgIHJldHVybiByZXBsYWNlcihrLCB2KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXJpYWxpemUoc3RyaW5naWZ5PXRydWUsIGZpbHRlckxvY2F0aW9uPWZhbHNlLCBmaWx0ZXJDb21wdXRlZD1mYWxzZSwgcmVwbGFjZXIsIGZpbHRlclByaXZhdGUgPXRydWUpe1xuICAgICAgICB2YXIgZGF0YSA9ICB7XG4gICAgICAgICAgICBjb2RlOiB0aGlzLmNvZGUsXG4gICAgICAgICAgICBleHByZXNzaW9uU2NvcGU6IHRoaXMuZXhwcmVzc2lvblNjb3BlLFxuICAgICAgICAgICAgdHJlZXM6IHRoaXMuZ2V0Um9vdHMoKSxcbiAgICAgICAgICAgIHRleHRzOiB0aGlzLnRleHRzLFxuICAgICAgICAgICAgcGF5b2ZmTmFtZXM6IHRoaXMucGF5b2ZmTmFtZXMuc2xpY2UoKSxcbiAgICAgICAgICAgIGRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0OiB0aGlzLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0LFxuICAgICAgICAgICAgd2VpZ2h0TG93ZXJCb3VuZDogdGhpcy53ZWlnaHRMb3dlckJvdW5kLFxuICAgICAgICAgICAgd2VpZ2h0VXBwZXJCb3VuZDogdGhpcy53ZWlnaHRVcHBlckJvdW5kXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYoIXN0cmluZ2lmeSl7XG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBVdGlscy5zdHJpbmdpZnkoZGF0YSwgdGhpcy5nZXRKc29uUmVwbGFjZXIoZmlsdGVyTG9jYXRpb24sIGZpbHRlckNvbXB1dGVkLCByZXBsYWNlciwgZmlsdGVyUHJpdmF0ZSksIFtdKTtcbiAgICB9XG5cblxuICAgIC8qTG9hZHMgc2VyaWFsaXplZCBkYXRhKi9cbiAgICBsb2FkKGRhdGEpIHtcbiAgICAgICAgLy9yb290cywgdGV4dHMsIGNvZGUsIGV4cHJlc3Npb25TY29wZVxuICAgICAgICB2YXIgY2FsbGJhY2tzRGlzYWJsZWQgPSB0aGlzLmNhbGxiYWNrc0Rpc2FibGVkO1xuICAgICAgICB0aGlzLmNhbGxiYWNrc0Rpc2FibGVkID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLmNsZWFyKCk7XG5cblxuICAgICAgICBkYXRhLnRyZWVzLmZvckVhY2gobm9kZURhdGE9PiB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMuY3JlYXRlTm9kZUZyb21EYXRhKG5vZGVEYXRhKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGRhdGEudGV4dHMpIHtcbiAgICAgICAgICAgIGRhdGEudGV4dHMuZm9yRWFjaCh0ZXh0RGF0YT0+IHtcbiAgICAgICAgICAgICAgICB2YXIgbG9jYXRpb24gPSBuZXcgZG9tYWluLlBvaW50KHRleHREYXRhLmxvY2F0aW9uLngsIHRleHREYXRhLmxvY2F0aW9uLnkpO1xuICAgICAgICAgICAgICAgIHZhciB0ZXh0ID0gbmV3IGRvbWFpbi5UZXh0KGxvY2F0aW9uLCB0ZXh0RGF0YS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy50ZXh0cy5wdXNoKHRleHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2xlYXJFeHByZXNzaW9uU2NvcGUoKTtcbiAgICAgICAgdGhpcy5jb2RlID0gZGF0YS5jb2RlIHx8ICcnO1xuXG4gICAgICAgIGlmIChkYXRhLmV4cHJlc3Npb25TY29wZSkge1xuICAgICAgICAgICAgVXRpbHMuZXh0ZW5kKHRoaXMuZXhwcmVzc2lvblNjb3BlLCBkYXRhLmV4cHJlc3Npb25TY29wZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS5wYXlvZmZOYW1lcyAhPT0gdW5kZWZpbmVkICYmIGRhdGEucGF5b2ZmTmFtZXMgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMucGF5b2ZmTmFtZXMgPSBkYXRhLnBheW9mZk5hbWVzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQgIT09IHVuZGVmaW5lZCAmJiBkYXRhLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0ID0gZGF0YS5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLndlaWdodExvd2VyQm91bmQgIT09IHVuZGVmaW5lZCAmJiBkYXRhLndlaWdodExvd2VyQm91bmQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMud2VpZ2h0TG93ZXJCb3VuZCA9IGRhdGEud2VpZ2h0TG93ZXJCb3VuZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLndlaWdodFVwcGVyQm91bmQgIT09IHVuZGVmaW5lZCAmJiBkYXRhLndlaWdodFVwcGVyQm91bmQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMud2VpZ2h0VXBwZXJCb3VuZCA9IGRhdGEud2VpZ2h0VXBwZXJCb3VuZDtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgdGhpcy5jYWxsYmFja3NEaXNhYmxlZCA9IGNhbGxiYWNrc0Rpc2FibGVkO1xuICAgIH1cblxuICAgIGdldERUTyhmaWx0ZXJMb2NhdGlvbj1mYWxzZSwgZmlsdGVyQ29tcHV0ZWQ9ZmFsc2UsIGZpbHRlclByaXZhdGUgPWZhbHNlKXtcbiAgICAgICAgdmFyIGR0byA9IHtcbiAgICAgICAgICAgIHNlcmlhbGl6ZWREYXRhOiB0aGlzLnNlcmlhbGl6ZSh0cnVlLCBmaWx0ZXJMb2NhdGlvbiwgZmlsdGVyQ29tcHV0ZWQsIG51bGwsIGZpbHRlclByaXZhdGUpLFxuICAgICAgICAgICAgJGNvZGVFcnJvcjogdGhpcy4kY29kZUVycm9yLFxuICAgICAgICAgICAgJGNvZGVEaXJ0eTogdGhpcy4kY29kZURpcnR5LFxuICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdHM6IHRoaXMudmFsaWRhdGlvblJlc3VsdHMuc2xpY2UoKVxuXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBkdG9cbiAgICB9XG5cbiAgICBsb2FkRnJvbURUTyhkdG8sIGRhdGFSZXZpdmVyKXtcbiAgICAgICAgdGhpcy5sb2FkKEpTT04ucGFyc2UoZHRvLnNlcmlhbGl6ZWREYXRhLCBkYXRhUmV2aXZlcikpO1xuICAgICAgICB0aGlzLiRjb2RlRXJyb3IgPSBkdG8uJGNvZGVFcnJvcjtcbiAgICAgICAgdGhpcy4kY29kZURpcnR5ID0gZHRvLiRjb2RlRGlydHk7XG4gICAgICAgIHRoaXMudmFsaWRhdGlvblJlc3VsdHMubGVuZ3RoPTA7XG4gICAgICAgIGR0by52YWxpZGF0aW9uUmVzdWx0cy5mb3JFYWNoKHY9PntcbiAgICAgICAgICAgIHRoaXMudmFsaWRhdGlvblJlc3VsdHMucHVzaChWYWxpZGF0aW9uUmVzdWx0LmNyZWF0ZUZyb21EVE8odikpXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgLypUaGlzIG1ldGhvZCB1cGRhdGVzIG9ubHkgY29tcHV0YXRpb24gcmVzdWx0cy92YWxpZGF0aW9uKi9cbiAgICB1cGRhdGVGcm9tKGRhdGFNb2RlbCl7XG4gICAgICAgIGlmKHRoaXMuJHZlcnNpb24+ZGF0YU1vZGVsLiR2ZXJzaW9uKXtcbiAgICAgICAgICAgIGxvZy53YXJuKFwiRGF0YU1vZGVsLnVwZGF0ZUZyb206IHZlcnNpb24gb2YgY3VycmVudCBtb2RlbCBncmVhdGVyIHRoYW4gdXBkYXRlXCIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGJ5SWQgPSB7fVxuICAgICAgICBkYXRhTW9kZWwubm9kZXMuZm9yRWFjaChuPT57XG4gICAgICAgICAgICBieUlkW24uJGlkXSA9IG47XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLm5vZGVzLmZvckVhY2goKG4saSk9PntcbiAgICAgICAgICAgIGlmKGJ5SWRbbi4kaWRdKXtcbiAgICAgICAgICAgICAgICBuLmxvYWRDb21wdXRlZFZhbHVlcyhieUlkW24uJGlkXS5jb21wdXRlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBkYXRhTW9kZWwuZWRnZXMuZm9yRWFjaChlPT57XG4gICAgICAgICAgICBieUlkW2UuJGlkXSA9IGU7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmVkZ2VzLmZvckVhY2goKGUsaSk9PntcbiAgICAgICAgICAgIGlmKGJ5SWRbZS4kaWRdKXtcbiAgICAgICAgICAgICAgICBlLmxvYWRDb21wdXRlZFZhbHVlcyhieUlkW2UuJGlkXS5jb21wdXRlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmV4cHJlc3Npb25TY29wZSA9IGRhdGFNb2RlbC5leHByZXNzaW9uU2NvcGU7XG4gICAgICAgIHRoaXMuJGNvZGVFcnJvciA9IGRhdGFNb2RlbC4kY29kZUVycm9yO1xuICAgICAgICB0aGlzLiRjb2RlRGlydHkgPSBkYXRhTW9kZWwuJGNvZGVEaXJ0eTtcbiAgICAgICAgdGhpcy52YWxpZGF0aW9uUmVzdWx0cyAgPSBkYXRhTW9kZWwudmFsaWRhdGlvblJlc3VsdHM7XG4gICAgfVxuXG4gICAgZ2V0R2xvYmFsVmFyaWFibGVOYW1lcyhmaWx0ZXJGdW5jdGlvbiA9IHRydWUpe1xuICAgICAgICB2YXIgcmVzID0gW107XG4gICAgICAgIFV0aWxzLmZvck93bih0aGlzLmV4cHJlc3Npb25TY29wZSwgKHZhbHVlLCBrZXkpPT57XG4gICAgICAgICAgICBpZihmaWx0ZXJGdW5jdGlvbiAmJiBVdGlscy5pc0Z1bmN0aW9uKHZhbHVlKSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLnB1c2goa2V5KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuXG4gICAgLypjcmVhdGUgbm9kZSBmcm9tIHNlcmlhbGl6ZWQgZGF0YSovXG4gICAgY3JlYXRlTm9kZUZyb21EYXRhKGRhdGEsIHBhcmVudCkge1xuICAgICAgICB2YXIgbm9kZSwgbG9jYXRpb247XG5cbiAgICAgICAgaWYoZGF0YS5sb2NhdGlvbil7XG4gICAgICAgICAgICBsb2NhdGlvbiA9IG5ldyBkb21haW4uUG9pbnQoZGF0YS5sb2NhdGlvbi54LCBkYXRhLmxvY2F0aW9uLnkpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGxvY2F0aW9uID0gbmV3IGRvbWFpbi5Qb2ludCgwLDApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRvbWFpbi5EZWNpc2lvbk5vZGUuJFRZUEUgPT0gZGF0YS50eXBlKSB7XG4gICAgICAgICAgICBub2RlID0gbmV3IGRvbWFpbi5EZWNpc2lvbk5vZGUobG9jYXRpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKGRvbWFpbi5DaGFuY2VOb2RlLiRUWVBFID09IGRhdGEudHlwZSkge1xuICAgICAgICAgICAgbm9kZSA9IG5ldyBkb21haW4uQ2hhbmNlTm9kZShsb2NhdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoZG9tYWluLlRlcm1pbmFsTm9kZS4kVFlQRSA9PSBkYXRhLnR5cGUpIHtcbiAgICAgICAgICAgIG5vZGUgPSBuZXcgZG9tYWluLlRlcm1pbmFsTm9kZShsb2NhdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYoZGF0YS4kaWQpe1xuICAgICAgICAgICAgbm9kZS4kaWQgPSBkYXRhLiRpZDtcbiAgICAgICAgfVxuICAgICAgICBpZihkYXRhLiRmaWVsZFN0YXR1cyl7XG4gICAgICAgICAgICBub2RlLiRmaWVsZFN0YXR1cyA9IGRhdGEuJGZpZWxkU3RhdHVzO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUubmFtZSA9IGRhdGEubmFtZTtcblxuICAgICAgICBpZihkYXRhLmNvZGUpe1xuICAgICAgICAgICAgbm9kZS5jb2RlID0gZGF0YS5jb2RlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkYXRhLmV4cHJlc3Npb25TY29wZSkge1xuICAgICAgICAgICAgbm9kZS5leHByZXNzaW9uU2NvcGUgPSBkYXRhLmV4cHJlc3Npb25TY29wZVxuICAgICAgICB9XG4gICAgICAgIGlmKGRhdGEuY29tcHV0ZWQpe1xuICAgICAgICAgICAgbm9kZS5sb2FkQ29tcHV0ZWRWYWx1ZXMoZGF0YS5jb21wdXRlZCk7XG4gICAgICAgIH1cblxuICAgICAgICBub2RlLmZvbGRlZCA9ICEhZGF0YS5mb2xkZWQ7XG5cbiAgICAgICAgdmFyIGVkZ2VPck5vZGUgPSB0aGlzLmFkZE5vZGUobm9kZSwgcGFyZW50KTtcbiAgICAgICAgZGF0YS5jaGlsZEVkZ2VzLmZvckVhY2goZWQ9PiB7XG4gICAgICAgICAgICB2YXIgZWRnZSA9IHRoaXMuY3JlYXRlTm9kZUZyb21EYXRhKGVkLmNoaWxkTm9kZSwgbm9kZSk7XG4gICAgICAgICAgICBpZihVdGlscy5pc0FycmF5KGVkLnBheW9mZikpe1xuICAgICAgICAgICAgICAgIGVkZ2UucGF5b2ZmID0gZWQucGF5b2ZmO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgZWRnZS5wYXlvZmYgPSBbZWQucGF5b2ZmLCAwXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWRnZS5wcm9iYWJpbGl0eSA9IGVkLnByb2JhYmlsaXR5O1xuICAgICAgICAgICAgZWRnZS5uYW1lID0gZWQubmFtZTtcbiAgICAgICAgICAgIGlmKGVkLmNvbXB1dGVkKXtcbiAgICAgICAgICAgICAgICBlZGdlLmxvYWRDb21wdXRlZFZhbHVlcyhlZC5jb21wdXRlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihlZC4kaWQpe1xuICAgICAgICAgICAgICAgIGVkZ2UuJGlkID0gZWQuJGlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZWQuJGZpZWxkU3RhdHVzKXtcbiAgICAgICAgICAgICAgICBlZGdlLiRmaWVsZFN0YXR1cyA9IGVkLiRmaWVsZFN0YXR1cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGVkZ2VPck5vZGU7XG4gICAgfVxuXG4gICAgLypyZXR1cm5zIG5vZGUgb3IgZWRnZSBmcm9tIHBhcmVudCB0byB0aGlzIG5vZGUqL1xuICAgIGFkZE5vZGUobm9kZSwgcGFyZW50KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5ub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgICAgICB2YXIgZWRnZSA9IHNlbGYuX2FkZENoaWxkKHBhcmVudCwgbm9kZSk7XG4gICAgICAgICAgICB0aGlzLl9maXJlTm9kZUFkZGVkQ2FsbGJhY2sobm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gZWRnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhub2RlKTtcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgLyppbmplY3RzIGdpdmVuIG5vZGUgaW50byBnaXZlbiBlZGdlKi9cbiAgICBpbmplY3ROb2RlKG5vZGUsIGVkZ2UpIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IGVkZ2UucGFyZW50Tm9kZTtcbiAgICAgICAgdmFyIGNoaWxkID0gZWRnZS5jaGlsZE5vZGU7XG4gICAgICAgIHRoaXMubm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgbm9kZS4kcGFyZW50ID0gcGFyZW50O1xuICAgICAgICBlZGdlLmNoaWxkTm9kZSA9IG5vZGU7XG4gICAgICAgIHRoaXMuX2FkZENoaWxkKG5vZGUsIGNoaWxkKTtcbiAgICAgICAgdGhpcy5fZmlyZU5vZGVBZGRlZENhbGxiYWNrKG5vZGUpO1xuICAgIH1cblxuICAgIF9hZGRDaGlsZChwYXJlbnQsIGNoaWxkKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGVkZ2UgPSBuZXcgZG9tYWluLkVkZ2UocGFyZW50LCBjaGlsZCk7XG4gICAgICAgIHNlbGYuX3NldEVkZ2VJbml0aWFsUHJvYmFiaWxpdHkoZWRnZSk7XG4gICAgICAgIHNlbGYuZWRnZXMucHVzaChlZGdlKTtcblxuICAgICAgICBwYXJlbnQuY2hpbGRFZGdlcy5wdXNoKGVkZ2UpO1xuICAgICAgICBjaGlsZC4kcGFyZW50ID0gcGFyZW50O1xuICAgICAgICByZXR1cm4gZWRnZTtcbiAgICB9XG5cbiAgICBfc2V0RWRnZUluaXRpYWxQcm9iYWJpbGl0eShlZGdlKSB7XG4gICAgICAgIGlmIChlZGdlLnBhcmVudE5vZGUgaW5zdGFuY2VvZiBkb21haW4uQ2hhbmNlTm9kZSkge1xuICAgICAgICAgICAgZWRnZS5wcm9iYWJpbGl0eSA9ICcjJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVkZ2UucHJvYmFiaWxpdHkgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8qcmVtb3ZlcyBnaXZlbiBub2RlIGFuZCBpdHMgc3VidHJlZSovXG4gICAgcmVtb3ZlTm9kZShub2RlLCAkbCA9IDApIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIG5vZGUuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PnNlbGYucmVtb3ZlTm9kZShlLmNoaWxkTm9kZSwgJGwgKyAxKSk7XG5cbiAgICAgICAgc2VsZi5fcmVtb3ZlTm9kZShub2RlKTtcbiAgICAgICAgdmFyIHBhcmVudCA9IG5vZGUuJHBhcmVudDtcbiAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgdmFyIHBhcmVudEVkZ2UgPSBVdGlscy5maW5kKHBhcmVudC5jaGlsZEVkZ2VzLCAoZSwgaSk9PiBlLmNoaWxkTm9kZSA9PT0gbm9kZSk7XG4gICAgICAgICAgICBpZiAoJGwgPT0gMCkge1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlRWRnZShwYXJlbnRFZGdlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fcmVtb3ZlRWRnZShwYXJlbnRFZGdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9maXJlTm9kZVJlbW92ZWRDYWxsYmFjayhub2RlKTtcbiAgICB9XG5cbiAgICAvKnJlbW92ZXMgZ2l2ZW4gbm9kZXMgYW5kIHRoZWlyIHN1YnRyZWVzKi9cbiAgICByZW1vdmVOb2Rlcyhub2Rlcykge1xuXG4gICAgICAgIHZhciByb290cyA9IHRoaXMuZmluZFN1YnRyZWVSb290cyhub2Rlcyk7XG4gICAgICAgIHJvb3RzLmZvckVhY2gobj0+dGhpcy5yZW1vdmVOb2RlKG4sIDApLCB0aGlzKTtcbiAgICB9XG5cbiAgICBjb252ZXJ0Tm9kZShub2RlLCB0eXBlVG9Db252ZXJ0VG8pe1xuICAgICAgICB2YXIgbmV3Tm9kZTtcbiAgICAgICAgaWYoIW5vZGUuY2hpbGRFZGdlcy5sZW5ndGggJiYgbm9kZS4kcGFyZW50KXtcbiAgICAgICAgICAgIG5ld05vZGUgPSB0aGlzLmNyZWF0ZU5vZGVCeVR5cGUodHlwZVRvQ29udmVydFRvLCBub2RlLmxvY2F0aW9uKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBpZihub2RlIGluc3RhbmNlb2YgZG9tYWluLkRlY2lzaW9uTm9kZSAmJiB0eXBlVG9Db252ZXJ0VG89PWRvbWFpbi5DaGFuY2VOb2RlLiRUWVBFKXtcbiAgICAgICAgICAgICAgICBuZXdOb2RlID0gdGhpcy5jcmVhdGVOb2RlQnlUeXBlKHR5cGVUb0NvbnZlcnRUbywgbm9kZS5sb2NhdGlvbik7XG4gICAgICAgICAgICB9ZWxzZSBpZih0eXBlVG9Db252ZXJ0VG89PWRvbWFpbi5EZWNpc2lvbk5vZGUuJFRZUEUpe1xuICAgICAgICAgICAgICAgIG5ld05vZGUgPSB0aGlzLmNyZWF0ZU5vZGVCeVR5cGUodHlwZVRvQ29udmVydFRvLCBub2RlLmxvY2F0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmKG5ld05vZGUpe1xuICAgICAgICAgICAgbmV3Tm9kZS5uYW1lPW5vZGUubmFtZTtcbiAgICAgICAgICAgIHRoaXMucmVwbGFjZU5vZGUobmV3Tm9kZSwgbm9kZSk7XG4gICAgICAgICAgICBuZXdOb2RlLmNoaWxkRWRnZXMuZm9yRWFjaChlPT50aGlzLl9zZXRFZGdlSW5pdGlhbFByb2JhYmlsaXR5KGUpKTtcbiAgICAgICAgICAgIHRoaXMuX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhuZXdOb2RlKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgY3JlYXRlTm9kZUJ5VHlwZSh0eXBlLCBsb2NhdGlvbil7XG4gICAgICAgIGlmKHR5cGU9PWRvbWFpbi5EZWNpc2lvbk5vZGUuJFRZUEUpe1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBkb21haW4uRGVjaXNpb25Ob2RlKGxvY2F0aW9uKVxuICAgICAgICB9ZWxzZSBpZih0eXBlPT1kb21haW4uQ2hhbmNlTm9kZS4kVFlQRSl7XG4gICAgICAgICAgICByZXR1cm4gbmV3IGRvbWFpbi5DaGFuY2VOb2RlKGxvY2F0aW9uKVxuICAgICAgICB9ZWxzZSBpZih0eXBlPT1kb21haW4uVGVybWluYWxOb2RlLiRUWVBFKXtcbiAgICAgICAgICAgIHJldHVybiBuZXcgZG9tYWluLlRlcm1pbmFsTm9kZShsb2NhdGlvbilcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlcGxhY2VOb2RlKG5ld05vZGUsIG9sZE5vZGUpe1xuICAgICAgICB2YXIgcGFyZW50ID0gb2xkTm9kZS4kcGFyZW50O1xuICAgICAgICBuZXdOb2RlLiRwYXJlbnQgPSBwYXJlbnQ7XG5cbiAgICAgICAgaWYocGFyZW50KXtcbiAgICAgICAgICAgIHZhciBwYXJlbnRFZGdlID0gVXRpbHMuZmluZChuZXdOb2RlLiRwYXJlbnQuY2hpbGRFZGdlcywgZT0+ZS5jaGlsZE5vZGU9PT1vbGROb2RlKTtcbiAgICAgICAgICAgIHBhcmVudEVkZ2UuY2hpbGROb2RlID0gbmV3Tm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5ld05vZGUuY2hpbGRFZGdlcyA9IG9sZE5vZGUuY2hpbGRFZGdlcztcbiAgICAgICAgbmV3Tm9kZS5jaGlsZEVkZ2VzLmZvckVhY2goZT0+ZS5wYXJlbnROb2RlPW5ld05vZGUpO1xuXG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMubm9kZXMuaW5kZXhPZihvbGROb2RlKTtcbiAgICAgICAgaWYofmluZGV4KXtcbiAgICAgICAgICAgIHRoaXMubm9kZXNbaW5kZXhdPW5ld05vZGU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRSb290cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZXMuZmlsdGVyKG49PiFuLiRwYXJlbnQpO1xuICAgIH1cblxuICAgIGZpbmRTdWJ0cmVlUm9vdHMobm9kZXMpIHtcbiAgICAgICAgcmV0dXJuIG5vZGVzLmZpbHRlcihuPT4hbi4kcGFyZW50IHx8IG5vZGVzLmluZGV4T2Yobi4kcGFyZW50KSA9PT0gLTEpO1xuICAgIH1cblxuICAgIC8qY3JlYXRlcyBkZXRhY2hlZCBjbG9uZSBvZiBnaXZlbiBub2RlKi9cbiAgICBjbG9uZVN1YnRyZWUobm9kZVRvQ29weSwgY2xvbmVDb21wdXRlZFZhbHVlcykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBjbG9uZSA9IHRoaXMuY2xvbmVOb2RlKG5vZGVUb0NvcHkpO1xuXG4gICAgICAgIG5vZGVUb0NvcHkuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PiB7XG4gICAgICAgICAgICB2YXIgY2hpbGRDbG9uZSA9IHNlbGYuY2xvbmVTdWJ0cmVlKGUuY2hpbGROb2RlLCBjbG9uZUNvbXB1dGVkVmFsdWVzKTtcbiAgICAgICAgICAgIGNoaWxkQ2xvbmUuJHBhcmVudCA9IGNsb25lO1xuICAgICAgICAgICAgdmFyIGVkZ2UgPSBVdGlscy5jbG9uZShlKTtcbiAgICAgICAgICAgIGVkZ2UuJGlkID0gVXRpbHMuZ3VpZCgpO1xuICAgICAgICAgICAgZWRnZS5wYXJlbnROb2RlID0gY2xvbmU7XG4gICAgICAgICAgICBlZGdlLmNoaWxkTm9kZSA9IGNoaWxkQ2xvbmU7XG4gICAgICAgICAgICBlZGdlLnBheW9mZiA9IFV0aWxzLmNsb25lRGVlcChlLnBheW9mZik7XG4gICAgICAgICAgICBlZGdlLmNvbXB1dGVkID0ge307XG4gICAgICAgICAgICBpZiAoY2xvbmVDb21wdXRlZFZhbHVlcykge1xuICAgICAgICAgICAgICAgIGVkZ2UuY29tcHV0ZWQgPSBVdGlscy5jbG9uZURlZXAoZS5jb21wdXRlZCk7XG4gICAgICAgICAgICAgICAgY2hpbGRDbG9uZS5jb21wdXRlZCA9IFV0aWxzLmNsb25lRGVlcChlLmNoaWxkTm9kZS5jb21wdXRlZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNsb25lLmNoaWxkRWRnZXMucHVzaChlZGdlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChjbG9uZUNvbXB1dGVkVmFsdWVzKSB7XG4gICAgICAgICAgICBjbG9uZS5jb21wdXRlZCA9IFV0aWxzLmNsb25lRGVlcChub2RlVG9Db3B5LmNvbXB1dGVkKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjbG9uZTtcbiAgICB9XG5cbiAgICAvKmF0dGFjaGVzIGRldGFjaGVkIHN1YnRyZWUgdG8gZ2l2ZW4gcGFyZW50Ki9cbiAgICBhdHRhY2hTdWJ0cmVlKG5vZGVUb0F0dGFjaCwgcGFyZW50KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG5vZGVPckVkZ2UgPSBzZWxmLmFkZE5vZGUobm9kZVRvQXR0YWNoLCBwYXJlbnQpO1xuXG4gICAgICAgIG5vZGVUb0F0dGFjaC5leHByZXNzaW9uU2NvcGUgPSBudWxsO1xuXG4gICAgICAgIHZhciBjaGlsZEVkZ2VzID0gc2VsZi5nZXRBbGxEZXNjZW5kYW50RWRnZXMobm9kZVRvQXR0YWNoKTtcbiAgICAgICAgY2hpbGRFZGdlcy5mb3JFYWNoKGU9PiB7XG4gICAgICAgICAgICBzZWxmLmVkZ2VzLnB1c2goZSk7XG4gICAgICAgICAgICBzZWxmLm5vZGVzLnB1c2goZS5jaGlsZE5vZGUpO1xuICAgICAgICAgICAgZS5jaGlsZE5vZGUuZXhwcmVzc2lvblNjb3BlID0gbnVsbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG5vZGVPckVkZ2U7XG4gICAgfVxuXG4gICAgY2xvbmVOb2Rlcyhub2Rlcykge1xuICAgICAgICB2YXIgcm9vdHMgPSBbXVxuICAgICAgICAvL1RPRE9cbiAgICB9XG5cbiAgICAvKnNoYWxsb3cgY2xvbmUgd2l0aG91dCBwYXJlbnQgYW5kIGNoaWxkcmVuKi9cbiAgICBjbG9uZU5vZGUobm9kZSkge1xuICAgICAgICB2YXIgY2xvbmUgPSBVdGlscy5jbG9uZShub2RlKVxuICAgICAgICBjbG9uZS4kaWQgPSBVdGlscy5ndWlkKCk7XG4gICAgICAgIGNsb25lLmxvY2F0aW9uID0gVXRpbHMuY2xvbmUobm9kZS5sb2NhdGlvbik7XG4gICAgICAgIGNsb25lLmNvbXB1dGVkID0gVXRpbHMuY2xvbmUobm9kZS5jb21wdXRlZCk7XG4gICAgICAgIGNsb25lLiRwYXJlbnQgPSBudWxsO1xuICAgICAgICBjbG9uZS5jaGlsZEVkZ2VzID0gW107XG4gICAgICAgIHJldHVybiBjbG9uZTtcbiAgICB9XG5cbiAgICBmaW5kTm9kZUJ5SWQoaWQpIHtcbiAgICAgICAgcmV0dXJuIFV0aWxzLmZpbmQodGhpcy5ub2Rlcywgbj0+bi4kaWQgPT0gaWQpO1xuICAgIH1cblxuICAgIGZpbmRFZGdlQnlJZChpZCkge1xuICAgICAgICByZXR1cm4gVXRpbHMuZmluZCh0aGlzLmVkZ2VzLCBlPT5lLiRpZCA9PSBpZCk7XG4gICAgfVxuXG4gICAgZmluZEJ5SWQoaWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmZpbmROb2RlQnlJZChpZCk7XG4gICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5maW5kRWRnZUJ5SWQoaWQpO1xuICAgIH1cblxuICAgIF9yZW1vdmVOb2RlKG5vZGUpIHsvLyBzaW1wbHkgcmVtb3ZlcyBub2RlIGZyb20gbm9kZSBsaXN0XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMubm9kZXMuaW5kZXhPZihub2RlKTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHRoaXMubm9kZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbW92ZUVkZ2UoZWRnZSkge1xuICAgICAgICB2YXIgaW5kZXggPSBlZGdlLnBhcmVudE5vZGUuY2hpbGRFZGdlcy5pbmRleE9mKGVkZ2UpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgZWRnZS5wYXJlbnROb2RlLmNoaWxkRWRnZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZW1vdmVFZGdlKGVkZ2UpO1xuICAgIH1cblxuICAgIF9yZW1vdmVFZGdlKGVkZ2UpIHsgLy9yZW1vdmVzIGVkZ2UgZnJvbSBlZGdlIGxpc3Qgd2l0aG91dCByZW1vdmluZyBjb25uZWN0ZWQgbm9kZXNcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5lZGdlcy5pbmRleE9mKGVkZ2UpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5lZGdlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3JlbW92ZU5vZGVzKG5vZGVzVG9SZW1vdmUpIHtcbiAgICAgICAgdGhpcy5ub2RlcyA9IHRoaXMubm9kZXMuZmlsdGVyKG49Pm5vZGVzVG9SZW1vdmUuaW5kZXhPZihuKSA9PT0gLTEpO1xuICAgIH1cblxuICAgIF9yZW1vdmVFZGdlcyhlZGdlc1RvUmVtb3ZlKSB7XG4gICAgICAgIHRoaXMuZWRnZXMgPSB0aGlzLmVkZ2VzLmZpbHRlcihlPT5lZGdlc1RvUmVtb3ZlLmluZGV4T2YoZSkgPT09IC0xKTtcbiAgICB9XG5cbiAgICBnZXRBbGxEZXNjZW5kYW50RWRnZXMobm9kZSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgICAgICBub2RlLmNoaWxkRWRnZXMuZm9yRWFjaChlPT4ge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goZSk7XG4gICAgICAgICAgICBpZiAoZS5jaGlsZE5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCguLi5zZWxmLmdldEFsbERlc2NlbmRhbnRFZGdlcyhlLmNoaWxkTm9kZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGdldEFsbERlc2NlbmRhbnROb2Rlcyhub2RlKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIG5vZGUuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PiB7XG4gICAgICAgICAgICBpZiAoZS5jaGlsZE5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChlLmNoaWxkTm9kZSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goLi4uc2VsZi5nZXRBbGxEZXNjZW5kYW50Tm9kZXMoZS5jaGlsZE5vZGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBnZXRBbGxOb2Rlc0luU3VidHJlZShub2RlKSB7XG4gICAgICAgIHZhciBkZXNjZW5kYW50cyA9IHRoaXMuZ2V0QWxsRGVzY2VuZGFudE5vZGVzKG5vZGUpO1xuICAgICAgICBkZXNjZW5kYW50cy51bnNoaWZ0KG5vZGUpO1xuICAgICAgICByZXR1cm4gZGVzY2VuZGFudHM7XG4gICAgfVxuXG4gICAgaXNVbmRvQXZhaWxhYmxlKCkge1xuICAgICAgICByZXR1cm4gISF0aGlzLnVuZG9TdGFjay5sZW5ndGhcbiAgICB9XG5cbiAgICBpc1JlZG9BdmFpbGFibGUoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMucmVkb1N0YWNrLmxlbmd0aFxuICAgIH1cblxuICAgIGNyZWF0ZVN0YXRlU25hcHNob3QocmV2ZXJ0Q29uZil7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXZlcnRDb25mOiByZXZlcnRDb25mLFxuICAgICAgICAgICAgbm9kZXM6IFV0aWxzLmNsb25lRGVlcCh0aGlzLm5vZGVzKSxcbiAgICAgICAgICAgIGVkZ2VzOiBVdGlscy5jbG9uZURlZXAodGhpcy5lZGdlcyksXG4gICAgICAgICAgICB0ZXh0czogVXRpbHMuY2xvbmVEZWVwKHRoaXMudGV4dHMpLFxuICAgICAgICAgICAgcGF5b2ZmTmFtZXM6IFV0aWxzLmNsb25lRGVlcCh0aGlzLnBheW9mZk5hbWVzKSxcbiAgICAgICAgICAgIGRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0OiBVdGlscy5jbG9uZURlZXAodGhpcy5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCksXG4gICAgICAgICAgICB3ZWlnaHRMb3dlckJvdW5kOiBVdGlscy5jbG9uZURlZXAodGhpcy53ZWlnaHRMb3dlckJvdW5kKSxcbiAgICAgICAgICAgIHdlaWdodFVwcGVyQm91bmQ6IFV0aWxzLmNsb25lRGVlcCh0aGlzLndlaWdodFVwcGVyQm91bmQpLFxuICAgICAgICAgICAgZXhwcmVzc2lvblNjb3BlOiBVdGlscy5jbG9uZURlZXAodGhpcy5leHByZXNzaW9uU2NvcGUpLFxuICAgICAgICAgICAgY29kZTogdGhpcy5jb2RlLFxuICAgICAgICAgICAgJGNvZGVFcnJvcjogdGhpcy4kY29kZUVycm9yXG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHNhdmVTdGF0ZUZyb21TbmFwc2hvdChzdGF0ZSl7XG4gICAgICAgIHRoaXMucmVkb1N0YWNrLmxlbmd0aCA9IDA7XG5cbiAgICAgICAgdGhpcy5fcHVzaFRvU3RhY2sodGhpcy51bmRvU3RhY2ssIHN0YXRlKTtcblxuICAgICAgICB0aGlzLl9maXJlVW5kb1JlZG9DYWxsYmFjaygpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNhdmVTdGF0ZShyZXZlcnRDb25mKSB7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlRnJvbVNuYXBzaG90KHRoaXMuY3JlYXRlU3RhdGVTbmFwc2hvdChyZXZlcnRDb25mKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHVuZG8oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG5ld1N0YXRlID0gdGhpcy51bmRvU3RhY2sucG9wKCk7XG4gICAgICAgIGlmICghbmV3U3RhdGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3B1c2hUb1N0YWNrKHRoaXMucmVkb1N0YWNrLCB7XG4gICAgICAgICAgICByZXZlcnRDb25mOiBuZXdTdGF0ZS5yZXZlcnRDb25mLFxuICAgICAgICAgICAgbm9kZXM6IHNlbGYubm9kZXMsXG4gICAgICAgICAgICBlZGdlczogc2VsZi5lZGdlcyxcbiAgICAgICAgICAgIHRleHRzOiBzZWxmLnRleHRzLFxuICAgICAgICAgICAgcGF5b2ZmTmFtZXM6IHNlbGYucGF5b2ZmTmFtZXMsXG4gICAgICAgICAgICBkZWZhdWx0Q3JpdGVyaW9uMVdlaWdodDogc2VsZi5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCxcbiAgICAgICAgICAgIHdlaWdodExvd2VyQm91bmQ6IHNlbGYud2VpZ2h0TG93ZXJCb3VuZCxcbiAgICAgICAgICAgIHdlaWdodFVwcGVyQm91bmQ6IHNlbGYud2VpZ2h0VXBwZXJCb3VuZCxcbiAgICAgICAgICAgIGV4cHJlc3Npb25TY29wZTogc2VsZi5leHByZXNzaW9uU2NvcGUsXG4gICAgICAgICAgICBjb2RlOiBzZWxmLmNvZGUsXG4gICAgICAgICAgICAkY29kZUVycm9yOiBzZWxmLiRjb2RlRXJyb3JcblxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl9zZXROZXdTdGF0ZShuZXdTdGF0ZSk7XG5cbiAgICAgICAgdGhpcy5fZmlyZVVuZG9SZWRvQ2FsbGJhY2soKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICByZWRvKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBuZXdTdGF0ZSA9IHRoaXMucmVkb1N0YWNrLnBvcCgpO1xuICAgICAgICBpZiAoIW5ld1N0YXRlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9wdXNoVG9TdGFjayh0aGlzLnVuZG9TdGFjaywge1xuICAgICAgICAgICAgcmV2ZXJ0Q29uZjogbmV3U3RhdGUucmV2ZXJ0Q29uZixcbiAgICAgICAgICAgIG5vZGVzOiBzZWxmLm5vZGVzLFxuICAgICAgICAgICAgZWRnZXM6IHNlbGYuZWRnZXMsXG4gICAgICAgICAgICB0ZXh0czogc2VsZi50ZXh0cyxcbiAgICAgICAgICAgIHBheW9mZk5hbWVzOiBzZWxmLnBheW9mZk5hbWVzLFxuICAgICAgICAgICAgZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQ6IHNlbGYuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQsXG4gICAgICAgICAgICB3ZWlnaHRMb3dlckJvdW5kOiBzZWxmLndlaWdodExvd2VyQm91bmQsXG4gICAgICAgICAgICB3ZWlnaHRVcHBlckJvdW5kOiBzZWxmLndlaWdodFVwcGVyQm91bmQsXG4gICAgICAgICAgICBleHByZXNzaW9uU2NvcGU6IHNlbGYuZXhwcmVzc2lvblNjb3BlLFxuICAgICAgICAgICAgY29kZTogc2VsZi5jb2RlLFxuICAgICAgICAgICAgJGNvZGVFcnJvcjogc2VsZi4kY29kZUVycm9yXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX3NldE5ld1N0YXRlKG5ld1N0YXRlLCB0cnVlKTtcblxuICAgICAgICB0aGlzLl9maXJlVW5kb1JlZG9DYWxsYmFjaygpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLm5vZGVzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuZWRnZXMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy51bmRvU3RhY2subGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5yZWRvU3RhY2subGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy50ZXh0cy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLmNsZWFyRXhwcmVzc2lvblNjb3BlKCk7XG4gICAgICAgIHRoaXMuY29kZSA9ICcnO1xuICAgICAgICB0aGlzLiRjb2RlRXJyb3IgPSBudWxsO1xuICAgICAgICB0aGlzLiRjb2RlRGlydHkgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLnBheW9mZk5hbWVzID0gW107XG4gICAgICAgIHRoaXMuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQgPSAxO1xuICAgICAgICB0aGlzLndlaWdodExvd2VyQm91bmQgPSAwO1xuICAgICAgICB0aGlzLndlaWdodFVwcGVyQm91bmQgPSBJbmZpbml0eTtcbiAgICB9XG5cbiAgICBjbGVhckNvbXB1dGVkVmFsdWVzKCl7XG4gICAgICAgIHRoaXMubm9kZXMuZm9yRWFjaChuPT5uLmNsZWFyQ29tcHV0ZWRWYWx1ZXMoKSk7XG4gICAgICAgIHRoaXMuZWRnZXMuZm9yRWFjaChlPT5lLmNsZWFyQ29tcHV0ZWRWYWx1ZXMoKSk7XG4gICAgfVxuXG4gICAgYWRkVGV4dCh0ZXh0KSB7XG4gICAgICAgIHRoaXMudGV4dHMucHVzaCh0ZXh0KTtcblxuICAgICAgICB0aGlzLl9maXJlVGV4dEFkZGVkQ2FsbGJhY2sodGV4dCk7XG4gICAgfVxuXG4gICAgcmVtb3ZlVGV4dHModGV4dHMpIHtcbiAgICAgICAgdGV4dHMuZm9yRWFjaCh0PT50aGlzLnJlbW92ZVRleHQodCkpO1xuICAgIH1cblxuICAgIHJlbW92ZVRleHQodGV4dCkge1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLnRleHRzLmluZGV4T2YodGV4dCk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICB0aGlzLnRleHRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB0aGlzLl9maXJlVGV4dFJlbW92ZWRDYWxsYmFjayh0ZXh0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsZWFyRXhwcmVzc2lvblNjb3BlKCkge1xuICAgICAgICBVdGlscy5mb3JPd24odGhpcy5leHByZXNzaW9uU2NvcGUsICh2YWx1ZSwga2V5KT0+IHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmV4cHJlc3Npb25TY29wZVtrZXldO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXZlcnNlUGF5b2Zmcygpe1xuICAgICAgICB0aGlzLnBheW9mZk5hbWVzLnJldmVyc2UoKTtcbiAgICAgICAgdGhpcy5lZGdlcy5mb3JFYWNoKGU9PmUucGF5b2ZmLnJldmVyc2UoKSlcbiAgICB9XG5cbiAgICBfc2V0TmV3U3RhdGUobmV3U3RhdGUsIHJlZG8pIHtcbiAgICAgICAgdmFyIG5vZGVCeUlkID0gVXRpbHMuZ2V0T2JqZWN0QnlJZE1hcChuZXdTdGF0ZS5ub2Rlcyk7XG4gICAgICAgIHZhciBlZGdlQnlJZCA9IFV0aWxzLmdldE9iamVjdEJ5SWRNYXAobmV3U3RhdGUuZWRnZXMpO1xuICAgICAgICB0aGlzLm5vZGVzID0gbmV3U3RhdGUubm9kZXM7XG4gICAgICAgIHRoaXMuZWRnZXMgPSBuZXdTdGF0ZS5lZGdlcztcbiAgICAgICAgdGhpcy50ZXh0cyA9IG5ld1N0YXRlLnRleHRzO1xuICAgICAgICB0aGlzLnBheW9mZk5hbWVzID0gbmV3U3RhdGUucGF5b2ZmTmFtZXM7XG4gICAgICAgIHRoaXMuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQgPSBuZXdTdGF0ZS5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodDtcbiAgICAgICAgdGhpcy53ZWlnaHRMb3dlckJvdW5kID0gbmV3U3RhdGUud2VpZ2h0TG93ZXJCb3VuZDtcbiAgICAgICAgdGhpcy53ZWlnaHRVcHBlckJvdW5kID0gbmV3U3RhdGUud2VpZ2h0VXBwZXJCb3VuZDtcbiAgICAgICAgdGhpcy5leHByZXNzaW9uU2NvcGUgPSBuZXdTdGF0ZS5leHByZXNzaW9uU2NvcGU7XG4gICAgICAgIHRoaXMuY29kZSA9IG5ld1N0YXRlLmNvZGU7XG4gICAgICAgIHRoaXMuJGNvZGVFcnJvciAgPSBuZXdTdGF0ZS4kY29kZUVycm9yXG5cbiAgICAgICAgdGhpcy5ub2Rlcy5mb3JFYWNoKG49PiB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG4uY2hpbGRFZGdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBlZGdlID0gZWRnZUJ5SWRbbi5jaGlsZEVkZ2VzW2ldLiRpZF07XG4gICAgICAgICAgICAgICAgbi5jaGlsZEVkZ2VzW2ldID0gZWRnZTtcbiAgICAgICAgICAgICAgICBlZGdlLnBhcmVudE5vZGUgPSBuO1xuICAgICAgICAgICAgICAgIGVkZ2UuY2hpbGROb2RlID0gbm9kZUJ5SWRbZWRnZS5jaGlsZE5vZGUuJGlkXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAobmV3U3RhdGUucmV2ZXJ0Q29uZikge1xuICAgICAgICAgICAgaWYgKCFyZWRvICYmIG5ld1N0YXRlLnJldmVydENvbmYub25VbmRvKSB7XG4gICAgICAgICAgICAgICAgbmV3U3RhdGUucmV2ZXJ0Q29uZi5vblVuZG8obmV3U3RhdGUucmV2ZXJ0Q29uZi5kYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZWRvICYmIG5ld1N0YXRlLnJldmVydENvbmYub25SZWRvKSB7XG4gICAgICAgICAgICAgICAgbmV3U3RhdGUucmV2ZXJ0Q29uZi5vblJlZG8obmV3U3RhdGUucmV2ZXJ0Q29uZi5kYXRhKTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZXZlcnRDb25mID0gbmV3U3RhdGUucmV2ZXJ0Q29uZjtcbiAgICB9XG5cblxuICAgIF9wdXNoVG9TdGFjayhzdGFjaywgb2JqKSB7XG4gICAgICAgIGlmIChzdGFjay5sZW5ndGggPj0gdGhpcy5tYXhTdGFja1NpemUpIHtcbiAgICAgICAgICAgIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgIH1cbiAgICAgICAgc3RhY2sucHVzaChvYmopO1xuICAgIH1cblxuICAgIF9maXJlVW5kb1JlZG9DYWxsYmFjaygpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc0Rpc2FibGVkICYmIHRoaXMudW5kb1JlZG9TdGF0ZUNoYW5nZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy51bmRvUmVkb1N0YXRlQ2hhbmdlZENhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfZmlyZU5vZGVBZGRlZENhbGxiYWNrKG5vZGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc0Rpc2FibGVkICYmIHRoaXMubm9kZUFkZGVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMubm9kZUFkZGVkQ2FsbGJhY2sobm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfZmlyZU5vZGVSZW1vdmVkQ2FsbGJhY2sobm9kZSkge1xuICAgICAgICBpZiAoIXRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgJiYgdGhpcy5ub2RlUmVtb3ZlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLm5vZGVSZW1vdmVkQ2FsbGJhY2sobm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfZmlyZVRleHRBZGRlZENhbGxiYWNrKHRleHQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc0Rpc2FibGVkICYmIHRoaXMudGV4dEFkZGVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMudGV4dEFkZGVkQ2FsbGJhY2sodGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfZmlyZVRleHRSZW1vdmVkQ2FsbGJhY2sodGV4dCkge1xuICAgICAgICBpZiAoIXRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgJiYgdGhpcy50ZXh0UmVtb3ZlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLnRleHRSZW1vdmVkQ2FsbGJhY2sodGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQge09iamVjdFdpdGhDb21wdXRlZFZhbHVlc30gZnJvbSBcIi4vb2JqZWN0LXdpdGgtY29tcHV0ZWQtdmFsdWVzXCI7XG5cbmV4cG9ydCBjbGFzcyBFZGdlIGV4dGVuZHMgT2JqZWN0V2l0aENvbXB1dGVkVmFsdWVzIHtcbiAgICBwYXJlbnROb2RlO1xuICAgIGNoaWxkTm9kZTtcblxuICAgIG5hbWUgPSAnJztcbiAgICBwcm9iYWJpbGl0eSA9IHVuZGVmaW5lZDtcbiAgICBwYXlvZmYgPSBbMCwgMF07XG5cbiAgICAkRElTUExBWV9WQUxVRV9OQU1FUyA9IFsncHJvYmFiaWxpdHknLCAncGF5b2ZmJywgJ29wdGltYWwnXTtcblxuICAgIGNvbnN0cnVjdG9yKHBhcmVudE5vZGUsIGNoaWxkTm9kZSwgbmFtZSwgcGF5b2ZmLCBwcm9iYWJpbGl0eSwpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5wYXJlbnROb2RlID0gcGFyZW50Tm9kZTtcbiAgICAgICAgdGhpcy5jaGlsZE5vZGUgPSBjaGlsZE5vZGU7XG5cbiAgICAgICAgaWYgKG5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJvYmFiaWxpdHkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5wcm9iYWJpbGl0eSA9IHByb2JhYmlsaXR5O1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXlvZmYgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5wYXlvZmYgPSBwYXlvZmZcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgc2V0TmFtZShuYW1lKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldFByb2JhYmlsaXR5KHByb2JhYmlsaXR5KSB7XG4gICAgICAgIHRoaXMucHJvYmFiaWxpdHkgPSBwcm9iYWJpbGl0eTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0UGF5b2ZmKHBheW9mZiwgaW5kZXggPSAwKSB7XG4gICAgICAgIHRoaXMucGF5b2ZmW2luZGV4XSA9IHBheW9mZjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY29tcHV0ZWRCYXNlUHJvYmFiaWxpdHkodmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVkVmFsdWUobnVsbCwgJ3Byb2JhYmlsaXR5JywgdmFsKTtcbiAgICB9XG5cbiAgICBjb21wdXRlZEJhc2VQYXlvZmYodmFsLCBpbmRleCA9IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcHV0ZWRWYWx1ZShudWxsLCAncGF5b2ZmWycgKyBpbmRleCArICddJywgdmFsKTtcbiAgICB9XG5cbiAgICBkaXNwbGF5UHJvYmFiaWxpdHkodmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRpc3BsYXlWYWx1ZSgncHJvYmFiaWxpdHknLCB2YWwpO1xuICAgIH1cblxuICAgIGRpc3BsYXlQYXlvZmYodmFsLCBpbmRleCA9IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlzcGxheVZhbHVlKCdwYXlvZmZbJyArIGluZGV4ICsgJ10nLCB2YWwpO1xuICAgIH1cbn1cbiIsImV4cG9ydCAqIGZyb20gJy4vbm9kZS9ub2RlJ1xuZXhwb3J0ICogZnJvbSAnLi9ub2RlL2RlY2lzaW9uLW5vZGUnXG5leHBvcnQgKiBmcm9tICcuL25vZGUvY2hhbmNlLW5vZGUnXG5leHBvcnQgKiBmcm9tICcuL25vZGUvdGVybWluYWwtbm9kZSdcbmV4cG9ydCAqIGZyb20gJy4vZWRnZSdcbmV4cG9ydCAqIGZyb20gJy4vcG9pbnQnXG5leHBvcnQgKiBmcm9tICcuL3RleHQnXG4iLCJpbXBvcnQge05vZGV9IGZyb20gJy4vbm9kZSdcblxuZXhwb3J0IGNsYXNzIENoYW5jZU5vZGUgZXh0ZW5kcyBOb2Rle1xuXG4gICAgc3RhdGljICRUWVBFID0gJ2NoYW5jZSc7XG5cbiAgICBjb25zdHJ1Y3Rvcihsb2NhdGlvbil7XG4gICAgICAgIHN1cGVyKENoYW5jZU5vZGUuJFRZUEUsIGxvY2F0aW9uKTtcbiAgICB9XG59XG4iLCJpbXBvcnQge05vZGV9IGZyb20gJy4vbm9kZSdcblxuZXhwb3J0IGNsYXNzIERlY2lzaW9uTm9kZSBleHRlbmRzIE5vZGV7XG5cbiAgICBzdGF0aWMgJFRZUEUgPSAnZGVjaXNpb24nO1xuXG4gICAgY29uc3RydWN0b3IobG9jYXRpb24pe1xuICAgICAgICBzdXBlcihEZWNpc2lvbk5vZGUuJFRZUEUsIGxvY2F0aW9uKTtcbiAgICB9XG59XG4iLCJpbXBvcnQge1BvaW50fSBmcm9tICcuLi9wb2ludCdcbmltcG9ydCB7T2JqZWN0V2l0aENvbXB1dGVkVmFsdWVzfSBmcm9tICcuLi9vYmplY3Qtd2l0aC1jb21wdXRlZC12YWx1ZXMnXG5cbmV4cG9ydCBjbGFzcyBOb2RlIGV4dGVuZHMgT2JqZWN0V2l0aENvbXB1dGVkVmFsdWVze1xuXG4gICAgdHlwZTtcbiAgICBjaGlsZEVkZ2VzPVtdO1xuICAgIG5hbWU9Jyc7XG5cbiAgICBsb2NhdGlvbjsgLy9Qb2ludFxuXG4gICAgY29kZT0nJztcbiAgICAkY29kZURpcnR5ID0gZmFsc2U7IC8vIGlzIGNvZGUgY2hhbmdlZCB3aXRob3V0IHJlZXZhbHVhdGlvbj9cbiAgICAkY29kZUVycm9yID0gbnVsbDsgLy9jb2RlIGV2YWx1YXRpb24gZXJyb3JzXG5cbiAgICBleHByZXNzaW9uU2NvcGU9bnVsbDtcblxuICAgIGZvbGRlZCA9IGZhbHNlOyAvLyBpcyBub2RlIGZvbGRlZCBhbG9uZyB3aXRoIGl0cyBzdWJ0cmVlXG5cbiAgICAkRElTUExBWV9WQUxVRV9OQU1FUyA9IFsnY2hpbGRyZW5QYXlvZmYnLCAnYWdncmVnYXRlZFBheW9mZicsICdwcm9iYWJpbGl0eVRvRW50ZXInLCAnb3B0aW1hbCddXG5cbiAgICBjb25zdHJ1Y3Rvcih0eXBlLCBsb2NhdGlvbil7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMubG9jYXRpb249bG9jYXRpb247XG4gICAgICAgIGlmKCFsb2NhdGlvbil7XG4gICAgICAgICAgICB0aGlzLmxvY2F0aW9uID0gbmV3IFBvaW50KDAsMCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50eXBlPXR5cGU7XG4gICAgfVxuXG4gICAgc2V0TmFtZShuYW1lKXtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbW92ZVRvKHgseSwgd2l0aENoaWxkcmVuKXsgLy9tb3ZlIHRvIG5ldyBsb2NhdGlvblxuICAgICAgICBpZih3aXRoQ2hpbGRyZW4pe1xuICAgICAgICAgICAgdmFyIGR4ID0geC10aGlzLmxvY2F0aW9uLng7XG4gICAgICAgICAgICB2YXIgZHkgPSB5LXRoaXMubG9jYXRpb24ueTtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PmUuY2hpbGROb2RlLm1vdmUoZHgsIGR5LCB0cnVlKSlcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubG9jYXRpb24ubW92ZVRvKHgseSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIG1vdmUoZHgsIGR5LCB3aXRoQ2hpbGRyZW4peyAvL21vdmUgYnkgdmVjdG9yXG4gICAgICAgIGlmKHdpdGhDaGlsZHJlbil7XG4gICAgICAgICAgICB0aGlzLmNoaWxkRWRnZXMuZm9yRWFjaChlPT5lLmNoaWxkTm9kZS5tb3ZlKGR4LCBkeSwgdHJ1ZSkpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sb2NhdGlvbi5tb3ZlKGR4LCBkeSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cbiIsImltcG9ydCB7Tm9kZX0gZnJvbSAnLi9ub2RlJ1xuXG5leHBvcnQgY2xhc3MgVGVybWluYWxOb2RlIGV4dGVuZHMgTm9kZXtcblxuICAgIHN0YXRpYyAkVFlQRSA9ICd0ZXJtaW5hbCc7XG5cbiAgICBjb25zdHJ1Y3Rvcihsb2NhdGlvbil7XG4gICAgICAgIHN1cGVyKFRlcm1pbmFsTm9kZS4kVFlQRSwgbG9jYXRpb24pO1xuICAgIH1cbn1cbiIsImltcG9ydCB7VXRpbHN9IGZyb20gJ3NkLXV0aWxzJ1xuXG5pbXBvcnQge09iamVjdFdpdGhJZEFuZEVkaXRhYmxlRmllbGRzfSBmcm9tIFwiLi9vYmplY3Qtd2l0aC1pZC1hbmQtZWRpdGFibGUtZmllbGRzXCI7XG5cbmV4cG9ydCBjbGFzcyBPYmplY3RXaXRoQ29tcHV0ZWRWYWx1ZXMgZXh0ZW5kcyBPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkc3tcblxuICAgIGNvbXB1dGVkPXt9OyAvL2NvbXB1dGVkIHZhbHVlc1xuXG4gICAgLypnZXQgb3Igc2V0IGNvbXB1dGVkIHZhbHVlKi9cbiAgICBjb21wdXRlZFZhbHVlKHJ1bGVOYW1lLCBmaWVsZFBhdGgsIHZhbHVlKXtcbiAgICAgICAgdmFyIHBhdGggPSAnY29tcHV0ZWQuJztcbiAgICAgICAgaWYocnVsZU5hbWUpe1xuICAgICAgICAgICAgcGF0aCs9cnVsZU5hbWUrJy4nO1xuICAgICAgICB9XG4gICAgICAgIHBhdGgrPWZpZWxkUGF0aDtcbiAgICAgICAgaWYodmFsdWU9PT11bmRlZmluZWQpe1xuICAgICAgICAgICAgcmV0dXJuICBVdGlscy5nZXQodGhpcywgcGF0aCwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgVXRpbHMuc2V0KHRoaXMsIHBhdGgsIHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIGNsZWFyQ29tcHV0ZWRWYWx1ZXMocnVsZU5hbWUpe1xuICAgICAgICBpZihydWxlTmFtZT09dW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHRoaXMuY29tcHV0ZWQ9e307XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYoVXRpbHMuaXNBcnJheShydWxlTmFtZSkpe1xuICAgICAgICAgICAgcnVsZU5hbWUuZm9yRWFjaChuPT57XG4gICAgICAgICAgICAgICAgdGhpcy5jb21wdXRlZFtuXT17fTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29tcHV0ZWRbcnVsZU5hbWVdPXt9O1xuICAgIH1cblxuICAgIGNsZWFyRGlzcGxheVZhbHVlcygpe1xuICAgICAgICB0aGlzLmNvbXB1dGVkWyckZGlzcGxheVZhbHVlcyddPXt9O1xuICAgIH1cblxuICAgIGRpc3BsYXlWYWx1ZShmaWVsZFBhdGgsIHZhbHVlKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcHV0ZWRWYWx1ZShudWxsLCAnJGRpc3BsYXlWYWx1ZXMuJytmaWVsZFBhdGgsIHZhbHVlKTtcbiAgICB9XG5cbiAgICBsb2FkQ29tcHV0ZWRWYWx1ZXMoY29tcHV0ZWQpe1xuICAgICAgICB0aGlzLmNvbXB1dGVkID0gVXRpbHMuY2xvbmVEZWVwKGNvbXB1dGVkKTtcbiAgICB9XG59XG4iLCJpbXBvcnQge1V0aWxzfSBmcm9tICdzZC11dGlscydcblxuZXhwb3J0IGNsYXNzIE9iamVjdFdpdGhJZEFuZEVkaXRhYmxlRmllbGRzIHtcblxuICAgICRpZCA9IFV0aWxzLmd1aWQoKTsgLy9pbnRlcm5hbCBpZFxuICAgICRmaWVsZFN0YXR1cz17fTtcblxuICAgIGdldEZpZWxkU3RhdHVzKGZpZWxkUGF0aCl7XG4gICAgICAgIGlmKCFVdGlscy5nZXQodGhpcy4kZmllbGRTdGF0dXMsIGZpZWxkUGF0aCwgbnVsbCkpe1xuICAgICAgICAgICAgVXRpbHMuc2V0KHRoaXMuJGZpZWxkU3RhdHVzLCBmaWVsZFBhdGgsIHtcbiAgICAgICAgICAgICAgICB2YWxpZDoge1xuICAgICAgICAgICAgICAgICAgICBzeW50YXg6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFV0aWxzLmdldCh0aGlzLiRmaWVsZFN0YXR1cywgZmllbGRQYXRoKTtcbiAgICB9XG5cbiAgICBzZXRTeW50YXhWYWxpZGl0eShmaWVsZFBhdGgsIHZhbGlkKXtcbiAgICAgICAgdmFyIGZpZWxkU3RhdHVzID0gdGhpcy5nZXRGaWVsZFN0YXR1cyhmaWVsZFBhdGgpO1xuICAgICAgICBmaWVsZFN0YXR1cy52YWxpZC5zeW50YXggPSB2YWxpZDtcbiAgICB9XG5cbiAgICBzZXRWYWx1ZVZhbGlkaXR5KGZpZWxkUGF0aCwgdmFsaWQpe1xuICAgICAgICB2YXIgZmllbGRTdGF0dXMgPSB0aGlzLmdldEZpZWxkU3RhdHVzKGZpZWxkUGF0aCk7XG4gICAgICAgIGZpZWxkU3RhdHVzLnZhbGlkLnZhbHVlID0gdmFsaWQ7XG4gICAgfVxuXG4gICAgaXNGaWVsZFZhbGlkKGZpZWxkUGF0aCwgc3ludGF4PXRydWUsIHZhbHVlPXRydWUpe1xuICAgICAgICB2YXIgZmllbGRTdGF0dXMgPSB0aGlzLmdldEZpZWxkU3RhdHVzKGZpZWxkUGF0aCk7XG4gICAgICAgIGlmKHN5bnRheCAmJiB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZpZWxkU3RhdHVzLnZhbGlkLnN5bnRheCAmJiBmaWVsZFN0YXR1cy52YWxpZC52YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZihzeW50YXgpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZFN0YXR1cy52YWxpZC5zeW50YXhcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmllbGRTdGF0dXMudmFsaWQudmFsdWU7XG4gICAgfVxuXG5cbn1cbiIsImV4cG9ydCBjbGFzcyBQb2ludCB7XG4gICAgeDtcbiAgICB5O1xuICAgIGNvbnN0cnVjdG9yKHgseSl7XG4gICAgICAgIGlmKHggaW5zdGFuY2VvZiBQb2ludCl7XG4gICAgICAgICAgICB5PXgueTtcbiAgICAgICAgICAgIHg9eC54XG4gICAgICAgIH1lbHNlIGlmKEFycmF5LmlzQXJyYXkoeCkpe1xuICAgICAgICAgICAgeT14WzFdO1xuICAgICAgICAgICAgeD14WzBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMueD14O1xuICAgICAgICB0aGlzLnk9eTtcbiAgICB9XG5cbiAgICBtb3ZlVG8oeCx5KXtcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheSh4KSl7XG4gICAgICAgICAgICB5PXhbMV07XG4gICAgICAgICAgICB4PXhbMF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy54PXg7XG4gICAgICAgIHRoaXMueT15O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBtb3ZlKGR4LGR5KXsgLy9tb3ZlIGJ5IHZlY3RvclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGR4KSl7XG4gICAgICAgICAgICBkeT1keFsxXTtcbiAgICAgICAgICAgIGR4PWR4WzBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMueCs9ZHg7XG4gICAgICAgIHRoaXMueSs9ZHk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHtQb2ludH0gZnJvbSBcIi4vcG9pbnRcIjtcbmltcG9ydCB7VXRpbHN9IGZyb20gXCJzZC11dGlsc1wiO1xuaW1wb3J0IHtPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkc30gZnJvbSBcIi4vb2JqZWN0LXdpdGgtaWQtYW5kLWVkaXRhYmxlLWZpZWxkc1wiO1xuXG5leHBvcnQgY2xhc3MgVGV4dCBleHRlbmRzIE9iamVjdFdpdGhJZEFuZEVkaXRhYmxlRmllbGRze1xuXG4gICAgdmFsdWU9Jyc7XG4gICAgbG9jYXRpb247IC8vUG9pbnRcblxuICAgIGNvbnN0cnVjdG9yKGxvY2F0aW9uLCB2YWx1ZSl7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMubG9jYXRpb249bG9jYXRpb247XG4gICAgICAgIGlmKCFsb2NhdGlvbil7XG4gICAgICAgICAgICB0aGlzLmxvY2F0aW9uID0gbmV3IFBvaW50KDAsMCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZih2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbW92ZVRvKHgseSl7IC8vbW92ZSB0byBuZXcgbG9jYXRpb25cbiAgICAgICAgdGhpcy5sb2NhdGlvbi5tb3ZlVG8oeCx5KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbW92ZShkeCwgZHkpeyAvL21vdmUgYnkgdmVjdG9yXG4gICAgICAgIHRoaXMubG9jYXRpb24ubW92ZShkeCwgZHkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBkb21haW4gZnJvbSAnLi9kb21haW4nXG5leHBvcnQge2RvbWFpbn1cbmV4cG9ydCAqIGZyb20gJy4vZGF0YS1tb2RlbCdcbmV4cG9ydCAqIGZyb20gJy4vdmFsaWRhdGlvbi1yZXN1bHQnXG4iLCJpbXBvcnQge1V0aWxzfSBmcm9tIFwic2QtdXRpbHNcIjtcblxuZXhwb3J0IGNsYXNzIFZhbGlkYXRpb25SZXN1bHR7XG5cblxuICAgIGVycm9ycyA9IHt9O1xuICAgIHdhcm5pbmdzID0ge307XG4gICAgb2JqZWN0SWRUb0Vycm9yPXt9O1xuXG4gICAgYWRkRXJyb3IoZXJyb3IsIG9iail7XG4gICAgICAgIGlmKFV0aWxzLmlzU3RyaW5nKGVycm9yKSl7XG4gICAgICAgICAgICBlcnJvciA9IHtuYW1lOiBlcnJvcn07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5hbWUgPSBlcnJvci5uYW1lO1xuICAgICAgICB2YXIgZXJyb3JzQnlOYW1lID0gdGhpcy5lcnJvcnNbbmFtZV07XG4gICAgICAgIGlmKCFlcnJvcnNCeU5hbWUpe1xuICAgICAgICAgICAgZXJyb3JzQnlOYW1lPVtdO1xuICAgICAgICAgICAgdGhpcy5lcnJvcnNbbmFtZV09ZXJyb3JzQnlOYW1lO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvYmpFID0gdGhpcy5vYmplY3RJZFRvRXJyb3Jbb2JqLiRpZF07XG4gICAgICAgIGlmKCFvYmpFKXtcbiAgICAgICAgICAgIG9iakU9W107XG4gICAgICAgICAgICB0aGlzLm9iamVjdElkVG9FcnJvcltvYmouJGlkXT0gb2JqRTtcbiAgICAgICAgfVxuICAgICAgICBlcnJvcnNCeU5hbWUucHVzaChvYmopO1xuICAgICAgICBvYmpFLnB1c2goZXJyb3IpO1xuICAgIH1cblxuICAgIGFkZFdhcm5pbmcobmFtZSwgb2JqKXtcbiAgICAgICAgdmFyIGUgPSB0aGlzLndhcm5pbmdzW25hbWVdO1xuICAgICAgICBpZighZSl7XG4gICAgICAgICAgICBlPVtdO1xuICAgICAgICAgICAgdGhpcy53YXJuaW5nc1tuYW1lXT1lO1xuICAgICAgICB9XG4gICAgICAgIGUucHVzaChvYmopXG4gICAgfVxuXG4gICAgaXNWYWxpZCgpe1xuICAgICAgICByZXR1cm4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGhpcy5lcnJvcnMpLmxlbmd0aCA9PT0gMFxuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVGcm9tRFRPKGR0byl7XG4gICAgICAgIHZhciB2ID0gbmV3IFZhbGlkYXRpb25SZXN1bHQoKTtcbiAgICAgICAgdi5lcnJvcnMgPSBkdG8uZXJyb3JzO1xuICAgICAgICB2Lndhcm5pbmdzID0gZHRvLndhcm5pbmdzO1xuICAgICAgICB2Lm9iamVjdElkVG9FcnJvciA9IGR0by5vYmplY3RJZFRvRXJyb3I7XG4gICAgICAgIHJldHVybiB2O1xuICAgIH1cbn1cbiIsImV4cG9ydCAqIGZyb20gJy4vc3JjL2luZGV4J1xuIl19
