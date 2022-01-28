import { vec2, vec3 } from "gl-matrix";
import { Segment } from "ts/segment/Segment";
import { RoofPolyData } from "./internal/RoofPolyData";

export class RoofGenerator {
  /**
   * Generates a new roof!
   * @param segmentList - list of segments to generate from
   * @param height - height of the peak of our roof, with 0 representing its base
   * @param extrude - how far outwards to build the roof from our segmentlist.
   */
  static generateRoof(segmentList: Array<Segment>, height: number, extrude: number) {
    // work on a per segment basis
    // for each segment generate:
    // - list of positions
    // - list of texcoords
    // - list of normals
    // - list of tangents
    // combine these together in some way to return a roof!
  }
}