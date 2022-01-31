import { expect } from "chai";
import { RoofGenerator } from "../ts/model/RoofGenerator";
import { Segment } from "../ts/segment/Segment";

describe("RoofGenerator", function() {
  it("Has the length we would expect", function() {
    const testSegment : Segment = {
      start: [0, 0],
      end: [10, 10],
      flat: false,
      startJoin: false
    };

    const roof = RoofGenerator.generateRoof([testSegment], 5, 5, 0);
    // should have 14 vertices and 18 indices
    expect(roof.geometry).to.not.be.undefined;
    expect(roof.index).to.not.be.undefined;
    expect(roof.geometry.size()).to.equal(616); // 44 bytes per vertex * 14 vertices
    expect(roof.index.size()).to.equal(36); // 6 tris * 3 points * 2 bytes per index
  });
});