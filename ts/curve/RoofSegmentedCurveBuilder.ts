// converts a list of segments into a curve
// note: we need to encode perimeter points AND their corresponding roof points

import { vec2 } from "gl-matrix";
import { distanceBetweenLines } from "../model/internal/distanceBetweenLines";
import { generateDirNorm } from "../model/internal/generateDirNorm";
import { ProceduralSegment } from "../model/SegmentGenerator";
import { Segment } from "../segment/Segment";

// start with an arbitrary segment (far left corner is guaranteed to be safe)
// wind around the shape, checking for intersections with other segments
// if an intersection is encountered, we'll go into that segment, and start from its far left!

export interface RoofSegmentedCurveOutput {
  points: Array<number>;
  roofPoints: Array<number>;
}

export class RoofSegmentedCurveBuilder {
  static getSegmentList(segList: Array<ProceduralSegment>, extrude: number) {
    const pointList: Array<number> = [];
    const roofPointList: Array<number> = [];

    this.parseSegment_recurse(0, segList, pointList, roofPointList, extrude, true);

    return {
      points: pointList,
      roofPoints: roofPointList
    } as RoofSegmentedCurveOutput;
  }
  
  private static parseSegment_recurse(curIndex: number, segList: Array<ProceduralSegment>, pointList: Array<number>, roofPointList: Array<number>, extrude: number, isRoot: boolean) {
    // push a list of points, starting from bottom left
    const seg = segList[curIndex];

    const start = vec2.create();
    const end = vec2.create();

    const [points, roots] = this.getSegmentControlPoints(seg, extrude);

    const segVisits : Array<number> = [];

    const temp = vec2.create();
    console.log(points);

    pointList.push(points[0], points[1]);
    roofPointList.push(roots[0], roots[1]);
    for (let i = 0; i < 3; i++) {
      start[0] = points[2 * i];
      start[1] = points[2 * i + 1];

      end[0] = points[2 * ((i + 1) % 4)];
      end[1] = points[2 * ((i + 1) % 4) + 1];

      for (let j = 0; j < segList.length; j++) {
        if (j === curIndex || j === seg.parent) {
          continue;
        }

        const curSeg = segList[j];

        // note: what if multiple segments intersect?
        if (distanceBetweenLines(start, end, curSeg.start, curSeg.end) < 0.00001 && curSeg.parent === curIndex) {
          // intersection!
          console.log("PUSHING " + j);
          segVisits.push(j);
        }
      }

      // order our segments by distance to start point (asc)
      segVisits.sort((a, b) => {
        const distA = vec2.len(vec2.sub(temp, segList[a].start, start));
        const distB = vec2.len(vec2.sub(temp, segList[b].start, start));

        return distA - distB;
      });

      console.log("SEGVISITS");
      console.log(segVisits);

      for (let j = 0; j < segVisits.length; j++) {
        // visit segs by distance from ctrl
        // post first point before doing anything!
        this.parseSegment_recurse(segVisits[j], segList, pointList, roofPointList, extrude, false);
      }

      console.log(end);
      pointList.push(...end);
      roofPointList.push(roots[2 * ((i + 1) % 4)], roots[2 * ((i + 1) % 4) + 1]);

      while (segVisits.length > 0) {
        segVisits.pop();
      }
    }

  }
  
  private static getSegmentControlPoints(seg: Segment, extrude: number) : [Array<number>, Array<number>] {
    const res = [] as Array<number>;
    const roofPoints = [] as Array<number>;

    const offsetNear = (seg.startJoin ? extrude : (seg.flat ? 0 : -extrude));
    const temp = vec2.create();

    const tempDir = vec2.create();
    const { dir, norm, length } = generateDirNorm(seg);

    // whatever :D
    const dirV2 = [dir[0], dir[2]] as vec2;
    const normV2 = [norm[0], norm[2]] as vec2;

    console.log(normV2);
    // idk when along the line my normals flipped
    vec2.scale(normV2, normV2, extrude);
    vec2.copy(tempDir, dirV2);

    vec2.scale(tempDir, tempDir, offsetNear);

    vec2.normalize(dirV2, dirV2);

    vec2.copy(temp, seg.start);
    vec2.add(temp, temp, tempDir);
    vec2.add(temp, temp, normV2);

    res.push(...temp);
    roofPoints.push(seg.start[0], seg.start[1]);

    vec2.copy(temp, seg.end);
    vec2.scaleAndAdd(temp, temp, dirV2, extrude);
    vec2.add(temp, temp, normV2);
    res.push(...temp);
    roofPoints.push(seg.end[0], seg.end[1]);

    vec2.scaleAndAdd(temp, temp, normV2, -2);
    res.push(...temp);
    roofPoints.push(seg.end[0], seg.end[1]);

    vec2.copy(temp, seg.start);
    vec2.add(temp, temp, tempDir);
    vec2.sub(temp, temp, normV2);
    res.push(...temp);
    roofPoints.push(seg.start[0], seg.start[1]);
    return [res, roofPoints];
  }

}
