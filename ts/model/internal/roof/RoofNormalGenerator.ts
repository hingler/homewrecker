import { vec2, vec3 } from "gl-matrix";
import { Segment } from "../../../segment/Segment";
import { RoofPolyData } from "../RoofPolyData";

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

  static generateRoofNormalsFromCurve(points: Array<number>, roofPoints: Array<number>, height: number) : Array<vec3> {
    // just use the two points and a roof point
    // roof -> point, point -> point
    const res : Array<vec3> = [];
    const start = vec3.create();
    const end = vec3.create();
    const roof = vec3.create();
    const temp = vec3.create();
    const temp2 = vec3.create();

    for (let i = 0; i < points.length; i += 2) {
      const indStart = i;
      const indEnd = (i + 2) % points.length;

      start[0] = points[indStart];
      start[2] = points[indStart + 1];
      end[0]   = points[indEnd];
      end[2]   = points[indEnd + 1];
      roof[0] = roofPoints[indStart];
      roof[1] = height;
      roof[2] = roofPoints[indStart + 1];

      vec3.sub(temp, roof, start);
      vec3.sub(temp2, end, start);
      vec3.normalize(temp, temp);
      vec3.normalize(temp2, temp2);
      vec3.cross(temp, temp, temp2);
      
      res.push([...temp] as vec3);
    }

    // bottoms after sides
    for (let i = 0; i < points.length; i += 2) {
      vec3.copy(temp, res[Math.round(i / 2)]);
      vec3.scale(temp, temp, -1);
      res.push([...temp] as vec3);
    }
    
    return res;
  }
}