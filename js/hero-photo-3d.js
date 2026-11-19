/* MFYZI - Replaces the Ghostface embed with YOUR photo, rendered with a real 3D depth effect.
   Put your photo at: assets/me.jpg  (change PHOTO below if you use another name) */
(function () {
  'use strict';
  const PHOTO = 'assets/hero.gif'; // .gif / .mp4 / .webm = animated (plain 3D tilt) | .jpg / .png = full WebGL depth 3D
  const card = document.getElementById('hero-photo-card');
  if (!card) return;
  const old = card.querySelector('iframe.hero-photo-pin-embed') || card.querySelector('iframe');
  const holder = document.createElement('div');
  Object.assign(holder.style, { position: 'absolute', inset: '0', overflow: 'hidden', borderRadius: 'inherit', background: '#05060d' });
  if (old) old.replaceWith(holder); else card.prepend(holder);

  function parallax(el) { // subtle depth shift that follows the cursor
    el.style.transition = 'transform .25s ease-out'; el.style.transform = 'scale(1.1)';
    card.addEventListener('mousemove', e => { const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5; el.style.transform = `scale(1.12) translate(${-px * 20}px,${-py * 20}px)`; });
    card.addEventListener('mouseleave', () => { el.style.transform = 'scale(1.1)'; });
  }
  if (/\.(mp4|webm)(\?|$)/i.test(PHOTO)) {
    const v = document.createElement('video'); v.src = PHOTO; v.autoplay = v.loop = v.muted = v.playsInline = true;
    Object.assign(v.style, { width: '100%', height: '100%', objectFit: 'cover', display: 'block' });
    v.onerror = () => { if (old) holder.replaceWith(old); else holder.textContent = 'PUT YOUR FILE AT ' + PHOTO; };
    holder.appendChild(v); v.play().catch(() => {}); parallax(v); return;
  }
  const isGif = /\.gif(\?|$)/i.test(PHOTO);
  const img = new Image();
  img.onerror = () => { if (old) { holder.replaceWith(old); return; } holder.style.cssText += ';display:flex;align-items:center;justify-content:center;color:#7fdcff;font:12px monospace;letter-spacing:.2em;text-align:center'; holder.textContent = 'PUT YOUR PHOTO AT ' + PHOTO; };
  img.onload = () => (isGif ? plain() : start(img));
  img.src = PHOTO;

  function plain() {
    const i = img.cloneNode(); Object.assign(i.style, { width: '100%', height: '100%', objectFit: 'cover', display: 'block' });
    holder.appendChild(i); parallax(i);
  }

  function start(img) {
    const cv = document.createElement('canvas');
    Object.assign(cv.style, { width: '100%', height: '100%', display: 'block' });
    holder.appendChild(cv);
    const gl = cv.getContext('webgl', { antialias: true, premultipliedAlpha: false });
    if (!gl) { holder.removeChild(cv); return plain(); }

    const vs = 'attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;v.y=1.-v.y;gl_Position=vec4(p,0.,1.);}';
    const fs = `precision highp float;varying vec2 v;uniform sampler2D t;uniform vec2 m,sc,px;uniform float k;
      float lum(vec2 u){vec3 c=texture2D(t,u).rgb;return dot(c,vec3(.299,.587,.114));}
      float depth(vec2 u){
        float s=lum(u)*.4+lum(u+vec2(px.x*6.,0.))*.15+lum(u-vec2(px.x*6.,0.))*.15+lum(u+vec2(0.,px.y*6.))*.15+lum(u-vec2(0.,px.y*6.))*.15;
        float r=distance(u,vec2(.5,.48));
        return s*.55+(1.-smoothstep(0.,.62,r))*.55;}
      void main(){
        vec2 u=(v-.5)*sc+.5;
        float d=depth(u);
        vec2 off=(m-.5)*vec2(-1.,1.)*(d-.45)*.075;
        vec2 uv=u+off*vec2(1.,-1.)*-1.;
        vec3 col=texture2D(t,uv).rgb;
        // pseudo normal from depth, lit by a light that follows the cursor
        float e=.004;
        vec3 n=normalize(vec3((depth(uv-vec2(e,0.))-depth(uv+vec2(e,0.)))*5.,(depth(uv-vec2(0.,e))-depth(uv+vec2(0.,e)))*5.,1.));
        vec3 L=normalize(vec3((m.x-.5)*1.6,(.5-m.y)*1.6,.9));
        float dif=clamp(dot(n,L),0.,1.);
        float spec=pow(clamp(dot(reflect(-L,n),vec3(0.,0.,1.)),0.,1.),22.);
        col*=.78+dif*.45;
        col+=spec*.16*vec3(.7,.9,1.);
        // rim / vignette for volume
        float r=distance(v,vec2(.5));
        col*=1.-smoothstep(.45,.85,r)*.5;
        col+=vec3(0.,.35,.6)*smoothstep(.5,.78,r)*.12;
        gl_FragColor=vec4(col,1.);}`;
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; };
    const pr = gl.createProgram(); gl.attachShader(pr, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { holder.removeChild(cv); return plain(); }
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    const pot = n => (n & (n - 1)) === 0;
    if (pot(img.width) && pot(img.height)) { gl.generateMipmap(gl.TEXTURE_2D); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); }
    else { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); }
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const U = n => gl.getUniformLocation(pr, n);
    let tm = { x: .5, y: .5 }, cm = { x: .5, y: .5 }, hov = false;

    function resize() {
      const d = Math.min(devicePixelRatio || 1, 2), w = card.offsetWidth, h = card.offsetHeight;
      cv.width = w * d; cv.height = h * d; gl.viewport(0, 0, cv.width, cv.height);
      const ca = w / h, ia = img.width / img.height; // cover fit
      gl.uniform2f(U('sc'), ca > ia ? 1 : ca / ia, ca > ia ? ia / ca : 1);
      gl.uniform2f(U('px'), 1 / img.width, 1 / img.height);
    }
    addEventListener('resize', resize); resize();
    card.addEventListener('mousemove', e => { const r = card.getBoundingClientRect(); tm.x = (e.clientX - r.left) / r.width; tm.y = (e.clientY - r.top) / r.height; hov = true; });
    card.addEventListener('mouseleave', () => { tm.x = tm.y = .5; hov = false; });
    (function loop(t) {
      requestAnimationFrame(loop);
      if (!hov) { tm.x = .5 + Math.sin(t * .0007) * .18; tm.y = .5 + Math.cos(t * .0009) * .12; } // idle breathing
      cm.x += (tm.x - cm.x) * .08; cm.y += (tm.y - cm.y) * .08;
      gl.uniform2f(U('m'), cm.x, cm.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    })(0);
  }
})();
