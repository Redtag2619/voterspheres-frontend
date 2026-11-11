import { test } from "node:test";
import assert from "node:assert/strict";
import { parseScannedImb } from "../src/lib/mailOpsImbScan.js";

test("retains leading zeros and extracts 6- and 9-digit MIDs with each valid routing length", () => {
  for (const routing of ["", "01234", "012345678", "01234567890"]) {
    for (const [mid, serial] of [["012345", "012345678"], ["900123456", "012345"]]) {
      const imb = "00243" + mid + serial + routing;
      assert.deepEqual(parseScannedImb(imb + "\r\n"), { imb, mid });
    }
  }
});

test("rejects raw bar symbols, unrelated lengths, prefixed codes and nonstrings", () => {
  const imb = "00243012345012345678";
  for (const invalid of ["ADFT", "012345678901", imb + "12", imb + "0".repeat(12), "]X0" + imb, Number(imb), null]) {
    assert.equal(parseScannedImb(invalid), null);
  }
});
