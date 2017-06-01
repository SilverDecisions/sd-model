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
                var edge = new domain.Edge(clone, childClone, e.name, _sdUtils.Utils.cloneDeep(e.payoff), e.probability);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGRhdGEtbW9kZWwuanMiLCJzcmNcXGRvbWFpblxcZWRnZS5qcyIsInNyY1xcZG9tYWluXFxpbmRleC5qcyIsInNyY1xcZG9tYWluXFxub2RlXFxjaGFuY2Utbm9kZS5qcyIsInNyY1xcZG9tYWluXFxub2RlXFxkZWNpc2lvbi1ub2RlLmpzIiwic3JjXFxkb21haW5cXG5vZGVcXG5vZGUuanMiLCJzcmNcXGRvbWFpblxcbm9kZVxcdGVybWluYWwtbm9kZS5qcyIsInNyY1xcZG9tYWluXFxvYmplY3Qtd2l0aC1jb21wdXRlZC12YWx1ZXMuanMiLCJzcmNcXGRvbWFpblxcb2JqZWN0LXdpdGgtaWQtYW5kLWVkaXRhYmxlLWZpZWxkcy5qcyIsInNyY1xcZG9tYWluXFxwb2ludC5qcyIsInNyY1xcZG9tYWluXFx0ZXh0LmpzIiwic3JjXFxpbmRleC5qcyIsInNyY1xcdmFsaWRhdGlvbi1yZXN1bHQuanMiLCJpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDQUE7O0FBQ0E7O0ksQUFBWTs7QUFDWjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7OztJLEFBR2Esb0IsQUFBQSx3QkFjVTtBQUZHO0FBcUJ0Qjt1QkFBQSxBQUFZLE1BQU07OEJBQUE7O2FBL0JsQixBQStCa0IsUUEvQlYsQUErQlU7YUE5QmxCLEFBOEJrQixRQTlCVixBQThCVTthQTVCbEIsQUE0QmtCLFFBNUJWLEFBNEJVO2FBM0JsQixBQTJCa0IsY0EzQkosQUEyQkk7YUExQmxCLEFBMEJrQiwwQkExQlEsQUEwQlI7YUF6QmxCLEFBeUJrQixtQkF6QkMsQUF5QkQ7YUF4QmxCLEFBd0JrQixtQkF4QkMsQUF3QkQ7YUFyQmxCLEFBcUJrQixrQkFyQkEsQUFxQkE7YUFwQmxCLEFBb0JrQixPQXBCWCxBQW9CVzthQW5CbEIsQUFtQmtCLGFBbkJMLEFBbUJL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QUEsQUFBSyxTQUFMLEFBQWMsUUFBZCxBQUFvQixBQUN2QjtBQUNEO2NBQUEsQUFBRSxLQUFGLEFBQU8sQUFDVjs7OztrQ0FFUSxBQUNMO21CQUFPLE9BQUEsQUFBTyxvQkFBb0IsS0FBM0IsQUFBZ0MsUUFBaEMsQUFBd0MsV0FBL0MsQUFBMEQsQUFDN0Q7Ozs7c0MsQUFFb0IsS0FBSSxBQUNyQjtnQkFBSSxJQUFJLElBQVIsQUFBUSxBQUFJLEFBQ1o7Y0FBQSxBQUFFLFNBQVMsSUFBWCxBQUFlLEFBQ2Y7Y0FBQSxBQUFFLFdBQVcsSUFBYixBQUFpQixBQUNqQjtjQUFBLEFBQUUsa0JBQWtCLElBQXBCLEFBQXdCLEFBQ3hCO21CQUFBLEFBQU8sQUFDVjs7Ozs7Ozs7Ozs7Ozs7OztBQy9DTCwyQ0FBQTtpREFBQTs7Z0JBQUE7d0JBQUE7b0JBQUE7QUFBQTtBQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB7VXRpbHMsIGxvZ30gZnJvbSBcInNkLXV0aWxzXCI7XG5pbXBvcnQgKiBhcyBkb21haW4gZnJvbSBcIi4vZG9tYWluXCI7XG5pbXBvcnQge1ZhbGlkYXRpb25SZXN1bHR9IGZyb20gXCIuL3ZhbGlkYXRpb24tcmVzdWx0XCI7XG5cbi8qXG4gKiBEYXRhIG1vZGVsIG1hbmFnZXJcbiAqICovXG5leHBvcnQgY2xhc3MgRGF0YU1vZGVsIHtcblxuICAgIG5vZGVzID0gW107XG4gICAgZWRnZXMgPSBbXTtcblxuICAgIHRleHRzID0gW107IC8vZmxvYXRpbmcgdGV4dHNcbiAgICBwYXlvZmZOYW1lcyA9IFtdO1xuICAgIGRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0ID0gMTtcbiAgICB3ZWlnaHRMb3dlckJvdW5kID0gMDtcbiAgICB3ZWlnaHRVcHBlckJvdW5kID0gSW5maW5pdHk7XG5cblxuICAgIGV4cHJlc3Npb25TY29wZSA9IHt9OyAvL2dsb2JhbCBleHByZXNzaW9uIHNjb3BlXG4gICAgY29kZSA9IFwiXCI7Ly9nbG9iYWwgZXhwcmVzc2lvbiBjb2RlXG4gICAgJGNvZGVFcnJvciA9IG51bGw7IC8vY29kZSBldmFsdWF0aW9uIGVycm9yc1xuICAgICRjb2RlRGlydHkgPSBmYWxzZTsgLy8gaXMgY29kZSBjaGFuZ2VkIHdpdGhvdXQgcmVldmFsdWF0aW9uP1xuICAgICR2ZXJzaW9uPTE7XG5cbiAgICB2YWxpZGF0aW9uUmVzdWx0cyA9IFtdO1xuXG4gICAgLy8gdW5kbyAvIHJlZG9cbiAgICBtYXhTdGFja1NpemUgPSAyMDtcbiAgICB1bmRvU3RhY2sgPSBbXTtcbiAgICByZWRvU3RhY2sgPSBbXTtcbiAgICB1bmRvUmVkb1N0YXRlQ2hhbmdlZENhbGxiYWNrID0gbnVsbDtcbiAgICBub2RlQWRkZWRDYWxsYmFjayA9IG51bGw7XG4gICAgbm9kZVJlbW92ZWRDYWxsYmFjayA9IG51bGw7XG5cbiAgICB0ZXh0QWRkZWRDYWxsYmFjayA9IG51bGw7XG4gICAgdGV4dFJlbW92ZWRDYWxsYmFjayA9IG51bGw7XG5cbiAgICBjYWxsYmFja3NEaXNhYmxlZCA9IGZhbHNlO1xuXG4gICAgY29uc3RydWN0b3IoZGF0YSkge1xuICAgICAgICBpZihkYXRhKXtcbiAgICAgICAgICAgIHRoaXMubG9hZChkYXRhKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldEpzb25SZXBsYWNlcihmaWx0ZXJMb2NhdGlvbj1mYWxzZSwgZmlsdGVyQ29tcHV0ZWQ9ZmFsc2UsIHJlcGxhY2VyLCBmaWx0ZXJQcml2YXRlID10cnVlKXtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChrLCB2KSB7XG5cbiAgICAgICAgICAgIGlmICgoZmlsdGVyUHJpdmF0ZSAmJiBVdGlscy5zdGFydHNXaXRoKGssICckJykpIHx8IGsgPT0gJ3BhcmVudE5vZGUnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmaWx0ZXJMb2NhdGlvbiAmJiBrID09ICdsb2NhdGlvbicpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZpbHRlckNvbXB1dGVkICYmIGsgPT0gJ2NvbXB1dGVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZXBsYWNlcil7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcGxhY2VyKGssIHYpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNlcmlhbGl6ZShzdHJpbmdpZnk9dHJ1ZSwgZmlsdGVyTG9jYXRpb249ZmFsc2UsIGZpbHRlckNvbXB1dGVkPWZhbHNlLCByZXBsYWNlciwgZmlsdGVyUHJpdmF0ZSA9dHJ1ZSl7XG4gICAgICAgIHZhciBkYXRhID0gIHtcbiAgICAgICAgICAgIGNvZGU6IHRoaXMuY29kZSxcbiAgICAgICAgICAgIGV4cHJlc3Npb25TY29wZTogdGhpcy5leHByZXNzaW9uU2NvcGUsXG4gICAgICAgICAgICB0cmVlczogdGhpcy5nZXRSb290cygpLFxuICAgICAgICAgICAgdGV4dHM6IHRoaXMudGV4dHMsXG4gICAgICAgICAgICBwYXlvZmZOYW1lczogdGhpcy5wYXlvZmZOYW1lcy5zbGljZSgpLFxuICAgICAgICAgICAgZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQ6IHRoaXMuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQsXG4gICAgICAgICAgICB3ZWlnaHRMb3dlckJvdW5kOiB0aGlzLndlaWdodExvd2VyQm91bmQsXG4gICAgICAgICAgICB3ZWlnaHRVcHBlckJvdW5kOiB0aGlzLndlaWdodFVwcGVyQm91bmRcbiAgICAgICAgfTtcblxuICAgICAgICBpZighc3RyaW5naWZ5KXtcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFV0aWxzLnN0cmluZ2lmeShkYXRhLCB0aGlzLmdldEpzb25SZXBsYWNlcihmaWx0ZXJMb2NhdGlvbiwgZmlsdGVyQ29tcHV0ZWQsIHJlcGxhY2VyLCBmaWx0ZXJQcml2YXRlKSwgW10pO1xuICAgIH1cblxuXG4gICAgLypMb2FkcyBzZXJpYWxpemVkIGRhdGEqL1xuICAgIGxvYWQoZGF0YSkge1xuICAgICAgICAvL3Jvb3RzLCB0ZXh0cywgY29kZSwgZXhwcmVzc2lvblNjb3BlXG4gICAgICAgIHZhciBjYWxsYmFja3NEaXNhYmxlZCA9IHRoaXMuY2FsbGJhY2tzRGlzYWJsZWQ7XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMuY2xlYXIoKTtcblxuXG4gICAgICAgIGRhdGEudHJlZXMuZm9yRWFjaChub2RlRGF0YT0+IHtcbiAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5jcmVhdGVOb2RlRnJvbURhdGEobm9kZURhdGEpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoZGF0YS50ZXh0cykge1xuICAgICAgICAgICAgZGF0YS50ZXh0cy5mb3JFYWNoKHRleHREYXRhPT4ge1xuICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IG5ldyBkb21haW4uUG9pbnQodGV4dERhdGEubG9jYXRpb24ueCwgdGV4dERhdGEubG9jYXRpb24ueSk7XG4gICAgICAgICAgICAgICAgdmFyIHRleHQgPSBuZXcgZG9tYWluLlRleHQobG9jYXRpb24sIHRleHREYXRhLnZhbHVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLnRleHRzLnB1c2godGV4dCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jbGVhckV4cHJlc3Npb25TY29wZSgpO1xuICAgICAgICB0aGlzLmNvZGUgPSBkYXRhLmNvZGUgfHwgJyc7XG5cbiAgICAgICAgaWYgKGRhdGEuZXhwcmVzc2lvblNjb3BlKSB7XG4gICAgICAgICAgICBVdGlscy5leHRlbmQodGhpcy5leHByZXNzaW9uU2NvcGUsIGRhdGEuZXhwcmVzc2lvblNjb3BlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLnBheW9mZk5hbWVzICE9PSB1bmRlZmluZWQgJiYgZGF0YS5wYXlvZmZOYW1lcyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5wYXlvZmZOYW1lcyA9IGRhdGEucGF5b2ZmTmFtZXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCAhPT0gdW5kZWZpbmVkICYmIGRhdGEuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQgPSBkYXRhLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEud2VpZ2h0TG93ZXJCb3VuZCAhPT0gdW5kZWZpbmVkICYmIGRhdGEud2VpZ2h0TG93ZXJCb3VuZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy53ZWlnaHRMb3dlckJvdW5kID0gZGF0YS53ZWlnaHRMb3dlckJvdW5kO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEud2VpZ2h0VXBwZXJCb3VuZCAhPT0gdW5kZWZpbmVkICYmIGRhdGEud2VpZ2h0VXBwZXJCb3VuZCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy53ZWlnaHRVcHBlckJvdW5kID0gZGF0YS53ZWlnaHRVcHBlckJvdW5kO1xuICAgICAgICB9XG5cblxuICAgICAgICB0aGlzLmNhbGxiYWNrc0Rpc2FibGVkID0gY2FsbGJhY2tzRGlzYWJsZWQ7XG4gICAgfVxuXG4gICAgZ2V0RFRPKGZpbHRlckxvY2F0aW9uPWZhbHNlLCBmaWx0ZXJDb21wdXRlZD1mYWxzZSwgZmlsdGVyUHJpdmF0ZSA9ZmFsc2Upe1xuICAgICAgICB2YXIgZHRvID0ge1xuICAgICAgICAgICAgc2VyaWFsaXplZERhdGE6IHRoaXMuc2VyaWFsaXplKHRydWUsIGZpbHRlckxvY2F0aW9uLCBmaWx0ZXJDb21wdXRlZCwgbnVsbCwgZmlsdGVyUHJpdmF0ZSksXG4gICAgICAgICAgICAkY29kZUVycm9yOiB0aGlzLiRjb2RlRXJyb3IsXG4gICAgICAgICAgICAkY29kZURpcnR5OiB0aGlzLiRjb2RlRGlydHksXG4gICAgICAgICAgICB2YWxpZGF0aW9uUmVzdWx0czogdGhpcy52YWxpZGF0aW9uUmVzdWx0cy5zbGljZSgpXG5cbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIGR0b1xuICAgIH1cblxuICAgIGxvYWRGcm9tRFRPKGR0bywgZGF0YVJldml2ZXIpe1xuICAgICAgICB0aGlzLmxvYWQoSlNPTi5wYXJzZShkdG8uc2VyaWFsaXplZERhdGEsIGRhdGFSZXZpdmVyKSk7XG4gICAgICAgIHRoaXMuJGNvZGVFcnJvciA9IGR0by4kY29kZUVycm9yO1xuICAgICAgICB0aGlzLiRjb2RlRGlydHkgPSBkdG8uJGNvZGVEaXJ0eTtcbiAgICAgICAgdGhpcy52YWxpZGF0aW9uUmVzdWx0cy5sZW5ndGg9MDtcbiAgICAgICAgZHRvLnZhbGlkYXRpb25SZXN1bHRzLmZvckVhY2godj0+e1xuICAgICAgICAgICAgdGhpcy52YWxpZGF0aW9uUmVzdWx0cy5wdXNoKFZhbGlkYXRpb25SZXN1bHQuY3JlYXRlRnJvbURUTyh2KSlcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICAvKlRoaXMgbWV0aG9kIHVwZGF0ZXMgb25seSBjb21wdXRhdGlvbiByZXN1bHRzL3ZhbGlkYXRpb24qL1xuICAgIHVwZGF0ZUZyb20oZGF0YU1vZGVsKXtcbiAgICAgICAgaWYodGhpcy4kdmVyc2lvbj5kYXRhTW9kZWwuJHZlcnNpb24pe1xuICAgICAgICAgICAgbG9nLndhcm4oXCJEYXRhTW9kZWwudXBkYXRlRnJvbTogdmVyc2lvbiBvZiBjdXJyZW50IG1vZGVsIGdyZWF0ZXIgdGhhbiB1cGRhdGVcIilcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYnlJZCA9IHt9XG4gICAgICAgIGRhdGFNb2RlbC5ub2Rlcy5mb3JFYWNoKG49PntcbiAgICAgICAgICAgIGJ5SWRbbi4kaWRdID0gbjtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubm9kZXMuZm9yRWFjaCgobixpKT0+e1xuICAgICAgICAgICAgaWYoYnlJZFtuLiRpZF0pe1xuICAgICAgICAgICAgICAgIG4ubG9hZENvbXB1dGVkVmFsdWVzKGJ5SWRbbi4kaWRdLmNvbXB1dGVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGRhdGFNb2RlbC5lZGdlcy5mb3JFYWNoKGU9PntcbiAgICAgICAgICAgIGJ5SWRbZS4kaWRdID0gZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZWRnZXMuZm9yRWFjaCgoZSxpKT0+e1xuICAgICAgICAgICAgaWYoYnlJZFtlLiRpZF0pe1xuICAgICAgICAgICAgICAgIGUubG9hZENvbXB1dGVkVmFsdWVzKGJ5SWRbZS4kaWRdLmNvbXB1dGVkKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZXhwcmVzc2lvblNjb3BlID0gZGF0YU1vZGVsLmV4cHJlc3Npb25TY29wZTtcbiAgICAgICAgdGhpcy4kY29kZUVycm9yID0gZGF0YU1vZGVsLiRjb2RlRXJyb3I7XG4gICAgICAgIHRoaXMuJGNvZGVEaXJ0eSA9IGRhdGFNb2RlbC4kY29kZURpcnR5O1xuICAgICAgICB0aGlzLnZhbGlkYXRpb25SZXN1bHRzICA9IGRhdGFNb2RlbC52YWxpZGF0aW9uUmVzdWx0cztcbiAgICB9XG5cbiAgICBnZXRHbG9iYWxWYXJpYWJsZU5hbWVzKGZpbHRlckZ1bmN0aW9uID0gdHJ1ZSl7XG4gICAgICAgIHZhciByZXMgPSBbXTtcbiAgICAgICAgVXRpbHMuZm9yT3duKHRoaXMuZXhwcmVzc2lvblNjb3BlLCAodmFsdWUsIGtleSk9PntcbiAgICAgICAgICAgIGlmKGZpbHRlckZ1bmN0aW9uICYmIFV0aWxzLmlzRnVuY3Rpb24odmFsdWUpKXtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXMucHVzaChrZXkpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHJlcztcbiAgICB9XG5cbiAgICAvKmNyZWF0ZSBub2RlIGZyb20gc2VyaWFsaXplZCBkYXRhKi9cbiAgICBjcmVhdGVOb2RlRnJvbURhdGEoZGF0YSwgcGFyZW50KSB7XG4gICAgICAgIHZhciBub2RlLCBsb2NhdGlvbjtcblxuICAgICAgICBpZihkYXRhLmxvY2F0aW9uKXtcbiAgICAgICAgICAgIGxvY2F0aW9uID0gbmV3IGRvbWFpbi5Qb2ludChkYXRhLmxvY2F0aW9uLngsIGRhdGEubG9jYXRpb24ueSk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgbG9jYXRpb24gPSBuZXcgZG9tYWluLlBvaW50KDAsMCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZG9tYWluLkRlY2lzaW9uTm9kZS4kVFlQRSA9PSBkYXRhLnR5cGUpIHtcbiAgICAgICAgICAgIG5vZGUgPSBuZXcgZG9tYWluLkRlY2lzaW9uTm9kZShsb2NhdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoZG9tYWluLkNoYW5jZU5vZGUuJFRZUEUgPT0gZGF0YS50eXBlKSB7XG4gICAgICAgICAgICBub2RlID0gbmV3IGRvbWFpbi5DaGFuY2VOb2RlKGxvY2F0aW9uKTtcbiAgICAgICAgfSBlbHNlIGlmIChkb21haW4uVGVybWluYWxOb2RlLiRUWVBFID09IGRhdGEudHlwZSkge1xuICAgICAgICAgICAgbm9kZSA9IG5ldyBkb21haW4uVGVybWluYWxOb2RlKGxvY2F0aW9uKTtcbiAgICAgICAgfVxuICAgICAgICBpZihkYXRhLiRpZCl7XG4gICAgICAgICAgICBub2RlLiRpZCA9IGRhdGEuJGlkO1xuICAgICAgICB9XG4gICAgICAgIGlmKGRhdGEuJGZpZWxkU3RhdHVzKXtcbiAgICAgICAgICAgIG5vZGUuJGZpZWxkU3RhdHVzID0gZGF0YS4kZmllbGRTdGF0dXM7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZS5uYW1lID0gZGF0YS5uYW1lO1xuXG4gICAgICAgIGlmKGRhdGEuY29kZSl7XG4gICAgICAgICAgICBub2RlLmNvZGUgPSBkYXRhLmNvZGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRhdGEuZXhwcmVzc2lvblNjb3BlKSB7XG4gICAgICAgICAgICBub2RlLmV4cHJlc3Npb25TY29wZSA9IGRhdGEuZXhwcmVzc2lvblNjb3BlXG4gICAgICAgIH1cbiAgICAgICAgaWYoZGF0YS5jb21wdXRlZCl7XG4gICAgICAgICAgICBub2RlLmxvYWRDb21wdXRlZFZhbHVlcyhkYXRhLmNvbXB1dGVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBlZGdlT3JOb2RlID0gdGhpcy5hZGROb2RlKG5vZGUsIHBhcmVudCk7XG4gICAgICAgIGRhdGEuY2hpbGRFZGdlcy5mb3JFYWNoKGVkPT4ge1xuICAgICAgICAgICAgdmFyIGVkZ2UgPSB0aGlzLmNyZWF0ZU5vZGVGcm9tRGF0YShlZC5jaGlsZE5vZGUsIG5vZGUpO1xuICAgICAgICAgICAgaWYoVXRpbHMuaXNBcnJheShlZC5wYXlvZmYpKXtcbiAgICAgICAgICAgICAgICBlZGdlLnBheW9mZiA9IGVkLnBheW9mZjtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIGVkZ2UucGF5b2ZmID0gW2VkLnBheW9mZiwgMF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVkZ2UucHJvYmFiaWxpdHkgPSBlZC5wcm9iYWJpbGl0eTtcbiAgICAgICAgICAgIGVkZ2UubmFtZSA9IGVkLm5hbWU7XG4gICAgICAgICAgICBpZihlZC5jb21wdXRlZCl7XG4gICAgICAgICAgICAgICAgZWRnZS5sb2FkQ29tcHV0ZWRWYWx1ZXMoZWQuY29tcHV0ZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZWQuJGlkKXtcbiAgICAgICAgICAgICAgICBlZGdlLiRpZCA9IGVkLiRpZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGVkLiRmaWVsZFN0YXR1cyl7XG4gICAgICAgICAgICAgICAgZWRnZS4kZmllbGRTdGF0dXMgPSBlZC4kZmllbGRTdGF0dXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBlZGdlT3JOb2RlO1xuICAgIH1cblxuICAgIC8qcmV0dXJucyBub2RlIG9yIGVkZ2UgZnJvbSBwYXJlbnQgdG8gdGhpcyBub2RlKi9cbiAgICBhZGROb2RlKG5vZGUsIHBhcmVudCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYubm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgdmFyIGVkZ2UgPSBzZWxmLl9hZGRDaGlsZChwYXJlbnQsIG5vZGUpO1xuICAgICAgICAgICAgdGhpcy5fZmlyZU5vZGVBZGRlZENhbGxiYWNrKG5vZGUpO1xuICAgICAgICAgICAgcmV0dXJuIGVkZ2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9maXJlTm9kZUFkZGVkQ2FsbGJhY2sobm9kZSk7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIC8qaW5qZWN0cyBnaXZlbiBub2RlIGludG8gZ2l2ZW4gZWRnZSovXG4gICAgaW5qZWN0Tm9kZShub2RlLCBlZGdlKSB7XG4gICAgICAgIHZhciBwYXJlbnQgPSBlZGdlLnBhcmVudE5vZGU7XG4gICAgICAgIHZhciBjaGlsZCA9IGVkZ2UuY2hpbGROb2RlO1xuICAgICAgICB0aGlzLm5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgIG5vZGUuJHBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgZWRnZS5jaGlsZE5vZGUgPSBub2RlO1xuICAgICAgICB0aGlzLl9hZGRDaGlsZChub2RlLCBjaGlsZCk7XG4gICAgICAgIHRoaXMuX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhub2RlKTtcbiAgICB9XG5cbiAgICBfYWRkQ2hpbGQocGFyZW50LCBjaGlsZCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBlZGdlID0gbmV3IGRvbWFpbi5FZGdlKHBhcmVudCwgY2hpbGQpO1xuICAgICAgICBzZWxmLl9zZXRFZGdlSW5pdGlhbFByb2JhYmlsaXR5KGVkZ2UpO1xuICAgICAgICBzZWxmLmVkZ2VzLnB1c2goZWRnZSk7XG5cbiAgICAgICAgcGFyZW50LmNoaWxkRWRnZXMucHVzaChlZGdlKTtcbiAgICAgICAgY2hpbGQuJHBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgcmV0dXJuIGVkZ2U7XG4gICAgfVxuXG4gICAgX3NldEVkZ2VJbml0aWFsUHJvYmFiaWxpdHkoZWRnZSkge1xuICAgICAgICBpZiAoZWRnZS5wYXJlbnROb2RlIGluc3RhbmNlb2YgZG9tYWluLkNoYW5jZU5vZGUpIHtcbiAgICAgICAgICAgIGVkZ2UucHJvYmFiaWxpdHkgPSAnIyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlZGdlLnByb2JhYmlsaXR5ID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICAvKnJlbW92ZXMgZ2l2ZW4gbm9kZSBhbmQgaXRzIHN1YnRyZWUqL1xuICAgIHJlbW92ZU5vZGUobm9kZSwgJGwgPSAwKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBub2RlLmNoaWxkRWRnZXMuZm9yRWFjaChlPT5zZWxmLnJlbW92ZU5vZGUoZS5jaGlsZE5vZGUsICRsICsgMSkpO1xuXG4gICAgICAgIHNlbGYuX3JlbW92ZU5vZGUobm9kZSk7XG4gICAgICAgIHZhciBwYXJlbnQgPSBub2RlLiRwYXJlbnQ7XG4gICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnRFZGdlID0gVXRpbHMuZmluZChwYXJlbnQuY2hpbGRFZGdlcywgKGUsIGkpPT4gZS5jaGlsZE5vZGUgPT09IG5vZGUpO1xuICAgICAgICAgICAgaWYgKCRsID09IDApIHtcbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUVkZ2UocGFyZW50RWRnZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuX3JlbW92ZUVkZ2UocGFyZW50RWRnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZmlyZU5vZGVSZW1vdmVkQ2FsbGJhY2sobm9kZSk7XG4gICAgfVxuXG4gICAgLypyZW1vdmVzIGdpdmVuIG5vZGVzIGFuZCB0aGVpciBzdWJ0cmVlcyovXG4gICAgcmVtb3ZlTm9kZXMobm9kZXMpIHtcblxuICAgICAgICB2YXIgcm9vdHMgPSB0aGlzLmZpbmRTdWJ0cmVlUm9vdHMobm9kZXMpO1xuICAgICAgICByb290cy5mb3JFYWNoKG49PnRoaXMucmVtb3ZlTm9kZShuLCAwKSwgdGhpcyk7XG4gICAgfVxuXG4gICAgY29udmVydE5vZGUobm9kZSwgdHlwZVRvQ29udmVydFRvKXtcbiAgICAgICAgdmFyIG5ld05vZGU7XG4gICAgICAgIGlmKCFub2RlLmNoaWxkRWRnZXMubGVuZ3RoICYmIG5vZGUuJHBhcmVudCl7XG4gICAgICAgICAgICBuZXdOb2RlID0gdGhpcy5jcmVhdGVOb2RlQnlUeXBlKHR5cGVUb0NvbnZlcnRUbywgbm9kZS5sb2NhdGlvbik7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgaWYobm9kZSBpbnN0YW5jZW9mIGRvbWFpbi5EZWNpc2lvbk5vZGUgJiYgdHlwZVRvQ29udmVydFRvPT1kb21haW4uQ2hhbmNlTm9kZS4kVFlQRSl7XG4gICAgICAgICAgICAgICAgbmV3Tm9kZSA9IHRoaXMuY3JlYXRlTm9kZUJ5VHlwZSh0eXBlVG9Db252ZXJ0VG8sIG5vZGUubG9jYXRpb24pO1xuICAgICAgICAgICAgfWVsc2UgaWYodHlwZVRvQ29udmVydFRvPT1kb21haW4uRGVjaXNpb25Ob2RlLiRUWVBFKXtcbiAgICAgICAgICAgICAgICBuZXdOb2RlID0gdGhpcy5jcmVhdGVOb2RlQnlUeXBlKHR5cGVUb0NvbnZlcnRUbywgbm9kZS5sb2NhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZihuZXdOb2RlKXtcbiAgICAgICAgICAgIG5ld05vZGUubmFtZT1ub2RlLm5hbWU7XG4gICAgICAgICAgICB0aGlzLnJlcGxhY2VOb2RlKG5ld05vZGUsIG5vZGUpO1xuICAgICAgICAgICAgbmV3Tm9kZS5jaGlsZEVkZ2VzLmZvckVhY2goZT0+dGhpcy5fc2V0RWRnZUluaXRpYWxQcm9iYWJpbGl0eShlKSk7XG4gICAgICAgICAgICB0aGlzLl9maXJlTm9kZUFkZGVkQ2FsbGJhY2sobmV3Tm9kZSk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGNyZWF0ZU5vZGVCeVR5cGUodHlwZSwgbG9jYXRpb24pe1xuICAgICAgICBpZih0eXBlPT1kb21haW4uRGVjaXNpb25Ob2RlLiRUWVBFKXtcbiAgICAgICAgICAgIHJldHVybiBuZXcgZG9tYWluLkRlY2lzaW9uTm9kZShsb2NhdGlvbilcbiAgICAgICAgfWVsc2UgaWYodHlwZT09ZG9tYWluLkNoYW5jZU5vZGUuJFRZUEUpe1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBkb21haW4uQ2hhbmNlTm9kZShsb2NhdGlvbilcbiAgICAgICAgfWVsc2UgaWYodHlwZT09ZG9tYWluLlRlcm1pbmFsTm9kZS4kVFlQRSl7XG4gICAgICAgICAgICByZXR1cm4gbmV3IGRvbWFpbi5UZXJtaW5hbE5vZGUobG9jYXRpb24pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXBsYWNlTm9kZShuZXdOb2RlLCBvbGROb2RlKXtcbiAgICAgICAgdmFyIHBhcmVudCA9IG9sZE5vZGUuJHBhcmVudDtcbiAgICAgICAgbmV3Tm9kZS4kcGFyZW50ID0gcGFyZW50O1xuXG4gICAgICAgIGlmKHBhcmVudCl7XG4gICAgICAgICAgICB2YXIgcGFyZW50RWRnZSA9IFV0aWxzLmZpbmQobmV3Tm9kZS4kcGFyZW50LmNoaWxkRWRnZXMsIGU9PmUuY2hpbGROb2RlPT09b2xkTm9kZSk7XG4gICAgICAgICAgICBwYXJlbnRFZGdlLmNoaWxkTm9kZSA9IG5ld05vZGU7XG4gICAgICAgIH1cblxuICAgICAgICBuZXdOb2RlLmNoaWxkRWRnZXMgPSBvbGROb2RlLmNoaWxkRWRnZXM7XG4gICAgICAgIG5ld05vZGUuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PmUucGFyZW50Tm9kZT1uZXdOb2RlKTtcblxuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLm5vZGVzLmluZGV4T2Yob2xkTm9kZSk7XG4gICAgICAgIGlmKH5pbmRleCl7XG4gICAgICAgICAgICB0aGlzLm5vZGVzW2luZGV4XT1uZXdOb2RlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0Um9vdHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vZGVzLmZpbHRlcihuPT4hbi4kcGFyZW50KTtcbiAgICB9XG5cbiAgICBmaW5kU3VidHJlZVJvb3RzKG5vZGVzKSB7XG4gICAgICAgIHJldHVybiBub2Rlcy5maWx0ZXIobj0+IW4uJHBhcmVudCB8fCBub2Rlcy5pbmRleE9mKG4uJHBhcmVudCkgPT09IC0xKTtcbiAgICB9XG5cbiAgICAvKmNyZWF0ZXMgZGV0YWNoZWQgY2xvbmUgb2YgZ2l2ZW4gbm9kZSovXG4gICAgY2xvbmVTdWJ0cmVlKG5vZGVUb0NvcHksIGNsb25lQ29tcHV0ZWRWYWx1ZXMpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgY2xvbmUgPSB0aGlzLmNsb25lTm9kZShub2RlVG9Db3B5KTtcblxuICAgICAgICBub2RlVG9Db3B5LmNoaWxkRWRnZXMuZm9yRWFjaChlPT4ge1xuICAgICAgICAgICAgdmFyIGNoaWxkQ2xvbmUgPSBzZWxmLmNsb25lU3VidHJlZShlLmNoaWxkTm9kZSwgY2xvbmVDb21wdXRlZFZhbHVlcyk7XG4gICAgICAgICAgICBjaGlsZENsb25lLiRwYXJlbnQgPSBjbG9uZTtcbiAgICAgICAgICAgIHZhciBlZGdlID0gbmV3IGRvbWFpbi5FZGdlKGNsb25lLCBjaGlsZENsb25lLCBlLm5hbWUsIFV0aWxzLmNsb25lRGVlcChlLnBheW9mZiksIGUucHJvYmFiaWxpdHkpO1xuICAgICAgICAgICAgaWYgKGNsb25lQ29tcHV0ZWRWYWx1ZXMpIHtcbiAgICAgICAgICAgICAgICBlZGdlLmNvbXB1dGVkID0gVXRpbHMuY2xvbmVEZWVwKGUuY29tcHV0ZWQpO1xuICAgICAgICAgICAgICAgIGNoaWxkQ2xvbmUuY29tcHV0ZWQgPSBVdGlscy5jbG9uZURlZXAoZS5jaGlsZE5vZGUuY29tcHV0ZWQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjbG9uZS5jaGlsZEVkZ2VzLnB1c2goZWRnZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoY2xvbmVDb21wdXRlZFZhbHVlcykge1xuICAgICAgICAgICAgY2xvbmUuY29tcHV0ZWQgPSBVdGlscy5jbG9uZURlZXAobm9kZVRvQ29weS5jb21wdXRlZClcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2xvbmU7XG4gICAgfVxuXG4gICAgLyphdHRhY2hlcyBkZXRhY2hlZCBzdWJ0cmVlIHRvIGdpdmVuIHBhcmVudCovXG4gICAgYXR0YWNoU3VidHJlZShub2RlVG9BdHRhY2gsIHBhcmVudCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBub2RlT3JFZGdlID0gc2VsZi5hZGROb2RlKG5vZGVUb0F0dGFjaCwgcGFyZW50KTtcblxuICAgICAgICBub2RlVG9BdHRhY2guZXhwcmVzc2lvblNjb3BlID0gbnVsbDtcblxuICAgICAgICB2YXIgY2hpbGRFZGdlcyA9IHNlbGYuZ2V0QWxsRGVzY2VuZGFudEVkZ2VzKG5vZGVUb0F0dGFjaCk7XG4gICAgICAgIGNoaWxkRWRnZXMuZm9yRWFjaChlPT4ge1xuICAgICAgICAgICAgc2VsZi5lZGdlcy5wdXNoKGUpO1xuICAgICAgICAgICAgc2VsZi5ub2Rlcy5wdXNoKGUuY2hpbGROb2RlKTtcbiAgICAgICAgICAgIGUuY2hpbGROb2RlLmV4cHJlc3Npb25TY29wZSA9IG51bGw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBub2RlT3JFZGdlO1xuICAgIH1cblxuICAgIGNsb25lTm9kZXMobm9kZXMpIHtcbiAgICAgICAgdmFyIHJvb3RzID0gW11cbiAgICAgICAgLy9UT0RPXG4gICAgfVxuXG4gICAgLypzaGFsbG93IGNsb25lIHdpdGhvdXQgcGFyZW50IGFuZCBjaGlsZHJlbiovXG4gICAgY2xvbmVOb2RlKG5vZGUpIHtcbiAgICAgICAgdmFyIGNsb25lID0gVXRpbHMuY2xvbmUobm9kZSlcbiAgICAgICAgY2xvbmUuJGlkID0gVXRpbHMuZ3VpZCgpO1xuICAgICAgICBjbG9uZS5sb2NhdGlvbiA9IFV0aWxzLmNsb25lKG5vZGUubG9jYXRpb24pO1xuICAgICAgICBjbG9uZS5jb21wdXRlZCA9IFV0aWxzLmNsb25lKG5vZGUuY29tcHV0ZWQpO1xuICAgICAgICBjbG9uZS4kcGFyZW50ID0gbnVsbDtcbiAgICAgICAgY2xvbmUuY2hpbGRFZGdlcyA9IFtdO1xuICAgICAgICByZXR1cm4gY2xvbmU7XG4gICAgfVxuXG4gICAgZmluZE5vZGVCeUlkKGlkKSB7XG4gICAgICAgIHJldHVybiBVdGlscy5maW5kKHRoaXMubm9kZXMsIG49Pm4uJGlkID09IGlkKTtcbiAgICB9XG5cbiAgICBmaW5kRWRnZUJ5SWQoaWQpIHtcbiAgICAgICAgcmV0dXJuIFV0aWxzLmZpbmQodGhpcy5lZGdlcywgZT0+ZS4kaWQgPT0gaWQpO1xuICAgIH1cblxuICAgIGZpbmRCeUlkKGlkKSB7XG4gICAgICAgIHZhciBub2RlID0gdGhpcy5maW5kTm9kZUJ5SWQoaWQpO1xuICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZEVkZ2VCeUlkKGlkKTtcbiAgICB9XG5cbiAgICBfcmVtb3ZlTm9kZShub2RlKSB7Ly8gc2ltcGx5IHJlbW92ZXMgbm9kZSBmcm9tIG5vZGUgbGlzdFxuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLm5vZGVzLmluZGV4T2Yobm9kZSk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICB0aGlzLm5vZGVzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZW1vdmVFZGdlKGVkZ2UpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gZWRnZS5wYXJlbnROb2RlLmNoaWxkRWRnZXMuaW5kZXhPZihlZGdlKTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIGVkZ2UucGFyZW50Tm9kZS5jaGlsZEVkZ2VzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fcmVtb3ZlRWRnZShlZGdlKTtcbiAgICB9XG5cbiAgICBfcmVtb3ZlRWRnZShlZGdlKSB7IC8vcmVtb3ZlcyBlZGdlIGZyb20gZWRnZSBsaXN0IHdpdGhvdXQgcmVtb3ZpbmcgY29ubmVjdGVkIG5vZGVzXG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMuZWRnZXMuaW5kZXhPZihlZGdlKTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHRoaXMuZWRnZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9yZW1vdmVOb2Rlcyhub2Rlc1RvUmVtb3ZlKSB7XG4gICAgICAgIHRoaXMubm9kZXMgPSB0aGlzLm5vZGVzLmZpbHRlcihuPT5ub2Rlc1RvUmVtb3ZlLmluZGV4T2YobikgPT09IC0xKTtcbiAgICB9XG5cbiAgICBfcmVtb3ZlRWRnZXMoZWRnZXNUb1JlbW92ZSkge1xuICAgICAgICB0aGlzLmVkZ2VzID0gdGhpcy5lZGdlcy5maWx0ZXIoZT0+ZWRnZXNUb1JlbW92ZS5pbmRleE9mKGUpID09PSAtMSk7XG4gICAgfVxuXG4gICAgZ2V0QWxsRGVzY2VuZGFudEVkZ2VzKG5vZGUpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG5cbiAgICAgICAgbm9kZS5jaGlsZEVkZ2VzLmZvckVhY2goZT0+IHtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKGUpO1xuICAgICAgICAgICAgaWYgKGUuY2hpbGROb2RlKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goLi4uc2VsZi5nZXRBbGxEZXNjZW5kYW50RWRnZXMoZS5jaGlsZE5vZGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBnZXRBbGxEZXNjZW5kYW50Tm9kZXMobm9kZSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgICAgICBub2RlLmNoaWxkRWRnZXMuZm9yRWFjaChlPT4ge1xuICAgICAgICAgICAgaWYgKGUuY2hpbGROb2RlKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goZS5jaGlsZE5vZGUpO1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKC4uLnNlbGYuZ2V0QWxsRGVzY2VuZGFudE5vZGVzKGUuY2hpbGROb2RlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZ2V0QWxsTm9kZXNJblN1YnRyZWUobm9kZSkge1xuICAgICAgICB2YXIgZGVzY2VuZGFudHMgPSB0aGlzLmdldEFsbERlc2NlbmRhbnROb2Rlcyhub2RlKTtcbiAgICAgICAgZGVzY2VuZGFudHMudW5zaGlmdChub2RlKTtcbiAgICAgICAgcmV0dXJuIGRlc2NlbmRhbnRzO1xuICAgIH1cblxuICAgIGlzVW5kb0F2YWlsYWJsZSgpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy51bmRvU3RhY2subGVuZ3RoXG4gICAgfVxuXG4gICAgaXNSZWRvQXZhaWxhYmxlKCkge1xuICAgICAgICByZXR1cm4gISF0aGlzLnJlZG9TdGFjay5sZW5ndGhcbiAgICB9XG5cbiAgICBjcmVhdGVTdGF0ZVNuYXBzaG90KHJldmVydENvbmYpe1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgcmV2ZXJ0Q29uZjogcmV2ZXJ0Q29uZixcbiAgICAgICAgICAgIG5vZGVzOiBVdGlscy5jbG9uZURlZXAodGhpcy5ub2RlcyksXG4gICAgICAgICAgICBlZGdlczogVXRpbHMuY2xvbmVEZWVwKHRoaXMuZWRnZXMpLFxuICAgICAgICAgICAgdGV4dHM6IFV0aWxzLmNsb25lRGVlcCh0aGlzLnRleHRzKSxcbiAgICAgICAgICAgIHBheW9mZk5hbWVzOiBVdGlscy5jbG9uZURlZXAodGhpcy5wYXlvZmZOYW1lcyksXG4gICAgICAgICAgICBkZWZhdWx0Q3JpdGVyaW9uMVdlaWdodDogVXRpbHMuY2xvbmVEZWVwKHRoaXMuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQpLFxuICAgICAgICAgICAgd2VpZ2h0TG93ZXJCb3VuZDogVXRpbHMuY2xvbmVEZWVwKHRoaXMud2VpZ2h0TG93ZXJCb3VuZCksXG4gICAgICAgICAgICB3ZWlnaHRVcHBlckJvdW5kOiBVdGlscy5jbG9uZURlZXAodGhpcy53ZWlnaHRVcHBlckJvdW5kKSxcbiAgICAgICAgICAgIGV4cHJlc3Npb25TY29wZTogVXRpbHMuY2xvbmVEZWVwKHRoaXMuZXhwcmVzc2lvblNjb3BlKSxcbiAgICAgICAgICAgIGNvZGU6IHRoaXMuY29kZSxcbiAgICAgICAgICAgICRjb2RlRXJyb3I6IHRoaXMuJGNvZGVFcnJvclxuICAgICAgICB9XG4gICAgfVxuXG5cbiAgICBzYXZlU3RhdGVGcm9tU25hcHNob3Qoc3RhdGUpe1xuICAgICAgICB0aGlzLnJlZG9TdGFjay5sZW5ndGggPSAwO1xuXG4gICAgICAgIHRoaXMuX3B1c2hUb1N0YWNrKHRoaXMudW5kb1N0YWNrLCBzdGF0ZSk7XG5cbiAgICAgICAgdGhpcy5fZmlyZVVuZG9SZWRvQ2FsbGJhY2soKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzYXZlU3RhdGUocmV2ZXJ0Q29uZikge1xuICAgICAgICB0aGlzLnNhdmVTdGF0ZUZyb21TbmFwc2hvdCh0aGlzLmNyZWF0ZVN0YXRlU25hcHNob3QocmV2ZXJ0Q29uZikpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICB1bmRvKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBuZXdTdGF0ZSA9IHRoaXMudW5kb1N0YWNrLnBvcCgpO1xuICAgICAgICBpZiAoIW5ld1N0YXRlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9wdXNoVG9TdGFjayh0aGlzLnJlZG9TdGFjaywge1xuICAgICAgICAgICAgcmV2ZXJ0Q29uZjogbmV3U3RhdGUucmV2ZXJ0Q29uZixcbiAgICAgICAgICAgIG5vZGVzOiBzZWxmLm5vZGVzLFxuICAgICAgICAgICAgZWRnZXM6IHNlbGYuZWRnZXMsXG4gICAgICAgICAgICB0ZXh0czogc2VsZi50ZXh0cyxcbiAgICAgICAgICAgIHBheW9mZk5hbWVzOiBzZWxmLnBheW9mZk5hbWVzLFxuICAgICAgICAgICAgZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQ6IHNlbGYuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQsXG4gICAgICAgICAgICB3ZWlnaHRMb3dlckJvdW5kOiBzZWxmLndlaWdodExvd2VyQm91bmQsXG4gICAgICAgICAgICB3ZWlnaHRVcHBlckJvdW5kOiBzZWxmLndlaWdodFVwcGVyQm91bmQsXG4gICAgICAgICAgICBleHByZXNzaW9uU2NvcGU6IHNlbGYuZXhwcmVzc2lvblNjb3BlLFxuICAgICAgICAgICAgY29kZTogc2VsZi5jb2RlLFxuICAgICAgICAgICAgJGNvZGVFcnJvcjogc2VsZi4kY29kZUVycm9yXG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5fc2V0TmV3U3RhdGUobmV3U3RhdGUpO1xuXG4gICAgICAgIHRoaXMuX2ZpcmVVbmRvUmVkb0NhbGxiYWNrKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcmVkbygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgbmV3U3RhdGUgPSB0aGlzLnJlZG9TdGFjay5wb3AoKTtcbiAgICAgICAgaWYgKCFuZXdTdGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcHVzaFRvU3RhY2sodGhpcy51bmRvU3RhY2ssIHtcbiAgICAgICAgICAgIHJldmVydENvbmY6IG5ld1N0YXRlLnJldmVydENvbmYsXG4gICAgICAgICAgICBub2Rlczogc2VsZi5ub2RlcyxcbiAgICAgICAgICAgIGVkZ2VzOiBzZWxmLmVkZ2VzLFxuICAgICAgICAgICAgdGV4dHM6IHNlbGYudGV4dHMsXG4gICAgICAgICAgICBwYXlvZmZOYW1lczogc2VsZi5wYXlvZmZOYW1lcyxcbiAgICAgICAgICAgIGRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0OiBzZWxmLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0LFxuICAgICAgICAgICAgd2VpZ2h0TG93ZXJCb3VuZDogc2VsZi53ZWlnaHRMb3dlckJvdW5kLFxuICAgICAgICAgICAgd2VpZ2h0VXBwZXJCb3VuZDogc2VsZi53ZWlnaHRVcHBlckJvdW5kLFxuICAgICAgICAgICAgZXhwcmVzc2lvblNjb3BlOiBzZWxmLmV4cHJlc3Npb25TY29wZSxcbiAgICAgICAgICAgIGNvZGU6IHNlbGYuY29kZSxcbiAgICAgICAgICAgICRjb2RlRXJyb3I6IHNlbGYuJGNvZGVFcnJvclxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl9zZXROZXdTdGF0ZShuZXdTdGF0ZSwgdHJ1ZSk7XG5cbiAgICAgICAgdGhpcy5fZmlyZVVuZG9SZWRvQ2FsbGJhY2soKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5ub2Rlcy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLmVkZ2VzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMudW5kb1N0YWNrLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMucmVkb1N0YWNrLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMudGV4dHMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5jbGVhckV4cHJlc3Npb25TY29wZSgpO1xuICAgICAgICB0aGlzLmNvZGUgPSAnJztcbiAgICAgICAgdGhpcy4kY29kZUVycm9yID0gbnVsbDtcbiAgICAgICAgdGhpcy4kY29kZURpcnR5ID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5wYXlvZmZOYW1lcyA9IFtdO1xuICAgICAgICB0aGlzLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0ID0gMTtcbiAgICAgICAgdGhpcy53ZWlnaHRMb3dlckJvdW5kID0gMDtcbiAgICAgICAgdGhpcy53ZWlnaHRVcHBlckJvdW5kID0gSW5maW5pdHk7XG4gICAgfVxuXG4gICAgYWRkVGV4dCh0ZXh0KSB7XG4gICAgICAgIHRoaXMudGV4dHMucHVzaCh0ZXh0KTtcblxuICAgICAgICB0aGlzLl9maXJlVGV4dEFkZGVkQ2FsbGJhY2sodGV4dCk7XG4gICAgfVxuXG4gICAgcmVtb3ZlVGV4dHModGV4dHMpIHtcbiAgICAgICAgdGV4dHMuZm9yRWFjaCh0PT50aGlzLnJlbW92ZVRleHQodCkpO1xuICAgIH1cblxuICAgIHJlbW92ZVRleHQodGV4dCkge1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLnRleHRzLmluZGV4T2YodGV4dCk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICB0aGlzLnRleHRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB0aGlzLl9maXJlVGV4dFJlbW92ZWRDYWxsYmFjayh0ZXh0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsZWFyRXhwcmVzc2lvblNjb3BlKCkge1xuICAgICAgICBVdGlscy5mb3JPd24odGhpcy5leHByZXNzaW9uU2NvcGUsICh2YWx1ZSwga2V5KT0+IHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmV4cHJlc3Npb25TY29wZVtrZXldO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXZlcnNlUGF5b2Zmcygpe1xuICAgICAgICB0aGlzLnBheW9mZk5hbWVzLnJldmVyc2UoKTtcbiAgICAgICAgdGhpcy5lZGdlcy5mb3JFYWNoKGU9PmUucGF5b2ZmLnJldmVyc2UoKSlcbiAgICB9XG5cbiAgICBfc2V0TmV3U3RhdGUobmV3U3RhdGUsIHJlZG8pIHtcbiAgICAgICAgdmFyIG5vZGVCeUlkID0gVXRpbHMuZ2V0T2JqZWN0QnlJZE1hcChuZXdTdGF0ZS5ub2Rlcyk7XG4gICAgICAgIHZhciBlZGdlQnlJZCA9IFV0aWxzLmdldE9iamVjdEJ5SWRNYXAobmV3U3RhdGUuZWRnZXMpO1xuICAgICAgICB0aGlzLm5vZGVzID0gbmV3U3RhdGUubm9kZXM7XG4gICAgICAgIHRoaXMuZWRnZXMgPSBuZXdTdGF0ZS5lZGdlcztcbiAgICAgICAgdGhpcy50ZXh0cyA9IG5ld1N0YXRlLnRleHRzO1xuICAgICAgICB0aGlzLnBheW9mZk5hbWVzID0gbmV3U3RhdGUucGF5b2ZmTmFtZXM7XG4gICAgICAgIHRoaXMuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQgPSBuZXdTdGF0ZS5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodDtcbiAgICAgICAgdGhpcy53ZWlnaHRMb3dlckJvdW5kID0gbmV3U3RhdGUud2VpZ2h0TG93ZXJCb3VuZDtcbiAgICAgICAgdGhpcy53ZWlnaHRVcHBlckJvdW5kID0gbmV3U3RhdGUud2VpZ2h0VXBwZXJCb3VuZDtcbiAgICAgICAgdGhpcy5leHByZXNzaW9uU2NvcGUgPSBuZXdTdGF0ZS5leHByZXNzaW9uU2NvcGU7XG4gICAgICAgIHRoaXMuY29kZSA9IG5ld1N0YXRlLmNvZGU7XG4gICAgICAgIHRoaXMuJGNvZGVFcnJvciAgPSBuZXdTdGF0ZS4kY29kZUVycm9yXG5cbiAgICAgICAgdGhpcy5ub2Rlcy5mb3JFYWNoKG49PiB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG4uY2hpbGRFZGdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBlZGdlID0gZWRnZUJ5SWRbbi5jaGlsZEVkZ2VzW2ldLiRpZF07XG4gICAgICAgICAgICAgICAgbi5jaGlsZEVkZ2VzW2ldID0gZWRnZTtcbiAgICAgICAgICAgICAgICBlZGdlLnBhcmVudE5vZGUgPSBuO1xuICAgICAgICAgICAgICAgIGVkZ2UuY2hpbGROb2RlID0gbm9kZUJ5SWRbZWRnZS5jaGlsZE5vZGUuJGlkXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAobmV3U3RhdGUucmV2ZXJ0Q29uZikge1xuICAgICAgICAgICAgaWYgKCFyZWRvICYmIG5ld1N0YXRlLnJldmVydENvbmYub25VbmRvKSB7XG4gICAgICAgICAgICAgICAgbmV3U3RhdGUucmV2ZXJ0Q29uZi5vblVuZG8obmV3U3RhdGUucmV2ZXJ0Q29uZi5kYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZWRvICYmIG5ld1N0YXRlLnJldmVydENvbmYub25SZWRvKSB7XG4gICAgICAgICAgICAgICAgbmV3U3RhdGUucmV2ZXJ0Q29uZi5vblJlZG8obmV3U3RhdGUucmV2ZXJ0Q29uZi5kYXRhKTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZXZlcnRDb25mID0gbmV3U3RhdGUucmV2ZXJ0Q29uZjtcbiAgICB9XG5cblxuICAgIF9wdXNoVG9TdGFjayhzdGFjaywgb2JqKSB7XG4gICAgICAgIGlmIChzdGFjay5sZW5ndGggPj0gdGhpcy5tYXhTdGFja1NpemUpIHtcbiAgICAgICAgICAgIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgIH1cbiAgICAgICAgc3RhY2sucHVzaChvYmopO1xuICAgIH1cblxuICAgIF9maXJlVW5kb1JlZG9DYWxsYmFjaygpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc0Rpc2FibGVkICYmIHRoaXMudW5kb1JlZG9TdGF0ZUNoYW5nZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy51bmRvUmVkb1N0YXRlQ2hhbmdlZENhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfZmlyZU5vZGVBZGRlZENhbGxiYWNrKG5vZGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc0Rpc2FibGVkICYmIHRoaXMubm9kZUFkZGVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMubm9kZUFkZGVkQ2FsbGJhY2sobm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfZmlyZU5vZGVSZW1vdmVkQ2FsbGJhY2sobm9kZSkge1xuICAgICAgICBpZiAoIXRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgJiYgdGhpcy5ub2RlUmVtb3ZlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLm5vZGVSZW1vdmVkQ2FsbGJhY2sobm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfZmlyZVRleHRBZGRlZENhbGxiYWNrKHRleHQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc0Rpc2FibGVkICYmIHRoaXMudGV4dEFkZGVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMudGV4dEFkZGVkQ2FsbGJhY2sodGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfZmlyZVRleHRSZW1vdmVkQ2FsbGJhY2sodGV4dCkge1xuICAgICAgICBpZiAoIXRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgJiYgdGhpcy50ZXh0UmVtb3ZlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLnRleHRSZW1vdmVkQ2FsbGJhY2sodGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQge09iamVjdFdpdGhDb21wdXRlZFZhbHVlc30gZnJvbSBcIi4vb2JqZWN0LXdpdGgtY29tcHV0ZWQtdmFsdWVzXCI7XG5cbmV4cG9ydCBjbGFzcyBFZGdlIGV4dGVuZHMgT2JqZWN0V2l0aENvbXB1dGVkVmFsdWVzIHtcbiAgICBwYXJlbnROb2RlO1xuICAgIGNoaWxkTm9kZTtcblxuICAgIG5hbWUgPSAnJztcbiAgICBwcm9iYWJpbGl0eSA9IHVuZGVmaW5lZDtcbiAgICBwYXlvZmYgPSBbMCwgMF07XG5cbiAgICAkRElTUExBWV9WQUxVRV9OQU1FUyA9IFsncHJvYmFiaWxpdHknLCAncGF5b2ZmJywgJ29wdGltYWwnXTtcblxuICAgIGNvbnN0cnVjdG9yKHBhcmVudE5vZGUsIGNoaWxkTm9kZSwgbmFtZSwgcGF5b2ZmLCBwcm9iYWJpbGl0eSwpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5wYXJlbnROb2RlID0gcGFyZW50Tm9kZTtcbiAgICAgICAgdGhpcy5jaGlsZE5vZGUgPSBjaGlsZE5vZGU7XG5cbiAgICAgICAgaWYgKG5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJvYmFiaWxpdHkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5wcm9iYWJpbGl0eSA9IHByb2JhYmlsaXR5O1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXlvZmYgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5wYXlvZmYgPSBwYXlvZmZcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgc2V0TmFtZShuYW1lKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldFByb2JhYmlsaXR5KHByb2JhYmlsaXR5KSB7XG4gICAgICAgIHRoaXMucHJvYmFiaWxpdHkgPSBwcm9iYWJpbGl0eTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0UGF5b2ZmKHBheW9mZiwgaW5kZXggPSAwKSB7XG4gICAgICAgIHRoaXMucGF5b2ZmW2luZGV4XSA9IHBheW9mZjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY29tcHV0ZWRCYXNlUHJvYmFiaWxpdHkodmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVkVmFsdWUobnVsbCwgJ3Byb2JhYmlsaXR5JywgdmFsKTtcbiAgICB9XG5cbiAgICBjb21wdXRlZEJhc2VQYXlvZmYodmFsLCBpbmRleCA9IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcHV0ZWRWYWx1ZShudWxsLCAncGF5b2ZmWycgKyBpbmRleCArICddJywgdmFsKTtcbiAgICB9XG5cbiAgICBkaXNwbGF5UHJvYmFiaWxpdHkodmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRpc3BsYXlWYWx1ZSgncHJvYmFiaWxpdHknLCB2YWwpO1xuICAgIH1cblxuICAgIGRpc3BsYXlQYXlvZmYodmFsLCBpbmRleCA9IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlzcGxheVZhbHVlKCdwYXlvZmZbJyArIGluZGV4ICsgJ10nLCB2YWwpO1xuICAgIH1cbn1cbiIsImV4cG9ydCAqIGZyb20gJy4vbm9kZS9ub2RlJ1xuZXhwb3J0ICogZnJvbSAnLi9ub2RlL2RlY2lzaW9uLW5vZGUnXG5leHBvcnQgKiBmcm9tICcuL25vZGUvY2hhbmNlLW5vZGUnXG5leHBvcnQgKiBmcm9tICcuL25vZGUvdGVybWluYWwtbm9kZSdcbmV4cG9ydCAqIGZyb20gJy4vZWRnZSdcbmV4cG9ydCAqIGZyb20gJy4vcG9pbnQnXG5leHBvcnQgKiBmcm9tICcuL3RleHQnXG4iLCJpbXBvcnQge05vZGV9IGZyb20gJy4vbm9kZSdcblxuZXhwb3J0IGNsYXNzIENoYW5jZU5vZGUgZXh0ZW5kcyBOb2Rle1xuXG4gICAgc3RhdGljICRUWVBFID0gJ2NoYW5jZSc7XG5cbiAgICBjb25zdHJ1Y3Rvcihsb2NhdGlvbil7XG4gICAgICAgIHN1cGVyKENoYW5jZU5vZGUuJFRZUEUsIGxvY2F0aW9uKTtcbiAgICB9XG59XG4iLCJpbXBvcnQge05vZGV9IGZyb20gJy4vbm9kZSdcblxuZXhwb3J0IGNsYXNzIERlY2lzaW9uTm9kZSBleHRlbmRzIE5vZGV7XG5cbiAgICBzdGF0aWMgJFRZUEUgPSAnZGVjaXNpb24nO1xuXG4gICAgY29uc3RydWN0b3IobG9jYXRpb24pe1xuICAgICAgICBzdXBlcihEZWNpc2lvbk5vZGUuJFRZUEUsIGxvY2F0aW9uKTtcbiAgICB9XG59XG4iLCJpbXBvcnQge1BvaW50fSBmcm9tICcuLi9wb2ludCdcbmltcG9ydCB7T2JqZWN0V2l0aENvbXB1dGVkVmFsdWVzfSBmcm9tICcuLi9vYmplY3Qtd2l0aC1jb21wdXRlZC12YWx1ZXMnXG5cbmV4cG9ydCBjbGFzcyBOb2RlIGV4dGVuZHMgT2JqZWN0V2l0aENvbXB1dGVkVmFsdWVze1xuXG4gICAgdHlwZTtcbiAgICBjaGlsZEVkZ2VzPVtdO1xuICAgIG5hbWU9Jyc7XG5cbiAgICBsb2NhdGlvbjsgLy9Qb2ludFxuXG4gICAgY29kZT0nJztcbiAgICAkY29kZURpcnR5ID0gZmFsc2U7IC8vIGlzIGNvZGUgY2hhbmdlZCB3aXRob3V0IHJlZXZhbHVhdGlvbj9cbiAgICAkY29kZUVycm9yID0gbnVsbDsgLy9jb2RlIGV2YWx1YXRpb24gZXJyb3JzXG5cbiAgICBleHByZXNzaW9uU2NvcGU9bnVsbDtcblxuICAgICRESVNQTEFZX1ZBTFVFX05BTUVTID0gWydjaGlsZHJlblBheW9mZicsICdhZ2dyZWdhdGVkUGF5b2ZmJywgJ3Byb2JhYmlsaXR5VG9FbnRlcicsICdvcHRpbWFsJ11cblxuICAgIGNvbnN0cnVjdG9yKHR5cGUsIGxvY2F0aW9uKXtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5sb2NhdGlvbj1sb2NhdGlvbjtcbiAgICAgICAgaWYoIWxvY2F0aW9uKXtcbiAgICAgICAgICAgIHRoaXMubG9jYXRpb24gPSBuZXcgUG9pbnQoMCwwKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnR5cGU9dHlwZTtcbiAgICB9XG5cbiAgICBzZXROYW1lKG5hbWUpe1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBtb3ZlVG8oeCx5LCB3aXRoQ2hpbGRyZW4peyAvL21vdmUgdG8gbmV3IGxvY2F0aW9uXG4gICAgICAgIGlmKHdpdGhDaGlsZHJlbil7XG4gICAgICAgICAgICB2YXIgZHggPSB4LXRoaXMubG9jYXRpb24ueDtcbiAgICAgICAgICAgIHZhciBkeSA9IHktdGhpcy5sb2NhdGlvbi55O1xuICAgICAgICAgICAgdGhpcy5jaGlsZEVkZ2VzLmZvckVhY2goZT0+ZS5jaGlsZE5vZGUubW92ZShkeCwgZHksIHRydWUpKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5sb2NhdGlvbi5tb3ZlVG8oeCx5KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbW92ZShkeCwgZHksIHdpdGhDaGlsZHJlbil7IC8vbW92ZSBieSB2ZWN0b3JcbiAgICAgICAgaWYod2l0aENoaWxkcmVuKXtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PmUuY2hpbGROb2RlLm1vdmUoZHgsIGR5LCB0cnVlKSlcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxvY2F0aW9uLm1vdmUoZHgsIGR5KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtOb2RlfSBmcm9tICcuL25vZGUnXG5cbmV4cG9ydCBjbGFzcyBUZXJtaW5hbE5vZGUgZXh0ZW5kcyBOb2Rle1xuXG4gICAgc3RhdGljICRUWVBFID0gJ3Rlcm1pbmFsJztcblxuICAgIGNvbnN0cnVjdG9yKGxvY2F0aW9uKXtcbiAgICAgICAgc3VwZXIoVGVybWluYWxOb2RlLiRUWVBFLCBsb2NhdGlvbik7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtVdGlsc30gZnJvbSAnc2QtdXRpbHMnXG5cbmltcG9ydCB7T2JqZWN0V2l0aElkQW5kRWRpdGFibGVGaWVsZHN9IGZyb20gXCIuL29iamVjdC13aXRoLWlkLWFuZC1lZGl0YWJsZS1maWVsZHNcIjtcblxuZXhwb3J0IGNsYXNzIE9iamVjdFdpdGhDb21wdXRlZFZhbHVlcyBleHRlbmRzIE9iamVjdFdpdGhJZEFuZEVkaXRhYmxlRmllbGRze1xuXG4gICAgY29tcHV0ZWQ9e307IC8vY29tcHV0ZWQgdmFsdWVzXG5cbiAgICAvKmdldCBvciBzZXQgY29tcHV0ZWQgdmFsdWUqL1xuICAgIGNvbXB1dGVkVmFsdWUocnVsZU5hbWUsIGZpZWxkUGF0aCwgdmFsdWUpe1xuICAgICAgICB2YXIgcGF0aCA9ICdjb21wdXRlZC4nO1xuICAgICAgICBpZihydWxlTmFtZSl7XG4gICAgICAgICAgICBwYXRoKz1ydWxlTmFtZSsnLic7XG4gICAgICAgIH1cbiAgICAgICAgcGF0aCs9ZmllbGRQYXRoO1xuICAgICAgICBpZih2YWx1ZT09PXVuZGVmaW5lZCl7XG4gICAgICAgICAgICByZXR1cm4gIFV0aWxzLmdldCh0aGlzLCBwYXRoLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBVdGlscy5zZXQodGhpcywgcGF0aCwgdmFsdWUpO1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgY2xlYXJDb21wdXRlZFZhbHVlcyhydWxlTmFtZSl7XG4gICAgICAgIGlmKHJ1bGVOYW1lPT11bmRlZmluZWQpe1xuICAgICAgICAgICAgdGhpcy5jb21wdXRlZD17fTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZihVdGlscy5pc0FycmF5KHJ1bGVOYW1lKSl7XG4gICAgICAgICAgICBydWxlTmFtZS5mb3JFYWNoKG49PntcbiAgICAgICAgICAgICAgICB0aGlzLmNvbXB1dGVkW25dPXt9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb21wdXRlZFtydWxlTmFtZV09e307XG4gICAgfVxuXG4gICAgY2xlYXJEaXNwbGF5VmFsdWVzKCl7XG4gICAgICAgIHRoaXMuY29tcHV0ZWRbJyRkaXNwbGF5VmFsdWVzJ109e307XG4gICAgfVxuXG4gICAgZGlzcGxheVZhbHVlKGZpZWxkUGF0aCwgdmFsdWUpe1xuICAgICAgICByZXR1cm4gdGhpcy5jb21wdXRlZFZhbHVlKG51bGwsICckZGlzcGxheVZhbHVlcy4nK2ZpZWxkUGF0aCwgdmFsdWUpO1xuICAgIH1cblxuICAgIGxvYWRDb21wdXRlZFZhbHVlcyhjb21wdXRlZCl7XG4gICAgICAgIHRoaXMuY29tcHV0ZWQgPSBVdGlscy5jbG9uZURlZXAoY29tcHV0ZWQpO1xuICAgIH1cbn1cbiIsImltcG9ydCB7VXRpbHN9IGZyb20gJ3NkLXV0aWxzJ1xuXG5leHBvcnQgY2xhc3MgT2JqZWN0V2l0aElkQW5kRWRpdGFibGVGaWVsZHMge1xuXG4gICAgJGlkID0gVXRpbHMuZ3VpZCgpOyAvL2ludGVybmFsIGlkXG4gICAgJGZpZWxkU3RhdHVzPXt9O1xuXG4gICAgZ2V0RmllbGRTdGF0dXMoZmllbGRQYXRoKXtcbiAgICAgICAgaWYoIVV0aWxzLmdldCh0aGlzLiRmaWVsZFN0YXR1cywgZmllbGRQYXRoLCBudWxsKSl7XG4gICAgICAgICAgICBVdGlscy5zZXQodGhpcy4kZmllbGRTdGF0dXMsIGZpZWxkUGF0aCwge1xuICAgICAgICAgICAgICAgIHZhbGlkOiB7XG4gICAgICAgICAgICAgICAgICAgIHN5bnRheDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gVXRpbHMuZ2V0KHRoaXMuJGZpZWxkU3RhdHVzLCBmaWVsZFBhdGgpO1xuICAgIH1cblxuICAgIHNldFN5bnRheFZhbGlkaXR5KGZpZWxkUGF0aCwgdmFsaWQpe1xuICAgICAgICB2YXIgZmllbGRTdGF0dXMgPSB0aGlzLmdldEZpZWxkU3RhdHVzKGZpZWxkUGF0aCk7XG4gICAgICAgIGZpZWxkU3RhdHVzLnZhbGlkLnN5bnRheCA9IHZhbGlkO1xuICAgIH1cblxuICAgIHNldFZhbHVlVmFsaWRpdHkoZmllbGRQYXRoLCB2YWxpZCl7XG4gICAgICAgIHZhciBmaWVsZFN0YXR1cyA9IHRoaXMuZ2V0RmllbGRTdGF0dXMoZmllbGRQYXRoKTtcbiAgICAgICAgZmllbGRTdGF0dXMudmFsaWQudmFsdWUgPSB2YWxpZDtcbiAgICB9XG5cbiAgICBpc0ZpZWxkVmFsaWQoZmllbGRQYXRoLCBzeW50YXg9dHJ1ZSwgdmFsdWU9dHJ1ZSl7XG4gICAgICAgIHZhciBmaWVsZFN0YXR1cyA9IHRoaXMuZ2V0RmllbGRTdGF0dXMoZmllbGRQYXRoKTtcbiAgICAgICAgaWYoc3ludGF4ICYmIHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmllbGRTdGF0dXMudmFsaWQuc3ludGF4ICYmIGZpZWxkU3RhdHVzLnZhbGlkLnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmKHN5bnRheCkge1xuICAgICAgICAgICAgcmV0dXJuIGZpZWxkU3RhdHVzLnZhbGlkLnN5bnRheFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaWVsZFN0YXR1cy52YWxpZC52YWx1ZTtcbiAgICB9XG5cblxufVxuIiwiZXhwb3J0IGNsYXNzIFBvaW50IHtcbiAgICB4O1xuICAgIHk7XG4gICAgY29uc3RydWN0b3IoeCx5KXtcbiAgICAgICAgaWYoeCBpbnN0YW5jZW9mIFBvaW50KXtcbiAgICAgICAgICAgIHk9eC55O1xuICAgICAgICAgICAgeD14LnhcbiAgICAgICAgfWVsc2UgaWYoQXJyYXkuaXNBcnJheSh4KSl7XG4gICAgICAgICAgICB5PXhbMV07XG4gICAgICAgICAgICB4PXhbMF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy54PXg7XG4gICAgICAgIHRoaXMueT15O1xuICAgIH1cblxuICAgIG1vdmVUbyh4LHkpe1xuICAgICAgICBpZihBcnJheS5pc0FycmF5KHgpKXtcbiAgICAgICAgICAgIHk9eFsxXTtcbiAgICAgICAgICAgIHg9eFswXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLng9eDtcbiAgICAgICAgdGhpcy55PXk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIG1vdmUoZHgsZHkpeyAvL21vdmUgYnkgdmVjdG9yXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZHgpKXtcbiAgICAgICAgICAgIGR5PWR4WzFdO1xuICAgICAgICAgICAgZHg9ZHhbMF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy54Kz1keDtcbiAgICAgICAgdGhpcy55Kz1keTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQge1BvaW50fSBmcm9tIFwiLi9wb2ludFwiO1xuaW1wb3J0IHtVdGlsc30gZnJvbSBcInNkLXV0aWxzXCI7XG5pbXBvcnQge09iamVjdFdpdGhJZEFuZEVkaXRhYmxlRmllbGRzfSBmcm9tIFwiLi9vYmplY3Qtd2l0aC1pZC1hbmQtZWRpdGFibGUtZmllbGRzXCI7XG5cbmV4cG9ydCBjbGFzcyBUZXh0IGV4dGVuZHMgT2JqZWN0V2l0aElkQW5kRWRpdGFibGVGaWVsZHN7XG5cbiAgICB2YWx1ZT0nJztcbiAgICBsb2NhdGlvbjsgLy9Qb2ludFxuXG4gICAgY29uc3RydWN0b3IobG9jYXRpb24sIHZhbHVlKXtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5sb2NhdGlvbj1sb2NhdGlvbjtcbiAgICAgICAgaWYoIWxvY2F0aW9uKXtcbiAgICAgICAgICAgIHRoaXMubG9jYXRpb24gPSBuZXcgUG9pbnQoMCwwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBtb3ZlVG8oeCx5KXsgLy9tb3ZlIHRvIG5ldyBsb2NhdGlvblxuICAgICAgICB0aGlzLmxvY2F0aW9uLm1vdmVUbyh4LHkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBtb3ZlKGR4LCBkeSl7IC8vbW92ZSBieSB2ZWN0b3JcbiAgICAgICAgdGhpcy5sb2NhdGlvbi5tb3ZlKGR4LCBkeSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIGRvbWFpbiBmcm9tICcuL2RvbWFpbidcbmV4cG9ydCB7ZG9tYWlufVxuZXhwb3J0ICogZnJvbSAnLi9kYXRhLW1vZGVsJ1xuZXhwb3J0ICogZnJvbSAnLi92YWxpZGF0aW9uLXJlc3VsdCdcbiIsImltcG9ydCB7VXRpbHN9IGZyb20gXCJzZC11dGlsc1wiO1xuXG5leHBvcnQgY2xhc3MgVmFsaWRhdGlvblJlc3VsdHtcblxuXG4gICAgZXJyb3JzID0ge307XG4gICAgd2FybmluZ3MgPSB7fTtcbiAgICBvYmplY3RJZFRvRXJyb3I9e307XG5cbiAgICBhZGRFcnJvcihlcnJvciwgb2JqKXtcbiAgICAgICAgaWYoVXRpbHMuaXNTdHJpbmcoZXJyb3IpKXtcbiAgICAgICAgICAgIGVycm9yID0ge25hbWU6IGVycm9yfTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmFtZSA9IGVycm9yLm5hbWU7XG4gICAgICAgIHZhciBlcnJvcnNCeU5hbWUgPSB0aGlzLmVycm9yc1tuYW1lXTtcbiAgICAgICAgaWYoIWVycm9yc0J5TmFtZSl7XG4gICAgICAgICAgICBlcnJvcnNCeU5hbWU9W107XG4gICAgICAgICAgICB0aGlzLmVycm9yc1tuYW1lXT1lcnJvcnNCeU5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9iakUgPSB0aGlzLm9iamVjdElkVG9FcnJvcltvYmouJGlkXTtcbiAgICAgICAgaWYoIW9iakUpe1xuICAgICAgICAgICAgb2JqRT1bXTtcbiAgICAgICAgICAgIHRoaXMub2JqZWN0SWRUb0Vycm9yW29iai4kaWRdPSBvYmpFO1xuICAgICAgICB9XG4gICAgICAgIGVycm9yc0J5TmFtZS5wdXNoKG9iaik7XG4gICAgICAgIG9iakUucHVzaChlcnJvcik7XG4gICAgfVxuXG4gICAgYWRkV2FybmluZyhuYW1lLCBvYmope1xuICAgICAgICB2YXIgZSA9IHRoaXMud2FybmluZ3NbbmFtZV07XG4gICAgICAgIGlmKCFlKXtcbiAgICAgICAgICAgIGU9W107XG4gICAgICAgICAgICB0aGlzLndhcm5pbmdzW25hbWVdPWU7XG4gICAgICAgIH1cbiAgICAgICAgZS5wdXNoKG9iailcbiAgICB9XG5cbiAgICBpc1ZhbGlkKCl7XG4gICAgICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0aGlzLmVycm9ycykubGVuZ3RoID09PSAwXG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZUZyb21EVE8oZHRvKXtcbiAgICAgICAgdmFyIHYgPSBuZXcgVmFsaWRhdGlvblJlc3VsdCgpO1xuICAgICAgICB2LmVycm9ycyA9IGR0by5lcnJvcnM7XG4gICAgICAgIHYud2FybmluZ3MgPSBkdG8ud2FybmluZ3M7XG4gICAgICAgIHYub2JqZWN0SWRUb0Vycm9yID0gZHRvLm9iamVjdElkVG9FcnJvcjtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgfVxufVxuIiwiZXhwb3J0ICogZnJvbSAnLi9zcmMvaW5kZXgnXG4iXX0=
