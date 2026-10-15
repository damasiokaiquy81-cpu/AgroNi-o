import { z } from 'zod';
export const ruleSchema = z.object({id:z.string(),name:z.string().min(3),city:z.string(),crop:z.string(),threshold:z.number().positive(),hours:z.number().min(1).max(384),guidance:z.string().min(10),active:z.boolean()});
export type Rule = z.infer<typeof ruleSchema>;
export function evaluateRain(rule:Rule, hourly:number[]) { return rule.active && hourly.slice(0,rule.hours).reduce((a,b)=>a+b,0)>=rule.threshold; }
export function eventKey(ruleId:string,region:string,period:string) { return `${ruleId}:${region}:${period}`; }
