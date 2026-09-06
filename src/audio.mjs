import path from'node:path';
/** Build a deterministic FFmpeg mix. Video is input 0; audio starts at 1. */
export function audioGraph(project,base){
 const tracks=project.audioTracks??(project.audio?[{file:project.audio}]:[]);const inputs=[],filters=[];
 tracks.forEach((t,i)=>{inputs.push('-i',path.resolve(base,t.file));const chain=[`atrim=start=${t.trim??0}${t.duration?':duration='+t.duration:''}`,'asetpts=PTS-STARTPTS','aformat=channel_layouts=stereo',`volume=${t.gain??1}`];if(t.fadeIn)chain.push(`afade=t=in:st=0:d=${t.fadeIn}`);if(t.fadeOut&&t.duration)chain.push(`afade=t=out:st=${Math.max(0,t.duration-t.fadeOut)}:d=${t.fadeOut}`);chain.push(`adelay=${Math.round((t.start??0)*1000)}:all=1`);filters.push(`[${i+1}:a]${chain.join(',')}[a${i}]`);});
 if(tracks.length)filters.push(tracks.map((_,i)=>`[a${i}]`).join('')+`amix=inputs=${tracks.length}:normalize=0,alimiter=limit=0.95:level=false,apad[mix]`);
 return{inputs,filters:filters.join(';'),enabled:tracks.length>0};
}
