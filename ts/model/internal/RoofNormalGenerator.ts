import { vec2, vec3 } from "gl-matrix";
import { Segment } from "../../segment/Segment";
import { RoofPolyData } from "./RoofPolyData";

export class RoofNormalGenerator {
  /**
   * Generates normal data for a roof.
   * Since all faces share a single normal, this will only output one vec3 for each one.
   * @param segment - segment being generated.
   * @param height - height of roof at peak (edge is always at 0)
   * @param extrude - distance from segment to extrude roof.
   */
  static generateRoofNormals(segment: Segment, height: number, extrude: number) : RoofPolyData {
    const startRef = vec3.fromValues(segment.start[0], 0.0, segment.start[1]);
    const endRef = vec3.fromValues(segment.end[0], 0.0, segment.end[1]);
    const dir = vec3.subtract(vec3.create(), endRef, startRef);
    vec3.normalize(dir, dir);

    const norm = vec3.cross(vec3.create(), dir, [0, 1, 0]);
    vec3.normalize(norm, norm);

    const raw = vec2.create();
    raw[0] = height;
    raw[1] = extrude;
    vec2.normalize(raw, raw);

    let res = {} as RoofPolyData;
    res.longPlus = [];
    res.longMinus = [];
    res.shortEnd = null;
    res.shortStart = null;

    const temp = vec3.create();
    const temp2 = vec3.create();

    // -long
    vec3.add(temp, vec3.zero(temp), vec3.scale(temp2, norm, -raw[0]));
    temp[1] += raw[1];
    vec3.normalize(temp, temp);
    res.longMinus.push(...temp);

    // +long
    vec3.add(temp, vec3.zero(temp), vec3.scale(temp2, norm, raw[0]));
    temp[1] += raw[1];
    vec3.normalize(temp, temp);
    res.longPlus.push(...temp);

    // startshort

    if (!segment.flat) {
      if (!segment.startJoin) {
        vec3.add(temp, vec3.zero(temp), vec3.scale(temp2, dir, -raw[0]));
        temp[1] += raw[1];
        res.shortStart = [];
        vec3.normalize(temp, temp);
        res.shortStart.push(...temp);
      }

      vec3.add(temp, vec3.zero(temp), vec3.scale(temp2, dir, raw[0]));
      temp[1] += raw[1];
      res.shortEnd = [];
      vec3.normalize(temp, temp);
      res.shortEnd.push(...temp);
    }

    return res;
  }
}