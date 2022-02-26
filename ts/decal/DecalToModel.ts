import { vec3 } from "gl-matrix";
import { DecalModel, ReadonlyDecalModel } from "./DecalModel";
import { DecalModelAssignment } from "./DecalModelAssignment";
import { DecalObject } from "./DecalObject";

/**
 * A class which associates model data with decals.
 */
export class DecalToModel {
  static convert<T>(decalRoot: DecalObject, data: ReadonlyArray<ReadonlyDecalModel<T>>) : Array<DecalModelAssignment<T>> {
    let map = new Map<number, ReadonlyDecalModel<T>>();
    this.convert_recurse(decalRoot, data, map);

    const output : Array<DecalModelAssignment<T>> = [];

    for (let res of map) {
      const fac = vec3.create();
      const decal = decalRoot.getChild(res[0]);
      vec3.div(fac, decal.getScale(), res[1].modelDims);

      const assign : DecalModelAssignment<T> = {
        decalId: res[0],
        model: res[1].model,
        scaleFac: fac
      };

      output.push(assign);
    }

    return output;
  }

  private static convert_recurse<T>(root: DecalObject, data: ReadonlyArray<ReadonlyDecalModel<T>>, res: Map<number, ReadonlyDecalModel<T>>) {
    const rootScale = root.getScale();
    let bestMatchFactor = 0.0;
    let bestMatchIndex = -1;
    // todo: decals contain a segment index -- pick one or two unique model names per segment and only use those
    // this should keep our houses looking orderly

    for (let i = 0; i < data.length; i++) {
      const factorProduct = this.calculateMatchFactor(root, data[i]);
      if (factorProduct > bestMatchFactor) {
        bestMatchFactor = factorProduct;
        bestMatchIndex = i;
      }
    }

    if (bestMatchIndex !== -1) {
      res.set(root.getId(), data[bestMatchIndex]);
    }
    
    for (let child of root.getChildren()) {
      this.convert_recurse(child, data, res);
    }
  }

  private static calculateMatchFactor<T>(root: DecalObject, model: DecalModel<T>) {
    let factor : number;
    const rootScale = root.getScale();

    if (root.type !== model.type) {
      return -1.0;
    } 

    let factorProduct = 0.0;
    const modelScale = model.modelDims;
    for (let i = 0; i < 3; i++) {
      factor = modelScale[i];
      factor /= rootScale[i];
      factorProduct += factor;
    }

    // average scale factor which we'll compare our deviations to
    const factorScale = factorProduct / 3;

    factorProduct = 1.0;
    for (let i = 0; i < 3; i++) {
      factor = modelScale[i];
      factor /= rootScale[i];
      factor /= factorScale;

      // ensure positive
      factor = Math.abs(factor);

      if (factor > 1.0) {
        // invert so all deviation < 1
        factor = 1.0 / factor;
      }

      factorProduct *= factor;
    }

    return factorProduct;
  }
}