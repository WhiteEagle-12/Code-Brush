#!/usr/bin/env node
import {dispatch,methods} from './agent-api.mjs';
import {atomic} from './production.mjs';
let input='',request;for await(const chunk of process.stdin)input+=chunk;
try{request=JSON.parse(input);const result=request.method==='tools.list'?{methods}:await dispatch(request.method,request.args);process.stdout.write(JSON.stringify({ok:true,result})+'\n');}catch(e){
 if(request?.method==='film.render'&&request.args?.jobFile)await atomic(request.args.jobFile,JSON.stringify({state:'failed',error:e.message,project:request.args.project,output:request.args.output})).catch(()=>{});
 process.stdout.write(JSON.stringify({ok:false,error:e.message})+'\n');process.exitCode=1;
}
