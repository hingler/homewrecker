import { vec3 } from "gl-matrix";
import { Segment } from "../../../segment/Segment";

export class BodyNormalGenerator {
  static generateBodyNormals(segment: Segment, height: number, extrude: number) {
    const startRef = vec3.fromValues(segment.start[0], 0.0, segment.start[1]);
    const endRef = vec3.fromValues(segment.end[0], 0.0, segment.end[1]);
    const dir = vec3.subtract(vec3.create(), endRef, startRef);
    vec3.normalize(dir, dir);

    const norm = vec3.cross(vec3.create(), dir, [0, 1, 0]);
    vec3.normalize(norm, norm);

    let res = [] as number[];
    const temp3 = vec3.create();

    for (let i = 0; i < 4; i++) {
      const normalVec = (i & 1 ? dir : norm);
      const scaleNormal = ((i === 1 || i === 2) ? -1 : 1);

      vec3.scale(temp3, normalVec, scaleNormal);
      vec3.normalize(temp3, temp3);
      // ensure copies match up with vertices
      res.push(...temp3);
      res.push(...temp3);
      res.push(...temp3);
      res.push(...temp3);
    }

    return res;
  }

  static generateBodyTangentsFromCurve(points: Array<number>) {
    const res : Array<number> = [];
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

      res.push(...temp);
      res.push(...temp);
      res.push(...temp);
      res.push(...temp);
    }

    return res;
  }
}