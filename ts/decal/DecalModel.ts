import { ReadonlyVec3 } from "gl-matrix";
import { DecalType } from "../decal/DecalType";

/**
 * Represents a model which would potentially be substituted in place for a decal.
 * @type T - type for our model.
 */
export interface DecalModel<T> extends ReadonlyDecalModel<T> {
  // Approximate X/Y/Z dimensions for our model.
  modelDims: ReadonlyVec3;

  // todo: add some way of considering non-deformable decals

  // the type of decal this model represents.
  type: DecalType;

  // the model itself.
  model: T;
};

export interface ReadonlyDecalModel<T> {
  readonly modelDims: ReadonlyVec3;
  readonly type: DecalType;
  readonly model: T;
}