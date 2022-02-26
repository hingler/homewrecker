import { ReadonlyVec3 } from "gl-matrix";

export interface DecalModelAssignment<T> {
  // the ID of the decal in question
  decalId: number;

  // the model associated with this decal
  model: T;

  // a vector which scales the model, based on its dimensions, to match the decal's bounds (before rotation)
  scaleFac: ReadonlyVec3;
}