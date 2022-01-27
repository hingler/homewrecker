import { vec2 } from "gl-matrix";

/**
 * Single house segment
 */
export interface Segment {
  // start position
  start: vec2,

  // end position
  end: vec2,

  // start joins with another roof piece
  startJoin: boolean,

  // flatten end of roof
  flat: boolean
};