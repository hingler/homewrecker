import { vec3 } from "gl-matrix";
import { Segment } from "../../../segment/Segment";
import { RoofPolyData } from "../RoofPolyData";

export class RoofTangentGenerator {
  static generateRoofTangents(segment: Segment, height: number, extrude: number) : RoofPolyData {
    const startRef = vec3.fromValues(segment.start[0], 0.0, segment.start[1]);
    const endRef = vec3.fromValues(segment.end[0], 0.0, segment.end[1]);
    const dir = vec3.subtract(vec3.create(), endRef, startRef);
    vec3.normalize(dir, dir);

    const norm = vec3.cross(vec3.create(), dir, [0, 1, 0]);
    vec3.normalize(norm, norm);

    const temp = vec3.create();
    
    const res = {} as RoofPolyData;
    res.longPlus = [];
    res.longMinus = [];
    res.shortEnd = null;
    res.shortStart = null;

    vec3.scale(temp, dir, -1);
    res.longMinus.push(...temp);
    res.longPlus.push(...dir);

    if (!segment.flat) {
      if (!segment.startJoin) {
        res.shortStart = [];
        res.shortStart.push(...norm);
      }

      res.shortEnd = [];
      vec3.scale(temp, norm, -1);
      res.shortEnd.push(...temp);
    }

    return res;
  }
}