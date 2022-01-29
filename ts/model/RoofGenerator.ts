import { vec2, vec3 } from "gl-matrix";
import { Segment } from "ts/segment/Segment";
import { RoofNormalGenerator } from "./internal/RoofNormalGenerator";
import { RoofPolyData } from "./internal/RoofPolyData";
import { RoofPositionGenerator } from "./internal/RoofPositionGenerator";
import { RoofTangentGenerator } from "./internal/RoofTangentGenerator";
import { RoofTexcoordGenerator } from "./internal/RoofTexcoordGenerator";
import { ReadWriteBuffer } from "nekogirl-valhalla/buffer/ReadWriteBuffer";
import { BufferData } from "./internal/BufferData";

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
  static generateRoof(segmentList: Array<Segment>, height: number, extrude: number) {
    // todo: add depth param
    const res = new ReadWriteBuffer();
    const resIndex = new ReadWriteBuffer();
    let offset = 0;
    let index = 0;
    let indexOffset = 0;

    for (let segment of segmentList) {
      const positions = RoofPositionGenerator.generateRoofPositions(segment, height, extrude);
      const normals = RoofNormalGenerator.generateRoofNormals(segment, height, extrude);
      const texcoords = RoofTexcoordGenerator.generateRoofTexcoords(segment, height, extrude);
      const tangents = RoofTangentGenerator.generateRoofTangents(segment, height, extrude);

      for (let property of PROPERTY_LIST) {
        const posData = positions[property] as Array<number>;
        const normData = normals[property] as Array<number>;
        const texcoordData = texcoords[property] as Array<number>;
        const tangentData = tangents[property] as Array<number>;
        for (let i = 0; i < Math.floor(posData.length / 3); i++) {
          for (let j = 0; j < 3; j++) {
            res.setFloat32(offset, posData[3 * i + j], true);
            offset += 4; 
          }

          for (let j = 0; j < 3; j++) {
            res.setFloat32(offset, normData[j], true);
            offset += 4;
          }

          for (let j = 0; j < 2; j++) {
            res.setFloat32(offset, texcoordData[2 * i + j], true);
            offset += 4;
          }

          for (let j = 0; j < 3; j++) {
            res.setFloat32(offset, tangentData[j], true);
            offset += 4;
          }
        }

        // encode indices
        // 012
        // if quad: 230
        resIndex.setUint16(indexOffset, index, true);
        indexOffset += 2;

        resIndex.setUint16(indexOffset, index + 1, true);
        indexOffset += 2;

        resIndex.setUint16(indexOffset, index + 2, true);
        indexOffset += 2;

        
        if (posData.length > 9) {
          // quad
          resIndex.setUint16(indexOffset, index + 2, true);
          indexOffset += 2;

          resIndex.setUint16(indexOffset, index + 3, true);
          indexOffset += 2;

          resIndex.setUint16(indexOffset, index, true);
          indexOffset += 2;
        
          index++;
        }

        index += 3;
      }
    }
    return {
      geometry: res,
      index: resIndex
    } as BufferData;
  }
}