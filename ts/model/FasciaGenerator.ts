import { vec3 } from "gl-matrix";
import { ReadWriteBuffer } from "nekogirl-valhalla/buffer/ReadWriteBuffer";
import { RoofSegmentedCurveBuilder } from "../../curve/RoofSegmentedCurveBuilder";
import { Segment } from "../../segment/Segment";
import { HouseOptions } from "./HouseGenerator";
import { HouseBufferData } from "./internal/HouseBufferData";

// generates the bits on the side of the house :D
export class FasciaGenerator {
  static generateFascia(segmentList: Array<Segment>, extrude: number, yOffset: number, opts?: HouseOptions) {
    const dataRes = new HouseBufferData();

    let res : ReadWriteBuffer = undefined;
    let resIndex : ReadWriteBuffer = undefined;
    let offset = 0;
    let indexOffset = 0;
    
    
    const curve = RoofSegmentedCurveBuilder.getSegmentList(segmentList, extrude);
    
    if (opts) {
      if (opts.bufferGeom) {
        res = opts.bufferGeom.buffer;
        offset = opts.bufferGeom.offset;
      }
  
      if (opts.bufferIndex) {
        resIndex = opts.bufferIndex.buffer;
        indexOffset = opts.bufferIndex.offset;
      }
    }

    if (!res) {
      res = new ReadWriteBuffer();
    }

    if (!resIndex) {
      resIndex = new ReadWriteBuffer();
    }

    dataRes.start = offset;
    dataRes.startIndex = indexOffset;

    const thickness = (opts.thicknessRoof || 0.05);
    const positions = this.generateFasciaPositionsFromCurve(curve.points, yOffset, thickness);
    const normals = this.generateFasciaNormalsFromCurve(curve.points);
    const tangents = this.generateFasciaTangentsFromCurve(curve.points);
    const texcoords = this.generateFasciaTexcoordsFromCurve(curve.points);

    const faces = Math.round(positions.length);

    let vertexCount = 0;
    let indexCount = 0;

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

      indexCount += 3;

      if (vertices > 3) {
        resIndex.setUint16(indexOffset, vertexCount + 2, true);
        indexOffset += 2;

        resIndex.setUint16(indexOffset, vertexCount + 3, true);
        indexOffset += 2;

        resIndex.setUint16(indexOffset, vertexCount, true);
        indexOffset += 2;
        indexCount += 3;
      }

      vertexCount += vertices;
    }

    dataRes.geometry = res;
    dataRes.index = resIndex;

    dataRes.vertices = vertexCount;
    dataRes.indices = indexCount;

    dataRes.offset = offset;
    dataRes.indexOffset = indexOffset;

    return dataRes;
    
  }

  static generateFasciaPositionsFromCurve(points: Array<number>, yOffset: number, thickness: number) {
    const res : Array<Array<number>> = [];
    const start = vec3.create();
    const end = vec3.create();
    
    for (let i = 0; i < points.length; i += 2) {
      const indStart = i;
      const indEnd = (i + 2) % points.length;

      start[0] = points[indStart];
      start[2] = points[indStart + 1];
      end[0]   = points[indEnd];
      end[2]   = points[indEnd + 1];

      const data = [] as Array<number>;

      end[1] = yOffset - thickness;
      data.push(...end);

      start[1] = yOffset - thickness;
      data.push(...start);

      start[1] = yOffset;
      data.push(...start);

      end[1] = yOffset;
      data.push(...end);
      res.push(data);
    }

    return res;
  }

  static generateFasciaNormalsFromCurve(points: Array<number>) {
    const res : Array<vec3> = [];
    const start = vec3.create();
    const end = vec3.create();
    const temp = vec3.create();
    
    for (let i = 0; i < points.length; i += 2) {
      const indStart = i;
      const indEnd = (i + 2) % points.length;

      start[0] = points[indStart];
      start[2] = points[indStart + 1];
      end[0]   = points[indEnd];
      end[2]   = points[indEnd + 1];

      vec3.sub(temp, end, start);
      vec3.normalize(temp, temp);

      vec3.cross(temp, [0, 1, 0], temp);

      res.push([...temp] as vec3);
    }

    return res;
  }

  static generateFasciaTexcoordsFromCurve(points: Array<number>) {
    const res : Array<Array<number>> = [];
    for (let i = 0; i < points.length; i += 2) {
      const data : Array<number> = [];
      // copy from corner pieces
      // flat color for now -- if need be we can make bounding boxes
      // (todo tomorrow :D)

      data.push(0, 0);
      data.push(1, 0);
      data.push(1, 0);
      data.push(0, 1);
      res.push(data);
    }

    return res;
  }

  static generateFasciaTangentsFromCurve(points: Array<number>) {
    const start = vec3.create();
    const end = vec3.create();
    const temp = vec3.create();

    const res = [] as Array<vec3>;

    for (let i = 0; i < points.length; i += 2) {
      const indStart = i;
      const indEnd = (i + 2) % points.length;

      start[0] = points[indStart];
      start[2] = points[indStart + 1];
      end[0]   = points[indEnd];
      end[2]   = points[indEnd + 1];

      vec3.sub(temp, end, start);
      vec3.normalize(temp, temp);
      res.push([...temp] as vec3);
    }

    return res;
  }
}