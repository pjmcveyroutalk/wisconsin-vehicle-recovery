const fs=require("fs"),vm=require("vm"),assert=require("assert");
vm.runInThisContext(fs.readFileSync("engine.js","utf8"));
const out=[];function step(id,s,expected){const a=WVR.select(s);assert.equal(a,expected,`${id}: expected ${expected}, got ${a}`);out.push(`${id} — ${a}`)}
function sim1(){
 let s=WVR.newCase({custody:"TOW_LOT",reason:"tow charge and storage lien",saleDanger:"NO"});
 s.itemizedBillMissing=true;step("SIM-001.1",s,"REQUEST_RECORD");
 s=WVR.applyEvent(s,{set:{itemizedBillMissing:false,prohibitedFeeEstablished:true}});step("SIM-001.2",s,"DISPUTE_RECALCULATE");
 assert.equal(WVR.releaseReady(s),false,"fee defect must not create release-ready state");
 s=WVR.applyEvent(s,{resolveBlocker:"MONEY_LIEN",state:"TERMINATED",set:{releaseDemand:"CONFIRMED"}});step("SIM-001.3",s,"DEMAND_RELEASE");
 s=WVR.applyEvent(s,{set:{refusal:"CONFIRMED",ordinaryReplevinLaneValidated:true}});step("SIM-001.4",s,"FILE_ESCALATE");
 return s;
}
function sim2(){
 let s=WVR.newCase({custody:"TOW_LOT",reason:"parking citation police hold tow fee",saleDanger:"YES"});
 s.saleDeadlineHours=24;s.towerHoldClaim="YES";s.policeRecord="CONFLICTS";step("SIM-002.1",s,"PRESERVE_EVIDENCE");
 s=WVR.applyEvent(s,{resolveBlocker:"SALE_DISPOSAL",state:"TERMINATED",set:{saleDeadlineHours:96}});step("SIM-002.2",s,"VERIFY");
 s=WVR.applyEvent(s,{resolveBlocker:"POLICE_EVIDENCE",state:"TERMINATED",set:{towerHoldClaim:"NO",policeRecord:"CONFIRMED_NO_HOLD"}});step("SIM-002.3",s,"DISPUTE_RECALCULATE");
 s=WVR.applyEvent(s,{resolveBlocker:"MONEY_LIEN",state:"SATISFIED"});step("SIM-002.4",s,"REQUEST_REVIEW");
 s=WVR.applyEvent(s,{resolveBlocker:"GOVERNMENT_CITATION",state:"TERMINATED",set:{lenderDefaultRisk:true,lenderLien:"CONFIRMED"}});step("SIM-002.5",s,"CONTACT_RIGHTS_HOLDER");
 return s;
}
function sim3(){
 let s=WVR.newCase({custody:"TOW_LOT",reason:"unknown",saleDanger:"NO"});
 s.blockers=[];s.releaseDemand="CONFIRMED";step("SIM-003.1",s,"DEMAND_RELEASE");
 s=WVR.applyEvent(s,{set:{refusal:"CONFIRMED",ordinaryReplevinLaneValidated:true}});step("SIM-003.2",s,"FILE_ESCALATE");
 s=WVR.applyEvent(s,{set:{caseFiled:true,enforceableJudgment:false}});assert(!WVR.eligible(s,"SERVE_ENFORCE"));out.push("SIM-003.3 — NO_SC514_BEFORE_JUDGMENT");
 s=WVR.applyEvent(s,{set:{enforceableJudgment:true}});step("SIM-003.4",s,"SERVE_ENFORCE");
 s=WVR.applyEvent(s,{set:{vehiclePossession:"RECOVERED"}});step("SIM-003.5",s,"CLOSE_POSSESSION_PATH");
 return s;
}
for(const [id,fn] of [["SIM-001",sim1],["SIM-002",sim2],["SIM-003",sim3]]){const s=fn();assert(s.decision_history.length>0,`${id}: decision history missing`);out.push(`${id} — PASS`)}
console.log(out.join("\n"));console.log("3/3 simulation contracts passed.");
