import { applyImpactFactor } from "domain/synthetics/fees";
import { BigNumber, ethers } from "ethers";
import { expandDecimals } from "lib/numbers";

describe("applyImpactFactor", () => {
  for (const [diffUsd, exponentFactor, impactFactor, expected] of [
    // make sure it works for really big values
    [10000, 3, "0.000000000002", "999999999999999971996569854874"],
    [100000, 3, "0.000000000002", "999999999999999972158527355760923"],
    [1000000, 3, "0.000000000002", "999999999999999974481076694795741150"],
    [10000000, 3, "0.000000000002", "999999999999999977004203243086721668335"],
    [1000000000, 3, "0.000000000002", "999999999999999964992485098699963454527292263"],

    [10000, 2, "0.00000002", "999999999999999981235216490000"],
    [100000, 2, "0.00000002", "99999999999999998147004678330000"],
    [1000000, 2, "0.00000002", "9999999999999999830554320142260000"],
    [10000000, 2, "0.00000002", "999999999999999984577907497082540000"],

    [10000, "1.75", "0.0000002", "999999999999999983993282600000"],
    [100000, "1.75", "0.0000002", "56234132519034907150467965500000"],
    [1000000, "1.75", "0.0000002", "3162277660168379284617577705300000"],
    [10000000, "1.75", "0.0000002", "177827941003892277732818564790100000"],

    // and for small values
    ["0.0000000000001", "1.5", "0.000002", 0],
    ["0.001", "1.5", "0.000002", 0],
    [1, "1.5", "0.000002", "1000000000000000000000000"],
    [1000, "1.5", "0.000002", "31622776601683792872691000000"],
    [10000, "1.5", "0.000002", "999999999999999985875227000000"],
    [100000, "1.5", "0.000002", "31622776601683792881032921000000"],
    [1000000, "1.5", "0.000002", "999999999999999987642846054000000"],
    [10000000, "1.5", "0.000002", "31622776601683792957603597100000000"],

    [10000, "1", "0.0002", "999999999999999990595300000000"],
    [100000, "1", "0.0002", "9999999999999999907230700000000"],
    [1000000, "1", "0.0002", "99999999999999999145886800000000"],
    [10000000, "1", "0.0002", "999999999999999992287429300000000"],
  ]) {
    it(`should keep difference <1/1e10 from the contract value: ${expected}`, () => {
      const result = applyImpactFactor(
        ethers.utils.parseUnits(String(diffUsd), 30),
        ethers.utils.parseUnits(String(impactFactor), 30),
        ethers.utils.parseUnits(String(exponentFactor), 30)
      );

      const _expected = BigNumber.from(expected);

      expect(
        _expected.eq(0)
          ? result?.lt(expandDecimals(1, 20))
          : _expected.div(_expected.sub(result!).abs()).gt(expandDecimals(1, 10))
      ).toBe(true);
    });
  }
});