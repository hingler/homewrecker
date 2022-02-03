import { vec2, vec3 } from "gl-matrix";
import { Segment } from "../segment/Segment";
import { RoofNormalGenerator } from "./internal/roof/RoofNormalGenerator";
import { RoofPositionGenerator } from "./internal/roof/RoofPositionGenerator";
import { RoofTangentGenerator } from "./internal/roof/RoofTangentGenerator";
import { RoofTexcoordGenerator } from "./internal/roof/RoofTexcoordGenerator";
import { ReadWriteBuffer } from "nekogirl-valhalla/buffer/ReadWriteBuffer";
import { HouseBufferData } from "./internal/HouseBufferData";
import { RoofSegmentedCurveBuilder } from "../curve/RoofSegmentedCurveBuilder";

const PROPERTY_LIST = ["longMinus", "longPlus", "shortEnd", "shortStart"];

export class RoofGenerator {
  /**
   * Generates a new roof!
   * @param segmentList - list of segments to generate from
   * @param height - height of the peak of our roof, with 0 representing its base
   * @param extrude - how far outwards to build the roof from our segmentlist.
   * @returns a pair of ReadWriteBuffers containing the vertex data and the index data respectively.
   *          data is returned according to this specification:
   *          - position: 3 float components, 0b offset
   *          - normal:   3 float components, 12b offset
   *          - texcoord: 2 float components, 24b offset
   *          - tangent:  3 float components: 32b offset
   *          - 44b stride
   *          index data:
   *            unsigned short components.
   */
  static generateRoof(segmentList: Array<Segment>, height: number, extrude: number, yOffset: number, texScale?: number) {
    // todo: add depth param
    const res = new ReadWriteBuffer();
    const resIndex = new ReadWriteBuffer();
    let offset = 0;
    let index = 0;
    let indexOffset = 0;

    let scale = 999999999;
    if (texScale === undefined) {
      for (let segment of segmentList) {
        scale = Math.min(scale, RoofTexcoordGenerator.getTexScale(segment, height, extrude));
      }
    } else {
      scale = texScale;
    }

    const curve = RoofSegmentedCurveBuilder.getSegmentList(segmentList, extrude);

    const positions = RoofPositionGenerator.generateRoofPositionsFromCurve(curve.points, curve.roofPoints, height, yOffset);
    const normals = RoofNormalGenerator.generateRoofNormalsFromCurve(curve.points, curve.roofPoints, height);
    const tangents = RoofTangentGenerator.generateRoofTangentsFromCurve(curve.points);
    const texcoords = RoofTexcoordGenerator.generateRoofTexcoordsFromCurve(curve.points, curve.roofPoints, height, extrude, texScale);

    const faces = Math.round(positions.length);

    let vertexCount = 0;

    for (let k = 0; k < faces; k++) {
      const pos = positions[k];
      const norm = normals[k];
      const tan = tangents[k];
      const tex = texcoords[k];

      const vertices = Math.round(pos.length / 3);

      for (let i = 0; i < vertices; i++) {
        for (let j = 0; j < 3; j++) {
          res.setFloat32(offset, pos[3 * i + j], true);
          offset += 4;
        }

        for (let j = 0; j < 3; j++) {
          res.setFloat32(offset, norm[j], true);
          offset += 4;
        }

        for (let j = 0; j < 2; j++) {
          res.setFloat32(offset, tex[2 * i + j], true);
          offset += 4;
        }

        for (let j = 0; j < 3; j++) {
          res.setFloat32(offset, tan[j], true);
          offset += 4;
        }
      }

      resIndex.setUint16(indexOffset, vertexCount, true);
      indexOffset += 2;

      resIndex.setUint16(indexOffset, vertexCount + 1, true);
      indexOffset += 2;

      resIndex.setUint16(indexOffset, vertexCount + 2, true);
      indexOffset += 2;

      if (vertices > 3) {
        resIndex.setUint16(indexOffset, vertexCount + 2, true);
        indexOffset += 2;

        resIndex.setUint16(indexOffset, vertexCount + 3, true);
        indexOffset += 2;

        resIndex.setUint16(indexOffset, vertexCount, true);
        indexOffset += 2;
      }

      vertexCount += vertices;
    }

    const dataRes = new HouseBufferData();
    dataRes.geometry = res;
    dataRes.index = resIndex;

    dataRes.vertices = vertexCount;
    dataRes.indices = Math.round(indexOffset / 2);

    return dataRes;
  }
}