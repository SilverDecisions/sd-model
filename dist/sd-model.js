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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGRhdGEtbW9kZWwuanMiLCJzcmNcXGRvbWFpblxcZWRnZS5qcyIsInNyY1xcZG9tYWluXFxpbmRleC5qcyIsInNyY1xcZG9tYWluXFxub2RlXFxjaGFuY2Utbm9kZS5qcyIsInNyY1xcZG9tYWluXFxub2RlXFxkZWNpc2lvbi1ub2RlLmpzIiwic3JjXFxkb21haW5cXG5vZGVcXG5vZGUuanMiLCJzcmNcXGRvbWFpblxcbm9kZVxcdGVybWluYWwtbm9kZS5qcyIsInNyY1xcZG9tYWluXFxvYmplY3Qtd2l0aC1jb21wdXRlZC12YWx1ZXMuanMiLCJzcmNcXGRvbWFpblxcb2JqZWN0LXdpdGgtaWQtYW5kLWVkaXRhYmxlLWZpZWxkcy5qcyIsInNyY1xcZG9tYWluXFxwb2ludC5qcyIsInNyY1xcZG9tYWluXFx0ZXh0LmpzIiwic3JjXFxpbmRleC5qcyIsInNyY1xcdmFsaWRhdGlvbi1yZXN1bHQuanMiLCJpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDQUE7O0FBQ0E7O0ksQUFBWTs7QUFDWjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7OztJLEFBR2Esb0IsQUFBQSx3QkFjVTtBQUZHO0FBcUJ0Qjt1QkFBQSxBQUFZLE1BQU07OEJBQUE7O2FBL0JsQixBQStCa0IsUUEvQlYsQUErQlU7YUE5QmxCLEFBOEJrQixRQTlCVixBQThCVTthQTVCbEIsQUE0QmtCLFFBNUJWLEFBNEJVO2FBM0JsQixBQTJCa0IsY0EzQkosQUEyQkk7YUExQmxCLEFBMEJrQiwwQkExQlEsQUEwQlI7YUF6QmxCLEFBeUJrQixtQkF6QkMsQUF5QkQ7YUF4QmxCLEFBd0JrQixtQkF4QkMsQUF3QkQ7YUFyQmxCLEFBcUJrQixrQkFyQkEsQUFxQkE7YUFwQmxCLEFBb0JrQixPQXBCWCxBQW9CVzthQW5CbEIsQUFtQmtCLGFBbkJMLEFBbUJL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LEFBQW9CLEFBQ3ZCO0FBQ0Q7Y0FBQSxBQUFFLEtBQUYsQUFBTyxBQUNWOzs7O2tDQUVRLEFBQ0w7bUJBQU8sT0FBQSxBQUFPLG9CQUFvQixLQUEzQixBQUFnQyxRQUFoQyxBQUF3QyxXQUEvQyxBQUEwRCxBQUM3RDs7OztzQyxBQUVvQixLQUFJLEFBQ3JCO2dCQUFJLElBQUksSUFBUixBQUFRLEFBQUksQUFDWjtjQUFBLEFBQUUsU0FBUyxJQUFYLEFBQWUsQUFDZjtjQUFBLEFBQUUsV0FBVyxJQUFiLEFBQWlCLEFBQ2pCO2NBQUEsQUFBRSxrQkFBa0IsSUFBcEIsQUFBd0IsQUFDeEI7bUJBQUEsQUFBTyxBQUNWOzs7Ozs7Ozs7Ozs7Ozs7O0FDL0NMLDJDQUFBO2lEQUFBOztnQkFBQTt3QkFBQTtvQkFBQTtBQUFBO0FBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IHtVdGlscywgbG9nfSBmcm9tIFwic2QtdXRpbHNcIjtcbmltcG9ydCAqIGFzIGRvbWFpbiBmcm9tIFwiLi9kb21haW5cIjtcbmltcG9ydCB7VmFsaWRhdGlvblJlc3VsdH0gZnJvbSBcIi4vdmFsaWRhdGlvbi1yZXN1bHRcIjtcblxuLypcbiAqIERhdGEgbW9kZWwgbWFuYWdlclxuICogKi9cbmV4cG9ydCBjbGFzcyBEYXRhTW9kZWwge1xuXG4gICAgbm9kZXMgPSBbXTtcbiAgICBlZGdlcyA9IFtdO1xuXG4gICAgdGV4dHMgPSBbXTsgLy9mbG9hdGluZyB0ZXh0c1xuICAgIHBheW9mZk5hbWVzID0gW107XG4gICAgZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQgPSAxO1xuICAgIHdlaWdodExvd2VyQm91bmQgPSAwO1xuICAgIHdlaWdodFVwcGVyQm91bmQgPSBJbmZpbml0eTtcblxuXG4gICAgZXhwcmVzc2lvblNjb3BlID0ge307IC8vZ2xvYmFsIGV4cHJlc3Npb24gc2NvcGVcbiAgICBjb2RlID0gXCJcIjsvL2dsb2JhbCBleHByZXNzaW9uIGNvZGVcbiAgICAkY29kZUVycm9yID0gbnVsbDsgLy9jb2RlIGV2YWx1YXRpb24gZXJyb3JzXG4gICAgJGNvZGVEaXJ0eSA9IGZhbHNlOyAvLyBpcyBjb2RlIGNoYW5nZWQgd2l0aG91dCByZWV2YWx1YXRpb24/XG4gICAgJHZlcnNpb249MTtcblxuICAgIHZhbGlkYXRpb25SZXN1bHRzID0gW107XG5cbiAgICAvLyB1bmRvIC8gcmVkb1xuICAgIG1heFN0YWNrU2l6ZSA9IDIwO1xuICAgIHVuZG9TdGFjayA9IFtdO1xuICAgIHJlZG9TdGFjayA9IFtdO1xuICAgIHVuZG9SZWRvU3RhdGVDaGFuZ2VkQ2FsbGJhY2sgPSBudWxsO1xuICAgIG5vZGVBZGRlZENhbGxiYWNrID0gbnVsbDtcbiAgICBub2RlUmVtb3ZlZENhbGxiYWNrID0gbnVsbDtcblxuICAgIHRleHRBZGRlZENhbGxiYWNrID0gbnVsbDtcbiAgICB0ZXh0UmVtb3ZlZENhbGxiYWNrID0gbnVsbDtcblxuICAgIGNhbGxiYWNrc0Rpc2FibGVkID0gZmFsc2U7XG5cbiAgICBjb25zdHJ1Y3RvcihkYXRhKSB7XG4gICAgICAgIGlmKGRhdGEpe1xuICAgICAgICAgICAgdGhpcy5sb2FkKGRhdGEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0SnNvblJlcGxhY2VyKGZpbHRlckxvY2F0aW9uPWZhbHNlLCBmaWx0ZXJDb21wdXRlZD1mYWxzZSwgcmVwbGFjZXIsIGZpbHRlclByaXZhdGUgPXRydWUpe1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGssIHYpIHtcblxuICAgICAgICAgICAgaWYgKChmaWx0ZXJQcml2YXRlICYmIFV0aWxzLnN0YXJ0c1dpdGgoaywgJyQnKSkgfHwgayA9PSAncGFyZW50Tm9kZScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZpbHRlckxvY2F0aW9uICYmIGsgPT0gJ2xvY2F0aW9uJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmlsdGVyQ29tcHV0ZWQgJiYgayA9PSAnY29tcHV0ZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJlcGxhY2VyKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVwbGFjZXIoaywgdik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2VyaWFsaXplKHN0cmluZ2lmeT10cnVlLCBmaWx0ZXJMb2NhdGlvbj1mYWxzZSwgZmlsdGVyQ29tcHV0ZWQ9ZmFsc2UsIHJlcGxhY2VyLCBmaWx0ZXJQcml2YXRlID10cnVlKXtcbiAgICAgICAgdmFyIGRhdGEgPSAge1xuICAgICAgICAgICAgY29kZTogdGhpcy5jb2RlLFxuICAgICAgICAgICAgZXhwcmVzc2lvblNjb3BlOiB0aGlzLmV4cHJlc3Npb25TY29wZSxcbiAgICAgICAgICAgIHRyZWVzOiB0aGlzLmdldFJvb3RzKCksXG4gICAgICAgICAgICB0ZXh0czogdGhpcy50ZXh0cyxcbiAgICAgICAgICAgIHBheW9mZk5hbWVzOiB0aGlzLnBheW9mZk5hbWVzLnNsaWNlKCksXG4gICAgICAgICAgICBkZWZhdWx0Q3JpdGVyaW9uMVdlaWdodDogdGhpcy5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCxcbiAgICAgICAgICAgIHdlaWdodExvd2VyQm91bmQ6IHRoaXMud2VpZ2h0TG93ZXJCb3VuZCxcbiAgICAgICAgICAgIHdlaWdodFVwcGVyQm91bmQ6IHRoaXMud2VpZ2h0VXBwZXJCb3VuZFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmKCFzdHJpbmdpZnkpe1xuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gVXRpbHMuc3RyaW5naWZ5KGRhdGEsIHRoaXMuZ2V0SnNvblJlcGxhY2VyKGZpbHRlckxvY2F0aW9uLCBmaWx0ZXJDb21wdXRlZCwgcmVwbGFjZXIsIGZpbHRlclByaXZhdGUpLCBbXSk7XG4gICAgfVxuXG5cbiAgICAvKkxvYWRzIHNlcmlhbGl6ZWQgZGF0YSovXG4gICAgbG9hZChkYXRhKSB7XG4gICAgICAgIC8vcm9vdHMsIHRleHRzLCBjb2RlLCBleHByZXNzaW9uU2NvcGVcbiAgICAgICAgdmFyIGNhbGxiYWNrc0Rpc2FibGVkID0gdGhpcy5jYWxsYmFja3NEaXNhYmxlZDtcbiAgICAgICAgdGhpcy5jYWxsYmFja3NEaXNhYmxlZCA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5jbGVhcigpO1xuXG5cbiAgICAgICAgZGF0YS50cmVlcy5mb3JFYWNoKG5vZGVEYXRhPT4ge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmNyZWF0ZU5vZGVGcm9tRGF0YShub2RlRGF0YSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChkYXRhLnRleHRzKSB7XG4gICAgICAgICAgICBkYXRhLnRleHRzLmZvckVhY2godGV4dERhdGE9PiB7XG4gICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gbmV3IGRvbWFpbi5Qb2ludCh0ZXh0RGF0YS5sb2NhdGlvbi54LCB0ZXh0RGF0YS5sb2NhdGlvbi55KTtcbiAgICAgICAgICAgICAgICB2YXIgdGV4dCA9IG5ldyBkb21haW4uVGV4dChsb2NhdGlvbiwgdGV4dERhdGEudmFsdWUpO1xuICAgICAgICAgICAgICAgIHRoaXMudGV4dHMucHVzaCh0ZXh0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNsZWFyRXhwcmVzc2lvblNjb3BlKCk7XG4gICAgICAgIHRoaXMuY29kZSA9IGRhdGEuY29kZSB8fCAnJztcblxuICAgICAgICBpZiAoZGF0YS5leHByZXNzaW9uU2NvcGUpIHtcbiAgICAgICAgICAgIFV0aWxzLmV4dGVuZCh0aGlzLmV4cHJlc3Npb25TY29wZSwgZGF0YS5leHByZXNzaW9uU2NvcGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEucGF5b2ZmTmFtZXMgIT09IHVuZGVmaW5lZCAmJiBkYXRhLnBheW9mZk5hbWVzICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLnBheW9mZk5hbWVzID0gZGF0YS5wYXlvZmZOYW1lcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0ICE9PSB1bmRlZmluZWQgJiYgZGF0YS5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCA9IGRhdGEuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS53ZWlnaHRMb3dlckJvdW5kICE9PSB1bmRlZmluZWQgJiYgZGF0YS53ZWlnaHRMb3dlckJvdW5kICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLndlaWdodExvd2VyQm91bmQgPSBkYXRhLndlaWdodExvd2VyQm91bmQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS53ZWlnaHRVcHBlckJvdW5kICE9PSB1bmRlZmluZWQgJiYgZGF0YS53ZWlnaHRVcHBlckJvdW5kICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLndlaWdodFVwcGVyQm91bmQgPSBkYXRhLndlaWdodFVwcGVyQm91bmQ7XG4gICAgICAgIH1cblxuXG4gICAgICAgIHRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgPSBjYWxsYmFja3NEaXNhYmxlZDtcbiAgICB9XG5cbiAgICBnZXREVE8oZmlsdGVyTG9jYXRpb249ZmFsc2UsIGZpbHRlckNvbXB1dGVkPWZhbHNlLCBmaWx0ZXJQcml2YXRlID1mYWxzZSl7XG4gICAgICAgIHZhciBkdG8gPSB7XG4gICAgICAgICAgICBzZXJpYWxpemVkRGF0YTogdGhpcy5zZXJpYWxpemUodHJ1ZSwgZmlsdGVyTG9jYXRpb24sIGZpbHRlckNvbXB1dGVkLCBudWxsLCBmaWx0ZXJQcml2YXRlKSxcbiAgICAgICAgICAgICRjb2RlRXJyb3I6IHRoaXMuJGNvZGVFcnJvcixcbiAgICAgICAgICAgICRjb2RlRGlydHk6IHRoaXMuJGNvZGVEaXJ0eSxcbiAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHRzOiB0aGlzLnZhbGlkYXRpb25SZXN1bHRzLnNsaWNlKClcblxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZHRvXG4gICAgfVxuXG4gICAgbG9hZEZyb21EVE8oZHRvLCBkYXRhUmV2aXZlcil7XG4gICAgICAgIHRoaXMubG9hZChKU09OLnBhcnNlKGR0by5zZXJpYWxpemVkRGF0YSwgZGF0YVJldml2ZXIpKTtcbiAgICAgICAgdGhpcy4kY29kZUVycm9yID0gZHRvLiRjb2RlRXJyb3I7XG4gICAgICAgIHRoaXMuJGNvZGVEaXJ0eSA9IGR0by4kY29kZURpcnR5O1xuICAgICAgICB0aGlzLnZhbGlkYXRpb25SZXN1bHRzLmxlbmd0aD0wO1xuICAgICAgICBkdG8udmFsaWRhdGlvblJlc3VsdHMuZm9yRWFjaCh2PT57XG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRpb25SZXN1bHRzLnB1c2goVmFsaWRhdGlvblJlc3VsdC5jcmVhdGVGcm9tRFRPKHYpKVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8qVGhpcyBtZXRob2QgdXBkYXRlcyBvbmx5IGNvbXB1dGF0aW9uIHJlc3VsdHMvdmFsaWRhdGlvbiovXG4gICAgdXBkYXRlRnJvbShkYXRhTW9kZWwpe1xuICAgICAgICBpZih0aGlzLiR2ZXJzaW9uPmRhdGFNb2RlbC4kdmVyc2lvbil7XG4gICAgICAgICAgICBsb2cud2FybihcIkRhdGFNb2RlbC51cGRhdGVGcm9tOiB2ZXJzaW9uIG9mIGN1cnJlbnQgbW9kZWwgZ3JlYXRlciB0aGFuIHVwZGF0ZVwiKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBieUlkID0ge31cbiAgICAgICAgZGF0YU1vZGVsLm5vZGVzLmZvckVhY2gobj0+e1xuICAgICAgICAgICAgYnlJZFtuLiRpZF0gPSBuO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5ub2Rlcy5mb3JFYWNoKChuLGkpPT57XG4gICAgICAgICAgICBpZihieUlkW24uJGlkXSl7XG4gICAgICAgICAgICAgICAgbi5sb2FkQ29tcHV0ZWRWYWx1ZXMoYnlJZFtuLiRpZF0uY29tcHV0ZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZGF0YU1vZGVsLmVkZ2VzLmZvckVhY2goZT0+e1xuICAgICAgICAgICAgYnlJZFtlLiRpZF0gPSBlO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5lZGdlcy5mb3JFYWNoKChlLGkpPT57XG4gICAgICAgICAgICBpZihieUlkW2UuJGlkXSl7XG4gICAgICAgICAgICAgICAgZS5sb2FkQ29tcHV0ZWRWYWx1ZXMoYnlJZFtlLiRpZF0uY29tcHV0ZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5leHByZXNzaW9uU2NvcGUgPSBkYXRhTW9kZWwuZXhwcmVzc2lvblNjb3BlO1xuICAgICAgICB0aGlzLiRjb2RlRXJyb3IgPSBkYXRhTW9kZWwuJGNvZGVFcnJvcjtcbiAgICAgICAgdGhpcy4kY29kZURpcnR5ID0gZGF0YU1vZGVsLiRjb2RlRGlydHk7XG4gICAgICAgIHRoaXMudmFsaWRhdGlvblJlc3VsdHMgID0gZGF0YU1vZGVsLnZhbGlkYXRpb25SZXN1bHRzO1xuICAgIH1cblxuICAgIGdldEdsb2JhbFZhcmlhYmxlTmFtZXMoZmlsdGVyRnVuY3Rpb24gPSB0cnVlKXtcbiAgICAgICAgdmFyIHJlcyA9IFtdO1xuICAgICAgICBVdGlscy5mb3JPd24odGhpcy5leHByZXNzaW9uU2NvcGUsICh2YWx1ZSwga2V5KT0+e1xuICAgICAgICAgICAgaWYoZmlsdGVyRnVuY3Rpb24gJiYgVXRpbHMuaXNGdW5jdGlvbih2YWx1ZSkpe1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcy5wdXNoKGtleSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIC8qY3JlYXRlIG5vZGUgZnJvbSBzZXJpYWxpemVkIGRhdGEqL1xuICAgIGNyZWF0ZU5vZGVGcm9tRGF0YShkYXRhLCBwYXJlbnQpIHtcbiAgICAgICAgdmFyIG5vZGUsIGxvY2F0aW9uO1xuXG4gICAgICAgIGlmKGRhdGEubG9jYXRpb24pe1xuICAgICAgICAgICAgbG9jYXRpb24gPSBuZXcgZG9tYWluLlBvaW50KGRhdGEubG9jYXRpb24ueCwgZGF0YS5sb2NhdGlvbi55KTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBsb2NhdGlvbiA9IG5ldyBkb21haW4uUG9pbnQoMCwwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkb21haW4uRGVjaXNpb25Ob2RlLiRUWVBFID09IGRhdGEudHlwZSkge1xuICAgICAgICAgICAgbm9kZSA9IG5ldyBkb21haW4uRGVjaXNpb25Ob2RlKGxvY2F0aW9uKTtcbiAgICAgICAgfSBlbHNlIGlmIChkb21haW4uQ2hhbmNlTm9kZS4kVFlQRSA9PSBkYXRhLnR5cGUpIHtcbiAgICAgICAgICAgIG5vZGUgPSBuZXcgZG9tYWluLkNoYW5jZU5vZGUobG9jYXRpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKGRvbWFpbi5UZXJtaW5hbE5vZGUuJFRZUEUgPT0gZGF0YS50eXBlKSB7XG4gICAgICAgICAgICBub2RlID0gbmV3IGRvbWFpbi5UZXJtaW5hbE5vZGUobG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGlmKGRhdGEuJGlkKXtcbiAgICAgICAgICAgIG5vZGUuJGlkID0gZGF0YS4kaWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYoZGF0YS4kZmllbGRTdGF0dXMpe1xuICAgICAgICAgICAgbm9kZS4kZmllbGRTdGF0dXMgPSBkYXRhLiRmaWVsZFN0YXR1cztcbiAgICAgICAgfVxuICAgICAgICBub2RlLm5hbWUgPSBkYXRhLm5hbWU7XG5cbiAgICAgICAgaWYoZGF0YS5jb2RlKXtcbiAgICAgICAgICAgIG5vZGUuY29kZSA9IGRhdGEuY29kZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGF0YS5leHByZXNzaW9uU2NvcGUpIHtcbiAgICAgICAgICAgIG5vZGUuZXhwcmVzc2lvblNjb3BlID0gZGF0YS5leHByZXNzaW9uU2NvcGVcbiAgICAgICAgfVxuICAgICAgICBpZihkYXRhLmNvbXB1dGVkKXtcbiAgICAgICAgICAgIG5vZGUubG9hZENvbXB1dGVkVmFsdWVzKGRhdGEuY29tcHV0ZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGVkZ2VPck5vZGUgPSB0aGlzLmFkZE5vZGUobm9kZSwgcGFyZW50KTtcbiAgICAgICAgZGF0YS5jaGlsZEVkZ2VzLmZvckVhY2goZWQ9PiB7XG4gICAgICAgICAgICB2YXIgZWRnZSA9IHRoaXMuY3JlYXRlTm9kZUZyb21EYXRhKGVkLmNoaWxkTm9kZSwgbm9kZSk7XG4gICAgICAgICAgICBpZihVdGlscy5pc0FycmF5KGVkLnBheW9mZikpe1xuICAgICAgICAgICAgICAgIGVkZ2UucGF5b2ZmID0gZWQucGF5b2ZmO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgZWRnZS5wYXlvZmYgPSBbZWQucGF5b2ZmLCAwXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWRnZS5wcm9iYWJpbGl0eSA9IGVkLnByb2JhYmlsaXR5O1xuICAgICAgICAgICAgZWRnZS5uYW1lID0gZWQubmFtZTtcbiAgICAgICAgICAgIGlmKGVkLmNvbXB1dGVkKXtcbiAgICAgICAgICAgICAgICBlZGdlLmxvYWRDb21wdXRlZFZhbHVlcyhlZC5jb21wdXRlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihlZC4kaWQpe1xuICAgICAgICAgICAgICAgIGVkZ2UuJGlkID0gZWQuJGlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZWQuJGZpZWxkU3RhdHVzKXtcbiAgICAgICAgICAgICAgICBlZGdlLiRmaWVsZFN0YXR1cyA9IGVkLiRmaWVsZFN0YXR1cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGVkZ2VPck5vZGU7XG4gICAgfVxuXG4gICAgLypyZXR1cm5zIG5vZGUgb3IgZWRnZSBmcm9tIHBhcmVudCB0byB0aGlzIG5vZGUqL1xuICAgIGFkZE5vZGUobm9kZSwgcGFyZW50KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5ub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgICAgICB2YXIgZWRnZSA9IHNlbGYuX2FkZENoaWxkKHBhcmVudCwgbm9kZSk7XG4gICAgICAgICAgICB0aGlzLl9maXJlTm9kZUFkZGVkQ2FsbGJhY2sobm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gZWRnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhub2RlKTtcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgLyppbmplY3RzIGdpdmVuIG5vZGUgaW50byBnaXZlbiBlZGdlKi9cbiAgICBpbmplY3ROb2RlKG5vZGUsIGVkZ2UpIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IGVkZ2UucGFyZW50Tm9kZTtcbiAgICAgICAgdmFyIGNoaWxkID0gZWRnZS5jaGlsZE5vZGU7XG4gICAgICAgIHRoaXMubm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgbm9kZS4kcGFyZW50ID0gcGFyZW50O1xuICAgICAgICBlZGdlLmNoaWxkTm9kZSA9IG5vZGU7XG4gICAgICAgIHRoaXMuX2FkZENoaWxkKG5vZGUsIGNoaWxkKTtcbiAgICAgICAgdGhpcy5fZmlyZU5vZGVBZGRlZENhbGxiYWNrKG5vZGUpO1xuICAgIH1cblxuICAgIF9hZGRDaGlsZChwYXJlbnQsIGNoaWxkKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGVkZ2UgPSBuZXcgZG9tYWluLkVkZ2UocGFyZW50LCBjaGlsZCk7XG4gICAgICAgIHNlbGYuX3NldEVkZ2VJbml0aWFsUHJvYmFiaWxpdHkoZWRnZSk7XG4gICAgICAgIHNlbGYuZWRnZXMucHVzaChlZGdlKTtcblxuICAgICAgICBwYXJlbnQuY2hpbGRFZGdlcy5wdXNoKGVkZ2UpO1xuICAgICAgICBjaGlsZC4kcGFyZW50ID0gcGFyZW50O1xuICAgICAgICByZXR1cm4gZWRnZTtcbiAgICB9XG5cbiAgICBfc2V0RWRnZUluaXRpYWxQcm9iYWJpbGl0eShlZGdlKSB7XG4gICAgICAgIGlmIChlZGdlLnBhcmVudE5vZGUgaW5zdGFuY2VvZiBkb21haW4uQ2hhbmNlTm9kZSkge1xuICAgICAgICAgICAgZWRnZS5wcm9iYWJpbGl0eSA9ICcjJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVkZ2UucHJvYmFiaWxpdHkgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8qcmVtb3ZlcyBnaXZlbiBub2RlIGFuZCBpdHMgc3VidHJlZSovXG4gICAgcmVtb3ZlTm9kZShub2RlLCAkbCA9IDApIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIG5vZGUuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PnNlbGYucmVtb3ZlTm9kZShlLmNoaWxkTm9kZSwgJGwgKyAxKSk7XG5cbiAgICAgICAgc2VsZi5fcmVtb3ZlTm9kZShub2RlKTtcbiAgICAgICAgdmFyIHBhcmVudCA9IG5vZGUuJHBhcmVudDtcbiAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgdmFyIHBhcmVudEVkZ2UgPSBVdGlscy5maW5kKHBhcmVudC5jaGlsZEVkZ2VzLCAoZSwgaSk9PiBlLmNoaWxkTm9kZSA9PT0gbm9kZSk7XG4gICAgICAgICAgICBpZiAoJGwgPT0gMCkge1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlRWRnZShwYXJlbnRFZGdlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fcmVtb3ZlRWRnZShwYXJlbnRFZGdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9maXJlTm9kZVJlbW92ZWRDYWxsYmFjayhub2RlKTtcbiAgICB9XG5cbiAgICAvKnJlbW92ZXMgZ2l2ZW4gbm9kZXMgYW5kIHRoZWlyIHN1YnRyZWVzKi9cbiAgICByZW1vdmVOb2Rlcyhub2Rlcykge1xuXG4gICAgICAgIHZhciByb290cyA9IHRoaXMuZmluZFN1YnRyZWVSb290cyhub2Rlcyk7XG4gICAgICAgIHJvb3RzLmZvckVhY2gobj0+dGhpcy5yZW1vdmVOb2RlKG4sIDApLCB0aGlzKTtcbiAgICB9XG5cbiAgICBjb252ZXJ0Tm9kZShub2RlLCB0eXBlVG9Db252ZXJ0VG8pe1xuICAgICAgICB2YXIgbmV3Tm9kZTtcbiAgICAgICAgaWYoIW5vZGUuY2hpbGRFZGdlcy5sZW5ndGggJiYgbm9kZS4kcGFyZW50KXtcbiAgICAgICAgICAgIG5ld05vZGUgPSB0aGlzLmNyZWF0ZU5vZGVCeVR5cGUodHlwZVRvQ29udmVydFRvLCBub2RlLmxvY2F0aW9uKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBpZihub2RlIGluc3RhbmNlb2YgZG9tYWluLkRlY2lzaW9uTm9kZSAmJiB0eXBlVG9Db252ZXJ0VG89PWRvbWFpbi5DaGFuY2VOb2RlLiRUWVBFKXtcbiAgICAgICAgICAgICAgICBuZXdOb2RlID0gdGhpcy5jcmVhdGVOb2RlQnlUeXBlKHR5cGVUb0NvbnZlcnRUbywgbm9kZS5sb2NhdGlvbik7XG4gICAgICAgICAgICB9ZWxzZSBpZih0eXBlVG9Db252ZXJ0VG89PWRvbWFpbi5EZWNpc2lvbk5vZGUuJFRZUEUpe1xuICAgICAgICAgICAgICAgIG5ld05vZGUgPSB0aGlzLmNyZWF0ZU5vZGVCeVR5cGUodHlwZVRvQ29udmVydFRvLCBub2RlLmxvY2F0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmKG5ld05vZGUpe1xuICAgICAgICAgICAgbmV3Tm9kZS5uYW1lPW5vZGUubmFtZTtcbiAgICAgICAgICAgIHRoaXMucmVwbGFjZU5vZGUobmV3Tm9kZSwgbm9kZSk7XG4gICAgICAgICAgICBuZXdOb2RlLmNoaWxkRWRnZXMuZm9yRWFjaChlPT50aGlzLl9zZXRFZGdlSW5pdGlhbFByb2JhYmlsaXR5KGUpKTtcbiAgICAgICAgICAgIHRoaXMuX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhuZXdOb2RlKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgY3JlYXRlTm9kZUJ5VHlwZSh0eXBlLCBsb2NhdGlvbil7XG4gICAgICAgIGlmKHR5cGU9PWRvbWFpbi5EZWNpc2lvbk5vZGUuJFRZUEUpe1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBkb21haW4uRGVjaXNpb25Ob2RlKGxvY2F0aW9uKVxuICAgICAgICB9ZWxzZSBpZih0eXBlPT1kb21haW4uQ2hhbmNlTm9kZS4kVFlQRSl7XG4gICAgICAgICAgICByZXR1cm4gbmV3IGRvbWFpbi5DaGFuY2VOb2RlKGxvY2F0aW9uKVxuICAgICAgICB9ZWxzZSBpZih0eXBlPT1kb21haW4uVGVybWluYWxOb2RlLiRUWVBFKXtcbiAgICAgICAgICAgIHJldHVybiBuZXcgZG9tYWluLlRlcm1pbmFsTm9kZShsb2NhdGlvbilcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlcGxhY2VOb2RlKG5ld05vZGUsIG9sZE5vZGUpe1xuICAgICAgICB2YXIgcGFyZW50ID0gb2xkTm9kZS4kcGFyZW50O1xuICAgICAgICBuZXdOb2RlLiRwYXJlbnQgPSBwYXJlbnQ7XG5cbiAgICAgICAgaWYocGFyZW50KXtcbiAgICAgICAgICAgIHZhciBwYXJlbnRFZGdlID0gVXRpbHMuZmluZChuZXdOb2RlLiRwYXJlbnQuY2hpbGRFZGdlcywgZT0+ZS5jaGlsZE5vZGU9PT1vbGROb2RlKTtcbiAgICAgICAgICAgIHBhcmVudEVkZ2UuY2hpbGROb2RlID0gbmV3Tm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5ld05vZGUuY2hpbGRFZGdlcyA9IG9sZE5vZGUuY2hpbGRFZGdlcztcbiAgICAgICAgbmV3Tm9kZS5jaGlsZEVkZ2VzLmZvckVhY2goZT0+ZS5wYXJlbnROb2RlPW5ld05vZGUpO1xuXG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMubm9kZXMuaW5kZXhPZihvbGROb2RlKTtcbiAgICAgICAgaWYofmluZGV4KXtcbiAgICAgICAgICAgIHRoaXMubm9kZXNbaW5kZXhdPW5ld05vZGU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRSb290cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZXMuZmlsdGVyKG49PiFuLiRwYXJlbnQpO1xuICAgIH1cblxuICAgIGZpbmRTdWJ0cmVlUm9vdHMobm9kZXMpIHtcbiAgICAgICAgcmV0dXJuIG5vZGVzLmZpbHRlcihuPT4hbi4kcGFyZW50IHx8IG5vZGVzLmluZGV4T2Yobi4kcGFyZW50KSA9PT0gLTEpO1xuICAgIH1cblxuICAgIC8qY3JlYXRlcyBkZXRhY2hlZCBjbG9uZSBvZiBnaXZlbiBub2RlKi9cbiAgICBjbG9uZVN1YnRyZWUobm9kZVRvQ29weSwgY2xvbmVDb21wdXRlZFZhbHVlcykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBjbG9uZSA9IHRoaXMuY2xvbmVOb2RlKG5vZGVUb0NvcHkpO1xuXG4gICAgICAgIG5vZGVUb0NvcHkuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PiB7XG4gICAgICAgICAgICB2YXIgY2hpbGRDbG9uZSA9IHNlbGYuY2xvbmVTdWJ0cmVlKGUuY2hpbGROb2RlLCBjbG9uZUNvbXB1dGVkVmFsdWVzKTtcbiAgICAgICAgICAgIGNoaWxkQ2xvbmUuJHBhcmVudCA9IGNsb25lO1xuICAgICAgICAgICAgdmFyIGVkZ2UgPSBuZXcgZG9tYWluLkVkZ2UoY2xvbmUsIGNoaWxkQ2xvbmUsIGUubmFtZSwgVXRpbHMuY2xvbmVEZWVwKGUucGF5b2ZmKSwgZS5wcm9iYWJpbGl0eSk7XG4gICAgICAgICAgICBpZiAoY2xvbmVDb21wdXRlZFZhbHVlcykge1xuICAgICAgICAgICAgICAgIGVkZ2UuY29tcHV0ZWQgPSBVdGlscy5jbG9uZURlZXAoZS5jb21wdXRlZCk7XG4gICAgICAgICAgICAgICAgY2hpbGRDbG9uZS5jb21wdXRlZCA9IFV0aWxzLmNsb25lRGVlcChlLmNoaWxkTm9kZS5jb21wdXRlZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNsb25lLmNoaWxkRWRnZXMucHVzaChlZGdlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChjbG9uZUNvbXB1dGVkVmFsdWVzKSB7XG4gICAgICAgICAgICBjbG9uZS5jb21wdXRlZCA9IFV0aWxzLmNsb25lRGVlcChub2RlVG9Db3B5LmNvbXB1dGVkKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjbG9uZTtcbiAgICB9XG5cbiAgICAvKmF0dGFjaGVzIGRldGFjaGVkIHN1YnRyZWUgdG8gZ2l2ZW4gcGFyZW50Ki9cbiAgICBhdHRhY2hTdWJ0cmVlKG5vZGVUb0F0dGFjaCwgcGFyZW50KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG5vZGVPckVkZ2UgPSBzZWxmLmFkZE5vZGUobm9kZVRvQXR0YWNoLCBwYXJlbnQpO1xuXG4gICAgICAgIG5vZGVUb0F0dGFjaC5leHByZXNzaW9uU2NvcGUgPSBudWxsO1xuXG4gICAgICAgIHZhciBjaGlsZEVkZ2VzID0gc2VsZi5nZXRBbGxEZXNjZW5kYW50RWRnZXMobm9kZVRvQXR0YWNoKTtcbiAgICAgICAgY2hpbGRFZGdlcy5mb3JFYWNoKGU9PiB7XG4gICAgICAgICAgICBzZWxmLmVkZ2VzLnB1c2goZSk7XG4gICAgICAgICAgICBzZWxmLm5vZGVzLnB1c2goZS5jaGlsZE5vZGUpO1xuICAgICAgICAgICAgZS5jaGlsZE5vZGUuZXhwcmVzc2lvblNjb3BlID0gbnVsbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG5vZGVPckVkZ2U7XG4gICAgfVxuXG4gICAgY2xvbmVOb2Rlcyhub2Rlcykge1xuICAgICAgICB2YXIgcm9vdHMgPSBbXVxuICAgICAgICAvL1RPRE9cbiAgICB9XG5cbiAgICAvKnNoYWxsb3cgY2xvbmUgd2l0aG91dCBwYXJlbnQgYW5kIGNoaWxkcmVuKi9cbiAgICBjbG9uZU5vZGUobm9kZSkge1xuICAgICAgICB2YXIgY2xvbmUgPSBVdGlscy5jbG9uZShub2RlKVxuICAgICAgICBjbG9uZS4kaWQgPSBVdGlscy5ndWlkKCk7XG4gICAgICAgIGNsb25lLmxvY2F0aW9uID0gVXRpbHMuY2xvbmUobm9kZS5sb2NhdGlvbik7XG4gICAgICAgIGNsb25lLmNvbXB1dGVkID0gVXRpbHMuY2xvbmUobm9kZS5jb21wdXRlZCk7XG4gICAgICAgIGNsb25lLiRwYXJlbnQgPSBudWxsO1xuICAgICAgICBjbG9uZS5jaGlsZEVkZ2VzID0gW107XG4gICAgICAgIHJldHVybiBjbG9uZTtcbiAgICB9XG5cbiAgICBmaW5kTm9kZUJ5SWQoaWQpIHtcbiAgICAgICAgcmV0dXJuIFV0aWxzLmZpbmQodGhpcy5ub2Rlcywgbj0+bi4kaWQgPT0gaWQpO1xuICAgIH1cblxuICAgIGZpbmRFZGdlQnlJZChpZCkge1xuICAgICAgICByZXR1cm4gVXRpbHMuZmluZCh0aGlzLmVkZ2VzLCBlPT5lLiRpZCA9PSBpZCk7XG4gICAgfVxuXG4gICAgZmluZEJ5SWQoaWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmZpbmROb2RlQnlJZChpZCk7XG4gICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5maW5kRWRnZUJ5SWQoaWQpO1xuICAgIH1cblxuICAgIF9yZW1vdmVOb2RlKG5vZGUpIHsvLyBzaW1wbHkgcmVtb3ZlcyBub2RlIGZyb20gbm9kZSBsaXN0XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMubm9kZXMuaW5kZXhPZihub2RlKTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHRoaXMubm9kZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbW92ZUVkZ2UoZWRnZSkge1xuICAgICAgICB2YXIgaW5kZXggPSBlZGdlLnBhcmVudE5vZGUuY2hpbGRFZGdlcy5pbmRleE9mKGVkZ2UpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgZWRnZS5wYXJlbnROb2RlLmNoaWxkRWRnZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZW1vdmVFZGdlKGVkZ2UpO1xuICAgIH1cblxuICAgIF9yZW1vdmVFZGdlKGVkZ2UpIHsgLy9yZW1vdmVzIGVkZ2UgZnJvbSBlZGdlIGxpc3Qgd2l0aG91dCByZW1vdmluZyBjb25uZWN0ZWQgbm9kZXNcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5lZGdlcy5pbmRleE9mKGVkZ2UpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5lZGdlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3JlbW92ZU5vZGVzKG5vZGVzVG9SZW1vdmUpIHtcbiAgICAgICAgdGhpcy5ub2RlcyA9IHRoaXMubm9kZXMuZmlsdGVyKG49Pm5vZGVzVG9SZW1vdmUuaW5kZXhPZihuKSA9PT0gLTEpO1xuICAgIH1cblxuICAgIF9yZW1vdmVFZGdlcyhlZGdlc1RvUmVtb3ZlKSB7XG4gICAgICAgIHRoaXMuZWRnZXMgPSB0aGlzLmVkZ2VzLmZpbHRlcihlPT5lZGdlc1RvUmVtb3ZlLmluZGV4T2YoZSkgPT09IC0xKTtcbiAgICB9XG5cbiAgICBnZXRBbGxEZXNjZW5kYW50RWRnZXMobm9kZSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgICAgICBub2RlLmNoaWxkRWRnZXMuZm9yRWFjaChlPT4ge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goZSk7XG4gICAgICAgICAgICBpZiAoZS5jaGlsZE5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCguLi5zZWxmLmdldEFsbERlc2NlbmRhbnRFZGdlcyhlLmNoaWxkTm9kZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGdldEFsbERlc2NlbmRhbnROb2Rlcyhub2RlKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIG5vZGUuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PiB7XG4gICAgICAgICAgICBpZiAoZS5jaGlsZE5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChlLmNoaWxkTm9kZSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goLi4uc2VsZi5nZXRBbGxEZXNjZW5kYW50Tm9kZXMoZS5jaGlsZE5vZGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBnZXRBbGxOb2Rlc0luU3VidHJlZShub2RlKSB7XG4gICAgICAgIHZhciBkZXNjZW5kYW50cyA9IHRoaXMuZ2V0QWxsRGVzY2VuZGFudE5vZGVzKG5vZGUpO1xuICAgICAgICBkZXNjZW5kYW50cy51bnNoaWZ0KG5vZGUpO1xuICAgICAgICByZXR1cm4gZGVzY2VuZGFudHM7XG4gICAgfVxuXG4gICAgaXNVbmRvQXZhaWxhYmxlKCkge1xuICAgICAgICByZXR1cm4gISF0aGlzLnVuZG9TdGFjay5sZW5ndGhcbiAgICB9XG5cbiAgICBpc1JlZG9BdmFpbGFibGUoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMucmVkb1N0YWNrLmxlbmd0aFxuICAgIH1cblxuICAgIGNyZWF0ZVN0YXRlU25hcHNob3QocmV2ZXJ0Q29uZil7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXZlcnRDb25mOiByZXZlcnRDb25mLFxuICAgICAgICAgICAgbm9kZXM6IFV0aWxzLmNsb25lRGVlcCh0aGlzLm5vZGVzKSxcbiAgICAgICAgICAgIGVkZ2VzOiBVdGlscy5jbG9uZURlZXAodGhpcy5lZGdlcyksXG4gICAgICAgICAgICB0ZXh0czogVXRpbHMuY2xvbmVEZWVwKHRoaXMudGV4dHMpLFxuICAgICAgICAgICAgcGF5b2ZmTmFtZXM6IFV0aWxzLmNsb25lRGVlcCh0aGlzLnBheW9mZk5hbWVzKSxcbiAgICAgICAgICAgIGRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0OiBVdGlscy5jbG9uZURlZXAodGhpcy5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCksXG4gICAgICAgICAgICB3ZWlnaHRMb3dlckJvdW5kOiBVdGlscy5jbG9uZURlZXAodGhpcy53ZWlnaHRMb3dlckJvdW5kKSxcbiAgICAgICAgICAgIHdlaWdodFVwcGVyQm91bmQ6IFV0aWxzLmNsb25lRGVlcCh0aGlzLndlaWdodFVwcGVyQm91bmQpLFxuICAgICAgICAgICAgZXhwcmVzc2lvblNjb3BlOiBVdGlscy5jbG9uZURlZXAodGhpcy5leHByZXNzaW9uU2NvcGUpLFxuICAgICAgICAgICAgY29kZTogdGhpcy5jb2RlLFxuICAgICAgICAgICAgJGNvZGVFcnJvcjogdGhpcy4kY29kZUVycm9yXG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHNhdmVTdGF0ZUZyb21TbmFwc2hvdChzdGF0ZSl7XG4gICAgICAgIHRoaXMucmVkb1N0YWNrLmxlbmd0aCA9IDA7XG5cbiAgICAgICAgdGhpcy5fcHVzaFRvU3RhY2sodGhpcy51bmRvU3RhY2ssIHN0YXRlKTtcblxuICAgICAgICB0aGlzLl9maXJlVW5kb1JlZG9DYWxsYmFjaygpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNhdmVTdGF0ZShyZXZlcnRDb25mKSB7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlRnJvbVNuYXBzaG90KHRoaXMuY3JlYXRlU3RhdGVTbmFwc2hvdChyZXZlcnRDb25mKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHVuZG8oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG5ld1N0YXRlID0gdGhpcy51bmRvU3RhY2sucG9wKCk7XG4gICAgICAgIGlmICghbmV3U3RhdGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3B1c2hUb1N0YWNrKHRoaXMucmVkb1N0YWNrLCB7XG4gICAgICAgICAgICByZXZlcnRDb25mOiBuZXdTdGF0ZS5yZXZlcnRDb25mLFxuICAgICAgICAgICAgbm9kZXM6IHNlbGYubm9kZXMsXG4gICAgICAgICAgICBlZGdlczogc2VsZi5lZGdlcyxcbiAgICAgICAgICAgIHRleHRzOiBzZWxmLnRleHRzLFxuICAgICAgICAgICAgcGF5b2ZmTmFtZXM6IHNlbGYucGF5b2ZmTmFtZXMsXG4gICAgICAgICAgICBkZWZhdWx0Q3JpdGVyaW9uMVdlaWdodDogc2VsZi5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCxcbiAgICAgICAgICAgIHdlaWdodExvd2VyQm91bmQ6IHNlbGYud2VpZ2h0TG93ZXJCb3VuZCxcbiAgICAgICAgICAgIHdlaWdodFVwcGVyQm91bmQ6IHNlbGYud2VpZ2h0VXBwZXJCb3VuZCxcbiAgICAgICAgICAgIGV4cHJlc3Npb25TY29wZTogc2VsZi5leHByZXNzaW9uU2NvcGUsXG4gICAgICAgICAgICBjb2RlOiBzZWxmLmNvZGUsXG4gICAgICAgICAgICAkY29kZUVycm9yOiBzZWxmLiRjb2RlRXJyb3JcblxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl9zZXROZXdTdGF0ZShuZXdTdGF0ZSk7XG5cbiAgICAgICAgdGhpcy5fZmlyZVVuZG9SZWRvQ2FsbGJhY2soKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICByZWRvKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBuZXdTdGF0ZSA9IHRoaXMucmVkb1N0YWNrLnBvcCgpO1xuICAgICAgICBpZiAoIW5ld1N0YXRlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9wdXNoVG9TdGFjayh0aGlzLnVuZG9TdGFjaywge1xuICAgICAgICAgICAgcmV2ZXJ0Q29uZjogbmV3U3RhdGUucmV2ZXJ0Q29uZixcbiAgICAgICAgICAgIG5vZGVzOiBzZWxmLm5vZGVzLFxuICAgICAgICAgICAgZWRnZXM6IHNlbGYuZWRnZXMsXG4gICAgICAgICAgICB0ZXh0czogc2VsZi50ZXh0cyxcbiAgICAgICAgICAgIHBheW9mZk5hbWVzOiBzZWxmLnBheW9mZk5hbWVzLFxuICAgICAgICAgICAgZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQ6IHNlbGYuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQsXG4gICAgICAgICAgICB3ZWlnaHRMb3dlckJvdW5kOiBzZWxmLndlaWdodExvd2VyQm91bmQsXG4gICAgICAgICAgICB3ZWlnaHRVcHBlckJvdW5kOiBzZWxmLndlaWdodFVwcGVyQm91bmQsXG4gICAgICAgICAgICBleHByZXNzaW9uU2NvcGU6IHNlbGYuZXhwcmVzc2lvblNjb3BlLFxuICAgICAgICAgICAgY29kZTogc2VsZi5jb2RlLFxuICAgICAgICAgICAgJGNvZGVFcnJvcjogc2VsZi4kY29kZUVycm9yXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX3NldE5ld1N0YXRlKG5ld1N0YXRlLCB0cnVlKTtcblxuICAgICAgICB0aGlzLl9maXJlVW5kb1JlZG9DYWxsYmFjaygpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLm5vZGVzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuZWRnZXMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy51bmRvU3RhY2subGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5yZWRvU3RhY2subGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy50ZXh0cy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLmNsZWFyRXhwcmVzc2lvblNjb3BlKCk7XG4gICAgICAgIHRoaXMuY29kZSA9ICcnO1xuICAgICAgICB0aGlzLiRjb2RlRXJyb3IgPSBudWxsO1xuICAgICAgICB0aGlzLiRjb2RlRGlydHkgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLnBheW9mZk5hbWVzID0gW107XG4gICAgICAgIHRoaXMuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQgPSAxO1xuICAgICAgICB0aGlzLndlaWdodExvd2VyQm91bmQgPSAwO1xuICAgICAgICB0aGlzLndlaWdodFVwcGVyQm91bmQgPSBJbmZpbml0eTtcbiAgICB9XG5cbiAgICBhZGRUZXh0KHRleHQpIHtcbiAgICAgICAgdGhpcy50ZXh0cy5wdXNoKHRleHQpO1xuXG4gICAgICAgIHRoaXMuX2ZpcmVUZXh0QWRkZWRDYWxsYmFjayh0ZXh0KTtcbiAgICB9XG5cbiAgICByZW1vdmVUZXh0cyh0ZXh0cykge1xuICAgICAgICB0ZXh0cy5mb3JFYWNoKHQ9PnRoaXMucmVtb3ZlVGV4dCh0KSk7XG4gICAgfVxuXG4gICAgcmVtb3ZlVGV4dCh0ZXh0KSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMudGV4dHMuaW5kZXhPZih0ZXh0KTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHRoaXMudGV4dHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIHRoaXMuX2ZpcmVUZXh0UmVtb3ZlZENhbGxiYWNrKHRleHQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xlYXJFeHByZXNzaW9uU2NvcGUoKSB7XG4gICAgICAgIFV0aWxzLmZvck93bih0aGlzLmV4cHJlc3Npb25TY29wZSwgKHZhbHVlLCBrZXkpPT4ge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuZXhwcmVzc2lvblNjb3BlW2tleV07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldmVyc2VQYXlvZmZzKCl7XG4gICAgICAgIHRoaXMucGF5b2ZmTmFtZXMucmV2ZXJzZSgpO1xuICAgICAgICB0aGlzLmVkZ2VzLmZvckVhY2goZT0+ZS5wYXlvZmYucmV2ZXJzZSgpKVxuICAgIH1cblxuICAgIF9zZXROZXdTdGF0ZShuZXdTdGF0ZSwgcmVkbykge1xuICAgICAgICB2YXIgbm9kZUJ5SWQgPSBVdGlscy5nZXRPYmplY3RCeUlkTWFwKG5ld1N0YXRlLm5vZGVzKTtcbiAgICAgICAgdmFyIGVkZ2VCeUlkID0gVXRpbHMuZ2V0T2JqZWN0QnlJZE1hcChuZXdTdGF0ZS5lZGdlcyk7XG4gICAgICAgIHRoaXMubm9kZXMgPSBuZXdTdGF0ZS5ub2RlcztcbiAgICAgICAgdGhpcy5lZGdlcyA9IG5ld1N0YXRlLmVkZ2VzO1xuICAgICAgICB0aGlzLnRleHRzID0gbmV3U3RhdGUudGV4dHM7XG4gICAgICAgIHRoaXMucGF5b2ZmTmFtZXMgPSBuZXdTdGF0ZS5wYXlvZmZOYW1lcztcbiAgICAgICAgdGhpcy5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCA9IG5ld1N0YXRlLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0O1xuICAgICAgICB0aGlzLndlaWdodExvd2VyQm91bmQgPSBuZXdTdGF0ZS53ZWlnaHRMb3dlckJvdW5kO1xuICAgICAgICB0aGlzLndlaWdodFVwcGVyQm91bmQgPSBuZXdTdGF0ZS53ZWlnaHRVcHBlckJvdW5kO1xuICAgICAgICB0aGlzLmV4cHJlc3Npb25TY29wZSA9IG5ld1N0YXRlLmV4cHJlc3Npb25TY29wZTtcbiAgICAgICAgdGhpcy5jb2RlID0gbmV3U3RhdGUuY29kZTtcbiAgICAgICAgdGhpcy4kY29kZUVycm9yICA9IG5ld1N0YXRlLiRjb2RlRXJyb3JcblxuICAgICAgICB0aGlzLm5vZGVzLmZvckVhY2gobj0+IHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbi5jaGlsZEVkZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVkZ2UgPSBlZGdlQnlJZFtuLmNoaWxkRWRnZXNbaV0uJGlkXTtcbiAgICAgICAgICAgICAgICBuLmNoaWxkRWRnZXNbaV0gPSBlZGdlO1xuICAgICAgICAgICAgICAgIGVkZ2UucGFyZW50Tm9kZSA9IG47XG4gICAgICAgICAgICAgICAgZWRnZS5jaGlsZE5vZGUgPSBub2RlQnlJZFtlZGdlLmNoaWxkTm9kZS4kaWRdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChuZXdTdGF0ZS5yZXZlcnRDb25mKSB7XG4gICAgICAgICAgICBpZiAoIXJlZG8gJiYgbmV3U3RhdGUucmV2ZXJ0Q29uZi5vblVuZG8pIHtcbiAgICAgICAgICAgICAgICBuZXdTdGF0ZS5yZXZlcnRDb25mLm9uVW5kbyhuZXdTdGF0ZS5yZXZlcnRDb25mLmRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlZG8gJiYgbmV3U3RhdGUucmV2ZXJ0Q29uZi5vblJlZG8pIHtcbiAgICAgICAgICAgICAgICBuZXdTdGF0ZS5yZXZlcnRDb25mLm9uUmVkbyhuZXdTdGF0ZS5yZXZlcnRDb25mLmRhdGEpO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJldmVydENvbmYgPSBuZXdTdGF0ZS5yZXZlcnRDb25mO1xuICAgIH1cblxuXG4gICAgX3B1c2hUb1N0YWNrKHN0YWNrLCBvYmopIHtcbiAgICAgICAgaWYgKHN0YWNrLmxlbmd0aCA+PSB0aGlzLm1heFN0YWNrU2l6ZSkge1xuICAgICAgICAgICAgc3RhY2suc2hpZnQoKTtcbiAgICAgICAgfVxuICAgICAgICBzdGFjay5wdXNoKG9iaik7XG4gICAgfVxuXG4gICAgX2ZpcmVVbmRvUmVkb0NhbGxiYWNrKCkge1xuICAgICAgICBpZiAoIXRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgJiYgdGhpcy51bmRvUmVkb1N0YXRlQ2hhbmdlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLnVuZG9SZWRvU3RhdGVDaGFuZ2VkQ2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9maXJlTm9kZUFkZGVkQ2FsbGJhY2sobm9kZSkge1xuICAgICAgICBpZiAoIXRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgJiYgdGhpcy5ub2RlQWRkZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy5ub2RlQWRkZWRDYWxsYmFjayhub2RlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9maXJlTm9kZVJlbW92ZWRDYWxsYmFjayhub2RlKSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLm5vZGVSZW1vdmVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMubm9kZVJlbW92ZWRDYWxsYmFjayhub2RlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9maXJlVGV4dEFkZGVkQ2FsbGJhY2sodGV4dCkge1xuICAgICAgICBpZiAoIXRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgJiYgdGhpcy50ZXh0QWRkZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy50ZXh0QWRkZWRDYWxsYmFjayh0ZXh0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9maXJlVGV4dFJlbW92ZWRDYWxsYmFjayh0ZXh0KSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLnRleHRSZW1vdmVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMudGV4dFJlbW92ZWRDYWxsYmFjayh0ZXh0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCB7T2JqZWN0V2l0aENvbXB1dGVkVmFsdWVzfSBmcm9tIFwiLi9vYmplY3Qtd2l0aC1jb21wdXRlZC12YWx1ZXNcIjtcblxuZXhwb3J0IGNsYXNzIEVkZ2UgZXh0ZW5kcyBPYmplY3RXaXRoQ29tcHV0ZWRWYWx1ZXMge1xuICAgIHBhcmVudE5vZGU7XG4gICAgY2hpbGROb2RlO1xuXG4gICAgbmFtZSA9ICcnO1xuICAgIHByb2JhYmlsaXR5ID0gdW5kZWZpbmVkO1xuICAgIHBheW9mZiA9IFswLCAwXTtcblxuICAgICRESVNQTEFZX1ZBTFVFX05BTUVTID0gWydwcm9iYWJpbGl0eScsICdwYXlvZmYnLCAnb3B0aW1hbCddO1xuXG4gICAgY29uc3RydWN0b3IocGFyZW50Tm9kZSwgY2hpbGROb2RlLCBuYW1lLCBwYXlvZmYsIHByb2JhYmlsaXR5LCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnBhcmVudE5vZGUgPSBwYXJlbnROb2RlO1xuICAgICAgICB0aGlzLmNoaWxkTm9kZSA9IGNoaWxkTm9kZTtcblxuICAgICAgICBpZiAobmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwcm9iYWJpbGl0eSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnByb2JhYmlsaXR5ID0gcHJvYmFiaWxpdHk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHBheW9mZiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLnBheW9mZiA9IHBheW9mZlxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBzZXROYW1lKG5hbWUpIHtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0UHJvYmFiaWxpdHkocHJvYmFiaWxpdHkpIHtcbiAgICAgICAgdGhpcy5wcm9iYWJpbGl0eSA9IHByb2JhYmlsaXR5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXRQYXlvZmYocGF5b2ZmLCBpbmRleCA9IDApIHtcbiAgICAgICAgdGhpcy5wYXlvZmZbaW5kZXhdID0gcGF5b2ZmO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjb21wdXRlZEJhc2VQcm9iYWJpbGl0eSh2YWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcHV0ZWRWYWx1ZShudWxsLCAncHJvYmFiaWxpdHknLCB2YWwpO1xuICAgIH1cblxuICAgIGNvbXB1dGVkQmFzZVBheW9mZih2YWwsIGluZGV4ID0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb21wdXRlZFZhbHVlKG51bGwsICdwYXlvZmZbJyArIGluZGV4ICsgJ10nLCB2YWwpO1xuICAgIH1cblxuICAgIGRpc3BsYXlQcm9iYWJpbGl0eSh2YWwpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlzcGxheVZhbHVlKCdwcm9iYWJpbGl0eScsIHZhbCk7XG4gICAgfVxuXG4gICAgZGlzcGxheVBheW9mZih2YWwsIGluZGV4ID0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kaXNwbGF5VmFsdWUoJ3BheW9mZlsnICsgaW5kZXggKyAnXScsIHZhbCk7XG4gICAgfVxufVxuIiwiZXhwb3J0ICogZnJvbSAnLi9ub2RlL25vZGUnXG5leHBvcnQgKiBmcm9tICcuL25vZGUvZGVjaXNpb24tbm9kZSdcbmV4cG9ydCAqIGZyb20gJy4vbm9kZS9jaGFuY2Utbm9kZSdcbmV4cG9ydCAqIGZyb20gJy4vbm9kZS90ZXJtaW5hbC1ub2RlJ1xuZXhwb3J0ICogZnJvbSAnLi9lZGdlJ1xuZXhwb3J0ICogZnJvbSAnLi9wb2ludCdcbmV4cG9ydCAqIGZyb20gJy4vdGV4dCdcbiIsImltcG9ydCB7Tm9kZX0gZnJvbSAnLi9ub2RlJ1xuXG5leHBvcnQgY2xhc3MgQ2hhbmNlTm9kZSBleHRlbmRzIE5vZGV7XG5cbiAgICBzdGF0aWMgJFRZUEUgPSAnY2hhbmNlJztcblxuICAgIGNvbnN0cnVjdG9yKGxvY2F0aW9uKXtcbiAgICAgICAgc3VwZXIoQ2hhbmNlTm9kZS4kVFlQRSwgbG9jYXRpb24pO1xuICAgIH1cbn1cbiIsImltcG9ydCB7Tm9kZX0gZnJvbSAnLi9ub2RlJ1xuXG5leHBvcnQgY2xhc3MgRGVjaXNpb25Ob2RlIGV4dGVuZHMgTm9kZXtcblxuICAgIHN0YXRpYyAkVFlQRSA9ICdkZWNpc2lvbic7XG5cbiAgICBjb25zdHJ1Y3Rvcihsb2NhdGlvbil7XG4gICAgICAgIHN1cGVyKERlY2lzaW9uTm9kZS4kVFlQRSwgbG9jYXRpb24pO1xuICAgIH1cbn1cbiIsImltcG9ydCB7UG9pbnR9IGZyb20gJy4uL3BvaW50J1xuaW1wb3J0IHtPYmplY3RXaXRoQ29tcHV0ZWRWYWx1ZXN9IGZyb20gJy4uL29iamVjdC13aXRoLWNvbXB1dGVkLXZhbHVlcydcblxuZXhwb3J0IGNsYXNzIE5vZGUgZXh0ZW5kcyBPYmplY3RXaXRoQ29tcHV0ZWRWYWx1ZXN7XG5cbiAgICB0eXBlO1xuICAgIGNoaWxkRWRnZXM9W107XG4gICAgbmFtZT0nJztcblxuICAgIGxvY2F0aW9uOyAvL1BvaW50XG5cbiAgICBjb2RlPScnO1xuICAgICRjb2RlRGlydHkgPSBmYWxzZTsgLy8gaXMgY29kZSBjaGFuZ2VkIHdpdGhvdXQgcmVldmFsdWF0aW9uP1xuICAgICRjb2RlRXJyb3IgPSBudWxsOyAvL2NvZGUgZXZhbHVhdGlvbiBlcnJvcnNcblxuICAgIGV4cHJlc3Npb25TY29wZT1udWxsO1xuXG4gICAgJERJU1BMQVlfVkFMVUVfTkFNRVMgPSBbJ2NoaWxkcmVuUGF5b2ZmJywgJ2FnZ3JlZ2F0ZWRQYXlvZmYnLCAncHJvYmFiaWxpdHlUb0VudGVyJywgJ29wdGltYWwnXVxuXG4gICAgY29uc3RydWN0b3IodHlwZSwgbG9jYXRpb24pe1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmxvY2F0aW9uPWxvY2F0aW9uO1xuICAgICAgICBpZighbG9jYXRpb24pe1xuICAgICAgICAgICAgdGhpcy5sb2NhdGlvbiA9IG5ldyBQb2ludCgwLDApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudHlwZT10eXBlO1xuICAgIH1cblxuICAgIHNldE5hbWUobmFtZSl7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIG1vdmVUbyh4LHksIHdpdGhDaGlsZHJlbil7IC8vbW92ZSB0byBuZXcgbG9jYXRpb25cbiAgICAgICAgaWYod2l0aENoaWxkcmVuKXtcbiAgICAgICAgICAgIHZhciBkeCA9IHgtdGhpcy5sb2NhdGlvbi54O1xuICAgICAgICAgICAgdmFyIGR5ID0geS10aGlzLmxvY2F0aW9uLnk7XG4gICAgICAgICAgICB0aGlzLmNoaWxkRWRnZXMuZm9yRWFjaChlPT5lLmNoaWxkTm9kZS5tb3ZlKGR4LCBkeSwgdHJ1ZSkpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmxvY2F0aW9uLm1vdmVUbyh4LHkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBtb3ZlKGR4LCBkeSwgd2l0aENoaWxkcmVuKXsgLy9tb3ZlIGJ5IHZlY3RvclxuICAgICAgICBpZih3aXRoQ2hpbGRyZW4pe1xuICAgICAgICAgICAgdGhpcy5jaGlsZEVkZ2VzLmZvckVhY2goZT0+ZS5jaGlsZE5vZGUubW92ZShkeCwgZHksIHRydWUpKVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubG9jYXRpb24ubW92ZShkeCwgZHkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG4iLCJpbXBvcnQge05vZGV9IGZyb20gJy4vbm9kZSdcblxuZXhwb3J0IGNsYXNzIFRlcm1pbmFsTm9kZSBleHRlbmRzIE5vZGV7XG5cbiAgICBzdGF0aWMgJFRZUEUgPSAndGVybWluYWwnO1xuXG4gICAgY29uc3RydWN0b3IobG9jYXRpb24pe1xuICAgICAgICBzdXBlcihUZXJtaW5hbE5vZGUuJFRZUEUsIGxvY2F0aW9uKTtcbiAgICB9XG59XG4iLCJpbXBvcnQge1V0aWxzfSBmcm9tICdzZC11dGlscydcblxuaW1wb3J0IHtPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkc30gZnJvbSBcIi4vb2JqZWN0LXdpdGgtaWQtYW5kLWVkaXRhYmxlLWZpZWxkc1wiO1xuXG5leHBvcnQgY2xhc3MgT2JqZWN0V2l0aENvbXB1dGVkVmFsdWVzIGV4dGVuZHMgT2JqZWN0V2l0aElkQW5kRWRpdGFibGVGaWVsZHN7XG5cbiAgICBjb21wdXRlZD17fTsgLy9jb21wdXRlZCB2YWx1ZXNcblxuICAgIC8qZ2V0IG9yIHNldCBjb21wdXRlZCB2YWx1ZSovXG4gICAgY29tcHV0ZWRWYWx1ZShydWxlTmFtZSwgZmllbGRQYXRoLCB2YWx1ZSl7XG4gICAgICAgIHZhciBwYXRoID0gJ2NvbXB1dGVkLic7XG4gICAgICAgIGlmKHJ1bGVOYW1lKXtcbiAgICAgICAgICAgIHBhdGgrPXJ1bGVOYW1lKycuJztcbiAgICAgICAgfVxuICAgICAgICBwYXRoKz1maWVsZFBhdGg7XG4gICAgICAgIGlmKHZhbHVlPT09dW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHJldHVybiAgVXRpbHMuZ2V0KHRoaXMsIHBhdGgsIG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIFV0aWxzLnNldCh0aGlzLCBwYXRoLCB2YWx1ZSk7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBjbGVhckNvbXB1dGVkVmFsdWVzKHJ1bGVOYW1lKXtcbiAgICAgICAgaWYocnVsZU5hbWU9PXVuZGVmaW5lZCl7XG4gICAgICAgICAgICB0aGlzLmNvbXB1dGVkPXt9O1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKFV0aWxzLmlzQXJyYXkocnVsZU5hbWUpKXtcbiAgICAgICAgICAgIHJ1bGVOYW1lLmZvckVhY2gobj0+e1xuICAgICAgICAgICAgICAgIHRoaXMuY29tcHV0ZWRbbl09e307XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbXB1dGVkW3J1bGVOYW1lXT17fTtcbiAgICB9XG5cbiAgICBjbGVhckRpc3BsYXlWYWx1ZXMoKXtcbiAgICAgICAgdGhpcy5jb21wdXRlZFsnJGRpc3BsYXlWYWx1ZXMnXT17fTtcbiAgICB9XG5cbiAgICBkaXNwbGF5VmFsdWUoZmllbGRQYXRoLCB2YWx1ZSl7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVkVmFsdWUobnVsbCwgJyRkaXNwbGF5VmFsdWVzLicrZmllbGRQYXRoLCB2YWx1ZSk7XG4gICAgfVxuXG4gICAgbG9hZENvbXB1dGVkVmFsdWVzKGNvbXB1dGVkKXtcbiAgICAgICAgdGhpcy5jb21wdXRlZCA9IGNvbXB1dGVkO1xuICAgIH1cbn1cbiIsImltcG9ydCB7VXRpbHN9IGZyb20gJ3NkLXV0aWxzJ1xuXG5leHBvcnQgY2xhc3MgT2JqZWN0V2l0aElkQW5kRWRpdGFibGVGaWVsZHMge1xuXG4gICAgJGlkID0gVXRpbHMuZ3VpZCgpOyAvL2ludGVybmFsIGlkXG4gICAgJGZpZWxkU3RhdHVzPXt9O1xuXG4gICAgZ2V0RmllbGRTdGF0dXMoZmllbGRQYXRoKXtcbiAgICAgICAgaWYoIVV0aWxzLmdldCh0aGlzLiRmaWVsZFN0YXR1cywgZmllbGRQYXRoLCBudWxsKSl7XG4gICAgICAgICAgICBVdGlscy5zZXQodGhpcy4kZmllbGRTdGF0dXMsIGZpZWxkUGF0aCwge1xuICAgICAgICAgICAgICAgIHZhbGlkOiB7XG4gICAgICAgICAgICAgICAgICAgIHN5bnRheDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gVXRpbHMuZ2V0KHRoaXMuJGZpZWxkU3RhdHVzLCBmaWVsZFBhdGgpO1xuICAgIH1cblxuICAgIHNldFN5bnRheFZhbGlkaXR5KGZpZWxkUGF0aCwgdmFsaWQpe1xuICAgICAgICB2YXIgZmllbGRTdGF0dXMgPSB0aGlzLmdldEZpZWxkU3RhdHVzKGZpZWxkUGF0aCk7XG4gICAgICAgIGZpZWxkU3RhdHVzLnZhbGlkLnN5bnRheCA9IHZhbGlkO1xuICAgIH1cblxuICAgIHNldFZhbHVlVmFsaWRpdHkoZmllbGRQYXRoLCB2YWxpZCl7XG4gICAgICAgIHZhciBmaWVsZFN0YXR1cyA9IHRoaXMuZ2V0RmllbGRTdGF0dXMoZmllbGRQYXRoKTtcbiAgICAgICAgZmllbGRTdGF0dXMudmFsaWQudmFsdWUgPSB2YWxpZDtcbiAgICB9XG5cbiAgICBpc0ZpZWxkVmFsaWQoZmllbGRQYXRoLCBzeW50YXg9dHJ1ZSwgdmFsdWU9dHJ1ZSl7XG4gICAgICAgIHZhciBmaWVsZFN0YXR1cyA9IHRoaXMuZ2V0RmllbGRTdGF0dXMoZmllbGRQYXRoKTtcbiAgICAgICAgaWYoc3ludGF4ICYmIHZhbHVlKSB7XG4gICAgICAgICAgICByZXR1cm4gZmllbGRTdGF0dXMudmFsaWQuc3ludGF4ICYmIGZpZWxkU3RhdHVzLnZhbGlkLnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGlmKHN5bnRheCkge1xuICAgICAgICAgICAgcmV0dXJuIGZpZWxkU3RhdHVzLnZhbGlkLnN5bnRheFxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmaWVsZFN0YXR1cy52YWxpZC52YWx1ZTtcbiAgICB9XG5cblxufVxuIiwiZXhwb3J0IGNsYXNzIFBvaW50IHtcbiAgICB4O1xuICAgIHk7XG4gICAgY29uc3RydWN0b3IoeCx5KXtcbiAgICAgICAgaWYoeCBpbnN0YW5jZW9mIFBvaW50KXtcbiAgICAgICAgICAgIHk9eC55O1xuICAgICAgICAgICAgeD14LnhcbiAgICAgICAgfWVsc2UgaWYoQXJyYXkuaXNBcnJheSh4KSl7XG4gICAgICAgICAgICB5PXhbMV07XG4gICAgICAgICAgICB4PXhbMF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy54PXg7XG4gICAgICAgIHRoaXMueT15O1xuICAgIH1cblxuICAgIG1vdmVUbyh4LHkpe1xuICAgICAgICBpZihBcnJheS5pc0FycmF5KHgpKXtcbiAgICAgICAgICAgIHk9eFsxXTtcbiAgICAgICAgICAgIHg9eFswXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLng9eDtcbiAgICAgICAgdGhpcy55PXk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIG1vdmUoZHgsZHkpeyAvL21vdmUgYnkgdmVjdG9yXG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoZHgpKXtcbiAgICAgICAgICAgIGR5PWR4WzFdO1xuICAgICAgICAgICAgZHg9ZHhbMF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy54Kz1keDtcbiAgICAgICAgdGhpcy55Kz1keTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG59XG4iLCJpbXBvcnQge1BvaW50fSBmcm9tIFwiLi9wb2ludFwiO1xuaW1wb3J0IHtVdGlsc30gZnJvbSBcInNkLXV0aWxzXCI7XG5pbXBvcnQge09iamVjdFdpdGhJZEFuZEVkaXRhYmxlRmllbGRzfSBmcm9tIFwiLi9vYmplY3Qtd2l0aC1pZC1hbmQtZWRpdGFibGUtZmllbGRzXCI7XG5cbmV4cG9ydCBjbGFzcyBUZXh0IGV4dGVuZHMgT2JqZWN0V2l0aElkQW5kRWRpdGFibGVGaWVsZHN7XG5cbiAgICB2YWx1ZT0nJztcbiAgICBsb2NhdGlvbjsgLy9Qb2ludFxuXG4gICAgY29uc3RydWN0b3IobG9jYXRpb24sIHZhbHVlKXtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5sb2NhdGlvbj1sb2NhdGlvbjtcbiAgICAgICAgaWYoIWxvY2F0aW9uKXtcbiAgICAgICAgICAgIHRoaXMubG9jYXRpb24gPSBuZXcgUG9pbnQoMCwwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHZhbHVlKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBtb3ZlVG8oeCx5KXsgLy9tb3ZlIHRvIG5ldyBsb2NhdGlvblxuICAgICAgICB0aGlzLmxvY2F0aW9uLm1vdmVUbyh4LHkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBtb3ZlKGR4LCBkeSl7IC8vbW92ZSBieSB2ZWN0b3JcbiAgICAgICAgdGhpcy5sb2NhdGlvbi5tb3ZlKGR4LCBkeSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cbiIsImltcG9ydCAqIGFzIGRvbWFpbiBmcm9tICcuL2RvbWFpbidcbmV4cG9ydCB7ZG9tYWlufVxuZXhwb3J0ICogZnJvbSAnLi9kYXRhLW1vZGVsJ1xuZXhwb3J0ICogZnJvbSAnLi92YWxpZGF0aW9uLXJlc3VsdCdcbiIsImltcG9ydCB7VXRpbHN9IGZyb20gXCJzZC11dGlsc1wiO1xuXG5leHBvcnQgY2xhc3MgVmFsaWRhdGlvblJlc3VsdHtcblxuXG4gICAgZXJyb3JzID0ge307XG4gICAgd2FybmluZ3MgPSB7fTtcbiAgICBvYmplY3RJZFRvRXJyb3I9e307XG5cbiAgICBhZGRFcnJvcihlcnJvciwgb2JqKXtcbiAgICAgICAgaWYoVXRpbHMuaXNTdHJpbmcoZXJyb3IpKXtcbiAgICAgICAgICAgIGVycm9yID0ge25hbWU6IGVycm9yfTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgbmFtZSA9IGVycm9yLm5hbWU7XG4gICAgICAgIHZhciBlcnJvcnNCeU5hbWUgPSB0aGlzLmVycm9yc1tuYW1lXTtcbiAgICAgICAgaWYoIWVycm9yc0J5TmFtZSl7XG4gICAgICAgICAgICBlcnJvcnNCeU5hbWU9W107XG4gICAgICAgICAgICB0aGlzLmVycm9yc1tuYW1lXT1lcnJvcnNCeU5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9iakUgPSB0aGlzLm9iamVjdElkVG9FcnJvcltvYmouJGlkXTtcbiAgICAgICAgaWYoIW9iakUpe1xuICAgICAgICAgICAgb2JqRT1bXTtcbiAgICAgICAgICAgIHRoaXMub2JqZWN0SWRUb0Vycm9yW29iai4kaWRdPSBvYmpFO1xuICAgICAgICB9XG4gICAgICAgIGVycm9yc0J5TmFtZS5wdXNoKG9iaik7XG4gICAgICAgIG9iakUucHVzaChlcnJvcik7XG4gICAgfVxuXG4gICAgYWRkV2FybmluZyhuYW1lLCBvYmope1xuICAgICAgICB2YXIgZSA9IHRoaXMud2FybmluZ3NbbmFtZV07XG4gICAgICAgIGlmKCFlKXtcbiAgICAgICAgICAgIGU9W107XG4gICAgICAgICAgICB0aGlzLndhcm5pbmdzW25hbWVdPWU7XG4gICAgICAgIH1cbiAgICAgICAgZS5wdXNoKG9iailcbiAgICB9XG5cbiAgICBpc1ZhbGlkKCl7XG4gICAgICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0aGlzLmVycm9ycykubGVuZ3RoID09PSAwXG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZUZyb21EVE8oZHRvKXtcbiAgICAgICAgdmFyIHYgPSBuZXcgVmFsaWRhdGlvblJlc3VsdCgpO1xuICAgICAgICB2LmVycm9ycyA9IGR0by5lcnJvcnM7XG4gICAgICAgIHYud2FybmluZ3MgPSBkdG8ud2FybmluZ3M7XG4gICAgICAgIHYub2JqZWN0SWRUb0Vycm9yID0gZHRvLm9iamVjdElkVG9FcnJvcjtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgfVxufVxuIiwiZXhwb3J0ICogZnJvbSAnLi9zcmMvaW5kZXgnXG4iXX0=
