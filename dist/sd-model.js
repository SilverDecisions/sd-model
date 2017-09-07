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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZGF0YS1tb2RlbC5qcyIsInNyYy9kb21haW4vZWRnZS5qcyIsInNyYy9kb21haW4vaW5kZXguanMiLCJzcmMvZG9tYWluL25vZGUvY2hhbmNlLW5vZGUuanMiLCJzcmMvZG9tYWluL25vZGUvZGVjaXNpb24tbm9kZS5qcyIsInNyYy9kb21haW4vbm9kZS9ub2RlLmpzIiwic3JjL2RvbWFpbi9ub2RlL3Rlcm1pbmFsLW5vZGUuanMiLCJzcmMvZG9tYWluL29iamVjdC13aXRoLWNvbXB1dGVkLXZhbHVlcy5qcyIsInNyYy9kb21haW4vb2JqZWN0LXdpdGgtaWQtYW5kLWVkaXRhYmxlLWZpZWxkcy5qcyIsInNyYy9kb21haW4vcG9pbnQuanMiLCJzcmMvZG9tYWluL3RleHQuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvdmFsaWRhdGlvbi1yZXN1bHQuanMiLCJpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDQUE7O0FBQ0E7O0ksQUFBWTs7QUFDWjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7OztJLEFBR2Esb0IsQUFBQSx3QkFjVTtBQUZHO0FBcUJ0Qjt1QkFBQSxBQUFZLE1BQU07OEJBQUE7O2FBL0JsQixBQStCa0IsUUEvQlYsQUErQlU7YUE5QmxCLEFBOEJrQixRQTlCVixBQThCVTthQTVCbEIsQUE0QmtCLFFBNUJWLEFBNEJVO2FBM0JsQixBQTJCa0IsY0EzQkosQUEyQkk7YUExQmxCLEFBMEJrQiwwQkExQlEsQUEwQlI7YUF6QmxCLEFBeUJrQixtQkF6QkMsQUF5QkQ7YUF4QmxCLEFBd0JrQixtQkF4QkMsQUF3QkQ7YUFyQmxCLEFBcUJrQixrQkFyQkEsQUFxQkE7YUFwQmxCLEFBb0JrQixPQXBCWCxBQW9CVzthQW5CbEIsQUFtQmtCLGFBbkJMLEFBbUJLO2FBbEJsQixBQWtCa0IsYUFsQkwsQUFrQks7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LEtBQUwsQUFBVSxBQUNiOzs7O21DLEFBRVUsTSxBQUFNLEtBQUksQUFDakI7Z0JBQUksSUFBSSxLQUFBLEFBQUssU0FBYixBQUFRLEFBQWMsQUFDdEI7Z0JBQUcsQ0FBSCxBQUFJLEdBQUUsQUFDRjtvQkFBQSxBQUFFLEFBQ0Y7cUJBQUEsQUFBSyxTQUFMLEFBQWMsUUFBZCxBQUFvQixBQUN2QjtBQUNEO2NBQUEsQUFBRSxLQUFGLEFBQU8sQUFDVjs7OztrQ0FFUSxBQUNMO21CQUFPLE9BQUEsQUFBTyxvQkFBb0IsS0FBM0IsQUFBZ0MsUUFBaEMsQUFBd0MsV0FBL0MsQUFBMEQsQUFDN0Q7Ozs7c0MsQUFFb0IsS0FBSSxBQUNyQjtnQkFBSSxJQUFJLElBQVIsQUFBUSxBQUFJLEFBQ1o7Y0FBQSxBQUFFLFNBQVMsSUFBWCxBQUFlLEFBQ2Y7Y0FBQSxBQUFFLFdBQVcsSUFBYixBQUFpQixBQUNqQjtjQUFBLEFBQUUsa0JBQWtCLElBQXBCLEFBQXdCLEFBQ3hCO21CQUFBLEFBQU8sQUFDVjs7Ozs7Ozs7Ozs7Ozs7OztBQy9DTCwyQ0FBQTtpREFBQTs7Z0JBQUE7d0JBQUE7b0JBQUE7QUFBQTtBQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB7VXRpbHMsIGxvZ30gZnJvbSBcInNkLXV0aWxzXCI7XG5pbXBvcnQgKiBhcyBkb21haW4gZnJvbSBcIi4vZG9tYWluXCI7XG5pbXBvcnQge1ZhbGlkYXRpb25SZXN1bHR9IGZyb20gXCIuL3ZhbGlkYXRpb24tcmVzdWx0XCI7XG5cbi8qXG4gKiBEYXRhIG1vZGVsIG1hbmFnZXJcbiAqICovXG5leHBvcnQgY2xhc3MgRGF0YU1vZGVsIHtcblxuICAgIG5vZGVzID0gW107XG4gICAgZWRnZXMgPSBbXTtcblxuICAgIHRleHRzID0gW107IC8vZmxvYXRpbmcgdGV4dHNcbiAgICBwYXlvZmZOYW1lcyA9IFtdO1xuICAgIGRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0ID0gMTtcbiAgICB3ZWlnaHRMb3dlckJvdW5kID0gMDtcbiAgICB3ZWlnaHRVcHBlckJvdW5kID0gSW5maW5pdHk7XG5cblxuICAgIGV4cHJlc3Npb25TY29wZSA9IHt9OyAvL2dsb2JhbCBleHByZXNzaW9uIHNjb3BlXG4gICAgY29kZSA9IFwiXCI7Ly9nbG9iYWwgZXhwcmVzc2lvbiBjb2RlXG4gICAgJGNvZGVFcnJvciA9IG51bGw7IC8vY29kZSBldmFsdWF0aW9uIGVycm9yc1xuICAgICRjb2RlRGlydHkgPSBmYWxzZTsgLy8gaXMgY29kZSBjaGFuZ2VkIHdpdGhvdXQgcmVldmFsdWF0aW9uP1xuICAgICR2ZXJzaW9uPTE7XG5cbiAgICB2YWxpZGF0aW9uUmVzdWx0cyA9IFtdO1xuXG4gICAgLy8gdW5kbyAvIHJlZG9cbiAgICBtYXhTdGFja1NpemUgPSAyMDtcbiAgICB1bmRvU3RhY2sgPSBbXTtcbiAgICByZWRvU3RhY2sgPSBbXTtcbiAgICB1bmRvUmVkb1N0YXRlQ2hhbmdlZENhbGxiYWNrID0gbnVsbDtcbiAgICBub2RlQWRkZWRDYWxsYmFjayA9IG51bGw7XG4gICAgbm9kZVJlbW92ZWRDYWxsYmFjayA9IG51bGw7XG5cbiAgICB0ZXh0QWRkZWRDYWxsYmFjayA9IG51bGw7XG4gICAgdGV4dFJlbW92ZWRDYWxsYmFjayA9IG51bGw7XG5cbiAgICBjYWxsYmFja3NEaXNhYmxlZCA9IGZhbHNlO1xuXG4gICAgY29uc3RydWN0b3IoZGF0YSkge1xuICAgICAgICBpZihkYXRhKXtcbiAgICAgICAgICAgIHRoaXMubG9hZChkYXRhKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldEpzb25SZXBsYWNlcihmaWx0ZXJMb2NhdGlvbj1mYWxzZSwgZmlsdGVyQ29tcHV0ZWQ9ZmFsc2UsIHJlcGxhY2VyLCBmaWx0ZXJQcml2YXRlID10cnVlKXtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChrLCB2KSB7XG5cbiAgICAgICAgICAgIGlmICgoZmlsdGVyUHJpdmF0ZSAmJiBVdGlscy5zdGFydHNXaXRoKGssICckJykpIHx8IGsgPT0gJ3BhcmVudE5vZGUnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmaWx0ZXJMb2NhdGlvbiAmJiBrID09ICdsb2NhdGlvbicpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZpbHRlckNvbXB1dGVkICYmIGsgPT0gJ2NvbXB1dGVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZXBsYWNlcil7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcGxhY2VyKGssIHYpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNlcmlhbGl6ZShzdHJpbmdpZnk9dHJ1ZSwgZmlsdGVyTG9jYXRpb249ZmFsc2UsIGZpbHRlckNvbXB1dGVkPWZhbHNlLCByZXBsYWNlciwgZmlsdGVyUHJpdmF0ZSA9dHJ1ZSl7XG4gICAgICAgIHZhciBkYXRhID0gIHtcbiAgICAgICAgICAgIGNvZGU6IHRoaXMuY29kZSxcbiAgICAgICAgICAgIGV4cHJlc3Npb25TY29wZTogdGhpcy5leHByZXNzaW9uU2NvcGUsXG4gICAgICAgICAgICB0cmVlczogdGhpcy5nZXRSb290cygpLFxuICAgICAgICAgICAgdGV4dHM6IHRoaXMudGV4dHMsXG4gICAgICAgICAgICBwYXlvZmZOYW1lczogdGhpcy5wYXlvZmZOYW1lcy5zbGljZSgpLFxuICAgICAgICAgICAgZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQ6IHRoaXMuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQsXG4gICAgICAgICAgICB3ZWlnaHRMb3dlckJvdW5kOiB0aGlzLndlaWdodExvd2VyQm91bmQsXG4gICAgICAgICAgICB3ZWlnaHRVcHBlckJvdW5kOiB0aGlzLndlaWdodFVwcGVyQm91bmRcbiAgICAgICAgfTtcblxuICAgICAgICBpZighc3RyaW5naWZ5KXtcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFV0aWxzLnN0cmluZ2lmeShkYXRhLCB0aGlzLmdldEpzb25SZXBsYWNlcihmaWx0ZXJMb2NhdGlvbiwgZmlsdGVyQ29tcHV0ZWQsIHJlcGxhY2VyLCBmaWx0ZXJQcml2YXRlKSwgW10pO1xuICAgIH1cblxuXG4gICAgLypMb2FkcyBzZXJpYWxpemVkIGRhdGEqL1xuICAgIGxvYWQoZGF0YSkge1xuICAgICAgICAvL3Jvb3RzLCB0ZXh0cywgY29kZSwgZXhwcmVzc2lvblNjb3BlXG4gICAgICAgIHZhciBjYWxsYmFja3NEaXNhYmxlZCA9IHRoaXMuY2FsbGJhY2tzRGlzYWJsZWQ7XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMuY2xlYXIoKTtcblxuXG4gICAgICAgIGRhdGEudHJlZXMuZm9yRWFjaChub2RlRGF0YT0+IHtcbiAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5jcmVhdGVOb2RlRnJvbURhdGEobm9kZURhdGEpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoZGF0YS50ZXh0cykge1xuICAgICAgICAgICAgZGF0YS50ZXh0cy5mb3JFYWNoKHRleHREYXRhPT4ge1xuICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IG5ldyBkb21haW4uUG9pbnQodGV4dERhdGEubG9jYXRpb24ueCwgdGV4dERhdGEubG9jYXRpb24ueSk7XG4gICAgICAgICAgICAgICAgdmFyIHRleHQgPSBuZXcgZG9tYWluLlRleHQobG9jYXRpb24sIHRleHREYXRhLnZhbHVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLnRleHRzLnB1c2godGV4dCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jbGVhckV4cHJlc3Npb25TY29wZSgpO1xuICAgICAgICB0aGlzLmNvZGUgPSBkYXRhLmNvZGUgfHwgJyc7XG5cbiAgICAgICAgaWYgKGRhdGEuZXhwcmVzc2lvblNjb3BlKSB7XG4gICAgICAgICAgICBVdGlscy5leHRlbmQodGhpcy5leHByZXNzaW9uU2NvcGUsIGRhdGEuZXhwcmVzc2lvblNjb3BlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLnBheW9mZk5hbWVzICE9PSB1bmRlZmluZWQgJiYgZGF0YS5wYXlvZmZOYW1lcyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5wYXlvZmZOYW1lcyA9IGRhdGEucGF5b2ZmTmFtZXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQgPSBkYXRhLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEud2VpZ2h0TG93ZXJCb3VuZCAhPT0gdW5kZWZpbmVkICYmIGRhdGEud2VpZ2h0TG93ZXJCb3VuZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy53ZWlnaHRMb3dlckJvdW5kID0gZGF0YS53ZWlnaHRMb3dlckJvdW5kO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEud2VpZ2h0VXBwZXJCb3VuZCAhPT0gdW5kZWZpbmVkICYmIGRhdGEud2VpZ2h0VXBwZXJCb3VuZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy53ZWlnaHRVcHBlckJvdW5kID0gZGF0YS53ZWlnaHRVcHBlckJvdW5kO1xuICAgICAgICB9XG5cblxuICAgICAgICB0aGlzLmNhbGxiYWNrc0Rpc2FibGVkID0gY2FsbGJhY2tzRGlzYWJsZWQ7XG4gICAgfVxuXG4gICAgZ2V0RFRPKGZpbHRlckxvY2F0aW9uPWZhbHNlLCBmaWx0ZXJDb21wdXRlZD1mYWxzZSwgZmlsdGVyUHJpdmF0ZSA9ZmFsc2Upe1xuICAgICAgICB2YXIgZHRvID0ge1xuICAgICAgICAgICAgc2VyaWFsaXplZERhdGE6IHRoaXMuc2VyaWFsaXplKHRydWUsIGZpbHRlckxvY2F0aW9uLCBmaWx0ZXJDb21wdXRlZCwgbnVsbCwgZmlsdGVyUHJpdmF0ZSksXG4gICAgICAgICAgICAkY29kZUVycm9yOiB0aGlzLiRjb2RlRXJyb3IsXG4gICAgICAgICAgICAkY29kZURpcnR5OiB0aGlzLiRjb2RlRGlydHksXG4gICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0czogdGhpcy52YWxpZGF0aW9uUmVzdWx0cy5zbGljZSgpXG5cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGR0b1xuICAgIH1cblxuICAgIGxvYWRGcm9tRFRPKGR0bywgZGF0YVJldml2ZXIpe1xuICAgICAgICB0aGlzLmxvYWQoSlNPTi5wYXJzZShkdG8uc2VyaWFsaXplZERhdGEsIGRhdGFSZXZpdmVyKSk7XG4gICAgICAgIHRoaXMuJGNvZGVFcnJvciA9IGR0by4kY29kZUVycm9yO1xuICAgICAgICB0aGlzLiRjb2RlRGlydHkgPSBkdG8uJGNvZGVEaXJ0eTtcbiAgICAgICAgdGhpcy52YWxpZGF0aW9uUmVzdWx0cy5sZW5ndGg9MDtcbiAgICAgICAgZHRvLnZhbGlkYXRpb25SZXN1bHRzLmZvckVhY2godj0+e1xuICAgICAgICAgICAgdGhpcy52YWxpZGF0aW9uUmVzdWx0cy5wdXNoKFZhbGlkYXRpb25SZXN1bHQuY3JlYXRlRnJvbURUTyh2KSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAvKlRoaXMgbWV0aG9kIHVwZGF0ZXMgb25seSBjb21wdXRhdGlvbiByZXN1bHRzL3ZhbGlkYXRpb24qL1xuICAgIHVwZGF0ZUZyb20oZGF0YU1vZGVsKXtcbiAgICAgICAgaWYodGhpcy4kdmVyc2lvbj5kYXRhTW9kZWwuJHZlcnNpb24pe1xuICAgICAgICAgICAgbG9nLndhcm4oXCJEYXRhTW9kZWwudXBkYXRlRnJvbTogdmVyc2lvbiBvZiBjdXJyZW50IG1vZGVsIGdyZWF0ZXIgdGhhbiB1cGRhdGVcIilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYnlJZCA9IHt9XG4gICAgICAgIGRhdGFNb2RlbC5ub2Rlcy5mb3JFYWNoKG49PntcbiAgICAgICAgICAgIGJ5SWRbbi4kaWRdID0gbjtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubm9kZXMuZm9yRWFjaCgobixpKT0+e1xuICAgICAgICAgICAgaWYoYnlJZFtuLiRpZF0pe1xuICAgICAgICAgICAgICAgIG4ubG9hZENvbXB1dGVkVmFsdWVzKGJ5SWRbbi4kaWRdLmNvbXB1dGVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRhdGFNb2RlbC5lZGdlcy5mb3JFYWNoKGU9PntcbiAgICAgICAgICAgIGJ5SWRbZS4kaWRdID0gZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZWRnZXMuZm9yRWFjaCgoZSxpKT0+e1xuICAgICAgICAgICAgaWYoYnlJZFtlLiRpZF0pe1xuICAgICAgICAgICAgICAgIGUubG9hZENvbXB1dGVkVmFsdWVzKGJ5SWRbZS4kaWRdLmNvbXB1dGVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZXhwcmVzc2lvblNjb3BlID0gZGF0YU1vZGVsLmV4cHJlc3Npb25TY29wZTtcbiAgICAgICAgdGhpcy4kY29kZUVycm9yID0gZGF0YU1vZGVsLiRjb2RlRXJyb3I7XG4gICAgICAgIHRoaXMuJGNvZGVEaXJ0eSA9IGRhdGFNb2RlbC4kY29kZURpcnR5O1xuICAgICAgICB0aGlzLnZhbGlkYXRpb25SZXN1bHRzICA9IGRhdGFNb2RlbC52YWxpZGF0aW9uUmVzdWx0cztcbiAgICB9XG5cbiAgICBnZXRHbG9iYWxWYXJpYWJsZU5hbWVzKGZpbHRlckZ1bmN0aW9uID0gdHJ1ZSl7XG4gICAgICAgIHZhciByZXMgPSBbXTtcbiAgICAgICAgVXRpbHMuZm9yT3duKHRoaXMuZXhwcmVzc2lvblNjb3BlLCAodmFsdWUsIGtleSk9PntcbiAgICAgICAgICAgIGlmKGZpbHRlckZ1bmN0aW9uICYmIFV0aWxzLmlzRnVuY3Rpb24odmFsdWUpKXtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMucHVzaChrZXkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICAvKmNyZWF0ZSBub2RlIGZyb20gc2VyaWFsaXplZCBkYXRhKi9cbiAgICBjcmVhdGVOb2RlRnJvbURhdGEoZGF0YSwgcGFyZW50KSB7XG4gICAgICAgIHZhciBub2RlLCBsb2NhdGlvbjtcblxuICAgICAgICBpZihkYXRhLmxvY2F0aW9uKXtcbiAgICAgICAgICAgIGxvY2F0aW9uID0gbmV3IGRvbWFpbi5Qb2ludChkYXRhLmxvY2F0aW9uLngsIGRhdGEubG9jYXRpb24ueSk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgbG9jYXRpb24gPSBuZXcgZG9tYWluLlBvaW50KDAsMCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZG9tYWluLkRlY2lzaW9uTm9kZS4kVFlQRSA9PSBkYXRhLnR5cGUpIHtcbiAgICAgICAgICAgIG5vZGUgPSBuZXcgZG9tYWluLkRlY2lzaW9uTm9kZShsb2NhdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoZG9tYWluLkNoYW5jZU5vZGUuJFRZUEUgPT0gZGF0YS50eXBlKSB7XG4gICAgICAgICAgICBub2RlID0gbmV3IGRvbWFpbi5DaGFuY2VOb2RlKGxvY2F0aW9uKTtcbiAgICAgICAgfSBlbHNlIGlmIChkb21haW4uVGVybWluYWxOb2RlLiRUWVBFID09IGRhdGEudHlwZSkge1xuICAgICAgICAgICAgbm9kZSA9IG5ldyBkb21haW4uVGVybWluYWxOb2RlKGxvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBpZihkYXRhLiRpZCl7XG4gICAgICAgICAgICBub2RlLiRpZCA9IGRhdGEuJGlkO1xuICAgICAgICB9XG4gICAgICAgIGlmKGRhdGEuJGZpZWxkU3RhdHVzKXtcbiAgICAgICAgICAgIG5vZGUuJGZpZWxkU3RhdHVzID0gZGF0YS4kZmllbGRTdGF0dXM7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZS5uYW1lID0gZGF0YS5uYW1lO1xuXG4gICAgICAgIGlmKGRhdGEuY29kZSl7XG4gICAgICAgICAgICBub2RlLmNvZGUgPSBkYXRhLmNvZGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRhdGEuZXhwcmVzc2lvblNjb3BlKSB7XG4gICAgICAgICAgICBub2RlLmV4cHJlc3Npb25TY29wZSA9IGRhdGEuZXhwcmVzc2lvblNjb3BlXG4gICAgICAgIH1cbiAgICAgICAgaWYoZGF0YS5jb21wdXRlZCl7XG4gICAgICAgICAgICBub2RlLmxvYWRDb21wdXRlZFZhbHVlcyhkYXRhLmNvbXB1dGVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5vZGUuZm9sZGVkID0gISFkYXRhLmZvbGRlZDtcblxuICAgICAgICB2YXIgZWRnZU9yTm9kZSA9IHRoaXMuYWRkTm9kZShub2RlLCBwYXJlbnQpO1xuICAgICAgICBkYXRhLmNoaWxkRWRnZXMuZm9yRWFjaChlZD0+IHtcbiAgICAgICAgICAgIHZhciBlZGdlID0gdGhpcy5jcmVhdGVOb2RlRnJvbURhdGEoZWQuY2hpbGROb2RlLCBub2RlKTtcbiAgICAgICAgICAgIGlmKFV0aWxzLmlzQXJyYXkoZWQucGF5b2ZmKSl7XG4gICAgICAgICAgICAgICAgZWRnZS5wYXlvZmYgPSBlZC5wYXlvZmY7XG4gICAgICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgICAgICBlZGdlLnBheW9mZiA9IFtlZC5wYXlvZmYsIDBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlZGdlLnByb2JhYmlsaXR5ID0gZWQucHJvYmFiaWxpdHk7XG4gICAgICAgICAgICBlZGdlLm5hbWUgPSBlZC5uYW1lO1xuICAgICAgICAgICAgaWYoZWQuY29tcHV0ZWQpe1xuICAgICAgICAgICAgICAgIGVkZ2UubG9hZENvbXB1dGVkVmFsdWVzKGVkLmNvbXB1dGVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGVkLiRpZCl7XG4gICAgICAgICAgICAgICAgZWRnZS4kaWQgPSBlZC4kaWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihlZC4kZmllbGRTdGF0dXMpe1xuICAgICAgICAgICAgICAgIGVkZ2UuJGZpZWxkU3RhdHVzID0gZWQuJGZpZWxkU3RhdHVzO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZWRnZU9yTm9kZTtcbiAgICB9XG5cbiAgICAvKnJldHVybnMgbm9kZSBvciBlZGdlIGZyb20gcGFyZW50IHRvIHRoaXMgbm9kZSovXG4gICAgYWRkTm9kZShub2RlLCBwYXJlbnQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLm5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgIHZhciBlZGdlID0gc2VsZi5fYWRkQ2hpbGQocGFyZW50LCBub2RlKTtcbiAgICAgICAgICAgIHRoaXMuX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhub2RlKTtcbiAgICAgICAgICAgIHJldHVybiBlZGdlO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fZmlyZU5vZGVBZGRlZENhbGxiYWNrKG5vZGUpO1xuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9XG5cbiAgICAvKmluamVjdHMgZ2l2ZW4gbm9kZSBpbnRvIGdpdmVuIGVkZ2UqL1xuICAgIGluamVjdE5vZGUobm9kZSwgZWRnZSkge1xuICAgICAgICB2YXIgcGFyZW50ID0gZWRnZS5wYXJlbnROb2RlO1xuICAgICAgICB2YXIgY2hpbGQgPSBlZGdlLmNoaWxkTm9kZTtcbiAgICAgICAgdGhpcy5ub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICBub2RlLiRwYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgIGVkZ2UuY2hpbGROb2RlID0gbm9kZTtcbiAgICAgICAgdGhpcy5fYWRkQ2hpbGQobm9kZSwgY2hpbGQpO1xuICAgICAgICB0aGlzLl9maXJlTm9kZUFkZGVkQ2FsbGJhY2sobm9kZSk7XG4gICAgfVxuXG4gICAgX2FkZENoaWxkKHBhcmVudCwgY2hpbGQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgZWRnZSA9IG5ldyBkb21haW4uRWRnZShwYXJlbnQsIGNoaWxkKTtcbiAgICAgICAgc2VsZi5fc2V0RWRnZUluaXRpYWxQcm9iYWJpbGl0eShlZGdlKTtcbiAgICAgICAgc2VsZi5lZGdlcy5wdXNoKGVkZ2UpO1xuXG4gICAgICAgIHBhcmVudC5jaGlsZEVkZ2VzLnB1c2goZWRnZSk7XG4gICAgICAgIGNoaWxkLiRwYXJlbnQgPSBwYXJlbnQ7XG4gICAgICAgIHJldHVybiBlZGdlO1xuICAgIH1cblxuICAgIF9zZXRFZGdlSW5pdGlhbFByb2JhYmlsaXR5KGVkZ2UpIHtcbiAgICAgICAgaWYgKGVkZ2UucGFyZW50Tm9kZSBpbnN0YW5jZW9mIGRvbWFpbi5DaGFuY2VOb2RlKSB7XG4gICAgICAgICAgICBlZGdlLnByb2JhYmlsaXR5ID0gJyMnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZWRnZS5wcm9iYWJpbGl0eSA9IHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgLypyZW1vdmVzIGdpdmVuIG5vZGUgYW5kIGl0cyBzdWJ0cmVlKi9cbiAgICByZW1vdmVOb2RlKG5vZGUsICRsID0gMCkge1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgbm9kZS5jaGlsZEVkZ2VzLmZvckVhY2goZT0+c2VsZi5yZW1vdmVOb2RlKGUuY2hpbGROb2RlLCAkbCArIDEpKTtcblxuICAgICAgICBzZWxmLl9yZW1vdmVOb2RlKG5vZGUpO1xuICAgICAgICB2YXIgcGFyZW50ID0gbm9kZS4kcGFyZW50O1xuICAgICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgICAgICB2YXIgcGFyZW50RWRnZSA9IFV0aWxzLmZpbmQocGFyZW50LmNoaWxkRWRnZXMsIChlLCBpKT0+IGUuY2hpbGROb2RlID09PSBub2RlKTtcbiAgICAgICAgICAgIGlmICgkbCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5yZW1vdmVFZGdlKHBhcmVudEVkZ2UpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLl9yZW1vdmVFZGdlKHBhcmVudEVkZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2ZpcmVOb2RlUmVtb3ZlZENhbGxiYWNrKG5vZGUpO1xuICAgIH1cblxuICAgIC8qcmVtb3ZlcyBnaXZlbiBub2RlcyBhbmQgdGhlaXIgc3VidHJlZXMqL1xuICAgIHJlbW92ZU5vZGVzKG5vZGVzKSB7XG5cbiAgICAgICAgdmFyIHJvb3RzID0gdGhpcy5maW5kU3VidHJlZVJvb3RzKG5vZGVzKTtcbiAgICAgICAgcm9vdHMuZm9yRWFjaChuPT50aGlzLnJlbW92ZU5vZGUobiwgMCksIHRoaXMpO1xuICAgIH1cblxuICAgIGNvbnZlcnROb2RlKG5vZGUsIHR5cGVUb0NvbnZlcnRUbyl7XG4gICAgICAgIHZhciBuZXdOb2RlO1xuICAgICAgICBpZighbm9kZS5jaGlsZEVkZ2VzLmxlbmd0aCAmJiBub2RlLiRwYXJlbnQpe1xuICAgICAgICAgICAgbmV3Tm9kZSA9IHRoaXMuY3JlYXRlTm9kZUJ5VHlwZSh0eXBlVG9Db252ZXJ0VG8sIG5vZGUubG9jYXRpb24pO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGlmKG5vZGUgaW5zdGFuY2VvZiBkb21haW4uRGVjaXNpb25Ob2RlICYmIHR5cGVUb0NvbnZlcnRUbz09ZG9tYWluLkNoYW5jZU5vZGUuJFRZUEUpe1xuICAgICAgICAgICAgICAgIG5ld05vZGUgPSB0aGlzLmNyZWF0ZU5vZGVCeVR5cGUodHlwZVRvQ29udmVydFRvLCBub2RlLmxvY2F0aW9uKTtcbiAgICAgICAgICAgIH1lbHNlIGlmKHR5cGVUb0NvbnZlcnRUbz09ZG9tYWluLkRlY2lzaW9uTm9kZS4kVFlQRSl7XG4gICAgICAgICAgICAgICAgbmV3Tm9kZSA9IHRoaXMuY3JlYXRlTm9kZUJ5VHlwZSh0eXBlVG9Db252ZXJ0VG8sIG5vZGUubG9jYXRpb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYobmV3Tm9kZSl7XG4gICAgICAgICAgICBuZXdOb2RlLm5hbWU9bm9kZS5uYW1lO1xuICAgICAgICAgICAgdGhpcy5yZXBsYWNlTm9kZShuZXdOb2RlLCBub2RlKTtcbiAgICAgICAgICAgIG5ld05vZGUuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PnRoaXMuX3NldEVkZ2VJbml0aWFsUHJvYmFiaWxpdHkoZSkpO1xuICAgICAgICAgICAgdGhpcy5fZmlyZU5vZGVBZGRlZENhbGxiYWNrKG5ld05vZGUpO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBjcmVhdGVOb2RlQnlUeXBlKHR5cGUsIGxvY2F0aW9uKXtcbiAgICAgICAgaWYodHlwZT09ZG9tYWluLkRlY2lzaW9uTm9kZS4kVFlQRSl7XG4gICAgICAgICAgICByZXR1cm4gbmV3IGRvbWFpbi5EZWNpc2lvbk5vZGUobG9jYXRpb24pXG4gICAgICAgIH1lbHNlIGlmKHR5cGU9PWRvbWFpbi5DaGFuY2VOb2RlLiRUWVBFKXtcbiAgICAgICAgICAgIHJldHVybiBuZXcgZG9tYWluLkNoYW5jZU5vZGUobG9jYXRpb24pXG4gICAgICAgIH1lbHNlIGlmKHR5cGU9PWRvbWFpbi5UZXJtaW5hbE5vZGUuJFRZUEUpe1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBkb21haW4uVGVybWluYWxOb2RlKGxvY2F0aW9uKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVwbGFjZU5vZGUobmV3Tm9kZSwgb2xkTm9kZSl7XG4gICAgICAgIHZhciBwYXJlbnQgPSBvbGROb2RlLiRwYXJlbnQ7XG4gICAgICAgIG5ld05vZGUuJHBhcmVudCA9IHBhcmVudDtcblxuICAgICAgICBpZihwYXJlbnQpe1xuICAgICAgICAgICAgdmFyIHBhcmVudEVkZ2UgPSBVdGlscy5maW5kKG5ld05vZGUuJHBhcmVudC5jaGlsZEVkZ2VzLCBlPT5lLmNoaWxkTm9kZT09PW9sZE5vZGUpO1xuICAgICAgICAgICAgcGFyZW50RWRnZS5jaGlsZE5vZGUgPSBuZXdOb2RlO1xuICAgICAgICB9XG5cbiAgICAgICAgbmV3Tm9kZS5jaGlsZEVkZ2VzID0gb2xkTm9kZS5jaGlsZEVkZ2VzO1xuICAgICAgICBuZXdOb2RlLmNoaWxkRWRnZXMuZm9yRWFjaChlPT5lLnBhcmVudE5vZGU9bmV3Tm9kZSk7XG5cbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5ub2Rlcy5pbmRleE9mKG9sZE5vZGUpO1xuICAgICAgICBpZih+aW5kZXgpe1xuICAgICAgICAgICAgdGhpcy5ub2Rlc1tpbmRleF09bmV3Tm9kZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldFJvb3RzKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5ub2Rlcy5maWx0ZXIobj0+IW4uJHBhcmVudCk7XG4gICAgfVxuXG4gICAgZmluZFN1YnRyZWVSb290cyhub2Rlcykge1xuICAgICAgICByZXR1cm4gbm9kZXMuZmlsdGVyKG49PiFuLiRwYXJlbnQgfHwgbm9kZXMuaW5kZXhPZihuLiRwYXJlbnQpID09PSAtMSk7XG4gICAgfVxuXG4gICAgLypjcmVhdGVzIGRldGFjaGVkIGNsb25lIG9mIGdpdmVuIG5vZGUqL1xuICAgIGNsb25lU3VidHJlZShub2RlVG9Db3B5LCBjbG9uZUNvbXB1dGVkVmFsdWVzKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGNsb25lID0gdGhpcy5jbG9uZU5vZGUobm9kZVRvQ29weSk7XG5cbiAgICAgICAgbm9kZVRvQ29weS5jaGlsZEVkZ2VzLmZvckVhY2goZT0+IHtcbiAgICAgICAgICAgIHZhciBjaGlsZENsb25lID0gc2VsZi5jbG9uZVN1YnRyZWUoZS5jaGlsZE5vZGUsIGNsb25lQ29tcHV0ZWRWYWx1ZXMpO1xuICAgICAgICAgICAgY2hpbGRDbG9uZS4kcGFyZW50ID0gY2xvbmU7XG4gICAgICAgICAgICB2YXIgZWRnZSA9IFV0aWxzLmNsb25lKGUpO1xuICAgICAgICAgICAgZWRnZS4kaWQgPSBVdGlscy5ndWlkKCk7XG4gICAgICAgICAgICBlZGdlLnBhcmVudE5vZGUgPSBjbG9uZTtcbiAgICAgICAgICAgIGVkZ2UuY2hpbGROb2RlID0gY2hpbGRDbG9uZTtcbiAgICAgICAgICAgIGVkZ2UucGF5b2ZmID0gVXRpbHMuY2xvbmVEZWVwKGUucGF5b2ZmKTtcbiAgICAgICAgICAgIGVkZ2UuY29tcHV0ZWQgPSB7fTtcbiAgICAgICAgICAgIGlmIChjbG9uZUNvbXB1dGVkVmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgZWRnZS5jb21wdXRlZCA9IFV0aWxzLmNsb25lRGVlcChlLmNvbXB1dGVkKTtcbiAgICAgICAgICAgICAgICBjaGlsZENsb25lLmNvbXB1dGVkID0gVXRpbHMuY2xvbmVEZWVwKGUuY2hpbGROb2RlLmNvbXB1dGVkKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xvbmUuY2hpbGRFZGdlcy5wdXNoKGVkZ2UpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGNsb25lQ29tcHV0ZWRWYWx1ZXMpIHtcbiAgICAgICAgICAgIGNsb25lLmNvbXB1dGVkID0gVXRpbHMuY2xvbmVEZWVwKG5vZGVUb0NvcHkuY29tcHV0ZWQpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNsb25lO1xuICAgIH1cblxuICAgIC8qYXR0YWNoZXMgZGV0YWNoZWQgc3VidHJlZSB0byBnaXZlbiBwYXJlbnQqL1xuICAgIGF0dGFjaFN1YnRyZWUobm9kZVRvQXR0YWNoLCBwYXJlbnQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgbm9kZU9yRWRnZSA9IHNlbGYuYWRkTm9kZShub2RlVG9BdHRhY2gsIHBhcmVudCk7XG5cbiAgICAgICAgbm9kZVRvQXR0YWNoLmV4cHJlc3Npb25TY29wZSA9IG51bGw7XG5cbiAgICAgICAgdmFyIGNoaWxkRWRnZXMgPSBzZWxmLmdldEFsbERlc2NlbmRhbnRFZGdlcyhub2RlVG9BdHRhY2gpO1xuICAgICAgICBjaGlsZEVkZ2VzLmZvckVhY2goZT0+IHtcbiAgICAgICAgICAgIHNlbGYuZWRnZXMucHVzaChlKTtcbiAgICAgICAgICAgIHNlbGYubm9kZXMucHVzaChlLmNoaWxkTm9kZSk7XG4gICAgICAgICAgICBlLmNoaWxkTm9kZS5leHByZXNzaW9uU2NvcGUgPSBudWxsO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbm9kZU9yRWRnZTtcbiAgICB9XG5cbiAgICBjbG9uZU5vZGVzKG5vZGVzKSB7XG4gICAgICAgIHZhciByb290cyA9IFtdXG4gICAgICAgIC8vVE9ET1xuICAgIH1cblxuICAgIC8qc2hhbGxvdyBjbG9uZSB3aXRob3V0IHBhcmVudCBhbmQgY2hpbGRyZW4qL1xuICAgIGNsb25lTm9kZShub2RlKSB7XG4gICAgICAgIHZhciBjbG9uZSA9IFV0aWxzLmNsb25lKG5vZGUpXG4gICAgICAgIGNsb25lLiRpZCA9IFV0aWxzLmd1aWQoKTtcbiAgICAgICAgY2xvbmUubG9jYXRpb24gPSBVdGlscy5jbG9uZShub2RlLmxvY2F0aW9uKTtcbiAgICAgICAgY2xvbmUuY29tcHV0ZWQgPSBVdGlscy5jbG9uZShub2RlLmNvbXB1dGVkKTtcbiAgICAgICAgY2xvbmUuJHBhcmVudCA9IG51bGw7XG4gICAgICAgIGNsb25lLmNoaWxkRWRnZXMgPSBbXTtcbiAgICAgICAgcmV0dXJuIGNsb25lO1xuICAgIH1cblxuICAgIGZpbmROb2RlQnlJZChpZCkge1xuICAgICAgICByZXR1cm4gVXRpbHMuZmluZCh0aGlzLm5vZGVzLCBuPT5uLiRpZCA9PSBpZCk7XG4gICAgfVxuXG4gICAgZmluZEVkZ2VCeUlkKGlkKSB7XG4gICAgICAgIHJldHVybiBVdGlscy5maW5kKHRoaXMuZWRnZXMsIGU9PmUuJGlkID09IGlkKTtcbiAgICB9XG5cbiAgICBmaW5kQnlJZChpZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZmluZE5vZGVCeUlkKGlkKTtcbiAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmZpbmRFZGdlQnlJZChpZCk7XG4gICAgfVxuXG4gICAgX3JlbW92ZU5vZGUobm9kZSkgey8vIHNpbXBseSByZW1vdmVzIG5vZGUgZnJvbSBub2RlIGxpc3RcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5ub2Rlcy5pbmRleE9mKG5vZGUpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5ub2Rlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVtb3ZlRWRnZShlZGdlKSB7XG4gICAgICAgIHZhciBpbmRleCA9IGVkZ2UucGFyZW50Tm9kZS5jaGlsZEVkZ2VzLmluZGV4T2YoZWRnZSk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICBlZGdlLnBhcmVudE5vZGUuY2hpbGRFZGdlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3JlbW92ZUVkZ2UoZWRnZSk7XG4gICAgfVxuXG4gICAgX3JlbW92ZUVkZ2UoZWRnZSkgeyAvL3JlbW92ZXMgZWRnZSBmcm9tIGVkZ2UgbGlzdCB3aXRob3V0IHJlbW92aW5nIGNvbm5lY3RlZCBub2Rlc1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmVkZ2VzLmluZGV4T2YoZWRnZSk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICB0aGlzLmVkZ2VzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfcmVtb3ZlTm9kZXMobm9kZXNUb1JlbW92ZSkge1xuICAgICAgICB0aGlzLm5vZGVzID0gdGhpcy5ub2Rlcy5maWx0ZXIobj0+bm9kZXNUb1JlbW92ZS5pbmRleE9mKG4pID09PSAtMSk7XG4gICAgfVxuXG4gICAgX3JlbW92ZUVkZ2VzKGVkZ2VzVG9SZW1vdmUpIHtcbiAgICAgICAgdGhpcy5lZGdlcyA9IHRoaXMuZWRnZXMuZmlsdGVyKGU9PmVkZ2VzVG9SZW1vdmUuaW5kZXhPZihlKSA9PT0gLTEpO1xuICAgIH1cblxuICAgIGdldEFsbERlc2NlbmRhbnRFZGdlcyhub2RlKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIG5vZGUuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PiB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChlKTtcbiAgICAgICAgICAgIGlmIChlLmNoaWxkTm9kZSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKC4uLnNlbGYuZ2V0QWxsRGVzY2VuZGFudEVkZ2VzKGUuY2hpbGROb2RlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZ2V0QWxsRGVzY2VuZGFudE5vZGVzKG5vZGUpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG5cbiAgICAgICAgbm9kZS5jaGlsZEVkZ2VzLmZvckVhY2goZT0+IHtcbiAgICAgICAgICAgIGlmIChlLmNoaWxkTm9kZSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGUuY2hpbGROb2RlKTtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCguLi5zZWxmLmdldEFsbERlc2NlbmRhbnROb2RlcyhlLmNoaWxkTm9kZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGdldEFsbE5vZGVzSW5TdWJ0cmVlKG5vZGUpIHtcbiAgICAgICAgdmFyIGRlc2NlbmRhbnRzID0gdGhpcy5nZXRBbGxEZXNjZW5kYW50Tm9kZXMobm9kZSk7XG4gICAgICAgIGRlc2NlbmRhbnRzLnVuc2hpZnQobm9kZSk7XG4gICAgICAgIHJldHVybiBkZXNjZW5kYW50cztcbiAgICB9XG5cbiAgICBpc1VuZG9BdmFpbGFibGUoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMudW5kb1N0YWNrLmxlbmd0aFxuICAgIH1cblxuICAgIGlzUmVkb0F2YWlsYWJsZSgpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5yZWRvU3RhY2subGVuZ3RoXG4gICAgfVxuXG4gICAgY3JlYXRlU3RhdGVTbmFwc2hvdChyZXZlcnRDb25mKXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJldmVydENvbmY6IHJldmVydENvbmYsXG4gICAgICAgICAgICBub2RlczogVXRpbHMuY2xvbmVEZWVwKHRoaXMubm9kZXMpLFxuICAgICAgICAgICAgZWRnZXM6IFV0aWxzLmNsb25lRGVlcCh0aGlzLmVkZ2VzKSxcbiAgICAgICAgICAgIHRleHRzOiBVdGlscy5jbG9uZURlZXAodGhpcy50ZXh0cyksXG4gICAgICAgICAgICBwYXlvZmZOYW1lczogVXRpbHMuY2xvbmVEZWVwKHRoaXMucGF5b2ZmTmFtZXMpLFxuICAgICAgICAgICAgZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQ6IFV0aWxzLmNsb25lRGVlcCh0aGlzLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0KSxcbiAgICAgICAgICAgIHdlaWdodExvd2VyQm91bmQ6IFV0aWxzLmNsb25lRGVlcCh0aGlzLndlaWdodExvd2VyQm91bmQpLFxuICAgICAgICAgICAgd2VpZ2h0VXBwZXJCb3VuZDogVXRpbHMuY2xvbmVEZWVwKHRoaXMud2VpZ2h0VXBwZXJCb3VuZCksXG4gICAgICAgICAgICBleHByZXNzaW9uU2NvcGU6IFV0aWxzLmNsb25lRGVlcCh0aGlzLmV4cHJlc3Npb25TY29wZSksXG4gICAgICAgICAgICBjb2RlOiB0aGlzLmNvZGUsXG4gICAgICAgICAgICAkY29kZUVycm9yOiB0aGlzLiRjb2RlRXJyb3JcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgc2F2ZVN0YXRlRnJvbVNuYXBzaG90KHN0YXRlKXtcbiAgICAgICAgdGhpcy5yZWRvU3RhY2subGVuZ3RoID0gMDtcblxuICAgICAgICB0aGlzLl9wdXNoVG9TdGFjayh0aGlzLnVuZG9TdGFjaywgc3RhdGUpO1xuXG4gICAgICAgIHRoaXMuX2ZpcmVVbmRvUmVkb0NhbGxiYWNrKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2F2ZVN0YXRlKHJldmVydENvbmYpIHtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGVGcm9tU25hcHNob3QodGhpcy5jcmVhdGVTdGF0ZVNuYXBzaG90KHJldmVydENvbmYpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdW5kbygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgbmV3U3RhdGUgPSB0aGlzLnVuZG9TdGFjay5wb3AoKTtcbiAgICAgICAgaWYgKCFuZXdTdGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcHVzaFRvU3RhY2sodGhpcy5yZWRvU3RhY2ssIHtcbiAgICAgICAgICAgIHJldmVydENvbmY6IG5ld1N0YXRlLnJldmVydENvbmYsXG4gICAgICAgICAgICBub2Rlczogc2VsZi5ub2RlcyxcbiAgICAgICAgICAgIGVkZ2VzOiBzZWxmLmVkZ2VzLFxuICAgICAgICAgICAgdGV4dHM6IHNlbGYudGV4dHMsXG4gICAgICAgICAgICBwYXlvZmZOYW1lczogc2VsZi5wYXlvZmZOYW1lcyxcbiAgICAgICAgICAgIGRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0OiBzZWxmLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0LFxuICAgICAgICAgICAgd2VpZ2h0TG93ZXJCb3VuZDogc2VsZi53ZWlnaHRMb3dlckJvdW5kLFxuICAgICAgICAgICAgd2VpZ2h0VXBwZXJCb3VuZDogc2VsZi53ZWlnaHRVcHBlckJvdW5kLFxuICAgICAgICAgICAgZXhwcmVzc2lvblNjb3BlOiBzZWxmLmV4cHJlc3Npb25TY29wZSxcbiAgICAgICAgICAgIGNvZGU6IHNlbGYuY29kZSxcbiAgICAgICAgICAgICRjb2RlRXJyb3I6IHNlbGYuJGNvZGVFcnJvclxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX3NldE5ld1N0YXRlKG5ld1N0YXRlKTtcblxuICAgICAgICB0aGlzLl9maXJlVW5kb1JlZG9DYWxsYmFjaygpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJlZG8oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG5ld1N0YXRlID0gdGhpcy5yZWRvU3RhY2sucG9wKCk7XG4gICAgICAgIGlmICghbmV3U3RhdGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3B1c2hUb1N0YWNrKHRoaXMudW5kb1N0YWNrLCB7XG4gICAgICAgICAgICByZXZlcnRDb25mOiBuZXdTdGF0ZS5yZXZlcnRDb25mLFxuICAgICAgICAgICAgbm9kZXM6IHNlbGYubm9kZXMsXG4gICAgICAgICAgICBlZGdlczogc2VsZi5lZGdlcyxcbiAgICAgICAgICAgIHRleHRzOiBzZWxmLnRleHRzLFxuICAgICAgICAgICAgcGF5b2ZmTmFtZXM6IHNlbGYucGF5b2ZmTmFtZXMsXG4gICAgICAgICAgICBkZWZhdWx0Q3JpdGVyaW9uMVdlaWdodDogc2VsZi5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCxcbiAgICAgICAgICAgIHdlaWdodExvd2VyQm91bmQ6IHNlbGYud2VpZ2h0TG93ZXJCb3VuZCxcbiAgICAgICAgICAgIHdlaWdodFVwcGVyQm91bmQ6IHNlbGYud2VpZ2h0VXBwZXJCb3VuZCxcbiAgICAgICAgICAgIGV4cHJlc3Npb25TY29wZTogc2VsZi5leHByZXNzaW9uU2NvcGUsXG4gICAgICAgICAgICBjb2RlOiBzZWxmLmNvZGUsXG4gICAgICAgICAgICAkY29kZUVycm9yOiBzZWxmLiRjb2RlRXJyb3JcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5fc2V0TmV3U3RhdGUobmV3U3RhdGUsIHRydWUpO1xuXG4gICAgICAgIHRoaXMuX2ZpcmVVbmRvUmVkb0NhbGxiYWNrKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMubm9kZXMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5lZGdlcy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLnVuZG9TdGFjay5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLnJlZG9TdGFjay5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLnRleHRzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuY2xlYXJFeHByZXNzaW9uU2NvcGUoKTtcbiAgICAgICAgdGhpcy5jb2RlID0gJyc7XG4gICAgICAgIHRoaXMuJGNvZGVFcnJvciA9IG51bGw7XG4gICAgICAgIHRoaXMuJGNvZGVEaXJ0eSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMucGF5b2ZmTmFtZXMgPSBbXTtcbiAgICAgICAgdGhpcy5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCA9IDE7XG4gICAgICAgIHRoaXMud2VpZ2h0TG93ZXJCb3VuZCA9IDA7XG4gICAgICAgIHRoaXMud2VpZ2h0VXBwZXJCb3VuZCA9IEluZmluaXR5O1xuICAgIH1cblxuICAgIGFkZFRleHQodGV4dCkge1xuICAgICAgICB0aGlzLnRleHRzLnB1c2godGV4dCk7XG5cbiAgICAgICAgdGhpcy5fZmlyZVRleHRBZGRlZENhbGxiYWNrKHRleHQpO1xuICAgIH1cblxuICAgIHJlbW92ZVRleHRzKHRleHRzKSB7XG4gICAgICAgIHRleHRzLmZvckVhY2godD0+dGhpcy5yZW1vdmVUZXh0KHQpKTtcbiAgICB9XG5cbiAgICByZW1vdmVUZXh0KHRleHQpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy50ZXh0cy5pbmRleE9mKHRleHQpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdGhpcy50ZXh0cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgdGhpcy5fZmlyZVRleHRSZW1vdmVkQ2FsbGJhY2sodGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbGVhckV4cHJlc3Npb25TY29wZSgpIHtcbiAgICAgICAgVXRpbHMuZm9yT3duKHRoaXMuZXhwcmVzc2lvblNjb3BlLCAodmFsdWUsIGtleSk9PiB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5leHByZXNzaW9uU2NvcGVba2V5XTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV2ZXJzZVBheW9mZnMoKXtcbiAgICAgICAgdGhpcy5wYXlvZmZOYW1lcy5yZXZlcnNlKCk7XG4gICAgICAgIHRoaXMuZWRnZXMuZm9yRWFjaChlPT5lLnBheW9mZi5yZXZlcnNlKCkpXG4gICAgfVxuXG4gICAgX3NldE5ld1N0YXRlKG5ld1N0YXRlLCByZWRvKSB7XG4gICAgICAgIHZhciBub2RlQnlJZCA9IFV0aWxzLmdldE9iamVjdEJ5SWRNYXAobmV3U3RhdGUubm9kZXMpO1xuICAgICAgICB2YXIgZWRnZUJ5SWQgPSBVdGlscy5nZXRPYmplY3RCeUlkTWFwKG5ld1N0YXRlLmVkZ2VzKTtcbiAgICAgICAgdGhpcy5ub2RlcyA9IG5ld1N0YXRlLm5vZGVzO1xuICAgICAgICB0aGlzLmVkZ2VzID0gbmV3U3RhdGUuZWRnZXM7XG4gICAgICAgIHRoaXMudGV4dHMgPSBuZXdTdGF0ZS50ZXh0cztcbiAgICAgICAgdGhpcy5wYXlvZmZOYW1lcyA9IG5ld1N0YXRlLnBheW9mZk5hbWVzO1xuICAgICAgICB0aGlzLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0ID0gbmV3U3RhdGUuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQ7XG4gICAgICAgIHRoaXMud2VpZ2h0TG93ZXJCb3VuZCA9IG5ld1N0YXRlLndlaWdodExvd2VyQm91bmQ7XG4gICAgICAgIHRoaXMud2VpZ2h0VXBwZXJCb3VuZCA9IG5ld1N0YXRlLndlaWdodFVwcGVyQm91bmQ7XG4gICAgICAgIHRoaXMuZXhwcmVzc2lvblNjb3BlID0gbmV3U3RhdGUuZXhwcmVzc2lvblNjb3BlO1xuICAgICAgICB0aGlzLmNvZGUgPSBuZXdTdGF0ZS5jb2RlO1xuICAgICAgICB0aGlzLiRjb2RlRXJyb3IgID0gbmV3U3RhdGUuJGNvZGVFcnJvclxuXG4gICAgICAgIHRoaXMubm9kZXMuZm9yRWFjaChuPT4ge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuLmNoaWxkRWRnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZWRnZSA9IGVkZ2VCeUlkW24uY2hpbGRFZGdlc1tpXS4kaWRdO1xuICAgICAgICAgICAgICAgIG4uY2hpbGRFZGdlc1tpXSA9IGVkZ2U7XG4gICAgICAgICAgICAgICAgZWRnZS5wYXJlbnROb2RlID0gbjtcbiAgICAgICAgICAgICAgICBlZGdlLmNoaWxkTm9kZSA9IG5vZGVCeUlkW2VkZ2UuY2hpbGROb2RlLiRpZF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKG5ld1N0YXRlLnJldmVydENvbmYpIHtcbiAgICAgICAgICAgIGlmICghcmVkbyAmJiBuZXdTdGF0ZS5yZXZlcnRDb25mLm9uVW5kbykge1xuICAgICAgICAgICAgICAgIG5ld1N0YXRlLnJldmVydENvbmYub25VbmRvKG5ld1N0YXRlLnJldmVydENvbmYuZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVkbyAmJiBuZXdTdGF0ZS5yZXZlcnRDb25mLm9uUmVkbykge1xuICAgICAgICAgICAgICAgIG5ld1N0YXRlLnJldmVydENvbmYub25SZWRvKG5ld1N0YXRlLnJldmVydENvbmYuZGF0YSk7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICB9XG4gICAgICAgIHRoaXMucmV2ZXJ0Q29uZiA9IG5ld1N0YXRlLnJldmVydENvbmY7XG4gICAgfVxuXG5cbiAgICBfcHVzaFRvU3RhY2soc3RhY2ssIG9iaikge1xuICAgICAgICBpZiAoc3RhY2subGVuZ3RoID49IHRoaXMubWF4U3RhY2tTaXplKSB7XG4gICAgICAgICAgICBzdGFjay5zaGlmdCgpO1xuICAgICAgICB9XG4gICAgICAgIHN0YWNrLnB1c2gob2JqKTtcbiAgICB9XG5cbiAgICBfZmlyZVVuZG9SZWRvQ2FsbGJhY2soKSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLnVuZG9SZWRvU3RhdGVDaGFuZ2VkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMudW5kb1JlZG9TdGF0ZUNoYW5nZWRDYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhub2RlKSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLm5vZGVBZGRlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLm5vZGVBZGRlZENhbGxiYWNrKG5vZGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpcmVOb2RlUmVtb3ZlZENhbGxiYWNrKG5vZGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc0Rpc2FibGVkICYmIHRoaXMubm9kZVJlbW92ZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy5ub2RlUmVtb3ZlZENhbGxiYWNrKG5vZGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpcmVUZXh0QWRkZWRDYWxsYmFjayh0ZXh0KSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLnRleHRBZGRlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLnRleHRBZGRlZENhbGxiYWNrKHRleHQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpcmVUZXh0UmVtb3ZlZENhbGxiYWNrKHRleHQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc0Rpc2FibGVkICYmIHRoaXMudGV4dFJlbW92ZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy50ZXh0UmVtb3ZlZENhbGxiYWNrKHRleHQpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHtPYmplY3RXaXRoQ29tcHV0ZWRWYWx1ZXN9IGZyb20gXCIuL29iamVjdC13aXRoLWNvbXB1dGVkLXZhbHVlc1wiO1xuXG5leHBvcnQgY2xhc3MgRWRnZSBleHRlbmRzIE9iamVjdFdpdGhDb21wdXRlZFZhbHVlcyB7XG4gICAgcGFyZW50Tm9kZTtcbiAgICBjaGlsZE5vZGU7XG5cbiAgICBuYW1lID0gJyc7XG4gICAgcHJvYmFiaWxpdHkgPSB1bmRlZmluZWQ7XG4gICAgcGF5b2ZmID0gWzAsIDBdO1xuXG4gICAgJERJU1BMQVlfVkFMVUVfTkFNRVMgPSBbJ3Byb2JhYmlsaXR5JywgJ3BheW9mZicsICdvcHRpbWFsJ107XG5cbiAgICBjb25zdHJ1Y3RvcihwYXJlbnROb2RlLCBjaGlsZE5vZGUsIG5hbWUsIHBheW9mZiwgcHJvYmFiaWxpdHksKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMucGFyZW50Tm9kZSA9IHBhcmVudE5vZGU7XG4gICAgICAgIHRoaXMuY2hpbGROb2RlID0gY2hpbGROb2RlO1xuXG4gICAgICAgIGlmIChuYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByb2JhYmlsaXR5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMucHJvYmFiaWxpdHkgPSBwcm9iYWJpbGl0eTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGF5b2ZmICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMucGF5b2ZmID0gcGF5b2ZmXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHNldE5hbWUobmFtZSkge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXRQcm9iYWJpbGl0eShwcm9iYWJpbGl0eSkge1xuICAgICAgICB0aGlzLnByb2JhYmlsaXR5ID0gcHJvYmFiaWxpdHk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldFBheW9mZihwYXlvZmYsIGluZGV4ID0gMCkge1xuICAgICAgICB0aGlzLnBheW9mZltpbmRleF0gPSBwYXlvZmY7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNvbXB1dGVkQmFzZVByb2JhYmlsaXR5KHZhbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb21wdXRlZFZhbHVlKG51bGwsICdwcm9iYWJpbGl0eScsIHZhbCk7XG4gICAgfVxuXG4gICAgY29tcHV0ZWRCYXNlUGF5b2ZmKHZhbCwgaW5kZXggPSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVkVmFsdWUobnVsbCwgJ3BheW9mZlsnICsgaW5kZXggKyAnXScsIHZhbCk7XG4gICAgfVxuXG4gICAgZGlzcGxheVByb2JhYmlsaXR5KHZhbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kaXNwbGF5VmFsdWUoJ3Byb2JhYmlsaXR5JywgdmFsKTtcbiAgICB9XG5cbiAgICBkaXNwbGF5UGF5b2ZmKHZhbCwgaW5kZXggPSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRpc3BsYXlWYWx1ZSgncGF5b2ZmWycgKyBpbmRleCArICddJywgdmFsKTtcbiAgICB9XG59XG4iLCJleHBvcnQgKiBmcm9tICcuL25vZGUvbm9kZSdcbmV4cG9ydCAqIGZyb20gJy4vbm9kZS9kZWNpc2lvbi1ub2RlJ1xuZXhwb3J0ICogZnJvbSAnLi9ub2RlL2NoYW5jZS1ub2RlJ1xuZXhwb3J0ICogZnJvbSAnLi9ub2RlL3Rlcm1pbmFsLW5vZGUnXG5leHBvcnQgKiBmcm9tICcuL2VkZ2UnXG5leHBvcnQgKiBmcm9tICcuL3BvaW50J1xuZXhwb3J0ICogZnJvbSAnLi90ZXh0J1xuIiwiaW1wb3J0IHtOb2RlfSBmcm9tICcuL25vZGUnXG5cbmV4cG9ydCBjbGFzcyBDaGFuY2VOb2RlIGV4dGVuZHMgTm9kZXtcblxuICAgIHN0YXRpYyAkVFlQRSA9ICdjaGFuY2UnO1xuXG4gICAgY29uc3RydWN0b3IobG9jYXRpb24pe1xuICAgICAgICBzdXBlcihDaGFuY2VOb2RlLiRUWVBFLCBsb2NhdGlvbik7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtOb2RlfSBmcm9tICcuL25vZGUnXG5cbmV4cG9ydCBjbGFzcyBEZWNpc2lvbk5vZGUgZXh0ZW5kcyBOb2Rle1xuXG4gICAgc3RhdGljICRUWVBFID0gJ2RlY2lzaW9uJztcblxuICAgIGNvbnN0cnVjdG9yKGxvY2F0aW9uKXtcbiAgICAgICAgc3VwZXIoRGVjaXNpb25Ob2RlLiRUWVBFLCBsb2NhdGlvbik7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtQb2ludH0gZnJvbSAnLi4vcG9pbnQnXG5pbXBvcnQge09iamVjdFdpdGhDb21wdXRlZFZhbHVlc30gZnJvbSAnLi4vb2JqZWN0LXdpdGgtY29tcHV0ZWQtdmFsdWVzJ1xuXG5leHBvcnQgY2xhc3MgTm9kZSBleHRlbmRzIE9iamVjdFdpdGhDb21wdXRlZFZhbHVlc3tcblxuICAgIHR5cGU7XG4gICAgY2hpbGRFZGdlcz1bXTtcbiAgICBuYW1lPScnO1xuXG4gICAgbG9jYXRpb247IC8vUG9pbnRcblxuICAgIGNvZGU9Jyc7XG4gICAgJGNvZGVEaXJ0eSA9IGZhbHNlOyAvLyBpcyBjb2RlIGNoYW5nZWQgd2l0aG91dCByZWV2YWx1YXRpb24/XG4gICAgJGNvZGVFcnJvciA9IG51bGw7IC8vY29kZSBldmFsdWF0aW9uIGVycm9yc1xuXG4gICAgZXhwcmVzc2lvblNjb3BlPW51bGw7XG5cbiAgICBmb2xkZWQgPSBmYWxzZTsgLy8gaXMgbm9kZSBmb2xkZWQgYWxvbmcgd2l0aCBpdHMgc3VidHJlZVxuXG4gICAgJERJU1BMQVlfVkFMVUVfTkFNRVMgPSBbJ2NoaWxkcmVuUGF5b2ZmJywgJ2FnZ3JlZ2F0ZWRQYXlvZmYnLCAncHJvYmFiaWxpdHlUb0VudGVyJywgJ29wdGltYWwnXVxuXG4gICAgY29uc3RydWN0b3IodHlwZSwgbG9jYXRpb24pe1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmxvY2F0aW9uPWxvY2F0aW9uO1xuICAgICAgICBpZighbG9jYXRpb24pe1xuICAgICAgICAgICAgdGhpcy5sb2NhdGlvbiA9IG5ldyBQb2ludCgwLDApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudHlwZT10eXBlO1xuICAgIH1cblxuICAgIHNldE5hbWUobmFtZSl7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIG1vdmVUbyh4LHksIHdpdGhDaGlsZHJlbil7IC8vbW92ZSB0byBuZXcgbG9jYXRpb25cbiAgICAgICAgaWYod2l0aENoaWxkcmVuKXtcbiAgICAgICAgICAgIHZhciBkeCA9IHgtdGhpcy5sb2NhdGlvbi54O1xuICAgICAgICAgICAgdmFyIGR5ID0geS10aGlzLmxvY2F0aW9uLnk7XG4gICAgICAgICAgICB0aGlzLmNoaWxkRWRnZXMuZm9yRWFjaChlPT5lLmNoaWxkTm9kZS5tb3ZlKGR4LCBkeSwgdHJ1ZSkpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmxvY2F0aW9uLm1vdmVUbyh4LHkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBtb3ZlKGR4LCBkeSwgd2l0aENoaWxkcmVuKXsgLy9tb3ZlIGJ5IHZlY3RvclxuICAgICAgICBpZih3aXRoQ2hpbGRyZW4pe1xuICAgICAgICAgICAgdGhpcy5jaGlsZEVkZ2VzLmZvckVhY2goZT0+ZS5jaGlsZE5vZGUubW92ZShkeCwgZHksIHRydWUpKVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubG9jYXRpb24ubW92ZShkeCwgZHkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG4iLCJpbXBvcnQge05vZGV9IGZyb20gJy4vbm9kZSdcblxuZXhwb3J0IGNsYXNzIFRlcm1pbmFsTm9kZSBleHRlbmRzIE5vZGV7XG5cbiAgICBzdGF0aWMgJFRZUEUgPSAndGVybWluYWwnO1xuXG4gICAgY29uc3RydWN0b3IobG9jYXRpb24pe1xuICAgICAgICBzdXBlcihUZXJtaW5hbE5vZGUuJFRZUEUsIGxvY2F0aW9uKTtcbiAgICB9XG59XG4iLCJpbXBvcnQge1V0aWxzfSBmcm9tICdzZC11dGlscydcblxuaW1wb3J0IHtPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkc30gZnJvbSBcIi4vb2JqZWN0LXdpdGgtaWQtYW5kLWVkaXRhYmxlLWZpZWxkc1wiO1xuXG5leHBvcnQgY2xhc3MgT2JqZWN0V2l0aENvbXB1dGVkVmFsdWVzIGV4dGVuZHMgT2JqZWN0V2l0aElkQW5kRWRpdGFibGVGaWVsZHN7XG5cbiAgICBjb21wdXRlZD17fTsgLy9jb21wdXRlZCB2YWx1ZXNcblxuICAgIC8qZ2V0IG9yIHNldCBjb21wdXRlZCB2YWx1ZSovXG4gICAgY29tcHV0ZWRWYWx1ZShydWxlTmFtZSwgZmllbGRQYXRoLCB2YWx1ZSl7XG4gICAgICAgIHZhciBwYXRoID0gJ2NvbXB1dGVkLic7XG4gICAgICAgIGlmKHJ1bGVOYW1lKXtcbiAgICAgICAgICAgIHBhdGgrPXJ1bGVOYW1lKycuJztcbiAgICAgICAgfVxuICAgICAgICBwYXRoKz1maWVsZFBhdGg7XG4gICAgICAgIGlmKHZhbHVlPT09dW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHJldHVybiAgVXRpbHMuZ2V0KHRoaXMsIHBhdGgsIG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIFV0aWxzLnNldCh0aGlzLCBwYXRoLCB2YWx1ZSk7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBjbGVhckNvbXB1dGVkVmFsdWVzKHJ1bGVOYW1lKXtcbiAgICAgICAgaWYocnVsZU5hbWU9PXVuZGVmaW5lZCl7XG4gICAgICAgICAgICB0aGlzLmNvbXB1dGVkPXt9O1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKFV0aWxzLmlzQXJyYXkocnVsZU5hbWUpKXtcbiAgICAgICAgICAgIHJ1bGVOYW1lLmZvckVhY2gobj0+e1xuICAgICAgICAgICAgICAgIHRoaXMuY29tcHV0ZWRbbl09e307XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbXB1dGVkW3J1bGVOYW1lXT17fTtcbiAgICB9XG5cbiAgICBjbGVhckRpc3BsYXlWYWx1ZXMoKXtcbiAgICAgICAgdGhpcy5jb21wdXRlZFsnJGRpc3BsYXlWYWx1ZXMnXT17fTtcbiAgICB9XG5cbiAgICBkaXNwbGF5VmFsdWUoZmllbGRQYXRoLCB2YWx1ZSl7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVkVmFsdWUobnVsbCwgJyRkaXNwbGF5VmFsdWVzLicrZmllbGRQYXRoLCB2YWx1ZSk7XG4gICAgfVxuXG4gICAgbG9hZENvbXB1dGVkVmFsdWVzKGNvbXB1dGVkKXtcbiAgICAgICAgdGhpcy5jb21wdXRlZCA9IFV0aWxzLmNsb25lRGVlcChjb21wdXRlZCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtVdGlsc30gZnJvbSAnc2QtdXRpbHMnXG5cbmV4cG9ydCBjbGFzcyBPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkcyB7XG5cbiAgICAkaWQgPSBVdGlscy5ndWlkKCk7IC8vaW50ZXJuYWwgaWRcbiAgICAkZmllbGRTdGF0dXM9e307XG5cbiAgICBnZXRGaWVsZFN0YXR1cyhmaWVsZFBhdGgpe1xuICAgICAgICBpZighVXRpbHMuZ2V0KHRoaXMuJGZpZWxkU3RhdHVzLCBmaWVsZFBhdGgsIG51bGwpKXtcbiAgICAgICAgICAgIFV0aWxzLnNldCh0aGlzLiRmaWVsZFN0YXR1cywgZmllbGRQYXRoLCB7XG4gICAgICAgICAgICAgICAgdmFsaWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgc3ludGF4OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBVdGlscy5nZXQodGhpcy4kZmllbGRTdGF0dXMsIGZpZWxkUGF0aCk7XG4gICAgfVxuXG4gICAgc2V0U3ludGF4VmFsaWRpdHkoZmllbGRQYXRoLCB2YWxpZCl7XG4gICAgICAgIHZhciBmaWVsZFN0YXR1cyA9IHRoaXMuZ2V0RmllbGRTdGF0dXMoZmllbGRQYXRoKTtcbiAgICAgICAgZmllbGRTdGF0dXMudmFsaWQuc3ludGF4ID0gdmFsaWQ7XG4gICAgfVxuXG4gICAgc2V0VmFsdWVWYWxpZGl0eShmaWVsZFBhdGgsIHZhbGlkKXtcbiAgICAgICAgdmFyIGZpZWxkU3RhdHVzID0gdGhpcy5nZXRGaWVsZFN0YXR1cyhmaWVsZFBhdGgpO1xuICAgICAgICBmaWVsZFN0YXR1cy52YWxpZC52YWx1ZSA9IHZhbGlkO1xuICAgIH1cblxuICAgIGlzRmllbGRWYWxpZChmaWVsZFBhdGgsIHN5bnRheD10cnVlLCB2YWx1ZT10cnVlKXtcbiAgICAgICAgdmFyIGZpZWxkU3RhdHVzID0gdGhpcy5nZXRGaWVsZFN0YXR1cyhmaWVsZFBhdGgpO1xuICAgICAgICBpZihzeW50YXggJiYgdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZFN0YXR1cy52YWxpZC5zeW50YXggJiYgZmllbGRTdGF0dXMudmFsaWQudmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYoc3ludGF4KSB7XG4gICAgICAgICAgICByZXR1cm4gZmllbGRTdGF0dXMudmFsaWQuc3ludGF4XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpZWxkU3RhdHVzLnZhbGlkLnZhbHVlO1xuICAgIH1cblxuXG59XG4iLCJleHBvcnQgY2xhc3MgUG9pbnQge1xuICAgIHg7XG4gICAgeTtcbiAgICBjb25zdHJ1Y3Rvcih4LHkpe1xuICAgICAgICBpZih4IGluc3RhbmNlb2YgUG9pbnQpe1xuICAgICAgICAgICAgeT14Lnk7XG4gICAgICAgICAgICB4PXgueFxuICAgICAgICB9ZWxzZSBpZihBcnJheS5pc0FycmF5KHgpKXtcbiAgICAgICAgICAgIHk9eFsxXTtcbiAgICAgICAgICAgIHg9eFswXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLng9eDtcbiAgICAgICAgdGhpcy55PXk7XG4gICAgfVxuXG4gICAgbW92ZVRvKHgseSl7XG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoeCkpe1xuICAgICAgICAgICAgeT14WzFdO1xuICAgICAgICAgICAgeD14WzBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMueD14O1xuICAgICAgICB0aGlzLnk9eTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbW92ZShkeCxkeSl7IC8vbW92ZSBieSB2ZWN0b3JcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShkeCkpe1xuICAgICAgICAgICAgZHk9ZHhbMV07XG4gICAgICAgICAgICBkeD1keFswXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLngrPWR4O1xuICAgICAgICB0aGlzLnkrPWR5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7UG9pbnR9IGZyb20gXCIuL3BvaW50XCI7XG5pbXBvcnQge1V0aWxzfSBmcm9tIFwic2QtdXRpbHNcIjtcbmltcG9ydCB7T2JqZWN0V2l0aElkQW5kRWRpdGFibGVGaWVsZHN9IGZyb20gXCIuL29iamVjdC13aXRoLWlkLWFuZC1lZGl0YWJsZS1maWVsZHNcIjtcblxuZXhwb3J0IGNsYXNzIFRleHQgZXh0ZW5kcyBPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkc3tcblxuICAgIHZhbHVlPScnO1xuICAgIGxvY2F0aW9uOyAvL1BvaW50XG5cbiAgICBjb25zdHJ1Y3Rvcihsb2NhdGlvbiwgdmFsdWUpe1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmxvY2F0aW9uPWxvY2F0aW9uO1xuICAgICAgICBpZighbG9jYXRpb24pe1xuICAgICAgICAgICAgdGhpcy5sb2NhdGlvbiA9IG5ldyBQb2ludCgwLDApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG1vdmVUbyh4LHkpeyAvL21vdmUgdG8gbmV3IGxvY2F0aW9uXG4gICAgICAgIHRoaXMubG9jYXRpb24ubW92ZVRvKHgseSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIG1vdmUoZHgsIGR5KXsgLy9tb3ZlIGJ5IHZlY3RvclxuICAgICAgICB0aGlzLmxvY2F0aW9uLm1vdmUoZHgsIGR5KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgZG9tYWluIGZyb20gJy4vZG9tYWluJ1xuZXhwb3J0IHtkb21haW59XG5leHBvcnQgKiBmcm9tICcuL2RhdGEtbW9kZWwnXG5leHBvcnQgKiBmcm9tICcuL3ZhbGlkYXRpb24tcmVzdWx0J1xuIiwiaW1wb3J0IHtVdGlsc30gZnJvbSBcInNkLXV0aWxzXCI7XG5cbmV4cG9ydCBjbGFzcyBWYWxpZGF0aW9uUmVzdWx0e1xuXG5cbiAgICBlcnJvcnMgPSB7fTtcbiAgICB3YXJuaW5ncyA9IHt9O1xuICAgIG9iamVjdElkVG9FcnJvcj17fTtcblxuICAgIGFkZEVycm9yKGVycm9yLCBvYmope1xuICAgICAgICBpZihVdGlscy5pc1N0cmluZyhlcnJvcikpe1xuICAgICAgICAgICAgZXJyb3IgPSB7bmFtZTogZXJyb3J9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBuYW1lID0gZXJyb3IubmFtZTtcbiAgICAgICAgdmFyIGVycm9yc0J5TmFtZSA9IHRoaXMuZXJyb3JzW25hbWVdO1xuICAgICAgICBpZighZXJyb3JzQnlOYW1lKXtcbiAgICAgICAgICAgIGVycm9yc0J5TmFtZT1bXTtcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzW25hbWVdPWVycm9yc0J5TmFtZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb2JqRSA9IHRoaXMub2JqZWN0SWRUb0Vycm9yW29iai4kaWRdO1xuICAgICAgICBpZighb2JqRSl7XG4gICAgICAgICAgICBvYmpFPVtdO1xuICAgICAgICAgICAgdGhpcy5vYmplY3RJZFRvRXJyb3Jbb2JqLiRpZF09IG9iakU7XG4gICAgICAgIH1cbiAgICAgICAgZXJyb3JzQnlOYW1lLnB1c2gob2JqKTtcbiAgICAgICAgb2JqRS5wdXNoKGVycm9yKTtcbiAgICB9XG5cbiAgICBhZGRXYXJuaW5nKG5hbWUsIG9iail7XG4gICAgICAgIHZhciBlID0gdGhpcy53YXJuaW5nc1tuYW1lXTtcbiAgICAgICAgaWYoIWUpe1xuICAgICAgICAgICAgZT1bXTtcbiAgICAgICAgICAgIHRoaXMud2FybmluZ3NbbmFtZV09ZTtcbiAgICAgICAgfVxuICAgICAgICBlLnB1c2gob2JqKVxuICAgIH1cblxuICAgIGlzVmFsaWQoKXtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRoaXMuZXJyb3JzKS5sZW5ndGggPT09IDBcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlRnJvbURUTyhkdG8pe1xuICAgICAgICB2YXIgdiA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XG4gICAgICAgIHYuZXJyb3JzID0gZHRvLmVycm9ycztcbiAgICAgICAgdi53YXJuaW5ncyA9IGR0by53YXJuaW5ncztcbiAgICAgICAgdi5vYmplY3RJZFRvRXJyb3IgPSBkdG8ub2JqZWN0SWRUb0Vycm9yO1xuICAgICAgICByZXR1cm4gdjtcbiAgICB9XG59XG4iLCJleHBvcnQgKiBmcm9tICcuL3NyYy9pbmRleCdcbiJdfQ==
