import { vec3 } from "gl-matrix";
import { Segment } from "../../segment/Segment";
export interface SegmentData {
  startRef: vec3,
  endRef: vec3,
  dir: vec3,
  norm: vec3
}

export function generateDirNorm(segment: Segment) : SegmentData {
  const startRef = vec3.fromValues(segment.start[0], 0.0, segment.start[1]);
  const endRef = vec3.fromValues(segment.end[0], 0.0, segment.end[1]);
  const dir = vec3.subtract(vec3.create(), endRef, startRef);
  vec3.normalize(dir, dir);

  const norm = vec3.cross(vec3.create(), dir, [0, 1, 0]);
  vec3.normalize(norm, norm);

  return {
    "startRef": startRef,
    "endRef": endRef,
    "dir": dir,
    "norm": norm
  };
}