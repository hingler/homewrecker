import { vec3 } from "gl-matrix";
import { Segment } from "../../../segment/Segment";
import { generateDirNorm } from "../generateDirNorm";

export class BodyTexcoordGenerator {
  static getTexScale(segment: Segment, height: number, extrude: number) {
    const {startRef, endRef} = generateDirNorm(segment);
    const temp = vec3.create();
    vec3.sub(temp, endRef, startRef);
    let dirLength = vec3.length(temp);
    // build a pair of simple boxes with mins and maxes, separated by 0.5 vertically
    // scale down the pair to fit
    
    if (segment.startJoin) {
      dirLength -= extrude;
    }

    const boxWide = [0.125, 0.125, 0.125 + dirLength + 2 * extrude, 0.125 + height];
    const boxThin = [0.125, 0.125, 0.125 + 2 * extrude, 0.125 + height];

    const boxMaxX = boxWide[2];
    const boxMaxY = boxThin[3];

    const scale = 0.98 / Math.max(boxMaxX, boxMaxY);

    return scale;
  }

  static generateBodyTexcoords(segment: Segment, height: number, extrude: number, texScale?: number) {
    // we can reuse texcoords!
    // only one pair of faces will be visible at a time...
    // so we can just recycle!

    // create two bounding boxes, one just below the other
    // fit them into [0, 1] by scaling down

    const {startRef, endRef} = generateDirNorm(segment);
    const temp = vec3.create();
    vec3.sub(temp, endRef, startRef);
    let dirLength = vec3.length(temp);
    // build a pair of simple boxes with mins and maxes, separated by 0.5 vertically
    // scale down the pair to fit
    
    if (segment.startJoin) {
      dirLength -= extrude;
    }

    const boxWide = [0.125, 0.125, 0.125 + dirLength + 2 * extrude, 0.125 + height];
    const boxThin = [0.125, 0.125, 0.125 + 2 * extrude, 0.125 + height];

    const boxMaxX = boxWide[2];
    const boxMaxY = boxThin[3];

    const scale = texScale !== undefined ? texScale : (0.98 / Math.max(boxMaxX, boxMaxY));

    for (let i = 0; i < 4; i++) {
      boxWide[i] *= scale;
      boxThin[i] *= scale;
    }

    const res = [] as number[];

    for (let i = 0; i < 4; i++) {
      const box = (i & 1 ? boxThin : boxWide);
      res.push(box[0], box[3]);
      res.push(box[0], box[1]);
      res.push(box[2], box[1]);
      res.push(box[2], box[3]);
    }

    return res;
  }
}