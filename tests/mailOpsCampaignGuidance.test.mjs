import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {campaignLabel,campaignErrorMessage,MANIFEST_TEMPLATE} from "../src/lib/mailOpsCampaignGuidance.js";
test("same-name mailings show date, environment and distinct stable references without timezone conversion",()=>{
 const a={id:"12345678-0000-0000-0000-000000000001",name:"Geaux Vote",mailing_date:"2026-11-11",source_mode:"cat"};
 const b={...a,id:"87654321-0000-0000-0000-000000000002"};
 assert.match(campaignLabel(a,[a,b]),/2026-11-11 · Test · Ref 12345678/);
 assert.notEqual(campaignLabel(a,[a,b]),campaignLabel(b,[a,b]));
 const collision={...a,id:"12345678-0000-0000-0000-000000000002"};
 assert.ok(campaignLabel(a,[a,collision]).includes(a.id));
 assert.match(campaignLabel({...a,source_mode:"production"}),/Production/);
 assert.match(campaignLabel({...a,mailing_date:null}),/Date unavailable/);
});
test("manifest template is header-only and CSV failures explain recovery without echoing raw payloads",()=>{
 assert.equal(MANIFEST_TEMPLATE,"imb,sequence\r\n");
 const error=code=>campaignErrorMessage({response:{data:{error:code}}});
 assert.match(error("UNSUPPORTED_CSV_HEADERS"),/Remove address/);
 assert.match(error("INVALID_IMB"),/MID alone/);
 assert.match(error("EMPTY_CSV"),/at least one real/);
 assert.match(error("MANIFEST_PLAN_CHANGED"),/Preview/);
 assert.match(error("MANIFEST_FROZEN_AFTER_FEED"),/locked/);
 const unknown=campaignErrorMessage({response:{data:{error:"secret",message:"secret"}}});
 assert.equal(unknown.includes("secret"),false);
});
test("actual campaign UI exposes download, import sequence and campaign identity",async()=>{
 const s=await readFile(new URL("../src/components/MailOpsCampaignTracking.jsx",import.meta.url),"utf8");
 for(const text of ['campaignLabel(c,campaigns)','campaignErrorMessage(err)','download="mailops-manifest-template.csv"','Full campaign reference','does not save','Preview manifest import','Apply reviewed manifest'])assert.ok(s.includes(text),text);
 assert.ok(s.includes('aria-controls="mailops-campaign-body"'));
});
