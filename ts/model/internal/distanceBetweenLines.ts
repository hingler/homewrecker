import { vec2, vec3 } from "gl-matrix";

const temp = vec2.create();
const temp2 = vec2.create();
const temp3 = vec2.create();

const v3temp = vec3.create();

export function distanceBetweenLines(startA: vec2, endA: vec2, startB: vec2, endB: vec2) {
  // if the lines intersect, the closest point is on the line
  const distAStart = signedOrthogonalDistance(startB, endB, startA);
  const distAEnd = signedOrthogonalDistance(startB, endB, endA);
  if (Math.sign(distAStart) !== Math.sign(distAEnd)) {
    // possible intersection
    
    // abs change
    const delta = Math.abs(distAEnd - distAStart);
    const t = Math.abs(distAStart) / delta;
    vec2.scale(temp, vec2.sub(temp2, endA, startA), t);
    vec2.add(temp, temp, startA);
    // temp contains our middle point
    const min = pointToLine(startB, endB, temp)
    if (min < 0.0001) {
      return 0;
    }

    // otherwise, intersection is invalid
  }

  // if not, its from one point to a line, or the other way around, or two points.
  return Math.min(pointToLine(startA, endA, startB), pointToLine(startA, endA, endB), pointToLine(startB, endB, startA), pointToLine(startB, endB, endA));
}

function pointToLine(startA: vec2, endA: vec2, point: vec2) {
  vec2.sub(temp, point, startA);
  vec2.sub(temp2, endA, startA);
  const lineLen = vec2.len(temp2);
  vec2.normalize(temp2, temp2);
  const projLength = vec2.dot(temp, temp2);

  if (projLength < 0) {
    // closest point is start to point
    return vec2.len(temp);
  } else if (projLength > lineLen) {
    // closest point is end to point
    vec2.sub(temp, point, endA);
    return vec2.len(temp);
  } else {
    // closest point is line segment to point
    // subtract component of distance on start -> point
    vec2.sub(temp, temp, vec2.scale(temp2, temp2, projLength));
    // return orthogonal component
    return vec2.len(temp);
  }
}

function signedOrthogonalDistance(startA: vec2, endA: vec2, point: vec2) {
  vec2.sub(temp, point, startA);
  vec2.sub(temp2, endA, startA);
  vec2.cross(v3temp, temp, temp2);
  return v3temp[2];
}