import { expect } from "chai";
import { vec3 } from "gl-matrix";
import { RoofNormalGenerator } from "../ts/model/internal/roof/RoofNormalGenerator";
import { RoofPositionGenerator } from "../ts/model/internal/roof/RoofPositionGenerator";
import { Segment } from "../ts/segment/Segment";


describe("RoofNormalGenerator", function() {
  it("Generates proper length results", function() {
    const testSegment : Segment = {
      start: [0, 0],
      end: [10, 0],
      flat: false,
      startJoin: false
    };

    const normData = RoofNormalGenerator.generateRoofNormals(testSegment, 0, 5);

    expect(normData.longMinus.length).to.equal(3);
    expect(normData.longPlus.length).to.equal(3);
    expect(normData.shortStart.length).to.equal(3);
    expect(normData.shortEnd.length).to.equal(3);
  });

  it("Returns normals that are close enough to cross products", function() {
    const testSegment : Segment = {
      start: [0, 0],
      end: [10, 0],
      flat: false,
      startJoin: false
    };
    for (let g = 0.5; g < 15; g += 0.5) {
      testSegment.end[1] = g;
      const posData = RoofPositionGenerator.generateRoofPositions(testSegment, g, 3);
      const normData = RoofNormalGenerator.generateRoofNormals(testSegment, g, 3);
  
      const pos = [posData.longMinus, posData.longPlus, posData.shortStart, posData.shortEnd];
      const norm = [normData.longMinus, normData.longPlus, normData.shortStart, normData.shortEnd];
      const temp = vec3.create();
      const temp2 = vec3.create();
      const temp3 = vec3.create();
      for (let h = 0; h < 4; h++) {
        let facePos = pos[h];
        let faceNorm = norm[h];
        for (let i = 0; i < 3; i++) {
          temp[i] = facePos[i];
          temp2[i] = facePos[3 + i];
          temp3[i] = facePos[6 + i];
        }
  
        vec3.sub(temp, temp, temp2);
        vec3.sub(temp2, temp3, temp2);
        vec3.cross(temp3, temp2, temp);
        vec3.normalize(temp3, temp3);
  
        vec3.copy(temp2, faceNorm as [number, number, number]);
        for (let i = 0; i < 3; i++) {
          expect(temp3[i]).to.approximately(temp2[i], 0.0001);
        }
      }
    }
  });

  it("Returns normalized normals", function() {
    const testSegment : Segment = {
      start: [0, 0],
      end: [10, 0],
      flat: false,
      startJoin: false
    };

    for (let g = 0.5; g < 15; g += 0.5) {
      const normData = RoofNormalGenerator.generateRoofNormals(testSegment, g, 3);
  
      const norm = [normData.longMinus, normData.longPlus, normData.shortStart, normData.shortEnd];
      for (let h = 0; h < 4; h++) {
        for (let i = 0; i < norm[h].length; i += 3) {
          const v : vec3 = [norm[h][i], norm[h][i + 1], norm[h][i + 2]];
          expect(vec3.length(v)).to.approximately(1.0, 0.0001);
        }
      }
    }
  })
});