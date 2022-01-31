import { expect } from "chai";
import { vec3 } from "gl-matrix";
import { RoofNormalGenerator } from "../ts/model/internal/roof/RoofNormalGenerator";
import { RoofTangentGenerator } from "../ts/model/internal/roof/RoofTangentGenerator";
import { Segment } from "../ts/segment/Segment";


describe("RoofTangentGenerator", function() {
  it("Should return one data entry per defined face", function() {
    const testSegment : Segment = {
      start: [0, 0],
      end: [10, 0],
      flat: false,
      startJoin: false
    };

    let res = RoofTangentGenerator.generateRoofTangents(testSegment, 4, 4);
    expect(res.longMinus.length).to.equal(3);
    expect(res.longPlus.length).to.equal(3);
    expect(res.shortStart.length).to.equal(3);
    expect(res.shortEnd.length).to.equal(3);

    testSegment.flat = true;

    res = RoofTangentGenerator.generateRoofTangents(testSegment, 4, 4);
    expect(res.longMinus.length).to.equal(3);
    expect(res.longPlus.length).to.equal(3);
    expect(res.shortStart).to.be.null;
    expect(res.shortEnd).to.be.null;

    testSegment.flat = false;
    testSegment.startJoin = true;

    res = RoofTangentGenerator.generateRoofTangents(testSegment, 4, 4);
    expect(res.longMinus.length).to.equal(3);
    expect(res.longPlus.length).to.equal(3);
    expect(res.shortStart).to.be.null;
    expect(res.shortEnd.length).to.equal(3);
  });

  it("Should return tangents which are orthogonal to normals", function() {
    const testSegment : Segment = {
      start: [10, 10],
      end: [0, 0],
      flat: false,
      startJoin: false
    };

    for (let h = 0; h < 20; h++) {
      testSegment.end[1] = h;
      for (let e = 0.5; e < 10; e += 0.5) {
        let normData = RoofNormalGenerator.generateRoofNormals(testSegment, 4, 4);
        let tanData = RoofTangentGenerator.generateRoofTangents(testSegment, 4, 4);

        const norm = [normData.longMinus, normData.longPlus, normData.shortStart, normData.shortEnd];
        const tan = [tanData.longMinus, tanData.longPlus, tanData.shortStart, tanData.shortEnd];
        
        for (let i = 0; i < 4; i++) {
          const normal = norm[i] as vec3;
          const tangent = tan[i] as vec3;

          expect(vec3.dot(normal, tangent)).to.approximately(0, 0.0001);
        }
      }
    }
  });

  it("Should return normalized tangents", function() {
    const testSegment : Segment = {
      start: [0, 0],
      end: [10, 0],
      flat: false,
      startJoin: false
    };

    for (let g = 0.5; g < 15; g += 0.5) {
      const tanData = RoofTangentGenerator.generateRoofTangents(testSegment, g, 3);
  
      const tan = [tanData.longMinus, tanData.longPlus, tanData.shortStart, tanData.shortEnd];
      for (let h = 0; h < 4; h++) {
        for (let i = 0; i < tan[h].length; i += 3) {
          const v : vec3 = [tan[h][i], tan[h][i + 1], tan[h][i + 2]];
          expect(vec3.length(v)).to.approximately(1.0, 0.0001);
        }
      }
    }
  })
})