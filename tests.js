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

const memory=()=>{const x={};return{getItem:k=>Object.prototype.hasOwnProperty.call(x,k)?x[k]:null,setItem:(k,v)=>x[k]=String(v),removeItem:k=>delete x[k]}};
test("STATE-001",()=>{const m=memory(),s=WVR.newCase({custody:"TOW_COMPANY",reason:"tow charge",saleDanger:"NO"});WVR.recommend(s);assert(WVR.saveCase(s,m));const r=WVR.loadCase(m);assert.equal(r.vehicle.location,"TOW_COMPANY");assert.equal(r.facts.custody.source,"USER_INPUT");assert.equal(r.decision_history.length,1)});
test("STATE-002",()=>{const m=memory();m.setItem(WVR.STORAGE_KEY,"not json");assert.equal(WVR.loadCase(m),null)});
test("STATE-003",()=>{const m=memory(),s=WVR.newCase({});WVR.saveCase(s,m);assert(WVR.clearCase(m));assert.equal(WVR.loadCase(m),null)});

for(const r of results)console.log(r.join(" — ")); if(results.some(r=>r[1]!=="PASS"))process.exit(1);console.log("13/13 core + state tests passed.");

test("EVIDENCE-001",()=>{const s=WVR.newCase({}),x=WVR.addEvidence(s,{kind:"NOTICE",label:"sale notice",source:"USER_INPUT",status:"CLAIMED",file:{name:"notice.pdf",type:"application/pdf",size:123,last_modified:42}});assert.equal(s.evidence.length,0);assert.equal(x.state.evidence.length,1);assert.equal(x.evidence.source,"USER_INPUT");assert.equal(x.evidence.status,"CLAIMED");assert.equal(x.evidence.file.storage,"LOCAL_INDEXEDDB")});
test("EVIDENCE-002",()=>{const s=WVR.newCase({}),x=WVR.addEvidence(s,{kind:"PHOTO",label:"sign"}),y=WVR.removeEvidence(x.state,x.evidence.id);assert.equal(y.evidence.length,0);assert.equal(x.state.evidence.length,1)});

for(const r of results.slice(13))console.log(r.join(" — "));if(results.some(r=>r[1]!=="PASS"))process.exit(1);console.log("15/15 core + state + evidence tests passed.");
