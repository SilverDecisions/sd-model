require=(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

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

  var cache = _getRequireWildcardCache();

  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }

  var newObj = {};

  if (obj != null) {
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
  }

  newObj["default"] = obj;

  if (cache) {
    cache.set(obj, newObj);
  }

  return newObj;
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
}

function _nonIterableSpread() {
  throw new TypeError("Invalid attempt to spread non-iterable instance");
}

function _iterableToArray(iter) {
  if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i];
    }

    return arr2;
  }
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


var DataModel =
/*#__PURE__*/
function () {
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

function _typeof2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Edge = void 0;

var _objectWithComputedValues = require("./object-with-computed-values");

function _typeof(obj) {
  if (typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol") {
    _typeof = function _typeof(obj) {
      return _typeof2(obj);
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : _typeof2(obj);
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

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
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

var Edge =
/*#__PURE__*/
function (_ObjectWithComputedVa) {
  _inherits(Edge, _ObjectWithComputedVa);

  function Edge(parentNode, childNode, name, payoff, probability) {
    var _this;

    _classCallCheck(this, Edge);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Edge).call(this));
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

function _typeof2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ChanceNode = void 0;

var _node = require("./node");

function _typeof(obj) {
  if (typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol") {
    _typeof = function _typeof(obj) {
      return _typeof2(obj);
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : _typeof2(obj);
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
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

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
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

var ChanceNode =
/*#__PURE__*/
function (_Node) {
  _inherits(ChanceNode, _Node);

  function ChanceNode(location) {
    _classCallCheck(this, ChanceNode);

    return _possibleConstructorReturn(this, _getPrototypeOf(ChanceNode).call(this, ChanceNode.$TYPE, location));
  }

  return ChanceNode;
}(_node.Node);

exports.ChanceNode = ChanceNode;
ChanceNode.$TYPE = 'chance';

},{"./node":6}],5:[function(require,module,exports){
"use strict";

function _typeof2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DecisionNode = void 0;

var _node = require("./node");

function _typeof(obj) {
  if (typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol") {
    _typeof = function _typeof(obj) {
      return _typeof2(obj);
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : _typeof2(obj);
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
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

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
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

var DecisionNode =
/*#__PURE__*/
function (_Node) {
  _inherits(DecisionNode, _Node);

  function DecisionNode(location) {
    _classCallCheck(this, DecisionNode);

    return _possibleConstructorReturn(this, _getPrototypeOf(DecisionNode).call(this, DecisionNode.$TYPE, location));
  }

  return DecisionNode;
}(_node.Node);

exports.DecisionNode = DecisionNode;
DecisionNode.$TYPE = 'decision';

},{"./node":6}],6:[function(require,module,exports){
"use strict";

function _typeof2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Node = void 0;

var _point = require("../point");

var _objectWithComputedValues = require("../object-with-computed-values");

function _typeof(obj) {
  if (typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol") {
    _typeof = function _typeof(obj) {
      return _typeof2(obj);
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : _typeof2(obj);
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

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
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

var Node =
/*#__PURE__*/
function (_ObjectWithComputedVa) {
  _inherits(Node, _ObjectWithComputedVa); //Point
  // is code changed without reevaluation?
  //code evaluation errors
  // is node folded along with its subtree


  function Node(type, location) {
    var _this;

    _classCallCheck(this, Node);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Node).call(this));
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

function _typeof2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TerminalNode = void 0;

var _node = require("./node");

function _typeof(obj) {
  if (typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol") {
    _typeof = function _typeof(obj) {
      return _typeof2(obj);
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : _typeof2(obj);
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
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

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
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

var TerminalNode =
/*#__PURE__*/
function (_Node) {
  _inherits(TerminalNode, _Node);

  function TerminalNode(location) {
    _classCallCheck(this, TerminalNode);

    return _possibleConstructorReturn(this, _getPrototypeOf(TerminalNode).call(this, TerminalNode.$TYPE, location));
  }

  return TerminalNode;
}(_node.Node);

exports.TerminalNode = TerminalNode;
TerminalNode.$TYPE = 'terminal';

},{"./node":6}],8:[function(require,module,exports){
"use strict";

function _typeof2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ObjectWithComputedValues = void 0;

var _sdUtils = require("sd-utils");

var _objectWithIdAndEditableFields = require("./object-with-id-and-editable-fields");

function _typeof(obj) {
  if (typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol") {
    _typeof = function _typeof(obj) {
      return _typeof2(obj);
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : _typeof2(obj);
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

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
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

var ObjectWithComputedValues =
/*#__PURE__*/
function (_ObjectWithIdAndEdita) {
  _inherits(ObjectWithComputedValues, _ObjectWithIdAndEdita);

  function ObjectWithComputedValues() {
    var _getPrototypeOf2;

    var _temp, _this;

    _classCallCheck(this, ObjectWithComputedValues);

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _possibleConstructorReturn(_this, (_temp = _this = _possibleConstructorReturn(this, (_getPrototypeOf2 = _getPrototypeOf(ObjectWithComputedValues)).call.apply(_getPrototypeOf2, [this].concat(args))), _this.computed = {}, _temp));
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

var ObjectWithIdAndEditableFields =
/*#__PURE__*/
function () {
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

var Point =
/*#__PURE__*/
function () {
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

function _typeof2(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof2 = function _typeof2(obj) { return typeof obj; }; } else { _typeof2 = function _typeof2(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof2(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Text = void 0;

var _point = require("./point");

var _sdUtils = require("sd-utils");

var _objectWithIdAndEditableFields = require("./object-with-id-and-editable-fields");

function _typeof(obj) {
  if (typeof Symbol === "function" && _typeof2(Symbol.iterator) === "symbol") {
    _typeof = function _typeof(obj) {
      return _typeof2(obj);
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : _typeof2(obj);
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

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
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

var Text =
/*#__PURE__*/
function (_ObjectWithIdAndEdita) {
  _inherits(Text, _ObjectWithIdAndEdita); //Point


  function Text(location, value) {
    var _this;

    _classCallCheck(this, Text);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(Text).call(this));
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

  var cache = _getRequireWildcardCache();

  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }

  var newObj = {};

  if (obj != null) {
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

var ValidationResult =
/*#__PURE__*/
function () {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZGF0YS1tb2RlbC5qcyIsInNyYy9kb21haW4vZWRnZS5qcyIsInNyYy9kb21haW4vaW5kZXguanMiLCJzcmMvZG9tYWluL25vZGUvY2hhbmNlLW5vZGUuanMiLCJzcmMvZG9tYWluL25vZGUvZGVjaXNpb24tbm9kZS5qcyIsInNyYy9kb21haW4vbm9kZS9ub2RlLmpzIiwic3JjL2RvbWFpbi9ub2RlL3Rlcm1pbmFsLW5vZGUuanMiLCJzcmMvZG9tYWluL29iamVjdC13aXRoLWNvbXB1dGVkLXZhbHVlcy5qcyIsInNyYy9kb21haW4vb2JqZWN0LXdpdGgtaWQtYW5kLWVkaXRhYmxlLWZpZWxkcy5qcyIsInNyYy9kb21haW4vcG9pbnQuanMiLCJzcmMvZG9tYWluL3RleHQuanMiLCJzcmMvaW5kZXguanMiLCJzcmMvdmFsaWRhdGlvbi1yZXN1bHQuanMiLCJpbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7Ozs7QUNBQSxJQUFBLFFBQUEsR0FBQSxPQUFBLENBQUEsVUFBQSxDQUFBOztBQUNBLElBQUEsTUFBQSxHQUFBLHVCQUFBLENBQUEsT0FBQSxDQUFBLFVBQUEsQ0FBQSxDQUFBOztBQUNBLElBQUEsaUJBQUEsR0FBQSxPQUFBLENBQUEscUJBQUEsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUVBOzs7OztJQUdhLFM7OztBQUtHO0FBT1U7QUFDWjtBQUNTO0FBQ0M7QUFLcEI7QUFhQSxXQUFBLFNBQUEsQ0FBQSxJQUFBLEVBQWtCO0FBQUEsSUFBQSxlQUFBLENBQUEsSUFBQSxFQUFBLFNBQUEsQ0FBQTs7QUFBQSxTQS9CbEIsS0ErQmtCLEdBL0JWLEVBK0JVO0FBQUEsU0E5QmxCLEtBOEJrQixHQTlCVixFQThCVTtB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QUFBLElBQUEsR0FBQSxFQUFBLFNBQUEsR0FBQSxHQUFBO0FBQUEsYUFBQSxLQUFBLENBQUEsR0FBQSxDQUFBO0FBQUE7QUFBQSxHQUFBO0FBQUEsQ0FBQTs7QUFDQSxJQUFBLGFBQUEsR0FBQSxPQUFBLENBQUEsc0JBQUEsQ0FBQTs7QUFBQSxNQUFBLENBQUEsSUFBQSxDQUFBLGFBQUEsRUFBQSxPQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFBQSxNQUFBLEdBQUEsS0FBQSxTQUFBLElBQUEsR0FBQSxLQUFBLFlBQUEsRUFBQTtBQUFBLEVBQUEsTUFBQSxDQUFBLGNBQUEsQ0FBQSxPQUFBLEVBQUEsR0FBQSxFQUFBO0FBQUEsSUFBQSxVQUFBLEVBQUEsSUFBQTtBQUFBLElBQUEsR0FBQSxFQUFBLFNBQUEsR0FBQSxHQUFBO0FBQUEsYUFBQSxhQUFBLENBQUEsR0FBQSxDQUFBO0FBQUE7QUFBQSxHQUFBO0FBQUEsQ0FBQTs7QUFDQSxJQUFBLFdBQUEsR0FBQSxPQUFBLENBQUEsb0JBQUEsQ0FBQTs7QUFBQSxNQUFBLENBQUEsSUFBQSxDQUFBLFdBQUEsRUFBQSxPQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFBQSxNQUFBLEdBQUEsS0FBQSxTQUFBLElBQUEsR0FBQSxLQUFBLFlBQUEsRUFBQTtBQUFBLEVBQUEsTUFBQSxDQUFBLGNBQUEsQ0FBQSxPQUFBLEVBQUEsR0FBQSxFQUFBO0FBQUEsSUFBQSxVQUFBLEVBQUEsSUFBQTtBQUFBLElBQUEsR0FBQSxFQUFBLFNBQUEsR0FBQSxHQUFBO0FBQUEsYUFBQSxXQUFBLENBQUEsR0FBQSxDQUFBO0FBQUE7QUFBQSxHQUFBO0FBQUEsQ0FBQTs7QUFDQSxJQUFBLGFBQUEsR0FBQSxPQUFBLENBQUEsc0JBQUEsQ0FBQTs7QUFBQSxNQUFBLENBQUEsSUFBQSxDQUFBLGFBQUEsRUFBQSxPQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFBQSxNQUFBLEdBQUEsS0FBQSxTQUFBLElBQUEsR0FBQSxLQUFBLFlBQUEsRUFBQTtBQUFBLEVBQUEsTUFBQSxDQUFBLGNBQUEsQ0FBQSxPQUFBLEVBQUEsR0FBQSxFQUFBO0FBQUEsSUFBQSxVQUFBLEVBQUEsSUFBQTtBQUFBLElBQUEsR0FBQSxFQUFBLFNBQUEsR0FBQSxHQUFBO0FBQUEsYUFBQSxhQUFBLENBQUEsR0FBQSxDQUFBO0FBQUE7QUFBQSxHQUFBO0FBQUEsQ0FBQTs7QUFDQSxJQUFBLEtBQUEsR0FBQSxPQUFBLENBQUEsUUFBQSxDQUFBOztBQUFBLE1BQUEsQ0FBQSxJQUFBLENBQUEsS0FBQSxFQUFBLE9BQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUFBLE1BQUEsR0FBQSxLQUFBLFNBQUEsSUFBQSxHQUFBLEtBQUEsWUFBQSxFQUFBO0FBQUEsRUFBQSxNQUFBLENBQUEsY0FBQSxDQUFBLE9BQUEsRUFBQSxHQUFBLEVBQUE7QUFBQSxJQUFBLFVBQUEsRUFBQSxJQUFBO0FBQUEsSUFBQSxHQUFBLEVBQUEsU0FBQSxHQUFBLEdBQUE7QUFBQSxhQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUE7QUFBQTtBQUFBLEdBQUE7QUFBQSxDQUFBOztBQUNBLElBQUEsTUFBQSxHQUFBLE9BQUEsQ0FBQSxTQUFBLENBQUE7O0FBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsT0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQUEsTUFBQSxHQUFBLEtBQUEsU0FBQSxJQUFBLEdBQUEsS0FBQSxZQUFBLEVBQUE7QUFBQSxFQUFBLE1BQUEsQ0FBQSxjQUFBLENBQUEsT0FBQSxFQUFBLEdBQUEsRUFBQTtBQUFBLElBQUEsVUFBQSxFQUFBLElBQUE7QUFBQSxJQUFBLEdBQUEsRUFBQSxTQUFBLEdBQUEsR0FBQTtBQUFBLGFBQUEsTUFBQSxDQUFBLEdBQUEsQ0FBQTtBQUFBO0FBQUEsR0FBQTtBQUFBLENBQUE7O0FBQ0EsSUFBQSxLQUFBLEdBQUEsT0FBQSxDQUFBLFFBQUEsQ0FBQTs7QUFBQSxNQUFBLENBQUEsSUFBQSxDQUFBLEtBQUEsRUFBQSxPQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFBQSxNQUFBLEdBQUEsS0FBQSxT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O0FBRUEsSUFBQSxVQUFBLEdBQUEsT0FBQSxDQUFBLGNBQUEsQ0FBQTs7QUFBQSxNQUFBLENBQUEsSUFBQSxDQUFBLFVBQUEsRUFBQSxPQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFBQSxNQUFBLEdBQUEsS0FBQSxTQUFBLElBQUEsR0FBQSxLQUFBLFlBQUEsRUFBQTtBQUFBLE1BQUEsTUFBQSxDQUFBLFNBQUEsQ0FBQSxjQUFBLENBQUEsSUFBQSxDQUFBLFlBQUEsRUFBQSxHQUFBLENBQUEsRUFBQTtBQUFBLEVBQUEsTUFBQSxDQUFBLGNBQUEsQ0FBQSxPQUFBLEVBQUEsR0FBQSxFQUFBO0FBQUEsSUFBQSxVQUFBLEVBQUEsSUFBQTtBQUFBLElBQUEsR0FBQSxFQUFBLFNBQUEsR0FBQSxHQUFBO0FBQUEsYUFBQSxVQUFBLENBQUEsR0FBQSxDQUFBO0FBQUE7QUFBQSxHQUFBO0FBQUEsQ0FBQTs7QUFDQSxJQUFBLGlCQUFBLEdBQUEsT0FBQSxDQUFBLHFCQUFBLENBQUE7O0FBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxpQkFBQSxFQUFBLE9BQUEsQ0FBQSxVQUFBLEdBQUEsRUFBQTtBQUFBLE1BQUEsR0FBQSxLQUFBLFNBQUEsSUFBQSxHQUFBLEtBQUEsWUFBQSxFQUFBO0FBQUEsTUFBQSxNQUFBLENBQUEsU0FBQSxDQUFBLGNBQUEsQ0FBQSxJQUFBLENBQUEsWUFBQSxFQUFBLEdBQUEsQ0FBQSxFQUFBO0FBQUEsRUFBQSxNQUFBLENBQUEsY0FBQSxDQUFBLE9BQUEsRUFBQSxHQUFBLEVBQUE7QUFBQSxJQUFBLFVBQUEsRUFBQSxJQUFBO0FBQUEsSUFBQSxHQUFBLEVBQUEsU0FBQSxHQUFBLEdBQUE7QUFBQSxhQUFBLGlCQUFBLENBQUEsR0FBQSxDQUFBO0FBQUE7QUFBQSxHQUFBO0FBQUEsQ0FBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUNIQSxJQUFBLFFBQUEsR0FBQSxPQUFBLENBQUEsVUFBQSxDQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUFFYSxnQjs7Ozs7O1NBR1QsTSxHQUFTLEU7U0FDVCxRLEdBQVcsRTtTQUNYLGUsR0FBZ0IsRTs7Ozs7NkJBRVAsSyxFQUFPLEcsRUFBSTtBQUNoQixVQUFHLFFBQUEsQ0FBQSxLQUFBLENBQUEsUUFBQSxDQUFILEtBQUcsQ0FBSCxFQUF5QjtBQUNyQixRQUFBLEtBQUssR0FBRztBQUFDLFVBQUEsSUFBSSxFQUFFO0FBQVAsU0FBUjtBQUNIOztBQUNELFVBQUksSUFBSSxHQUFHLEtBQUssQ0FBaEIsSUFBQTtBQUNBLFVBQUksWUFBWSxHQUFHLEtBQUEsTUFBQSxDQUFuQixJQUFtQixDQUFuQjs7QUFDQSxVQUFHLENBQUgsWUFBQSxFQUFpQjtBQUNiLFFBQUEsWUFBWSxHQUFaLEVBQUE7QUFDQSxhQUFBLE1BQUEsQ0FBQSxJQUFBLElBQUEsWUFBQTtBQUNIOztBQUNELFVBQUksSUFBSSxHQUFHLEtBQUEsZUFBQSxDQUFxQixHQUFHLENBQW5DLEVBQVcsQ0FBWDs7QUFDQSxVQUFHLENBQUgsSUFBQSxFQUFTO0FBQ0wsUUFBQSxJQUFJLEdBQUosRUFBQTtBQUNBLGFBQUEsZUFBQSxDQUFxQixHQUFHLENBQXhCLEVBQUEsSUFBQSxJQUFBO0FBQ0g7O0FBQ0QsTUFBQSxZQUFZLENBQVosSUFBQSxDQUFBLEdBQUE7QUFDQSxNQUFBLElBQUksQ0FBSixJQUFBLENBQUEsS0FBQTtBQUNIOzs7K0JBRVUsSSxFQUFNLEcsRUFBSTtBQUNqQixVQUFJLENBQUMsR0FBRyxLQUFBLFFBQUEsQ0FBUixJQUFRLENBQVI7O0FBQ0EsVUFBRyxDQUFILENBQUEsRUFBTTtBQUNGLFFBQUEsQ0FBQyxHQUFELEVBQUE7QUFDQSxhQUFBLFFBQUEsQ0FBQSxJQUFBLElBQUEsQ0FBQTtBQUNIOztBQUNELE1BQUEsQ0FBQyxDQUFELElBQUEsQ0FBQSxHQUFBO0FBQ0g7Ozs4QkFFUTtBQUNMLGFBQU8sTUFBTSxDQUFOLG1CQUFBLENBQTJCLEtBQTNCLE1BQUEsRUFBQSxNQUFBLEtBQVAsQ0FBQTtBQUNIOzs7a0NBRW9CLEcsRUFBSTtBQUNyQixVQUFJLENBQUMsR0FBRyxJQUFSLGdCQUFRLEVBQVI7QUFDQSxNQUFBLENBQUMsQ0FBRCxNQUFBLEdBQVcsR0FBRyxDQUFkLE1BQUE7QUFDQSxNQUFBLENBQUMsQ0FBRCxRQUFBLEdBQWEsR0FBRyxDQUFoQixRQUFBO0FBQ0EsTUFBQSxDQUFDLENBQUQsZUFBQSxHQUFvQixHQUFHLENBQXZCLGVBQUE7QUFDQSxhQUFBLENBQUE7QUFDSDs7Ozs7Ozs7Ozs7Ozs7O0FDL0NMLElBQUEsTUFBQSxHQUFBLE9BQUEsQ0FBQSxhQUFBLENBQUE7O0FBQUEsTUFBQSxDQUFBLElBQUEsQ0FBQSxNQUFBLEVBQUEsT0FBQSxDQUFBLFVBQUEsR0FBQSxFQUFBO0FBQUEsTUFBQSxHQUFBLEtBQUEsU0FBQSxJQUFBLEdBQUEsS0FBQSxZQUFBLEVBQUE7QUFBQSxFQUFBLE1BQUEsQ0FBQSxjQUFBLENBQUEsT0FBQSxFQUFBLEdBQUEsRUFBQTtBQUFBLElBQUEsVUFBQSxFQUFBLElBQUE7QUFBQSxJQUFBLEdBQUEsRUFBQSxTQUFBLEdBQUEsR0FBQTtBQUFBLGFBQUEsTUFBQSxDQUFBLEdBQUEsQ0FBQTtBQUFBO0FBQUEsR0FBQTtBQUFBLENBQUEiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCJpbXBvcnQge1V0aWxzLCBsb2d9IGZyb20gXCJzZC11dGlsc1wiO1xuaW1wb3J0ICogYXMgZG9tYWluIGZyb20gXCIuL2RvbWFpblwiO1xuaW1wb3J0IHtWYWxpZGF0aW9uUmVzdWx0fSBmcm9tIFwiLi92YWxpZGF0aW9uLXJlc3VsdFwiO1xuXG4vKlxuICogRGF0YSBtb2RlbCBtYW5hZ2VyXG4gKiAqL1xuZXhwb3J0IGNsYXNzIERhdGFNb2RlbCB7XG5cbiAgICBub2RlcyA9IFtdO1xuICAgIGVkZ2VzID0gW107XG5cbiAgICB0ZXh0cyA9IFtdOyAvL2Zsb2F0aW5nIHRleHRzXG4gICAgcGF5b2ZmTmFtZXMgPSBbXTtcbiAgICBkZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCA9IDE7XG4gICAgd2VpZ2h0TG93ZXJCb3VuZCA9IDA7XG4gICAgd2VpZ2h0VXBwZXJCb3VuZCA9IEluZmluaXR5O1xuXG5cbiAgICBleHByZXNzaW9uU2NvcGUgPSB7fTsgLy9nbG9iYWwgZXhwcmVzc2lvbiBzY29wZVxuICAgIGNvZGUgPSBcIlwiOy8vZ2xvYmFsIGV4cHJlc3Npb24gY29kZVxuICAgICRjb2RlRXJyb3IgPSBudWxsOyAvL2NvZGUgZXZhbHVhdGlvbiBlcnJvcnNcbiAgICAkY29kZURpcnR5ID0gZmFsc2U7IC8vIGlzIGNvZGUgY2hhbmdlZCB3aXRob3V0IHJlZXZhbHVhdGlvbj9cbiAgICAkdmVyc2lvbj0xO1xuXG4gICAgdmFsaWRhdGlvblJlc3VsdHMgPSBbXTtcblxuICAgIC8vIHVuZG8gLyByZWRvXG4gICAgbWF4U3RhY2tTaXplID0gMjA7XG4gICAgdW5kb1N0YWNrID0gW107XG4gICAgcmVkb1N0YWNrID0gW107XG4gICAgdW5kb1JlZG9TdGF0ZUNoYW5nZWRDYWxsYmFjayA9IG51bGw7XG4gICAgbm9kZUFkZGVkQ2FsbGJhY2sgPSBudWxsO1xuICAgIG5vZGVSZW1vdmVkQ2FsbGJhY2sgPSBudWxsO1xuXG4gICAgdGV4dEFkZGVkQ2FsbGJhY2sgPSBudWxsO1xuICAgIHRleHRSZW1vdmVkQ2FsbGJhY2sgPSBudWxsO1xuXG4gICAgY2FsbGJhY2tzRGlzYWJsZWQgPSBmYWxzZTtcblxuICAgIGNvbnN0cnVjdG9yKGRhdGEpIHtcbiAgICAgICAgaWYoZGF0YSl7XG4gICAgICAgICAgICB0aGlzLmxvYWQoZGF0YSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRKc29uUmVwbGFjZXIoZmlsdGVyTG9jYXRpb249ZmFsc2UsIGZpbHRlckNvbXB1dGVkPWZhbHNlLCByZXBsYWNlciwgZmlsdGVyUHJpdmF0ZSA9dHJ1ZSl7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiAoaywgdikge1xuXG4gICAgICAgICAgICBpZiAoKGZpbHRlclByaXZhdGUgJiYgVXRpbHMuc3RhcnRzV2l0aChrLCAnJCcpKSB8fCBrID09ICdwYXJlbnROb2RlJykge1xuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmlsdGVyTG9jYXRpb24gJiYgayA9PSAnbG9jYXRpb24nKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChmaWx0ZXJDb21wdXRlZCAmJiBrID09ICdjb21wdXRlZCcpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAocmVwbGFjZXIpe1xuICAgICAgICAgICAgICAgIHJldHVybiByZXBsYWNlcihrLCB2KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHY7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBzZXJpYWxpemUoc3RyaW5naWZ5PXRydWUsIGZpbHRlckxvY2F0aW9uPWZhbHNlLCBmaWx0ZXJDb21wdXRlZD1mYWxzZSwgcmVwbGFjZXIsIGZpbHRlclByaXZhdGUgPXRydWUpe1xuICAgICAgICB2YXIgZGF0YSA9ICB7XG4gICAgICAgICAgICBjb2RlOiB0aGlzLmNvZGUsXG4gICAgICAgICAgICBleHByZXNzaW9uU2NvcGU6IHRoaXMuZXhwcmVzc2lvblNjb3BlLFxuICAgICAgICAgICAgdHJlZXM6IHRoaXMuZ2V0Um9vdHMoKSxcbiAgICAgICAgICAgIHRleHRzOiB0aGlzLnRleHRzLFxuICAgICAgICAgICAgcGF5b2ZmTmFtZXM6IHRoaXMucGF5b2ZmTmFtZXMuc2xpY2UoKSxcbiAgICAgICAgICAgIGRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0OiB0aGlzLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0LFxuICAgICAgICAgICAgd2VpZ2h0TG93ZXJCb3VuZDogdGhpcy53ZWlnaHRMb3dlckJvdW5kLFxuICAgICAgICAgICAgd2VpZ2h0VXBwZXJCb3VuZDogdGhpcy53ZWlnaHRVcHBlckJvdW5kXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYoIXN0cmluZ2lmeSl7XG4gICAgICAgICAgICByZXR1cm4gZGF0YTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBVdGlscy5zdHJpbmdpZnkoZGF0YSwgdGhpcy5nZXRKc29uUmVwbGFjZXIoZmlsdGVyTG9jYXRpb24sIGZpbHRlckNvbXB1dGVkLCByZXBsYWNlciwgZmlsdGVyUHJpdmF0ZSksIFtdKTtcbiAgICB9XG5cblxuICAgIC8qTG9hZHMgc2VyaWFsaXplZCBkYXRhKi9cbiAgICBsb2FkKGRhdGEpIHtcbiAgICAgICAgLy9yb290cywgdGV4dHMsIGNvZGUsIGV4cHJlc3Npb25TY29wZVxuICAgICAgICB2YXIgY2FsbGJhY2tzRGlzYWJsZWQgPSB0aGlzLmNhbGxiYWNrc0Rpc2FibGVkO1xuICAgICAgICB0aGlzLmNhbGxiYWNrc0Rpc2FibGVkID0gdHJ1ZTtcblxuICAgICAgICB0aGlzLmNsZWFyKCk7XG5cblxuICAgICAgICBkYXRhLnRyZWVzLmZvckVhY2gobm9kZURhdGE9PiB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMuY3JlYXRlTm9kZUZyb21EYXRhKG5vZGVEYXRhKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKGRhdGEudGV4dHMpIHtcbiAgICAgICAgICAgIGRhdGEudGV4dHMuZm9yRWFjaCh0ZXh0RGF0YT0+IHtcbiAgICAgICAgICAgICAgICB2YXIgbG9jYXRpb24gPSBuZXcgZG9tYWluLlBvaW50KHRleHREYXRhLmxvY2F0aW9uLngsIHRleHREYXRhLmxvY2F0aW9uLnkpO1xuICAgICAgICAgICAgICAgIHZhciB0ZXh0ID0gbmV3IGRvbWFpbi5UZXh0KGxvY2F0aW9uLCB0ZXh0RGF0YS52YWx1ZSk7XG4gICAgICAgICAgICAgICAgdGhpcy50ZXh0cy5wdXNoKHRleHQpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY2xlYXJFeHByZXNzaW9uU2NvcGUoKTtcbiAgICAgICAgdGhpcy5jb2RlID0gZGF0YS5jb2RlIHx8ICcnO1xuXG4gICAgICAgIGlmIChkYXRhLmV4cHJlc3Npb25TY29wZSkge1xuICAgICAgICAgICAgVXRpbHMuZXh0ZW5kKHRoaXMuZXhwcmVzc2lvblNjb3BlLCBkYXRhLmV4cHJlc3Npb25TY29wZSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGF0YS5wYXlvZmZOYW1lcyAhPT0gdW5kZWZpbmVkICYmIGRhdGEucGF5b2ZmTmFtZXMgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMucGF5b2ZmTmFtZXMgPSBkYXRhLnBheW9mZk5hbWVzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRhdGEuZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQgIT09IHVuZGVmaW5lZCAmJiBkYXRhLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0ICE9PSBudWxsKSB7XG4gICAgICAgICAgICB0aGlzLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0ID0gZGF0YS5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLndlaWdodExvd2VyQm91bmQgIT09IHVuZGVmaW5lZCAmJiBkYXRhLndlaWdodExvd2VyQm91bmQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMud2VpZ2h0TG93ZXJCb3VuZCA9IGRhdGEud2VpZ2h0TG93ZXJCb3VuZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkYXRhLndlaWdodFVwcGVyQm91bmQgIT09IHVuZGVmaW5lZCAmJiBkYXRhLndlaWdodFVwcGVyQm91bmQgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHRoaXMud2VpZ2h0VXBwZXJCb3VuZCA9IGRhdGEud2VpZ2h0VXBwZXJCb3VuZDtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgdGhpcy5jYWxsYmFja3NEaXNhYmxlZCA9IGNhbGxiYWNrc0Rpc2FibGVkO1xuICAgIH1cblxuICAgIGdldERUTyhmaWx0ZXJMb2NhdGlvbj1mYWxzZSwgZmlsdGVyQ29tcHV0ZWQ9ZmFsc2UsIGZpbHRlclByaXZhdGUgPWZhbHNlKXtcbiAgICAgICAgdmFyIGR0byA9IHtcbiAgICAgICAgICAgIHNlcmlhbGl6ZWREYXRhOiB0aGlzLnNlcmlhbGl6ZSh0cnVlLCBmaWx0ZXJMb2NhdGlvbiwgZmlsdGVyQ29tcHV0ZWQsIG51bGwsIGZpbHRlclByaXZhdGUpLFxuICAgICAgICAgICAgJGNvZGVFcnJvcjogdGhpcy4kY29kZUVycm9yLFxuICAgICAgICAgICAgJGNvZGVEaXJ0eTogdGhpcy4kY29kZURpcnR5LFxuICAgICAgICAgICAgdmFsaWRhdGlvblJlc3VsdHM6IHRoaXMudmFsaWRhdGlvblJlc3VsdHMuc2xpY2UoKVxuXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBkdG9cbiAgICB9XG5cbiAgICBsb2FkRnJvbURUTyhkdG8sIGRhdGFSZXZpdmVyKXtcbiAgICAgICAgdGhpcy5sb2FkKEpTT04ucGFyc2UoZHRvLnNlcmlhbGl6ZWREYXRhLCBkYXRhUmV2aXZlcikpO1xuICAgICAgICB0aGlzLiRjb2RlRXJyb3IgPSBkdG8uJGNvZGVFcnJvcjtcbiAgICAgICAgdGhpcy4kY29kZURpcnR5ID0gZHRvLiRjb2RlRGlydHk7XG4gICAgICAgIHRoaXMudmFsaWRhdGlvblJlc3VsdHMubGVuZ3RoPTA7XG4gICAgICAgIGR0by52YWxpZGF0aW9uUmVzdWx0cy5mb3JFYWNoKHY9PntcbiAgICAgICAgICAgIHRoaXMudmFsaWRhdGlvblJlc3VsdHMucHVzaChWYWxpZGF0aW9uUmVzdWx0LmNyZWF0ZUZyb21EVE8odikpXG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgLypUaGlzIG1ldGhvZCB1cGRhdGVzIG9ubHkgY29tcHV0YXRpb24gcmVzdWx0cy92YWxpZGF0aW9uKi9cbiAgICB1cGRhdGVGcm9tKGRhdGFNb2RlbCl7XG4gICAgICAgIGlmKHRoaXMuJHZlcnNpb24+ZGF0YU1vZGVsLiR2ZXJzaW9uKXtcbiAgICAgICAgICAgIGxvZy53YXJuKFwiRGF0YU1vZGVsLnVwZGF0ZUZyb206IHZlcnNpb24gb2YgY3VycmVudCBtb2RlbCBncmVhdGVyIHRoYW4gdXBkYXRlXCIpXG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGJ5SWQgPSB7fVxuICAgICAgICBkYXRhTW9kZWwubm9kZXMuZm9yRWFjaChuPT57XG4gICAgICAgICAgICBieUlkW24uaWRdID0gbjtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMubm9kZXMuZm9yRWFjaCgobixpKT0+e1xuICAgICAgICAgICAgaWYoYnlJZFtuLmlkXSl7XG4gICAgICAgICAgICAgICAgbi5sb2FkQ29tcHV0ZWRWYWx1ZXMoYnlJZFtuLmlkXS5jb21wdXRlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBkYXRhTW9kZWwuZWRnZXMuZm9yRWFjaChlPT57XG4gICAgICAgICAgICBieUlkW2UuaWRdID0gZTtcbiAgICAgICAgfSk7XG4gICAgICAgIHRoaXMuZWRnZXMuZm9yRWFjaCgoZSxpKT0+e1xuICAgICAgICAgICAgaWYoYnlJZFtlLmlkXSl7XG4gICAgICAgICAgICAgICAgZS5sb2FkQ29tcHV0ZWRWYWx1ZXMoYnlJZFtlLmlkXS5jb21wdXRlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmV4cHJlc3Npb25TY29wZSA9IGRhdGFNb2RlbC5leHByZXNzaW9uU2NvcGU7XG4gICAgICAgIHRoaXMuJGNvZGVFcnJvciA9IGRhdGFNb2RlbC4kY29kZUVycm9yO1xuICAgICAgICB0aGlzLiRjb2RlRGlydHkgPSBkYXRhTW9kZWwuJGNvZGVEaXJ0eTtcbiAgICAgICAgdGhpcy52YWxpZGF0aW9uUmVzdWx0cyAgPSBkYXRhTW9kZWwudmFsaWRhdGlvblJlc3VsdHM7XG4gICAgfVxuXG4gICAgZ2V0R2xvYmFsVmFyaWFibGVOYW1lcyhmaWx0ZXJGdW5jdGlvbiA9IHRydWUpe1xuICAgICAgICB2YXIgcmVzID0gW107XG4gICAgICAgIFV0aWxzLmZvck93bih0aGlzLmV4cHJlc3Npb25TY29wZSwgKHZhbHVlLCBrZXkpPT57XG4gICAgICAgICAgICBpZihmaWx0ZXJGdW5jdGlvbiAmJiBVdGlscy5pc0Z1bmN0aW9uKHZhbHVlKSl7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVzLnB1c2goa2V5KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuXG4gICAgLypjcmVhdGUgbm9kZSBmcm9tIHNlcmlhbGl6ZWQgZGF0YSovXG4gICAgY3JlYXRlTm9kZUZyb21EYXRhKGRhdGEsIHBhcmVudCkge1xuICAgICAgICB2YXIgbm9kZSwgbG9jYXRpb247XG5cbiAgICAgICAgaWYoZGF0YS5sb2NhdGlvbil7XG4gICAgICAgICAgICBsb2NhdGlvbiA9IG5ldyBkb21haW4uUG9pbnQoZGF0YS5sb2NhdGlvbi54LCBkYXRhLmxvY2F0aW9uLnkpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGxvY2F0aW9uID0gbmV3IGRvbWFpbi5Qb2ludCgwLDApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRvbWFpbi5EZWNpc2lvbk5vZGUuJFRZUEUgPT0gZGF0YS50eXBlKSB7XG4gICAgICAgICAgICBub2RlID0gbmV3IGRvbWFpbi5EZWNpc2lvbk5vZGUobG9jYXRpb24pO1xuICAgICAgICB9IGVsc2UgaWYgKGRvbWFpbi5DaGFuY2VOb2RlLiRUWVBFID09IGRhdGEudHlwZSkge1xuICAgICAgICAgICAgbm9kZSA9IG5ldyBkb21haW4uQ2hhbmNlTm9kZShsb2NhdGlvbik7XG4gICAgICAgIH0gZWxzZSBpZiAoZG9tYWluLlRlcm1pbmFsTm9kZS4kVFlQRSA9PSBkYXRhLnR5cGUpIHtcbiAgICAgICAgICAgIG5vZGUgPSBuZXcgZG9tYWluLlRlcm1pbmFsTm9kZShsb2NhdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgaWYoZGF0YS5pZCl7XG4gICAgICAgICAgICBub2RlLmlkID0gZGF0YS5pZDtcbiAgICAgICAgfVxuICAgICAgICBpZihkYXRhLiRmaWVsZFN0YXR1cyl7XG4gICAgICAgICAgICBub2RlLiRmaWVsZFN0YXR1cyA9IGRhdGEuJGZpZWxkU3RhdHVzO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUubmFtZSA9IGRhdGEubmFtZTtcblxuICAgICAgICBpZihkYXRhLmNvZGUpe1xuICAgICAgICAgICAgbm9kZS5jb2RlID0gZGF0YS5jb2RlO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkYXRhLmV4cHJlc3Npb25TY29wZSkge1xuICAgICAgICAgICAgbm9kZS5leHByZXNzaW9uU2NvcGUgPSBkYXRhLmV4cHJlc3Npb25TY29wZVxuICAgICAgICB9XG4gICAgICAgIGlmKGRhdGEuY29tcHV0ZWQpe1xuICAgICAgICAgICAgbm9kZS5sb2FkQ29tcHV0ZWRWYWx1ZXMoZGF0YS5jb21wdXRlZCk7XG4gICAgICAgIH1cblxuICAgICAgICBub2RlLmZvbGRlZCA9ICEhZGF0YS5mb2xkZWQ7XG5cbiAgICAgICAgdmFyIGVkZ2VPck5vZGUgPSB0aGlzLmFkZE5vZGUobm9kZSwgcGFyZW50KTtcbiAgICAgICAgZGF0YS5jaGlsZEVkZ2VzLmZvckVhY2goZWQ9PiB7XG4gICAgICAgICAgICB2YXIgZWRnZSA9IHRoaXMuY3JlYXRlTm9kZUZyb21EYXRhKGVkLmNoaWxkTm9kZSwgbm9kZSk7XG4gICAgICAgICAgICBpZihVdGlscy5pc0FycmF5KGVkLnBheW9mZikpe1xuICAgICAgICAgICAgICAgIGVkZ2UucGF5b2ZmID0gZWQucGF5b2ZmO1xuICAgICAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICAgICAgZWRnZS5wYXlvZmYgPSBbZWQucGF5b2ZmLCAwXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWRnZS5wcm9iYWJpbGl0eSA9IGVkLnByb2JhYmlsaXR5O1xuICAgICAgICAgICAgZWRnZS5uYW1lID0gZWQubmFtZTtcbiAgICAgICAgICAgIGlmKGVkLmNvbXB1dGVkKXtcbiAgICAgICAgICAgICAgICBlZGdlLmxvYWRDb21wdXRlZFZhbHVlcyhlZC5jb21wdXRlZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZihlZC5pZCl7XG4gICAgICAgICAgICAgICAgZWRnZS5pZCA9IGVkLmlkO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoZWQuJGZpZWxkU3RhdHVzKXtcbiAgICAgICAgICAgICAgICBlZGdlLiRmaWVsZFN0YXR1cyA9IGVkLiRmaWVsZFN0YXR1cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGVkZ2VPck5vZGU7XG4gICAgfVxuXG4gICAgLypyZXR1cm5zIG5vZGUgb3IgZWRnZSBmcm9tIHBhcmVudCB0byB0aGlzIG5vZGUqL1xuICAgIGFkZE5vZGUobm9kZSwgcGFyZW50KSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5ub2Rlcy5wdXNoKG5vZGUpO1xuICAgICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgICAgICB2YXIgZWRnZSA9IHNlbGYuX2FkZENoaWxkKHBhcmVudCwgbm9kZSk7XG4gICAgICAgICAgICB0aGlzLl9maXJlTm9kZUFkZGVkQ2FsbGJhY2sobm9kZSk7XG4gICAgICAgICAgICByZXR1cm4gZWRnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhub2RlKTtcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfVxuXG4gICAgLyppbmplY3RzIGdpdmVuIG5vZGUgaW50byBnaXZlbiBlZGdlKi9cbiAgICBpbmplY3ROb2RlKG5vZGUsIGVkZ2UpIHtcbiAgICAgICAgdmFyIHBhcmVudCA9IGVkZ2UucGFyZW50Tm9kZTtcbiAgICAgICAgdmFyIGNoaWxkID0gZWRnZS5jaGlsZE5vZGU7XG4gICAgICAgIHRoaXMubm9kZXMucHVzaChub2RlKTtcbiAgICAgICAgbm9kZS4kcGFyZW50ID0gcGFyZW50O1xuICAgICAgICBlZGdlLmNoaWxkTm9kZSA9IG5vZGU7XG4gICAgICAgIHRoaXMuX2FkZENoaWxkKG5vZGUsIGNoaWxkKTtcbiAgICAgICAgdGhpcy5fZmlyZU5vZGVBZGRlZENhbGxiYWNrKG5vZGUpO1xuICAgIH1cblxuICAgIF9hZGRDaGlsZChwYXJlbnQsIGNoaWxkKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGVkZ2UgPSBuZXcgZG9tYWluLkVkZ2UocGFyZW50LCBjaGlsZCk7XG4gICAgICAgIHNlbGYuX3NldEVkZ2VJbml0aWFsUHJvYmFiaWxpdHkoZWRnZSk7XG4gICAgICAgIHNlbGYuZWRnZXMucHVzaChlZGdlKTtcblxuICAgICAgICBwYXJlbnQuY2hpbGRFZGdlcy5wdXNoKGVkZ2UpO1xuICAgICAgICBjaGlsZC4kcGFyZW50ID0gcGFyZW50O1xuICAgICAgICByZXR1cm4gZWRnZTtcbiAgICB9XG5cbiAgICBfc2V0RWRnZUluaXRpYWxQcm9iYWJpbGl0eShlZGdlKSB7XG4gICAgICAgIGlmIChlZGdlLnBhcmVudE5vZGUgaW5zdGFuY2VvZiBkb21haW4uQ2hhbmNlTm9kZSkge1xuICAgICAgICAgICAgZWRnZS5wcm9iYWJpbGl0eSA9ICcjJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGVkZ2UucHJvYmFiaWxpdHkgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIC8qcmVtb3ZlcyBnaXZlbiBub2RlIGFuZCBpdHMgc3VidHJlZSovXG4gICAgcmVtb3ZlTm9kZShub2RlLCAkbCA9IDApIHtcblxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIG5vZGUuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PnNlbGYucmVtb3ZlTm9kZShlLmNoaWxkTm9kZSwgJGwgKyAxKSk7XG5cbiAgICAgICAgc2VsZi5fcmVtb3ZlTm9kZShub2RlKTtcbiAgICAgICAgdmFyIHBhcmVudCA9IG5vZGUuJHBhcmVudDtcbiAgICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICAgICAgdmFyIHBhcmVudEVkZ2UgPSBVdGlscy5maW5kKHBhcmVudC5jaGlsZEVkZ2VzLCAoZSwgaSk9PiBlLmNoaWxkTm9kZSA9PT0gbm9kZSk7XG4gICAgICAgICAgICBpZiAoJGwgPT0gMCkge1xuICAgICAgICAgICAgICAgIHNlbGYucmVtb3ZlRWRnZShwYXJlbnRFZGdlKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5fcmVtb3ZlRWRnZShwYXJlbnRFZGdlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9maXJlTm9kZVJlbW92ZWRDYWxsYmFjayhub2RlKTtcbiAgICB9XG5cbiAgICAvKnJlbW92ZXMgZ2l2ZW4gbm9kZXMgYW5kIHRoZWlyIHN1YnRyZWVzKi9cbiAgICByZW1vdmVOb2Rlcyhub2Rlcykge1xuXG4gICAgICAgIHZhciByb290cyA9IHRoaXMuZmluZFN1YnRyZWVSb290cyhub2Rlcyk7XG4gICAgICAgIHJvb3RzLmZvckVhY2gobj0+dGhpcy5yZW1vdmVOb2RlKG4sIDApLCB0aGlzKTtcbiAgICB9XG5cbiAgICBjb252ZXJ0Tm9kZShub2RlLCB0eXBlVG9Db252ZXJ0VG8pe1xuICAgICAgICB2YXIgbmV3Tm9kZTtcbiAgICAgICAgaWYoIW5vZGUuY2hpbGRFZGdlcy5sZW5ndGggJiYgbm9kZS4kcGFyZW50KXtcbiAgICAgICAgICAgIG5ld05vZGUgPSB0aGlzLmNyZWF0ZU5vZGVCeVR5cGUodHlwZVRvQ29udmVydFRvLCBub2RlLmxvY2F0aW9uKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBpZihub2RlIGluc3RhbmNlb2YgZG9tYWluLkRlY2lzaW9uTm9kZSAmJiB0eXBlVG9Db252ZXJ0VG89PWRvbWFpbi5DaGFuY2VOb2RlLiRUWVBFKXtcbiAgICAgICAgICAgICAgICBuZXdOb2RlID0gdGhpcy5jcmVhdGVOb2RlQnlUeXBlKHR5cGVUb0NvbnZlcnRUbywgbm9kZS5sb2NhdGlvbik7XG4gICAgICAgICAgICB9ZWxzZSBpZih0eXBlVG9Db252ZXJ0VG89PWRvbWFpbi5EZWNpc2lvbk5vZGUuJFRZUEUpe1xuICAgICAgICAgICAgICAgIG5ld05vZGUgPSB0aGlzLmNyZWF0ZU5vZGVCeVR5cGUodHlwZVRvQ29udmVydFRvLCBub2RlLmxvY2F0aW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmKG5ld05vZGUpe1xuICAgICAgICAgICAgbmV3Tm9kZS5uYW1lPW5vZGUubmFtZTtcbiAgICAgICAgICAgIHRoaXMucmVwbGFjZU5vZGUobmV3Tm9kZSwgbm9kZSk7XG4gICAgICAgICAgICBuZXdOb2RlLmNoaWxkRWRnZXMuZm9yRWFjaChlPT50aGlzLl9zZXRFZGdlSW5pdGlhbFByb2JhYmlsaXR5KGUpKTtcbiAgICAgICAgICAgIHRoaXMuX2ZpcmVOb2RlQWRkZWRDYWxsYmFjayhuZXdOb2RlKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgY3JlYXRlTm9kZUJ5VHlwZSh0eXBlLCBsb2NhdGlvbil7XG4gICAgICAgIGlmKHR5cGU9PWRvbWFpbi5EZWNpc2lvbk5vZGUuJFRZUEUpe1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBkb21haW4uRGVjaXNpb25Ob2RlKGxvY2F0aW9uKVxuICAgICAgICB9ZWxzZSBpZih0eXBlPT1kb21haW4uQ2hhbmNlTm9kZS4kVFlQRSl7XG4gICAgICAgICAgICByZXR1cm4gbmV3IGRvbWFpbi5DaGFuY2VOb2RlKGxvY2F0aW9uKVxuICAgICAgICB9ZWxzZSBpZih0eXBlPT1kb21haW4uVGVybWluYWxOb2RlLiRUWVBFKXtcbiAgICAgICAgICAgIHJldHVybiBuZXcgZG9tYWluLlRlcm1pbmFsTm9kZShsb2NhdGlvbilcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJlcGxhY2VOb2RlKG5ld05vZGUsIG9sZE5vZGUpe1xuICAgICAgICB2YXIgcGFyZW50ID0gb2xkTm9kZS4kcGFyZW50O1xuICAgICAgICBuZXdOb2RlLiRwYXJlbnQgPSBwYXJlbnQ7XG5cbiAgICAgICAgaWYocGFyZW50KXtcbiAgICAgICAgICAgIHZhciBwYXJlbnRFZGdlID0gVXRpbHMuZmluZChuZXdOb2RlLiRwYXJlbnQuY2hpbGRFZGdlcywgZT0+ZS5jaGlsZE5vZGU9PT1vbGROb2RlKTtcbiAgICAgICAgICAgIHBhcmVudEVkZ2UuY2hpbGROb2RlID0gbmV3Tm9kZTtcbiAgICAgICAgfVxuXG4gICAgICAgIG5ld05vZGUuY2hpbGRFZGdlcyA9IG9sZE5vZGUuY2hpbGRFZGdlcztcbiAgICAgICAgbmV3Tm9kZS5jaGlsZEVkZ2VzLmZvckVhY2goZT0+ZS5wYXJlbnROb2RlPW5ld05vZGUpO1xuXG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMubm9kZXMuaW5kZXhPZihvbGROb2RlKTtcbiAgICAgICAgaWYofmluZGV4KXtcbiAgICAgICAgICAgIHRoaXMubm9kZXNbaW5kZXhdPW5ld05vZGU7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBnZXRSb290cygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubm9kZXMuZmlsdGVyKG49PiFuLiRwYXJlbnQpO1xuICAgIH1cblxuICAgIGZpbmRTdWJ0cmVlUm9vdHMobm9kZXMpIHtcbiAgICAgICAgcmV0dXJuIG5vZGVzLmZpbHRlcihuPT4hbi4kcGFyZW50IHx8IG5vZGVzLmluZGV4T2Yobi4kcGFyZW50KSA9PT0gLTEpO1xuICAgIH1cblxuICAgIC8qY3JlYXRlcyBkZXRhY2hlZCBjbG9uZSBvZiBnaXZlbiBub2RlKi9cbiAgICBjbG9uZVN1YnRyZWUobm9kZVRvQ29weSwgY2xvbmVDb21wdXRlZFZhbHVlcykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBjbG9uZSA9IHRoaXMuY2xvbmVOb2RlKG5vZGVUb0NvcHkpO1xuXG4gICAgICAgIG5vZGVUb0NvcHkuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PiB7XG4gICAgICAgICAgICB2YXIgY2hpbGRDbG9uZSA9IHNlbGYuY2xvbmVTdWJ0cmVlKGUuY2hpbGROb2RlLCBjbG9uZUNvbXB1dGVkVmFsdWVzKTtcbiAgICAgICAgICAgIGNoaWxkQ2xvbmUuJHBhcmVudCA9IGNsb25lO1xuICAgICAgICAgICAgdmFyIGVkZ2UgPSBVdGlscy5jbG9uZShlKTtcbiAgICAgICAgICAgIGVkZ2UuaWQgPSBVdGlscy5ndWlkKCk7XG4gICAgICAgICAgICBlZGdlLnBhcmVudE5vZGUgPSBjbG9uZTtcbiAgICAgICAgICAgIGVkZ2UuY2hpbGROb2RlID0gY2hpbGRDbG9uZTtcbiAgICAgICAgICAgIGVkZ2UucGF5b2ZmID0gVXRpbHMuY2xvbmVEZWVwKGUucGF5b2ZmKTtcbiAgICAgICAgICAgIGVkZ2UuY29tcHV0ZWQgPSB7fTtcbiAgICAgICAgICAgIGlmIChjbG9uZUNvbXB1dGVkVmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgZWRnZS5jb21wdXRlZCA9IFV0aWxzLmNsb25lRGVlcChlLmNvbXB1dGVkKTtcbiAgICAgICAgICAgICAgICBjaGlsZENsb25lLmNvbXB1dGVkID0gVXRpbHMuY2xvbmVEZWVwKGUuY2hpbGROb2RlLmNvbXB1dGVkKVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xvbmUuY2hpbGRFZGdlcy5wdXNoKGVkZ2UpO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGNsb25lQ29tcHV0ZWRWYWx1ZXMpIHtcbiAgICAgICAgICAgIGNsb25lLmNvbXB1dGVkID0gVXRpbHMuY2xvbmVEZWVwKG5vZGVUb0NvcHkuY29tcHV0ZWQpXG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNsb25lO1xuICAgIH1cblxuICAgIC8qYXR0YWNoZXMgZGV0YWNoZWQgc3VidHJlZSB0byBnaXZlbiBwYXJlbnQqL1xuICAgIGF0dGFjaFN1YnRyZWUobm9kZVRvQXR0YWNoLCBwYXJlbnQpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgbm9kZU9yRWRnZSA9IHNlbGYuYWRkTm9kZShub2RlVG9BdHRhY2gsIHBhcmVudCk7XG5cbiAgICAgICAgbm9kZVRvQXR0YWNoLmV4cHJlc3Npb25TY29wZSA9IG51bGw7XG5cbiAgICAgICAgdmFyIGNoaWxkRWRnZXMgPSBzZWxmLmdldEFsbERlc2NlbmRhbnRFZGdlcyhub2RlVG9BdHRhY2gpO1xuICAgICAgICBjaGlsZEVkZ2VzLmZvckVhY2goZT0+IHtcbiAgICAgICAgICAgIHNlbGYuZWRnZXMucHVzaChlKTtcbiAgICAgICAgICAgIHNlbGYubm9kZXMucHVzaChlLmNoaWxkTm9kZSk7XG4gICAgICAgICAgICBlLmNoaWxkTm9kZS5leHByZXNzaW9uU2NvcGUgPSBudWxsO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gbm9kZU9yRWRnZTtcbiAgICB9XG5cbiAgICBjbG9uZU5vZGVzKG5vZGVzKSB7XG4gICAgICAgIHZhciByb290cyA9IFtdXG4gICAgICAgIC8vVE9ET1xuICAgIH1cblxuICAgIC8qc2hhbGxvdyBjbG9uZSB3aXRob3V0IHBhcmVudCBhbmQgY2hpbGRyZW4qL1xuICAgIGNsb25lTm9kZShub2RlKSB7XG4gICAgICAgIHZhciBjbG9uZSA9IFV0aWxzLmNsb25lKG5vZGUpXG4gICAgICAgIGNsb25lLmlkID0gVXRpbHMuZ3VpZCgpO1xuICAgICAgICBjbG9uZS5sb2NhdGlvbiA9IFV0aWxzLmNsb25lKG5vZGUubG9jYXRpb24pO1xuICAgICAgICBjbG9uZS5jb21wdXRlZCA9IFV0aWxzLmNsb25lKG5vZGUuY29tcHV0ZWQpO1xuICAgICAgICBjbG9uZS4kcGFyZW50ID0gbnVsbDtcbiAgICAgICAgY2xvbmUuY2hpbGRFZGdlcyA9IFtdO1xuICAgICAgICByZXR1cm4gY2xvbmU7XG4gICAgfVxuXG4gICAgZmluZE5vZGVCeUlkKGlkKSB7XG4gICAgICAgIHJldHVybiBVdGlscy5maW5kKHRoaXMubm9kZXMsIG49Pm4uaWQgPT0gaWQpO1xuICAgIH1cblxuICAgIGZpbmRFZGdlQnlJZChpZCkge1xuICAgICAgICByZXR1cm4gVXRpbHMuZmluZCh0aGlzLmVkZ2VzLCBlPT5lLmlkID09IGlkKTtcbiAgICB9XG5cbiAgICBmaW5kQnlJZChpZCkge1xuICAgICAgICB2YXIgbm9kZSA9IHRoaXMuZmluZE5vZGVCeUlkKGlkKTtcbiAgICAgICAgaWYgKG5vZGUpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmZpbmRFZGdlQnlJZChpZCk7XG4gICAgfVxuXG4gICAgX3JlbW92ZU5vZGUobm9kZSkgey8vIHNpbXBseSByZW1vdmVzIG5vZGUgZnJvbSBub2RlIGxpc3RcbiAgICAgICAgdmFyIGluZGV4ID0gdGhpcy5ub2Rlcy5pbmRleE9mKG5vZGUpO1xuICAgICAgICBpZiAoaW5kZXggPiAtMSkge1xuICAgICAgICAgICAgdGhpcy5ub2Rlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmVtb3ZlRWRnZShlZGdlKSB7XG4gICAgICAgIHZhciBpbmRleCA9IGVkZ2UucGFyZW50Tm9kZS5jaGlsZEVkZ2VzLmluZGV4T2YoZWRnZSk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICBlZGdlLnBhcmVudE5vZGUuY2hpbGRFZGdlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX3JlbW92ZUVkZ2UoZWRnZSk7XG4gICAgfVxuXG4gICAgX3JlbW92ZUVkZ2UoZWRnZSkgeyAvL3JlbW92ZXMgZWRnZSBmcm9tIGVkZ2UgbGlzdCB3aXRob3V0IHJlbW92aW5nIGNvbm5lY3RlZCBub2Rlc1xuICAgICAgICB2YXIgaW5kZXggPSB0aGlzLmVkZ2VzLmluZGV4T2YoZWRnZSk7XG4gICAgICAgIGlmIChpbmRleCA+IC0xKSB7XG4gICAgICAgICAgICB0aGlzLmVkZ2VzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfcmVtb3ZlTm9kZXMobm9kZXNUb1JlbW92ZSkge1xuICAgICAgICB0aGlzLm5vZGVzID0gdGhpcy5ub2Rlcy5maWx0ZXIobj0+bm9kZXNUb1JlbW92ZS5pbmRleE9mKG4pID09PSAtMSk7XG4gICAgfVxuXG4gICAgX3JlbW92ZUVkZ2VzKGVkZ2VzVG9SZW1vdmUpIHtcbiAgICAgICAgdGhpcy5lZGdlcyA9IHRoaXMuZWRnZXMuZmlsdGVyKGU9PmVkZ2VzVG9SZW1vdmUuaW5kZXhPZihlKSA9PT0gLTEpO1xuICAgIH1cblxuICAgIGdldEFsbERlc2NlbmRhbnRFZGdlcyhub2RlKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHJlc3VsdCA9IFtdO1xuXG4gICAgICAgIG5vZGUuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PiB7XG4gICAgICAgICAgICByZXN1bHQucHVzaChlKTtcbiAgICAgICAgICAgIGlmIChlLmNoaWxkTm9kZSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKC4uLnNlbGYuZ2V0QWxsRGVzY2VuZGFudEVkZ2VzKGUuY2hpbGROb2RlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuXG4gICAgZ2V0QWxsRGVzY2VuZGFudE5vZGVzKG5vZGUpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgcmVzdWx0ID0gW107XG5cbiAgICAgICAgbm9kZS5jaGlsZEVkZ2VzLmZvckVhY2goZT0+IHtcbiAgICAgICAgICAgIGlmIChlLmNoaWxkTm9kZSkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGUuY2hpbGROb2RlKTtcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCguLi5zZWxmLmdldEFsbERlc2NlbmRhbnROb2RlcyhlLmNoaWxkTm9kZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIGdldEFsbE5vZGVzSW5TdWJ0cmVlKG5vZGUpIHtcbiAgICAgICAgdmFyIGRlc2NlbmRhbnRzID0gdGhpcy5nZXRBbGxEZXNjZW5kYW50Tm9kZXMobm9kZSk7XG4gICAgICAgIGRlc2NlbmRhbnRzLnVuc2hpZnQobm9kZSk7XG4gICAgICAgIHJldHVybiBkZXNjZW5kYW50cztcbiAgICB9XG5cbiAgICBpc1VuZG9BdmFpbGFibGUoKSB7XG4gICAgICAgIHJldHVybiAhIXRoaXMudW5kb1N0YWNrLmxlbmd0aFxuICAgIH1cblxuICAgIGlzUmVkb0F2YWlsYWJsZSgpIHtcbiAgICAgICAgcmV0dXJuICEhdGhpcy5yZWRvU3RhY2subGVuZ3RoXG4gICAgfVxuXG4gICAgY3JlYXRlU3RhdGVTbmFwc2hvdChyZXZlcnRDb25mKXtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHJldmVydENvbmY6IHJldmVydENvbmYsXG4gICAgICAgICAgICBub2RlczogVXRpbHMuY2xvbmVEZWVwKHRoaXMubm9kZXMpLFxuICAgICAgICAgICAgZWRnZXM6IFV0aWxzLmNsb25lRGVlcCh0aGlzLmVkZ2VzKSxcbiAgICAgICAgICAgIHRleHRzOiBVdGlscy5jbG9uZURlZXAodGhpcy50ZXh0cyksXG4gICAgICAgICAgICBwYXlvZmZOYW1lczogVXRpbHMuY2xvbmVEZWVwKHRoaXMucGF5b2ZmTmFtZXMpLFxuICAgICAgICAgICAgZGVmYXVsdENyaXRlcmlvbjFXZWlnaHQ6IFV0aWxzLmNsb25lRGVlcCh0aGlzLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0KSxcbiAgICAgICAgICAgIHdlaWdodExvd2VyQm91bmQ6IFV0aWxzLmNsb25lRGVlcCh0aGlzLndlaWdodExvd2VyQm91bmQpLFxuICAgICAgICAgICAgd2VpZ2h0VXBwZXJCb3VuZDogVXRpbHMuY2xvbmVEZWVwKHRoaXMud2VpZ2h0VXBwZXJCb3VuZCksXG4gICAgICAgICAgICBleHByZXNzaW9uU2NvcGU6IFV0aWxzLmNsb25lRGVlcCh0aGlzLmV4cHJlc3Npb25TY29wZSksXG4gICAgICAgICAgICBjb2RlOiB0aGlzLmNvZGUsXG4gICAgICAgICAgICAkY29kZUVycm9yOiB0aGlzLiRjb2RlRXJyb3JcbiAgICAgICAgfVxuICAgIH1cblxuXG4gICAgc2F2ZVN0YXRlRnJvbVNuYXBzaG90KHN0YXRlKXtcbiAgICAgICAgdGhpcy5yZWRvU3RhY2subGVuZ3RoID0gMDtcblxuICAgICAgICB0aGlzLl9wdXNoVG9TdGFjayh0aGlzLnVuZG9TdGFjaywgc3RhdGUpO1xuXG4gICAgICAgIHRoaXMuX2ZpcmVVbmRvUmVkb0NhbGxiYWNrKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2F2ZVN0YXRlKHJldmVydENvbmYpIHtcbiAgICAgICAgdGhpcy5zYXZlU3RhdGVGcm9tU25hcHNob3QodGhpcy5jcmVhdGVTdGF0ZVNuYXBzaG90KHJldmVydENvbmYpKTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgdW5kbygpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgbmV3U3RhdGUgPSB0aGlzLnVuZG9TdGFjay5wb3AoKTtcbiAgICAgICAgaWYgKCFuZXdTdGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5fcHVzaFRvU3RhY2sodGhpcy5yZWRvU3RhY2ssIHtcbiAgICAgICAgICAgIHJldmVydENvbmY6IG5ld1N0YXRlLnJldmVydENvbmYsXG4gICAgICAgICAgICBub2Rlczogc2VsZi5ub2RlcyxcbiAgICAgICAgICAgIGVkZ2VzOiBzZWxmLmVkZ2VzLFxuICAgICAgICAgICAgdGV4dHM6IHNlbGYudGV4dHMsXG4gICAgICAgICAgICBwYXlvZmZOYW1lczogc2VsZi5wYXlvZmZOYW1lcyxcbiAgICAgICAgICAgIGRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0OiBzZWxmLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0LFxuICAgICAgICAgICAgd2VpZ2h0TG93ZXJCb3VuZDogc2VsZi53ZWlnaHRMb3dlckJvdW5kLFxuICAgICAgICAgICAgd2VpZ2h0VXBwZXJCb3VuZDogc2VsZi53ZWlnaHRVcHBlckJvdW5kLFxuICAgICAgICAgICAgZXhwcmVzc2lvblNjb3BlOiBzZWxmLmV4cHJlc3Npb25TY29wZSxcbiAgICAgICAgICAgIGNvZGU6IHNlbGYuY29kZSxcbiAgICAgICAgICAgICRjb2RlRXJyb3I6IHNlbGYuJGNvZGVFcnJvclxuXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuX3NldE5ld1N0YXRlKG5ld1N0YXRlKTtcblxuICAgICAgICB0aGlzLl9maXJlVW5kb1JlZG9DYWxsYmFjaygpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJlZG8oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG5ld1N0YXRlID0gdGhpcy5yZWRvU3RhY2sucG9wKCk7XG4gICAgICAgIGlmICghbmV3U3RhdGUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3B1c2hUb1N0YWNrKHRoaXMudW5kb1N0YWNrLCB7XG4gICAgICAgICAgICByZXZlcnRDb25mOiBuZXdTdGF0ZS5yZXZlcnRDb25mLFxuICAgICAgICAgICAgbm9kZXM6IHNlbGYubm9kZXMsXG4gICAgICAgICAgICBlZGdlczogc2VsZi5lZGdlcyxcbiAgICAgICAgICAgIHRleHRzOiBzZWxmLnRleHRzLFxuICAgICAgICAgICAgcGF5b2ZmTmFtZXM6IHNlbGYucGF5b2ZmTmFtZXMsXG4gICAgICAgICAgICBkZWZhdWx0Q3JpdGVyaW9uMVdlaWdodDogc2VsZi5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCxcbiAgICAgICAgICAgIHdlaWdodExvd2VyQm91bmQ6IHNlbGYud2VpZ2h0TG93ZXJCb3VuZCxcbiAgICAgICAgICAgIHdlaWdodFVwcGVyQm91bmQ6IHNlbGYud2VpZ2h0VXBwZXJCb3VuZCxcbiAgICAgICAgICAgIGV4cHJlc3Npb25TY29wZTogc2VsZi5leHByZXNzaW9uU2NvcGUsXG4gICAgICAgICAgICBjb2RlOiBzZWxmLmNvZGUsXG4gICAgICAgICAgICAkY29kZUVycm9yOiBzZWxmLiRjb2RlRXJyb3JcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5fc2V0TmV3U3RhdGUobmV3U3RhdGUsIHRydWUpO1xuXG4gICAgICAgIHRoaXMuX2ZpcmVVbmRvUmVkb0NhbGxiYWNrKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY2xlYXIoKSB7XG4gICAgICAgIHRoaXMubm9kZXMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5lZGdlcy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLnVuZG9TdGFjay5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLnJlZG9TdGFjay5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLnRleHRzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuY2xlYXJFeHByZXNzaW9uU2NvcGUoKTtcbiAgICAgICAgdGhpcy5jb2RlID0gJyc7XG4gICAgICAgIHRoaXMuJGNvZGVFcnJvciA9IG51bGw7XG4gICAgICAgIHRoaXMuJGNvZGVEaXJ0eSA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMucGF5b2ZmTmFtZXMgPSBbXTtcbiAgICAgICAgdGhpcy5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCA9IDE7XG4gICAgICAgIHRoaXMud2VpZ2h0TG93ZXJCb3VuZCA9IDA7XG4gICAgICAgIHRoaXMud2VpZ2h0VXBwZXJCb3VuZCA9IEluZmluaXR5O1xuICAgIH1cblxuICAgIGNsZWFyQ29tcHV0ZWRWYWx1ZXMoKXtcbiAgICAgICAgdGhpcy5ub2Rlcy5mb3JFYWNoKG49Pm4uY2xlYXJDb21wdXRlZFZhbHVlcygpKTtcbiAgICAgICAgdGhpcy5lZGdlcy5mb3JFYWNoKGU9PmUuY2xlYXJDb21wdXRlZFZhbHVlcygpKTtcbiAgICB9XG5cbiAgICBhZGRUZXh0KHRleHQpIHtcbiAgICAgICAgdGhpcy50ZXh0cy5wdXNoKHRleHQpO1xuXG4gICAgICAgIHRoaXMuX2ZpcmVUZXh0QWRkZWRDYWxsYmFjayh0ZXh0KTtcbiAgICB9XG5cbiAgICByZW1vdmVUZXh0cyh0ZXh0cykge1xuICAgICAgICB0ZXh0cy5mb3JFYWNoKHQ9PnRoaXMucmVtb3ZlVGV4dCh0KSk7XG4gICAgfVxuXG4gICAgcmVtb3ZlVGV4dCh0ZXh0KSB7XG4gICAgICAgIHZhciBpbmRleCA9IHRoaXMudGV4dHMuaW5kZXhPZih0ZXh0KTtcbiAgICAgICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgICAgICAgIHRoaXMudGV4dHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgIHRoaXMuX2ZpcmVUZXh0UmVtb3ZlZENhbGxiYWNrKHRleHQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2xlYXJFeHByZXNzaW9uU2NvcGUoKSB7XG4gICAgICAgIFV0aWxzLmZvck93bih0aGlzLmV4cHJlc3Npb25TY29wZSwgKHZhbHVlLCBrZXkpPT4ge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuZXhwcmVzc2lvblNjb3BlW2tleV07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldmVyc2VQYXlvZmZzKCl7XG4gICAgICAgIHRoaXMucGF5b2ZmTmFtZXMucmV2ZXJzZSgpO1xuICAgICAgICB0aGlzLmVkZ2VzLmZvckVhY2goZT0+ZS5wYXlvZmYucmV2ZXJzZSgpKVxuICAgIH1cblxuICAgIF9zZXROZXdTdGF0ZShuZXdTdGF0ZSwgcmVkbykge1xuICAgICAgICB2YXIgbm9kZUJ5SWQgPSBVdGlscy5nZXRPYmplY3RCeUlkTWFwKG5ld1N0YXRlLm5vZGVzKTtcbiAgICAgICAgdmFyIGVkZ2VCeUlkID0gVXRpbHMuZ2V0T2JqZWN0QnlJZE1hcChuZXdTdGF0ZS5lZGdlcyk7XG4gICAgICAgIHRoaXMubm9kZXMgPSBuZXdTdGF0ZS5ub2RlcztcbiAgICAgICAgdGhpcy5lZGdlcyA9IG5ld1N0YXRlLmVkZ2VzO1xuICAgICAgICB0aGlzLnRleHRzID0gbmV3U3RhdGUudGV4dHM7XG4gICAgICAgIHRoaXMucGF5b2ZmTmFtZXMgPSBuZXdTdGF0ZS5wYXlvZmZOYW1lcztcbiAgICAgICAgdGhpcy5kZWZhdWx0Q3JpdGVyaW9uMVdlaWdodCA9IG5ld1N0YXRlLmRlZmF1bHRDcml0ZXJpb24xV2VpZ2h0O1xuICAgICAgICB0aGlzLndlaWdodExvd2VyQm91bmQgPSBuZXdTdGF0ZS53ZWlnaHRMb3dlckJvdW5kO1xuICAgICAgICB0aGlzLndlaWdodFVwcGVyQm91bmQgPSBuZXdTdGF0ZS53ZWlnaHRVcHBlckJvdW5kO1xuICAgICAgICB0aGlzLmV4cHJlc3Npb25TY29wZSA9IG5ld1N0YXRlLmV4cHJlc3Npb25TY29wZTtcbiAgICAgICAgdGhpcy5jb2RlID0gbmV3U3RhdGUuY29kZTtcbiAgICAgICAgdGhpcy4kY29kZUVycm9yICA9IG5ld1N0YXRlLiRjb2RlRXJyb3JcblxuICAgICAgICB0aGlzLm5vZGVzLmZvckVhY2gobj0+IHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbi5jaGlsZEVkZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGVkZ2UgPSBlZGdlQnlJZFtuLmNoaWxkRWRnZXNbaV0uaWRdO1xuICAgICAgICAgICAgICAgIG4uY2hpbGRFZGdlc1tpXSA9IGVkZ2U7XG4gICAgICAgICAgICAgICAgZWRnZS5wYXJlbnROb2RlID0gbjtcbiAgICAgICAgICAgICAgICBlZGdlLmNoaWxkTm9kZSA9IG5vZGVCeUlkW2VkZ2UuY2hpbGROb2RlLmlkXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAobmV3U3RhdGUucmV2ZXJ0Q29uZikge1xuICAgICAgICAgICAgaWYgKCFyZWRvICYmIG5ld1N0YXRlLnJldmVydENvbmYub25VbmRvKSB7XG4gICAgICAgICAgICAgICAgbmV3U3RhdGUucmV2ZXJ0Q29uZi5vblVuZG8obmV3U3RhdGUucmV2ZXJ0Q29uZi5kYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZWRvICYmIG5ld1N0YXRlLnJldmVydENvbmYub25SZWRvKSB7XG4gICAgICAgICAgICAgICAgbmV3U3RhdGUucmV2ZXJ0Q29uZi5vblJlZG8obmV3U3RhdGUucmV2ZXJ0Q29uZi5kYXRhKTtcbiAgICAgICAgICAgIH1cblxuXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZXZlcnRDb25mID0gbmV3U3RhdGUucmV2ZXJ0Q29uZjtcbiAgICB9XG5cblxuICAgIF9wdXNoVG9TdGFjayhzdGFjaywgb2JqKSB7XG4gICAgICAgIGlmIChzdGFjay5sZW5ndGggPj0gdGhpcy5tYXhTdGFja1NpemUpIHtcbiAgICAgICAgICAgIHN0YWNrLnNoaWZ0KCk7XG4gICAgICAgIH1cbiAgICAgICAgc3RhY2sucHVzaChvYmopO1xuICAgIH1cblxuICAgIF9maXJlVW5kb1JlZG9DYWxsYmFjaygpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc0Rpc2FibGVkICYmIHRoaXMudW5kb1JlZG9TdGF0ZUNoYW5nZWRDYWxsYmFjaykge1xuICAgICAgICAgICAgdGhpcy51bmRvUmVkb1N0YXRlQ2hhbmdlZENhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfZmlyZU5vZGVBZGRlZENhbGxiYWNrKG5vZGUpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc0Rpc2FibGVkICYmIHRoaXMubm9kZUFkZGVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMubm9kZUFkZGVkQ2FsbGJhY2sobm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfZmlyZU5vZGVSZW1vdmVkQ2FsbGJhY2sobm9kZSkge1xuICAgICAgICBpZiAoIXRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgJiYgdGhpcy5ub2RlUmVtb3ZlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLm5vZGVSZW1vdmVkQ2FsbGJhY2sobm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfZmlyZVRleHRBZGRlZENhbGxiYWNrKHRleHQpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNhbGxiYWNrc0Rpc2FibGVkICYmIHRoaXMudGV4dEFkZGVkQ2FsbGJhY2spIHtcbiAgICAgICAgICAgIHRoaXMudGV4dEFkZGVkQ2FsbGJhY2sodGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfZmlyZVRleHRSZW1vdmVkQ2FsbGJhY2sodGV4dCkge1xuICAgICAgICBpZiAoIXRoaXMuY2FsbGJhY2tzRGlzYWJsZWQgJiYgdGhpcy50ZXh0UmVtb3ZlZENhbGxiYWNrKSB7XG4gICAgICAgICAgICB0aGlzLnRleHRSZW1vdmVkQ2FsbGJhY2sodGV4dCk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCJpbXBvcnQge09iamVjdFdpdGhDb21wdXRlZFZhbHVlc30gZnJvbSBcIi4vb2JqZWN0LXdpdGgtY29tcHV0ZWQtdmFsdWVzXCI7XG5cbmV4cG9ydCBjbGFzcyBFZGdlIGV4dGVuZHMgT2JqZWN0V2l0aENvbXB1dGVkVmFsdWVzIHtcbiAgICBwYXJlbnROb2RlO1xuICAgIGNoaWxkTm9kZTtcblxuICAgIG5hbWUgPSAnJztcbiAgICBwcm9iYWJpbGl0eSA9IHVuZGVmaW5lZDtcbiAgICBwYXlvZmYgPSBbMCwgMF07XG5cbiAgICAkRElTUExBWV9WQUxVRV9OQU1FUyA9IFsncHJvYmFiaWxpdHknLCAncGF5b2ZmJywgJ29wdGltYWwnXTtcblxuICAgIGNvbnN0cnVjdG9yKHBhcmVudE5vZGUsIGNoaWxkTm9kZSwgbmFtZSwgcGF5b2ZmLCBwcm9iYWJpbGl0eSwpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy5wYXJlbnROb2RlID0gcGFyZW50Tm9kZTtcbiAgICAgICAgdGhpcy5jaGlsZE5vZGUgPSBjaGlsZE5vZGU7XG5cbiAgICAgICAgaWYgKG5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAocHJvYmFiaWxpdHkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5wcm9iYWJpbGl0eSA9IHByb2JhYmlsaXR5O1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYXlvZmYgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy5wYXlvZmYgPSBwYXlvZmZcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgc2V0TmFtZShuYW1lKSB7XG4gICAgICAgIHRoaXMubmFtZSA9IG5hbWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHNldFByb2JhYmlsaXR5KHByb2JhYmlsaXR5KSB7XG4gICAgICAgIHRoaXMucHJvYmFiaWxpdHkgPSBwcm9iYWJpbGl0eTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgc2V0UGF5b2ZmKHBheW9mZiwgaW5kZXggPSAwKSB7XG4gICAgICAgIHRoaXMucGF5b2ZmW2luZGV4XSA9IHBheW9mZjtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgY29tcHV0ZWRCYXNlUHJvYmFiaWxpdHkodmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbXB1dGVkVmFsdWUobnVsbCwgJ3Byb2JhYmlsaXR5JywgdmFsKTtcbiAgICB9XG5cbiAgICBjb21wdXRlZEJhc2VQYXlvZmYodmFsLCBpbmRleCA9IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcHV0ZWRWYWx1ZShudWxsLCAncGF5b2ZmWycgKyBpbmRleCArICddJywgdmFsKTtcbiAgICB9XG5cbiAgICBkaXNwbGF5UHJvYmFiaWxpdHkodmFsKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRpc3BsYXlWYWx1ZSgncHJvYmFiaWxpdHknLCB2YWwpO1xuICAgIH1cblxuICAgIGRpc3BsYXlQYXlvZmYodmFsLCBpbmRleCA9IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGlzcGxheVZhbHVlKCdwYXlvZmZbJyArIGluZGV4ICsgJ10nLCB2YWwpO1xuICAgIH1cbn1cbiIsImV4cG9ydCAqIGZyb20gJy4vbm9kZS9ub2RlJ1xuZXhwb3J0ICogZnJvbSAnLi9ub2RlL2RlY2lzaW9uLW5vZGUnXG5leHBvcnQgKiBmcm9tICcuL25vZGUvY2hhbmNlLW5vZGUnXG5leHBvcnQgKiBmcm9tICcuL25vZGUvdGVybWluYWwtbm9kZSdcbmV4cG9ydCAqIGZyb20gJy4vZWRnZSdcbmV4cG9ydCAqIGZyb20gJy4vcG9pbnQnXG5leHBvcnQgKiBmcm9tICcuL3RleHQnXG4iLCJpbXBvcnQge05vZGV9IGZyb20gJy4vbm9kZSdcblxuZXhwb3J0IGNsYXNzIENoYW5jZU5vZGUgZXh0ZW5kcyBOb2Rle1xuXG4gICAgc3RhdGljICRUWVBFID0gJ2NoYW5jZSc7XG5cbiAgICBjb25zdHJ1Y3Rvcihsb2NhdGlvbil7XG4gICAgICAgIHN1cGVyKENoYW5jZU5vZGUuJFRZUEUsIGxvY2F0aW9uKTtcbiAgICB9XG59XG4iLCJpbXBvcnQge05vZGV9IGZyb20gJy4vbm9kZSdcblxuZXhwb3J0IGNsYXNzIERlY2lzaW9uTm9kZSBleHRlbmRzIE5vZGV7XG5cbiAgICBzdGF0aWMgJFRZUEUgPSAnZGVjaXNpb24nO1xuXG4gICAgY29uc3RydWN0b3IobG9jYXRpb24pe1xuICAgICAgICBzdXBlcihEZWNpc2lvbk5vZGUuJFRZUEUsIGxvY2F0aW9uKTtcbiAgICB9XG59XG4iLCJpbXBvcnQge1BvaW50fSBmcm9tICcuLi9wb2ludCdcbmltcG9ydCB7T2JqZWN0V2l0aENvbXB1dGVkVmFsdWVzfSBmcm9tICcuLi9vYmplY3Qtd2l0aC1jb21wdXRlZC12YWx1ZXMnXG5cbmV4cG9ydCBjbGFzcyBOb2RlIGV4dGVuZHMgT2JqZWN0V2l0aENvbXB1dGVkVmFsdWVze1xuXG4gICAgdHlwZTtcbiAgICBjaGlsZEVkZ2VzPVtdO1xuICAgIG5hbWU9Jyc7XG5cbiAgICBsb2NhdGlvbjsgLy9Qb2ludFxuXG4gICAgY29kZT0nJztcbiAgICAkY29kZURpcnR5ID0gZmFsc2U7IC8vIGlzIGNvZGUgY2hhbmdlZCB3aXRob3V0IHJlZXZhbHVhdGlvbj9cbiAgICAkY29kZUVycm9yID0gbnVsbDsgLy9jb2RlIGV2YWx1YXRpb24gZXJyb3JzXG5cbiAgICBleHByZXNzaW9uU2NvcGU9bnVsbDtcblxuICAgIGZvbGRlZCA9IGZhbHNlOyAvLyBpcyBub2RlIGZvbGRlZCBhbG9uZyB3aXRoIGl0cyBzdWJ0cmVlXG5cbiAgICAkRElTUExBWV9WQUxVRV9OQU1FUyA9IFsnY2hpbGRyZW5QYXlvZmYnLCAnYWdncmVnYXRlZFBheW9mZicsICdwcm9iYWJpbGl0eVRvRW50ZXInLCAnb3B0aW1hbCddXG5cbiAgICBjb25zdHJ1Y3Rvcih0eXBlLCBsb2NhdGlvbil7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMubG9jYXRpb249bG9jYXRpb247XG4gICAgICAgIGlmKCFsb2NhdGlvbil7XG4gICAgICAgICAgICB0aGlzLmxvY2F0aW9uID0gbmV3IFBvaW50KDAsMCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy50eXBlPXR5cGU7XG4gICAgfVxuXG4gICAgc2V0TmFtZShuYW1lKXtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbW92ZVRvKHgseSwgd2l0aENoaWxkcmVuKXsgLy9tb3ZlIHRvIG5ldyBsb2NhdGlvblxuICAgICAgICBpZih3aXRoQ2hpbGRyZW4pe1xuICAgICAgICAgICAgdmFyIGR4ID0geC10aGlzLmxvY2F0aW9uLng7XG4gICAgICAgICAgICB2YXIgZHkgPSB5LXRoaXMubG9jYXRpb24ueTtcbiAgICAgICAgICAgIHRoaXMuY2hpbGRFZGdlcy5mb3JFYWNoKGU9PmUuY2hpbGROb2RlLm1vdmUoZHgsIGR5LCB0cnVlKSlcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubG9jYXRpb24ubW92ZVRvKHgseSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIG1vdmUoZHgsIGR5LCB3aXRoQ2hpbGRyZW4peyAvL21vdmUgYnkgdmVjdG9yXG4gICAgICAgIGlmKHdpdGhDaGlsZHJlbil7XG4gICAgICAgICAgICB0aGlzLmNoaWxkRWRnZXMuZm9yRWFjaChlPT5lLmNoaWxkTm9kZS5tb3ZlKGR4LCBkeSwgdHJ1ZSkpXG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5sb2NhdGlvbi5tb3ZlKGR4LCBkeSk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cbn1cbiIsImltcG9ydCB7Tm9kZX0gZnJvbSAnLi9ub2RlJ1xuXG5leHBvcnQgY2xhc3MgVGVybWluYWxOb2RlIGV4dGVuZHMgTm9kZXtcblxuICAgIHN0YXRpYyAkVFlQRSA9ICd0ZXJtaW5hbCc7XG5cbiAgICBjb25zdHJ1Y3Rvcihsb2NhdGlvbil7XG4gICAgICAgIHN1cGVyKFRlcm1pbmFsTm9kZS4kVFlQRSwgbG9jYXRpb24pO1xuICAgIH1cbn1cbiIsImltcG9ydCB7VXRpbHN9IGZyb20gJ3NkLXV0aWxzJ1xuXG5pbXBvcnQge09iamVjdFdpdGhJZEFuZEVkaXRhYmxlRmllbGRzfSBmcm9tIFwiLi9vYmplY3Qtd2l0aC1pZC1hbmQtZWRpdGFibGUtZmllbGRzXCI7XG5cbmV4cG9ydCBjbGFzcyBPYmplY3RXaXRoQ29tcHV0ZWRWYWx1ZXMgZXh0ZW5kcyBPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkc3tcblxuICAgIGNvbXB1dGVkPXt9OyAvL2NvbXB1dGVkIHZhbHVlc1xuXG4gICAgLypnZXQgb3Igc2V0IGNvbXB1dGVkIHZhbHVlKi9cbiAgICBjb21wdXRlZFZhbHVlKHJ1bGVOYW1lLCBmaWVsZFBhdGgsIHZhbHVlKXtcbiAgICAgICAgdmFyIHBhdGggPSAnY29tcHV0ZWQuJztcbiAgICAgICAgaWYocnVsZU5hbWUpe1xuICAgICAgICAgICAgcGF0aCs9cnVsZU5hbWUrJy4nO1xuICAgICAgICB9XG4gICAgICAgIHBhdGgrPWZpZWxkUGF0aDtcbiAgICAgICAgaWYodmFsdWU9PT11bmRlZmluZWQpe1xuICAgICAgICAgICAgcmV0dXJuICBVdGlscy5nZXQodGhpcywgcGF0aCwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgVXRpbHMuc2V0KHRoaXMsIHBhdGgsIHZhbHVlKTtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cblxuICAgIGNsZWFyQ29tcHV0ZWRWYWx1ZXMocnVsZU5hbWUpe1xuICAgICAgICBpZihydWxlTmFtZT09dW5kZWZpbmVkKXtcbiAgICAgICAgICAgIHRoaXMuY29tcHV0ZWQ9e307XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgaWYoVXRpbHMuaXNBcnJheShydWxlTmFtZSkpe1xuICAgICAgICAgICAgcnVsZU5hbWUuZm9yRWFjaChuPT57XG4gICAgICAgICAgICAgICAgdGhpcy5jb21wdXRlZFtuXT17fTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY29tcHV0ZWRbcnVsZU5hbWVdPXt9O1xuICAgIH1cblxuICAgIGNsZWFyRGlzcGxheVZhbHVlcygpe1xuICAgICAgICB0aGlzLmNvbXB1dGVkWyckZGlzcGxheVZhbHVlcyddPXt9O1xuICAgIH1cblxuICAgIGRpc3BsYXlWYWx1ZShmaWVsZFBhdGgsIHZhbHVlKXtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29tcHV0ZWRWYWx1ZShudWxsLCAnJGRpc3BsYXlWYWx1ZXMuJytmaWVsZFBhdGgsIHZhbHVlKTtcbiAgICB9XG5cbiAgICBsb2FkQ29tcHV0ZWRWYWx1ZXMoY29tcHV0ZWQpe1xuICAgICAgICB0aGlzLmNvbXB1dGVkID0gVXRpbHMuY2xvbmVEZWVwKGNvbXB1dGVkKTtcbiAgICB9XG59XG4iLCJpbXBvcnQge1V0aWxzfSBmcm9tICdzZC11dGlscydcblxuZXhwb3J0IGNsYXNzIE9iamVjdFdpdGhJZEFuZEVkaXRhYmxlRmllbGRzIHtcblxuICAgIGlkID0gVXRpbHMuZ3VpZCgpOyAvL2ludGVybmFsIGlkXG4gICAgJGZpZWxkU3RhdHVzPXt9O1xuXG4gICAgJE9iamVjdFdpdGhJZEFuZEVkaXRhYmxlRmllbGRzID0gdHJ1ZTtcblxuICAgIGdldEZpZWxkU3RhdHVzKGZpZWxkUGF0aCl7XG4gICAgICAgIGlmKCFVdGlscy5nZXQodGhpcy4kZmllbGRTdGF0dXMsIGZpZWxkUGF0aCwgbnVsbCkpe1xuICAgICAgICAgICAgVXRpbHMuc2V0KHRoaXMuJGZpZWxkU3RhdHVzLCBmaWVsZFBhdGgsIHtcbiAgICAgICAgICAgICAgICB2YWxpZDoge1xuICAgICAgICAgICAgICAgICAgICBzeW50YXg6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFV0aWxzLmdldCh0aGlzLiRmaWVsZFN0YXR1cywgZmllbGRQYXRoKTtcbiAgICB9XG5cbiAgICBzZXRTeW50YXhWYWxpZGl0eShmaWVsZFBhdGgsIHZhbGlkKXtcbiAgICAgICAgdmFyIGZpZWxkU3RhdHVzID0gdGhpcy5nZXRGaWVsZFN0YXR1cyhmaWVsZFBhdGgpO1xuICAgICAgICBmaWVsZFN0YXR1cy52YWxpZC5zeW50YXggPSB2YWxpZDtcbiAgICB9XG5cbiAgICBzZXRWYWx1ZVZhbGlkaXR5KGZpZWxkUGF0aCwgdmFsaWQpe1xuICAgICAgICB2YXIgZmllbGRTdGF0dXMgPSB0aGlzLmdldEZpZWxkU3RhdHVzKGZpZWxkUGF0aCk7XG4gICAgICAgIGZpZWxkU3RhdHVzLnZhbGlkLnZhbHVlID0gdmFsaWQ7XG4gICAgfVxuXG4gICAgaXNGaWVsZFZhbGlkKGZpZWxkUGF0aCwgc3ludGF4PXRydWUsIHZhbHVlPXRydWUpe1xuICAgICAgICB2YXIgZmllbGRTdGF0dXMgPSB0aGlzLmdldEZpZWxkU3RhdHVzKGZpZWxkUGF0aCk7XG4gICAgICAgIGlmKHN5bnRheCAmJiB2YWx1ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGZpZWxkU3RhdHVzLnZhbGlkLnN5bnRheCAmJiBmaWVsZFN0YXR1cy52YWxpZC52YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBpZihzeW50YXgpIHtcbiAgICAgICAgICAgIHJldHVybiBmaWVsZFN0YXR1cy52YWxpZC5zeW50YXhcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmllbGRTdGF0dXMudmFsaWQudmFsdWU7XG4gICAgfVxuXG5cbn1cbiIsImV4cG9ydCBjbGFzcyBQb2ludCB7XG4gICAgeDtcbiAgICB5O1xuICAgIGNvbnN0cnVjdG9yKHgseSl7XG4gICAgICAgIGlmKHggaW5zdGFuY2VvZiBQb2ludCl7XG4gICAgICAgICAgICB5PXgueTtcbiAgICAgICAgICAgIHg9eC54XG4gICAgICAgIH1lbHNlIGlmKEFycmF5LmlzQXJyYXkoeCkpe1xuICAgICAgICAgICAgeT14WzFdO1xuICAgICAgICAgICAgeD14WzBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMueD14O1xuICAgICAgICB0aGlzLnk9eTtcbiAgICB9XG5cbiAgICBtb3ZlVG8oeCx5KXtcbiAgICAgICAgaWYoQXJyYXkuaXNBcnJheSh4KSl7XG4gICAgICAgICAgICB5PXhbMV07XG4gICAgICAgICAgICB4PXhbMF07XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy54PXg7XG4gICAgICAgIHRoaXMueT15O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG5cbiAgICBtb3ZlKGR4LGR5KXsgLy9tb3ZlIGJ5IHZlY3RvclxuICAgICAgICBpZihBcnJheS5pc0FycmF5KGR4KSl7XG4gICAgICAgICAgICBkeT1keFsxXTtcbiAgICAgICAgICAgIGR4PWR4WzBdO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMueCs9ZHg7XG4gICAgICAgIHRoaXMueSs9ZHk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxufVxuIiwiaW1wb3J0IHtQb2ludH0gZnJvbSBcIi4vcG9pbnRcIjtcbmltcG9ydCB7VXRpbHN9IGZyb20gXCJzZC11dGlsc1wiO1xuaW1wb3J0IHtPYmplY3RXaXRoSWRBbmRFZGl0YWJsZUZpZWxkc30gZnJvbSBcIi4vb2JqZWN0LXdpdGgtaWQtYW5kLWVkaXRhYmxlLWZpZWxkc1wiO1xuXG5leHBvcnQgY2xhc3MgVGV4dCBleHRlbmRzIE9iamVjdFdpdGhJZEFuZEVkaXRhYmxlRmllbGRze1xuXG4gICAgdmFsdWU9Jyc7XG4gICAgbG9jYXRpb247IC8vUG9pbnRcblxuICAgIGNvbnN0cnVjdG9yKGxvY2F0aW9uLCB2YWx1ZSl7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMubG9jYXRpb249bG9jYXRpb247XG4gICAgICAgIGlmKCFsb2NhdGlvbil7XG4gICAgICAgICAgICB0aGlzLmxvY2F0aW9uID0gbmV3IFBvaW50KDAsMCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZih2YWx1ZSkge1xuICAgICAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgbW92ZVRvKHgseSl7IC8vbW92ZSB0byBuZXcgbG9jYXRpb25cbiAgICAgICAgdGhpcy5sb2NhdGlvbi5tb3ZlVG8oeCx5KTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuXG4gICAgbW92ZShkeCwgZHkpeyAvL21vdmUgYnkgdmVjdG9yXG4gICAgICAgIHRoaXMubG9jYXRpb24ubW92ZShkeCwgZHkpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9XG59XG4iLCJpbXBvcnQgKiBhcyBkb21haW4gZnJvbSAnLi9kb21haW4nXG5leHBvcnQge2RvbWFpbn1cbmV4cG9ydCAqIGZyb20gJy4vZGF0YS1tb2RlbCdcbmV4cG9ydCAqIGZyb20gJy4vdmFsaWRhdGlvbi1yZXN1bHQnXG4iLCJpbXBvcnQge1V0aWxzfSBmcm9tIFwic2QtdXRpbHNcIjtcblxuZXhwb3J0IGNsYXNzIFZhbGlkYXRpb25SZXN1bHR7XG5cblxuICAgIGVycm9ycyA9IHt9O1xuICAgIHdhcm5pbmdzID0ge307XG4gICAgb2JqZWN0SWRUb0Vycm9yPXt9O1xuXG4gICAgYWRkRXJyb3IoZXJyb3IsIG9iail7XG4gICAgICAgIGlmKFV0aWxzLmlzU3RyaW5nKGVycm9yKSl7XG4gICAgICAgICAgICBlcnJvciA9IHtuYW1lOiBlcnJvcn07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG5hbWUgPSBlcnJvci5uYW1lO1xuICAgICAgICB2YXIgZXJyb3JzQnlOYW1lID0gdGhpcy5lcnJvcnNbbmFtZV07XG4gICAgICAgIGlmKCFlcnJvcnNCeU5hbWUpe1xuICAgICAgICAgICAgZXJyb3JzQnlOYW1lPVtdO1xuICAgICAgICAgICAgdGhpcy5lcnJvcnNbbmFtZV09ZXJyb3JzQnlOYW1lO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvYmpFID0gdGhpcy5vYmplY3RJZFRvRXJyb3Jbb2JqLmlkXTtcbiAgICAgICAgaWYoIW9iakUpe1xuICAgICAgICAgICAgb2JqRT1bXTtcbiAgICAgICAgICAgIHRoaXMub2JqZWN0SWRUb0Vycm9yW29iai5pZF09IG9iakU7XG4gICAgICAgIH1cbiAgICAgICAgZXJyb3JzQnlOYW1lLnB1c2gob2JqKTtcbiAgICAgICAgb2JqRS5wdXNoKGVycm9yKTtcbiAgICB9XG5cbiAgICBhZGRXYXJuaW5nKG5hbWUsIG9iail7XG4gICAgICAgIHZhciBlID0gdGhpcy53YXJuaW5nc1tuYW1lXTtcbiAgICAgICAgaWYoIWUpe1xuICAgICAgICAgICAgZT1bXTtcbiAgICAgICAgICAgIHRoaXMud2FybmluZ3NbbmFtZV09ZTtcbiAgICAgICAgfVxuICAgICAgICBlLnB1c2gob2JqKVxuICAgIH1cblxuICAgIGlzVmFsaWQoKXtcbiAgICAgICAgcmV0dXJuIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRoaXMuZXJyb3JzKS5sZW5ndGggPT09IDBcbiAgICB9XG5cbiAgICBzdGF0aWMgY3JlYXRlRnJvbURUTyhkdG8pe1xuICAgICAgICB2YXIgdiA9IG5ldyBWYWxpZGF0aW9uUmVzdWx0KCk7XG4gICAgICAgIHYuZXJyb3JzID0gZHRvLmVycm9ycztcbiAgICAgICAgdi53YXJuaW5ncyA9IGR0by53YXJuaW5ncztcbiAgICAgICAgdi5vYmplY3RJZFRvRXJyb3IgPSBkdG8ub2JqZWN0SWRUb0Vycm9yO1xuICAgICAgICByZXR1cm4gdjtcbiAgICB9XG59XG4iLCJleHBvcnQgKiBmcm9tICcuL3NyYy9pbmRleCdcbiJdfQ==
