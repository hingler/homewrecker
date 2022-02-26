import { expect } from "chai";
import { RoofSegmentedCurveBuilder } from "../ts/curve/RoofSegmentedCurveBuilder";
import { ProceduralSegment } from "../ts/model/SegmentGenerator";

describe("RoofSegmentedCurveBuilder", function() {
  it("Generates a segment list", function() {
    const POINTS_EXPECTED = [
      0, -2,
      12, 10,
      10, 12,
      5, 7,
      0, 12,
      -2, 10,
      3, 5,
      -2, 0
    ];

    const ROOT_POINTS_EXPECTED = [
      0, 0,
      10, 10,
      10, 10,
      5, 5,
      0, 10,
      0, 10,
      5, 5,
      0, 0,
    ];

    const seg : ProceduralSegment = {
      parent: -1,
      start: [0, 0],
      end: [10, 10],
      startJoin: false,
      flat: false
    };

    const seg2 : ProceduralSegment = {
      parent: 0,
      start: [5, 5],
      end: [0, 10],
      startJoin: true,
      flat: false
    };

    const { points, roofPoints } = RoofSegmentedCurveBuilder.getSegmentList([ seg, seg2 ], Math.sqrt(2));

    console.log(points);
    
    console.log(points);
    console.log(roofPoints);

    expect(points.length).to.be.equal(16);
    expect(roofPoints.length).to.be.equal(16);

    for (let i = 0; i < 16; i++) {
      expect(points[i]).to.approximately(POINTS_EXPECTED[i], 0.0001);
      expect(roofPoints[i]).to.approximately(ROOT_POINTS_EXPECTED[i], 0.0001);
    }
  });
});