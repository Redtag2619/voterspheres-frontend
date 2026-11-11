import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
test("health UI keeps evidence distinct, exposes missing telemetry and bounds exception sample",async()=>{
 const source=await readFile(new URL("../src/components/MailOpsFeedHealth.jsx",import.meta.url),"utf8");
 for(const text of ["not a USPS delivery standard","not reported by the relay","Documented acceptance","Estimated arrival","not a complete exception export","No healthy status was assumed"]){assert.ok(source.includes(text),text);}
 assert.equal(source.includes("dangerouslySetInnerHTML"),false);
 const parent=await readFile(new URL("../src/components/MailOpsCampaignTracking.jsx",import.meta.url),"utf8");
 assert.ok(parent.includes("<MailOpsFeedHealth health={summary.feed_health}"));
 assert.ok(parent.includes("setSummary(null);throw err;"));
});
