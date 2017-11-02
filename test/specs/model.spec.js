import {DataModel} from '../../src/data-model'
import * as domain from "../../src/domain";

describe("DataModel", () => {

    let dataModel;
    beforeAll(()=>{
        dataModel = new DataModel();
    });

    it("should allow additions of nodes", ()=>{
        let root = dataModel.addNode(new domain.DecisionNode());
        let edge1 = dataModel.addNode(new domain.ChanceNode(), root);
        let edge2 = dataModel.addNode(new domain.TerminalNode(), root);
        dataModel.addNode(new domain.TerminalNode(), edge1.childNode);

        expect(dataModel.getRoots().length).toEqual(1);
        expect(dataModel.nodes.length).toEqual(4);
        expect(dataModel.edges.length).toEqual(3);
    });

    it("should allow node removal", ()=>{

        let prevNodesNumber = dataModel.nodes.length;
        let nodeToRemove = dataModel.nodes[dataModel.nodes.length - 1];
        dataModel.removeNodes([nodeToRemove])
        expect(dataModel.nodes.length-prevNodesNumber).toEqual(-1)
    });

    it("should allow injection of nodes", ()=>{
        let edge = dataModel.edges[0];
        let prevChild = edge.childNode;
        let node = new domain.ChanceNode();
        dataModel.injectNode(node, edge);

        expect(edge.childNode).toEqual(node);
        expect(node.childEdges[0].childNode).toEqual(prevChild);

    });

    it("should allow clearing computed values", ()=>{
        expect(()=>dataModel.clearComputedValues()).not.toThrow();
        expect(dataModel.nodes.every(n=>!Object.keys(n.computed).length)).toBeTruthy();
        expect(dataModel.edges.every(e=>!Object.keys(e.computed).length)).toBeTruthy();
    });

    it("should allow clearing", ()=>{
        expect(()=>dataModel.clear()).not.toThrow();
        expect(dataModel.nodes.length).toEqual(0);
        expect(dataModel.edges.length).toEqual(0);
        expect(dataModel.texts.length).toEqual(0);
    });

    it("should allow loading of data", ()=>{
        let fixtures = jasmine.getFixtures();
        fixtures.fixturesPath = "base/test/data";

        let json = JSON.parse(readFixtures("mcdm2.json"));

        expect(()=>dataModel.load(json.data)).not.toThrow(); //TODO
    });

    it("should allow cloning and attachement of subtrees", ()=>{ //TODO better checks
        let root = dataModel.getRoots()[0];
        let prevChildNo = root.childEdges.length;
        let copied = dataModel.cloneSubtree(root.childEdges[4].childNode, true);

        dataModel.attachSubtree(copied, root);
        expect(root.childEdges.length).toEqual(prevChildNo+1)
    });

    it("should allow saving state and undo/redo", ()=>{
        let prevNodesNumber = dataModel.nodes.length;

        dataModel.saveState();

        dataModel.removeNodes(dataModel.getRoots());
        dataModel.undo();
        expect(dataModel.nodes.length).toEqual(prevNodesNumber);
        dataModel.redo();
        expect(dataModel.nodes.length).toEqual(0)
    });
});
