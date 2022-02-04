import { ReadonlyVec2, ReadonlyVec3, vec3 } from "gl-matrix";
import { ReadWriteBuffer } from "nekogirl-valhalla/buffer/ReadWriteBuffer";
import { RoofSegmentedCurveBuilder } from "../curve/RoofSegmentedCurveBuilder";
import { Segment } from "../segment/Segment";
import { BodyNormalGenerator } from "./internal/body/BodyNormalGenerator";
import { BodyPositionGenerator } from "./internal/body/BodyPositionGenerator";
import { BodyTangentGenerator } from "./internal/body/BodyTangentGenerator";
import { BodyTexcoordGenerator } from "./internal/body/BodyTexcoordGenerator";
import { HouseBufferData } from "./internal/HouseBufferData";
import { ProceduralSegment } from "./SegmentGenerator";

export class BodyGenerator {
  static generateBody(segmentList: Array<Segment>, height: number, extrude: number, texScale?: number) {
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

    let scale = (texScale !== undefined ? texScale : 999999999);
    if (texScale === undefined) {
      for (let segment of segmentList) {
        scale = Math.min(scale, BodyTexcoordGenerator.getTexScale(segment, height, extrude));
      }
    }

    const curve = RoofSegmentedCurveBuilder.getSegmentList(segmentList, extrude);

    const positions = BodyPositionGenerator.generateBodyPositionsFromCurve(curve.points, height);
    const normals = BodyNormalGenerator.generateBodyTangentsFromCurve(curve.points);
    const tangents = BodyTangentGenerator.generateBodyTangentsFromCurve(curve.points);
    const texcoords = BodyTexcoordGenerator.generateBodyTexcoordsFromCurve(curve.points, height, texScale);

    const vertices = Math.round(positions.length / 3);

    for (let i = 0; i < vertices; i++) {
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
    }

    for (let i = 0; i < vertices; i += 4) {
      resIndex.setUint16(indexOffset, i, true);
      indexOffset += 2;

      resIndex.setUint16(indexOffset, i + 1, true);
      indexOffset += 2;

      resIndex.setUint16(indexOffset, i + 2, true);
      indexOffset += 2;

      resIndex.setUint16(indexOffset, i + 2, true);
      indexOffset += 2;

      resIndex.setUint16(indexOffset, i + 3, true);
      indexOffset += 2;

      resIndex.setUint16(indexOffset, i, true);
      indexOffset += 2;
    }

    const dataRes = new HouseBufferData();
    dataRes.geometry = res;
    dataRes.index = resIndex;

    dataRes.vertices = vertices;
    dataRes.indices = Math.round(indexOffset / 2);

    return dataRes;
  }
}