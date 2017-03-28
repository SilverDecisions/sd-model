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
            var filterPrivate = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGRhdGEtbW9kZWwuanMiLCJzcmNcXGRvbWFpblxcZWRnZS5qcyIsInNyY1xcZG9tYWluXFxpbmRleC5qcyIsInNyY1xcZG9tYWluXFxub2RlXFxjaGFuY2Utbm9kZS5qcyIsInNyY1xcZG9tYWluXFxub2RlXFxkZWNpc2lvbi1ub2RlLmpzIiwic3JjXFxkb21haW5cXG5vZGVcXG5vZGUuanMiLCJzcmNcXGRvbWFpblxcbm9kZVxcdGVybWluYWwtbm9kZS5qcyIsInNyY1xcZG9tYWluXFxvYmplY3Qtd2l0aC1jb21wdXRlZC12YWx1ZXMuanMiLCJzcmNcXGRvbWFpblxcb2JqZWN0LXdpdGgtaWQtYW5kLWVkaXRhYmxlLWZpZWxkcy5qcyIsInNyY1xcZG9tYWluXFxwb2ludC5qcyIsInNyY1xcZG9tYWluXFx0ZXh0LmpzIiwic3JjXFxpbmRleC5qcyIsInNyY1xcdmFsaWRhdGlvbi1yZXN1bHQuanMiLCJpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDQUE7O0FBRUE7O0ksQUFBWTs7QUFDWjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7OztJLEFBR2Esb0IsQUFBQSx3QkFTVTtBQUZHO0FBcUJ0Qjt1QkFBQSxBQUFZLE1BQU07OEJBQUE7O2FBMUJsQixBQTBCa0IsUUExQlYsQUEwQlU7YUF6QmxCLEFBeUJrQixRQXpCVixBQXlCVTthQXZCbEIsQUF1QmtCLFFBdkJWLEFBdUJVO2FBckJsQixBQXFCa0Isa0JBckJBLEFBcUJBO2FBcEJsQixBQW9Ca0IsT0FwQlgsQUFvQlc7YUFuQmxCLEFBbUJrQixhQW5CTCxBQW1CSzthQWxCbEIsQUFrQmtCLGFBbEJMLEFBa0JLO2FBakJsQixBQWlCa0IsV0FqQlQsQUFpQlM7YUFmbEIsQUFla0Isb0JBZkUsQUFlRjthQVpsQixBQVlrQixlQVpILEFBWUc7YUFYbEIsQUFX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Ozs7Ozs7O0FDL0NMLDJDQUFBO2lEQUFBOztnQkFBQTt3QkFBQTtvQkFBQTtBQUFBO0FBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IHtVdGlsc30gZnJvbSAnc2QtdXRpbHMnXG5pbXBvcnQge2xvZ30gZnJvbSBcInNkLXV0aWxzXCI7XG5pbXBvcnQgKiBhcyBkb21haW4gZnJvbSAnLi9kb21haW4nXG5pbXBvcnQge1ZhbGlkYXRpb25SZXN1bHR9IGZyb20gJy4vdmFsaWRhdGlvbi1yZXN1bHQnXG5cbi8qXG4gKiBEYXRhIG1vZGVsIG1hbmFnZXJcbiAqICovXG5leHBvcnQgY2xhc3MgRGF0YU1vZGVsIHtcblxuICAgIG5vZGVzID0gW107XG4gICAgZWRnZXMgPSBbXTtcblxuICAgIHRleHRzID0gW107IC8vZmxvYXRpbmcgdGV4dHNcblxuICAgIGV4cHJlc3Npb25TY29wZSA9IHt9OyAvL2dsb2JhbCBleHByZXNzaW9uIHNjb3BlXG4gICAgY29kZSA9IFwiXCI7Ly9nbG9iYWwgZXhwcmVzc2lvbiBjb2RlXG4gICAgJGNvZGVFcnJvciA9IG51bGw7IC8vY29kZSBldmFsdWF0aW9uIGVycm9yc1xuICAgICRjb2RlRGlydHkgPSBmYWxzZTsgLy8gaXMgY29kZSBjaGFuZ2VkIHdpdGhvdXQgcmVldmFsdWF0aW9uP1xuICAgICR2ZXJzaW9uPTE7XG5cbiAgICB2YWxpZGF0aW9uUmVzdWx0cyA9IFtdO1xuXG4gICAgLy8gdW5kbyAvIHJlZG9cbiAgICBtYXhTdGFja1NpemUgPSAyMDtcbiAgICB1bmRvU3RhY2sgPSBbXTtcbiAgICByZWRvU3RhY2sgPSBbXTtcbiAgICB1bmRvUmVkb1N0YXRlQ2hhbmdlZENhbGxiYWNrID0gbnVsbDtcbiAgICBub2RlQWRkZWRDYWxsYmFjayA9IG51bGw7XG4gICAgbm9kZVJlbW92ZWRDYWxsYmFjayA9IG51bGw7XG5cbiAgICB0ZXh0QWRkZWRDYWxsYmFjayA9IG51bGw7XG4gICAgdGV4dFJlbW92ZWRDYWxsYmFjayA9IG51bGw7XG5cbiAgICBjYWxsYmFja3NEaXNhYmxlZCA9IGZhbHNlO1xuXG4gICAgY29uc3RydWN0b3IoZGF0YSkge1xuICAgICAgICBpZihkYXRhKXtcbiAgICAgICAgICAgIHRoaXMubG9hZChkYXRhKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldEpzb25SZXBsYWNlcihmaWx0ZXJMb2NhdGlvbj1mYWxzZSwgZmlsdGVyQ29tcHV0ZWQ9ZmFsc2UsIHJlcGxhY2VyLCBmaWx0ZXJQcml2YXRlID10cnVlKXtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIChrLCB2KSB7XG5cbiAgICAgICAgICAgIGlmICgoZmlsdGVyUHJpdmF0ZSAmJiBVdGlscy5zdGFydHNXaXRoKGssICckJykpIHx8IGsgPT0gJ3BhcmVudE5vZGUnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmaWx0ZXJMb2NhdGlvbiAmJiBrID09ICdsb2NhdGlvbicpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZpbHRlckNvbXB1dGVkICYmIGsgPT0gJ2NvbXB1dGVkJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZXBsYWNlcil7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcGxhY2VyKGssIHYpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHNlcmlhbGl6ZShzdHJpbmdpZnk9dHJ1ZSwgZmlsdGVyTG9jYXRpb249ZmFsc2UsIGZpbHRlckNvbXB1dGVkPWZhbHNlLCByZXBsYWNlciwgZmlsdGVyUHJpdmF0ZSA9dHJ1ZSl7XG4gICAgICAgIHZhciBkYXRhID0gIHtcbiAgICAgICAgICAgIGNvZGU6IHRoaXMuY29kZSxcbiAgICAgICAgICAgIGV4cHJlc3Npb25TY29wZTogdGhpcy5leHByZXNzaW9uU2NvcGUsXG4gICAgICAgICAgICB0cmVlczogdGhpcy5nZXRSb290cygpLFxuICAgICAgICAgICAgdGV4dHM6IHRoaXMudGV4dHNcbiAgICAgICAgfTtcblxuICAgICAgICBpZighc3RyaW5naWZ5KXtcbiAgICAgICAgICAgIHJldHVybiBkYXRhO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFV0aWxzLnN0cmluZ2lmeShkYXRhLCB0aGlzLmdldEpzb25SZXBsYWNlcihmaWx0ZXJMb2NhdGlvbiwgZmlsdGVyQ29tcHV0ZWQsIHJlcGxhY2VyLCBmaWx0ZXJQcml2YXRlKSwgW10pO1xuICAgIH1cblxuXG4gICAgLypMb2FkcyBzZXJpYWxpemVkIGRhdGEqL1xuICAgIGxvYWQoZGF0YSkge1xuICAgICAgICAvL3Jvb3RzLCB0ZXh0cywgY29kZSwgZXhwcmVzc2lvblNjb3BlXG4gICAgICAgIHZhciBjYWxsYmFja3NEaXNhYmxlZCA9IHRoaXMuY2FsbGJhY2tzRGlzYWJsZWQ7XG4gICAgICAgIHRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgPSB0cnVlO1xuXG4gICAgICAgIHRoaXMuY2xlYXIoKTtcblxuXG4gICAgICAgIGRhdGEudHJlZXMuZm9yRWFjaChub2RlRGF0YT0+IHtcbiAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy5jcmVhdGVOb2RlRnJvbURhdGEobm9kZURhdGEpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoZGF0YS50ZXh0cykge1xuICAgICAgICAgICAgZGF0YS50ZXh0cy5mb3JFYWNoKHRleHREYXRhPT4ge1xuICAgICAgICAgICAgICAgIHZhciBsb2NhdGlvbiA9IG5ldyBkb21haW4uUG9pbnQodGV4dERhdGEubG9jYXRpb24ueCwgdGV4dERhdGEubG9jYXRpb24ueSk7XG4gICAgICAgICAgICAgICAgdmFyIHRleHQgPSBuZXcgZG9tYWluLlRleHQobG9jYXRpb24sIHRleHREYXRhLnZhbHVlKTtcbiAgICAgICAgICAgICAgICB0aGlzLnRleHRzLnB1c2godGV4dCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jbGVhckV4cHJlc3Npb25TY29wZSgpO1xuICAgICAgICB0aGlzLmNvZGUgPSBkYXRhLmNvZGUgfHwgJyc7XG5cbiAgICAgICAgaWYgKGRhdGEuZXhwcmVzc2lvblNjb3BlKSB7XG4gICAgICAgICAgICBVdGlscy5leHRlbmQodGhpcy5leHByZXNzaW9uU2NvcGUsIGRhdGEuZXhwcmVzc2lvblNjb3BlKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNhbGxiYWNrc0Rpc2FibGVkID0gY2FsbGJhY2tzRGlzYWJsZWQ7XG4gICAgfVxuXG4gICAgZ2V0RFRPKGZpbHRlckxvY2F0aW9uPWZhbHNlLCBmaWx0ZXJDb21wdXRlZD1mYWxzZSwgZmlsdGVyUHJpdmF0ZSA9dHJ1ZSl7XG4gICAgICAgIHZhciBkdG8gPSB7XG4gICAgICAgICAgICBzZXJpYWxpemVkRGF0YTogdGhpcy5zZXJpYWxpemUodHJ1ZSwgZmlsdGVyTG9jYXRpb24sIGZpbHRlckNvbXB1dGVkLCBudWxsLCBmaWx0ZXJQcml2YXRlKSxcbiAgICAgICAgICAgICRjb2RlRXJyb3I6IHRoaXMuJGNvZGVFcnJvcixcbiAgICAgICAgICAgICRjb2RlRGlydHk6IHRoaXMuJGNvZGVEaXJ0eSxcbiAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHRzOiB0aGlzLnZhbGlkYXRpb25SZXN1bHRzLnNsaWNlKClcblxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZHRvXG4gICAgfVxuXG4gICAgbG9hZEZyb21EVE8oZHRvLCBkYXRhUmV2aXZlcil7XG4gICAgICAgIHRoaXMubG9hZChKU09OLnBhcnNlKGR0by5zZXJpYWxpemVkRGF0YSwgZGF0YVJldml2ZXIpKTtcbiAgICAgICAgdGhpcy4kY29kZUVycm9yID0gZHRvLiRjb2RlRXJyb3I7XG4gICAgICAgIHRoaXMuJGNvZGVEaXJ0eSA9IGR0by4kY29kZURpcnR5O1xuICAgICAgICB0aGlzLnZhbGlkYXRpb25SZXN1bHRzLmxlbmd0aD0wO1xuICAgICAgICBkdG8udmFsaWRhdGlvblJlc3VsdHMuZm9yRWFjaCh2PT57XG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRpb25SZXN1bHRzLnB1c2goVmFsaWRhdGlvblJlc3VsdC5jcmVhdGVGcm9tRFRPKHYpKVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8qVGhpcyBtZXRob2QgdXBkYXRlcyBvbmx5IGNvbXB1dGF0aW9uIHJlc3VsdHMvdmFsaWRhdGlvbiovXG4gICAgdXBkYXRlRnJvbShkYXRhTW9kZWwpe1xuICAgICAgICBpZih0aGlzLiR2ZXJzaW9uPmRhdGFNb2RlbC4kdmVyc2lvbil7XG4gICAgICAgICAgICBsb2cud2FybihcIkRhdGFNb2RlbC51cGRhdGVGcm9tOiB2ZXJzaW9uIG9mIGN1cnJlbnQgbW9kZWwgZ3JlYXRlciB0aGFuIHVwZGF0ZVwiKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBieUlkID0ge31cbiAgICAgICAgZGF0YU1vZGVsLm5vZGVzLmZvckVhY2gobj0+e1xuICAgICAgICAgICAgYnlJZFtuLiRpZF0gPSBuO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5ub2Rlcy5mb3JFYWNoKChuLGkpPT57XG4gICAgICAgICAgICBpZihieUlkW24uJGlkXSl7XG4gICAgICAgICAgICAgICAgbi5sb2FkQ29tcHV0ZWRWYWx1ZXMoYnlJZFtuLiRpZF0uY29tcHV0ZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZGF0YU1vZGVsLmVkZ2VzLmZvckVhY2goZT0+e1xuICAgICAgICAgICAgYnlJZFtlLiRpZF0gPSBlO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5lZGdlcy5mb3JFYWNoKChlLGkpPT57XG4gICAgICAgICAgICBpZihieUlkW2UuJGlkXSl7XG4gICAgICAgICAgICAgICAgZS5sb2FkQ29tcHV0ZWRWYWx1ZXMoYnlJZFtlLiRpZF0uY29tcHV0ZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5leHByZXNzaW9uU2NvcGUgPSBkYXRhTW9kZWwuZXhwcmVzc2lvblNjb3BlO1xuICAgICAgICB0aGlzLiRjb2RlRXJyb3IgPSBkYXRhTW9kZWwuJGNvZGVFcnJvcjtcbiAgICAgICAgdGhpcy4kY29kZURpcnR5ID0gZGF0YU1vZGVsLiRjb2RlRGlydHk7XG4gICAgICAgIHRoaXMudmFsaWRhdGlvblJlc3VsdHMgID0gZGF0YU1vZGVsLnZhbGlkYXRpb25SZXN1bHRzO1xuICAgIH1cblxuICAgIC8qY3JlYXRlIG5vZGUgZnJvbSBzZXJpYWxpemVkIGRhdGEqL1xuICAgIGNyZWF0ZU5vZGVGcm9tRGF0YShkYXRhLCBwYXJlbnQpIHtcbiAgICAgICAgdmFyIG5vZGUsIGxvY2F0aW9uO1xuXG4gICAgICAgIGlmKGRhdGEubG9jYXRpb24pe1xuICAgICAgICAgICAgbG9jYXRpb24gPSBuZXcgZG9tYWluLlBvaW50KGRhdGEubG9jYXRpb24ueCwgZGF0YS5sb2NhdGlvbi55KTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBsb2NhdGlvbiA9IG5ldyBkb21haW4uUG9pbnQoMCwwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkb21haW4uRGVjaXNpb25Ob2RlLiRUWVBFID09IGRhdGEudHlwZSkge1xuICAgICAgICAgICAgbm9kZSA9IG5ldyBkb21haW4uRGVjaXNpb25Ob2RlKGxvY2F0aW9uKTtcbiAgICAgICAgfSBlbHNlIGlmIChkb21haW4uQ2hhbmNlTm9kZS4kVFlQRSA9PSBkYXRhLnR5cGUpIHtcbiAgICAgICAgICAgIG5vZGUgPSBuZXcgZG9tYWluLkNoYW5jZU5vZGUobG9jYXRpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKGRvbWFpbi5UZXJtaW5hbE5vZGUuJFRZUEUgPT0gZGF0YS50eXBlKSB7XG4gICAgICAgICAgICBub2RlID0gbmV3IGRvbWFpbi5UZXJtaW5hbE5vZGUobG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGlmKGRhdGEuJGlkKXtcbiAgICAgICAgICAgIG5vZGUuJGlkID0gZGF0YS4kaWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYoZGF0YS4kZmllbGRTdGF0dXMpe1xuICAgICAgICAgICAgbm9kZS4kZmllbGRTdGF0dXMgPSBkYXRhLiRmaWVsZFN0YXR1cztcbiAgICAgICAgfVxuICAgICAgICBub2RlLm5hbWUgPSBkYXRhLm5hbWU7XG5cbiAgICAgICAgaWYoZGF0YS5jb2RlKXtcbiAgICAgICAgICAgIG5vZGUuY29kZSA9IGRhdGEuY29kZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGF0YS5leHByZXNzaW9uU2NvcGUpIHtcbiAgICAgICAgICAgIG5vZGUuZXhwcmVzc2lvblNjb3BlID0gZGF0YS5leHByZXNzaW9uU2NvcGVcbiAgICAgICAgfVxuICAgICAgICBpZihkYXRhLmNvbXB1dGVkKXtcbiAgICAgICAgICAgIG5vZGUubG9hZENvbXB1dGVkVmFsdWVzKGRhdGEuY29tcHV0ZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGVkZ2VPck5vZGUgPSB0aGlzLmFkZE5vZGUobm9kZSwgcGFyZW50KTtcbiAgICAgICAgZGF0YS5jaGlsZEVkZ2VzLmZvckVhY2goZWQ9PiB7XG4gICAgICAgICAgICB2YXIgZWRnZSA9IHRoaXMuY3JlYXRlTm9kZUZyb21EYXRhKGVkLmNoaWxkTm9kZSwgbm9kZSk7XG4gICAgICAgICAgICBlZGdlLnBheW9mZiA9IGVkLnBheW9mZjtcbiAgICAgICAgICAgIGVkZ2UucHJvYmFiaWxpdHkgPSBlZC5wcm9iYWJpbGl0eTtcbiAgICAgICAgICAgIGVkZ2UubmFtZSA9IGVkLm5hbWU7XG4gICAgICAgICAgICBpZihlZC5jb21wdXRlZCl7XG4gICAgICAgICAgICAgICAgZWRnZS5sb2FkQ29tcHV0ZWRWYWx1ZXMoZWQuY29tcHV0ZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZWQuJGlkKXtcbiAgICAgICAgICAgICAgICBlZGdlLiRpZCA9IGVkLiRpZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGVkLiRmaWVsZFN0YXR1cyl7XG4gICAgICAgICAgICAgICAgZWRnZS4kZmllbGRTdGF0dXMgPSBlZC4kZmllbGRTdGF0dXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBlZGdlT3JOb2RlO1xuICAgIH1cblxuICAgIC8qcmV0dXJucyBub2RlIG9yIGVkZ2UgZnJvbSBwYXJlbnQgdG8gdGhpcyBub2RlKi9cbiAgICBhZGROb2RlKG5vZGUsIHBhcmVudCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYubm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgdmFyIGVkZ2UgPSBzZWxmLl9hZGRDaGlsZChwYXJlbnQsIG5vZGUpO1xuICAgICAgICAgICAgdGhpcy5fZmlyZU5vZGVBZGRlZENhbGxiYWNrKG5vZGUpO1xuICAgICAgICAgICAgcmV0dXJuIGVkZ2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9maXJlTm9kZUFkZGVkQ2FsbGJhY2sobm9kZSk7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIC8qaW5qZWN0cyBnaXZlbiBub2RlIGludG8gZ2l2ZW4gZWRnZSovXG4gICAgaW5qZWN0Tm9kZShub2RlLCBlZGdlKSB7XG4gICAgICAgIHZhciBwYXJlbnQgPSBlZGdlLnBhcmVudE5vZGU7XG4gICAgICAgIHZhciBjaGlsZCA9IGVkZ2UuY2hpbGROb2RlO1xuICAgICAgICB0aGlzLm5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgIG5vZGUuJHBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgZWRnZS5jaGlsZE5vZGUgPSBub2RlO1xuICAgICAgICB0aGlzLl9hZGRDaGlsZChub2RlLCBjaGlsZCk7XG4gICAgICAgIHRoaXMuX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhub2RlKTtcbiAgICB9XG5cbiAgICBfYWRkQ2hpbGQocGFyZW50LCBjaGlsZCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBlZGdlID0gbmV3IGRvbWFpbi5FZGdlKHBhcmVudCwgY2hpbGQpO1xuICAgICAgICBzZWxmLl9zZXRFZGdlSW5pdGlhbFByb2JhYmlsaXR5KGVkZ2UpO1xuICAgICAgICBzZWxmLmVkZ2VzLnB1c2goZWRnZSk7XG5cbiAgICAgICAgcGFyZW50LmNoaWxkRWRnZXMucHVzaChlZGdlKTtcbiAgICAgICAgY2hpbGQuJHBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgcmV0dXJuIGVkZ2U7XG4gICAgfVxuXG4gICAgX3NldEVkZ2VJbml0aWFsUHJvYmFiaWxpdHkoZWRnZSkge1xuICAgICAgICBpZiAoZWRnZS5wYXJlbnROb2RlIGluc3RhbmNlb2YgZG9tYWluLkNoYW5jZU5vZGUpIHtcbiAgICAgICAgICAgIGVkZ2UucHJvYmFiaWxpdHkgPSAnIyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlZGdlLnByb2JhYmlsaXR5ID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICAvKnJlbW92ZXMgZ2l2ZW4gbm9kZSBhbmQgaXRzIHN1YnRyZWUqL1xuICAgIHJlbW92ZU5vZGUobm9kZSwgJGwgPSAwKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBub2RlLmNoaWxkRWRnZXMuZm9yRWFjaChlPT5zZWxmLnJlbW92ZU5vZGUoZS5jaGlsZE5vZGUsICRsICsgMSkpO1xuXG4gICAgICAgIHNlbGYuX3JlbW92ZU5vZGUobm9kZSk7XG4gICAgICAgIHZhciBwYXJlbnQgPSBub2RlLiRwYXJlbnQ7XG4gICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnRFZGdlID0gVXRpbHMuZmluZChwYXJlbnQuY2hpbGRFZGdlcywgKGUsIGkpPT4gZS5jaGlsZE5vZGUgPT09IG5vZGUpO1xuICAgICAgICAgICAgaWYgKCRsID09IDApIHtcbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUVkZ2UocGFyZW50RWRnZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuX3JlbW92ZUVkZ2UocGFyZW50RWRnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZmlyZU5vZGVSZW1vdmVkQ2FsbGJhY2sobm9kZSk7XG4gICAgfVxuXG4gICAgLypyZW1vdmVzIGdpdmVuIG5vZGVzIGFuZCB0aGVpciBzdWJ0cmVlcyovXG4gICAgcmVtb3ZlTm9kZXMobm9kZXMpIHtcblxuICAgICAgICB2YXIgcm9vdHMgPSB0aGlzLmZpbmRTdWJ0cmVlUm9vdHMobm9kZXMpO1xuICAgICAgICByb290cy5mb3JFYWNoKG49PnRoaXMucmVtb3ZlTm9kZShuLCAwKSwgdGhpcyk7XG4gICAgfVxuXG4gICAgY29udmVydE5vZGUobm9kZSwgdHlwZVRvQ29udmVydFRvKXtcbiAgICAgICAgdmFyIG5ld05vZGU7XG4gICAgICAgIGlmKCFub2RlLmNoaWxkRWRnZXMubGVuZ3RoICYmIG5vZGUuJHBhcmVudCl7XG4gICAgICAgICAgICBuZXdOb2RlID0gdGhpcy5jcmVhdGVOb2RlQnlUeXBlKHR5cGVUb0NvbnZlcnRUbywgbm9kZS5sb2NhdGlvbik7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgaWYobm9kZSBpbnN0YW5jZW9mIGRvbWFpbi5EZWNpc2lvbk5vZGUgJiYgdHlwZVRvQ29udmVydFRvPT1kb21haW4uQ2hhbmNlTm9kZS4kVFlQRSl7XG4gICAgICAgICAgICAgICAgbmV3Tm9kZSA9IHRoaXMuY3JlYXRlTm9kZUJ5VHlwZSh0eXBlVG9Db252ZXJ0VG8sIG5vZGUubG9jYXRpb24pO1xuICAgICAgICAgICAgfWVsc2UgaWYodHlwZVRvQ29udmVydFRvPT1kb21haW4uRGVjaXNpb25Ob2RlLiRUWVBFKXtcbiAgICAgICAgICAgICAgICBuZXdOb2RlID0gdGhpcy5jcmVhdGVOb2RlQnlUeXBlKHR5cGVUb0NvbnZlcnRUbywgbm9kZS5sb2NhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZihuZXdOb2RlKXtcbiAgICAgICAgICAgIG5ld05vZGUubmFtZT1ub2RlLm5hbWU7XG4gICAgICAgICAgICB0aGlzLnJlcGxhY2VOb2RlKG5ld05vZGUsIG5vZGUpO1xuICAgICAgICAgICAgbmV3Tm9kZS5jaGlsZEVkZ2VzLmZvckVhY2goZT0+dGhpcy5fc2V0RWRnZUluaXRpYWxQcm9iYWJpbGl0eShlKSk7XG4gICAgICAgICAgICB0aGlzLl9maXJlTm9kZUFkZGVkQ2FsbGJhY2sobmV3Tm9kZSk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGNyZWF0ZU5vZGVCeVR5cGUodHlwZSwgbG9jYXRpb24pe1xuICAgICAgICBpZih0eXBlPT1kb21haW4uRGVjaXNpb25Ob2RlLiRUWVBFKXtcbiAgICAgICAgICAgIHJldHVybiBuZXcgZG9tYWluLkRlY2lzaW9uTm9kZShsb2NhdGlvbilcbiAgICAgICAgfWVsc2UgaWYodHlwZT09ZG9tYWluLkNoYW5jZU5vZGUuJFRZUEUpe1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBkb21haW4uQ2hhbmNlTm9kZShsb2NhdGlvbilcbiAgICAgICAgfWVsc2UgaWYodHlwZT09ZG9tYWluLlRlcm1pbmFsTm9kZS4kVFlQRSl7XG4gICAgICAgICAgICByZXR1cm4gbmV3IGRvbWFpbi5UZXJtaW5hbE5vZGUobG9jYXRpb24pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXBsYWNlTm9kZShuZXdOb2RlLCBvbGROb2RlKXtcbiAgICAgICAgdmFyIHBhcmVudCA9IG9sZE5vZGUuJHBhcmVudDtcbiAgICAgICAgbmV3Tm9kZS4kcGFyZW50ID0gcGFyZW50O1xuXG4gICAgICAgIGlmKHBhcmVudCl7XG4gICAgICAgICAgICB2YXIgcGFyZW50RWRnZSA9IFV0aWxzLmZpbmQobmV3Tm9kZS4kcGFyZW50LmNoaWxkRWRnZXMsIGU9PmUuY2hpbGROb2RlPT09b2xkTm9kZSk7XG4gICAgICAgICAgICBwYXJlbnRFZGdlLmNoaWxkTm9kZSA9IG5ld05vZGU7XG4gICAgICAgIH1cblxuICAgICAgICBuZXdOb2RlLmNoaWxkRWRnZXMgPSBvbGROb2RlLmNoaWxkRWRnZXM7XG4gICAgICAgIG5ld05vZGUuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PmUucGFyZW50Tm9kZT1uZXdOb2RlKTtcblxuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLm5vZGVzLmluZGV4T2Yob2xkTm9kZSk7XG4gICAgICAgIGlmKH5pbmRleCl7XG4gICAgICAgICAgICB0aGlzLm5vZGVzW2luZGV4XT1uZXdOb2RlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0Um9vdHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vZGVzLmZpbHRlcihuPT4hbi4kcGFyZW50KTtcbiAgICB9XG5cbiAgICBmaW5kU3VidHJlZVJvb3RzKG5vZGVzKSB7XG4gICAgICAgIHJldHVybiBub2Rlcy5maWx0ZXIobj0+IW4uJHBhcmVudCB8fCBub2Rlcy5pbmRleE9mKG4uJHBhcmVudCkgPT09IC0xKTtcbiAgICB9XG5cbiAgICAvKmNyZWF0ZXMgZGV0YWNoZWQgY2xvbmUgb2YgZ2l2ZW4gbm9kZSovXG4gICAgY2xvbmVTdWJ0cmVlKG5vZGVUb0NvcHksIGNsb25lQ29tcHV0ZWRWYWx1ZXMpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgY2xvbmUgPSB0aGlzLmNsb25lTm9kZShub2RlVG9Db3B5KTtcblxuICAgICAgICBub2RlVG9Db3B5LmNoaWxkRWRnZXMuZm9yRWFjaChlPT4ge1xuICAgICAgICAgICAgdmFyIGNoaWxkQ2xvbmUgPSBzZWxmLmNsb25lU3VidHJlZShlLmNoaWxkTm9kZSwgY2xvbmVDb21wdXRlZFZhbHVlcyk7XG4gICAgICAgICAgICBjaGlsZENsb25lLiRwYXJlbnQgPSBjbG9uZTtcbiAgICAgICAgICAgIHZhciBlZGdlID0gbmV3IGRvbWFpbi5FZGdlKGNsb25lLCBjaGlsZENsb25lLCBlLm5hbWUsIGUucGF5b2ZmLCBlLnByb2JhYmlsaXR5KTtcbiAgICAgICAgICAgIGlmIChjbG9uZUNvbXB1dGVkVmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgZWRnZS5jb21wdXRlZCA9IFV0aWxzLmNsb25lRGVlcChlLmNvbXB1dGVkKVxuICAgICAgICAgICAgICAgIGNoaWxkQ2xvbmUuY29tcHV0ZWQgPSBVdGlscy5jbG9uZURlZXAoZS5jaGlsZE5vZGUuY29tcHV0ZWQpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjbG9uZS5jaGlsZEVkZ2VzLnB1c2goZWRnZSk7XG4gICAgICAgIH0pO1xuICAgICAgICBpZiAoY2xvbmVDb21wdXRlZFZhbHVlcykge1xuICAgICAgICAgICAgY2xvbmUuY29tcHV0ZWQgPSBVdGlscy5jbG9uZURlZXAobm9kZVRvQ29weS5jb21wdXRlZClcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2xvbmU7XG4gICAgfVxuXG4gICAgLyphdHRhY2hlcyBkZXRhY2hlZCBzdWJ0cmVlIHRvIGdpdmVuIHBhcmVudCovXG4gICAgYXR0YWNoU3VidHJlZShub2RlVG9BdHRhY2gsIHBhcmVudCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBub2RlT3JFZGdlID0gc2VsZi5hZGROb2RlKG5vZGVUb0F0dGFjaCwgcGFyZW50KTtcblxuICAgICAgICB2YXIgY2hpbGRFZGdlcyA9IHNlbGYuZ2V0QWxsRGVzY2VuZGFudEVkZ2VzKG5vZGVUb0F0dGFjaCk7XG4gICAgICAgIGNoaWxkRWRnZXMuZm9yRWFjaChlPT4ge1xuICAgICAgICAgICAgc2VsZi5lZGdlcy5wdXNoKGUpO1xuICAgICAgICAgICAgc2VsZi5ub2Rlcy5wdXNoKGUuY2hpbGROb2RlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG5vZGVPckVkZ2U7XG4gICAgfVxuXG4gICAgY2xvbmVOb2Rlcyhub2Rlcykge1xuICAgICAgICB2YXIgcm9vdHMgPSBbXVxuICAgICAgICAvL1RPRE9cbiAgICB9XG5cbiAgICAvKnNoYWxsb3cgY2xvbmUgd2l0aG91dCBwYXJlbnQgYW5kIGNoaWxkcmVuKi9cbiAgICBjbG9uZU5vZGUobm9kZSkge1xuICAgICAgICB2YXIgY2xvbmUgPSBVdGlscy5jbG9uZShub2RlKVxuICAgICAgICBjbG9uZS4kaWQgPSBVdGlscy5ndWlkKCk7XG4gICAgICAgIGNsb25lLmxvY2F0aW9uID0gVXRpbHMuY2xvbmUobm9kZS5sb2NhdGlvbik7XG4gICAgICAgIGNsb25lLmNvbXB1dGVkID0gVXRpbHMuY2xvbmUobm9kZS5jb21wdXRlZCk7XG4gICAgICAgIGNsb25lLiRwYXJlbnQgPSBudWxsO1xuICAgICAgICBjbG9uZS5jaGlsZEVkZ2VzID0gW107XG4gICAgICAgIHJldHVybiBjbG9uZTtcbiAgICB9XG5cbiAgICBmaW5kTm9kZUJ5SWQoaWQpIHtcbiAgICAgICAgcmV0dXJuIFV0aWxzLmZpbmQodGhpcy5ub2Rlcywgbj0+bi4kaWQgPT0gaWQpO1xuICAgIH1cblxuICAgIGZpbmRFZGdlQnlJZChpZCkge1xuICAgICAgICByZXR1cm4gVXRpbHMuZmluZCh0aGlzLmVkZ2VzLCBlPT5lLiRpZCA9PSBpZCk7XG4gICAgfVxuXG4gICAgZmluZEJ5SWQoaWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmZpbmROb2RlQnlJZChpZCk7XG4gICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5maW5kRWRnZUJ5SWQoaWQpO1xuICAgIH1cblxuICAgIF9yZW1vdmVOb2RlKG5vZGUpIHsvLyBzaW1wbHkgcmVtb3ZlcyBub2RlIGZyb20gbm9kZSBsaXN0XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMubm9kZXMuaW5kZXhPZihub2RlKTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHRoaXMubm9kZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbW92ZUVkZ2UoZWRnZSkge1xuICAgICAgICB2YXIgaW5kZXggPSBlZGdlLnBhcmVudE5vZGUuY2hpbGRFZGdlcy5pbmRleE9mKGVkZ2UpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgZWRnZS5wYXJlbnROb2RlLmNoaWxkRWRnZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZW1vdmVFZGdlKGVkZ2UpO1xuICAgIH1cblxuICAgIF9yZW1vdmVFZGdlKGVkZ2UpIHsgLy9yZW1vdmVzIGVkZ2UgZnJvbSBlZGdlIGxpc3Qgd2l0aG91dCByZW1vdmluZyBjb25uZWN0ZWQgbm9kZXNcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5lZGdlcy5pbmRleE9mKGVkZ2UpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5lZGdlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3JlbW92ZU5vZGVzKG5vZGVzVG9SZW1vdmUpIHtcbiAgICAgICAgdGhpcy5ub2RlcyA9IHRoaXMubm9kZXMuZmlsdGVyKG49Pm5vZGVzVG9SZW1vdmUuaW5kZXhPZihuKSA9PT0gLTEpO1xuICAgIH1cblxuICAgIF9yZW1vdmVFZGdlcyhlZGdlc1RvUmVtb3ZlKSB7XG4gICAgICAgIHRoaXMuZWRnZXMgPSB0aGlzLmVkZ2VzLmZpbHRlcihlPT5lZGdlc1RvUmVtb3ZlLmluZGV4T2YoZSkgPT09IC0xKTtcbiAgICB9XG5cbiAgICBnZXRBbGxEZXNjZW5kYW50RWRnZXMobm9kZSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgICAgICBub2RlLmNoaWxkRWRnZXMuZm9yRWFjaChlPT4ge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goZSk7XG4gICAgICAgICAgICBpZiAoZS5jaGlsZE5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCguLi5zZWxmLmdldEFsbERlc2NlbmRhbnRFZGdlcyhlLmNoaWxkTm9kZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGdldEFsbERlc2NlbmRhbnROb2Rlcyhub2RlKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIG5vZGUuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PiB7XG4gICAgICAgICAgICBpZiAoZS5jaGlsZE5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChlLmNoaWxkTm9kZSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goLi4uc2VsZi5nZXRBbGxEZXNjZW5kYW50Tm9kZXMoZS5jaGlsZE5vZGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBnZXRBbGxOb2Rlc0luU3VidHJlZShub2RlKSB7XG4gICAgICAgIHZhciBkZXNjZW5kYW50cyA9IHRoaXMuZ2V0QWxsRGVzY2VuZGFudE5vZGVzKG5vZGUpO1xuICAgICAgICBkZXNjZW5kYW50cy51bnNoaWZ0KG5vZGUpO1xuICAgICAgICByZXR1cm4gZGVzY2VuZGFudHM7XG4gICAgfVxuXG4gICAgaXNVbmRvQXZhaWxhYmxlKCkge1xuICAgICAgICByZXR1cm4gISF0aGlzLnVuZG9TdGFjay5sZW5ndGhcbiAgICB9XG5cbiAgICBpc1JlZG9BdmFpbGFibGUoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMucmVkb1N0YWNrLmxlbmd0aFxuICAgIH1cblxuICAgIGNyZWF0ZVN0YXRlU25hcHNob3QocmV2ZXJ0Q29uZil7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXZlcnRDb25mOiByZXZlcnRDb25mLFxuICAgICAgICAgICAgbm9kZXM6IFV0aWxzLmNsb25lRGVlcCh0aGlzLm5vZGVzKSxcbiAgICAgICAgICAgIGVkZ2VzOiBVdGlscy5jbG9uZURlZXAodGhpcy5lZGdlcyksXG4gICAgICAgICAgICB0ZXh0czogVXRpbHMuY2xvbmVEZWVwKHRoaXMudGV4dHMpLFxuICAgICAgICAgICAgZXhwcmVzc2lvblNjb3BlOiBVdGlscy5jbG9uZURlZXAodGhpcy5leHByZXNzaW9uU2NvcGUpLFxuICAgICAgICAgICAgY29kZTogdGhpcy5jb2RlLFxuICAgICAgICAgICAgJGNvZGVFcnJvcjogdGhpcy4kY29kZUVycm9yXG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHNhdmVTdGF0ZUZyb21TbmFwc2hvdChzdGF0ZSl7XG4gICAgICAgIHRoaXMucmVkb1N0YWNrLmxlbmd0aCA9IDA7XG5cbiAgICAgICAgdGhpcy5fcHVzaFRvU3RhY2sodGhpcy51bmRvU3RhY2ssIHN0YXRlKTtcblxuICAgICAgICB0aGlzLl9maXJlVW5kb1JlZG9DYWxsYmFjaygpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNhdmVTdGF0ZShyZXZlcnRDb25mKSB7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlRnJvbVNuYXBzaG90KHRoaXMuY3JlYXRlU3RhdGVTbmFwc2hvdChyZXZlcnRDb25mKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHVuZG8oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG5ld1N0YXRlID0gdGhpcy51bmRvU3RhY2sucG9wKCk7XG4gICAgICAgIGlmICghbmV3U3RhdGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3B1c2hUb1N0YWNrKHRoaXMucmVkb1N0YWNrLCB7XG4gICAgICAgICAgICByZXZlcnRDb25mOiBuZXdTdGF0ZS5yZXZlcnRDb25mLFxuICAgICAgICAgICAgbm9kZXM6IHNlbGYubm9kZXMsXG4gICAgICAgICAgICBlZGdlczogc2VsZi5lZGdlcyxcbiAgICAgICAgICAgIHRleHRzOiBzZWxmLnRleHRzLFxuICAgICAgICAgICAgZXhwcmVzc2lvblNjb3BlOiBzZWxmLmV4cHJlc3Npb25TY29wZSxcbiAgICAgICAgICAgIGNvZGU6IHNlbGYuY29kZSxcbiAgICAgICAgICAgICRjb2RlRXJyb3I6IHNlbGYuJGNvZGVFcnJvclxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX3NldE5ld1N0YXRlKG5ld1N0YXRlKTtcblxuICAgICAgICB0aGlzLl9maXJlVW5kb1JlZG9DYWxsYmFjaygpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJlZG8oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG5ld1N0YXRlID0gdGhpcy5yZWRvU3RhY2sucG9wKCk7XG4gICAgICAgIGlmICghbmV3U3RhdGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3B1c2hUb1N0YWNrKHRoaXMudW5kb1N0YWNrLCB7XG4gICAgICAgICAgICByZXZlcnRDb25mOiBuZXdTdGF0ZS5yZXZlcnRDb25mLFxuICAgICAgICAgICAgbm9kZXM6IHNlbGYubm9kZXMsXG4gICAgICAgICAgICBlZGdlczogc2VsZi5lZGdlcyxcbiAgICAgICAgICAgIHRleHRzOiBzZWxmLnRleHRzLFxuICAgICAgICAgICAgZXhwcmVzc2lvblNjb3BlOiBzZWxmLmV4cHJlc3Npb25TY29wZSxcbiAgICAgICAgICAgIGNvZGU6IHNlbGYuY29kZSxcbiAgICAgICAgICAgICRjb2RlRXJyb3I6IHNlbGYuJGNvZGVFcnJvclxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl9zZXROZXdTdGF0ZShuZXdTdGF0ZSwgdHJ1ZSk7XG5cbiAgICAgICAgdGhpcy5fZmlyZVVuZG9SZWRvQ2FsbGJhY2soKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBjbGVhcigpIHtcbiAgICAgICAgdGhpcy5ub2Rlcy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLmVkZ2VzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMudW5kb1N0YWNrLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMucmVkb1N0YWNrLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMudGV4dHMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5jbGVhckV4cHJlc3Npb25TY29wZSgpO1xuICAgICAgICB0aGlzLmNvZGUgPSAnJztcbiAgICAgICAgdGhpcy4kY29kZUVycm9yID0gbnVsbDtcbiAgICAgICAgdGhpcy4kY29kZURpcnR5ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgYWRkVGV4dCh0ZXh0KSB7XG4gICAgICAgIHRoaXMudGV4dHMucHVzaCh0ZXh0KTtcblxuICAgICAgICB0aGlzLl9maXJlVGV4dEFkZGVkQ2FsbGJhY2sodGV4dCk7XG4gICAgfVxuXG4gICAgcmVtb3ZlVGV4dHModGV4dHMpIHtcbiAgICAgICAgdGV4dHMuZm9yRWFjaCh0PT50aGlzLnJlbW92ZVRleHQodCkpO1xuICAgIH1cblxuICAgIHJlbW92ZVRleHQodGV4dCkge1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLnRleHRzLmluZGV4T2YodGV4dCk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICB0aGlzLnRleHRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB0aGlzLl9maXJlVGV4dFJlbW92ZWRDYWxsYmFjayh0ZXh0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsZWFyRXhwcmVzc2lvblNjb3BlKCkge1xuICAgICAgICBVdGlscy5mb3JPd24odGhpcy5leHByZXNzaW9uU2NvcGUsICh2YWx1ZSwga2V5KT0+IHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmV4cHJlc3Npb25TY29wZVtrZXldO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBfc2V0TmV3U3RhdGUobmV3U3RhdGUsIHJlZG8pIHtcbiAgICAgICAgdmFyIG5vZGVCeUlkID0gVXRpbHMuZ2V0T2JqZWN0QnlJZE1hcChuZXdTdGF0ZS5ub2Rlcyk7XG4gICAgICAgIHZhciBlZGdlQnlJZCA9IFV0aWxzLmdldE9iamVjdEJ5SWRNYXAobmV3U3RhdGUuZWRnZXMpO1xuICAgICAgICB0aGlzLm5vZGVzID0gbmV3U3RhdGUubm9kZXM7XG4gICAgICAgIHRoaXMuZWRnZXMgPSBuZXdTdGF0ZS5lZGdlcztcbiAgICAgICAgdGhpcy50ZXh0cyA9IG5ld1N0YXRlLnRleHRzO1xuICAgICAgICB0aGlzLmV4cHJlc3Npb25TY29wZSA9IG5ld1N0YXRlLmV4cHJlc3Npb25TY29wZTtcbiAgICAgICAgdGhpcy5jb2RlID0gbmV3U3RhdGUuY29kZTtcbiAgICAgICAgdGhpcy4kY29kZUVycm9yICA9IG5ld1N0YXRlLiRjb2RlRXJyb3JcblxuICAgICAgICB0aGlzLm5vZGVzLmZvckVhY2gobj0+IHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbi5jaGlsZEVkZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVkZ2UgPSBlZGdlQnlJZFtuLmNoaWxkRWRnZXNbaV0uJGlkXTtcbiAgICAgICAgICAgICAgICBuLmNoaWxkRWRnZXNbaV0gPSBlZGdlO1xuICAgICAgICAgICAgICAgIGVkZ2UucGFyZW50Tm9kZSA9IG47XG4gICAgICAgICAgICAgICAgZWRnZS5jaGlsZE5vZGUgPSBub2RlQnlJZFtlZGdlLmNoaWxkTm9kZS4kaWRdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChuZXdTdGF0ZS5yZXZlcnRDb25mKSB7XG4gICAgICAgICAgICBpZiAoIXJlZG8gJiYgbmV3U3RhdGUucmV2ZXJ0Q29uZi5vblVuZG8pIHtcbiAgICAgICAgICAgICAgICBuZXdTdGF0ZS5yZXZlcnRDb25mLm9uVW5kbyhuZXdTdGF0ZS5yZXZlcnRDb25mLmRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlZG8gJiYgbmV3U3RhdGUucmV2ZXJ0Q29uZi5vblJlZG8pIHtcbiAgICAgICAgICAgICAgICBuZXdTdGF0ZS5yZXZlcnRDb25mLm9uUmVkbyhuZXdTdGF0ZS5yZXZlcnRDb25mLmRhdGEpO1xuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgfVxuICAgICAgICB0aGlzLnJldmVydENvbmYgPSBuZXdTdGF0ZS5yZXZlcnRDb25mO1xuICAgIH1cblxuXG4gICAgX3B1c2hUb1N0YWNrKHN0YWNrLCBvYmopIHtcbiAgICAgICAgaWYgKHN0YWNrLmxlbmd0aCA+PSB0aGlzLm1heFN0YWNrU2l6ZSkge1xuICAgICAgICAgICAgc3RhY2suc2hpZnQoKTtcbiAgICAgICAgfVxuICAgICAgICBzdGFjay5wdXNoKG9iaik7XG4gICAgfVxuXG4gICAgX2ZpcmVVbmRvUmVkb0NhbGxiYWNrKCkge1xuICAgICAgICBpZiAoIXRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgJiYgdGhpcy51bmRvUmVkb1N0YXRlQ2hhbmdlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLnVuZG9SZWRvU3RhdGVDaGFuZ2VkQ2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9maXJlTm9kZUFkZGVkQ2FsbGJhY2sobm9kZSkge1xuICAgICAgICBpZiAoIXRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgJiYgdGhpcy5ub2RlQWRkZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy5ub2RlQWRkZWRDYWxsYmFjayhub2RlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9maXJlTm9kZVJlbW92ZWRDYWxsYmFjayhub2RlKSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLm5vZGVSZW1vdmVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMubm9kZVJlbW92ZWRDYWxsYmFjayhub2RlKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9maXJlVGV4dEFkZGVkQ2FsbGJhY2sodGV4dCkge1xuICAgICAgICBpZiAoIXRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgJiYgdGhpcy50ZXh0QWRkZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy50ZXh0QWRkZWRDYWxsYmFjayh0ZXh0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9maXJlVGV4dFJlbW92ZWRDYWxsYmFjayh0ZXh0KSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLnRleHRSZW1vdmVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMudGV4dFJlbW92ZWRDYWxsYmFjayh0ZXh0KTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCB7T2JqZWN0V2l0aENvbXB1dGVkVmFsdWVzfSBmcm9tICcuL29iamVjdC13aXRoLWNvbXB1dGVkLXZhbHVlcydcblxuZXhwb3J0IGNsYXNzIEVkZ2UgZXh0ZW5kcyBPYmplY3RXaXRoQ29tcHV0ZWRWYWx1ZXN7XG4gICAgcGFyZW50Tm9kZTtcbiAgICBjaGlsZE5vZGU7XG5cbiAgICBuYW1lPScnO1xuICAgIHByb2JhYmlsaXR5PXVuZGVmaW5lZDtcbiAgICBwYXlvZmY9MDtcblxuICAgICRESVNQTEFZX1ZBTFVFX05BTUVTID0gWydwcm9iYWJpbGl0eScsICdwYXlvZmYnLCAnb3B0aW1hbCddO1xuXG4gICAgY29uc3RydWN0b3IocGFyZW50Tm9kZSwgY2hpbGROb2RlLCBuYW1lLHBheW9mZiwgcHJvYmFiaWxpdHksICl7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMucGFyZW50Tm9kZSA9IHBhcmVudE5vZGU7XG4gICAgICAgIHRoaXMuY2hpbGROb2RlID0gY2hpbGROb2RlO1xuXG4gICAgICAgIGlmKG5hbWUhPT11bmRlZmluZWQpe1xuICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBpZihwcm9iYWJpbGl0eSE9PXVuZGVmaW5lZCl7XG4gICAgICAgICAgICB0aGlzLnByb2JhYmlsaXR5PXByb2JhYmlsaXR5O1xuICAgICAgICB9XG4gICAgICAgIGlmKHBheW9mZiE9PXVuZGVmaW5lZCl7XG4gICAgICAgICAgICB0aGlzLnBheW9mZj1wYXlvZmZcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgc2V0TmFtZShuYW1lKXtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0UHJvYmFiaWxpdHkocHJvYmFiaWxpdHkpe1xuICAgICAgICB0aGlzLnByb2JhYmlsaXR5ID0gcHJvYmFiaWxpdHk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldFBheW9mZihwYXlvZmYpe1xuICAgICAgICB0aGlzLnBheW9mZiA9IHBheW9mZjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY29tcHV0ZWRCYXNlUHJvYmFiaWxpdHkodmFsKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcHV0ZWRWYWx1ZShudWxsLCAncHJvYmFiaWxpdHknLCB2YWwpO1xuICAgIH1cblxuICAgIGNvbXB1dGVkQmFzZVBheW9mZih2YWwpe1xuICAgICAgICByZXR1cm4gdGhpcy5jb21wdXRlZFZhbHVlKG51bGwsICdwYXlvZmYnLCB2YWwpO1xuICAgIH1cblxuICAgIGRpc3BsYXlQcm9iYWJpbGl0eSh2YWwpe1xuICAgICAgICByZXR1cm4gdGhpcy5kaXNwbGF5VmFsdWUoJ3Byb2JhYmlsaXR5JywgdmFsKTtcbiAgICB9XG5cbiAgICBkaXNwbGF5UGF5b2ZmKHZhbCl7XG4gICAgICAgIHJldHVybiB0aGlzLmRpc3BsYXlWYWx1ZSgncGF5b2ZmJywgdmFsKTtcbiAgICB9XG59XG4iLCJleHBvcnQgKiBmcm9tICcuL25vZGUvbm9kZSdcbmV4cG9ydCAqIGZyb20gJy4vbm9kZS9kZWNpc2lvbi1ub2RlJ1xuZXhwb3J0ICogZnJvbSAnLi9ub2RlL2NoYW5jZS1ub2RlJ1xuZXhwb3J0ICogZnJvbSAnLi9ub2RlL3Rlcm1pbmFsLW5vZGUnXG5leHBvcnQgKiBmcm9tICcuL2VkZ2UnXG5leHBvcnQgKiBmcm9tICcuL3BvaW50J1xuZXhwb3J0ICogZnJvbSAnLi90ZXh0J1xuIiwiaW1wb3J0IHtOb2RlfSBmcm9tICcuL25vZGUnXG5cbmV4cG9ydCBjbGFzcyBDaGFuY2VOb2RlIGV4dGVuZHMgTm9kZXtcblxuICAgIHN0YXRpYyAkVFlQRSA9ICdjaGFuY2UnO1xuXG4gICAgY29uc3RydWN0b3IobG9jYXRpb24pe1xuICAgICAgICBzdXBlcihDaGFuY2VOb2RlLiRUWVBFLCBsb2NhdGlvbik7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtOb2RlfSBmcm9tICcuL25vZGUnXG5cbmV4cG9ydCBjbGFzcyBEZWNpc2lvbk5vZGUgZXh0ZW5kcyBOb2Rle1xuXG4gICAgc3RhdGljICRUWVBFID0gJ2RlY2lzaW9uJztcblxuICAgIGNvbnN0cnVjdG9yKGxvY2F0aW9uKXtcbiAgICAgICAgc3VwZXIoRGVjaXNpb25Ob2RlLiRUWVBFLCBsb2NhdGlvbik7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtQb2ludH0gZnJvbSAnLi4vcG9pbnQnXG5pbXBvcnQge09iamVjdFdpdGhDb21wdXRlZFZhbHVlc30gZnJvbSAnLi4vb2JqZWN0LXdpdGgtY29tcHV0ZWQtdmFsdWVzJ1xuXG5leHBvcnQgY2xhc3MgTm9kZSBleHRlbmRzIE9iamVjdFdpdGhDb21wdXRlZFZhbHVlc3tcblxuICAgIHR5cGU7XG4gICAgY2hpbGRFZGdlcz1bXTtcbiAgICBuYW1lPScnO1xuXG4gICAgbG9jYXRpb247IC8vUG9pbnRcblxuICAgIGNvZGU9Jyc7XG4gICAgJGNvZGVEaXJ0eSA9IGZhbHNlOyAvLyBpcyBjb2RlIGNoYW5nZWQgd2l0aG91dCByZWV2YWx1YXRpb24/XG4gICAgJGNvZGVFcnJvciA9IG51bGw7IC8vY29kZSBldmFsdWF0aW9uIGVycm9yc1xuXG4gICAgZXhwcmVzc2lvblNjb3BlPW51bGw7XG5cbiAgICAkRElTUExBWV9WQUxVRV9OQU1FUyA9IFsnY2hpbGRyZW5QYXlvZmYnLCAnYWdncmVnYXRlZFBheW9mZicsICdwcm9iYWJpbGl0eVRvRW50ZXInLCAnb3B0aW1hbCddXG5cbiAgICBjb25zdHJ1Y3Rvcih0eXBlLCBsb2NhdGlvbil7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMubG9jYXRpb249bG9jYXRpb247XG4gICAgICAgIGlmKCFsb2NhdGlvbil7XG4gICAgICAgICAgICB0aGlzLmxvY2F0aW9uID0gbmV3IFBvaW50KDAsMCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50eXBlPXR5cGU7XG4gICAgfVxuXG4gICAgc2V0TmFtZShuYW1lKXtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbW92ZVRvKHgseSwgd2l0aENoaWxkcmVuKXsgLy9tb3ZlIHRvIG5ldyBsb2NhdGlvblxuICAgICAgICBpZih3aXRoQ2hpbGRyZW4pe1xuICAgICAgICAgICAgdmFyIGR4ID0geC10aGlzLmxvY2F0aW9uLng7XG4gICAgICAgICAgICB2YXIgZHkgPSB5LXRoaXMubG9jYXRpb24ueTtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PmUuY2hpbGROb2RlLm1vdmUoZHgsIGR5LCB0cnVlKSlcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubG9jYXRpb24ubW92ZVRvKHgseSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIG1vdmUoZHgsIGR5LCB3aXRoQ2hpbGRyZW4peyAvL21vdmUgYnkgdmVjdG9yXG4gICAgICAgIGlmKHdpdGhDaGlsZHJlbil7XG4gICAgICAgICAgICB0aGlzLmNoaWxkRWRnZXMuZm9yRWFjaChlPT5lLmNoaWxkTm9kZS5tb3ZlKGR4LCBkeSwgdHJ1ZSkpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sb2NhdGlvbi5tb3ZlKGR4LCBkeSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cbiIsImltcG9ydCB7Tm9kZX0gZnJvbSAnLi9ub2RlJ1xuXG5leHBvcnQgY2xhc3MgVGVybWluYWxOb2RlIGV4dGVuZHMgTm9kZXtcblxuICAgIHN0YXRpYyAkVFlQRSA9ICd0ZXJtaW5hbCc7XG5cbiAgICBjb25zdHJ1Y3Rvcihsb2NhdGlvbil7XG4gICAgICAgIHN1cGVyKFRlcm1pbmFsTm9kZS4kVFlQRSwgbG9jYXRpb24pO1xuICAgIH1cbn1cbiIsImltcG9ydCB7VXRpbHN9IGZyb20gJ3NkLXV0aWxzJ1xuXG5pbXBvcnQge09iamVjdFdpdGhJZEFuZEVkaXRhYmxlRmllbGRzfSBmcm9tIFwiLi9vYmplY3Qtd2l0aC1pZC1hbmQtZWRpdGFibGUtZmllbGRzXCI7XG5cbmV4cG9ydCBjbGFzcyBPYmplY3RXaXRoQ29tcHV0ZWRWYWx1ZXMgZXh0ZW5kcyBPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkc3tcblxuICAgIGNvbXB1dGVkPXt9OyAvL2NvbXB1dGVkIHZhbHVlc1xuXG4gICAgLypnZXQgb3Igc2V0IGNvbXB1dGVkIHZhbHVlKi9cbiAgICBjb21wdXRlZFZhbHVlKHJ1bGVOYW1lLCBmaWVsZE5hbWUsIHZhbHVlKXtcbiAgICAgICAgdmFyIHBhdGggPSAnY29tcHV0ZWQuJztcbiAgICAgICAgaWYocnVsZU5hbWUpe1xuICAgICAgICAgICAgcGF0aCs9cnVsZU5hbWUrJy4nO1xuICAgICAgICB9XG4gICAgICAgIHBhdGgrPWZpZWxkTmFtZTtcbiAgICAgICAgaWYodmFsdWU9PT11bmRlZmluZWQpe1xuICAgICAgICAgICAgcmV0dXJuICBVdGlscy5nZXQodGhpcywgcGF0aCwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgVXRpbHMuc2V0KHRoaXMsIHBhdGgsIHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIGNsZWFyQ29tcHV0ZWRWYWx1ZXMocnVsZU5hbWUpe1xuICAgICAgICBpZihydWxlTmFtZT09dW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHRoaXMuY29tcHV0ZWQ9e307XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYoVXRpbHMuaXNBcnJheShydWxlTmFtZSkpe1xuICAgICAgICAgICAgcnVsZU5hbWUuZm9yRWFjaChuPT57XG4gICAgICAgICAgICAgICAgdGhpcy5jb21wdXRlZFtuXT17fTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29tcHV0ZWRbcnVsZU5hbWVdPXt9O1xuICAgIH1cblxuICAgIGRpc3BsYXlWYWx1ZShmaWVsZE5hbWUsIHZhbHVlKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcHV0ZWRWYWx1ZShudWxsLCAnJGRpc3BsYXlWYWx1ZXMuJytmaWVsZE5hbWUsIHZhbHVlKTtcbiAgICB9XG5cbiAgICBsb2FkQ29tcHV0ZWRWYWx1ZXMoY29tcHV0ZWQpe1xuICAgICAgICB0aGlzLmNvbXB1dGVkID0gY29tcHV0ZWQ7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtVdGlsc30gZnJvbSAnc2QtdXRpbHMnXG5cbmV4cG9ydCBjbGFzcyBPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkcyB7XG5cbiAgICAkaWQgPSBVdGlscy5ndWlkKCk7IC8vaW50ZXJuYWwgaWRcbiAgICAkZmllbGRTdGF0dXM9e307XG5cbiAgICBnZXRGaWVsZFN0YXR1cyhmaWVsZE5hbWUpe1xuICAgICAgICBpZighdGhpcy4kZmllbGRTdGF0dXNbZmllbGROYW1lXSl7XG4gICAgICAgICAgICB0aGlzLiRmaWVsZFN0YXR1c1tmaWVsZE5hbWVdID0ge1xuICAgICAgICAgICAgICAgIHZhbGlkOiB7XG4gICAgICAgICAgICAgICAgICAgIHN5bnRheDogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHRydWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuJGZpZWxkU3RhdHVzW2ZpZWxkTmFtZV07XG4gICAgfVxuXG4gICAgc2V0U3ludGF4VmFsaWRpdHkoZmllbGROYW1lLCB2YWxpZCl7XG4gICAgICAgIHZhciBmaWVsZFN0YXR1cyA9IHRoaXMuZ2V0RmllbGRTdGF0dXMoZmllbGROYW1lKTtcbiAgICAgICAgZmllbGRTdGF0dXMudmFsaWQuc3ludGF4ID0gdmFsaWQ7XG4gICAgfVxuXG4gICAgc2V0VmFsdWVWYWxpZGl0eShmaWVsZE5hbWUsIHZhbGlkKXtcbiAgICAgICAgdmFyIGZpZWxkU3RhdHVzID0gdGhpcy5nZXRGaWVsZFN0YXR1cyhmaWVsZE5hbWUpO1xuICAgICAgICBmaWVsZFN0YXR1cy52YWxpZC52YWx1ZSA9IHZhbGlkO1xuICAgIH1cblxuICAgIGlzRmllbGRWYWxpZChmaWVsZE5hbWUsIHN5bnRheD10cnVlLCB2YWx1ZT10cnVlKXtcbiAgICAgICAgdmFyIGZpZWxkU3RhdHVzID0gdGhpcy5nZXRGaWVsZFN0YXR1cyhmaWVsZE5hbWUpO1xuICAgICAgICBpZihzeW50YXggJiYgdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZFN0YXR1cy52YWxpZC5zeW50YXggJiYgZmllbGRTdGF0dXMudmFsaWQudmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYoc3ludGF4KSB7XG4gICAgICAgICAgICByZXR1cm4gZmllbGRTdGF0dXMudmFsaWQuc3ludGF4XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpZWxkU3RhdHVzLnZhbGlkLnZhbHVlO1xuICAgIH1cblxuXG59XG4iLCJleHBvcnQgY2xhc3MgUG9pbnQge1xuICAgIHg7XG4gICAgeTtcbiAgICBjb25zdHJ1Y3Rvcih4LHkpe1xuICAgICAgICBpZih4IGluc3RhbmNlb2YgUG9pbnQpe1xuICAgICAgICAgICAgeT14Lnk7XG4gICAgICAgICAgICB4PXgueFxuICAgICAgICB9ZWxzZSBpZihBcnJheS5pc0FycmF5KHgpKXtcbiAgICAgICAgICAgIHk9eFsxXTtcbiAgICAgICAgICAgIHg9eFswXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLng9eDtcbiAgICAgICAgdGhpcy55PXk7XG4gICAgfVxuXG4gICAgbW92ZVRvKHgseSl7XG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoeCkpe1xuICAgICAgICAgICAgeT14WzFdO1xuICAgICAgICAgICAgeD14WzBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMueD14O1xuICAgICAgICB0aGlzLnk9eTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbW92ZShkeCxkeSl7IC8vbW92ZSBieSB2ZWN0b3JcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShkeCkpe1xuICAgICAgICAgICAgZHk9ZHhbMV07XG4gICAgICAgICAgICBkeD1keFswXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLngrPWR4O1xuICAgICAgICB0aGlzLnkrPWR5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7UG9pbnR9IGZyb20gXCIuL3BvaW50XCI7XG5pbXBvcnQge1V0aWxzfSBmcm9tIFwic2QtdXRpbHNcIjtcbmltcG9ydCB7T2JqZWN0V2l0aElkQW5kRWRpdGFibGVGaWVsZHN9IGZyb20gXCIuL29iamVjdC13aXRoLWlkLWFuZC1lZGl0YWJsZS1maWVsZHNcIjtcblxuZXhwb3J0IGNsYXNzIFRleHQgZXh0ZW5kcyBPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkc3tcblxuICAgIHZhbHVlPScnO1xuICAgIGxvY2F0aW9uOyAvL1BvaW50XG5cbiAgICBjb25zdHJ1Y3Rvcihsb2NhdGlvbiwgdmFsdWUpe1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmxvY2F0aW9uPWxvY2F0aW9uO1xuICAgICAgICBpZighbG9jYXRpb24pe1xuICAgICAgICAgICAgdGhpcy5sb2NhdGlvbiA9IG5ldyBQb2ludCgwLDApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG1vdmVUbyh4LHkpeyAvL21vdmUgdG8gbmV3IGxvY2F0aW9uXG4gICAgICAgIHRoaXMubG9jYXRpb24ubW92ZVRvKHgseSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIG1vdmUoZHgsIGR5KXsgLy9tb3ZlIGJ5IHZlY3RvclxuICAgICAgICB0aGlzLmxvY2F0aW9uLm1vdmUoZHgsIGR5KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgZG9tYWluIGZyb20gJy4vZG9tYWluJ1xuZXhwb3J0IHtkb21haW59XG5leHBvcnQgKiBmcm9tICcuL2RhdGEtbW9kZWwnXG5leHBvcnQgKiBmcm9tICcuL3ZhbGlkYXRpb24tcmVzdWx0J1xuIiwiaW1wb3J0IHtVdGlsc30gZnJvbSBcInNkLXV0aWxzXCI7XG5cbmV4cG9ydCBjbGFzcyBWYWxpZGF0aW9uUmVzdWx0e1xuXG5cbiAgICBlcnJvcnMgPSB7fTtcbiAgICB3YXJuaW5ncyA9IHt9O1xuICAgIG9iamVjdElkVG9FcnJvcj17fTtcblxuICAgIGFkZEVycm9yKGVycm9yLCBvYmope1xuICAgICAgICBpZihVdGlscy5pc1N0cmluZyhlcnJvcikpe1xuICAgICAgICAgICAgZXJyb3IgPSB7bmFtZTogZXJyb3J9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBuYW1lID0gZXJyb3IubmFtZTtcbiAgICAgICAgdmFyIGVycm9yc0J5TmFtZSA9IHRoaXMuZXJyb3JzW25hbWVdO1xuICAgICAgICBpZighZXJyb3JzQnlOYW1lKXtcbiAgICAgICAgICAgIGVycm9yc0J5TmFtZT1bXTtcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzW25hbWVdPWVycm9yc0J5TmFtZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb2JqRSA9IHRoaXMub2JqZWN0SWRUb0Vycm9yW29iai4kaWRdO1xuICAgICAgICBpZighb2JqRSl7XG4gICAgICAgICAgICBvYmpFPVtdO1xuICAgICAgICAgICAgdGhpcy5vYmplY3RJZFRvRXJyb3Jbb2JqLiRpZF09IG9iakU7XG4gICAgICAgIH1cbiAgICAgICAgZXJyb3JzQnlOYW1lLnB1c2gob2JqKTtcbiAgICAgICAgb2JqRS5wdXNoKGVycm9yKTtcbiAgICB9XG5cbiAgICBhZGRXYXJuaW5nKG5hbWUsIG9iail7XG4gICAgICAgIHZhciBlID0gdGhpcy53YXJuaW5nc1tuYW1lXTtcbiAgICAgICAgaWYoIWUpe1xuICAgICAgICAgICAgZT1bXTtcbiAgICAgICAgICAgIHRoaXMud2FybmluZ3NbbmFtZV09ZTtcbiAgICAgICAgfVxuICAgICAgICBlLnB1c2gob2JqKVxuICAgIH1cblxuICAgIGlzVmFsaWQoKXtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRoaXMuZXJyb3JzKS5sZW5ndGggPT09IDBcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlRnJvbURUTyhkdG8pe1xuICAgICAgICB2YXIgdiA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XG4gICAgICAgIHYuZXJyb3JzID0gZHRvLmVycm9ycztcbiAgICAgICAgdi53YXJuaW5ncyA9IGR0by53YXJuaW5ncztcbiAgICAgICAgdi5vYmplY3RJZFRvRXJyb3IgPSBkdG8ub2JqZWN0SWRUb0Vycm9yO1xuICAgICAgICByZXR1cm4gdjtcbiAgICB9XG59XG4iLCJleHBvcnQgKiBmcm9tICcuL3NyYy9pbmRleCdcbiJdfQ==
