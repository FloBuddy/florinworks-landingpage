// Liquid glass ribbon: a single full-screen fragment shader, no libraries.
// The ribbon is a twisting band around an animated centre line. Its surface
// normal is faked from the twist and curvature, then lit by a procedural
// studio environment with fresnel and a little thin-film iridescence.
(() => {
  const canvas = document.getElementById('liquid');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  if (!gl) return;

  const vert = `attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
  const frag = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uScroll;

float hash(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*45758.5);}

vec3 env(vec3 r){
  float y = r.y;
  vec3 c = mix(vec3(.004,.005,.009), vec3(.02,.03,.055), smoothstep(-.5,.7,y));
  c += vec3(.80,.88,1.) * smoothstep(.62,.97,y) * 2.2;                       // softbox above
  c += vec3(.70,.80,1.) * pow(max(0.,sin(y*9. + r.x*2.2 + uTime*.12)), 18.) * 1.3; // chrome stripes
  c += vec3(.55,.68,1.) * pow(max(0.,1.-abs(r.x-.45)*4.),8.) * smoothstep(-.2,.5,y) * 1.2; // side strip
  c += vec3(1.) * pow(max(0.,sin(r.x*6.+uTime*.18)),60.) * .7;                // travelling glints
  c += vec3(.20,.50,.45) * smoothstep(-.3,-.95,y) * .3;                        // floor bounce
  return c;
}

// one ribbon; returns premultiplied rgba
vec4 ribbon(vec2 p, float phase, float scale, float bright){
  float t = uTime*.22 + phase;
  float x = p.x;
  float yc = .22*x + .15*sin(1.5*x + t) + .07*sin(3.2*x - t*1.4 + uMouse.x*1.2) + .05*uMouse.y + .06;
  float dy = .22 + .225*cos(1.5*x + t) + .224*cos(3.2*x - t*1.4 + uMouse.x*1.2);
  float tw = cos(1.15*x + t*1.3 + .6*sin(t*.7));
  float w = (.010 + .095*abs(tw)) * scale;
  float s = (p.y - yc) / w;
  float a = 1. - smoothstep(.9, 1.0, abs(s));
  if (a <= 0.) {
    float g = exp(-pow((p.y-yc)/(w*2.6),2.)) * .08 * bright;
    return vec4(vec3(.35,.5,.9)*g, g*.6);
  }
  float facing = sign(tw);
  float bulge = sqrt(max(0.,1.-s*s));
  float ss = s*s*s;
  vec3 n = normalize(vec3(-dy*.9 + ss*.3, (s*.7+ss*.3)*facing + dy*.25, bulge*(.25+.75*abs(tw))));
  vec3 v = vec3(0.,0.,1.);
  vec3 r = reflect(-v, n);
  float fres = pow(1.-max(0.,dot(n,v)), 2.2);
  vec3 col = env(r);
  vec3 film = .5 + .5*cos(6.2831*(fres*1.4 + s*.15 + vec3(0.,.33,.67)) + t);
  col = mix(col, col*film*1.6, .35*fres);
  col += vec3(1.) * pow(max(0.,dot(r, normalize(vec3(-.3,.8,.5)))), 60.) * 1.6;
  col *= mix(.7, 1.25, fres) * bright;
  float edge = smoothstep(.6,.98,abs(s));
  col += vec3(.7,.8,1.) * edge * .35 * bright;
  return vec4(col*a, a);
}

vec4 over(vec4 top, vec4 bot){ return top + bot*(1.-top.a); }

vec4 scene(vec2 p){
  vec2 q = p - vec2(.22, -.02);
  vec4 c = ribbon(q*vec2(1.,1.) + vec2(0.,.02), 0., 1., 1.);
  vec4 b = ribbon(q*1.35 + vec2(.4,-.08), 2.1, .55, .55);
  return over(c, b);
}

void main(){
  vec2 p = (gl_FragCoord.xy - .5*uRes) / uRes.y;
  p.y += uScroll*.25;
  if (uRes.y > uRes.x) p.y -= .16;   // portrait: lift the ribbon above the headline
  vec3 bg = vec3(.012,.013,.018);
  bg += vec3(.035,.045,.08) * exp(-pow(length(p-vec2(.4,.1)),2.)*3.);
  float h = -.40;
  vec4 col = vec4(0.);
  if (p.y > h) {
    col = scene(p);
  } else {
    float d = h - p.y;
    vec2 rp = vec2(p.x + .012*sin(p.y*90. + uTime*1.2)*d*6., h + d*1.05);
    col = scene(rp) * .32 * exp(-d*4.);
  }
  float dim = uRes.x > uRes.y ? mix(.28, 1., smoothstep(-.75, .15, p.x)) : .6;
  vec3 outc = bg*(1.-col.a) + col.rgb*dim;
  outc += (hash(gl_FragCoord.xy + uTime) - .5) * .025;
  outc = outc / (1. + outc*.35);
  gl_FragColor = vec4(outc, 1.);
}`;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, vert);
  const fs = compile(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) return;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uMouse = gl.getUniformLocation(prog, 'uMouse');
  const uScroll = gl.getUniformLocation(prog, 'uScroll');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', (e) => {
    mouse.tx = (e.clientX / innerWidth - .5) * 2;
    mouse.ty = -(e.clientY / innerHeight - .5) * 2;
  }, { passive: true });

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, innerWidth < 800 ? 1.5 : 1.25);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
  }

  let visible = true;
  let raf = 0;
  let last = performance.now();
  let time = 8;
  function frame(now) {
    raf = 0;
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    time += dt;
    mouse.x += (mouse.tx - mouse.x) * .04;
    mouse.y += (mouse.ty - mouse.y) * .04;
    resize();
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, time);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uScroll, Math.min(1, scrollY / innerHeight));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (visible && !reduce.matches && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };

  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) start(); });
  reduce.addEventListener?.('change', start);
  addEventListener('resize', start);
  addEventListener('scroll', () => { if (reduce.matches) start(); }, { passive: true });
  document.documentElement.classList.add('has-webgl');
  start();
})();
