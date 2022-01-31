import { RoofGenerator } from "homewrecker/ts-out/ts/model/RoofGenerator";
import { Segment } from "homewrecker/ts/segment/Segment";

describe("RoofGenerator", function() {
  it("Doesn't crash when face is missing", function() {
    const testSegment : Segment = {
      start: [0, 0],
      end: [10, 0],
      flat: false,
      startJoin: true
    };

    RoofGenerator.generateRoof([testSegment], 0.5, 0.5);
  })
})