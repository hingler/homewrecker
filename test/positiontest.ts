import { expect } from "chai";
import { vec2, vec3 } from "gl-matrix";
import { RoofPositionGenerator } from "../ts/model/internal/roof/RoofPositionGenerator";
import { Segment } from "../ts/segment/Segment";

function getMinDistance(data: Segment, point: vec2) {
  const temp = vec2.create();
  vec2.sub(temp, point, data.start);
  let min = vec2.length(temp);
  vec2.sub(temp, point, data.end);
  min = Math.min(min, vec2.length(temp));
  return min;
}

describe("RoofPositionGenerator", function() {
  it("Should generate proper number of verts for each face type", function() {
    const testSegment : Segment = {
      start: [0, 0],
      end: [5, 5],
      flat: false,
      startJoin: false
    };

    const posData = RoofPositionGenerator.generateRoofPositions(testSegment, 3, 5);

    expect(posData.longMinus.length).to.equal(12);
    expect(posData.longPlus.length).to.equal(12);
    expect(posData.shortStart.length).to.equal(9);
    expect(posData.shortEnd.length).to.equal(9);
  });

  it("Should not generate end tris when flat", function() {
    const testSegment : Segment = {
      start: [0, 0],
      end: [5, 5],
      flat: true,
      startJoin: true
    };

    const posData = RoofPositionGenerator.generateRoofPositions(testSegment, 3, 5);
    expect(posData.shortEnd).to.be.null;
    expect(posData.shortStart).to.be.null;
  });

  it("Should truncate the starting geom when startJoin is set to true", function() {
    const testSegment : Segment = {
      start: [0.1, 0.1],
      end: [5.1, 5.1],
      flat: false,
      startJoin: true
    };

    // we should not find any points whose xy coordinate is less than 0
    const posData = RoofPositionGenerator.generateRoofPositions(testSegment, 3, 5);
    for (let i = 0; i < 12; i += 3) {
      let temp = [posData.longMinus[i], posData.longMinus[i + 1], posData.longMinus[i + 2]];
      expect(temp[0]).to.be.greaterThan(0.0);
      expect(temp[2]).to.be.greaterThan(0.0);

      temp = [posData.longPlus[i], posData.longPlus[i + 1], posData.longPlus[i + 2]];
      expect(temp[0]).to.be.greaterThan(0.0);
      expect(temp[2]).to.be.greaterThan(0.0);
    }
  });

  it("Should respect direction of height", function() {
    const testSegment : Segment = {
      start: [0, 0],
      end: [15, 15],
      flat: false, 
      startJoin: false
    };

    const posData = RoofPositionGenerator.generateRoofPositions(testSegment, 3, 5);
    const pos = [posData.longMinus, posData.longPlus, posData.shortStart, posData.shortEnd];
    for (let data of pos) {
      for (let i = 1; i < data.length; i += 3) {
        expect(data[i]).to.be.greaterThanOrEqual(0);
      }
    }
  });

  it("Should obey our extrusion requirements", function() {
    // every point on every poly should either be on a point, (extrude) away from a point, or (sqrt(2) * extrude) away
    const testSegment : Segment = {
      start: [0, 0],
      end: [15, 15],
      flat: false, 
      startJoin: false
    };


    for (let j = 1; j < 24; j++) {

      let EXTRUDE_DISTANCE = j * 0.5;
      const posData = RoofPositionGenerator.generateRoofPositions(testSegment, 3, EXTRUDE_DISTANCE);
      for (let i = 0; i < 12; i += 3) {
        let temp = [posData.longMinus[i], posData.longMinus[i + 2]] as [number, number];
        let temp2 = [posData.longPlus[i], posData.longPlus[i + 2]] as [number, number];
  
        let minTemp = getMinDistance(testSegment, temp);
        let minTemp2 = getMinDistance(testSegment, temp2);
  
        // zero case
        let tempValid = (minTemp < 0.001);
        tempValid ||= (Math.abs(minTemp - EXTRUDE_DISTANCE) < 0.0001);
        tempValid ||= (Math.abs(minTemp - Math.SQRT2 * EXTRUDE_DISTANCE) < 0.0001);
  
        expect(tempValid).to.be.true;
  
        tempValid = (minTemp2 < 0.001);
        tempValid ||= (Math.abs(minTemp2 - EXTRUDE_DISTANCE) < 0.0001);
        tempValid ||= (Math.abs(minTemp2 - Math.SQRT2 * EXTRUDE_DISTANCE) < 0.0001);
  
        expect(tempValid).to.be.true;
      }
    }
  });

  it("Should obey our height requirements", function() {
    const testSegment : Segment = {
      start: [0, 0],
      end: [15, 15],
      flat: false, 
      startJoin: false
    };


    for (let j = 1; j < 24; j++) {

      let ROOF_HEIGHT = j * 0.5;
      const EXTRUDE_DISTANCE = 5;
      const posData = RoofPositionGenerator.generateRoofPositions(testSegment, ROOF_HEIGHT, EXTRUDE_DISTANCE);
      for (let i = 0; i < 12; i += 3) {
        let temp = [posData.longMinus[i], posData.longMinus[i + 2]] as [number, number];
        let temp2 = [posData.longPlus[i], posData.longPlus[i + 2]] as [number, number];

        let tempHeight = posData.longMinus[i + 1];
        let tempHeight2 = posData.longPlus[i + 1];
  
        let minTemp = getMinDistance(testSegment, temp);
        let minTemp2 = getMinDistance(testSegment, temp2);
  
        if (minTemp < (EXTRUDE_DISTANCE / 2)) {
          expect(tempHeight).to.approximately(ROOF_HEIGHT, 0.0001);
        } else {
          expect(tempHeight).to.approximately(0, 0.00001);
        }

        if (minTemp2 < (EXTRUDE_DISTANCE / 2)) {
          expect(tempHeight2).to.approximately(ROOF_HEIGHT, 0.0001);
        } else {
          expect(tempHeight2).to.approximately(0, 0.00001);
        }
      }
    }
  })

  it("Should generate flat quads", function() {
    // use normalized cross product to ensure everything is coplanar
    // cross products of sides moving ccw should line up

    const testSegment : Segment = {
      start: [0, 0],
      end: [5, 5],
      flat: false,
      startJoin: false
    }

    // todo: merging roof segments which bump into eachother?
    // avoid that condition for now :3
    const pos = RoofPositionGenerator.generateRoofPositions(testSegment, 3, 5);
    
    const temp = vec3.create();
    const temp2 = vec3.create();
    const temp3 = vec3.create();

    
    for (let face of [pos.longMinus, pos.longPlus]) {
      // check corners
      let crossExpected = null;
      expect(face.length).to.equal(12);
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
          temp[j] = face[(3 * i + j) % 12];
          temp2[j] = face[(3 * (i + 1) + j) % 12];
          temp3[j] = face[(3 * (i + 2) + j) % 12];
        }

        vec3.sub(temp, temp, temp2);
        vec3.sub(temp2, temp3, temp2);

        vec3.normalize(temp, temp);
        vec3.normalize(temp2, temp2);

        if (!crossExpected) {
          crossExpected = vec3.create();
          vec3.cross(crossExpected, temp, temp2);
        }

        vec3.cross(temp3, temp, temp2);
        for (let j = 0; j < 3; j++) {
          expect(temp3[j]).to.approximately(crossExpected[j], 0.0001);
        }
      }
    }
  });
});