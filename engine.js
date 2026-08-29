(function(root){
"use strict";
const ACTIONS=["VERIFY","REQUEST_RECORD","PRESERVE_EVIDENCE","REQUEST_REVIEW","PROVIDE_DOCUMENT","DISPUTE_RECALCULATE","TENDER_PAY","CONTACT_RIGHTS_HOLDER","DEMAND_RELEASE","FILE_ESCALATE","SERVE_ENFORCE","PHYSICALLY_RECOVER"];
function blocker(type,state="ACTIVE",source=null){return{type,state,source}}
function newCase(x={}){
 const s={vehicle:{location:x.custody||"UNKNOWN"},stated_reason_raw:x.reason||"",objective:x.objective||"RECOVER",
 sale_danger:{value:x.saleDanger||"UNSURE",status:x.saleDanger==="YES"||x.saleDanger==="NO"?"CLAIMED":"UNKNOWN"},
 blockers:[],evidence:[],actions:[],lifecycle:"INTAKE",current_recommendation:null};
 const r=(x.reason||"").toLowerCase();
 if(x.custody==="POLICE_HAVE_IT"||/evidence|police hold/.test(r))s.blockers.push(blocker("POLICE_EVIDENCE"));
 if(/fee|bill|storage|tow charge|payment|lien/.test(r))s.blockers.push(blocker("MONEY_LIEN"));
 if(/ticket|citation|parking/.test(r))s.blockers.push(blocker("GOVERNMENT_CITATION"));
 if(s.sale_danger.value==="YES")s.blockers.push(blocker("SALE_DISPOSAL"));
 if(!s.blockers.length)s.blockers.push(blocker("UNKNOWN"));
 return s;
}
function active(s,t){return (s.blockers||[]).some(b=>b.type===t&&b.state==="ACTIVE")}
function releaseReady(s){return !(s.blockers||[]).some(b=>b.state==="ACTIVE"&&b.type!=="SALE_DISPOSAL")}
function eligible(s,a){
 if(!ACTIONS.includes(a))return false;
 if(a==="FILE_ESCALATE")return !!(s.allPossessionBlockersResolved&&s.releaseDemand==="CONFIRMED"&&s.refusal==="CONFIRMED"&&s.ordinaryReplevinLaneValidated);
 if(a==="SERVE_ENFORCE")return !!s.enforceableJudgment;
 if(a==="PHYSICALLY_RECOVER")return releaseReady(s);
 return true;
}
function select(s){
 if(s.vehiclePossession==="RECOVERED")return "CLOSE_POSSESSION_PATH";
 if(s.saleDeadlineHours!=null&&s.saleDeadlineHours<=48||active(s,"SALE_DISPOSAL"))return "PRESERVE_EVIDENCE";
 if(s.towerHoldClaim==="YES"&&s.policeRecord==="CONFLICTS")return "VERIFY";
 if(s.objective==="BELONGINGS"&&s.abandonmentConsequence==="UNRESOLVED")return "VERIFY";
 if(active(s,"POLICE_EVIDENCE"))return "VERIFY";
 if(active(s,"MONEY_LIEN"))return "DISPUTE_RECALCULATE";
 if(active(s,"GOVERNMENT_CITATION"))return "REQUEST_REVIEW";
 if(releaseReady(s)&&s.releaseDemand==="CONFIRMED"&&s.refusal==="CONFIRMED"&&eligible(s,"FILE_ESCALATE"))return "FILE_ESCALATE";
 if(releaseReady(s))return "DEMAND_RELEASE";
 return "VERIFY";
}
function economics(s){
 if(s.freeAction&&s.freeAction.cost===0&&s.freeAction.delayExposure&&s.recoverNow&&s.recoverNow.costPositive&&s.recoverNow.rightsPreserved)return "TOTAL_RECOVERY_ECONOMICS";
 return null;
}
const COPY={
 PRESERVE_EVIDENCE:["Low / usually records first","Immediate","A sale or disposal deadline can permanently change the recovery path.","Save every notice and deadline, then contact the custodian today to verify the exact disposition date.","Do not wait on a slower free option while the vehicle may be disposed of."],
 VERIFY:["Usually free","Fast","A material fact is unknown or conflicting. The engine will not guess.","Verify the hold, custody reason, or authority with the source that controls it.","Do not pay, empty the vehicle, or file in court based on an unverified assumption."],
 DISPUTE_RECALCULATE:["Usually free to start","Fast","A claimed towing/storage lien can block release even when part of the bill may be wrong.","Get the itemized bill and the records needed to test the lien and recalculate the amount.","Do not assume an illegal fee automatically makes the vehicle release-ready."],
 REQUEST_REVIEW:["Usually free / low cost","Varies","An upstream government or citation review may change the release path before court is necessary.","Request the current review or release procedure and preserve the deadline.","Do not escalate to court until the cheaper upstream route is checked."],
 DEMAND_RELEASE:["Low","Fast","No active possession-defeating blocker is currently established.","Make a documented release demand and preserve the response.","Do not treat silence or refusal as permission to take the vehicle yourself."],
 FILE_ESCALATE:["Court costs may apply","Varies","Blockers are resolved and a documented refusal can make ordinary replevin an eligible escalation.","Validate the current filing lane, fee-waiver option, forms, service, and court procedure before filing.","Do not use post-judgment enforcement forms before an enforceable judgment exists."],
 CLOSE_POSSESSION_PATH:["None","Now","The vehicle is already recovered, so possession enforcement no longer serves the recovery objective.","Stop the possession track and preserve any remaining refund, damage, or records issues.","Do not continue possession litigation as though the custodian still has the car."]
};
function recommend(s){
 const action=select(s), c=COPY[action]||COPY.VERIFY;
 const r={action,cost:c[0],time:c[1],why:c[2],next:c[3],warning:c[4]||""};
 s.current_recommendation={...r,created_at:new Date().toISOString()}; return r;
}
function evaluateFixture(g){
 const s={blockers:[],...g};
 if(g.activeBlockers)s.blockers=g.activeBlockers.map(x=>blocker(x));
 for(const t of ["MONEY_LIEN","POLICE_EVIDENCE"])if(g[t])s.blockers.push(blocker(t,g[t]));
 if(g.allPossessionBlockersResolved)s.blockers=[];
 if(g.saleDeadlineHours!=null)s.saleDeadlineHours=g.saleDeadlineHours;
 return{action:select(s),releaseReady:releaseReady(s),eligible:a=>eligible(s,a),economics:economics(s)};
}
root.WVR={ACTIONS,newCase,releaseReady,eligible,select,recommend,evaluateFixture};
})(typeof window!=="undefined"?window:globalThis);