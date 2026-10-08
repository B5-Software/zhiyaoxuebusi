import type { Child } from './lifeTypes';
import { createBody, limit } from './lifeHealth';
export function childProfile(c:Child,week:number){
 const age=Math.max(0,(week-c.bornWeek)/52);
 return c.profile??={enrolled:age>=18&&age<24&&c.education>=50,degree:false,credits:0,collegeWeeks:0,prestige:c.education>=80?80:c.education>=60?55:35,body:createBody(),technical:Math.min(60,c.education/2),workWeeks:0};
}
export function advanceChild(c:Child,week:number,careShare:number,parentCared:boolean,shortfall:number){
 const p=childProfile(c,week),age=(week-c.bornWeek)/52;
 c.care=limit(c.care+(parentCared?1.5:-1.2)+careShare*2-(shortfall>0?1:0));
 if(age<18)c.education=limit(c.education+(age>=6?.13:.05)*c.care/100);
 if(age>=18&&age<18+1/52){p.enrolled=c.education>=50;p.prestige=c.education>=80?80:c.education>=60?55:35;}
 if(p.enrolled&&!p.degree){p.collegeWeeks++;if(p.collegeWeeks%52<40&&c.care>=35){p.credits++;p.technical=limit(p.technical+.2);}if(p.collegeWeeks>=208&&p.credits>=160)p.degree=true;}
 if(age>=18&&!p.enrolled||p.degree){p.workWeeks++;p.technical=limit(p.technical+.02);}
 const b=p.body;if(age>=15&&age<18){b.schoolWeeks++;b.habits.sleep=limit(b.habits.sleep-.04);b.habits.strain=limit(b.habits.strain+.05);}b.habits.diet=limit(b.habits.diet+(shortfall?-.2:.025));b.habits.sleep=limit(b.habits.sleep+(c.care-60)*.002);b.habits.strain=limit(b.habits.strain+(c.care<40?.1:-.02));b.internal.metabolic=limit(b.internal.metabolic+(b.habits.diet-58)*.002);b.internal.vascular=limit(b.internal.vascular+(b.habits.sleep-60)*.001-b.habits.strain*.001);b.internal.cardiac=limit(b.internal.cardiac-b.habits.strain*.0005);
}
