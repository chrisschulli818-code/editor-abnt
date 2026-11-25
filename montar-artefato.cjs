// Junta o build de dist-art em um único artefato.html (JS e CSS inline), com o manifesto do app desktop.
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'dist-art', 'assets'), arq = e => fs.readdirSync(dir).filter(f => f.endsWith(e)).map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
const js = arq('.js').replace(/<\/script/gi, '<\/script'), css = arq('.css');
const icone = `(async()=>{const d=await claude.use('desktop').catch(()=>null);if(!d?.app)return;const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#1f5a3d';x.fillRect(0,0,256,256);x.fillStyle='#f4f6f2';x.font='bold 150px Georgia,serif';x.textAlign='center';x.textBaseline='middle';x.fillText('A',128,136);d.app.dock.setIcon(c.toDataURL('image/png')).catch(()=>{});})();`;
fs.writeFileSync(path.join(__dirname, 'artefato-editor.html'), `<title>Editor ABNT</title>
<style>${css}</style>
<script type="application/json" id="claude-artifacts-manifest">{"permissions":[]}</script>
<div id="root"></div>
<script type="module">${icone}</script>
<script type="module">${js}</script>
`);
console.log('ok', fs.statSync(path.join(__dirname, 'artefato-editor.html')).size);
