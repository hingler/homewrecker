import { expect } from "chai";
import { vec2, vec3 } from "gl-matrix";
import { RoofPositionGenerator } from "../ts/model/internal/RoofPositionGenerator";
import { RoofTexcoordGenerator } from "../ts/model/internal/RoofTexcoordGenerator";
import { Segment } from "../ts/segment/Segment";

describe("RoofTexcoordGenerator", function() {
  it("Should return appropriate amount of data", function() {
    const testSegment : Segment = {
      start: [0, 0],
      end: [10, 0],
      flat: false,
      startJoin: false
    };

    for (let g = 0.5; g < 15; g += 0.5) {
      for (let h = 1.0; h < 12.0; h += 0.5) {
        const texData = RoofTexcoordGenerator.generateRoofTexcoords(testSegment, h, g);
        expect(texData.longMinus.length).to.equal(8);
        expect(texData.longPlus.length).to.equal(8);
        expect(texData.shortEnd.length).to.equal(6);
        expect(texData.shortStart.length).to.equal(6);
      }
    }
  });

  it("Should remain bounded within the range [0, 1]", function() {
    const testSegment : Segment = {
      start: [0, 0],
      end: [10, 0],
      flat: false,
      startJoin: false
    };

    for (let g = 0.5; g < 15; g += 0.5) {
      for (let h = 1.0; h < 12.0; h += 0.5) {
        const texData = RoofTexcoordGenerator.generateRoofTexcoords(testSegment, h, g);
        for (let data of [texData.longMinus, texData.longPlus, texData.shortStart, texData.shortEnd]) {
          for (let i = 0; i < data.length; i++) {
            expect(data[i]).to.be.lessThan(1);
            expect(data[i]).to.be.greaterThan(0);
          }
        }
      }
    }
  });

  it("Should exhibit side-length similarity with the position model", function() {
    const testSegment : Segment = {
      start: [10, 10],
      end: [0, 0],
      flat: false,
      startJoin: false
    };

    for (let h = 0; h < 20; h++) {
      testSegment.end[1] = h;
      for (let e = 0.5; e < 10; e += 0.5) {
        const posData = RoofPositionGenerator.generateRoofPositions(testSegment, 5, e);
        const texData = RoofTexcoordGenerator.generateRoofTexcoords(testSegment, 5, e);

        // determine a ratio between point lengths
        let ratio = -1;
        // 😎
        const pos = [posData.longMinus, posData.longPlus, posData.shortStart, posData.shortEnd];
        const tex = [texData.longMinus, texData.longPlus, texData.shortStart, texData.shortEnd];
        
        const temp = vec3.create();
        const temp2 = vec3.create();

        const temp3 = vec2.create();
        const temp4 = vec2.create();
        
        for (let i = 0; i < 4; i++) {
          const posVert = pos[i];
          const texVert = tex[i];

          for (let j = 0; j < Math.floor(posVert.length / 3); j++) {
            const posOffset = j * 3;
            const texOffset = j * 2;

            for (let k = 0; k < 3; k++) {
              temp[k] = posVert[posOffset + k];
              temp2[k] = posVert[(posOffset + 3 + k) % posVert.length];
            }

            for (let k = 0; k < 2; k++) {
              temp3[k] = texVert[texOffset + k];
              temp4[k] = texVert[(texOffset + 2 + k) % texVert.length];
            }

            vec3.sub(temp, temp2, temp);
            vec2.sub(temp3, temp3, temp4);

            const posLength = vec3.length(temp);
            const texLength = vec2.length(temp3);

            if (ratio < 0) {
              ratio = posLength / texLength;
            } else {
              expect(posLength / texLength).to.be.approximately(ratio, 0.001);
            }
          }
        }
      }
    }
  })
})