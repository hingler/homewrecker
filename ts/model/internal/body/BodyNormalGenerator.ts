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
}