import { ReadonlyVec2, ReadonlyVec3, vec3 } from "gl-matrix";
import { ReadWriteBuffer } from "nekogirl-valhalla/buffer/ReadWriteBuffer";
import { Segment } from "../segment/Segment";
import { BodyNormalGenerator } from "./internal/body/BodyNormalGenerator";
import { BodyPositionGenerator } from "./internal/body/BodyPositionGenerator";
import { BodyTangentGenerator } from "./internal/body/BodyTangentGenerator";
import { BodyTexcoordGenerator } from "./internal/body/BodyTexcoordGenerator";
import { HouseBufferData } from "./internal/HouseBufferData";

export class BodyGenerator {
  static generateBody(segmentList: Array<Segment>, height: number, extrude: number) {
    // positions: very easy
    //  it's a cube with no top and no bottom, we need to specify each face
    // tangents: very easy
    // normals: very easy
    // texcoords: a bit less easy
    // we can use the same texcoords for the short and long faces probably

    // faces have an offset and a tangent
    // offset = normal
    // one tangent is always up, the other we define

    const res = new ReadWriteBuffer();
    const resIndex = new ReadWriteBuffer();

    let offset = 0;
    let index = 0;
    let indexOffset = 0;

    let vertCount = 0;

    for (let segment of segmentList) {
      const positions = BodyPositionGenerator.generateBodyPositions(segment, height, extrude);
      const normals = BodyNormalGenerator.generateBodyNormals(segment, height, extrude);
      const texcoords = BodyTexcoordGenerator.generateBodyTexcoords(segment, height, extrude);
      const tangents = BodyTangentGenerator.generateBodyTangents(segment);

      for (let i = 0; i < 16; i++) {
        for (let j = 0; j < 3; j++) {
          res.setFloat32(offset, positions[3 * i + j], true);
          offset += 4;
        }

        for (let j = 0; j < 3; j++) {
          res.setFloat32(offset, normals[3 * i + j], true);
          offset += 4;
        }

        for (let j = 0; j < 2; j++) {
          res.setFloat32(offset, texcoords[2 * i + j], true);
          offset += 4;
        }

        for (let j = 0; j < 3; j++) {
          res.setFloat32(offset, tangents[3 * i + j], true);
          offset += 4;
        }

        vertCount++;
      } 

      for (let i = 0; i < 4; i++) {
        // set indices
        resIndex.setUint16(indexOffset, index, true);
        indexOffset += 2;

        resIndex.setUint16(indexOffset, index + 1, true);
        indexOffset += 2;

        resIndex.setUint16(indexOffset, index + 2, true);
        indexOffset += 2;

        resIndex.setUint16(indexOffset, index + 2, true);
        indexOffset += 2;

        resIndex.setUint16(indexOffset, index + 3, true);
        indexOffset += 2;

        resIndex.setUint16(indexOffset, index, true);
        indexOffset += 2;

        index += 4;
      }
    }

    const dataRes = new HouseBufferData();
    dataRes.geometry = res;
    dataRes.index = resIndex;

    dataRes.vertices = vertCount;
    dataRes.indices = Math.round(indexOffset / 2);

    return dataRes;
  }
}