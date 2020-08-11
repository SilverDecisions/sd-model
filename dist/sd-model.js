require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DataModel = void 0;

var _sdUtils = require("sd-utils");

var domain = _interopRequireWildcard(require("./domain"));

var _validationResult = require("./validation-result");

function _getRequireWildcardCache() {
  if (typeof WeakMap !== "function") return null;
  var cache = new WeakMap();

  _getRequireWildcardCache = function _getRequireWildcardCache() {
    return cache;
  };

  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }

  if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") {
    return {
      "default": obj
    };
  }

  var cache = _getRequireWildcardCache();

  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }

  var newObj = {};
  var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;

  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;

      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }

  newObj["default"] = obj;

  if (cache) {
    cache.set(obj, newObj);
  }

  return newObj;
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === "string") return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === "Object" && o.constructor) n = o.constructor.name;
  if (n === "Map" || n === "Set") return Array.from(o);
  if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _iterableToArray(iter) {
  if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;

  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }

  return arr2;
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}
/*
 * Data model manager
 * */


var DataModel = /*#__PURE__*/function () {
  //floating texts
  //global expression scope
  //global expression code
  //code evaluation errors
  // is code changed without reevaluation?
  // undo / redo
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

  _createClass(DataModel, [{
    key: "getJsonReplacer",
    value: function getJsonReplacer() {
      var filterLocation = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
      var filterComputed = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var replacer = arguments.length > 2 ? arguments[2] : undefined;
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
      var replacer = arguments.length > 3 ? arguments[3] : undefined;
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
      var _this = this; //roots, texts, code, expressionScope


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
        byId[n.id] = n;
      });
      this.nodes.forEach(function (n, i) {
        if (byId[n.id]) {
          n.loadComputedValues(byId[n.id].computed);
        }
      });
      dataModel.edges.forEach(function (e) {
        byId[e.id] = e;
      });
      this.edges.forEach(function (e, i) {
        if (byId[e.id]) {
          e.loadComputedValues(byId[e.id].computed);
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

      if (data.id) {
        node.id = data.id;
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

        if (ed.id) {
          edge.id = ed.id;
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

        edge.id = _sdUtils.Utils.guid();
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
      var roots = []; //TODO
    }
    /*shallow clone without parent and children*/

  }, {
    key: "cloneNode",
    value: function cloneNode(node) {
      var clone = _sdUtils.Utils.clone(node);

      clone.id = _sdUtils.Utils.guid();
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
        return n.id == id;
      });
    }
  }, {
    key: "findEdgeById",
    value: function findEdgeById(id) {
      return _sdUtils.Utils.find(this.edges, function (e) {
        return e.id == id;
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
          var edge = edgeById[n.childEdges[i].id];
          n.childEdges[i] = edge;
          edge.parentNode = n;
          edge.childNode = nodeById[edge.childNode.id];
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

exports.DataModel = DataModel;

},{"./domain":3,"./validation-result":13,"sd-utils":"sd-utils"}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Edge = void 0;

var _objectWithComputedValues = require("./object-with-computed-values");

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();

  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived),
        result;

    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;

      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }

    return _possibleConstructorReturn(this, result);
  };
}

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

var Edge = /*#__PURE__*/function (_ObjectWithComputedVa) {
  _inherits(Edge, _ObjectWithComputedVa);

  var _super = _createSuper(Edge);

  function Edge(parentNode, childNode, name, payoff, probability) {
    var _this;

    _classCallCheck(this, Edge);

    _this = _super.call(this);
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
    key: "setName",
    value: function setName(name) {
      this.name = name;
      return this;
    }
  }, {
    key: "setProbability",
    value: function setProbability(probability) {
      this.probability = probability;
      return this;
    }
  }, {
    key: "setPayoff",
    value: function setPayoff(payoff) {
      var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      this.payoff[index] = payoff;
      return this;
    }
  }, {
    key: "computedBaseProbability",
    value: function computedBaseProbability(val) {
      return this.computedValue(null, 'probability', val);
    }
  }, {
    key: "computedBasePayoff",
    value: function computedBasePayoff(val) {
      var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      return this.computedValue(null, 'payoff[' + index + ']', val);
    }
  }, {
    key: "displayProbability",
    value: function displayProbability(val) {
      return this.displayValue('probability', val);
    }
  }, {
    key: "displayPayoff",
    value: function displayPayoff(val) {
      var index = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
      return this.displayValue('payoff[' + index + ']', val);
    }
  }]);

  return Edge;
}(_objectWithComputedValues.ObjectWithComputedValues);

exports.Edge = Edge;

},{"./object-with-computed-values":8}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _node = require("./node/node");

Object.keys(_node).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _node[key];
    }
  });
});

var _decisionNode = require("./node/decision-node");

Object.keys(_decisionNode).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _decisionNode[key];
    }
  });
});

var _chanceNode = require("./node/chance-node");

Object.keys(_chanceNode).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _chanceNode[key];
    }
  });
});

var _terminalNode = require("./node/terminal-node");

Object.keys(_terminalNode).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _terminalNode[key];
    }
  });
});

var _edge = require("./edge");

Object.keys(_edge).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _edge[key];
    }
  });
});

var _point = require("./point");

Object.keys(_point).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _point[key];
    }
  });
});

var _text = require("./text");

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
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ChanceNode = void 0;

var _node = require("./node");

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();

  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived),
        result;

    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;

      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }

    return _possibleConstructorReturn(this, result);
  };
}

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

var ChanceNode = /*#__PURE__*/function (_Node) {
  _inherits(ChanceNode, _Node);

  var _super = _createSuper(ChanceNode);

  function ChanceNode(location) {
    _classCallCheck(this, ChanceNode);

    return _super.call(this, ChanceNode.$TYPE, location);
  }

  return ChanceNode;
}(_node.Node);

exports.ChanceNode = ChanceNode;
ChanceNode.$TYPE = 'chance';

},{"./node":6}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DecisionNode = void 0;

var _node = require("./node");

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();

  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived),
        result;

    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;

      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }

    return _possibleConstructorReturn(this, result);
  };
}

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

var DecisionNode = /*#__PURE__*/function (_Node) {
  _inherits(DecisionNode, _Node);

  var _super = _createSuper(DecisionNode);

  function DecisionNode(location) {
    _classCallCheck(this, DecisionNode);

    return _super.call(this, DecisionNode.$TYPE, location);
  }

  return DecisionNode;
}(_node.Node);

exports.DecisionNode = DecisionNode;
DecisionNode.$TYPE = 'decision';

},{"./node":6}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Node = void 0;

var _point = require("../point");

var _objectWithComputedValues = require("../object-with-computed-values");

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();

  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived),
        result;

    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;

      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }

    return _possibleConstructorReturn(this, result);
  };
}

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

var Node = /*#__PURE__*/function (_ObjectWithComputedVa) {
  _inherits(Node, _ObjectWithComputedVa);

  var _super = _createSuper(Node); //Point
  // is code changed without reevaluation?
  //code evaluation errors
  // is node folded along with its subtree


  function Node(type, location) {
    var _this;

    _classCallCheck(this, Node);

    _this = _super.call(this);
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
  }

  _createClass(Node, [{
    key: "setName",
    value: function setName(name) {
      this.name = name;
      return this;
    }
  }, {
    key: "moveTo",
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
    key: "move",
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

exports.Node = Node;

},{"../object-with-computed-values":8,"../point":10}],7:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TerminalNode = void 0;

var _node = require("./node");

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();

  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived),
        result;

    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;

      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }

    return _possibleConstructorReturn(this, result);
  };
}

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

var TerminalNode = /*#__PURE__*/function (_Node) {
  _inherits(TerminalNode, _Node);

  var _super = _createSuper(TerminalNode);

  function TerminalNode(location) {
    _classCallCheck(this, TerminalNode);

    return _super.call(this, TerminalNode.$TYPE, location);
  }

  return TerminalNode;
}(_node.Node);

exports.TerminalNode = TerminalNode;
TerminalNode.$TYPE = 'terminal';

},{"./node":6}],8:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ObjectWithComputedValues = void 0;

var _sdUtils = require("sd-utils");

var _objectWithIdAndEditableFields = require("./object-with-id-and-editable-fields");

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();

  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived),
        result;

    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;

      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }

    return _possibleConstructorReturn(this, result);
  };
}

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

var ObjectWithComputedValues = /*#__PURE__*/function (_ObjectWithIdAndEdita) {
  _inherits(ObjectWithComputedValues, _ObjectWithIdAndEdita);

  var _super = _createSuper(ObjectWithComputedValues);

  function ObjectWithComputedValues() {
    var _temp, _this;

    _classCallCheck(this, ObjectWithComputedValues);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _possibleConstructorReturn(_this, (_temp = _this = _super.call.apply(_super, [this].concat(args)), _this.computed = {}, _temp));
  }

  _createClass(ObjectWithComputedValues, [{
    key: "computedValue",
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
    key: "clearComputedValues",
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
    key: "clearDisplayValues",
    value: function clearDisplayValues() {
      this.computed['$displayValues'] = {};
    }
  }, {
    key: "displayValue",
    value: function displayValue(fieldPath, value) {
      return this.computedValue(null, '$displayValues.' + fieldPath, value);
    }
  }, {
    key: "loadComputedValues",
    value: function loadComputedValues(computed) {
      this.computed = _sdUtils.Utils.cloneDeep(computed);
    }
  }]);

  return ObjectWithComputedValues;
}(_objectWithIdAndEditableFields.ObjectWithIdAndEditableFields);

exports.ObjectWithComputedValues = ObjectWithComputedValues;

},{"./object-with-id-and-editable-fields":9,"sd-utils":"sd-utils"}],9:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ObjectWithIdAndEditableFields = void 0;

var _sdUtils = require("sd-utils");

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

var ObjectWithIdAndEditableFields = /*#__PURE__*/function () {
  function ObjectWithIdAndEditableFields() {
    _classCallCheck(this, ObjectWithIdAndEditableFields);

    this.id = _sdUtils.Utils.guid();
    this.$fieldStatus = {};
    this.$ObjectWithIdAndEditableFields = true;
  }

  _createClass(ObjectWithIdAndEditableFields, [{
    key: "getFieldStatus",
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
    key: "setSyntaxValidity",
    value: function setSyntaxValidity(fieldPath, valid) {
      var fieldStatus = this.getFieldStatus(fieldPath);
      fieldStatus.valid.syntax = valid;
    }
  }, {
    key: "setValueValidity",
    value: function setValueValidity(fieldPath, valid) {
      var fieldStatus = this.getFieldStatus(fieldPath);
      fieldStatus.valid.value = valid;
    }
  }, {
    key: "isFieldValid",
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

exports.ObjectWithIdAndEditableFields = ObjectWithIdAndEditableFields;

},{"sd-utils":"sd-utils"}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Point = void 0;

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

var Point = /*#__PURE__*/function () {
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

exports.Point = Point;

},{}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Text = void 0;

var _point = require("./point");

var _sdUtils = require("sd-utils");

var _objectWithIdAndEditableFields = require("./object-with-id-and-editable-fields");

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();

  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived),
        result;

    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;

      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }

    return _possibleConstructorReturn(this, result);
  };
}

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

var Text = /*#__PURE__*/function (_ObjectWithIdAndEdita) {
  _inherits(Text, _ObjectWithIdAndEdita);

  var _super = _createSuper(Text); //Point


  function Text(location, value) {
    var _this;

    _classCallCheck(this, Text);

    _this = _super.call(this);
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

exports.Text = Text;

},{"./object-with-id-and-editable-fields":9,"./point":10,"sd-utils":"sd-utils"}],12:[function(require,module,exports){
"use strict";

function _typeof(obj) {
  "@babel/helpers - typeof";

  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  domain: true
};
exports.domain = void 0;

var domain = _interopRequireWildcard(require("./domain"));

exports.domain = domain;

var _dataModel = require("./data-model");

Object.keys(_dataModel).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _dataModel[key];
    }
  });
});

var _validationResult = require("./validation-result");

Object.keys(_validationResult).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _validationResult[key];
    }
  });
});

function _getRequireWildcardCache() {
  if (typeof WeakMap !== "function") return null;
  var cache = new WeakMap();

  _getRequireWildcardCache = function _getRequireWildcardCache() {
    return cache;
  };

  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }

  if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") {
    return {
      "default": obj
    };
  }

  var cache = _getRequireWildcardCache();

  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }

  var newObj = {};
  var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;

  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;

      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }

  newObj["default"] = obj;

  if (cache) {
    cache.set(obj, newObj);
  }

  return newObj;
}

},{"./data-model":1,"./domain":3,"./validation-result":13}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ValidationResult = void 0;

var _sdUtils = require("sd-utils");

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

var ValidationResult = /*#__PURE__*/function () {
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
        error = {
          name: error
        };
      }

      var name = error.name;
      var errorsByName = this.errors[name];

      if (!errorsByName) {
        errorsByName = [];
        this.errors[name] = errorsByName;
      }

      var objE = this.objectIdToError[obj.id];

      if (!objE) {
        objE = [];
        this.objectIdToError[obj.id] = objE;
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

exports.ValidationResult = ValidationResult;

},{"sd-utils":"sd-utils"}],"sd-model":[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _index = require("./src/index");

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZGF0YS1tb2RlbC5qcyIsInNyYy9kb21haW4vZWRnZS5qcyIsInNyYy9kb21haW4vaW5kZXguanMiLCJzcmMvZG9tYWluL25vZGUvY2hhbmNlLW5vZGUuanMiLCJzcmMvZG9tYWluL25vZGUvZGVjaXNpb24tbm9kZS5qcyIsInNyYy9kb21haW4vbm9kZS9ub2RlLmpzIiwic3JjL2RvbWFpbi9ub2RlL3Rlcm1pbmFsLW5vZGUuanMiLCJzcmMvZG9tYWluL29iamVjdC13aXRoLWNvbXB1dGVkLXZhbHVlcy5qcyIsInNyYy9kb21haW4vb2JqZWN0LXdpdGgtaWQtYW5kLWVkaXRhYmxlLWZpZWxkcy5qcyIsInNyYy9kb21haW4vcG9pbnQuanMiLCJzcmMvZG9tYWluL3RleHQuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvdmFsaWRhdGlvbi1yZXN1bHQuanMiLCJpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDQUEsSUFBQSxRQUFBLEdBQUEsT0FBQSxDQUFBLFVBQUEsQ0FBQTs7QUFDQSxJQUFBLE1BQUEsR0FBQSx1QkFBQSxDQUFBLE9BQUEsQ0FBQSxVQUFBLENBQUEsQ0FBQTs7QUFDQSxJQUFBLGlCQUFBLEdBQUEsT0FBQSxDQUFBLHFCQUFBLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUE7Ozs7O0lBR2EsUztBQUtHO0FBT1U7QUFDWjtBQUNTO0FBQ0M7QUFLcEI7QUFhQSxXQUFBLFNBQUEsQ0FBQSxJQUFBLEVBQWtCO0FBQUEsSUFBQSxlQUFBLENBQUEsSUFBQSxFQUFBLFNBQUEsQ0FBQTs7QUFBQSxTQS9CbEIsS0ErQmtCLEdBL0JWLEVBK0JVO0FB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SUFBQSxVQUFBLEVBQUEsSUFBQTtBQUFBLElBQUEsR0FBQSxFQUFBLFNBQUEsR0FBQSxHQUFBO0FBQUEsYUFBQSxLQUFBLENBQUEsR0FBQSxDQUFBO0FBQUE7QUFBQSxHQUFBO0FBQUEsQ0FBQTs7QUFDQSxJQUFBLGFBQUEsR0FBQSxPQUFBLENBQUEsc0JBQUEsQ0FBQTs7QUFBQSxNQUFBLENBQUEsSUFBQSxDQUFBLGFBQUEsRUFBQSxPQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFBQSxNQUFBLEdBQUEsS0FBQSxTQUFBLElBQUEsR0FBQSxLQUFBLFlBQUEsRUFBQTtBQUFBLEVBQUEsTUFBQSxDQUFBLGNBQUEsQ0FBQSxPQUFBLEVBQUEsR0FBQSxFQUFBO0FBQUEsSUFBQSxVQUFBLEVBQUEsSUFBQTtBQUFBLElBQUEsR0FBQSxFQUFBLFNBQUEsR0FBQSxHQUFBO0FBQUEsYUFBQSxhQUFBLENBQUEsR0FBQSxDQUFBO0FBQUE7QUFBQSxHQUFBO0FBQUEsQ0FBQTs7QUFDQSxJQUFBLFdBQUEsR0FBQSxPQUFBLENBQUEsb0JBQUEsQ0FBQTs7QUFBQSxNQUFBLENBQUEsSUFBQSxDQUFBLFdBQUEsRUFBQSxPQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFBQSxNQUFBLEdBQUEsS0FBQSxTQUFBLElBQUEsR0FBQSxLQUFBLFlBQUEsRUFBQTtBQUFBLEVBQUEsTUFBQSxDQUFBLGNBQUEsQ0FBQSxPQUFBLEVBQUEsR0FBQSxFQUFBO0FBQUEsSUFBQSxVQUFBLEVBQUEsSUFBQTtBQUFBLElBQUEsR0FBQSxFQUFBLFNBQUEsR0FBQSxHQUFBO0FBQUEsYUFBQSxXQUFBLENBQUEsR0FBQSxDQUFBO0FBQUE7QUFBQSxHQUFBO0FBQUEsQ0FBQTs7QUFDQSxJQUFBLGFBQUEsR0FBQSxPQUFBLENBQUEsc0JBQUEsQ0FBQTs7QUFBQSxNQUFBLENBQUEsSUFBQSxDQUFBLGFBQUEsRUFBQSxPQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFBQSxNQUFBLEdBQUEsS0FBQSxTQUFBLElBQUEsR0FBQSxLQUFBLFlBQUEsRUFBQTtBQUFBLEVBQUEsTUFBQSxDQUFBLGNBQUEsQ0FBQSxPQUFBLEVBQUEsR0FBQSxFQUFBO0FBQUEsSUFBQSxVQUFBLEVBQUEsSUFBQTtBQUFBLElBQUEsR0FBQSxFQUFBLFNBQUEsR0FBQSxHQUFBO0FBQUEsYUFBQSxhQUFBLENBQUEsR0FBQSxDQUFBO0FBQUE7QUFBQSxHQUFBO0FBQUEsQ0FBQTs7QUFDQSxJQUFBLEtBQUEsR0FBQSxPQUFBLENBQUEsUUFBQSxDQUFBOztBQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxFQUFBLE9BQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUFBLE1BQUEsR0FBQSxLQUFBLFNBQUEsSUFBQSxHQUFBLEtBQUEsWUFBQSxFQUFBO0FBQUEsRUFBQSxNQUFBLENBQUEsY0FBQSxDQUFBLE9BQUEsRUFBQSxHQUFBLEVBQUE7QUFBQSxJQUFBLFVBQUEsRUFBQSxJQUFBO0FBQUEsSUFBQSxHQUFBLEVBQUEsU0FBQSxHQUFBLEdBQUE7QUFBQSxhQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUE7QUFBQTtBQUFBLEdBQUE7QUFBQSxDQUFBOztBQUNBLElBQUEsTUFBQSxHQUFBLE9BQUEsQ0FBQSxTQUFBLENBQUE7O0FBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsT0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQUEsTUFBQSxHQUFBLEtBQUEsU0FBQSxJQUFBLEdBQUEsS0FBQSxZQUFBLEVBQUE7QUFBQSxFQUFBLE1BQUEsQ0FBQSxjQUFBLENBQUEsT0FBQSxFQUFBLEdBQUEsRUFBQTtBQUFBLElBQUEsVUFBQSxFQUFBLElBQUE7QUFBQSxJQUFBLEdBQUEsRUFBQSxTQUFBLEdBQUEsR0FBQTtBQUFBLGFBQUEsTUFBQSxDQUFBLEdBQUEsQ0FBQTtBQUFBO0FBQUEsR0FBQTtBQUFBLENBQUE7O0FBQ0EsSUFBQSxLQUFBLEdBQUEsT0FBQSxDQUFBLFFBQUEsQ0FBQTs7QUFBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEtBQUEsRUFBQSxPQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7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LFVBQUEsQ0FBQSxDQUFBOzs7O0FBRUEsSUFBQSxVQUFBLEdBQUEsT0FBQSxDQUFBLGNBQUEsQ0FBQTs7QUFBQSxNQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsRUFBQSxPQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFBQSxNQUFBLEdBQUEsS0FBQSxTQUFBLElBQUEsR0FBQSxLQUFBLFlBQUEsRUFBQTtBQUFBLE1BQUEsTUFBQSxDQUFBLFNBQUEsQ0FBQSxjQUFBLENBQUEsSUFBQSxDQUFBLFlBQUEsRUFBQSxHQUFBLENBQUEsRUFBQTtBQUFBLEVBQUEsTUFBQSxDQUFBLGNBQUEsQ0FBQSxPQUFBLEVBQUEsR0FBQSxFQUFBO0FBQUEsSUFBQSxVQUFBLEVBQUEsSUFBQTtBQUFBLElBQUEsR0FBQSxFQUFBLFNBQUEsR0FBQSxHQUFBO0FBQUEsYUFBQSxVQUFBLENBQUEsR0FBQSxDQUFBO0FBQUE7QUFBQSxHQUFBO0FBQUEsQ0FBQTs7QUFDQSxJQUFBLGlCQUFBLEdBQUEsT0FBQSxDQUFBLHFCQUFBLENBQUE7O0FBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxpQkFBQSxFQUFBLE9BQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUFBLE1BQUEsR0FBQSxLQUFBLFNBQUEsSUFBQSxHQUFBLEtBQUEsWUFBQSxFQUFBO0FBQUEsTUFBQSxNQUFBLENBQUEsU0FBQSxDQUFBLGNBQUEsQ0FBQSxJQUFBLENBQUEsWUFBQSxFQUFBLEdBQUEsQ0FBQSxFQUFBO0FBQUEsRUFBQSxNQUFBLENBQUEsY0FBQSxDQUFBLE9BQUEsRUFBQSxHQUFBLEVBQUE7QUFBQSxJQUFBLFVBQUEsRUFBQSxJQUFBO0FBQUEsSUFBQSxHQUFBLEVBQUEsU0FBQSxHQUFBLEdBQUE7QUFBQSxhQUFBLGlCQUFBLENBQUEsR0FBQSxDQUFBO0FBQUE7QUFBQSxHQUFBO0FBQUEsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNIQSxJQUFBLFFBQUEsR0FBQSxPQUFBLENBQUEsVUFBQSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFFYSxnQjs7OztTQUdULE0sR0FBUyxFO1NBQ1QsUSxHQUFXLEU7U0FDWCxlLEdBQWdCLEU7Ozs7OzZCQUVQLEssRUFBTyxHLEVBQUk7QUFDaEIsVUFBRyxRQUFBLENBQUEsS0FBQSxDQUFBLFFBQUEsQ0FBSCxLQUFHLENBQUgsRUFBeUI7QUFDckIsUUFBQSxLQUFLLEdBQUc7QUFBQyxVQUFBLElBQUksRUFBRTtBQUFQLFNBQVI7QUFDSDs7QUFDRCxVQUFJLElBQUksR0FBRyxLQUFLLENBQWhCLElBQUE7QUFDQSxVQUFJLFlBQVksR0FBRyxLQUFBLE1BQUEsQ0FBbkIsSUFBbUIsQ0FBbkI7O0FBQ0EsVUFBRyxDQUFILFlBQUEsRUFBaUI7QUFDYixRQUFBLFlBQVksR0FBWixFQUFBO0FBQ0EsYUFBQSxNQUFBLENBQUEsSUFBQSxJQUFBLFlBQUE7QUFDSDs7QUFDRCxVQUFJLElBQUksR0FBRyxLQUFBLGVBQUEsQ0FBcUIsR0FBRyxDQUFuQyxFQUFXLENBQVg7O0FBQ0EsVUFBRyxDQUFILElBQUEsRUFBUztBQUNMLFFBQUEsSUFBSSxHQUFKLEVBQUE7QUFDQSxhQUFBLGVBQUEsQ0FBcUIsR0FBRyxDQUF4QixFQUFBLElBQUEsSUFBQTtBQUNIOztBQUNELE1BQUEsWUFBWSxDQUFaLElBQUEsQ0FBQSxHQUFBO0FBQ0EsTUFBQSxJQUFJLENBQUosSUFBQSxDQUFBLEtBQUE7QUFDSDs7OytCQUVVLEksRUFBTSxHLEVBQUk7QUFDakIsVUFBSSxDQUFDLEdBQUcsS0FBQSxRQUFBLENBQVIsSUFBUSxDQUFSOztBQUNBLFVBQUcsQ0FBSCxDQUFBLEVBQU07QUFDRixRQUFBLENBQUMsR0FBRCxFQUFBO0FBQ0EsYUFBQSxRQUFBLENBQUEsSUFBQSxJQUFBLENBQUE7QUFDSDs7QUFDRCxNQUFBLENBQUMsQ0FBRCxJQUFBLENBQUEsR0FBQTtBQUNIOzs7OEJBRVE7QUFDTCxhQUFPLE1BQU0sQ0FBTixtQkFBQSxDQUEyQixLQUEzQixNQUFBLEVBQUEsTUFBQSxLQUFQLENBQUE7QUFDSDs7O2tDQUVvQixHLEVBQUk7QUFDckIsVUFBSSxDQUFDLEdBQUcsSUFBUixnQkFBUSxFQUFSO0FBQ0EsTUFBQSxDQUFDLENBQUQsTUFBQSxHQUFXLEdBQUcsQ0FBZCxNQUFBO0FBQ0EsTUFBQSxDQUFDLENBQUQsUUFBQSxHQUFhLEdBQUcsQ0FBaEIsUUFBQTtBQUNBLE1BQUEsQ0FBQyxDQUFELGVBQUEsR0FBb0IsR0FBRyxDQUF2QixlQUFBO0FBQ0EsYUFBQSxDQUFBO0FBQ0g7Ozs7Ozs7Ozs7Ozs7OztBQy9DTCxJQUFBLE1BQUEsR0FBQSxPQUFBLENBQUEsYUFBQSxDQUFBOztBQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsTUFBQSxFQUFBLE9BQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUFBLE1BQUEsR0FBQSxLQUFBLFNBQUEsSUFBQSxHQUFBLEtBQUEsWUFBQSxFQUFBO0FBQUEsRUFBQSxNQUFBLENBQUEsY0FBQSxDQUFBLE9BQUEsRUFBQSxHQUFBLEVBQUE7QUFBQSxJQUFBLFVBQUEsRUFBQSxJQUFBO0FBQUEsSUFBQSxHQUFBLEVBQUEsU0FBQSxHQUFBLEdBQUE7QUFBQSxhQUFBLE1BQUEsQ0FBQSxHQUFBLENBQUE7QUFBQTtBQUFBLEdBQUE7QUFBQSxDQUFBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiaW1wb3J0IHtVdGlscywgbG9nfSBmcm9tIFwic2QtdXRpbHNcIjtcbmltcG9ydCAqIGFzIGRvbWFpbiBmcm9tIFwiLi9kb21haW5cIjtcbmltcG9ydCB7VmFsaWRhdGlvblJlc3VsdH0gZnJvbSBcIi4vdmFsaWRhdGlvbi1yZXN1bHRcIjtcblxuLypcbiAqIERhdGEgbW9kZWwgbWFuYWdlclxuICogKi9cbmV4cG9ydCBjbGFzcyBEYXRhTW9kZWwge1xuXG4gICAgbm9kZXMgPSBbXTtcbiAgICBlZGdlcyA9IFtdO1xuXG4gICAgdGV4dHMgPSBbXTsgLy9mbG9hdGluZyB0ZXh0c1xuICAgIHBheW9mZk5hbWVzID0gW107XG4gICAgZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQgPSAxO1xuICAgIHdlaWdodExvd2VyQm91bmQgPSAwO1xuICAgIHdlaWdodFVwcGVyQm91bmQgPSBJbmZpbml0eTtcblxuXG4gICAgZXhwcmVzc2lvblNjb3BlID0ge307IC8vZ2xvYmFsIGV4cHJlc3Npb24gc2NvcGVcbiAgICBjb2RlID0gXCJcIjsvL2dsb2JhbCBleHByZXNzaW9uIGNvZGVcbiAgICAkY29kZUVycm9yID0gbnVsbDsgLy9jb2RlIGV2YWx1YXRpb24gZXJyb3JzXG4gICAgJGNvZGVEaXJ0eSA9IGZhbHNlOyAvLyBpcyBjb2RlIGNoYW5nZWQgd2l0aG91dCByZWV2YWx1YXRpb24/XG4gICAgJHZlcnNpb249MTtcblxuICAgIHZhbGlkYXRpb25SZXN1bHRzID0gW107XG5cbiAgICAvLyB1bmRvIC8gcmVkb1xuICAgIG1heFN0YWNrU2l6ZSA9IDIwO1xuICAgIHVuZG9TdGFjayA9IFtdO1xuICAgIHJlZG9TdGFjayA9IFtdO1xuICAgIHVuZG9SZWRvU3RhdGVDaGFuZ2VkQ2FsbGJhY2sgPSBudWxsO1xuICAgIG5vZGVBZGRlZENhbGxiYWNrID0gbnVsbDtcbiAgICBub2RlUmVtb3ZlZENhbGxiYWNrID0gbnVsbDtcblxuICAgIHRleHRBZGRlZENhbGxiYWNrID0gbnVsbDtcbiAgICB0ZXh0UmVtb3ZlZENhbGxiYWNrID0gbnVsbDtcblxuICAgIGNhbGxiYWNrc0Rpc2FibGVkID0gZmFsc2U7XG5cbiAgICBjb25zdHJ1Y3RvcihkYXRhKSB7XG4gICAgICAgIGlmKGRhdGEpe1xuICAgICAgICAgICAgdGhpcy5sb2FkKGRhdGEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0SnNvblJlcGxhY2VyKGZpbHRlckxvY2F0aW9uPWZhbHNlLCBmaWx0ZXJDb21wdXRlZD1mYWxzZSwgcmVwbGFjZXIsIGZpbHRlclByaXZhdGUgPXRydWUpe1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24gKGssIHYpIHtcblxuICAgICAgICAgICAgaWYgKChmaWx0ZXJQcml2YXRlICYmIFV0aWxzLnN0YXJ0c1dpdGgoaywgJyQnKSkgfHwgayA9PSAncGFyZW50Tm9kZScpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZpbHRlckxvY2F0aW9uICYmIGsgPT0gJ2xvY2F0aW9uJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmlsdGVyQ29tcHV0ZWQgJiYgayA9PSAnY29tcHV0ZWQnKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHJlcGxhY2VyKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVwbGFjZXIoaywgdik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB2O1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgc2VyaWFsaXplKHN0cmluZ2lmeT10cnVlLCBmaWx0ZXJMb2NhdGlvbj1mYWxzZSwgZmlsdGVyQ29tcHV0ZWQ9ZmFsc2UsIHJlcGxhY2VyLCBmaWx0ZXJQcml2YXRlID10cnVlKXtcbiAgICAgICAgdmFyIGRhdGEgPSAge1xuICAgICAgICAgICAgY29kZTogdGhpcy5jb2RlLFxuICAgICAgICAgICAgZXhwcmVzc2lvblNjb3BlOiB0aGlzLmV4cHJlc3Npb25TY29wZSxcbiAgICAgICAgICAgIHRyZWVzOiB0aGlzLmdldFJvb3RzKCksXG4gICAgICAgICAgICB0ZXh0czogdGhpcy50ZXh0cyxcbiAgICAgICAgICAgIHBheW9mZk5hbWVzOiB0aGlzLnBheW9mZk5hbWVzLnNsaWNlKCksXG4gICAgICAgICAgICBkZWZhdWx0Q3JpdGVyaW9uMVdlaWdodDogdGhpcy5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCxcbiAgICAgICAgICAgIHdlaWdodExvd2VyQm91bmQ6IHRoaXMud2VpZ2h0TG93ZXJCb3VuZCxcbiAgICAgICAgICAgIHdlaWdodFVwcGVyQm91bmQ6IHRoaXMud2VpZ2h0VXBwZXJCb3VuZFxuICAgICAgICB9O1xuXG4gICAgICAgIGlmKCFzdHJpbmdpZnkpe1xuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gVXRpbHMuc3RyaW5naWZ5KGRhdGEsIHRoaXMuZ2V0SnNvblJlcGxhY2VyKGZpbHRlckxvY2F0aW9uLCBmaWx0ZXJDb21wdXRlZCwgcmVwbGFjZXIsIGZpbHRlclByaXZhdGUpLCBbXSk7XG4gICAgfVxuXG5cbiAgICAvKkxvYWRzIHNlcmlhbGl6ZWQgZGF0YSovXG4gICAgbG9hZChkYXRhKSB7XG4gICAgICAgIC8vcm9vdHMsIHRleHRzLCBjb2RlLCBleHByZXNzaW9uU2NvcGVcbiAgICAgICAgdmFyIGNhbGxiYWNrc0Rpc2FibGVkID0gdGhpcy5jYWxsYmFja3NEaXNhYmxlZDtcbiAgICAgICAgdGhpcy5jYWxsYmFja3NEaXNhYmxlZCA9IHRydWU7XG5cbiAgICAgICAgdGhpcy5jbGVhcigpO1xuXG5cbiAgICAgICAgZGF0YS50cmVlcy5mb3JFYWNoKG5vZGVEYXRhPT4ge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmNyZWF0ZU5vZGVGcm9tRGF0YShub2RlRGF0YSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChkYXRhLnRleHRzKSB7XG4gICAgICAgICAgICBkYXRhLnRleHRzLmZvckVhY2godGV4dERhdGE9PiB7XG4gICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gbmV3IGRvbWFpbi5Qb2ludCh0ZXh0RGF0YS5sb2NhdGlvbi54LCB0ZXh0RGF0YS5sb2NhdGlvbi55KTtcbiAgICAgICAgICAgICAgICB2YXIgdGV4dCA9IG5ldyBkb21haW4uVGV4dChsb2NhdGlvbiwgdGV4dERhdGEudmFsdWUpO1xuICAgICAgICAgICAgICAgIHRoaXMudGV4dHMucHVzaCh0ZXh0KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmNsZWFyRXhwcmVzc2lvblNjb3BlKCk7XG4gICAgICAgIHRoaXMuY29kZSA9IGRhdGEuY29kZSB8fCAnJztcblxuICAgICAgICBpZiAoZGF0YS5leHByZXNzaW9uU2NvcGUpIHtcbiAgICAgICAgICAgIFV0aWxzLmV4dGVuZCh0aGlzLmV4cHJlc3Npb25TY29wZSwgZGF0YS5leHByZXNzaW9uU2NvcGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEucGF5b2ZmTmFtZXMgIT09IHVuZGVmaW5lZCAmJiBkYXRhLnBheW9mZk5hbWVzICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLnBheW9mZk5hbWVzID0gZGF0YS5wYXlvZmZOYW1lcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0ICE9PSB1bmRlZmluZWQgJiYgZGF0YS5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdGhpcy5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCA9IGRhdGEuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS53ZWlnaHRMb3dlckJvdW5kICE9PSB1bmRlZmluZWQgJiYgZGF0YS53ZWlnaHRMb3dlckJvdW5kICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLndlaWdodExvd2VyQm91bmQgPSBkYXRhLndlaWdodExvd2VyQm91bmQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS53ZWlnaHRVcHBlckJvdW5kICE9PSB1bmRlZmluZWQgJiYgZGF0YS53ZWlnaHRVcHBlckJvdW5kICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLndlaWdodFVwcGVyQm91bmQgPSBkYXRhLndlaWdodFVwcGVyQm91bmQ7XG4gICAgICAgIH1cblxuXG4gICAgICAgIHRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgPSBjYWxsYmFja3NEaXNhYmxlZDtcbiAgICB9XG5cbiAgICBnZXREVE8oZmlsdGVyTG9jYXRpb249ZmFsc2UsIGZpbHRlckNvbXB1dGVkPWZhbHNlLCBmaWx0ZXJQcml2YXRlID1mYWxzZSl7XG4gICAgICAgIHZhciBkdG8gPSB7XG4gICAgICAgICAgICBzZXJpYWxpemVkRGF0YTogdGhpcy5zZXJpYWxpemUodHJ1ZSwgZmlsdGVyTG9jYXRpb24sIGZpbHRlckNvbXB1dGVkLCBudWxsLCBmaWx0ZXJQcml2YXRlKSxcbiAgICAgICAgICAgICRjb2RlRXJyb3I6IHRoaXMuJGNvZGVFcnJvcixcbiAgICAgICAgICAgICRjb2RlRGlydHk6IHRoaXMuJGNvZGVEaXJ0eSxcbiAgICAgICAgICAgIHZhbGlkYXRpb25SZXN1bHRzOiB0aGlzLnZhbGlkYXRpb25SZXN1bHRzLnNsaWNlKClcblxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gZHRvXG4gICAgfVxuXG4gICAgbG9hZEZyb21EVE8oZHRvLCBkYXRhUmV2aXZlcil7XG4gICAgICAgIHRoaXMubG9hZChKU09OLnBhcnNlKGR0by5zZXJpYWxpemVkRGF0YSwgZGF0YVJldml2ZXIpKTtcbiAgICAgICAgdGhpcy4kY29kZUVycm9yID0gZHRvLiRjb2RlRXJyb3I7XG4gICAgICAgIHRoaXMuJGNvZGVEaXJ0eSA9IGR0by4kY29kZURpcnR5O1xuICAgICAgICB0aGlzLnZhbGlkYXRpb25SZXN1bHRzLmxlbmd0aD0wO1xuICAgICAgICBkdG8udmFsaWRhdGlvblJlc3VsdHMuZm9yRWFjaCh2PT57XG4gICAgICAgICAgICB0aGlzLnZhbGlkYXRpb25SZXN1bHRzLnB1c2goVmFsaWRhdGlvblJlc3VsdC5jcmVhdGVGcm9tRFRPKHYpKVxuICAgICAgICB9KVxuICAgIH1cblxuICAgIC8qVGhpcyBtZXRob2QgdXBkYXRlcyBvbmx5IGNvbXB1dGF0aW9uIHJlc3VsdHMvdmFsaWRhdGlvbiovXG4gICAgdXBkYXRlRnJvbShkYXRhTW9kZWwpe1xuICAgICAgICBpZih0aGlzLiR2ZXJzaW9uPmRhdGFNb2RlbC4kdmVyc2lvbil7XG4gICAgICAgICAgICBsb2cud2FybihcIkRhdGFNb2RlbC51cGRhdGVGcm9tOiB2ZXJzaW9uIG9mIGN1cnJlbnQgbW9kZWwgZ3JlYXRlciB0aGFuIHVwZGF0ZVwiKVxuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBieUlkID0ge31cbiAgICAgICAgZGF0YU1vZGVsLm5vZGVzLmZvckVhY2gobj0+e1xuICAgICAgICAgICAgYnlJZFtuLmlkXSA9IG47XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLm5vZGVzLmZvckVhY2goKG4saSk9PntcbiAgICAgICAgICAgIGlmKGJ5SWRbbi5pZF0pe1xuICAgICAgICAgICAgICAgIG4ubG9hZENvbXB1dGVkVmFsdWVzKGJ5SWRbbi5pZF0uY29tcHV0ZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgZGF0YU1vZGVsLmVkZ2VzLmZvckVhY2goZT0+e1xuICAgICAgICAgICAgYnlJZFtlLmlkXSA9IGU7XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmVkZ2VzLmZvckVhY2goKGUsaSk9PntcbiAgICAgICAgICAgIGlmKGJ5SWRbZS5pZF0pe1xuICAgICAgICAgICAgICAgIGUubG9hZENvbXB1dGVkVmFsdWVzKGJ5SWRbZS5pZF0uY29tcHV0ZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5leHByZXNzaW9uU2NvcGUgPSBkYXRhTW9kZWwuZXhwcmVzc2lvblNjb3BlO1xuICAgICAgICB0aGlzLiRjb2RlRXJyb3IgPSBkYXRhTW9kZWwuJGNvZGVFcnJvcjtcbiAgICAgICAgdGhpcy4kY29kZURpcnR5ID0gZGF0YU1vZGVsLiRjb2RlRGlydHk7XG4gICAgICAgIHRoaXMudmFsaWRhdGlvblJlc3VsdHMgID0gZGF0YU1vZGVsLnZhbGlkYXRpb25SZXN1bHRzO1xuICAgIH1cblxuICAgIGdldEdsb2JhbFZhcmlhYmxlTmFtZXMoZmlsdGVyRnVuY3Rpb24gPSB0cnVlKXtcbiAgICAgICAgdmFyIHJlcyA9IFtdO1xuICAgICAgICBVdGlscy5mb3JPd24odGhpcy5leHByZXNzaW9uU2NvcGUsICh2YWx1ZSwga2V5KT0+e1xuICAgICAgICAgICAgaWYoZmlsdGVyRnVuY3Rpb24gJiYgVXRpbHMuaXNGdW5jdGlvbih2YWx1ZSkpe1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcy5wdXNoKGtleSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cblxuICAgIC8qY3JlYXRlIG5vZGUgZnJvbSBzZXJpYWxpemVkIGRhdGEqL1xuICAgIGNyZWF0ZU5vZGVGcm9tRGF0YShkYXRhLCBwYXJlbnQpIHtcbiAgICAgICAgdmFyIG5vZGUsIGxvY2F0aW9uO1xuXG4gICAgICAgIGlmKGRhdGEubG9jYXRpb24pe1xuICAgICAgICAgICAgbG9jYXRpb24gPSBuZXcgZG9tYWluLlBvaW50KGRhdGEubG9jYXRpb24ueCwgZGF0YS5sb2NhdGlvbi55KTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBsb2NhdGlvbiA9IG5ldyBkb21haW4uUG9pbnQoMCwwKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkb21haW4uRGVjaXNpb25Ob2RlLiRUWVBFID09IGRhdGEudHlwZSkge1xuICAgICAgICAgICAgbm9kZSA9IG5ldyBkb21haW4uRGVjaXNpb25Ob2RlKGxvY2F0aW9uKTtcbiAgICAgICAgfSBlbHNlIGlmIChkb21haW4uQ2hhbmNlTm9kZS4kVFlQRSA9PSBkYXRhLnR5cGUpIHtcbiAgICAgICAgICAgIG5vZGUgPSBuZXcgZG9tYWluLkNoYW5jZU5vZGUobG9jYXRpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKGRvbWFpbi5UZXJtaW5hbE5vZGUuJFRZUEUgPT0gZGF0YS50eXBlKSB7XG4gICAgICAgICAgICBub2RlID0gbmV3IGRvbWFpbi5UZXJtaW5hbE5vZGUobG9jYXRpb24pO1xuICAgICAgICB9XG4gICAgICAgIGlmKGRhdGEuaWQpe1xuICAgICAgICAgICAgbm9kZS5pZCA9IGRhdGEuaWQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYoZGF0YS4kZmllbGRTdGF0dXMpe1xuICAgICAgICAgICAgbm9kZS4kZmllbGRTdGF0dXMgPSBkYXRhLiRmaWVsZFN0YXR1cztcbiAgICAgICAgfVxuICAgICAgICBub2RlLm5hbWUgPSBkYXRhLm5hbWU7XG5cbiAgICAgICAgaWYoZGF0YS5jb2RlKXtcbiAgICAgICAgICAgIG5vZGUuY29kZSA9IGRhdGEuY29kZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGF0YS5leHByZXNzaW9uU2NvcGUpIHtcbiAgICAgICAgICAgIG5vZGUuZXhwcmVzc2lvblNjb3BlID0gZGF0YS5leHByZXNzaW9uU2NvcGVcbiAgICAgICAgfVxuICAgICAgICBpZihkYXRhLmNvbXB1dGVkKXtcbiAgICAgICAgICAgIG5vZGUubG9hZENvbXB1dGVkVmFsdWVzKGRhdGEuY29tcHV0ZWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgbm9kZS5mb2xkZWQgPSAhIWRhdGEuZm9sZGVkO1xuXG4gICAgICAgIHZhciBlZGdlT3JOb2RlID0gdGhpcy5hZGROb2RlKG5vZGUsIHBhcmVudCk7XG4gICAgICAgIGRhdGEuY2hpbGRFZGdlcy5mb3JFYWNoKGVkPT4ge1xuICAgICAgICAgICAgdmFyIGVkZ2UgPSB0aGlzLmNyZWF0ZU5vZGVGcm9tRGF0YShlZC5jaGlsZE5vZGUsIG5vZGUpO1xuICAgICAgICAgICAgaWYoVXRpbHMuaXNBcnJheShlZC5wYXlvZmYpKXtcbiAgICAgICAgICAgICAgICBlZGdlLnBheW9mZiA9IGVkLnBheW9mZjtcbiAgICAgICAgICAgIH1lbHNle1xuICAgICAgICAgICAgICAgIGVkZ2UucGF5b2ZmID0gW2VkLnBheW9mZiwgMF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVkZ2UucHJvYmFiaWxpdHkgPSBlZC5wcm9iYWJpbGl0eTtcbiAgICAgICAgICAgIGVkZ2UubmFtZSA9IGVkLm5hbWU7XG4gICAgICAgICAgICBpZihlZC5jb21wdXRlZCl7XG4gICAgICAgICAgICAgICAgZWRnZS5sb2FkQ29tcHV0ZWRWYWx1ZXMoZWQuY29tcHV0ZWQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZWQuaWQpe1xuICAgICAgICAgICAgICAgIGVkZ2UuaWQgPSBlZC5pZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGVkLiRmaWVsZFN0YXR1cyl7XG4gICAgICAgICAgICAgICAgZWRnZS4kZmllbGRTdGF0dXMgPSBlZC4kZmllbGRTdGF0dXM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBlZGdlT3JOb2RlO1xuICAgIH1cblxuICAgIC8qcmV0dXJucyBub2RlIG9yIGVkZ2UgZnJvbSBwYXJlbnQgdG8gdGhpcyBub2RlKi9cbiAgICBhZGROb2RlKG5vZGUsIHBhcmVudCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYubm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgdmFyIGVkZ2UgPSBzZWxmLl9hZGRDaGlsZChwYXJlbnQsIG5vZGUpO1xuICAgICAgICAgICAgdGhpcy5fZmlyZU5vZGVBZGRlZENhbGxiYWNrKG5vZGUpO1xuICAgICAgICAgICAgcmV0dXJuIGVkZ2U7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9maXJlTm9kZUFkZGVkQ2FsbGJhY2sobm9kZSk7XG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIC8qaW5qZWN0cyBnaXZlbiBub2RlIGludG8gZ2l2ZW4gZWRnZSovXG4gICAgaW5qZWN0Tm9kZShub2RlLCBlZGdlKSB7XG4gICAgICAgIHZhciBwYXJlbnQgPSBlZGdlLnBhcmVudE5vZGU7XG4gICAgICAgIHZhciBjaGlsZCA9IGVkZ2UuY2hpbGROb2RlO1xuICAgICAgICB0aGlzLm5vZGVzLnB1c2gobm9kZSk7XG4gICAgICAgIG5vZGUuJHBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgZWRnZS5jaGlsZE5vZGUgPSBub2RlO1xuICAgICAgICB0aGlzLl9hZGRDaGlsZChub2RlLCBjaGlsZCk7XG4gICAgICAgIHRoaXMuX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhub2RlKTtcbiAgICB9XG5cbiAgICBfYWRkQ2hpbGQocGFyZW50LCBjaGlsZCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBlZGdlID0gbmV3IGRvbWFpbi5FZGdlKHBhcmVudCwgY2hpbGQpO1xuICAgICAgICBzZWxmLl9zZXRFZGdlSW5pdGlhbFByb2JhYmlsaXR5KGVkZ2UpO1xuICAgICAgICBzZWxmLmVkZ2VzLnB1c2goZWRnZSk7XG5cbiAgICAgICAgcGFyZW50LmNoaWxkRWRnZXMucHVzaChlZGdlKTtcbiAgICAgICAgY2hpbGQuJHBhcmVudCA9IHBhcmVudDtcbiAgICAgICAgcmV0dXJuIGVkZ2U7XG4gICAgfVxuXG4gICAgX3NldEVkZ2VJbml0aWFsUHJvYmFiaWxpdHkoZWRnZSkge1xuICAgICAgICBpZiAoZWRnZS5wYXJlbnROb2RlIGluc3RhbmNlb2YgZG9tYWluLkNoYW5jZU5vZGUpIHtcbiAgICAgICAgICAgIGVkZ2UucHJvYmFiaWxpdHkgPSAnIyc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBlZGdlLnByb2JhYmlsaXR5ID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICAvKnJlbW92ZXMgZ2l2ZW4gbm9kZSBhbmQgaXRzIHN1YnRyZWUqL1xuICAgIHJlbW92ZU5vZGUobm9kZSwgJGwgPSAwKSB7XG5cbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBub2RlLmNoaWxkRWRnZXMuZm9yRWFjaChlPT5zZWxmLnJlbW92ZU5vZGUoZS5jaGlsZE5vZGUsICRsICsgMSkpO1xuXG4gICAgICAgIHNlbGYuX3JlbW92ZU5vZGUobm9kZSk7XG4gICAgICAgIHZhciBwYXJlbnQgPSBub2RlLiRwYXJlbnQ7XG4gICAgICAgIGlmIChwYXJlbnQpIHtcbiAgICAgICAgICAgIHZhciBwYXJlbnRFZGdlID0gVXRpbHMuZmluZChwYXJlbnQuY2hpbGRFZGdlcywgKGUsIGkpPT4gZS5jaGlsZE5vZGUgPT09IG5vZGUpO1xuICAgICAgICAgICAgaWYgKCRsID09IDApIHtcbiAgICAgICAgICAgICAgICBzZWxmLnJlbW92ZUVkZ2UocGFyZW50RWRnZSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuX3JlbW92ZUVkZ2UocGFyZW50RWRnZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fZmlyZU5vZGVSZW1vdmVkQ2FsbGJhY2sobm9kZSk7XG4gICAgfVxuXG4gICAgLypyZW1vdmVzIGdpdmVuIG5vZGVzIGFuZCB0aGVpciBzdWJ0cmVlcyovXG4gICAgcmVtb3ZlTm9kZXMobm9kZXMpIHtcblxuICAgICAgICB2YXIgcm9vdHMgPSB0aGlzLmZpbmRTdWJ0cmVlUm9vdHMobm9kZXMpO1xuICAgICAgICByb290cy5mb3JFYWNoKG49PnRoaXMucmVtb3ZlTm9kZShuLCAwKSwgdGhpcyk7XG4gICAgfVxuXG4gICAgY29udmVydE5vZGUobm9kZSwgdHlwZVRvQ29udmVydFRvKXtcbiAgICAgICAgdmFyIG5ld05vZGU7XG4gICAgICAgIGlmKCFub2RlLmNoaWxkRWRnZXMubGVuZ3RoICYmIG5vZGUuJHBhcmVudCl7XG4gICAgICAgICAgICBuZXdOb2RlID0gdGhpcy5jcmVhdGVOb2RlQnlUeXBlKHR5cGVUb0NvbnZlcnRUbywgbm9kZS5sb2NhdGlvbik7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgaWYobm9kZSBpbnN0YW5jZW9mIGRvbWFpbi5EZWNpc2lvbk5vZGUgJiYgdHlwZVRvQ29udmVydFRvPT1kb21haW4uQ2hhbmNlTm9kZS4kVFlQRSl7XG4gICAgICAgICAgICAgICAgbmV3Tm9kZSA9IHRoaXMuY3JlYXRlTm9kZUJ5VHlwZSh0eXBlVG9Db252ZXJ0VG8sIG5vZGUubG9jYXRpb24pO1xuICAgICAgICAgICAgfWVsc2UgaWYodHlwZVRvQ29udmVydFRvPT1kb21haW4uRGVjaXNpb25Ob2RlLiRUWVBFKXtcbiAgICAgICAgICAgICAgICBuZXdOb2RlID0gdGhpcy5jcmVhdGVOb2RlQnlUeXBlKHR5cGVUb0NvbnZlcnRUbywgbm9kZS5sb2NhdGlvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZihuZXdOb2RlKXtcbiAgICAgICAgICAgIG5ld05vZGUubmFtZT1ub2RlLm5hbWU7XG4gICAgICAgICAgICB0aGlzLnJlcGxhY2VOb2RlKG5ld05vZGUsIG5vZGUpO1xuICAgICAgICAgICAgbmV3Tm9kZS5jaGlsZEVkZ2VzLmZvckVhY2goZT0+dGhpcy5fc2V0RWRnZUluaXRpYWxQcm9iYWJpbGl0eShlKSk7XG4gICAgICAgICAgICB0aGlzLl9maXJlTm9kZUFkZGVkQ2FsbGJhY2sobmV3Tm9kZSk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIGNyZWF0ZU5vZGVCeVR5cGUodHlwZSwgbG9jYXRpb24pe1xuICAgICAgICBpZih0eXBlPT1kb21haW4uRGVjaXNpb25Ob2RlLiRUWVBFKXtcbiAgICAgICAgICAgIHJldHVybiBuZXcgZG9tYWluLkRlY2lzaW9uTm9kZShsb2NhdGlvbilcbiAgICAgICAgfWVsc2UgaWYodHlwZT09ZG9tYWluLkNoYW5jZU5vZGUuJFRZUEUpe1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBkb21haW4uQ2hhbmNlTm9kZShsb2NhdGlvbilcbiAgICAgICAgfWVsc2UgaWYodHlwZT09ZG9tYWluLlRlcm1pbmFsTm9kZS4kVFlQRSl7XG4gICAgICAgICAgICByZXR1cm4gbmV3IGRvbWFpbi5UZXJtaW5hbE5vZGUobG9jYXRpb24pXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXBsYWNlTm9kZShuZXdOb2RlLCBvbGROb2RlKXtcbiAgICAgICAgdmFyIHBhcmVudCA9IG9sZE5vZGUuJHBhcmVudDtcbiAgICAgICAgbmV3Tm9kZS4kcGFyZW50ID0gcGFyZW50O1xuXG4gICAgICAgIGlmKHBhcmVudCl7XG4gICAgICAgICAgICB2YXIgcGFyZW50RWRnZSA9IFV0aWxzLmZpbmQobmV3Tm9kZS4kcGFyZW50LmNoaWxkRWRnZXMsIGU9PmUuY2hpbGROb2RlPT09b2xkTm9kZSk7XG4gICAgICAgICAgICBwYXJlbnRFZGdlLmNoaWxkTm9kZSA9IG5ld05vZGU7XG4gICAgICAgIH1cblxuICAgICAgICBuZXdOb2RlLmNoaWxkRWRnZXMgPSBvbGROb2RlLmNoaWxkRWRnZXM7XG4gICAgICAgIG5ld05vZGUuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PmUucGFyZW50Tm9kZT1uZXdOb2RlKTtcblxuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLm5vZGVzLmluZGV4T2Yob2xkTm9kZSk7XG4gICAgICAgIGlmKH5pbmRleCl7XG4gICAgICAgICAgICB0aGlzLm5vZGVzW2luZGV4XT1uZXdOb2RlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZ2V0Um9vdHMoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm5vZGVzLmZpbHRlcihuPT4hbi4kcGFyZW50KTtcbiAgICB9XG5cbiAgICBmaW5kU3VidHJlZVJvb3RzKG5vZGVzKSB7XG4gICAgICAgIHJldHVybiBub2Rlcy5maWx0ZXIobj0+IW4uJHBhcmVudCB8fCBub2Rlcy5pbmRleE9mKG4uJHBhcmVudCkgPT09IC0xKTtcbiAgICB9XG5cbiAgICAvKmNyZWF0ZXMgZGV0YWNoZWQgY2xvbmUgb2YgZ2l2ZW4gbm9kZSovXG4gICAgY2xvbmVTdWJ0cmVlKG5vZGVUb0NvcHksIGNsb25lQ29tcHV0ZWRWYWx1ZXMpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgY2xvbmUgPSB0aGlzLmNsb25lTm9kZShub2RlVG9Db3B5KTtcblxuICAgICAgICBub2RlVG9Db3B5LmNoaWxkRWRnZXMuZm9yRWFjaChlPT4ge1xuICAgICAgICAgICAgdmFyIGNoaWxkQ2xvbmUgPSBzZWxmLmNsb25lU3VidHJlZShlLmNoaWxkTm9kZSwgY2xvbmVDb21wdXRlZFZhbHVlcyk7XG4gICAgICAgICAgICBjaGlsZENsb25lLiRwYXJlbnQgPSBjbG9uZTtcbiAgICAgICAgICAgIHZhciBlZGdlID0gVXRpbHMuY2xvbmUoZSk7XG4gICAgICAgICAgICBlZGdlLmlkID0gVXRpbHMuZ3VpZCgpO1xuICAgICAgICAgICAgZWRnZS5wYXJlbnROb2RlID0gY2xvbmU7XG4gICAgICAgICAgICBlZGdlLmNoaWxkTm9kZSA9IGNoaWxkQ2xvbmU7XG4gICAgICAgICAgICBlZGdlLnBheW9mZiA9IFV0aWxzLmNsb25lRGVlcChlLnBheW9mZik7XG4gICAgICAgICAgICBlZGdlLmNvbXB1dGVkID0ge307XG4gICAgICAgICAgICBpZiAoY2xvbmVDb21wdXRlZFZhbHVlcykge1xuICAgICAgICAgICAgICAgIGVkZ2UuY29tcHV0ZWQgPSBVdGlscy5jbG9uZURlZXAoZS5jb21wdXRlZCk7XG4gICAgICAgICAgICAgICAgY2hpbGRDbG9uZS5jb21wdXRlZCA9IFV0aWxzLmNsb25lRGVlcChlLmNoaWxkTm9kZS5jb21wdXRlZClcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNsb25lLmNoaWxkRWRnZXMucHVzaChlZGdlKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGlmIChjbG9uZUNvbXB1dGVkVmFsdWVzKSB7XG4gICAgICAgICAgICBjbG9uZS5jb21wdXRlZCA9IFV0aWxzLmNsb25lRGVlcChub2RlVG9Db3B5LmNvbXB1dGVkKVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjbG9uZTtcbiAgICB9XG5cbiAgICAvKmF0dGFjaGVzIGRldGFjaGVkIHN1YnRyZWUgdG8gZ2l2ZW4gcGFyZW50Ki9cbiAgICBhdHRhY2hTdWJ0cmVlKG5vZGVUb0F0dGFjaCwgcGFyZW50KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG5vZGVPckVkZ2UgPSBzZWxmLmFkZE5vZGUobm9kZVRvQXR0YWNoLCBwYXJlbnQpO1xuXG4gICAgICAgIG5vZGVUb0F0dGFjaC5leHByZXNzaW9uU2NvcGUgPSBudWxsO1xuXG4gICAgICAgIHZhciBjaGlsZEVkZ2VzID0gc2VsZi5nZXRBbGxEZXNjZW5kYW50RWRnZXMobm9kZVRvQXR0YWNoKTtcbiAgICAgICAgY2hpbGRFZGdlcy5mb3JFYWNoKGU9PiB7XG4gICAgICAgICAgICBzZWxmLmVkZ2VzLnB1c2goZSk7XG4gICAgICAgICAgICBzZWxmLm5vZGVzLnB1c2goZS5jaGlsZE5vZGUpO1xuICAgICAgICAgICAgZS5jaGlsZE5vZGUuZXhwcmVzc2lvblNjb3BlID0gbnVsbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIG5vZGVPckVkZ2U7XG4gICAgfVxuXG4gICAgY2xvbmVOb2Rlcyhub2Rlcykge1xuICAgICAgICB2YXIgcm9vdHMgPSBbXVxuICAgICAgICAvL1RPRE9cbiAgICB9XG5cbiAgICAvKnNoYWxsb3cgY2xvbmUgd2l0aG91dCBwYXJlbnQgYW5kIGNoaWxkcmVuKi9cbiAgICBjbG9uZU5vZGUobm9kZSkge1xuICAgICAgICB2YXIgY2xvbmUgPSBVdGlscy5jbG9uZShub2RlKVxuICAgICAgICBjbG9uZS5pZCA9IFV0aWxzLmd1aWQoKTtcbiAgICAgICAgY2xvbmUubG9jYXRpb24gPSBVdGlscy5jbG9uZShub2RlLmxvY2F0aW9uKTtcbiAgICAgICAgY2xvbmUuY29tcHV0ZWQgPSBVdGlscy5jbG9uZShub2RlLmNvbXB1dGVkKTtcbiAgICAgICAgY2xvbmUuJHBhcmVudCA9IG51bGw7XG4gICAgICAgIGNsb25lLmNoaWxkRWRnZXMgPSBbXTtcbiAgICAgICAgcmV0dXJuIGNsb25lO1xuICAgIH1cblxuICAgIGZpbmROb2RlQnlJZChpZCkge1xuICAgICAgICByZXR1cm4gVXRpbHMuZmluZCh0aGlzLm5vZGVzLCBuPT5uLmlkID09IGlkKTtcbiAgICB9XG5cbiAgICBmaW5kRWRnZUJ5SWQoaWQpIHtcbiAgICAgICAgcmV0dXJuIFV0aWxzLmZpbmQodGhpcy5lZGdlcywgZT0+ZS5pZCA9PSBpZCk7XG4gICAgfVxuXG4gICAgZmluZEJ5SWQoaWQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB0aGlzLmZpbmROb2RlQnlJZChpZCk7XG4gICAgICAgIGlmIChub2RlKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5maW5kRWRnZUJ5SWQoaWQpO1xuICAgIH1cblxuICAgIF9yZW1vdmVOb2RlKG5vZGUpIHsvLyBzaW1wbHkgcmVtb3ZlcyBub2RlIGZyb20gbm9kZSBsaXN0XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMubm9kZXMuaW5kZXhPZihub2RlKTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHRoaXMubm9kZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlbW92ZUVkZ2UoZWRnZSkge1xuICAgICAgICB2YXIgaW5kZXggPSBlZGdlLnBhcmVudE5vZGUuY2hpbGRFZGdlcy5pbmRleE9mKGVkZ2UpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgZWRnZS5wYXJlbnROb2RlLmNoaWxkRWRnZXMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZW1vdmVFZGdlKGVkZ2UpO1xuICAgIH1cblxuICAgIF9yZW1vdmVFZGdlKGVkZ2UpIHsgLy9yZW1vdmVzIGVkZ2UgZnJvbSBlZGdlIGxpc3Qgd2l0aG91dCByZW1vdmluZyBjb25uZWN0ZWQgbm9kZXNcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5lZGdlcy5pbmRleE9mKGVkZ2UpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5lZGdlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3JlbW92ZU5vZGVzKG5vZGVzVG9SZW1vdmUpIHtcbiAgICAgICAgdGhpcy5ub2RlcyA9IHRoaXMubm9kZXMuZmlsdGVyKG49Pm5vZGVzVG9SZW1vdmUuaW5kZXhPZihuKSA9PT0gLTEpO1xuICAgIH1cblxuICAgIF9yZW1vdmVFZGdlcyhlZGdlc1RvUmVtb3ZlKSB7XG4gICAgICAgIHRoaXMuZWRnZXMgPSB0aGlzLmVkZ2VzLmZpbHRlcihlPT5lZGdlc1RvUmVtb3ZlLmluZGV4T2YoZSkgPT09IC0xKTtcbiAgICB9XG5cbiAgICBnZXRBbGxEZXNjZW5kYW50RWRnZXMobm9kZSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciByZXN1bHQgPSBbXTtcblxuICAgICAgICBub2RlLmNoaWxkRWRnZXMuZm9yRWFjaChlPT4ge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goZSk7XG4gICAgICAgICAgICBpZiAoZS5jaGlsZE5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCguLi5zZWxmLmdldEFsbERlc2NlbmRhbnRFZGdlcyhlLmNoaWxkTm9kZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGdldEFsbERlc2NlbmRhbnROb2Rlcyhub2RlKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIG5vZGUuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PiB7XG4gICAgICAgICAgICBpZiAoZS5jaGlsZE5vZGUpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaChlLmNoaWxkTm9kZSk7XG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2goLi4uc2VsZi5nZXRBbGxEZXNjZW5kYW50Tm9kZXMoZS5jaGlsZE5vZGUpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG5cbiAgICBnZXRBbGxOb2Rlc0luU3VidHJlZShub2RlKSB7XG4gICAgICAgIHZhciBkZXNjZW5kYW50cyA9IHRoaXMuZ2V0QWxsRGVzY2VuZGFudE5vZGVzKG5vZGUpO1xuICAgICAgICBkZXNjZW5kYW50cy51bnNoaWZ0KG5vZGUpO1xuICAgICAgICByZXR1cm4gZGVzY2VuZGFudHM7XG4gICAgfVxuXG4gICAgaXNVbmRvQXZhaWxhYmxlKCkge1xuICAgICAgICByZXR1cm4gISF0aGlzLnVuZG9TdGFjay5sZW5ndGhcbiAgICB9XG5cbiAgICBpc1JlZG9BdmFpbGFibGUoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMucmVkb1N0YWNrLmxlbmd0aFxuICAgIH1cblxuICAgIGNyZWF0ZVN0YXRlU25hcHNob3QocmV2ZXJ0Q29uZil7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICByZXZlcnRDb25mOiByZXZlcnRDb25mLFxuICAgICAgICAgICAgbm9kZXM6IFV0aWxzLmNsb25lRGVlcCh0aGlzLm5vZGVzKSxcbiAgICAgICAgICAgIGVkZ2VzOiBVdGlscy5jbG9uZURlZXAodGhpcy5lZGdlcyksXG4gICAgICAgICAgICB0ZXh0czogVXRpbHMuY2xvbmVEZWVwKHRoaXMudGV4dHMpLFxuICAgICAgICAgICAgcGF5b2ZmTmFtZXM6IFV0aWxzLmNsb25lRGVlcCh0aGlzLnBheW9mZk5hbWVzKSxcbiAgICAgICAgICAgIGRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0OiBVdGlscy5jbG9uZURlZXAodGhpcy5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCksXG4gICAgICAgICAgICB3ZWlnaHRMb3dlckJvdW5kOiBVdGlscy5jbG9uZURlZXAodGhpcy53ZWlnaHRMb3dlckJvdW5kKSxcbiAgICAgICAgICAgIHdlaWdodFVwcGVyQm91bmQ6IFV0aWxzLmNsb25lRGVlcCh0aGlzLndlaWdodFVwcGVyQm91bmQpLFxuICAgICAgICAgICAgZXhwcmVzc2lvblNjb3BlOiBVdGlscy5jbG9uZURlZXAodGhpcy5leHByZXNzaW9uU2NvcGUpLFxuICAgICAgICAgICAgY29kZTogdGhpcy5jb2RlLFxuICAgICAgICAgICAgJGNvZGVFcnJvcjogdGhpcy4kY29kZUVycm9yXG4gICAgICAgIH1cbiAgICB9XG5cblxuICAgIHNhdmVTdGF0ZUZyb21TbmFwc2hvdChzdGF0ZSl7XG4gICAgICAgIHRoaXMucmVkb1N0YWNrLmxlbmd0aCA9IDA7XG5cbiAgICAgICAgdGhpcy5fcHVzaFRvU3RhY2sodGhpcy51bmRvU3RhY2ssIHN0YXRlKTtcblxuICAgICAgICB0aGlzLl9maXJlVW5kb1JlZG9DYWxsYmFjaygpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNhdmVTdGF0ZShyZXZlcnRDb25mKSB7XG4gICAgICAgIHRoaXMuc2F2ZVN0YXRlRnJvbVNuYXBzaG90KHRoaXMuY3JlYXRlU3RhdGVTbmFwc2hvdChyZXZlcnRDb25mKSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHVuZG8oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG5ld1N0YXRlID0gdGhpcy51bmRvU3RhY2sucG9wKCk7XG4gICAgICAgIGlmICghbmV3U3RhdGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3B1c2hUb1N0YWNrKHRoaXMucmVkb1N0YWNrLCB7XG4gICAgICAgICAgICByZXZlcnRDb25mOiBuZXdTdGF0ZS5yZXZlcnRDb25mLFxuICAgICAgICAgICAgbm9kZXM6IHNlbGYubm9kZXMsXG4gICAgICAgICAgICBlZGdlczogc2VsZi5lZGdlcyxcbiAgICAgICAgICAgIHRleHRzOiBzZWxmLnRleHRzLFxuICAgICAgICAgICAgcGF5b2ZmTmFtZXM6IHNlbGYucGF5b2ZmTmFtZXMsXG4gICAgICAgICAgICBkZWZhdWx0Q3JpdGVyaW9uMVdlaWdodDogc2VsZi5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCxcbiAgICAgICAgICAgIHdlaWdodExvd2VyQm91bmQ6IHNlbGYud2VpZ2h0TG93ZXJCb3VuZCxcbiAgICAgICAgICAgIHdlaWdodFVwcGVyQm91bmQ6IHNlbGYud2VpZ2h0VXBwZXJCb3VuZCxcbiAgICAgICAgICAgIGV4cHJlc3Npb25TY29wZTogc2VsZi5leHByZXNzaW9uU2NvcGUsXG4gICAgICAgICAgICBjb2RlOiBzZWxmLmNvZGUsXG4gICAgICAgICAgICAkY29kZUVycm9yOiBzZWxmLiRjb2RlRXJyb3JcblxuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLl9zZXROZXdTdGF0ZShuZXdTdGF0ZSk7XG5cbiAgICAgICAgdGhpcy5fZmlyZVVuZG9SZWRvQ2FsbGJhY2soKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICByZWRvKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBuZXdTdGF0ZSA9IHRoaXMucmVkb1N0YWNrLnBvcCgpO1xuICAgICAgICBpZiAoIW5ld1N0YXRlKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9wdXNoVG9TdGFjayh0aGlzLnVuZG9TdGFjaywge1xuICAgICAgICAgICAgcmV2ZXJ0Q29uZjogbmV3U3RhdGUucmV2ZXJ0Q29uZixcbiAgICAgICAgICAgIG5vZGVzOiBzZWxmLm5vZGVzLFxuICAgICAgICAgICAgZWRnZXM6IHNlbGYuZWRnZXMsXG4gICAgICAgICAgICB0ZXh0czogc2VsZi50ZXh0cyxcbiAgICAgICAgICAgIHBheW9mZk5hbWVzOiBzZWxmLnBheW9mZk5hbWVzLFxuICAgICAgICAgICAgZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQ6IHNlbGYuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQsXG4gICAgICAgICAgICB3ZWlnaHRMb3dlckJvdW5kOiBzZWxmLndlaWdodExvd2VyQm91bmQsXG4gICAgICAgICAgICB3ZWlnaHRVcHBlckJvdW5kOiBzZWxmLndlaWdodFVwcGVyQm91bmQsXG4gICAgICAgICAgICBleHByZXNzaW9uU2NvcGU6IHNlbGYuZXhwcmVzc2lvblNjb3BlLFxuICAgICAgICAgICAgY29kZTogc2VsZi5jb2RlLFxuICAgICAgICAgICAgJGNvZGVFcnJvcjogc2VsZi4kY29kZUVycm9yXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX3NldE5ld1N0YXRlKG5ld1N0YXRlLCB0cnVlKTtcblxuICAgICAgICB0aGlzLl9maXJlVW5kb1JlZG9DYWxsYmFjaygpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNsZWFyKCkge1xuICAgICAgICB0aGlzLm5vZGVzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuZWRnZXMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy51bmRvU3RhY2subGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5yZWRvU3RhY2subGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy50ZXh0cy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLmNsZWFyRXhwcmVzc2lvblNjb3BlKCk7XG4gICAgICAgIHRoaXMuY29kZSA9ICcnO1xuICAgICAgICB0aGlzLiRjb2RlRXJyb3IgPSBudWxsO1xuICAgICAgICB0aGlzLiRjb2RlRGlydHkgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLnBheW9mZk5hbWVzID0gW107XG4gICAgICAgIHRoaXMuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQgPSAxO1xuICAgICAgICB0aGlzLndlaWdodExvd2VyQm91bmQgPSAwO1xuICAgICAgICB0aGlzLndlaWdodFVwcGVyQm91bmQgPSBJbmZpbml0eTtcbiAgICB9XG5cbiAgICBjbGVhckNvbXB1dGVkVmFsdWVzKCl7XG4gICAgICAgIHRoaXMubm9kZXMuZm9yRWFjaChuPT5uLmNsZWFyQ29tcHV0ZWRWYWx1ZXMoKSk7XG4gICAgICAgIHRoaXMuZWRnZXMuZm9yRWFjaChlPT5lLmNsZWFyQ29tcHV0ZWRWYWx1ZXMoKSk7XG4gICAgfVxuXG4gICAgYWRkVGV4dCh0ZXh0KSB7XG4gICAgICAgIHRoaXMudGV4dHMucHVzaCh0ZXh0KTtcblxuICAgICAgICB0aGlzLl9maXJlVGV4dEFkZGVkQ2FsbGJhY2sodGV4dCk7XG4gICAgfVxuXG4gICAgcmVtb3ZlVGV4dHModGV4dHMpIHtcbiAgICAgICAgdGV4dHMuZm9yRWFjaCh0PT50aGlzLnJlbW92ZVRleHQodCkpO1xuICAgIH1cblxuICAgIHJlbW92ZVRleHQodGV4dCkge1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLnRleHRzLmluZGV4T2YodGV4dCk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICB0aGlzLnRleHRzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICB0aGlzLl9maXJlVGV4dFJlbW92ZWRDYWxsYmFjayh0ZXh0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNsZWFyRXhwcmVzc2lvblNjb3BlKCkge1xuICAgICAgICBVdGlscy5mb3JPd24odGhpcy5leHByZXNzaW9uU2NvcGUsICh2YWx1ZSwga2V5KT0+IHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmV4cHJlc3Npb25TY29wZVtrZXldO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZXZlcnNlUGF5b2Zmcygpe1xuICAgICAgICB0aGlzLnBheW9mZk5hbWVzLnJldmVyc2UoKTtcbiAgICAgICAgdGhpcy5lZGdlcy5mb3JFYWNoKGU9PmUucGF5b2ZmLnJldmVyc2UoKSlcbiAgICB9XG5cbiAgICBfc2V0TmV3U3RhdGUobmV3U3RhdGUsIHJlZG8pIHtcbiAgICAgICAgdmFyIG5vZGVCeUlkID0gVXRpbHMuZ2V0T2JqZWN0QnlJZE1hcChuZXdTdGF0ZS5ub2Rlcyk7XG4gICAgICAgIHZhciBlZGdlQnlJZCA9IFV0aWxzLmdldE9iamVjdEJ5SWRNYXAobmV3U3RhdGUuZWRnZXMpO1xuICAgICAgICB0aGlzLm5vZGVzID0gbmV3U3RhdGUubm9kZXM7XG4gICAgICAgIHRoaXMuZWRnZXMgPSBuZXdTdGF0ZS5lZGdlcztcbiAgICAgICAgdGhpcy50ZXh0cyA9IG5ld1N0YXRlLnRleHRzO1xuICAgICAgICB0aGlzLnBheW9mZk5hbWVzID0gbmV3U3RhdGUucGF5b2ZmTmFtZXM7XG4gICAgICAgIHRoaXMuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQgPSBuZXdTdGF0ZS5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodDtcbiAgICAgICAgdGhpcy53ZWlnaHRMb3dlckJvdW5kID0gbmV3U3RhdGUud2VpZ2h0TG93ZXJCb3VuZDtcbiAgICAgICAgdGhpcy53ZWlnaHRVcHBlckJvdW5kID0gbmV3U3RhdGUud2VpZ2h0VXBwZXJCb3VuZDtcbiAgICAgICAgdGhpcy5leHByZXNzaW9uU2NvcGUgPSBuZXdTdGF0ZS5leHByZXNzaW9uU2NvcGU7XG4gICAgICAgIHRoaXMuY29kZSA9IG5ld1N0YXRlLmNvZGU7XG4gICAgICAgIHRoaXMuJGNvZGVFcnJvciAgPSBuZXdTdGF0ZS4kY29kZUVycm9yXG5cbiAgICAgICAgdGhpcy5ub2Rlcy5mb3JFYWNoKG49PiB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG4uY2hpbGRFZGdlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBlZGdlID0gZWRnZUJ5SWRbbi5jaGlsZEVkZ2VzW2ldLmlkXTtcbiAgICAgICAgICAgICAgICBuLmNoaWxkRWRnZXNbaV0gPSBlZGdlO1xuICAgICAgICAgICAgICAgIGVkZ2UucGFyZW50Tm9kZSA9IG47XG4gICAgICAgICAgICAgICAgZWRnZS5jaGlsZE5vZGUgPSBub2RlQnlJZFtlZGdlLmNoaWxkTm9kZS5pZF07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKG5ld1N0YXRlLnJldmVydENvbmYpIHtcbiAgICAgICAgICAgIGlmICghcmVkbyAmJiBuZXdTdGF0ZS5yZXZlcnRDb25mLm9uVW5kbykge1xuICAgICAgICAgICAgICAgIG5ld1N0YXRlLnJldmVydENvbmYub25VbmRvKG5ld1N0YXRlLnJldmVydENvbmYuZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVkbyAmJiBuZXdTdGF0ZS5yZXZlcnRDb25mLm9uUmVkbykge1xuICAgICAgICAgICAgICAgIG5ld1N0YXRlLnJldmVydENvbmYub25SZWRvKG5ld1N0YXRlLnJldmVydENvbmYuZGF0YSk7XG4gICAgICAgICAgICB9XG5cblxuICAgICAgICB9XG4gICAgICAgIHRoaXMucmV2ZXJ0Q29uZiA9IG5ld1N0YXRlLnJldmVydENvbmY7XG4gICAgfVxuXG5cbiAgICBfcHVzaFRvU3RhY2soc3RhY2ssIG9iaikge1xuICAgICAgICBpZiAoc3RhY2subGVuZ3RoID49IHRoaXMubWF4U3RhY2tTaXplKSB7XG4gICAgICAgICAgICBzdGFjay5zaGlmdCgpO1xuICAgICAgICB9XG4gICAgICAgIHN0YWNrLnB1c2gob2JqKTtcbiAgICB9XG5cbiAgICBfZmlyZVVuZG9SZWRvQ2FsbGJhY2soKSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLnVuZG9SZWRvU3RhdGVDaGFuZ2VkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMudW5kb1JlZG9TdGF0ZUNoYW5nZWRDYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhub2RlKSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLm5vZGVBZGRlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLm5vZGVBZGRlZENhbGxiYWNrKG5vZGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpcmVOb2RlUmVtb3ZlZENhbGxiYWNrKG5vZGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc0Rpc2FibGVkICYmIHRoaXMubm9kZVJlbW92ZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy5ub2RlUmVtb3ZlZENhbGxiYWNrKG5vZGUpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpcmVUZXh0QWRkZWRDYWxsYmFjayh0ZXh0KSB7XG4gICAgICAgIGlmICghdGhpcy5jYWxsYmFja3NEaXNhYmxlZCAmJiB0aGlzLnRleHRBZGRlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLnRleHRBZGRlZENhbGxiYWNrKHRleHQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX2ZpcmVUZXh0UmVtb3ZlZENhbGxiYWNrKHRleHQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc0Rpc2FibGVkICYmIHRoaXMudGV4dFJlbW92ZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy50ZXh0UmVtb3ZlZENhbGxiYWNrKHRleHQpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiaW1wb3J0IHtPYmplY3RXaXRoQ29tcHV0ZWRWYWx1ZXN9IGZyb20gXCIuL29iamVjdC13aXRoLWNvbXB1dGVkLXZhbHVlc1wiO1xuXG5leHBvcnQgY2xhc3MgRWRnZSBleHRlbmRzIE9iamVjdFdpdGhDb21wdXRlZFZhbHVlcyB7XG4gICAgcGFyZW50Tm9kZTtcbiAgICBjaGlsZE5vZGU7XG5cbiAgICBuYW1lID0gJyc7XG4gICAgcHJvYmFiaWxpdHkgPSB1bmRlZmluZWQ7XG4gICAgcGF5b2ZmID0gWzAsIDBdO1xuXG4gICAgJERJU1BMQVlfVkFMVUVfTkFNRVMgPSBbJ3Byb2JhYmlsaXR5JywgJ3BheW9mZicsICdvcHRpbWFsJ107XG5cbiAgICBjb25zdHJ1Y3RvcihwYXJlbnROb2RlLCBjaGlsZE5vZGUsIG5hbWUsIHBheW9mZiwgcHJvYmFiaWxpdHksKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMucGFyZW50Tm9kZSA9IHBhcmVudE5vZGU7XG4gICAgICAgIHRoaXMuY2hpbGROb2RlID0gY2hpbGROb2RlO1xuXG4gICAgICAgIGlmIChuYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHByb2JhYmlsaXR5ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMucHJvYmFiaWxpdHkgPSBwcm9iYWJpbGl0eTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocGF5b2ZmICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMucGF5b2ZmID0gcGF5b2ZmXG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHNldE5hbWUobmFtZSkge1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBzZXRQcm9iYWJpbGl0eShwcm9iYWJpbGl0eSkge1xuICAgICAgICB0aGlzLnByb2JhYmlsaXR5ID0gcHJvYmFiaWxpdHk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldFBheW9mZihwYXlvZmYsIGluZGV4ID0gMCkge1xuICAgICAgICB0aGlzLnBheW9mZltpbmRleF0gPSBwYXlvZmY7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIGNvbXB1dGVkQmFzZVByb2JhYmlsaXR5KHZhbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb21wdXRlZFZhbHVlKG51bGwsICdwcm9iYWJpbGl0eScsIHZhbCk7XG4gICAgfVxuXG4gICAgY29tcHV0ZWRCYXNlUGF5b2ZmKHZhbCwgaW5kZXggPSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVkVmFsdWUobnVsbCwgJ3BheW9mZlsnICsgaW5kZXggKyAnXScsIHZhbCk7XG4gICAgfVxuXG4gICAgZGlzcGxheVByb2JhYmlsaXR5KHZhbCkge1xuICAgICAgICByZXR1cm4gdGhpcy5kaXNwbGF5VmFsdWUoJ3Byb2JhYmlsaXR5JywgdmFsKTtcbiAgICB9XG5cbiAgICBkaXNwbGF5UGF5b2ZmKHZhbCwgaW5kZXggPSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRpc3BsYXlWYWx1ZSgncGF5b2ZmWycgKyBpbmRleCArICddJywgdmFsKTtcbiAgICB9XG59XG4iLCJleHBvcnQgKiBmcm9tICcuL25vZGUvbm9kZSdcbmV4cG9ydCAqIGZyb20gJy4vbm9kZS9kZWNpc2lvbi1ub2RlJ1xuZXhwb3J0ICogZnJvbSAnLi9ub2RlL2NoYW5jZS1ub2RlJ1xuZXhwb3J0ICogZnJvbSAnLi9ub2RlL3Rlcm1pbmFsLW5vZGUnXG5leHBvcnQgKiBmcm9tICcuL2VkZ2UnXG5leHBvcnQgKiBmcm9tICcuL3BvaW50J1xuZXhwb3J0ICogZnJvbSAnLi90ZXh0J1xuIiwiaW1wb3J0IHtOb2RlfSBmcm9tICcuL25vZGUnXG5cbmV4cG9ydCBjbGFzcyBDaGFuY2VOb2RlIGV4dGVuZHMgTm9kZXtcblxuICAgIHN0YXRpYyAkVFlQRSA9ICdjaGFuY2UnO1xuXG4gICAgY29uc3RydWN0b3IobG9jYXRpb24pe1xuICAgICAgICBzdXBlcihDaGFuY2VOb2RlLiRUWVBFLCBsb2NhdGlvbik7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtOb2RlfSBmcm9tICcuL25vZGUnXG5cbmV4cG9ydCBjbGFzcyBEZWNpc2lvbk5vZGUgZXh0ZW5kcyBOb2Rle1xuXG4gICAgc3RhdGljICRUWVBFID0gJ2RlY2lzaW9uJztcblxuICAgIGNvbnN0cnVjdG9yKGxvY2F0aW9uKXtcbiAgICAgICAgc3VwZXIoRGVjaXNpb25Ob2RlLiRUWVBFLCBsb2NhdGlvbik7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtQb2ludH0gZnJvbSAnLi4vcG9pbnQnXG5pbXBvcnQge09iamVjdFdpdGhDb21wdXRlZFZhbHVlc30gZnJvbSAnLi4vb2JqZWN0LXdpdGgtY29tcHV0ZWQtdmFsdWVzJ1xuXG5leHBvcnQgY2xhc3MgTm9kZSBleHRlbmRzIE9iamVjdFdpdGhDb21wdXRlZFZhbHVlc3tcblxuICAgIHR5cGU7XG4gICAgY2hpbGRFZGdlcz1bXTtcbiAgICBuYW1lPScnO1xuXG4gICAgbG9jYXRpb247IC8vUG9pbnRcblxuICAgIGNvZGU9Jyc7XG4gICAgJGNvZGVEaXJ0eSA9IGZhbHNlOyAvLyBpcyBjb2RlIGNoYW5nZWQgd2l0aG91dCByZWV2YWx1YXRpb24/XG4gICAgJGNvZGVFcnJvciA9IG51bGw7IC8vY29kZSBldmFsdWF0aW9uIGVycm9yc1xuXG4gICAgZXhwcmVzc2lvblNjb3BlPW51bGw7XG5cbiAgICBmb2xkZWQgPSBmYWxzZTsgLy8gaXMgbm9kZSBmb2xkZWQgYWxvbmcgd2l0aCBpdHMgc3VidHJlZVxuXG4gICAgJERJU1BMQVlfVkFMVUVfTkFNRVMgPSBbJ2NoaWxkcmVuUGF5b2ZmJywgJ2FnZ3JlZ2F0ZWRQYXlvZmYnLCAncHJvYmFiaWxpdHlUb0VudGVyJywgJ29wdGltYWwnXVxuXG4gICAgY29uc3RydWN0b3IodHlwZSwgbG9jYXRpb24pe1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmxvY2F0aW9uPWxvY2F0aW9uO1xuICAgICAgICBpZighbG9jYXRpb24pe1xuICAgICAgICAgICAgdGhpcy5sb2NhdGlvbiA9IG5ldyBQb2ludCgwLDApO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMudHlwZT10eXBlO1xuICAgIH1cblxuICAgIHNldE5hbWUobmFtZSl7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIG1vdmVUbyh4LHksIHdpdGhDaGlsZHJlbil7IC8vbW92ZSB0byBuZXcgbG9jYXRpb25cbiAgICAgICAgaWYod2l0aENoaWxkcmVuKXtcbiAgICAgICAgICAgIHZhciBkeCA9IHgtdGhpcy5sb2NhdGlvbi54O1xuICAgICAgICAgICAgdmFyIGR5ID0geS10aGlzLmxvY2F0aW9uLnk7XG4gICAgICAgICAgICB0aGlzLmNoaWxkRWRnZXMuZm9yRWFjaChlPT5lLmNoaWxkTm9kZS5tb3ZlKGR4LCBkeSwgdHJ1ZSkpXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmxvY2F0aW9uLm1vdmVUbyh4LHkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBtb3ZlKGR4LCBkeSwgd2l0aENoaWxkcmVuKXsgLy9tb3ZlIGJ5IHZlY3RvclxuICAgICAgICBpZih3aXRoQ2hpbGRyZW4pe1xuICAgICAgICAgICAgdGhpcy5jaGlsZEVkZ2VzLmZvckVhY2goZT0+ZS5jaGlsZE5vZGUubW92ZShkeCwgZHksIHRydWUpKVxuICAgICAgICB9XG4gICAgICAgIHRoaXMubG9jYXRpb24ubW92ZShkeCwgZHkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG4iLCJpbXBvcnQge05vZGV9IGZyb20gJy4vbm9kZSdcblxuZXhwb3J0IGNsYXNzIFRlcm1pbmFsTm9kZSBleHRlbmRzIE5vZGV7XG5cbiAgICBzdGF0aWMgJFRZUEUgPSAndGVybWluYWwnO1xuXG4gICAgY29uc3RydWN0b3IobG9jYXRpb24pe1xuICAgICAgICBzdXBlcihUZXJtaW5hbE5vZGUuJFRZUEUsIGxvY2F0aW9uKTtcbiAgICB9XG59XG4iLCJpbXBvcnQge1V0aWxzfSBmcm9tICdzZC11dGlscydcblxuaW1wb3J0IHtPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkc30gZnJvbSBcIi4vb2JqZWN0LXdpdGgtaWQtYW5kLWVkaXRhYmxlLWZpZWxkc1wiO1xuXG5leHBvcnQgY2xhc3MgT2JqZWN0V2l0aENvbXB1dGVkVmFsdWVzIGV4dGVuZHMgT2JqZWN0V2l0aElkQW5kRWRpdGFibGVGaWVsZHN7XG5cbiAgICBjb21wdXRlZD17fTsgLy9jb21wdXRlZCB2YWx1ZXNcblxuICAgIC8qZ2V0IG9yIHNldCBjb21wdXRlZCB2YWx1ZSovXG4gICAgY29tcHV0ZWRWYWx1ZShydWxlTmFtZSwgZmllbGRQYXRoLCB2YWx1ZSl7XG4gICAgICAgIHZhciBwYXRoID0gJ2NvbXB1dGVkLic7XG4gICAgICAgIGlmKHJ1bGVOYW1lKXtcbiAgICAgICAgICAgIHBhdGgrPXJ1bGVOYW1lKycuJztcbiAgICAgICAgfVxuICAgICAgICBwYXRoKz1maWVsZFBhdGg7XG4gICAgICAgIGlmKHZhbHVlPT09dW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHJldHVybiAgVXRpbHMuZ2V0KHRoaXMsIHBhdGgsIG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIFV0aWxzLnNldCh0aGlzLCBwYXRoLCB2YWx1ZSk7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBjbGVhckNvbXB1dGVkVmFsdWVzKHJ1bGVOYW1lKXtcbiAgICAgICAgaWYocnVsZU5hbWU9PXVuZGVmaW5lZCl7XG4gICAgICAgICAgICB0aGlzLmNvbXB1dGVkPXt9O1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGlmKFV0aWxzLmlzQXJyYXkocnVsZU5hbWUpKXtcbiAgICAgICAgICAgIHJ1bGVOYW1lLmZvckVhY2gobj0+e1xuICAgICAgICAgICAgICAgIHRoaXMuY29tcHV0ZWRbbl09e307XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbXB1dGVkW3J1bGVOYW1lXT17fTtcbiAgICB9XG5cbiAgICBjbGVhckRpc3BsYXlWYWx1ZXMoKXtcbiAgICAgICAgdGhpcy5jb21wdXRlZFsnJGRpc3BsYXlWYWx1ZXMnXT17fTtcbiAgICB9XG5cbiAgICBkaXNwbGF5VmFsdWUoZmllbGRQYXRoLCB2YWx1ZSl7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVkVmFsdWUobnVsbCwgJyRkaXNwbGF5VmFsdWVzLicrZmllbGRQYXRoLCB2YWx1ZSk7XG4gICAgfVxuXG4gICAgbG9hZENvbXB1dGVkVmFsdWVzKGNvbXB1dGVkKXtcbiAgICAgICAgdGhpcy5jb21wdXRlZCA9IFV0aWxzLmNsb25lRGVlcChjb21wdXRlZCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHtVdGlsc30gZnJvbSAnc2QtdXRpbHMnXG5cbmV4cG9ydCBjbGFzcyBPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkcyB7XG5cbiAgICBpZCA9IFV0aWxzLmd1aWQoKTsgLy9pbnRlcm5hbCBpZFxuICAgICRmaWVsZFN0YXR1cz17fTtcblxuICAgICRPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkcyA9IHRydWU7XG5cbiAgICBnZXRGaWVsZFN0YXR1cyhmaWVsZFBhdGgpe1xuICAgICAgICBpZighVXRpbHMuZ2V0KHRoaXMuJGZpZWxkU3RhdHVzLCBmaWVsZFBhdGgsIG51bGwpKXtcbiAgICAgICAgICAgIFV0aWxzLnNldCh0aGlzLiRmaWVsZFN0YXR1cywgZmllbGRQYXRoLCB7XG4gICAgICAgICAgICAgICAgdmFsaWQ6IHtcbiAgICAgICAgICAgICAgICAgICAgc3ludGF4OiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogdHJ1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBVdGlscy5nZXQodGhpcy4kZmllbGRTdGF0dXMsIGZpZWxkUGF0aCk7XG4gICAgfVxuXG4gICAgc2V0U3ludGF4VmFsaWRpdHkoZmllbGRQYXRoLCB2YWxpZCl7XG4gICAgICAgIHZhciBmaWVsZFN0YXR1cyA9IHRoaXMuZ2V0RmllbGRTdGF0dXMoZmllbGRQYXRoKTtcbiAgICAgICAgZmllbGRTdGF0dXMudmFsaWQuc3ludGF4ID0gdmFsaWQ7XG4gICAgfVxuXG4gICAgc2V0VmFsdWVWYWxpZGl0eShmaWVsZFBhdGgsIHZhbGlkKXtcbiAgICAgICAgdmFyIGZpZWxkU3RhdHVzID0gdGhpcy5nZXRGaWVsZFN0YXR1cyhmaWVsZFBhdGgpO1xuICAgICAgICBmaWVsZFN0YXR1cy52YWxpZC52YWx1ZSA9IHZhbGlkO1xuICAgIH1cblxuICAgIGlzRmllbGRWYWxpZChmaWVsZFBhdGgsIHN5bnRheD10cnVlLCB2YWx1ZT10cnVlKXtcbiAgICAgICAgdmFyIGZpZWxkU3RhdHVzID0gdGhpcy5nZXRGaWVsZFN0YXR1cyhmaWVsZFBhdGgpO1xuICAgICAgICBpZihzeW50YXggJiYgdmFsdWUpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZFN0YXR1cy52YWxpZC5zeW50YXggJiYgZmllbGRTdGF0dXMudmFsaWQudmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYoc3ludGF4KSB7XG4gICAgICAgICAgICByZXR1cm4gZmllbGRTdGF0dXMudmFsaWQuc3ludGF4XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZpZWxkU3RhdHVzLnZhbGlkLnZhbHVlO1xuICAgIH1cblxuXG59XG4iLCJleHBvcnQgY2xhc3MgUG9pbnQge1xuICAgIHg7XG4gICAgeTtcbiAgICBjb25zdHJ1Y3Rvcih4LHkpe1xuICAgICAgICBpZih4IGluc3RhbmNlb2YgUG9pbnQpe1xuICAgICAgICAgICAgeT14Lnk7XG4gICAgICAgICAgICB4PXgueFxuICAgICAgICB9ZWxzZSBpZihBcnJheS5pc0FycmF5KHgpKXtcbiAgICAgICAgICAgIHk9eFsxXTtcbiAgICAgICAgICAgIHg9eFswXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLng9eDtcbiAgICAgICAgdGhpcy55PXk7XG4gICAgfVxuXG4gICAgbW92ZVRvKHgseSl7XG4gICAgICAgIGlmKEFycmF5LmlzQXJyYXkoeCkpe1xuICAgICAgICAgICAgeT14WzFdO1xuICAgICAgICAgICAgeD14WzBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMueD14O1xuICAgICAgICB0aGlzLnk9eTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbW92ZShkeCxkeSl7IC8vbW92ZSBieSB2ZWN0b3JcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheShkeCkpe1xuICAgICAgICAgICAgZHk9ZHhbMV07XG4gICAgICAgICAgICBkeD1keFswXTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLngrPWR4O1xuICAgICAgICB0aGlzLnkrPWR5O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbn1cbiIsImltcG9ydCB7UG9pbnR9IGZyb20gXCIuL3BvaW50XCI7XG5pbXBvcnQge1V0aWxzfSBmcm9tIFwic2QtdXRpbHNcIjtcbmltcG9ydCB7T2JqZWN0V2l0aElkQW5kRWRpdGFibGVGaWVsZHN9IGZyb20gXCIuL29iamVjdC13aXRoLWlkLWFuZC1lZGl0YWJsZS1maWVsZHNcIjtcblxuZXhwb3J0IGNsYXNzIFRleHQgZXh0ZW5kcyBPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkc3tcblxuICAgIHZhbHVlPScnO1xuICAgIGxvY2F0aW9uOyAvL1BvaW50XG5cbiAgICBjb25zdHJ1Y3Rvcihsb2NhdGlvbiwgdmFsdWUpe1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLmxvY2F0aW9uPWxvY2F0aW9uO1xuICAgICAgICBpZighbG9jYXRpb24pe1xuICAgICAgICAgICAgdGhpcy5sb2NhdGlvbiA9IG5ldyBQb2ludCgwLDApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYodmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG1vdmVUbyh4LHkpeyAvL21vdmUgdG8gbmV3IGxvY2F0aW9uXG4gICAgICAgIHRoaXMubG9jYXRpb24ubW92ZVRvKHgseSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIG1vdmUoZHgsIGR5KXsgLy9tb3ZlIGJ5IHZlY3RvclxuICAgICAgICB0aGlzLmxvY2F0aW9uLm1vdmUoZHgsIGR5KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxufVxuIiwiaW1wb3J0ICogYXMgZG9tYWluIGZyb20gJy4vZG9tYWluJ1xuZXhwb3J0IHtkb21haW59XG5leHBvcnQgKiBmcm9tICcuL2RhdGEtbW9kZWwnXG5leHBvcnQgKiBmcm9tICcuL3ZhbGlkYXRpb24tcmVzdWx0J1xuIiwiaW1wb3J0IHtVdGlsc30gZnJvbSBcInNkLXV0aWxzXCI7XG5cbmV4cG9ydCBjbGFzcyBWYWxpZGF0aW9uUmVzdWx0e1xuXG5cbiAgICBlcnJvcnMgPSB7fTtcbiAgICB3YXJuaW5ncyA9IHt9O1xuICAgIG9iamVjdElkVG9FcnJvcj17fTtcblxuICAgIGFkZEVycm9yKGVycm9yLCBvYmope1xuICAgICAgICBpZihVdGlscy5pc1N0cmluZyhlcnJvcikpe1xuICAgICAgICAgICAgZXJyb3IgPSB7bmFtZTogZXJyb3J9O1xuICAgICAgICB9XG4gICAgICAgIHZhciBuYW1lID0gZXJyb3IubmFtZTtcbiAgICAgICAgdmFyIGVycm9yc0J5TmFtZSA9IHRoaXMuZXJyb3JzW25hbWVdO1xuICAgICAgICBpZighZXJyb3JzQnlOYW1lKXtcbiAgICAgICAgICAgIGVycm9yc0J5TmFtZT1bXTtcbiAgICAgICAgICAgIHRoaXMuZXJyb3JzW25hbWVdPWVycm9yc0J5TmFtZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb2JqRSA9IHRoaXMub2JqZWN0SWRUb0Vycm9yW29iai5pZF07XG4gICAgICAgIGlmKCFvYmpFKXtcbiAgICAgICAgICAgIG9iakU9W107XG4gICAgICAgICAgICB0aGlzLm9iamVjdElkVG9FcnJvcltvYmouaWRdPSBvYmpFO1xuICAgICAgICB9XG4gICAgICAgIGVycm9yc0J5TmFtZS5wdXNoKG9iaik7XG4gICAgICAgIG9iakUucHVzaChlcnJvcik7XG4gICAgfVxuXG4gICAgYWRkV2FybmluZyhuYW1lLCBvYmope1xuICAgICAgICB2YXIgZSA9IHRoaXMud2FybmluZ3NbbmFtZV07XG4gICAgICAgIGlmKCFlKXtcbiAgICAgICAgICAgIGU9W107XG4gICAgICAgICAgICB0aGlzLndhcm5pbmdzW25hbWVdPWU7XG4gICAgICAgIH1cbiAgICAgICAgZS5wdXNoKG9iailcbiAgICB9XG5cbiAgICBpc1ZhbGlkKCl7XG4gICAgICAgIHJldHVybiBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyh0aGlzLmVycm9ycykubGVuZ3RoID09PSAwXG4gICAgfVxuXG4gICAgc3RhdGljIGNyZWF0ZUZyb21EVE8oZHRvKXtcbiAgICAgICAgdmFyIHYgPSBuZXcgVmFsaWRhdGlvblJlc3VsdCgpO1xuICAgICAgICB2LmVycm9ycyA9IGR0by5lcnJvcnM7XG4gICAgICAgIHYud2FybmluZ3MgPSBkdG8ud2FybmluZ3M7XG4gICAgICAgIHYub2JqZWN0SWRUb0Vycm9yID0gZHRvLm9iamVjdElkVG9FcnJvcjtcbiAgICAgICAgcmV0dXJuIHY7XG4gICAgfVxufVxuIiwiZXhwb3J0ICogZnJvbSAnLi9zcmMvaW5kZXgnXG4iXX0=
