import path from "node:path"

const file = path.resolve(process.argv[2] ?? ".cache/home-frame.json")
if (!await Bun.file(file).exists()) throw new Error("Run bun script/smoke.ts to capture a TUI frame first")
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch(request) {
    if (new URL(request.url).pathname === "/frame.json") return new Response(Bun.file(file))
    return new Response(`<!doctype html><html><head><title>Taco Code captured terminal frame</title>
<style>body{margin:0;background:#120f18}pre{margin:0;padding:8px;font:16px/20px "Cascadia Mono",Consolas,monospace;white-space:pre}span{display:inline-block;height:20px;vertical-align:top}</style></head>
<body><pre id="frame"></pre><script>
fetch('/frame.json').then(r=>r.json()).then(frame=>{
  const output=document.getElementById('frame');
  for(const line of frame.lines){
    for(const cell of line.spans){
      const span=document.createElement('span');
      span.textContent=cell.text;
      span.style.color='rgb('+cell.fg.slice(0,3).join(',')+')';
      span.style.backgroundColor='rgb('+cell.bg.slice(0,3).join(',')+')';
      output.append(span);
    }
    output.append(document.createTextNode('\\n'));
  }
});
</script></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } })
  },
})
console.log(`Captured-frame preview: ${server.url} (PID ${process.pid})`)
