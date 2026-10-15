import {Queue,Worker} from 'bullmq';
const url=new URL(process.env.REDIS_URL||'redis://localhost:6379');
const connection={host:url.hostname,port:Number(url.port||6379),password:url.password||undefined};
const queue=new Queue('agronino-maintenance',{connection});
async function main(){
 await queue.upsertJobScheduler('source-health',{every:3600000},{name:'source-health',data:{sandbox:true},opts:{attempts:3,backoff:{type:'exponential',delay:5000},removeOnComplete:100,removeOnFail:100}});
 const worker=new Worker('agronino-maintenance',async job=>{
 // No production ingestion or notifications until adapters and consent checks are implemented.
 console.log(JSON.stringify({jobId:job.id,name:job.name,status:'sandbox',message:'Infrastructure heartbeat; production adapters not enabled',at:new Date().toISOString()}));
 },{connection,concurrency:2});
 worker.on('failed',(job,error)=>console.error(JSON.stringify({jobId:job?.id,error:error.message})));
 const stop=async()=>{await worker.close();await queue.close();process.exit(0)};
 process.on('SIGTERM',stop);process.on('SIGINT',stop);
}
main().catch(error=>{console.error(error.message);process.exit(1)});
