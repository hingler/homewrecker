import { expect } from "chai";
import { ReadonlyVec3, vec3 } from "gl-matrix";
import { DecalModel } from "../ts/decal/DecalModel";
import { DecalObject } from "../ts/decal/DecalObject";
import { DecalToModel } from "../ts/decal/DecalToModel";
import { DecalType } from "../ts/decal/DecalType";

const square : DecalModel<number> = {
  model: 0,
  modelDims: [1, 1, 1],
  type: DecalType.WINDOW
};

const longX : DecalModel<number> = {
  model: 1,
  modelDims: [2, 1, 1],
  type: DecalType.WINDOW
};

const longY : DecalModel<number> = {
  model: 2,
  modelDims: [1, 2, 1],
  type: DecalType.WINDOW
};

const longZ : DecalModel<number> = {
  model: 3,
  modelDims: [1, 1, 2],
  type: DecalType.WINDOW
};

const nearDoor : DecalModel<number> = {
  model: 4,
  modelDims: [1.5, 1.8, 1.5],
  type: DecalType.DOOR
};

function gen(dims: ReadonlyVec3, type: DecalType) {
  const res = new DecalObject(type, -1);
  res.setScale(dims);
  return res;
}

describe("DecalToModel", function() {
  it("Returns models with closest dimensions", function() {
    const root = new DecalObject(DecalType.ROOT, -1);
    const targ = gen([1, 1, 1], DecalType.WINDOW)
    root.addChild(targ);
    
    const res = DecalToModel.convert(root, [square, longX, longY, longZ]);
    expect(res.length).to.equal(1);
    expect(res[0].decalId).to.equal(targ.getId());
    expect(res[0].model).to.equal(square.model);
  });

  it("Matches models with stretched dimensions", function() {
    const root = new DecalObject(DecalType.ROOT, -1);
    const x = gen(longX.modelDims, DecalType.WINDOW);
    const y = gen(longY.modelDims, DecalType.WINDOW);
    const z = gen(longZ.modelDims, DecalType.WINDOW);

    root.addChild(x);
    root.addChild(y);
    root.addChild(z);

    const res = DecalToModel.convert(root, [square, longX, longY, longZ]);
    expect(res.length).to.equal(3);
    
    const resultIDSet : Set<number> = new Set();
    const resDecals = [x, y, z];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (resDecals[j].getId() === res[i].decalId) {
          expect(resultIDSet.has(resDecals[j].getId())).to.be.false;
          resultIDSet.add(resDecals[j].getId());

          for (let k = 0; k < 3; k++) {
            expect(res[i].scaleFac[k]).to.approximately(1.0, 0.001);
          }

          break;
        }

      }
    }

    expect(resultIDSet.size).to.equal(3);
  });

  it("Will only match decals with matching types", function() {
    const root = new DecalObject(DecalType.ROOT, -1);
    const fudge = gen(nearDoor.modelDims, DecalType.WINDOW);

    root.addChild(fudge);

    let res = DecalToModel.convert(root, [square, longX, longY, longZ, nearDoor]);
    expect(res.length).to.equal(1);

    expect(res[0].decalId).to.equal(fudge.getId());
    expect(res[0].model).to.equal(square.model);
    
    console.log(res[0].scaleFac);

    root.removeChild(fudge.getId());

    const fudgeSquare = gen(square.modelDims, DecalType.DOOR);
    root.addChild(fudgeSquare);
    
    res = DecalToModel.convert(root, [square, longX, longY, longZ, nearDoor]);
    expect(res.length).to.equal(1);

    expect(res[0].decalId).to.equal(fudgeSquare.getId());
    expect(res[0].model).to.equal(nearDoor.model);
    
    console.log(res[0].scaleFac);
  });
});