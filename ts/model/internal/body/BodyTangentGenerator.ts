import { vec3 } from "gl-matrix";
import { Segment } from "../../../segment/Segment";
import { generateDirNorm } from "../generateDirNorm";

export class BodyTangentGenerator {
  static generateBodyTangents(segment: Segment) {
    const {dir, norm} = generateDirNorm(segment);

    let res = [] as number[];
    const temp3 = vec3.create();

    for (let i = 0; i < 4; i++) {
      const tangentVec = (i & 1 ? norm : dir);
      let scaleTangent = (i & 2 ? 1 : -1);

      vec3.scale(temp3, tangentVec, scaleTangent);
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

      res.push(...temp);
      res.push(...temp);
      res.push(...temp);
      res.push(...temp);
    }

    return res;
  }
}