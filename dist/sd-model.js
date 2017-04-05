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
                edge.payoff = ed.payoff;
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
        key: '_setNewState',
        value: function _setNewState(newState, redo) {
            var nodeById = _sdUtils.Utils.getObjectByIdMap(newState.nodes);
            var edgeById = _sdUtils.Utils.getObjectByIdMap(newState.edges);
            this.nodes = newState.nodes;
            this.edges = newState.edges;
            this.texts = newState.texts;
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
        _this.payoff = 0;
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
            this.payoff = payoff;
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
            return this.computedValue(null, 'payoff', val);
        }
    }, {
        key: 'displayProbability',
        value: function displayProbability(val) {
            return this.displayValue('probability', val);
        }
    }, {
        key: 'displayPayoff',
        value: function displayPayoff(val) {
            return this.displayValue('payoff', val);
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
        value: function computedValue(ruleName, fieldName, value) {
            var path = 'computed.';
            if (ruleName) {
                path += ruleName + '.';
            }
            path += fieldName;
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
        value: function displayValue(fieldName, value) {
            return this.computedValue(null, '$displayValues.' + fieldName, value);
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
        value: function getFieldStatus(fieldName) {
            if (!this.$fieldStatus[fieldName]) {
                this.$fieldStatus[fieldName] = {
                    valid: {
                        syntax: true,
                        value: true
                    }
                };
            }
            return this.$fieldStatus[fieldName];
        }
    }, {
        key: 'setSyntaxValidity',
        value: function setSyntaxValidity(fieldName, valid) {
            var fieldStatus = this.getFieldStatus(fieldName);
            fieldStatus.valid.syntax = valid;
        }
    }, {
        key: 'setValueValidity',
        value: function setValueValidity(fieldName, valid) {
            var fieldStatus = this.getFieldStatus(fieldName);
            fieldStatus.valid.value = valid;
        }
    }, {
        key: 'isFieldValid',
        value: function isFieldValid(fieldName) {
            var syntax = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
            var value = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

            var fieldStatus = this.getFieldStatus(fieldName);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGRhdGEtbW9kZWwuanMiLCJzcmNcXGRvbWFpblxcZWRnZS5qcyIsInNyY1xcZG9tYWluXFxpbmRleC5qcyIsInNyY1xcZG9tYWluXFxub2RlXFxjaGFuY2Utbm9kZS5qcyIsInNyY1xcZG9tYWluXFxub2RlXFxkZWNpc2lvbi1ub2RlLmpzIiwic3JjXFxkb21haW5cXG5vZGVcXG5vZGUuanMiLCJzcmNcXGRvbWFpblxcbm9kZVxcdGVybWluYWwtbm9kZS5qcyIsInNyY1xcZG9tYWluXFxvYmplY3Qtd2l0aC1jb21wdXRlZC12YWx1ZXMuanMiLCJzcmNcXGRvbWFpblxcb2JqZWN0LXdpdGgtaWQtYW5kLWVkaXRhYmxlLWZpZWxkcy5qcyIsInNyY1xcZG9tYWluXFxwb2ludC5qcyIsInNyY1xcZG9tYWluXFx0ZXh0LmpzIiwic3JjXFxpbmRleC5qcyIsInNyY1xcdmFsaWRhdGlvbi1yZXN1bHQuanMiLCJpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDQUE7O0FBRUE7O0ksQUFBWTs7QUFDWjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7OztJLEFBR2Esb0IsQUFBQSx3QkFTVTtBQUZHO0FBcUJ0Qjt1QkFBQSxBQUFZLE1BQU07OEJBQUE7O2FBMUJsQixBQTBCa0IsUUExQlYsQUEwQlU7YUF6QmxCLEFBeUJrQixRQXpCVixBQXlCVTthQXZCbEIsQUF1QmtCLFFBdkJWLEFBdUJVO2FBckJsQixBQXFCa0Isa0JBckJBLEFBcUJBO2FBcEJsQixBQW9Ca0IsT0FwQlgsQUFvQlc7YUFuQmxCLEFBbUJrQixhQW5CTCxBQW1CSzthQWxCbEIsQUFrQmtCLGFBbEJMLEFBa0JLO2FBakJsQixBQWlCa0IsV0FqQlQsQUFpQlM7YUFmbEIsQUFla0Isb0JBZkUsQUFlRjthQVpsQixBQVlrQixlQVpILEFBWUc7YUFYbEIsQUFX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LEFBQUUsa0JBQWtCLElBQXBCLEFBQXdCLEFBQ3hCO21CQUFBLEFBQU8sQUFDVjs7Ozs7Ozs7Ozs7Ozs7OztBQy9DTCwyQ0FBQTtpREFBQTs7Z0JBQUE7d0JBQUE7b0JBQUE7QUFBQTtBQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB7VXRpbHN9IGZyb20gJ3NkLXV0aWxzJ1xuaW1wb3J0IHtsb2d9IGZyb20gXCJzZC11dGlsc1wiO1xuaW1wb3J0ICogYXMgZG9tYWluIGZyb20gJy4vZG9tYWluJ1xuaW1wb3J0IHtWYWxpZGF0aW9uUmVzdWx0fSBmcm9tICcuL3ZhbGlkYXRpb24tcmVzdWx0J1xuXG4vKlxuICogRGF0YSBtb2RlbCBtYW5hZ2VyXG4gKiAqL1xuZXhwb3J0IGNsYXNzIERhdGFNb2RlbCB7XG5cbiAgICBub2RlcyA9IFtdO1xuICAgIGVkZ2VzID0gW107XG5cbiAgICB0ZXh0cyA9IFtdOyAvL2Zsb2F0aW5nIHRleHRzXG5cbiAgICBleHByZXNzaW9uU2NvcGUgPSB7fTsgLy9nbG9iYWwgZXhwcmVzc2lvbiBzY29wZVxuICAgIGNvZGUgPSBcIlwiOy8vZ2xvYmFsIGV4cHJlc3Npb24gY29kZVxuICAgICRjb2RlRXJyb3IgPSBudWxsOyAvL2NvZGUgZXZhbHVhdGlvbiBlcnJvcnNcbiAgICAkY29kZURpcnR5ID0gZmFsc2U7IC8vIGlzIGNvZGUgY2hhbmdlZCB3aXRob3V0IHJlZXZhbHVhdGlvbj9cbiAgICAkdmVyc2lvbj0xO1xuXG4gICAgdmFsaWRhdGlvblJlc3VsdHMgPSBbXTtcblxuICAgIC8vIHVuZG8gLyByZWRvXG4gICAgbWF4U3RhY2tTaXplID0gMjA7XG4gICAgdW5kb1N0YWNrID0gW107XG4gICAgcmVkb1N0YWNrID0gW107XG4gICAgdW5kb1JlZG9TdGF0ZUNoYW5nZWRDYWxsYmFjayA9IG51bGw7XG4gICAgbm9kZUFkZGVkQ2FsbGJhY2sgPSBudWxsO1xuICAgIG5vZGVSZW1vdmVkQ2FsbGJhY2sgPSBudWxsO1xuXG4gICAgdGV4dEFkZGVkQ2FsbGJhY2sgPSBudWxsO1xuICAgIHRleHRSZW1vdmVkQ2FsbGJhY2sgPSBudWxsO1xuXG4gICAgY2FsbGJhY2tzRGlzYWJsZWQgPSBmYWxzZTtcblxuICAgIGNvbnN0cnVjdG9yKGRhdGEpIHtcbiAgICAgICAgaWYoZGF0YSl7XG4gICAgICAgICAgICB0aGlzLmxvYWQoZGF0YSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRKc29uUmVwbGFjZXIoZmlsdGVyTG9jYXRpb249ZmFsc2UsIGZpbHRlckNvbXB1dGVkPWZhbHNlLCByZXBsYWNlciwgZmlsdGVyUHJpdmF0ZSA9dHJ1ZSl7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoaywgdikge1xuXG4gICAgICAgICAgICBpZiAoKGZpbHRlclByaXZhdGUgJiYgVXRpbHMuc3RhcnRzV2l0aChrLCAnJCcpKSB8fCBrID09ICdwYXJlbnROb2RlJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmlsdGVyTG9jYXRpb24gJiYgayA9PSAnbG9jYXRpb24nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmaWx0ZXJDb21wdXRlZCAmJiBrID09ICdjb21wdXRlZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocmVwbGFjZXIpe1xuICAgICAgICAgICAgICAgIHJldHVybiByZXBsYWNlcihrLCB2KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXJpYWxpemUoc3RyaW5naWZ5PXRydWUsIGZpbHRlckxvY2F0aW9uPWZhbHNlLCBmaWx0ZXJDb21wdXRlZD1mYWxzZSwgcmVwbGFjZXIsIGZpbHRlclByaXZhdGUgPXRydWUpe1xuICAgICAgICB2YXIgZGF0YSA9ICB7XG4gICAgICAgICAgICBjb2RlOiB0aGlzLmNvZGUsXG4gICAgICAgICAgICBleHByZXNzaW9uU2NvcGU6IHRoaXMuZXhwcmVzc2lvblNjb3BlLFxuICAgICAgICAgICAgdHJlZXM6IHRoaXMuZ2V0Um9vdHMoKSxcbiAgICAgICAgICAgIHRleHRzOiB0aGlzLnRleHRzXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYoIXN0cmluZ2lmeSl7XG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBVdGlscy5zdHJpbmdpZnkoZGF0YSwgdGhpcy5nZXRKc29uUmVwbGFjZXIoZmlsdGVyTG9jYXRpb24sIGZpbHRlckNvbXB1dGVkLCByZXBsYWNlciwgZmlsdGVyUHJpdmF0ZSksIFtdKTtcbiAgICB9XG5cblxuICAgIC8qTG9hZHMgc2VyaWFsaXplZCBkYXRhKi9cbiAgICBsb2FkKGRhdGEpIHtcbiAgICAgICAgLy9yb290cywgdGV4dHMsIGNvZGUsIGV4cHJlc3Npb25TY29wZVxuICAgICAgICB2YXIgY2FsbGJhY2tzRGlzYWJsZWQgPSB0aGlzLmNhbGxiYWNrc0Rpc2FibGVkO1xuICAgICAgICB0aGlzLmNhbGxiYWNrc0Rpc2FibGVkID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLmNsZWFyKCk7XG5cblxuICAgICAgICBkYXRhLnRyZWVzLmZvckVhY2gobm9kZURhdGE9PiB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMuY3JlYXRlTm9kZUZyb21EYXRhKG5vZGVEYXRhKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGRhdGEudGV4dHMpIHtcbiAgICAgICAgICAgIGRhdGEudGV4dHMuZm9yRWFjaCh0ZXh0RGF0YT0+IHtcbiAgICAgICAgICAgICAgICB2YXIgbG9jYXRpb24gPSBuZXcgZG9tYWluLlBvaW50KHRleHREYXRhLmxvY2F0aW9uLngsIHRleHREYXRhLmxvY2F0aW9uLnkpO1xuICAgICAgICAgICAgICAgIHZhciB0ZXh0ID0gbmV3IGRvbWFpbi5UZXh0KGxvY2F0aW9uLCB0ZXh0RGF0YS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy50ZXh0cy5wdXNoKHRleHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2xlYXJFeHByZXNzaW9uU2NvcGUoKTtcbiAgICAgICAgdGhpcy5jb2RlID0gZGF0YS5jb2RlIHx8ICcnO1xuXG4gICAgICAgIGlmIChkYXRhLmV4cHJlc3Npb25TY29wZSkge1xuICAgICAgICAgICAgVXRpbHMuZXh0ZW5kKHRoaXMuZXhwcmVzc2lvblNjb3BlLCBkYXRhLmV4cHJlc3Npb25TY29wZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jYWxsYmFja3NEaXNhYmxlZCA9IGNhbGxiYWNrc0Rpc2FibGVkO1xuICAgIH1cblxuICAgIGdldERUTyhmaWx0ZXJMb2NhdGlvbj1mYWxzZSwgZmlsdGVyQ29tcHV0ZWQ9ZmFsc2UsIGZpbHRlclByaXZhdGUgPWZhbHNlKXtcbiAgICAgICAgdmFyIGR0byA9IHtcbiAgICAgICAgICAgIHNlcmlhbGl6ZWREYXRhOiB0aGlzLnNlcmlhbGl6ZSh0cnVlLCBmaWx0ZXJMb2NhdGlvbiwgZmlsdGVyQ29tcHV0ZWQsIG51bGwsIGZpbHRlclByaXZhdGUpLFxuICAgICAgICAgICAgJGNvZGVFcnJvcjogdGhpcy4kY29kZUVycm9yLFxuICAgICAgICAgICAgJGNvZGVEaXJ0eTogdGhpcy4kY29kZURpcnR5LFxuICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdHM6IHRoaXMudmFsaWRhdGlvblJlc3VsdHMuc2xpY2UoKVxuXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBkdG9cbiAgICB9XG5cbiAgICBsb2FkRnJvbURUTyhkdG8sIGRhdGFSZXZpdmVyKXtcbiAgICAgICAgdGhpcy5sb2FkKEpTT04ucGFyc2UoZHRvLnNlcmlhbGl6ZWREYXRhLCBkYXRhUmV2aXZlcikpO1xuICAgICAgICB0aGlzLiRjb2RlRXJyb3IgPSBkdG8uJGNvZGVFcnJvcjtcbiAgICAgICAgdGhpcy4kY29kZURpcnR5ID0gZHRvLiRjb2RlRGlydHk7XG4gICAgICAgIHRoaXMudmFsaWRhdGlvblJlc3VsdHMubGVuZ3RoPTA7XG4gICAgICAgIGR0by52YWxpZGF0aW9uUmVzdWx0cy5mb3JFYWNoKHY9PntcbiAgICAgICAgICAgIHRoaXMudmFsaWRhdGlvblJlc3VsdHMucHVzaChWYWxpZGF0aW9uUmVzdWx0LmNyZWF0ZUZyb21EVE8odikpXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgLypUaGlzIG1ldGhvZCB1cGRhdGVzIG9ubHkgY29tcHV0YXRpb24gcmVzdWx0cy92YWxpZGF0aW9uKi9cbiAgICB1cGRhdGVGcm9tKGRhdGFNb2RlbCl7XG4gICAgICAgIGlmKHRoaXMuJHZlcnNpb24+ZGF0YU1vZGVsLiR2ZXJzaW9uKXtcbiAgICAgICAgICAgIGxvZy53YXJuKFwiRGF0YU1vZGVsLnVwZGF0ZUZyb206IHZlcnNpb24gb2YgY3VycmVudCBtb2RlbCBncmVhdGVyIHRoYW4gdXBkYXRlXCIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGJ5SWQgPSB7fVxuICAgICAgICBkYXRhTW9kZWwubm9kZXMuZm9yRWFjaChuPT57XG4gICAgICAgICAgICBieUlkW24uJGlkXSA9IG47XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLm5vZGVzLmZvckVhY2goKG4saSk9PntcbiAgICAgICAgICAgIGlmKGJ5SWRbbi4kaWRdKXtcbiAgICAgICAgICAgICAgICBuLmxvYWRDb21wdXRlZFZhbHVlcyhieUlkW24uJGlkXS5jb21wdXRlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBkYXRhTW9kZWwuZWRnZXMuZm9yRWFjaChlPT57XG4gICAgICAgICAgICBieUlkW2UuJGlkXSA9IGU7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmVkZ2VzLmZvckVhY2goKGUsaSk9PntcbiAgICAgICAgICAgIGlmKGJ5SWRbZS4kaWRdKXtcbiAgICAgICAgICAgICAgICBlLmxvYWRDb21wdXRlZFZhbHVlcyhieUlkW2UuJGlkXS5jb21wdXRlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmV4cHJlc3Npb25TY29wZSA9IGRhdGFNb2RlbC5leHByZXNzaW9uU2NvcGU7XG4gICAgICAgIHRoaXMuJGNvZGVFcnJvciA9IGRhdGFNb2RlbC4kY29kZUVycm9yO1xuICAgICAgICB0aGlzLiRjb2RlRGlydHkgPSBkYXRhTW9kZWwuJGNvZGVEaXJ0eTtcbiAgICAgICAgdGhpcy52YWxpZGF0aW9uUmVzdWx0cyAgPSBkYXRhTW9kZWwudmFsaWRhdGlvblJlc3VsdHM7XG4gICAgfVxuXG4gICAgLypjcmVhdGUgbm9kZSBmcm9tIHNlcmlhbGl6ZWQgZGF0YSovXG4gICAgY3JlYXRlTm9kZUZyb21EYXRhKGRhdGEsIHBhcmVudCkge1xuICAgICAgICB2YXIgbm9kZSwgbG9jYXRpb247XG5cbiAgICAgICAgaWYoZGF0YS5sb2NhdGlvbil7XG4gICAgICAgICAgICBsb2NhdGlvbiA9IG5ldyBkb21haW4uUG9pbnQoZGF0YS5sb2NhdGlvbi54LCBkYXRhLmxvY2F0aW9uLnkpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGxvY2F0aW9uID0gbmV3IGRvbWFpbi5Qb2ludCgwLDApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRvbWFpbi5EZWNpc2lvbk5vZGUuJFRZUEUgPT0gZGF0YS50eXBlKSB7XG4gICAgICAgICAgICBub2RlID0gbmV3IGRvbWFpbi5EZWNpc2lvbk5vZGUobG9jYXRpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKGRvbWFpbi5DaGFuY2VOb2RlLiRUWVBFID09IGRhdGEudHlwZSkge1xuICAgICAgICAgICAgbm9kZSA9IG5ldyBkb21haW4uQ2hhbmNlTm9kZShsb2NhdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoZG9tYWluLlRlcm1pbmFsTm9kZS4kVFlQRSA9PSBkYXRhLnR5cGUpIHtcbiAgICAgICAgICAgIG5vZGUgPSBuZXcgZG9tYWluLlRlcm1pbmFsTm9kZShsb2NhdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYoZGF0YS4kaWQpe1xuICAgICAgICAgICAgbm9kZS4kaWQgPSBkYXRhLiRpZDtcbiAgICAgICAgfVxuICAgICAgICBpZihkYXRhLiRmaWVsZFN0YXR1cyl7XG4gICAgICAgICAgICBub2RlLiRmaWVsZFN0YXR1cyA9IGRhdGEuJGZpZWxkU3RhdHVzO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUubmFtZSA9IGRhdGEubmFtZTtcblxuICAgICAgICBpZihkYXRhLmNvZGUpe1xuICAgICAgICAgICAgbm9kZS5jb2RlID0gZGF0YS5jb2RlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkYXRhLmV4cHJlc3Npb25TY29wZSkge1xuICAgICAgICAgICAgbm9kZS5leHByZXNzaW9uU2NvcGUgPSBkYXRhLmV4cHJlc3Npb25TY29wZVxuICAgICAgICB9XG4gICAgICAgIGlmKGRhdGEuY29tcHV0ZWQpe1xuICAgICAgICAgICAgbm9kZS5sb2FkQ29tcHV0ZWRWYWx1ZXMoZGF0YS5jb21wdXRlZCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZWRnZU9yTm9kZSA9IHRoaXMuYWRkTm9kZShub2RlLCBwYXJlbnQpO1xuICAgICAgICBkYXRhLmNoaWxkRWRnZXMuZm9yRWFjaChlZD0+IHtcbiAgICAgICAgICAgIHZhciBlZGdlID0gdGhpcy5jcmVhdGVOb2RlRnJvbURhdGEoZWQuY2hpbGROb2RlLCBub2RlKTtcbiAgICAgICAgICAgIGVkZ2UucGF5b2ZmID0gZWQucGF5b2ZmO1xuICAgICAgICAgICAgZWRnZS5wcm9iYWJpbGl0eSA9IGVkLnByb2JhYmlsaXR5O1xuICAgICAgICAgICAgZWRnZS5uYW1lID0gZWQubmFtZTtcbiAgICAgICAgICAgIGlmKGVkLmNvbXB1dGVkKXtcbiAgICAgICAgICAgICAgICBlZGdlLmxvYWRDb21wdXRlZFZhbHVlcyhlZC5jb21wdXRlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihlZC4kaWQpe1xuICAgICAgICAgICAgICAgIGVkZ2UuJGlkID0gZWQuJGlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZWQuJGZpZWxkU3RhdHVzKXtcbiAgICAgICAgICAgICAgICBlZGdlLiRmaWVsZFN0YXR1cyA9IGVkLiRmaWVsZFN0YXR1cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGVkZ2VPck5vZGU7XG4gICAgfVxuXG4gICAgLypyZXR1cm5zIG5vZGUgb3IgZWRnZSBmcm9tIHBhcmVudCB0byB0aGlzIG5vZGUqL1xuICAgIGFkZE5vZGUobm9kZSwgcGFyZW50KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5ub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgICAgICB2YXIgZWRnZSA9IHNlbGYuX2FkZENoaWxkKHBhcmVudCwgbm9kZSk7XG4gICAgICAgICAgICB0aGlzLl9maXJlTm9kZUFkZGVkQ2FsbGJhY2sobm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gZWRnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhub2RlKTtcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgLyppbmplY3RzIGdpdmVuIG5vZGUgaW50byBnaXZlbiBlZGdlKi9cbiAgICBpbmplY3ROb2RlKG5vZGUsIGVkZ2UpIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IGVkZ2UucGFyZW50Tm9kZTtcbiAgICAgICAgdmFyIGNoaWxkID0gZWRnZS5jaGlsZE5vZGU7XG4gICAgICAgIHRoaXMubm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgbm9kZS4kcGFyZW50ID0gcGFyZW50O1xuICAgICAgICBlZGdlLmNoaWxkTm9kZSA9IG5vZGU7XG4gICAgICAgIHRoaXMuX2FkZENoaWxkKG5vZGUsIGNoaWxkKTtcbiAgICAgICAgdGhpcy5fZmlyZU5vZGVBZGRlZENhbGxiYWNrKG5vZGUpO1xuICAgIH1cblxuICAgIF9hZGRDaGlsZChwYXJlbnQsIGNoaWxkKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGVkZ2UgPSBuZXcgZG9tYWluLkVkZ2UocGFyZW50LCBjaGlsZCk7XG4gICAgICAgIHNlbGYuX3NldEVkZ2VJbml0aWFsUHJvYmFiaWxpdHkoZWRnZSk7XG4gICAgICAgIHNlbGYuZWRnZXMucHVzaChlZGdlKTtcblxuICAgICAgICBwYXJlbnQuY2hpbGRFZGdlcy5wdXNoKGVkZ2UpO1xuICAgICAgICBjaGlsZC4kcGFyZW50ID0gcGFyZW50O1xuICAgICAgICByZXR1cm4gZWRnZTtcbiAgICB9XG5cbiAgICBfc2V0RWRnZUluaXRpYWxQcm9iYWJpbGl0eShlZGdlKSB7XG4gICAgICAgIGlmIChlZGdlLnBhcmVudE5vZGUgaW5zdGFuY2VvZiBkb21haW4uQ2hhbmNlTm9kZSkge1xuICAgICAgICAgICAgZWRnZS5wcm9iYWJpbGl0eSA9ICcjJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVkZ2UucHJvYmFiaWxpdHkgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8qcmVtb3ZlcyBnaXZlbiBub2RlIGFuZCBpdHMgc3VidHJlZSovXG4gICAgcmVtb3ZlTm9kZShub2RlLCAkbCA9IDApIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIG5vZGUuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PnNlbGYucmVtb3ZlTm9kZShlLmNoaWxkTm9kZSwgJGwgKyAxKSk7XG5cbiAgICAgICAgc2VsZi5fcmVtb3ZlTm9kZShub2RlKTtcbiAgICAgICAgdmFyIHBhcmVudCA9IG5vZGUuJHBhcmVudDtcbiAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgdmFyIHBhcmVudEVkZ2UgPSBVdGlscy5maW5kKHBhcmVudC5jaGlsZEVkZ2VzLCAoZSwgaSk9PiBlLmNoaWxkTm9kZSA9PT0gbm9kZSk7XG4gICAgICAgICAgICBpZiAoJGwgPT0gMCkge1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlRWRnZShwYXJlbnRFZGdlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fcmVtb3ZlRWRnZShwYXJlbnRFZGdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9maXJlTm9kZVJlbW92ZWRDYWxsYmFjayhub2RlKTtcbiAgICB9XG5cbiAgICAvKnJlbW92ZXMgZ2l2ZW4gbm9kZXMgYW5kIHRoZWlyIHN1YnRyZWVzKi9cbiAgICByZW1vdmVOb2Rlcyhub2Rlcykge1xuXG4gICAgICAgIHZhciByb290cyA9IHRoaXMuZmluZFN1YnRyZWVSb290cyhub2Rlcyk7XG4gICAgICAgIHJvb3RzLmZvckVhY2gobj0+dGhpcy5yZW1vdmVOb2RlKG4sIDApLCB0aGlzKTtcbiAgICB9XG5cbiAgICBjb252ZXJ0Tm9kZShub2RlLCB0eXBlVG9Db252ZXJ0VG8pe1xuICAgICAgICB2YXIgbmV3Tm9kZTtcbiAgICAgICAgaWYoIW5vZGUuY2hpbGRFZGdlcy5sZW5ndGggJiYgbm9kZS4kcGFyZW50KXtcbiAgICAgICAgICAgIG5ld05vZGUgPSB0aGlzLmNyZWF0ZU5vZGVCeVR5cGUodHlwZVRvQ29udmVydFRvLCBub2RlLmxvY2F0aW9uKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBpZihub2RlIGluc3RhbmNlb2YgZG9tYWluLkRlY2lzaW9uTm9kZSAmJiB0eXBlVG9Db252ZXJ0VG89PWRvbWFpbi5DaGFuY2VOb2RlLiRUWVBFKXtcbiAgICAgICAgICAgICAgICBuZXdOb2RlID0gdGhpcy5jcmVhdGVOb2RlQnlUeXBlKHR5cGVUb0NvbnZlcnRUbywgbm9kZS5sb2NhdGlvbik7XG4gICAgICAgICAgICB9ZWxzZSBpZih0eXBlVG9Db252ZXJ0VG89PWRvbWFpbi5EZWNpc2lvbk5vZGUuJFRZUEUpe1xuICAgICAgICAgICAgICAgIG5ld05vZGUgPSB0aGlzLmNyZWF0ZU5vZGVCeVR5cGUodHlwZVRvQ29udmVydFRvLCBub2RlLmxvY2F0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmKG5ld05vZGUpe1xuICAgICAgICAgICAgbmV3Tm9kZS5uYW1lPW5vZGUubmFtZTtcbiAgICAgICAgICAgIHRoaXMucmVwbGFjZU5vZGUobmV3Tm9kZSwgbm9kZSk7XG4gICAgICAgICAgICBuZXdOb2RlLmNoaWxkRWRnZXMuZm9yRWFjaChlPT50aGlzLl9zZXRFZGdlSW5pdGlhbFByb2JhYmlsaXR5KGUpKTtcbiAgICAgICAgICAgIHRoaXMuX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhuZXdOb2RlKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgY3JlYXRlTm9kZUJ5VHlwZSh0eXBlLCBsb2NhdGlvbil7XG4gICAgICAgIGlmKHR5cGU9PWRvbWFpbi5EZWNpc2lvbk5vZGUuJFRZUEUpe1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBkb21haW4uRGVjaXNpb25Ob2RlKGxvY2F0aW9uKVxuICAgICAgICB9ZWxzZSBpZih0eXBlPT1kb21haW4uQ2hhbmNlTm9kZS4kVFlQRSl7XG4gICAgICAgICAgICByZXR1cm4gbmV3IGRvbWFpbi5DaGFuY2VOb2RlKGxvY2F0aW9uKVxuICAgICAgICB9ZWxzZSBpZih0eXBlPT1kb21haW4uVGVybWluYWxOb2RlLiRUWVBFKXtcbiAgICAgICAgICAgIHJldHVybiBuZXcgZG9tYWluLlRlcm1pbmFsTm9kZShsb2NhdGlvbilcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlcGxhY2VOb2RlKG5ld05vZGUsIG9sZE5vZGUpe1xuICAgICAgICB2YXIgcGFyZW50ID0gb2xkTm9kZS4kcGFyZW50O1xuICAgICAgICBuZXdOb2RlLiRwYXJlbnQgPSBwYXJlbnQ7XG5cbiAgICAgICAgaWYocGFyZW50KXtcbiAgICAgICAgICAgIHZhciBwYXJlbnRFZGdlID0gVXRpbHMuZmluZChuZXdOb2RlLiRwYXJlbnQuY2hpbGRFZGdlcywgZT0+ZS5jaGlsZE5vZGU9PT1vbGROb2RlKTtcbiAgICAgICAgICAgIHBhcmVudEVkZ2UuY2hpbGROb2RlID0gbmV3Tm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5ld05vZGUuY2hpbGRFZGdlcyA9IG9sZE5vZGUuY2hpbGRFZGdlcztcbiAgICAgICAgbmV3Tm9kZS5jaGlsZEVkZ2VzLmZvckVhY2goZT0+ZS5wYXJlbnROb2RlPW5ld05vZGUpO1xuXG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMubm9kZXMuaW5kZXhPZihvbGROb2RlKTtcbiAgICAgICAgaWYofmluZGV4KXtcbiAgICAgICAgICAgIHRoaXMubm9kZXNbaW5kZXhdPW5ld05vZGU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRSb290cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZXMuZmlsdGVyKG49PiFuLiRwYXJlbnQpO1xuICAgIH1cblxuICAgIGZpbmRTdWJ0cmVlUm9vdHMobm9kZXMpIHtcbiAgICAgICAgcmV0dXJuIG5vZGVzLmZpbHRlcihuPT4hbi4kcGFyZW50IHx8IG5vZGVzLmluZGV4T2Yobi4kcGFyZW50KSA9PT0gLTEpO1xuICAgIH1cblxuICAgIC8qY3JlYXRlcyBkZXRhY2hlZCBjbG9uZSBvZiBnaXZlbiBub2RlKi9cbiAgICBjbG9uZVN1YnRyZWUobm9kZVRvQ29weSwgY2xvbmVDb21wdXRlZFZhbHVlcykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBjbG9uZSA9IHRoaXMuY2xvbmVOb2RlKG5vZGVUb0NvcHkpO1xuXG4gICAgICAgIG5vZGVUb0NvcHkuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PiB7XG4gICAgICAgICAgICB2YXIgY2hpbGRDbG9uZSA9IHNlbGYuY2xvbmVTdWJ0cmVlKGUuY2hpbGROb2RlLCBjbG9uZUNvbXB1dGVkVmFsdWVzKTtcbiAgICAgICAgICAgIGNoaWxkQ2xvbmUuJHBhcmVudCA9IGNsb25lO1xuICAgICAgICAgICAgdmFyIGVkZ2UgPSBuZXcgZG9tYWluLkVkZ2UoY2xvbmUsIGNoaWxkQ2xvbmUsIGUubmFtZSwgZS5wYXlvZmYsIGUucHJvYmFiaWxpdHkpO1xuICAgICAgICAgICAgaWYgKGNsb25lQ29tcHV0ZWRWYWx1ZXMpIHtcbiAgICAgICAgICAgICAgICBlZGdlLmNvbXB1dGVkID0gVXRpbHMuY2xvbmVEZWVwKGUuY29tcHV0ZWQpXG4gICAgICAgICAgICAgICAgY2hpbGRDbG9uZS5jb21wdXRlZCA9IFV0aWxzLmNsb25lRGVlcChlLmNoaWxkTm9kZS5jb21wdXRlZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNsb25lLmNoaWxkRWRnZXMucHVzaChlZGdlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChjbG9uZUNvbXB1dGVkVmFsdWVzKSB7XG4gICAgICAgICAgICBjbG9uZS5jb21wdXRlZCA9IFV0aWxzLmNsb25lRGVlcChub2RlVG9Db3B5LmNvbXB1dGVkKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjbG9uZTtcbiAgICB9XG5cbiAgICAvKmF0dGFjaGVzIGRldGFjaGVkIHN1YnRyZWUgdG8gZ2l2ZW4gcGFyZW50Ki9cbiAgICBhdHRhY2hTdWJ0cmVlKG5vZGVUb0F0dGFjaCwgcGFyZW50KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG5vZGVPckVkZ2UgPSBzZWxmLmFkZE5vZGUobm9kZVRvQXR0YWNoLCBwYXJlbnQpO1xuXG4gICAgICAgIHZhciBjaGlsZEVkZ2VzID0gc2VsZi5nZXRBbGxEZXNjZW5kYW50RWRnZXMobm9kZVRvQXR0YWNoKTtcbiAgICAgICAgY2hpbGRFZGdlcy5mb3JFYWNoKGU9PiB7XG4gICAgICAgICAgICBzZWxmLmVkZ2VzLnB1c2goZSk7XG4gICAgICAgICAgICBzZWxmLm5vZGVzLnB1c2goZS5jaGlsZE5vZGUpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbm9kZU9yRWRnZTtcbiAgICB9XG5cbiAgICBjbG9uZU5vZGVzKG5vZGVzKSB7XG4gICAgICAgIHZhciByb290cyA9IFtdXG4gICAgICAgIC8vVE9ET1xuICAgIH1cblxuICAgIC8qc2hhbGxvdyBjbG9uZSB3aXRob3V0IHBhcmVudCBhbmQgY2hpbGRyZW4qL1xuICAgIGNsb25lTm9kZShub2RlKSB7XG4gICAgICAgIHZhciBjbG9uZSA9IFV0aWxzLmNsb25lKG5vZGUpXG4gICAgICAgIGNsb25lLiRpZCA9IFV0aWxzLmd1aWQoKTtcbiAgICAgICAgY2xvbmUubG9jYXRpb24gPSBVdGlscy5jbG9uZShub2RlLmxvY2F0aW9uKTtcbiAgICAgICAgY2xvbmUuY29tcHV0ZWQgPSBVdGlscy5jbG9uZShub2RlLmNvbXB1dGVkKTtcbiAgICAgICAgY2xvbmUuJHBhcmVudCA9IG51bGw7XG4gICAgICAgIGNsb25lLmNoaWxkRWRnZXMgPSBbXTtcbiAgICAgICAgcmV0dXJuIGNsb25lO1xuICAgIH1cblxuICAgIGZpbmROb2RlQnlJZChpZCkge1xuICAgICAgICByZXR1cm4gVXRpbHMuZmluZCh0aGlzLm5vZGVzLCBuPT5uLiRpZCA9PSBpZCk7XG4gICAgfVxuXG4gICAgZmluZEVkZ2VCeUlkKGlkKSB7XG4gICAgICAgIHJldHVybiBVdGlscy5maW5kKHRoaXMuZWRnZXMsIGU9PmUuJGlkID09IGlkKTtcbiAgICB9XG5cbiAgICBmaW5kQnlJZChpZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZmluZE5vZGVCeUlkKGlkKTtcbiAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmZpbmRFZGdlQnlJZChpZCk7XG4gICAgfVxuXG4gICAgX3JlbW92ZU5vZGUobm9kZSkgey8vIHNpbXBseSByZW1vdmVzIG5vZGUgZnJvbSBub2RlIGxpc3RcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5ub2Rlcy5pbmRleE9mKG5vZGUpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5ub2Rlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVtb3ZlRWRnZShlZGdlKSB7XG4gICAgICAgIHZhciBpbmRleCA9IGVkZ2UucGFyZW50Tm9kZS5jaGlsZEVkZ2VzLmluZGV4T2YoZWRnZSk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICBlZGdlLnBhcmVudE5vZGUuY2hpbGRFZGdlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3JlbW92ZUVkZ2UoZWRnZSk7XG4gICAgfVxuXG4gICAgX3JlbW92ZUVkZ2UoZWRnZSkgeyAvL3JlbW92ZXMgZWRnZSBmcm9tIGVkZ2UgbGlzdCB3aXRob3V0IHJlbW92aW5nIGNvbm5lY3RlZCBub2Rlc1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmVkZ2VzLmluZGV4T2YoZWRnZSk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICB0aGlzLmVkZ2VzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfcmVtb3ZlTm9kZXMobm9kZXNUb1JlbW92ZSkge1xuICAgICAgICB0aGlzLm5vZGVzID0gdGhpcy5ub2Rlcy5maWx0ZXIobj0+bm9kZXNUb1JlbW92ZS5pbmRleE9mKG4pID09PSAtMSk7XG4gICAgfVxuXG4gICAgX3JlbW92ZUVkZ2VzKGVkZ2VzVG9SZW1vdmUpIHtcbiAgICAgICAgdGhpcy5lZGdlcyA9IHRoaXMuZWRnZXMuZmlsdGVyKGU9PmVkZ2VzVG9SZW1vdmUuaW5kZXhPZihlKSA9PT0gLTEpO1xuICAgIH1cblxuICAgIGdldEFsbERlc2NlbmRhbnRFZGdlcyhub2RlKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIG5vZGUuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PiB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChlKTtcbiAgICAgICAgICAgIGlmIChlLmNoaWxkTm9kZSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKC4uLnNlbGYuZ2V0QWxsRGVzY2VuZGFudEVkZ2VzKGUuY2hpbGROb2RlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZ2V0QWxsRGVzY2VuZGFudE5vZGVzKG5vZGUpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG5cbiAgICAgICAgbm9kZS5jaGlsZEVkZ2VzLmZvckVhY2goZT0+IHtcbiAgICAgICAgICAgIGlmIChlLmNoaWxkTm9kZSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGUuY2hpbGROb2RlKTtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCguLi5zZWxmLmdldEFsbERlc2NlbmRhbnROb2RlcyhlLmNoaWxkTm9kZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGdldEFsbE5vZGVzSW5TdWJ0cmVlKG5vZGUpIHtcbiAgICAgICAgdmFyIGRlc2NlbmRhbnRzID0gdGhpcy5nZXRBbGxEZXNjZW5kYW50Tm9kZXMobm9kZSk7XG4gICAgICAgIGRlc2NlbmRhbnRzLnVuc2hpZnQobm9kZSk7XG4gICAgICAgIHJldHVybiBkZXNjZW5kYW50cztcbiAgICB9XG5cbiAgICBpc1VuZG9BdmFpbGFibGUoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMudW5kb1N0YWNrLmxlbmd0aFxuICAgIH1cblxuICAgIGlzUmVkb0F2YWlsYWJsZSgpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5yZWRvU3RhY2subGVuZ3RoXG4gICAgfVxuXG4gICAgY3JlYXRlU3RhdGVTbmFwc2hvdChyZXZlcnRDb25mKXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJldmVydENvbmY6IHJldmVydENvbmYsXG4gICAgICAgICAgICBub2RlczogVXRpbHMuY2xvbmVEZWVwKHRoaXMubm9kZXMpLFxuICAgICAgICAgICAgZWRnZXM6IFV0aWxzLmNsb25lRGVlcCh0aGlzLmVkZ2VzKSxcbiAgICAgICAgICAgIHRleHRzOiBVdGlscy5jbG9uZURlZXAodGhpcy50ZXh0cyksXG4gICAgICAgICAgICBleHByZXNzaW9uU2NvcGU6IFV0aWxzLmNsb25lRGVlcCh0aGlzLmV4cHJlc3Npb25TY29wZSksXG4gICAgICAgICAgICBjb2RlOiB0aGlzLmNvZGUsXG4gICAgICAgICAgICAkY29kZUVycm9yOiB0aGlzLiRjb2RlRXJyb3JcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgc2F2ZVN0YXRlRnJvbVNuYXBzaG90KHN0YXRlKXtcbiAgICAgICAgdGhpcy5yZWRvU3RhY2subGVuZ3RoID0gMDtcblxuICAgICAgICB0aGlzLl9wdXNoVG9TdGFjayh0aGlzLnVuZG9TdGFjaywgc3RhdGUpO1xuXG4gICAgICAgIHRoaXMuX2ZpcmVVbmRvUmVkb0NhbGxiYWNrKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2F2ZVN0YXRlKHJldmVydENvbmYpIHtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGVGcm9tU25hcHNob3QodGhpcy5jcmVhdGVTdGF0ZVNuYXBzaG90KHJldmVydENvbmYpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdW5kbygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgbmV3U3RhdGUgPSB0aGlzLnVuZG9TdGFjay5wb3AoKTtcbiAgICAgICAgaWYgKCFuZXdTdGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcHVzaFRvU3RhY2sodGhpcy5yZWRvU3RhY2ssIHtcbiAgICAgICAgICAgIHJldmVydENvbmY6IG5ld1N0YXRlLnJldmVydENvbmYsXG4gICAgICAgICAgICBub2Rlczogc2VsZi5ub2RlcyxcbiAgICAgICAgICAgIGVkZ2VzOiBzZWxmLmVkZ2VzLFxuICAgICAgICAgICAgdGV4dHM6IHNlbGYudGV4dHMsXG4gICAgICAgICAgICBleHByZXNzaW9uU2NvcGU6IHNlbGYuZXhwcmVzc2lvblNjb3BlLFxuICAgICAgICAgICAgY29kZTogc2VsZi5jb2RlLFxuICAgICAgICAgICAgJGNvZGVFcnJvcjogc2VsZi4kY29kZUVycm9yXG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5fc2V0TmV3U3RhdGUobmV3U3RhdGUpO1xuXG4gICAgICAgIHRoaXMuX2ZpcmVVbmRvUmVkb0NhbGxiYWNrKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgcmVkbygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgbmV3U3RhdGUgPSB0aGlzLnJlZG9TdGFjay5wb3AoKTtcbiAgICAgICAgaWYgKCFuZXdTdGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcHVzaFRvU3RhY2sodGhpcy51bmRvU3RhY2ssIHtcbiAgICAgICAgICAgIHJldmVydENvbmY6IG5ld1N0YXRlLnJldmVydENvbmYsXG4gICAgICAgICAgICBub2Rlczogc2VsZi5ub2RlcyxcbiAgICAgICAgICAgIGVkZ2VzOiBzZWxmLmVkZ2VzLFxuICAgICAgICAgICAgdGV4dHM6IHNlbGYudGV4dHMsXG4gICAgICAgICAgICBleHByZXNzaW9uU2NvcGU6IHNlbGYuZXhwcmVzc2lvblNjb3BlLFxuICAgICAgICAgICAgY29kZTogc2VsZi5jb2RlLFxuICAgICAgICAgICAgJGNvZGVFcnJvcjogc2VsZi4kY29kZUVycm9yXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX3NldE5ld1N0YXRlKG5ld1N0YXRlLCB0cnVlKTtcblxuICAgICAgICB0aGlzLl9maXJlVW5kb1JlZG9DYWxsYmFjaygpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLm5vZGVzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuZWRnZXMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy51bmRvU3RhY2subGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5yZWRvU3RhY2subGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy50ZXh0cy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLmNsZWFyRXhwcmVzc2lvblNjb3BlKCk7XG4gICAgICAgIHRoaXMuY29kZSA9ICcnO1xuICAgICAgICB0aGlzLiRjb2RlRXJyb3IgPSBudWxsO1xuICAgICAgICB0aGlzLiRjb2RlRGlydHkgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBhZGRUZXh0KHRleHQpIHtcbiAgICAgICAgdGhpcy50ZXh0cy5wdXNoKHRleHQpO1xuXG4gICAgICAgIHRoaXMuX2ZpcmVUZXh0QWRkZWRDYWxsYmFjayh0ZXh0KTtcbiAgICB9XG5cbiAgICByZW1vdmVUZXh0cyh0ZXh0cykge1xuICAgICAgICB0ZXh0cy5mb3JFYWNoKHQ9PnRoaXMucmVtb3ZlVGV4dCh0KSk7XG4gICAgfVxuXG4gICAgcmVtb3ZlVGV4dCh0ZXh0KSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMudGV4dHMuaW5kZXhPZih0ZXh0KTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHRoaXMudGV4dHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIHRoaXMuX2ZpcmVUZXh0UmVtb3ZlZENhbGxiYWNrKHRleHQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xlYXJFeHByZXNzaW9uU2NvcGUoKSB7XG4gICAgICAgIFV0aWxzLmZvck93bih0aGlzLmV4cHJlc3Npb25TY29wZSwgKHZhbHVlLCBrZXkpPT4ge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuZXhwcmVzc2lvblNjb3BlW2tleV07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9zZXROZXdTdGF0ZShuZXdTdGF0ZSwgcmVkbykge1xuICAgICAgICB2YXIgbm9kZUJ5SWQgPSBVdGlscy5nZXRPYmplY3RCeUlkTWFwKG5ld1N0YXRlLm5vZGVzKTtcbiAgICAgICAgdmFyIGVkZ2VCeUlkID0gVXRpbHMuZ2V0T2JqZWN0QnlJZE1hcChuZXdTdGF0ZS5lZGdlcyk7XG4gICAgICAgIHRoaXMubm9kZXMgPSBuZXdTdGF0ZS5ub2RlcztcbiAgICAgICAgdGhpcy5lZGdlcyA9IG5ld1N0YXRlLmVkZ2VzO1xuICAgICAgICB0aGlzLnRleHRzID0gbmV3U3RhdGUudGV4dHM7XG4gICAgICAgIHRoaXMuZXhwcmVzc2lvblNjb3BlID0gbmV3U3RhdGUuZXhwcmVzc2lvblNjb3BlO1xuICAgICAgICB0aGlzLmNvZGUgPSBuZXdTdGF0ZS5jb2RlO1xuICAgICAgICB0aGlzLiRjb2RlRXJyb3IgID0gbmV3U3RhdGUuJGNvZGVFcnJvclxuXG4gICAgICAgIHRoaXMubm9kZXMuZm9yRWFjaChuPT4ge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuLmNoaWxkRWRnZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZWRnZSA9IGVkZ2VCeUlkW24uY2hpbGRFZGdlc1tpXS4kaWRdO1xuICAgICAgICAgICAgICAgIG4uY2hpbGRFZGdlc1tpXSA9IGVkZ2U7XG4gICAgICAgICAgICAgICAgZWRnZS5wYXJlbnROb2RlID0gbjtcbiAgICAgICAgICAgICAgICBlZGdlLmNoaWxkTm9kZSA9IG5vZGVCeUlkW2VkZ2UuY2hpbGROb2RlLiRpZF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKG5ld1N0YXRlLnJldmVydENvbmYpIHtcbiAgICAgICAgICAgIGlmICghcmVkbyAmJiBuZXdTdGF0ZS5yZXZlcnRDb25mLm9uVW5kbykge1xuICAgICAgICAgICAgICAgIG5ld1N0YXRlLnJldmVydENvbmYub25VbmRvKG5ld1N0YXRlLnJldmVydENvbmYuZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVkbyAmJiBuZXdTdGF0ZS5yZXZlcnRDb25mLm9uUmVkbykge1xuICAgICAgICAgICAgICAgIG5ld1N0YXRlLnJldmVydENvbmYub25SZWRvKG5ld1N0YXRlLnJldmVydENvbmYuZGF0YSk7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICB9XG4gICAgICAgIHRoaXMucmV2ZXJ0Q29uZiA9IG5ld1N0YXRlLnJldmVydENvbmY7XG4gICAgfVxuXG5cbiAgICBfcHVzaFRvU3RhY2soc3RhY2ssIG9iaikge1xuICAgICAgICBpZiAoc3RhY2subGVuZ3RoID49IHRoaXMubWF4U3RhY2tTaXplKSB7XG4gICAgICAgICAgICBzdGFjay5zaGlmdCgpO1xuICAgICAgICB9XG4gICAgICAgIHN0YWNrLnB1c2gob2JqKTtcbiAgICB9XG5cbiAgICBfZmlyZVVuZG9SZWRvQ2FsbGJhY2soKSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLnVuZG9SZWRvU3RhdGVDaGFuZ2VkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMudW5kb1JlZG9TdGF0ZUNoYW5nZWRDYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhub2RlKSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLm5vZGVBZGRlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLm5vZGVBZGRlZENhbGxiYWNrKG5vZGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpcmVOb2RlUmVtb3ZlZENhbGxiYWNrKG5vZGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc0Rpc2FibGVkICYmIHRoaXMubm9kZVJlbW92ZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy5ub2RlUmVtb3ZlZENhbGxiYWNrKG5vZGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpcmVUZXh0QWRkZWRDYWxsYmFjayh0ZXh0KSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLnRleHRBZGRlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLnRleHRBZGRlZENhbGxiYWNrKHRleHQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpcmVUZXh0UmVtb3ZlZENhbGxiYWNrKHRleHQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc0Rpc2FibGVkICYmIHRoaXMudGV4dFJlbW92ZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy50ZXh0UmVtb3ZlZENhbGxiYWNrKHRleHQpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHtPYmplY3RXaXRoQ29tcHV0ZWRWYWx1ZXN9IGZyb20gJy4vb2JqZWN0LXdpdGgtY29tcHV0ZWQtdmFsdWVzJ1xuXG5leHBvcnQgY2xhc3MgRWRnZSBleHRlbmRzIE9iamVjdFdpdGhDb21wdXRlZFZhbHVlc3tcbiAgICBwYXJlbnROb2RlO1xuICAgIGNoaWxkTm9kZTtcblxuICAgIG5hbWU9Jyc7XG4gICAgcHJvYmFiaWxpdHk9dW5kZWZpbmVkO1xuICAgIHBheW9mZj0wO1xuXG4gICAgJERJU1BMQVlfVkFMVUVfTkFNRVMgPSBbJ3Byb2JhYmlsaXR5JywgJ3BheW9mZicsICdvcHRpbWFsJ107XG5cbiAgICBjb25zdHJ1Y3RvcihwYXJlbnROb2RlLCBjaGlsZE5vZGUsIG5hbWUscGF5b2ZmLCBwcm9iYWJpbGl0eSwgKXtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5wYXJlbnROb2RlID0gcGFyZW50Tm9kZTtcbiAgICAgICAgdGhpcy5jaGlsZE5vZGUgPSBjaGlsZE5vZGU7XG5cbiAgICAgICAgaWYobmFtZSE9PXVuZGVmaW5lZCl7XG4gICAgICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICB9XG4gICAgICAgIGlmKHByb2JhYmlsaXR5IT09dW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHRoaXMucHJvYmFiaWxpdHk9cHJvYmFiaWxpdHk7XG4gICAgICAgIH1cbiAgICAgICAgaWYocGF5b2ZmIT09dW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHRoaXMucGF5b2ZmPXBheW9mZlxuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBzZXROYW1lKG5hbWUpe1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXRQcm9iYWJpbGl0eShwcm9iYWJpbGl0eSl7XG4gICAgICAgIHRoaXMucHJvYmFiaWxpdHkgPSBwcm9iYWJpbGl0eTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0UGF5b2ZmKHBheW9mZil7XG4gICAgICAgIHRoaXMucGF5b2ZmID0gcGF5b2ZmO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjb21wdXRlZEJhc2VQcm9iYWJpbGl0eSh2YWwpe1xuICAgICAgICByZXR1cm4gdGhpcy5jb21wdXRlZFZhbHVlKG51bGwsICdwcm9iYWJpbGl0eScsIHZhbCk7XG4gICAgfVxuXG4gICAgY29tcHV0ZWRCYXNlUGF5b2ZmKHZhbCl7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVkVmFsdWUobnVsbCwgJ3BheW9mZicsIHZhbCk7XG4gICAgfVxuXG4gICAgZGlzcGxheVByb2JhYmlsaXR5KHZhbCl7XG4gICAgICAgIHJldHVybiB0aGlzLmRpc3BsYXlWYWx1ZSgncHJvYmFiaWxpdHknLCB2YWwpO1xuICAgIH1cblxuICAgIGRpc3BsYXlQYXlvZmYodmFsKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlzcGxheVZhbHVlKCdwYXlvZmYnLCB2YWwpO1xuICAgIH1cbn1cbiIsImV4cG9ydCAqIGZyb20gJy4vbm9kZS9ub2RlJ1xuZXhwb3J0ICogZnJvbSAnLi9ub2RlL2RlY2lzaW9uLW5vZGUnXG5leHBvcnQgKiBmcm9tICcuL25vZGUvY2hhbmNlLW5vZGUnXG5leHBvcnQgKiBmcm9tICcuL25vZGUvdGVybWluYWwtbm9kZSdcbmV4cG9ydCAqIGZyb20gJy4vZWRnZSdcbmV4cG9ydCAqIGZyb20gJy4vcG9pbnQnXG5leHBvcnQgKiBmcm9tICcuL3RleHQnXG4iLCJpbXBvcnQge05vZGV9IGZyb20gJy4vbm9kZSdcblxuZXhwb3J0IGNsYXNzIENoYW5jZU5vZGUgZXh0ZW5kcyBOb2Rle1xuXG4gICAgc3RhdGljICRUWVBFID0gJ2NoYW5jZSc7XG5cbiAgICBjb25zdHJ1Y3Rvcihsb2NhdGlvbil7XG4gICAgICAgIHN1cGVyKENoYW5jZU5vZGUuJFRZUEUsIGxvY2F0aW9uKTtcbiAgICB9XG59XG4iLCJpbXBvcnQge05vZGV9IGZyb20gJy4vbm9kZSdcblxuZXhwb3J0IGNsYXNzIERlY2lzaW9uTm9kZSBleHRlbmRzIE5vZGV7XG5cbiAgICBzdGF0aWMgJFRZUEUgPSAnZGVjaXNpb24nO1xuXG4gICAgY29uc3RydWN0b3IobG9jYXRpb24pe1xuICAgICAgICBzdXBlcihEZWNpc2lvbk5vZGUuJFRZUEUsIGxvY2F0aW9uKTtcbiAgICB9XG59XG4iLCJpbXBvcnQge1BvaW50fSBmcm9tICcuLi9wb2ludCdcbmltcG9ydCB7T2JqZWN0V2l0aENvbXB1dGVkVmFsdWVzfSBmcm9tICcuLi9vYmplY3Qtd2l0aC1jb21wdXRlZC12YWx1ZXMnXG5cbmV4cG9ydCBjbGFzcyBOb2RlIGV4dGVuZHMgT2JqZWN0V2l0aENvbXB1dGVkVmFsdWVze1xuXG4gICAgdHlwZTtcbiAgICBjaGlsZEVkZ2VzPVtdO1xuICAgIG5hbWU9Jyc7XG5cbiAgICBsb2NhdGlvbjsgLy9Qb2ludFxuXG4gICAgY29kZT0nJztcbiAgICAkY29kZURpcnR5ID0gZmFsc2U7IC8vIGlzIGNvZGUgY2hhbmdlZCB3aXRob3V0IHJlZXZhbHVhdGlvbj9cbiAgICAkY29kZUVycm9yID0gbnVsbDsgLy9jb2RlIGV2YWx1YXRpb24gZXJyb3JzXG5cbiAgICBleHByZXNzaW9uU2NvcGU9bnVsbDtcblxuICAgICRESVNQTEFZX1ZBTFVFX05BTUVTID0gWydjaGlsZHJlblBheW9mZicsICdhZ2dyZWdhdGVkUGF5b2ZmJywgJ3Byb2JhYmlsaXR5VG9FbnRlcicsICdvcHRpbWFsJ11cblxuICAgIGNvbnN0cnVjdG9yKHR5cGUsIGxvY2F0aW9uKXtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5sb2NhdGlvbj1sb2NhdGlvbjtcbiAgICAgICAgaWYoIWxvY2F0aW9uKXtcbiAgICAgICAgICAgIHRoaXMubG9jYXRpb24gPSBuZXcgUG9pbnQoMCwwKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnR5cGU9dHlwZTtcbiAgICB9XG5cbiAgICBzZXROYW1lKG5hbWUpe1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBtb3ZlVG8oeCx5LCB3aXRoQ2hpbGRyZW4peyAvL21vdmUgdG8gbmV3IGxvY2F0aW9uXG4gICAgICAgIGlmKHdpdGhDaGlsZHJlbil7XG4gICAgICAgICAgICB2YXIgZHggPSB4LXRoaXMubG9jYXRpb24ueDtcbiAgICAgICAgICAgIHZhciBkeSA9IHktdGhpcy5sb2NhdGlvbi55O1xuICAgICAgICAgICAgdGhpcy5jaGlsZEVkZ2VzLmZvckVhY2goZT0+ZS5jaGlsZE5vZGUubW92ZShkeCwgZHksIHRydWUpKVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5sb2NhdGlvbi5tb3ZlVG8oeCx5KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbW92ZShkeCwgZHksIHdpdGhDaGlsZHJlbil7IC8vbW92ZSBieSB2ZWN0b3JcbiAgICAgICAgaWYod2l0aENoaWxkcmVuKXtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PmUuY2hpbGROb2RlLm1vdmUoZHgsIGR5LCB0cnVlKSlcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmxvY2F0aW9uLm1vdmUoZHgsIGR5KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtOb2RlfSBmcm9tICcuL25vZGUnXG5cbmV4cG9ydCBjbGFzcyBUZXJtaW5hbE5vZGUgZXh0ZW5kcyBOb2Rle1xuXG4gICAgc3RhdGljICRUWVBFID0gJ3Rlcm1pbmFsJztcblxuICAgIGNvbnN0cnVjdG9yKGxvY2F0aW9uKXtcbiAgICAgICAgc3VwZXIoVGVybWluYWxOb2RlLiRUWVBFLCBsb2NhdGlvbik7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtVdGlsc30gZnJvbSAnc2QtdXRpbHMnXG5cbmltcG9ydCB7T2JqZWN0V2l0aElkQW5kRWRpdGFibGVGaWVsZHN9IGZyb20gXCIuL29iamVjdC13aXRoLWlkLWFuZC1lZGl0YWJsZS1maWVsZHNcIjtcblxuZXhwb3J0IGNsYXNzIE9iamVjdFdpdGhDb21wdXRlZFZhbHVlcyBleHRlbmRzIE9iamVjdFdpdGhJZEFuZEVkaXRhYmxlRmllbGRze1xuXG4gICAgY29tcHV0ZWQ9e307IC8vY29tcHV0ZWQgdmFsdWVzXG5cbiAgICAvKmdldCBvciBzZXQgY29tcHV0ZWQgdmFsdWUqL1xuICAgIGNvbXB1dGVkVmFsdWUocnVsZU5hbWUsIGZpZWxkTmFtZSwgdmFsdWUpe1xuICAgICAgICB2YXIgcGF0aCA9ICdjb21wdXRlZC4nO1xuICAgICAgICBpZihydWxlTmFtZSl7XG4gICAgICAgICAgICBwYXRoKz1ydWxlTmFtZSsnLic7XG4gICAgICAgIH1cbiAgICAgICAgcGF0aCs9ZmllbGROYW1lO1xuICAgICAgICBpZih2YWx1ZT09PXVuZGVmaW5lZCl7XG4gICAgICAgICAgICByZXR1cm4gIFV0aWxzLmdldCh0aGlzLCBwYXRoLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBVdGlscy5zZXQodGhpcywgcGF0aCwgdmFsdWUpO1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuXG4gICAgY2xlYXJDb21wdXRlZFZhbHVlcyhydWxlTmFtZSl7XG4gICAgICAgIGlmKHJ1bGVOYW1lPT11bmRlZmluZWQpe1xuICAgICAgICAgICAgdGhpcy5jb21wdXRlZD17fTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBpZihVdGlscy5pc0FycmF5KHJ1bGVOYW1lKSl7XG4gICAgICAgICAgICBydWxlTmFtZS5mb3JFYWNoKG49PntcbiAgICAgICAgICAgICAgICB0aGlzLmNvbXB1dGVkW25dPXt9O1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb21wdXRlZFtydWxlTmFtZV09e307XG4gICAgfVxuXG4gICAgY2xlYXJEaXNwbGF5VmFsdWVzKCl7XG4gICAgICAgIHRoaXMuY29tcHV0ZWRbJyRkaXNwbGF5VmFsdWVzJ109e307XG4gICAgfVxuXG4gICAgZGlzcGxheVZhbHVlKGZpZWxkTmFtZSwgdmFsdWUpe1xuICAgICAgICByZXR1cm4gdGhpcy5jb21wdXRlZFZhbHVlKG51bGwsICckZGlzcGxheVZhbHVlcy4nK2ZpZWxkTmFtZSwgdmFsdWUpO1xuICAgIH1cblxuICAgIGxvYWRDb21wdXRlZFZhbHVlcyhjb21wdXRlZCl7XG4gICAgICAgIHRoaXMuY29tcHV0ZWQgPSBjb21wdXRlZDtcbiAgICB9XG59XG4iLCJpbXBvcnQge1V0aWxzfSBmcm9tICdzZC11dGlscydcblxuZXhwb3J0IGNsYXNzIE9iamVjdFdpdGhJZEFuZEVkaXRhYmxlRmllbGRzIHtcblxuICAgICRpZCA9IFV0aWxzLmd1aWQoKTsgLy9pbnRlcm5hbCBpZFxuICAgICRmaWVsZFN0YXR1cz17fTtcblxuICAgIGdldEZpZWxkU3RhdHVzKGZpZWxkTmFtZSl7XG4gICAgICAgIGlmKCF0aGlzLiRmaWVsZFN0YXR1c1tmaWVsZE5hbWVdKXtcbiAgICAgICAgICAgIHRoaXMuJGZpZWxkU3RhdHVzW2ZpZWxkTmFtZV0gPSB7XG4gICAgICAgICAgICAgICAgdmFsaWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgc3ludGF4OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy4kZmllbGRTdGF0dXNbZmllbGROYW1lXTtcbiAgICB9XG5cbiAgICBzZXRTeW50YXhWYWxpZGl0eShmaWVsZE5hbWUsIHZhbGlkKXtcbiAgICAgICAgdmFyIGZpZWxkU3RhdHVzID0gdGhpcy5nZXRGaWVsZFN0YXR1cyhmaWVsZE5hbWUpO1xuICAgICAgICBmaWVsZFN0YXR1cy52YWxpZC5zeW50YXggPSB2YWxpZDtcbiAgICB9XG5cbiAgICBzZXRWYWx1ZVZhbGlkaXR5KGZpZWxkTmFtZSwgdmFsaWQpe1xuICAgICAgICB2YXIgZmllbGRTdGF0dXMgPSB0aGlzLmdldEZpZWxkU3RhdHVzKGZpZWxkTmFtZSk7XG4gICAgICAgIGZpZWxkU3RhdHVzLnZhbGlkLnZhbHVlID0gdmFsaWQ7XG4gICAgfVxuXG4gICAgaXNGaWVsZFZhbGlkKGZpZWxkTmFtZSwgc3ludGF4PXRydWUsIHZhbHVlPXRydWUpe1xuICAgICAgICB2YXIgZmllbGRTdGF0dXMgPSB0aGlzLmdldEZpZWxkU3RhdHVzKGZpZWxkTmFtZSk7XG4gICAgICAgIGlmKHN5bnRheCAmJiB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZpZWxkU3RhdHVzLnZhbGlkLnN5bnRheCAmJiBmaWVsZFN0YXR1cy52YWxpZC52YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZihzeW50YXgpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZFN0YXR1cy52YWxpZC5zeW50YXhcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmllbGRTdGF0dXMudmFsaWQudmFsdWU7XG4gICAgfVxuXG5cbn1cbiIsImV4cG9ydCBjbGFzcyBQb2ludCB7XG4gICAgeDtcbiAgICB5O1xuICAgIGNvbnN0cnVjdG9yKHgseSl7XG4gICAgICAgIGlmKHggaW5zdGFuY2VvZiBQb2ludCl7XG4gICAgICAgICAgICB5PXgueTtcbiAgICAgICAgICAgIHg9eC54XG4gICAgICAgIH1lbHNlIGlmKEFycmF5LmlzQXJyYXkoeCkpe1xuICAgICAgICAgICAgeT14WzFdO1xuICAgICAgICAgICAgeD14WzBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMueD14O1xuICAgICAgICB0aGlzLnk9eTtcbiAgICB9XG5cbiAgICBtb3ZlVG8oeCx5KXtcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheSh4KSl7XG4gICAgICAgICAgICB5PXhbMV07XG4gICAgICAgICAgICB4PXhbMF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy54PXg7XG4gICAgICAgIHRoaXMueT15O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBtb3ZlKGR4LGR5KXsgLy9tb3ZlIGJ5IHZlY3RvclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGR4KSl7XG4gICAgICAgICAgICBkeT1keFsxXTtcbiAgICAgICAgICAgIGR4PWR4WzBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMueCs9ZHg7XG4gICAgICAgIHRoaXMueSs9ZHk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHtQb2ludH0gZnJvbSBcIi4vcG9pbnRcIjtcbmltcG9ydCB7VXRpbHN9IGZyb20gXCJzZC11dGlsc1wiO1xuaW1wb3J0IHtPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkc30gZnJvbSBcIi4vb2JqZWN0LXdpdGgtaWQtYW5kLWVkaXRhYmxlLWZpZWxkc1wiO1xuXG5leHBvcnQgY2xhc3MgVGV4dCBleHRlbmRzIE9iamVjdFdpdGhJZEFuZEVkaXRhYmxlRmllbGRze1xuXG4gICAgdmFsdWU9Jyc7XG4gICAgbG9jYXRpb247IC8vUG9pbnRcblxuICAgIGNvbnN0cnVjdG9yKGxvY2F0aW9uLCB2YWx1ZSl7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMubG9jYXRpb249bG9jYXRpb247XG4gICAgICAgIGlmKCFsb2NhdGlvbil7XG4gICAgICAgICAgICB0aGlzLmxvY2F0aW9uID0gbmV3IFBvaW50KDAsMCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZih2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbW92ZVRvKHgseSl7IC8vbW92ZSB0byBuZXcgbG9jYXRpb25cbiAgICAgICAgdGhpcy5sb2NhdGlvbi5tb3ZlVG8oeCx5KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbW92ZShkeCwgZHkpeyAvL21vdmUgYnkgdmVjdG9yXG4gICAgICAgIHRoaXMubG9jYXRpb24ubW92ZShkeCwgZHkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBkb21haW4gZnJvbSAnLi9kb21haW4nXG5leHBvcnQge2RvbWFpbn1cbmV4cG9ydCAqIGZyb20gJy4vZGF0YS1tb2RlbCdcbmV4cG9ydCAqIGZyb20gJy4vdmFsaWRhdGlvbi1yZXN1bHQnXG4iLCJpbXBvcnQge1V0aWxzfSBmcm9tIFwic2QtdXRpbHNcIjtcblxuZXhwb3J0IGNsYXNzIFZhbGlkYXRpb25SZXN1bHR7XG5cblxuICAgIGVycm9ycyA9IHt9O1xuICAgIHdhcm5pbmdzID0ge307XG4gICAgb2JqZWN0SWRUb0Vycm9yPXt9O1xuXG4gICAgYWRkRXJyb3IoZXJyb3IsIG9iail7XG4gICAgICAgIGlmKFV0aWxzLmlzU3RyaW5nKGVycm9yKSl7XG4gICAgICAgICAgICBlcnJvciA9IHtuYW1lOiBlcnJvcn07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5hbWUgPSBlcnJvci5uYW1lO1xuICAgICAgICB2YXIgZXJyb3JzQnlOYW1lID0gdGhpcy5lcnJvcnNbbmFtZV07XG4gICAgICAgIGlmKCFlcnJvcnNCeU5hbWUpe1xuICAgICAgICAgICAgZXJyb3JzQnlOYW1lPVtdO1xuICAgICAgICAgICAgdGhpcy5lcnJvcnNbbmFtZV09ZXJyb3JzQnlOYW1lO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvYmpFID0gdGhpcy5vYmplY3RJZFRvRXJyb3Jbb2JqLiRpZF07XG4gICAgICAgIGlmKCFvYmpFKXtcbiAgICAgICAgICAgIG9iakU9W107XG4gICAgICAgICAgICB0aGlzLm9iamVjdElkVG9FcnJvcltvYmouJGlkXT0gb2JqRTtcbiAgICAgICAgfVxuICAgICAgICBlcnJvcnNCeU5hbWUucHVzaChvYmopO1xuICAgICAgICBvYmpFLnB1c2goZXJyb3IpO1xuICAgIH1cblxuICAgIGFkZFdhcm5pbmcobmFtZSwgb2JqKXtcbiAgICAgICAgdmFyIGUgPSB0aGlzLndhcm5pbmdzW25hbWVdO1xuICAgICAgICBpZighZSl7XG4gICAgICAgICAgICBlPVtdO1xuICAgICAgICAgICAgdGhpcy53YXJuaW5nc1tuYW1lXT1lO1xuICAgICAgICB9XG4gICAgICAgIGUucHVzaChvYmopXG4gICAgfVxuXG4gICAgaXNWYWxpZCgpe1xuICAgICAgICByZXR1cm4gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGhpcy5lcnJvcnMpLmxlbmd0aCA9PT0gMFxuICAgIH1cblxuICAgIHN0YXRpYyBjcmVhdGVGcm9tRFRPKGR0byl7XG4gICAgICAgIHZhciB2ID0gbmV3IFZhbGlkYXRpb25SZXN1bHQoKTtcbiAgICAgICAgdi5lcnJvcnMgPSBkdG8uZXJyb3JzO1xuICAgICAgICB2Lndhcm5pbmdzID0gZHRvLndhcm5pbmdzO1xuICAgICAgICB2Lm9iamVjdElkVG9FcnJvciA9IGR0by5vYmplY3RJZFRvRXJyb3I7XG4gICAgICAgIHJldHVybiB2O1xuICAgIH1cbn1cbiIsImV4cG9ydCAqIGZyb20gJy4vc3JjL2luZGV4J1xuIl19
