// Text is always rendered through React's escaped text nodes; never as raw HTML.
export function normalizeDisplayText(value='') {
 const parts=String(value).replace(/\r\n/g,'\n').split(/(```[\s\S]*?```)/g);
 return parts.map((part,index)=>index%2?part:part
  .replace(/\\n(?=\\n|\s*(?:#{1,6}\s|Cycle evidence assessment:))/g,'\n')
  .replace(/\\n(?=\n)/g,'\n')
  .replace(/[ \t]+(?=#{1,6}\s)/g,'\n\n')
  .replace(/(^|\n)(#{1,6}\s+(?:Overview|Assumptions|Conclusion|Next Actions|Metrics for Success|Risks))\s+(?=[A-Z0-9])/g,'$1$2\n\n')
  .replace(/[ \t]+---[ \t]+/g,'\n\n---\n\n')
  .replace(/(?<!-)[ \t]+(?=(?:-\s*)?\*\*(?:Owner|Priority|Timing|Actions|Next Actions|Risks|Metrics)\s*:\*\*)/gi,'\n')
  .replace(/[ \t]+(?=-\s*\*{0,2}(?:Owner|Priority|Timing|Actions|Next Actions|Risks|Metrics)\b)/gi,'\n')
 ).join('').trim();
}
export function displayBlocks(value='') {
 const lines=normalizeDisplayText(value).split('\n'),blocks=[];
 let code=null;
 for(const line of lines) {
  if(/^\s*```/.test(line)){if(code!==null){blocks.push({type:'code',text:code.join('\n')});code=null;}else code=[];continue;}
  if(code!==null){code.push(line);continue;}
  const heading=line.match(/^\s*(#{1,6})\s+(.+)$/);
  if(heading){blocks.push({type:'heading',level:heading[1].length,text:heading[2]});continue;}
  if(/^\s*---\s*$/.test(line)){blocks.push({type:'rule'});continue;}
  const bullet=line.match(/^\s*(?:[-*]\s+|\d+\.\s+)(.*)$/);
  if(bullet){blocks.push({type:'list_item',ordered:/^\s*\d+\./.test(line),text:bullet[1]});continue;}
  if(line.trim())blocks.push({type:'paragraph',text:line.trim()});
 }
 if(code!==null)blocks.push({type:'code',text:code.join('\n')});
 return blocks;
}
