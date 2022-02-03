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
}