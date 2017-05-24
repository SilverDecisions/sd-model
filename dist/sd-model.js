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
                payoffNames: this.payoffNames,
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

            var childEdges = self.getAllDescendantEdges(nodeToAttach);
            childEdges.forEach(function (e) {
                self.edges.push(e);
                self.nodes.push(e.childNode);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGRhdGEtbW9kZWwuanMiLCJzcmNcXGRvbWFpblxcZWRnZS5qcyIsInNyY1xcZG9tYWluXFxpbmRleC5qcyIsInNyY1xcZG9tYWluXFxub2RlXFxjaGFuY2Utbm9kZS5qcyIsInNyY1xcZG9tYWluXFxub2RlXFxkZWNpc2lvbi1ub2RlLmpzIiwic3JjXFxkb21haW5cXG5vZGVcXG5vZGUuanMiLCJzcmNcXGRvbWFpblxcbm9kZVxcdGVybWluYWwtbm9kZS5qcyIsInNyY1xcZG9tYWluXFxvYmplY3Qtd2l0aC1jb21wdXRlZC12YWx1ZXMuanMiLCJzcmNcXGRvbWFpblxcb2JqZWN0LXdpdGgtaWQtYW5kLWVkaXRhYmxlLWZpZWxkcy5qcyIsInNyY1xcZG9tYWluXFxwb2ludC5qcyIsInNyY1xcZG9tYWluXFx0ZXh0LmpzIiwic3JjXFxpbmRleC5qcyIsInNyY1xcdmFsaWRhdGlvbi1yZXN1bHQuanMiLCJpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDQUE7O0FBQ0E7O0ksQUFBWTs7QUFDWjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7OztJLEFBR2Esb0IsQUFBQSx3QkFjVTtBQUZHO0FBcUJ0Qjt1QkFBQSxBQUFZLE1BQU07OEJBQUE7O2FBL0JsQixBQStCa0IsUUEvQlYsQUErQlU7YUE5QmxCLEFBOEJrQixRQTlCVixBQThCVTthQTVCbEIsQUE0QmtCLFFBNUJWLEFBNEJVO2FBM0JsQixBQTJCa0IsY0EzQkosQUEyQkk7YUExQmxCLEFBMEJrQiwwQkExQlEsQUEwQlI7YUF6QmxCLEFBeUJrQixtQkF6QkMsQUF5QkQ7YUF4QmxCLEFBd0JrQixtQkF4QkMsQUF3QkQ7YUFyQmxCLEFBcUJrQixrQkFyQkEsQUFxQkE7YUFwQmxCLEFBb0JrQixPQXBCWCxBQW9CVzthQW5CbEIsQUFtQmtCLGFBbkJMLEFBbUJL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LEFBQWdDLFFBQWhDLEFBQXdDLFdBQS9DLEFBQTBELEFBQzdEOzs7O3NDLEFBRW9CLEtBQUksQUFDckI7Z0JBQUksSUFBSSxJQUFSLEFBQVEsQUFBSSxBQUNaO2NBQUEsQUFBRSxTQUFTLElBQVgsQUFBZSxBQUNmO2NBQUEsQUFBRSxXQUFXLElBQWIsQUFBaUIsQUFDakI7Y0FBQSxBQUFFLGtCQUFrQixJQUFwQixBQUF3QixBQUN4QjttQkFBQSxBQUFPLEFBQ1Y7Ozs7Ozs7Ozs7Ozs7Ozs7QUMvQ0wsMkNBQUE7aURBQUE7O2dCQUFBO3dCQUFBO29CQUFBO0FBQUE7QUFBQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQge1V0aWxzLCBsb2d9IGZyb20gXCJzZC11dGlsc1wiO1xuaW1wb3J0ICogYXMgZG9tYWluIGZyb20gXCIuL2RvbWFpblwiO1xuaW1wb3J0IHtWYWxpZGF0aW9uUmVzdWx0fSBmcm9tIFwiLi92YWxpZGF0aW9uLXJlc3VsdFwiO1xuXG4vKlxuICogRGF0YSBtb2RlbCBtYW5hZ2VyXG4gKiAqL1xuZXhwb3J0IGNsYXNzIERhdGFNb2RlbCB7XG5cbiAgICBub2RlcyA9IFtdO1xuICAgIGVkZ2VzID0gW107XG5cbiAgICB0ZXh0cyA9IFtdOyAvL2Zsb2F0aW5nIHRleHRzXG4gICAgcGF5b2ZmTmFtZXMgPSBbXTtcbiAgICBkZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCA9IDE7XG4gICAgd2VpZ2h0TG93ZXJCb3VuZCA9IDA7XG4gICAgd2VpZ2h0VXBwZXJCb3VuZCA9IEluZmluaXR5O1xuXG5cbiAgICBleHByZXNzaW9uU2NvcGUgPSB7fTsgLy9nbG9iYWwgZXhwcmVzc2lvbiBzY29wZVxuICAgIGNvZGUgPSBcIlwiOy8vZ2xvYmFsIGV4cHJlc3Npb24gY29kZVxuICAgICRjb2RlRXJyb3IgPSBudWxsOyAvL2NvZGUgZXZhbHVhdGlvbiBlcnJvcnNcbiAgICAkY29kZURpcnR5ID0gZmFsc2U7IC8vIGlzIGNvZGUgY2hhbmdlZCB3aXRob3V0IHJlZXZhbHVhdGlvbj9cbiAgICAkdmVyc2lvbj0xO1xuXG4gICAgdmFsaWRhdGlvblJlc3VsdHMgPSBbXTtcblxuICAgIC8vIHVuZG8gLyByZWRvXG4gICAgbWF4U3RhY2tTaXplID0gMjA7XG4gICAgdW5kb1N0YWNrID0gW107XG4gICAgcmVkb1N0YWNrID0gW107XG4gICAgdW5kb1JlZG9TdGF0ZUNoYW5nZWRDYWxsYmFjayA9IG51bGw7XG4gICAgbm9kZUFkZGVkQ2FsbGJhY2sgPSBudWxsO1xuICAgIG5vZGVSZW1vdmVkQ2FsbGJhY2sgPSBudWxsO1xuXG4gICAgdGV4dEFkZGVkQ2FsbGJhY2sgPSBudWxsO1xuICAgIHRleHRSZW1vdmVkQ2FsbGJhY2sgPSBudWxsO1xuXG4gICAgY2FsbGJhY2tzRGlzYWJsZWQgPSBmYWxzZTtcblxuICAgIGNvbnN0cnVjdG9yKGRhdGEpIHtcbiAgICAgICAgaWYoZGF0YSl7XG4gICAgICAgICAgICB0aGlzLmxvYWQoZGF0YSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRKc29uUmVwbGFjZXIoZmlsdGVyTG9jYXRpb249ZmFsc2UsIGZpbHRlckNvbXB1dGVkPWZhbHNlLCByZXBsYWNlciwgZmlsdGVyUHJpdmF0ZSA9dHJ1ZSl7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoaywgdikge1xuXG4gICAgICAgICAgICBpZiAoKGZpbHRlclByaXZhdGUgJiYgVXRpbHMuc3RhcnRzV2l0aChrLCAnJCcpKSB8fCBrID09ICdwYXJlbnROb2RlJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmlsdGVyTG9jYXRpb24gJiYgayA9PSAnbG9jYXRpb24nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmaWx0ZXJDb21wdXRlZCAmJiBrID09ICdjb21wdXRlZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocmVwbGFjZXIpe1xuICAgICAgICAgICAgICAgIHJldHVybiByZXBsYWNlcihrLCB2KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXJpYWxpemUoc3RyaW5naWZ5PXRydWUsIGZpbHRlckxvY2F0aW9uPWZhbHNlLCBmaWx0ZXJDb21wdXRlZD1mYWxzZSwgcmVwbGFjZXIsIGZpbHRlclByaXZhdGUgPXRydWUpe1xuICAgICAgICB2YXIgZGF0YSA9ICB7XG4gICAgICAgICAgICBjb2RlOiB0aGlzLmNvZGUsXG4gICAgICAgICAgICBleHByZXNzaW9uU2NvcGU6IHRoaXMuZXhwcmVzc2lvblNjb3BlLFxuICAgICAgICAgICAgdHJlZXM6IHRoaXMuZ2V0Um9vdHMoKSxcbiAgICAgICAgICAgIHRleHRzOiB0aGlzLnRleHRzLFxuICAgICAgICAgICAgcGF5b2ZmTmFtZXM6IHRoaXMucGF5b2ZmTmFtZXMsXG4gICAgICAgICAgICBkZWZhdWx0Q3JpdGVyaW9uMVdlaWdodDogdGhpcy5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCxcbiAgICAgICAgICAgIHdlaWdodExvd2VyQm91bmQ6IHRoaXMud2VpZ2h0TG93ZXJCb3VuZCxcbiAgICAgICAgICAgIHdlaWdodFVwcGVyQm91bmQ6IHRoaXMud2VpZ2h0VXBwZXJCb3VuZFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmKCFzdHJpbmdpZnkpe1xuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gVXRpbHMuc3RyaW5naWZ5KGRhdGEsIHRoaXMuZ2V0SnNvblJlcGxhY2VyKGZpbHRlckxvY2F0aW9uLCBmaWx0ZXJDb21wdXRlZCwgcmVwbGFjZXIsIGZpbHRlclByaXZhdGUpLCBbXSk7XG4gICAgfVxuXG5cbiAgICAvKkxvYWRzIHNlcmlhbGl6ZWQgZGF0YSovXG4gICAgbG9hZChkYXRhKSB7XG4gICAgICAgIC8vcm9vdHMsIHRleHRzLCBjb2RlLCBleHByZXNzaW9uU2NvcGVcbiAgICAgICAgdmFyIGNhbGxiYWNrc0Rpc2FibGVkID0gdGhpcy5jYWxsYmFja3NEaXNhYmxlZDtcbiAgICAgICAgdGhpcy5jYWxsYmFja3NEaXNhYmxlZCA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5jbGVhcigpO1xuXG5cbiAgICAgICAgZGF0YS50cmVlcy5mb3JFYWNoKG5vZGVEYXRhPT4ge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmNyZWF0ZU5vZGVGcm9tRGF0YShub2RlRGF0YSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChkYXRhLnRleHRzKSB7XG4gICAgICAgICAgICBkYXRhLnRleHRzLmZvckVhY2godGV4dERhdGE9PiB7XG4gICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gbmV3IGRvbWFpbi5Qb2ludCh0ZXh0RGF0YS5sb2NhdGlvbi54LCB0ZXh0RGF0YS5sb2NhdGlvbi55KTtcbiAgICAgICAgICAgICAgICB2YXIgdGV4dCA9IG5ldyBkb21haW4uVGV4dChsb2NhdGlvbiwgdGV4dERhdGEudmFsdWUpO1xuICAgICAgICAgICAgICAgIHRoaXMudGV4dHMucHVzaCh0ZXh0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNsZWFyRXhwcmVzc2lvblNjb3BlKCk7XG4gICAgICAgIHRoaXMuY29kZSA9IGRhdGEuY29kZSB8fCAnJztcblxuICAgICAgICBpZiAoZGF0YS5leHByZXNzaW9uU2NvcGUpIHtcbiAgICAgICAgICAgIFV0aWxzLmV4dGVuZCh0aGlzLmV4cHJlc3Npb25TY29wZSwgZGF0YS5leHByZXNzaW9uU2NvcGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEucGF5b2ZmTmFtZXMgIT09IHVuZGVmaW5lZCAmJiBkYXRhLnBheW9mZk5hbWVzICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLnBheW9mZk5hbWVzID0gZGF0YS5wYXlvZmZOYW1lcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0ICE9PSB1bmRlZmluZWQgJiYgZGF0YS5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCA9IGRhdGEuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS53ZWlnaHRMb3dlckJvdW5kICE9PSB1bmRlZmluZWQgJiYgZGF0YS53ZWlnaHRMb3dlckJvdW5kICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLndlaWdodExvd2VyQm91bmQgPSBkYXRhLndlaWdodExvd2VyQm91bmQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS53ZWlnaHRVcHBlckJvdW5kICE9PSB1bmRlZmluZWQgJiYgZGF0YS53ZWlnaHRVcHBlckJvdW5kICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLndlaWdodFVwcGVyQm91bmQgPSBkYXRhLndlaWdodFVwcGVyQm91bmQ7XG4gICAgICAgIH1cblxuXG4gICAgICAgIHRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgPSBjYWxsYmFja3NEaXNhYmxlZDtcbiAgICB9XG5cbiAgICBnZXREVE8oZmlsdGVyTG9jYXRpb249ZmFsc2UsIGZpbHRlckNvbXB1dGVkPWZhbHNlLCBmaWx0ZXJQcml2YXRlID1mYWxzZSl7XG4gICAgICAgIHZhciBkdG8gPSB7XG4gICAgICAgICAgICBzZXJpYWxpemVkRGF0YTogdGhpcy5zZXJpYWxpemUodHJ1ZSwgZmlsdGVyTG9jYXRpb24sIGZpbHRlckNvbXB1dGVkLCBudWxsLCBmaWx0ZXJQcml2YXRlKSxcbiAgICAgICAgICAgICRjb2RlRXJyb3I6IHRoaXMuJGNvZGVFcnJvcixcbiAgICAgICAgICAgICRjb2RlRGlydHk6IHRoaXMuJGNvZGVEaXJ0eSxcbiAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHRzOiB0aGlzLnZhbGlkYXRpb25SZXN1bHRzLnNsaWNlKClcblxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZHRvXG4gICAgfVxuXG4gICAgbG9hZEZyb21EVE8oZHRvLCBkYXRhUmV2aXZlcil7XG4gICAgICAgIHRoaXMubG9hZChKU09OLnBhcnNlKGR0by5zZXJpYWxpemVkRGF0YSwgZGF0YVJldml2ZXIpKTtcbiAgICAgICAgdGhpcy4kY29kZUVycm9yID0gZHRvLiRjb2RlRXJyb3I7XG4gICAgICAgIHRoaXMuJGNvZGVEaXJ0eSA9IGR0by4kY29kZURpcnR5O1xuICAgICAgICB0aGlzLnZhbGlkYXRpb25SZXN1bHRzLmxlbmd0aD0wO1xuICAgICAgICBkdG8udmFsaWRhdGlvblJlc3VsdHMuZm9yRWFjaCh2PT57XG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRpb25SZXN1bHRzLnB1c2goVmFsaWRhdGlvblJlc3VsdC5jcmVhdGVGcm9tRFRPKHYpKVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8qVGhpcyBtZXRob2QgdXBkYXRlcyBvbmx5IGNvbXB1dGF0aW9uIHJlc3VsdHMvdmFsaWRhdGlvbiovXG4gICAgdXBkYXRlRnJvbShkYXRhTW9kZWwpe1xuICAgICAgICBpZih0aGlzLiR2ZXJzaW9uPmRhdGFNb2RlbC4kdmVyc2lvbil7XG4gICAgICAgICAgICBsb2cud2FybihcIkRhdGFNb2RlbC51cGRhdGVGcm9tOiB2ZXJzaW9uIG9mIGN1cnJlbnQgbW9kZWwgZ3JlYXRlciB0aGFuIHVwZGF0ZVwiKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBieUlkID0ge31cbiAgICAgICAgZGF0YU1vZGVsLm5vZGVzLmZvckVhY2gobj0+e1xuICAgICAgICAgICAgYnlJZFtuLiRpZF0gPSBuO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5ub2Rlcy5mb3JFYWNoKChuLGkpPT57XG4gICAgICAgICAgICBpZihieUlkW24uJGlkXSl7XG4gICAgICAgICAgICAgICAgbi5sb2FkQ29tcHV0ZWRWYWx1ZXMoYnlJZFtuLiRpZF0uY29tcHV0ZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZGF0YU1vZGVsLmVkZ2VzLmZvckVhY2goZT0+e1xuICAgICAgICAgICAgYnlJZFtlLiRpZF0gPSBlO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5lZGdlcy5mb3JFYWNoKChlLGkpPT57XG4gICAgICAgICAgICBpZihieUlkW2UuJGlkXSl7XG4gICAgICAgICAgICAgICAgZS5sb2FkQ29tcHV0ZWRWYWx1ZXMoYnlJZFtlLiRpZF0uY29tcHV0ZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5leHByZXNzaW9uU2NvcGUgPSBkYXRhTW9kZWwuZXhwcmVzc2lvblNjb3BlO1xuICAgICAgICB0aGlzLiRjb2RlRXJyb3IgPSBkYXRhTW9kZWwuJGNvZGVFcnJvcjtcbiAgICAgICAgdGhpcy4kY29kZURpcnR5ID0gZGF0YU1vZGVsLiRjb2RlRGlydHk7XG4gICAgICAgIHRoaXMudmFsaWRhdGlvblJlc3VsdHMgID0gZGF0YU1vZGVsLnZhbGlkYXRpb25SZXN1bHRzO1xuICAgIH1cblxuICAgIGdldEdsb2JhbFZhcmlhYmxlTmFtZXMoZmlsdGVyRnVuY3Rpb24gPSB0cnVlKXtcbiAgICAgICAgdmFyIHJlcyA9IFtdO1xuICAgICAgICBVdGlscy5mb3JPd24odGhpcy5leHByZXNzaW9uU2NvcGUsICh2YWx1ZSwga2V5KT0+e1xuICAgICAgICAgICAgaWYoZmlsdGVyRnVuY3Rpb24gJiYgVXRpbHMuaXNGdW5jdGlvbih2YWx1ZSkpe1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcy5wdXNoKGtleSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIC8qY3JlYXRlIG5vZGUgZnJvbSBzZXJpYWxpemVkIGRhdGEqL1xuICAgIGNyZWF0ZU5vZGVGcm9tRGF0YShkYXRhLCBwYXJlbnQpIHtcbiAgICAgICAgdmFyIG5vZGUsIGxvY2F0aW9uO1xuXG4gICAgICAgIGlmKGRhdGEubG9jYXRpb24pe1xuICAgICAgICAgICAgbG9jYXRpb24gPSBuZXcgZG9tYWluLlBvaW50KGRhdGEubG9jYXRpb24ueCwgZGF0YS5sb2NhdGlvbi55KTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBsb2NhdGlvbiA9IG5ldyBkb21haW4uUG9pbnQoMCwwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkb21haW4uRGVjaXNpb25Ob2RlLiRUWVBFID09IGRhdGEudHlwZSkge1xuICAgICAgICAgICAgbm9kZSA9IG5ldyBkb21haW4uRGVjaXNpb25Ob2RlKGxvY2F0aW9uKTtcbiAgICAgICAgfSBlbHNlIGlmIChkb21haW4uQ2hhbmNlTm9kZS4kVFlQRSA9PSBkYXRhLnR5cGUpIHtcbiAgICAgICAgICAgIG5vZGUgPSBuZXcgZG9tYWluLkNoYW5jZU5vZGUobG9jYXRpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKGRvbWFpbi5UZXJtaW5hbE5vZGUuJFRZUEUgPT0gZGF0YS50eXBlKSB7XG4gICAgICAgICAgICBub2RlID0gbmV3IGRvbWFpbi5UZXJtaW5hbE5vZGUobG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGlmKGRhdGEuJGlkKXtcbiAgICAgICAgICAgIG5vZGUuJGlkID0gZGF0YS4kaWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYoZGF0YS4kZmllbGRTdGF0dXMpe1xuICAgICAgICAgICAgbm9kZS4kZmllbGRTdGF0dXMgPSBkYXRhLiRmaWVsZFN0YXR1cztcbiAgICAgICAgfVxuICAgICAgICBub2RlLm5hbWUgPSBkYXRhLm5hbWU7XG5cbiAgICAgICAgaWYoZGF0YS5jb2RlKXtcbiAgICAgICAgICAgIG5vZGUuY29kZSA9IGRhdGEuY29kZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGF0YS5leHByZXNzaW9uU2NvcGUpIHtcbiAgICAgICAgICAgIG5vZGUuZXhwcmVzc2lvblNjb3BlID0gZGF0YS5leHByZXNzaW9uU2NvcGVcbiAgICAgICAgfVxuICAgICAgICBpZihkYXRhLmNvbXB1dGVkKXtcbiAgICAgICAgICAgIG5vZGUubG9hZENvbXB1dGVkVmFsdWVzKGRhdGEuY29tcHV0ZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGVkZ2VPck5vZGUgPSB0aGlzLmFkZE5vZGUobm9kZSwgcGFyZW50KTtcbiAgICAgICAgZGF0YS5jaGlsZEVkZ2VzLmZvckVhY2goZWQ9PiB7XG4gICAgICAgICAgICB2YXIgZWRnZSA9IHRoaXMuY3JlYXRlTm9kZUZyb21EYXRhKGVkLmNoaWxkTm9kZSwgbm9kZSk7XG4gICAgICAgICAgICBpZihVdGlscy5pc0FycmF5KGVkLnBheW9mZikpe1xuICAgICAgICAgICAgICAgIGVkZ2UucGF5b2ZmID0gZWQucGF5b2ZmO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgZWRnZS5wYXlvZmYgPSBbZWQucGF5b2ZmLCAwXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWRnZS5wcm9iYWJpbGl0eSA9IGVkLnByb2JhYmlsaXR5O1xuICAgICAgICAgICAgZWRnZS5uYW1lID0gZWQubmFtZTtcbiAgICAgICAgICAgIGlmKGVkLmNvbXB1dGVkKXtcbiAgICAgICAgICAgICAgICBlZGdlLmxvYWRDb21wdXRlZFZhbHVlcyhlZC5jb21wdXRlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihlZC4kaWQpe1xuICAgICAgICAgICAgICAgIGVkZ2UuJGlkID0gZWQuJGlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZWQuJGZpZWxkU3RhdHVzKXtcbiAgICAgICAgICAgICAgICBlZGdlLiRmaWVsZFN0YXR1cyA9IGVkLiRmaWVsZFN0YXR1cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGVkZ2VPck5vZGU7XG4gICAgfVxuXG4gICAgLypyZXR1cm5zIG5vZGUgb3IgZWRnZSBmcm9tIHBhcmVudCB0byB0aGlzIG5vZGUqL1xuICAgIGFkZE5vZGUobm9kZSwgcGFyZW50KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5ub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgICAgICB2YXIgZWRnZSA9IHNlbGYuX2FkZENoaWxkKHBhcmVudCwgbm9kZSk7XG4gICAgICAgICAgICB0aGlzLl9maXJlTm9kZUFkZGVkQ2FsbGJhY2sobm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gZWRnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhub2RlKTtcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgLyppbmplY3RzIGdpdmVuIG5vZGUgaW50byBnaXZlbiBlZGdlKi9cbiAgICBpbmplY3ROb2RlKG5vZGUsIGVkZ2UpIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IGVkZ2UucGFyZW50Tm9kZTtcbiAgICAgICAgdmFyIGNoaWxkID0gZWRnZS5jaGlsZE5vZGU7XG4gICAgICAgIHRoaXMubm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgbm9kZS4kcGFyZW50ID0gcGFyZW50O1xuICAgICAgICBlZGdlLmNoaWxkTm9kZSA9IG5vZGU7XG4gICAgICAgIHRoaXMuX2FkZENoaWxkKG5vZGUsIGNoaWxkKTtcbiAgICAgICAgdGhpcy5fZmlyZU5vZGVBZGRlZENhbGxiYWNrKG5vZGUpO1xuICAgIH1cblxuICAgIF9hZGRDaGlsZChwYXJlbnQsIGNoaWxkKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGVkZ2UgPSBuZXcgZG9tYWluLkVkZ2UocGFyZW50LCBjaGlsZCk7XG4gICAgICAgIHNlbGYuX3NldEVkZ2VJbml0aWFsUHJvYmFiaWxpdHkoZWRnZSk7XG4gICAgICAgIHNlbGYuZWRnZXMucHVzaChlZGdlKTtcblxuICAgICAgICBwYXJlbnQuY2hpbGRFZGdlcy5wdXNoKGVkZ2UpO1xuICAgICAgICBjaGlsZC4kcGFyZW50ID0gcGFyZW50O1xuICAgICAgICByZXR1cm4gZWRnZTtcbiAgICB9XG5cbiAgICBfc2V0RWRnZUluaXRpYWxQcm9iYWJpbGl0eShlZGdlKSB7XG4gICAgICAgIGlmIChlZGdlLnBhcmVudE5vZGUgaW5zdGFuY2VvZiBkb21haW4uQ2hhbmNlTm9kZSkge1xuICAgICAgICAgICAgZWRnZS5wcm9iYWJpbGl0eSA9ICcjJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVkZ2UucHJvYmFiaWxpdHkgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8qcmVtb3ZlcyBnaXZlbiBub2RlIGFuZCBpdHMgc3VidHJlZSovXG4gICAgcmVtb3ZlTm9kZShub2RlLCAkbCA9IDApIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIG5vZGUuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PnNlbGYucmVtb3ZlTm9kZShlLmNoaWxkTm9kZSwgJGwgKyAxKSk7XG5cbiAgICAgICAgc2VsZi5fcmVtb3ZlTm9kZShub2RlKTtcbiAgICAgICAgdmFyIHBhcmVudCA9IG5vZGUuJHBhcmVudDtcbiAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgdmFyIHBhcmVudEVkZ2UgPSBVdGlscy5maW5kKHBhcmVudC5jaGlsZEVkZ2VzLCAoZSwgaSk9PiBlLmNoaWxkTm9kZSA9PT0gbm9kZSk7XG4gICAgICAgICAgICBpZiAoJGwgPT0gMCkge1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlRWRnZShwYXJlbnRFZGdlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fcmVtb3ZlRWRnZShwYXJlbnRFZGdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9maXJlTm9kZVJlbW92ZWRDYWxsYmFjayhub2RlKTtcbiAgICB9XG5cbiAgICAvKnJlbW92ZXMgZ2l2ZW4gbm9kZXMgYW5kIHRoZWlyIHN1YnRyZWVzKi9cbiAgICByZW1vdmVOb2Rlcyhub2Rlcykge1xuXG4gICAgICAgIHZhciByb290cyA9IHRoaXMuZmluZFN1YnRyZWVSb290cyhub2Rlcyk7XG4gICAgICAgIHJvb3RzLmZvckVhY2gobj0+dGhpcy5yZW1vdmVOb2RlKG4sIDApLCB0aGlzKTtcbiAgICB9XG5cbiAgICBjb252ZXJ0Tm9kZShub2RlLCB0eXBlVG9Db252ZXJ0VG8pe1xuICAgICAgICB2YXIgbmV3Tm9kZTtcbiAgICAgICAgaWYoIW5vZGUuY2hpbGRFZGdlcy5sZW5ndGggJiYgbm9kZS4kcGFyZW50KXtcbiAgICAgICAgICAgIG5ld05vZGUgPSB0aGlzLmNyZWF0ZU5vZGVCeVR5cGUodHlwZVRvQ29udmVydFRvLCBub2RlLmxvY2F0aW9uKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBpZihub2RlIGluc3RhbmNlb2YgZG9tYWluLkRlY2lzaW9uTm9kZSAmJiB0eXBlVG9Db252ZXJ0VG89PWRvbWFpbi5DaGFuY2VOb2RlLiRUWVBFKXtcbiAgICAgICAgICAgICAgICBuZXdOb2RlID0gdGhpcy5jcmVhdGVOb2RlQnlUeXBlKHR5cGVUb0NvbnZlcnRUbywgbm9kZS5sb2NhdGlvbik7XG4gICAgICAgICAgICB9ZWxzZSBpZih0eXBlVG9Db252ZXJ0VG89PWRvbWFpbi5EZWNpc2lvbk5vZGUuJFRZUEUpe1xuICAgICAgICAgICAgICAgIG5ld05vZGUgPSB0aGlzLmNyZWF0ZU5vZGVCeVR5cGUodHlwZVRvQ29udmVydFRvLCBub2RlLmxvY2F0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmKG5ld05vZGUpe1xuICAgICAgICAgICAgbmV3Tm9kZS5uYW1lPW5vZGUubmFtZTtcbiAgICAgICAgICAgIHRoaXMucmVwbGFjZU5vZGUobmV3Tm9kZSwgbm9kZSk7XG4gICAgICAgICAgICBuZXdOb2RlLmNoaWxkRWRnZXMuZm9yRWFjaChlPT50aGlzLl9zZXRFZGdlSW5pdGlhbFByb2JhYmlsaXR5KGUpKTtcbiAgICAgICAgICAgIHRoaXMuX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhuZXdOb2RlKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgY3JlYXRlTm9kZUJ5VHlwZSh0eXBlLCBsb2NhdGlvbil7XG4gICAgICAgIGlmKHR5cGU9PWRvbWFpbi5EZWNpc2lvbk5vZGUuJFRZUEUpe1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBkb21haW4uRGVjaXNpb25Ob2RlKGxvY2F0aW9uKVxuICAgICAgICB9ZWxzZSBpZih0eXBlPT1kb21haW4uQ2hhbmNlTm9kZS4kVFlQRSl7XG4gICAgICAgICAgICByZXR1cm4gbmV3IGRvbWFpbi5DaGFuY2VOb2RlKGxvY2F0aW9uKVxuICAgICAgICB9ZWxzZSBpZih0eXBlPT1kb21haW4uVGVybWluYWxOb2RlLiRUWVBFKXtcbiAgICAgICAgICAgIHJldHVybiBuZXcgZG9tYWluLlRlcm1pbmFsTm9kZShsb2NhdGlvbilcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlcGxhY2VOb2RlKG5ld05vZGUsIG9sZE5vZGUpe1xuICAgICAgICB2YXIgcGFyZW50ID0gb2xkTm9kZS4kcGFyZW50O1xuICAgICAgICBuZXdOb2RlLiRwYXJlbnQgPSBwYXJlbnQ7XG5cbiAgICAgICAgaWYocGFyZW50KXtcbiAgICAgICAgICAgIHZhciBwYXJlbnRFZGdlID0gVXRpbHMuZmluZChuZXdOb2RlLiRwYXJlbnQuY2hpbGRFZGdlcywgZT0+ZS5jaGlsZE5vZGU9PT1vbGROb2RlKTtcbiAgICAgICAgICAgIHBhcmVudEVkZ2UuY2hpbGROb2RlID0gbmV3Tm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5ld05vZGUuY2hpbGRFZGdlcyA9IG9sZE5vZGUuY2hpbGRFZGdlcztcbiAgICAgICAgbmV3Tm9kZS5jaGlsZEVkZ2VzLmZvckVhY2goZT0+ZS5wYXJlbnROb2RlPW5ld05vZGUpO1xuXG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMubm9kZXMuaW5kZXhPZihvbGROb2RlKTtcbiAgICAgICAgaWYofmluZGV4KXtcbiAgICAgICAgICAgIHRoaXMubm9kZXNbaW5kZXhdPW5ld05vZGU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRSb290cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZXMuZmlsdGVyKG49PiFuLiRwYXJlbnQpO1xuICAgIH1cblxuICAgIGZpbmRTdWJ0cmVlUm9vdHMobm9kZXMpIHtcbiAgICAgICAgcmV0dXJuIG5vZGVzLmZpbHRlcihuPT4hbi4kcGFyZW50IHx8IG5vZGVzLmluZGV4T2Yobi4kcGFyZW50KSA9PT0gLTEpO1xuICAgIH1cblxuICAgIC8qY3JlYXRlcyBkZXRhY2hlZCBjbG9uZSBvZiBnaXZlbiBub2RlKi9cbiAgICBjbG9uZVN1YnRyZWUobm9kZVRvQ29weSwgY2xvbmVDb21wdXRlZFZhbHVlcykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBjbG9uZSA9IHRoaXMuY2xvbmVOb2RlKG5vZGVUb0NvcHkpO1xuXG4gICAgICAgIG5vZGVUb0NvcHkuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PiB7XG4gICAgICAgICAgICB2YXIgY2hpbGRDbG9uZSA9IHNlbGYuY2xvbmVTdWJ0cmVlKGUuY2hpbGROb2RlLCBjbG9uZUNvbXB1dGVkVmFsdWVzKTtcbiAgICAgICAgICAgIGNoaWxkQ2xvbmUuJHBhcmVudCA9IGNsb25lO1xuICAgICAgICAgICAgdmFyIGVkZ2UgPSBuZXcgZG9tYWluLkVkZ2UoY2xvbmUsIGNoaWxkQ2xvbmUsIGUubmFtZSwgVXRpbHMuY2xvbmVEZWVwKGUucGF5b2ZmKSwgZS5wcm9iYWJpbGl0eSk7XG4gICAgICAgICAgICBpZiAoY2xvbmVDb21wdXRlZFZhbHVlcykge1xuICAgICAgICAgICAgICAgIGVkZ2UuY29tcHV0ZWQgPSBVdGlscy5jbG9uZURlZXAoZS5jb21wdXRlZCk7XG4gICAgICAgICAgICAgICAgY2hpbGRDbG9uZS5jb21wdXRlZCA9IFV0aWxzLmNsb25lRGVlcChlLmNoaWxkTm9kZS5jb21wdXRlZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNsb25lLmNoaWxkRWRnZXMucHVzaChlZGdlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChjbG9uZUNvbXB1dGVkVmFsdWVzKSB7XG4gICAgICAgICAgICBjbG9uZS5jb21wdXRlZCA9IFV0aWxzLmNsb25lRGVlcChub2RlVG9Db3B5LmNvbXB1dGVkKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjbG9uZTtcbiAgICB9XG5cbiAgICAvKmF0dGFjaGVzIGRldGFjaGVkIHN1YnRyZWUgdG8gZ2l2ZW4gcGFyZW50Ki9cbiAgICBhdHRhY2hTdWJ0cmVlKG5vZGVUb0F0dGFjaCwgcGFyZW50KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG5vZGVPckVkZ2UgPSBzZWxmLmFkZE5vZGUobm9kZVRvQXR0YWNoLCBwYXJlbnQpO1xuXG4gICAgICAgIHZhciBjaGlsZEVkZ2VzID0gc2VsZi5nZXRBbGxEZXNjZW5kYW50RWRnZXMobm9kZVRvQXR0YWNoKTtcbiAgICAgICAgY2hpbGRFZGdlcy5mb3JFYWNoKGU9PiB7XG4gICAgICAgICAgICBzZWxmLmVkZ2VzLnB1c2goZSk7XG4gICAgICAgICAgICBzZWxmLm5vZGVzLnB1c2goZS5jaGlsZE5vZGUpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbm9kZU9yRWRnZTtcbiAgICB9XG5cbiAgICBjbG9uZU5vZGVzKG5vZGVzKSB7XG4gICAgICAgIHZhciByb290cyA9IFtdXG4gICAgICAgIC8vVE9ET1xuICAgIH1cblxuICAgIC8qc2hhbGxvdyBjbG9uZSB3aXRob3V0IHBhcmVudCBhbmQgY2hpbGRyZW4qL1xuICAgIGNsb25lTm9kZShub2RlKSB7XG4gICAgICAgIHZhciBjbG9uZSA9IFV0aWxzLmNsb25lKG5vZGUpXG4gICAgICAgIGNsb25lLiRpZCA9IFV0aWxzLmd1aWQoKTtcbiAgICAgICAgY2xvbmUubG9jYXRpb24gPSBVdGlscy5jbG9uZShub2RlLmxvY2F0aW9uKTtcbiAgICAgICAgY2xvbmUuY29tcHV0ZWQgPSBVdGlscy5jbG9uZShub2RlLmNvbXB1dGVkKTtcbiAgICAgICAgY2xvbmUuJHBhcmVudCA9IG51bGw7XG4gICAgICAgIGNsb25lLmNoaWxkRWRnZXMgPSBbXTtcbiAgICAgICAgcmV0dXJuIGNsb25lO1xuICAgIH1cblxuICAgIGZpbmROb2RlQnlJZChpZCkge1xuICAgICAgICByZXR1cm4gVXRpbHMuZmluZCh0aGlzLm5vZGVzLCBuPT5uLiRpZCA9PSBpZCk7XG4gICAgfVxuXG4gICAgZmluZEVkZ2VCeUlkKGlkKSB7XG4gICAgICAgIHJldHVybiBVdGlscy5maW5kKHRoaXMuZWRnZXMsIGU9PmUuJGlkID09IGlkKTtcbiAgICB9XG5cbiAgICBmaW5kQnlJZChpZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZmluZE5vZGVCeUlkKGlkKTtcbiAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmZpbmRFZGdlQnlJZChpZCk7XG4gICAgfVxuXG4gICAgX3JlbW92ZU5vZGUobm9kZSkgey8vIHNpbXBseSByZW1vdmVzIG5vZGUgZnJvbSBub2RlIGxpc3RcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5ub2Rlcy5pbmRleE9mKG5vZGUpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5ub2Rlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVtb3ZlRWRnZShlZGdlKSB7XG4gICAgICAgIHZhciBpbmRleCA9IGVkZ2UucGFyZW50Tm9kZS5jaGlsZEVkZ2VzLmluZGV4T2YoZWRnZSk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICBlZGdlLnBhcmVudE5vZGUuY2hpbGRFZGdlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3JlbW92ZUVkZ2UoZWRnZSk7XG4gICAgfVxuXG4gICAgX3JlbW92ZUVkZ2UoZWRnZSkgeyAvL3JlbW92ZXMgZWRnZSBmcm9tIGVkZ2UgbGlzdCB3aXRob3V0IHJlbW92aW5nIGNvbm5lY3RlZCBub2Rlc1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmVkZ2VzLmluZGV4T2YoZWRnZSk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICB0aGlzLmVkZ2VzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfcmVtb3ZlTm9kZXMobm9kZXNUb1JlbW92ZSkge1xuICAgICAgICB0aGlzLm5vZGVzID0gdGhpcy5ub2Rlcy5maWx0ZXIobj0+bm9kZXNUb1JlbW92ZS5pbmRleE9mKG4pID09PSAtMSk7XG4gICAgfVxuXG4gICAgX3JlbW92ZUVkZ2VzKGVkZ2VzVG9SZW1vdmUpIHtcbiAgICAgICAgdGhpcy5lZGdlcyA9IHRoaXMuZWRnZXMuZmlsdGVyKGU9PmVkZ2VzVG9SZW1vdmUuaW5kZXhPZihlKSA9PT0gLTEpO1xuICAgIH1cblxuICAgIGdldEFsbERlc2NlbmRhbnRFZGdlcyhub2RlKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIG5vZGUuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PiB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChlKTtcbiAgICAgICAgICAgIGlmIChlLmNoaWxkTm9kZSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKC4uLnNlbGYuZ2V0QWxsRGVzY2VuZGFudEVkZ2VzKGUuY2hpbGROb2RlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZ2V0QWxsRGVzY2VuZGFudE5vZGVzKG5vZGUpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG5cbiAgICAgICAgbm9kZS5jaGlsZEVkZ2VzLmZvckVhY2goZT0+IHtcbiAgICAgICAgICAgIGlmIChlLmNoaWxkTm9kZSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGUuY2hpbGROb2RlKTtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCguLi5zZWxmLmdldEFsbERlc2NlbmRhbnROb2RlcyhlLmNoaWxkTm9kZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGdldEFsbE5vZGVzSW5TdWJ0cmVlKG5vZGUpIHtcbiAgICAgICAgdmFyIGRlc2NlbmRhbnRzID0gdGhpcy5nZXRBbGxEZXNjZW5kYW50Tm9kZXMobm9kZSk7XG4gICAgICAgIGRlc2NlbmRhbnRzLnVuc2hpZnQobm9kZSk7XG4gICAgICAgIHJldHVybiBkZXNjZW5kYW50cztcbiAgICB9XG5cbiAgICBpc1VuZG9BdmFpbGFibGUoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMudW5kb1N0YWNrLmxlbmd0aFxuICAgIH1cblxuICAgIGlzUmVkb0F2YWlsYWJsZSgpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5yZWRvU3RhY2subGVuZ3RoXG4gICAgfVxuXG4gICAgY3JlYXRlU3RhdGVTbmFwc2hvdChyZXZlcnRDb25mKXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJldmVydENvbmY6IHJldmVydENvbmYsXG4gICAgICAgICAgICBub2RlczogVXRpbHMuY2xvbmVEZWVwKHRoaXMubm9kZXMpLFxuICAgICAgICAgICAgZWRnZXM6IFV0aWxzLmNsb25lRGVlcCh0aGlzLmVkZ2VzKSxcbiAgICAgICAgICAgIHRleHRzOiBVdGlscy5jbG9uZURlZXAodGhpcy50ZXh0cyksXG4gICAgICAgICAgICBwYXlvZmZOYW1lczogVXRpbHMuY2xvbmVEZWVwKHRoaXMucGF5b2ZmTmFtZXMpLFxuICAgICAgICAgICAgZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQ6IFV0aWxzLmNsb25lRGVlcCh0aGlzLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0KSxcbiAgICAgICAgICAgIHdlaWdodExvd2VyQm91bmQ6IFV0aWxzLmNsb25lRGVlcCh0aGlzLndlaWdodExvd2VyQm91bmQpLFxuICAgICAgICAgICAgd2VpZ2h0VXBwZXJCb3VuZDogVXRpbHMuY2xvbmVEZWVwKHRoaXMud2VpZ2h0VXBwZXJCb3VuZCksXG4gICAgICAgICAgICBleHByZXNzaW9uU2NvcGU6IFV0aWxzLmNsb25lRGVlcCh0aGlzLmV4cHJlc3Npb25TY29wZSksXG4gICAgICAgICAgICBjb2RlOiB0aGlzLmNvZGUsXG4gICAgICAgICAgICAkY29kZUVycm9yOiB0aGlzLiRjb2RlRXJyb3JcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgc2F2ZVN0YXRlRnJvbVNuYXBzaG90KHN0YXRlKXtcbiAgICAgICAgdGhpcy5yZWRvU3RhY2subGVuZ3RoID0gMDtcblxuICAgICAgICB0aGlzLl9wdXNoVG9TdGFjayh0aGlzLnVuZG9TdGFjaywgc3RhdGUpO1xuXG4gICAgICAgIHRoaXMuX2ZpcmVVbmRvUmVkb0NhbGxiYWNrKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2F2ZVN0YXRlKHJldmVydENvbmYpIHtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGVGcm9tU25hcHNob3QodGhpcy5jcmVhdGVTdGF0ZVNuYXBzaG90KHJldmVydENvbmYpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdW5kbygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgbmV3U3RhdGUgPSB0aGlzLnVuZG9TdGFjay5wb3AoKTtcbiAgICAgICAgaWYgKCFuZXdTdGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcHVzaFRvU3RhY2sodGhpcy5yZWRvU3RhY2ssIHtcbiAgICAgICAgICAgIHJldmVydENvbmY6IG5ld1N0YXRlLnJldmVydENvbmYsXG4gICAgICAgICAgICBub2Rlczogc2VsZi5ub2RlcyxcbiAgICAgICAgICAgIGVkZ2VzOiBzZWxmLmVkZ2VzLFxuICAgICAgICAgICAgdGV4dHM6IHNlbGYudGV4dHMsXG4gICAgICAgICAgICBwYXlvZmZOYW1lczogc2VsZi5wYXlvZmZOYW1lcyxcbiAgICAgICAgICAgIGRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0OiBzZWxmLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0LFxuICAgICAgICAgICAgd2VpZ2h0TG93ZXJCb3VuZDogc2VsZi53ZWlnaHRMb3dlckJvdW5kLFxuICAgICAgICAgICAgd2VpZ2h0VXBwZXJCb3VuZDogc2VsZi53ZWlnaHRVcHBlckJvdW5kLFxuICAgICAgICAgICAgZXhwcmVzc2lvblNjb3BlOiBzZWxmLmV4cHJlc3Npb25TY29wZSxcbiAgICAgICAgICAgIGNvZGU6IHNlbGYuY29kZSxcbiAgICAgICAgICAgICRjb2RlRXJyb3I6IHNlbGYuJGNvZGVFcnJvclxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX3NldE5ld1N0YXRlKG5ld1N0YXRlKTtcblxuICAgICAgICB0aGlzLl9maXJlVW5kb1JlZG9DYWxsYmFjaygpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJlZG8oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG5ld1N0YXRlID0gdGhpcy5yZWRvU3RhY2sucG9wKCk7XG4gICAgICAgIGlmICghbmV3U3RhdGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3B1c2hUb1N0YWNrKHRoaXMudW5kb1N0YWNrLCB7XG4gICAgICAgICAgICByZXZlcnRDb25mOiBuZXdTdGF0ZS5yZXZlcnRDb25mLFxuICAgICAgICAgICAgbm9kZXM6IHNlbGYubm9kZXMsXG4gICAgICAgICAgICBlZGdlczogc2VsZi5lZGdlcyxcbiAgICAgICAgICAgIHRleHRzOiBzZWxmLnRleHRzLFxuICAgICAgICAgICAgcGF5b2ZmTmFtZXM6IHNlbGYucGF5b2ZmTmFtZXMsXG4gICAgICAgICAgICBkZWZhdWx0Q3JpdGVyaW9uMVdlaWdodDogc2VsZi5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCxcbiAgICAgICAgICAgIHdlaWdodExvd2VyQm91bmQ6IHNlbGYud2VpZ2h0TG93ZXJCb3VuZCxcbiAgICAgICAgICAgIHdlaWdodFVwcGVyQm91bmQ6IHNlbGYud2VpZ2h0VXBwZXJCb3VuZCxcbiAgICAgICAgICAgIGV4cHJlc3Npb25TY29wZTogc2VsZi5leHByZXNzaW9uU2NvcGUsXG4gICAgICAgICAgICBjb2RlOiBzZWxmLmNvZGUsXG4gICAgICAgICAgICAkY29kZUVycm9yOiBzZWxmLiRjb2RlRXJyb3JcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5fc2V0TmV3U3RhdGUobmV3U3RhdGUsIHRydWUpO1xuXG4gICAgICAgIHRoaXMuX2ZpcmVVbmRvUmVkb0NhbGxiYWNrKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMubm9kZXMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5lZGdlcy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLnVuZG9TdGFjay5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLnJlZG9TdGFjay5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLnRleHRzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuY2xlYXJFeHByZXNzaW9uU2NvcGUoKTtcbiAgICAgICAgdGhpcy5jb2RlID0gJyc7XG4gICAgICAgIHRoaXMuJGNvZGVFcnJvciA9IG51bGw7XG4gICAgICAgIHRoaXMuJGNvZGVEaXJ0eSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMucGF5b2ZmTmFtZXMgPSBbXTtcbiAgICAgICAgdGhpcy5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCA9IDE7XG4gICAgICAgIHRoaXMud2VpZ2h0TG93ZXJCb3VuZCA9IDA7XG4gICAgICAgIHRoaXMud2VpZ2h0VXBwZXJCb3VuZCA9IEluZmluaXR5O1xuICAgIH1cblxuICAgIGFkZFRleHQodGV4dCkge1xuICAgICAgICB0aGlzLnRleHRzLnB1c2godGV4dCk7XG5cbiAgICAgICAgdGhpcy5fZmlyZVRleHRBZGRlZENhbGxiYWNrKHRleHQpO1xuICAgIH1cblxuICAgIHJlbW92ZVRleHRzKHRleHRzKSB7XG4gICAgICAgIHRleHRzLmZvckVhY2godD0+dGhpcy5yZW1vdmVUZXh0KHQpKTtcbiAgICB9XG5cbiAgICByZW1vdmVUZXh0KHRleHQpIHtcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy50ZXh0cy5pbmRleE9mKHRleHQpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdGhpcy50ZXh0cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgdGhpcy5fZmlyZVRleHRSZW1vdmVkQ2FsbGJhY2sodGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbGVhckV4cHJlc3Npb25TY29wZSgpIHtcbiAgICAgICAgVXRpbHMuZm9yT3duKHRoaXMuZXhwcmVzc2lvblNjb3BlLCAodmFsdWUsIGtleSk9PiB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5leHByZXNzaW9uU2NvcGVba2V5XTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV2ZXJzZVBheW9mZnMoKXtcbiAgICAgICAgdGhpcy5wYXlvZmZOYW1lcy5yZXZlcnNlKCk7XG4gICAgICAgIHRoaXMuZWRnZXMuZm9yRWFjaChlPT5lLnBheW9mZi5yZXZlcnNlKCkpXG4gICAgfVxuXG4gICAgX3NldE5ld1N0YXRlKG5ld1N0YXRlLCByZWRvKSB7XG4gICAgICAgIHZhciBub2RlQnlJZCA9IFV0aWxzLmdldE9iamVjdEJ5SWRNYXAobmV3U3RhdGUubm9kZXMpO1xuICAgICAgICB2YXIgZWRnZUJ5SWQgPSBVdGlscy5nZXRPYmplY3RCeUlkTWFwKG5ld1N0YXRlLmVkZ2VzKTtcbiAgICAgICAgdGhpcy5ub2RlcyA9IG5ld1N0YXRlLm5vZGVzO1xuICAgICAgICB0aGlzLmVkZ2VzID0gbmV3U3RhdGUuZWRnZXM7XG4gICAgICAgIHRoaXMudGV4dHMgPSBuZXdTdGF0ZS50ZXh0cztcbiAgICAgICAgdGhpcy5wYXlvZmZOYW1lcyA9IG5ld1N0YXRlLnBheW9mZk5hbWVzO1xuICAgICAgICB0aGlzLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0ID0gbmV3U3RhdGUuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQ7XG4gICAgICAgIHRoaXMud2VpZ2h0TG93ZXJCb3VuZCA9IG5ld1N0YXRlLndlaWdodExvd2VyQm91bmQ7XG4gICAgICAgIHRoaXMud2VpZ2h0VXBwZXJCb3VuZCA9IG5ld1N0YXRlLndlaWdodFVwcGVyQm91bmQ7XG4gICAgICAgIHRoaXMuZXhwcmVzc2lvblNjb3BlID0gbmV3U3RhdGUuZXhwcmVzc2lvblNjb3BlO1xuICAgICAgICB0aGlzLmNvZGUgPSBuZXdTdGF0ZS5jb2RlO1xuICAgICAgICB0aGlzLiRjb2RlRXJyb3IgID0gbmV3U3RhdGUuJGNvZGVFcnJvclxuXG4gICAgICAgIHRoaXMubm9kZXMuZm9yRWFjaChuPT4ge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuLmNoaWxkRWRnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZWRnZSA9IGVkZ2VCeUlkW24uY2hpbGRFZGdlc1tpXS4kaWRdO1xuICAgICAgICAgICAgICAgIG4uY2hpbGRFZGdlc1tpXSA9IGVkZ2U7XG4gICAgICAgICAgICAgICAgZWRnZS5wYXJlbnROb2RlID0gbjtcbiAgICAgICAgICAgICAgICBlZGdlLmNoaWxkTm9kZSA9IG5vZGVCeUlkW2VkZ2UuY2hpbGROb2RlLiRpZF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKG5ld1N0YXRlLnJldmVydENvbmYpIHtcbiAgICAgICAgICAgIGlmICghcmVkbyAmJiBuZXdTdGF0ZS5yZXZlcnRDb25mLm9uVW5kbykge1xuICAgICAgICAgICAgICAgIG5ld1N0YXRlLnJldmVydENvbmYub25VbmRvKG5ld1N0YXRlLnJldmVydENvbmYuZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVkbyAmJiBuZXdTdGF0ZS5yZXZlcnRDb25mLm9uUmVkbykge1xuICAgICAgICAgICAgICAgIG5ld1N0YXRlLnJldmVydENvbmYub25SZWRvKG5ld1N0YXRlLnJldmVydENvbmYuZGF0YSk7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICB9XG4gICAgICAgIHRoaXMucmV2ZXJ0Q29uZiA9IG5ld1N0YXRlLnJldmVydENvbmY7XG4gICAgfVxuXG5cbiAgICBfcHVzaFRvU3RhY2soc3RhY2ssIG9iaikge1xuICAgICAgICBpZiAoc3RhY2subGVuZ3RoID49IHRoaXMubWF4U3RhY2tTaXplKSB7XG4gICAgICAgICAgICBzdGFjay5zaGlmdCgpO1xuICAgICAgICB9XG4gICAgICAgIHN0YWNrLnB1c2gob2JqKTtcbiAgICB9XG5cbiAgICBfZmlyZVVuZG9SZWRvQ2FsbGJhY2soKSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLnVuZG9SZWRvU3RhdGVDaGFuZ2VkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMudW5kb1JlZG9TdGF0ZUNoYW5nZWRDYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhub2RlKSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLm5vZGVBZGRlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLm5vZGVBZGRlZENhbGxiYWNrKG5vZGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpcmVOb2RlUmVtb3ZlZENhbGxiYWNrKG5vZGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc0Rpc2FibGVkICYmIHRoaXMubm9kZVJlbW92ZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy5ub2RlUmVtb3ZlZENhbGxiYWNrKG5vZGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpcmVUZXh0QWRkZWRDYWxsYmFjayh0ZXh0KSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLnRleHRBZGRlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLnRleHRBZGRlZENhbGxiYWNrKHRleHQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpcmVUZXh0UmVtb3ZlZENhbGxiYWNrKHRleHQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc0Rpc2FibGVkICYmIHRoaXMudGV4dFJlbW92ZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy50ZXh0UmVtb3ZlZENhbGxiYWNrKHRleHQpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHtPYmplY3RXaXRoQ29tcHV0ZWRWYWx1ZXN9IGZyb20gXCIuL29iamVjdC13aXRoLWNvbXB1dGVkLXZhbHVlc1wiO1xuXG5leHBvcnQgY2xhc3MgRWRnZSBleHRlbmRzIE9iamVjdFdpdGhDb21wdXRlZFZhbHVlcyB7XG4gICAgcGFyZW50Tm9kZTtcbiAgICBjaGlsZE5vZGU7XG5cbiAgICBuYW1lID0gJyc7XG4gICAgcHJvYmFiaWxpdHkgPSB1bmRlZmluZWQ7XG4gICAgcGF5b2ZmID0gWzAsIDBdO1xuXG4gICAgJERJU1BMQVlfVkFMVUVfTkFNRVMgPSBbJ3Byb2JhYmlsaXR5JywgJ3BheW9mZicsICdvcHRpbWFsJ107XG5cbiAgICBjb25zdHJ1Y3RvcihwYXJlbnROb2RlLCBjaGlsZE5vZGUsIG5hbWUsIHBheW9mZiwgcHJvYmFiaWxpdHksKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMucGFyZW50Tm9kZSA9IHBhcmVudE5vZGU7XG4gICAgICAgIHRoaXMuY2hpbGROb2RlID0gY2hpbGROb2RlO1xuXG4gICAgICAgIGlmIChuYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByb2JhYmlsaXR5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMucHJvYmFiaWxpdHkgPSBwcm9iYWJpbGl0eTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGF5b2ZmICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMucGF5b2ZmID0gcGF5b2ZmXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHNldE5hbWUobmFtZSkge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXRQcm9iYWJpbGl0eShwcm9iYWJpbGl0eSkge1xuICAgICAgICB0aGlzLnByb2JhYmlsaXR5ID0gcHJvYmFiaWxpdHk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldFBheW9mZihwYXlvZmYsIGluZGV4ID0gMCkge1xuICAgICAgICB0aGlzLnBheW9mZltpbmRleF0gPSBwYXlvZmY7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNvbXB1dGVkQmFzZVByb2JhYmlsaXR5KHZhbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb21wdXRlZFZhbHVlKG51bGwsICdwcm9iYWJpbGl0eScsIHZhbCk7XG4gICAgfVxuXG4gICAgY29tcHV0ZWRCYXNlUGF5b2ZmKHZhbCwgaW5kZXggPSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVkVmFsdWUobnVsbCwgJ3BheW9mZlsnICsgaW5kZXggKyAnXScsIHZhbCk7XG4gICAgfVxuXG4gICAgZGlzcGxheVByb2JhYmlsaXR5KHZhbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kaXNwbGF5VmFsdWUoJ3Byb2JhYmlsaXR5JywgdmFsKTtcbiAgICB9XG5cbiAgICBkaXNwbGF5UGF5b2ZmKHZhbCwgaW5kZXggPSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRpc3BsYXlWYWx1ZSgncGF5b2ZmWycgKyBpbmRleCArICddJywgdmFsKTtcbiAgICB9XG59XG4iLCJleHBvcnQgKiBmcm9tICcuL25vZGUvbm9kZSdcbmV4cG9ydCAqIGZyb20gJy4vbm9kZS9kZWNpc2lvbi1ub2RlJ1xuZXhwb3J0ICogZnJvbSAnLi9ub2RlL2NoYW5jZS1ub2RlJ1xuZXhwb3J0ICogZnJvbSAnLi9ub2RlL3Rlcm1pbmFsLW5vZGUnXG5leHBvcnQgKiBmcm9tICcuL2VkZ2UnXG5leHBvcnQgKiBmcm9tICcuL3BvaW50J1xuZXhwb3J0ICogZnJvbSAnLi90ZXh0J1xuIiwiaW1wb3J0IHtOb2RlfSBmcm9tICcuL25vZGUnXG5cbmV4cG9ydCBjbGFzcyBDaGFuY2VOb2RlIGV4dGVuZHMgTm9kZXtcblxuICAgIHN0YXRpYyAkVFlQRSA9ICdjaGFuY2UnO1xuXG4gICAgY29uc3RydWN0b3IobG9jYXRpb24pe1xuICAgICAgICBzdXBlcihDaGFuY2VOb2RlLiRUWVBFLCBsb2NhdGlvbik7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtOb2RlfSBmcm9tICcuL25vZGUnXG5cbmV4cG9ydCBjbGFzcyBEZWNpc2lvbk5vZGUgZXh0ZW5kcyBOb2Rle1xuXG4gICAgc3RhdGljICRUWVBFID0gJ2RlY2lzaW9uJztcblxuICAgIGNvbnN0cnVjdG9yKGxvY2F0aW9uKXtcbiAgICAgICAgc3VwZXIoRGVjaXNpb25Ob2RlLiRUWVBFLCBsb2NhdGlvbik7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtQb2ludH0gZnJvbSAnLi4vcG9pbnQnXG5pbXBvcnQge09iamVjdFdpdGhDb21wdXRlZFZhbHVlc30gZnJvbSAnLi4vb2JqZWN0LXdpdGgtY29tcHV0ZWQtdmFsdWVzJ1xuXG5leHBvcnQgY2xhc3MgTm9kZSBleHRlbmRzIE9iamVjdFdpdGhDb21wdXRlZFZhbHVlc3tcblxuICAgIHR5cGU7XG4gICAgY2hpbGRFZGdlcz1bXTtcbiAgICBuYW1lPScnO1xuXG4gICAgbG9jYXRpb247IC8vUG9pbnRcblxuICAgIGNvZGU9Jyc7XG4gICAgJGNvZGVEaXJ0eSA9IGZhbHNlOyAvLyBpcyBjb2RlIGNoYW5nZWQgd2l0aG91dCByZWV2YWx1YXRpb24/XG4gICAgJGNvZGVFcnJvciA9IG51bGw7IC8vY29kZSBldmFsdWF0aW9uIGVycm9yc1xuXG4gICAgZXhwcmVzc2lvblNjb3BlPW51bGw7XG5cbiAgICAkRElTUExBWV9WQUxVRV9OQU1FUyA9IFsnY2hpbGRyZW5QYXlvZmYnLCAnYWdncmVnYXRlZFBheW9mZicsICdwcm9iYWJpbGl0eVRvRW50ZXInLCAnb3B0aW1hbCddXG5cbiAgICBjb25zdHJ1Y3Rvcih0eXBlLCBsb2NhdGlvbil7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMubG9jYXRpb249bG9jYXRpb247XG4gICAgICAgIGlmKCFsb2NhdGlvbil7XG4gICAgICAgICAgICB0aGlzLmxvY2F0aW9uID0gbmV3IFBvaW50KDAsMCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50eXBlPXR5cGU7XG4gICAgfVxuXG4gICAgc2V0TmFtZShuYW1lKXtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbW92ZVRvKHgseSwgd2l0aENoaWxkcmVuKXsgLy9tb3ZlIHRvIG5ldyBsb2NhdGlvblxuICAgICAgICBpZih3aXRoQ2hpbGRyZW4pe1xuICAgICAgICAgICAgdmFyIGR4ID0geC10aGlzLmxvY2F0aW9uLng7XG4gICAgICAgICAgICB2YXIgZHkgPSB5LXRoaXMubG9jYXRpb24ueTtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PmUuY2hpbGROb2RlLm1vdmUoZHgsIGR5LCB0cnVlKSlcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubG9jYXRpb24ubW92ZVRvKHgseSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIG1vdmUoZHgsIGR5LCB3aXRoQ2hpbGRyZW4peyAvL21vdmUgYnkgdmVjdG9yXG4gICAgICAgIGlmKHdpdGhDaGlsZHJlbil7XG4gICAgICAgICAgICB0aGlzLmNoaWxkRWRnZXMuZm9yRWFjaChlPT5lLmNoaWxkTm9kZS5tb3ZlKGR4LCBkeSwgdHJ1ZSkpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sb2NhdGlvbi5tb3ZlKGR4LCBkeSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cbiIsImltcG9ydCB7Tm9kZX0gZnJvbSAnLi9ub2RlJ1xuXG5leHBvcnQgY2xhc3MgVGVybWluYWxOb2RlIGV4dGVuZHMgTm9kZXtcblxuICAgIHN0YXRpYyAkVFlQRSA9ICd0ZXJtaW5hbCc7XG5cbiAgICBjb25zdHJ1Y3Rvcihsb2NhdGlvbil7XG4gICAgICAgIHN1cGVyKFRlcm1pbmFsTm9kZS4kVFlQRSwgbG9jYXRpb24pO1xuICAgIH1cbn1cbiIsImltcG9ydCB7VXRpbHN9IGZyb20gJ3NkLXV0aWxzJ1xuXG5pbXBvcnQge09iamVjdFdpdGhJZEFuZEVkaXRhYmxlRmllbGRzfSBmcm9tIFwiLi9vYmplY3Qtd2l0aC1pZC1hbmQtZWRpdGFibGUtZmllbGRzXCI7XG5cbmV4cG9ydCBjbGFzcyBPYmplY3RXaXRoQ29tcHV0ZWRWYWx1ZXMgZXh0ZW5kcyBPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkc3tcblxuICAgIGNvbXB1dGVkPXt9OyAvL2NvbXB1dGVkIHZhbHVlc1xuXG4gICAgLypnZXQgb3Igc2V0IGNvbXB1dGVkIHZhbHVlKi9cbiAgICBjb21wdXRlZFZhbHVlKHJ1bGVOYW1lLCBmaWVsZFBhdGgsIHZhbHVlKXtcbiAgICAgICAgdmFyIHBhdGggPSAnY29tcHV0ZWQuJztcbiAgICAgICAgaWYocnVsZU5hbWUpe1xuICAgICAgICAgICAgcGF0aCs9cnVsZU5hbWUrJy4nO1xuICAgICAgICB9XG4gICAgICAgIHBhdGgrPWZpZWxkUGF0aDtcbiAgICAgICAgaWYodmFsdWU9PT11bmRlZmluZWQpe1xuICAgICAgICAgICAgcmV0dXJuICBVdGlscy5nZXQodGhpcywgcGF0aCwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgVXRpbHMuc2V0KHRoaXMsIHBhdGgsIHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIGNsZWFyQ29tcHV0ZWRWYWx1ZXMocnVsZU5hbWUpe1xuICAgICAgICBpZihydWxlTmFtZT09dW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHRoaXMuY29tcHV0ZWQ9e307XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYoVXRpbHMuaXNBcnJheShydWxlTmFtZSkpe1xuICAgICAgICAgICAgcnVsZU5hbWUuZm9yRWFjaChuPT57XG4gICAgICAgICAgICAgICAgdGhpcy5jb21wdXRlZFtuXT17fTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29tcHV0ZWRbcnVsZU5hbWVdPXt9O1xuICAgIH1cblxuICAgIGNsZWFyRGlzcGxheVZhbHVlcygpe1xuICAgICAgICB0aGlzLmNvbXB1dGVkWyckZGlzcGxheVZhbHVlcyddPXt9O1xuICAgIH1cblxuICAgIGRpc3BsYXlWYWx1ZShmaWVsZFBhdGgsIHZhbHVlKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcHV0ZWRWYWx1ZShudWxsLCAnJGRpc3BsYXlWYWx1ZXMuJytmaWVsZFBhdGgsIHZhbHVlKTtcbiAgICB9XG5cbiAgICBsb2FkQ29tcHV0ZWRWYWx1ZXMoY29tcHV0ZWQpe1xuICAgICAgICB0aGlzLmNvbXB1dGVkID0gY29tcHV0ZWQ7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtVdGlsc30gZnJvbSAnc2QtdXRpbHMnXG5cbmV4cG9ydCBjbGFzcyBPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkcyB7XG5cbiAgICAkaWQgPSBVdGlscy5ndWlkKCk7IC8vaW50ZXJuYWwgaWRcbiAgICAkZmllbGRTdGF0dXM9e307XG5cbiAgICBnZXRGaWVsZFN0YXR1cyhmaWVsZFBhdGgpe1xuICAgICAgICBpZighVXRpbHMuZ2V0KHRoaXMuJGZpZWxkU3RhdHVzLCBmaWVsZFBhdGgsIG51bGwpKXtcbiAgICAgICAgICAgIFV0aWxzLnNldCh0aGlzLiRmaWVsZFN0YXR1cywgZmllbGRQYXRoLCB7XG4gICAgICAgICAgICAgICAgdmFsaWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgc3ludGF4OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBVdGlscy5nZXQodGhpcy4kZmllbGRTdGF0dXMsIGZpZWxkUGF0aCk7XG4gICAgfVxuXG4gICAgc2V0U3ludGF4VmFsaWRpdHkoZmllbGRQYXRoLCB2YWxpZCl7XG4gICAgICAgIHZhciBmaWVsZFN0YXR1cyA9IHRoaXMuZ2V0RmllbGRTdGF0dXMoZmllbGRQYXRoKTtcbiAgICAgICAgZmllbGRTdGF0dXMudmFsaWQuc3ludGF4ID0gdmFsaWQ7XG4gICAgfVxuXG4gICAgc2V0VmFsdWVWYWxpZGl0eShmaWVsZFBhdGgsIHZhbGlkKXtcbiAgICAgICAgdmFyIGZpZWxkU3RhdHVzID0gdGhpcy5nZXRGaWVsZFN0YXR1cyhmaWVsZFBhdGgpO1xuICAgICAgICBmaWVsZFN0YXR1cy52YWxpZC52YWx1ZSA9IHZhbGlkO1xuICAgIH1cblxuICAgIGlzRmllbGRWYWxpZChmaWVsZFBhdGgsIHN5bnRheD10cnVlLCB2YWx1ZT10cnVlKXtcbiAgICAgICAgdmFyIGZpZWxkU3RhdHVzID0gdGhpcy5nZXRGaWVsZFN0YXR1cyhmaWVsZFBhdGgpO1xuICAgICAgICBpZihzeW50YXggJiYgdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZFN0YXR1cy52YWxpZC5zeW50YXggJiYgZmllbGRTdGF0dXMudmFsaWQudmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYoc3ludGF4KSB7XG4gICAgICAgICAgICByZXR1cm4gZmllbGRTdGF0dXMudmFsaWQuc3ludGF4XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpZWxkU3RhdHVzLnZhbGlkLnZhbHVlO1xuICAgIH1cblxuXG59XG4iLCJleHBvcnQgY2xhc3MgUG9pbnQge1xuICAgIHg7XG4gICAgeTtcbiAgICBjb25zdHJ1Y3Rvcih4LHkpe1xuICAgICAgICBpZih4IGluc3RhbmNlb2YgUG9pbnQpe1xuICAgICAgICAgICAgeT14Lnk7XG4gICAgICAgICAgICB4PXgueFxuICAgICAgICB9ZWxzZSBpZihBcnJheS5pc0FycmF5KHgpKXtcbiAgICAgICAgICAgIHk9eFsxXTtcbiAgICAgICAgICAgIHg9eFswXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLng9eDtcbiAgICAgICAgdGhpcy55PXk7XG4gICAgfVxuXG4gICAgbW92ZVRvKHgseSl7XG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoeCkpe1xuICAgICAgICAgICAgeT14WzFdO1xuICAgICAgICAgICAgeD14WzBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMueD14O1xuICAgICAgICB0aGlzLnk9eTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbW92ZShkeCxkeSl7IC8vbW92ZSBieSB2ZWN0b3JcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShkeCkpe1xuICAgICAgICAgICAgZHk9ZHhbMV07XG4gICAgICAgICAgICBkeD1keFswXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLngrPWR4O1xuICAgICAgICB0aGlzLnkrPWR5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7UG9pbnR9IGZyb20gXCIuL3BvaW50XCI7XG5pbXBvcnQge1V0aWxzfSBmcm9tIFwic2QtdXRpbHNcIjtcbmltcG9ydCB7T2JqZWN0V2l0aElkQW5kRWRpdGFibGVGaWVsZHN9IGZyb20gXCIuL29iamVjdC13aXRoLWlkLWFuZC1lZGl0YWJsZS1maWVsZHNcIjtcblxuZXhwb3J0IGNsYXNzIFRleHQgZXh0ZW5kcyBPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkc3tcblxuICAgIHZhbHVlPScnO1xuICAgIGxvY2F0aW9uOyAvL1BvaW50XG5cbiAgICBjb25zdHJ1Y3Rvcihsb2NhdGlvbiwgdmFsdWUpe1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmxvY2F0aW9uPWxvY2F0aW9uO1xuICAgICAgICBpZighbG9jYXRpb24pe1xuICAgICAgICAgICAgdGhpcy5sb2NhdGlvbiA9IG5ldyBQb2ludCgwLDApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG1vdmVUbyh4LHkpeyAvL21vdmUgdG8gbmV3IGxvY2F0aW9uXG4gICAgICAgIHRoaXMubG9jYXRpb24ubW92ZVRvKHgseSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIG1vdmUoZHgsIGR5KXsgLy9tb3ZlIGJ5IHZlY3RvclxuICAgICAgICB0aGlzLmxvY2F0aW9uLm1vdmUoZHgsIGR5KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgZG9tYWluIGZyb20gJy4vZG9tYWluJ1xuZXhwb3J0IHtkb21haW59XG5leHBvcnQgKiBmcm9tICcuL2RhdGEtbW9kZWwnXG5leHBvcnQgKiBmcm9tICcuL3ZhbGlkYXRpb24tcmVzdWx0J1xuIiwiaW1wb3J0IHtVdGlsc30gZnJvbSBcInNkLXV0aWxzXCI7XG5cbmV4cG9ydCBjbGFzcyBWYWxpZGF0aW9uUmVzdWx0e1xuXG5cbiAgICBlcnJvcnMgPSB7fTtcbiAgICB3YXJuaW5ncyA9IHt9O1xuICAgIG9iamVjdElkVG9FcnJvcj17fTtcblxuICAgIGFkZEVycm9yKGVycm9yLCBvYmope1xuICAgICAgICBpZihVdGlscy5pc1N0cmluZyhlcnJvcikpe1xuICAgICAgICAgICAgZXJyb3IgPSB7bmFtZTogZXJyb3J9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBuYW1lID0gZXJyb3IubmFtZTtcbiAgICAgICAgdmFyIGVycm9yc0J5TmFtZSA9IHRoaXMuZXJyb3JzW25hbWVdO1xuICAgICAgICBpZighZXJyb3JzQnlOYW1lKXtcbiAgICAgICAgICAgIGVycm9yc0J5TmFtZT1bXTtcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzW25hbWVdPWVycm9yc0J5TmFtZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb2JqRSA9IHRoaXMub2JqZWN0SWRUb0Vycm9yW29iai4kaWRdO1xuICAgICAgICBpZighb2JqRSl7XG4gICAgICAgICAgICBvYmpFPVtdO1xuICAgICAgICAgICAgdGhpcy5vYmplY3RJZFRvRXJyb3Jbb2JqLiRpZF09IG9iakU7XG4gICAgICAgIH1cbiAgICAgICAgZXJyb3JzQnlOYW1lLnB1c2gob2JqKTtcbiAgICAgICAgb2JqRS5wdXNoKGVycm9yKTtcbiAgICB9XG5cbiAgICBhZGRXYXJuaW5nKG5hbWUsIG9iail7XG4gICAgICAgIHZhciBlID0gdGhpcy53YXJuaW5nc1tuYW1lXTtcbiAgICAgICAgaWYoIWUpe1xuICAgICAgICAgICAgZT1bXTtcbiAgICAgICAgICAgIHRoaXMud2FybmluZ3NbbmFtZV09ZTtcbiAgICAgICAgfVxuICAgICAgICBlLnB1c2gob2JqKVxuICAgIH1cblxuICAgIGlzVmFsaWQoKXtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRoaXMuZXJyb3JzKS5sZW5ndGggPT09IDBcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlRnJvbURUTyhkdG8pe1xuICAgICAgICB2YXIgdiA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XG4gICAgICAgIHYuZXJyb3JzID0gZHRvLmVycm9ycztcbiAgICAgICAgdi53YXJuaW5ncyA9IGR0by53YXJuaW5ncztcbiAgICAgICAgdi5vYmplY3RJZFRvRXJyb3IgPSBkdG8ub2JqZWN0SWRUb0Vycm9yO1xuICAgICAgICByZXR1cm4gdjtcbiAgICB9XG59XG4iLCJleHBvcnQgKiBmcm9tICcuL3NyYy9pbmRleCdcbiJdfQ==
