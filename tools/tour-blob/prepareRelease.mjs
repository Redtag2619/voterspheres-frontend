import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { inspectLocal, publicOrigin } from './uploadCore.mjs';
const args=process.argv.slice(2);
try {
 if(args.some(a=>a!=='--apply'&&!a.startsWith('--archive-dir=')))throw new Error('Unknown options.');
 const repo=process.cwd();const directory=path.join(repo,'public/tour-audio');
 const archiveArg=args.find(a=>a.startsWith('--archive-dir='))?.slice(14);
 if(!archiveArg)throw new Error('Supply --archive-dir=<new folder outside the repository>. Preview is default.');
 const archive=path.resolve(archiveArg);const rel=path.relative(repo,archive);
 if(!rel.startsWith('..'+path.sep)&&!path.isAbsolute(rel))throw new Error('Archive must be outside the repository.');
 try{await fs.access(archive);throw new Error('Archive destination already exists.');}catch(error){if(error.code!=='ENOENT')throw error;}
 const local=await inspectLocal(directory);
 const hosting=JSON.parse(await fs.readFile('src/config/tourAudioHosting.json','utf8'));
 publicOrigin(hosting.base_url);
 if(hosting.verified_clips!==local.manifest.clips.length||hosting.manifest_sha256!==local.manifestHash||hosting.plan!==local.manifest.plan)throw new Error('Remote verification receipt does not match these recordings.');
 const tracked=execFileSync('git',['ls-files','--','public/tour-audio'],{encoding:'utf8'}).split(/\r?\n/).filter(p=>p.endsWith('.mp3'));
 if(tracked.length)throw new Error('Audio MP3s are already tracked in Git. Review staging/history before archiving.');
 if(args.includes('--apply')){
  await fs.mkdir(path.dirname(archive),{recursive:true});await fs.rename(directory,archive);
  try {await fs.mkdir(directory,{recursive:true});await fs.writeFile(path.join(directory,'.gitignore'),'.recording.lock\n.blob-upload.lock\n*.tmp\n*.mp3\nmanifest.json\n');}
  catch(error){await fs.rm(directory,{recursive:true,force:true});await fs.rename(archive,directory);throw error;}
 }
 console.log(JSON.stringify({ok:true,mode:args.includes('--apply')?'archived-for-release':'preview',archive,clips:local.manifest.clips.length,policy:'Recordings preserved outside build output. No deletions, generation, uploads, commits or deployments.'},null,2));
}catch(error){console.error(JSON.stringify({ok:false,error:error.message}));process.exitCode=1;}
