const fs=require("fs"),vm=require("vm"),assert=require("assert");
vm.runInThisContext(fs.readFileSync("engine.js","utf8"));
const results=[]; function test(id,fn){try{fn();results.push([id,"PASS"])}catch(e){results.push([id,"FAIL",e.message])}}
test("VR-001",()=>{let x=WVR.evaluateFixture({activeBlockers:["MONEY_LIEN"],prohibitedFeeEstablished:true});assert(!x.releaseReady);assert.notEqual(x.action,"FILE_ESCALATE")});
test("VR-002",()=>{let x=WVR.evaluateFixture({POLICE_EVIDENCE:"TERMINATED",MONEY_LIEN:"ACTIVE"});assert(!x.releaseReady)});
test("VR-003",()=>{let x=WVR.evaluateFixture({saleDeadlineHours:24,slowFreeActionAvailable:true});assert.equal(x.action,"PRESERVE_EVIDENCE")});
test("VR-004",()=>{let x=WVR.evaluateFixture({towerHoldClaim:"YES",policeRecord:"CONFLICTS"});assert.equal(x.action,"VERIFY")});
test("VR-005",()=>{let x=WVR.evaluateFixture({MONEY_LIEN:"ACTIVE",ownership:"CONFIRMED"});assert.notEqual(x.action,"FILE_ESCALATE")});
test("VR-006",()=>{let x=WVR.evaluateFixture({allPossessionBlockersResolved:true,releaseDemand:"CONFIRMED",refusal:"CONFIRMED",ordinaryReplevinLaneValidated:true});assert(x.eligible("FILE_ESCALATE"))});
test("VR-007",()=>{let x=WVR.evaluateFixture({caseFiled:true,enforceableJudgment:false});assert(!x.eligible("SERVE_ENFORCE"))});
test("VR-008",()=>{let x=WVR.evaluateFixture({courtCaseActive:true,vehiclePossession:"RECOVERED"});assert.equal(x.action,"CLOSE_POSSESSION_PATH")});
test("VR-009",()=>{let x=WVR.evaluateFixture({objective:"BELONGINGS",abandonmentConsequence:"UNRESOLVED"});assert.equal(x.action,"VERIFY")});
test("VR-010",()=>{let x=WVR.evaluateFixture({freeAction:{cost:0,delayExposure:true},recoverNow:{costPositive:true,rightsPreserved:true}});assert.equal(x.economics,"TOTAL_RECOVERY_ECONOMICS")});
for(const r of results)console.log(r.join(" — ")); if(results.some(r=>r[1]!=="PASS"))process.exit(1);
console.log("10/10 core regressions passed.");
