import { vec3 } from "gl-matrix";
import { Segment } from "../../../segment/Segment";

export class BodyPositionGenerator {
  static generateBodyPositions(segment: Segment, height: number, extrude: number) {
    const startRef = vec3.fromValues(segment.start[0], 0.0, segment.start[1]);
    const endRef = vec3.fromValues(segment.end[0], 0.0, segment.end[1]);
    const dir = vec3.subtract(vec3.create(), endRef, startRef);
    vec3.normalize(dir, dir);

    const norm = vec3.cross(vec3.create(), dir, [0, 1, 0]);
    vec3.normalize(norm, norm);
    
    let res = [] as number[];

    const center = vec3.create();
    const temp = vec3.create();
    const temp2 = vec3.create();
    const temp3 = vec3.create();

    
    vec3.sub(center, endRef, startRef);
    vec3.scale(center, center, 0.5);
    let len = vec3.len(center);

    if (segment.startJoin) {
      // shift center in direction of (dir) by extrude / 2
      vec3.scaleAndAdd(center, center, dir, extrude);
      // decrease len
      len -= extrude;
    }

    vec3.scale(dir, dir, len + extrude);
    vec3.scale(norm, norm, extrude);
    vec3.add(center, center, startRef);



    for (let i = 0; i < 4; i++) {
      const normalVec = (i & 1 ? dir : norm);
      const tangentVec = (i & 1 ? norm : dir);
      let scaleNormal = ((i === 1 || i === 2) ? -1 : 1);
      let scaleTangent = (i & 2 ? -1 : 1);
      // note: if startjoin, constrain generation somewhat
      // also: if flat, scale normal by just len / 2
      // also2: flat bodies need roof spikes :(
      // ignore for now

      // i & 1 : along dir axis (len / 2) + extrude
      // else: along normal axis, extrude

      vec3.scale(temp2, tangentVec, scaleTangent);
      vec3.scale(temp3, normalVec, scaleNormal);
      
      vec3.sub(temp, center, temp2);
      vec3.add(temp, temp, temp3);
      temp[1] = height;
      res.push(...temp);

      temp[1] = 0;
      res.push(...temp);
      
      vec3.add(temp, center, temp2);
      vec3.add(temp, temp, temp3);


      temp[1] = 0;
      res.push(...temp);

      temp[1] = height;
      res.push(...temp);
    }

    return res;
  }
}