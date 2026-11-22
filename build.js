// Bundle each dependency in its own scope. The resulting page also runs via file://.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const read=name=>readFile(new URL(name,import.meta.url),'utf8');
const names=['vehicles','art','sound','game','city','input','garage'];
const bundleImports=code=>code.replace(/^import \{([^}]+)\} from '\.\/(\w+)\.js';$/gm,'const {$1}=$2Module;');
const source=[];
for(const name of names){
 const code=await read(name+'.js');
 const exported=[...code.matchAll(/^export (?:class|function|const) (\w+)/gm)].map(m=>m[1]);
 source.push('const '+name+'Module=(()=>{\n'+bundleImports(code).replace(/^export /gm,'')+'\nreturn {'+exported.join(',')+'};})();');
}
const app=bundleImports(await read('app.js'));
const css=await read('style.css');
const html=(await read('index.html')).replace('<link rel="stylesheet" href="./style.css">',()=>'<style>'+css+'</style>');
const built=html.replace('<script type="module" src="./app.js"></script>',()=>'<script type="module">'+source.join('\n')+'\n'+app+'</script>');
await mkdir('dist',{recursive:true});
await writeFile('dist/index.html',built);
console.log('Built dist/index.html ('+Buffer.byteLength(built)+' bytes)');
