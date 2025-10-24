// @ts-nocheck

function normalizeColor(hexCode: number): number[] {
  return [
    ((hexCode >> 16) & 255) / 255,
    ((hexCode >> 8) & 255) / 255,
    (255 & hexCode) / 255,
  ];
}

class MiniGl {
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  meshes: any[] = [];
  commonUniforms: any = {};
  width: number = 0;
  height: number = 0;
  debug: (message: string, ...args: any[]) => void = () => {};
  lastDebugMsg: number = 0;
  Material: any;
  Uniform: any;
  PlaneGeometry: any;
  Mesh: any;
  Attribute: any;

  constructor(
    canvas: HTMLCanvasElement,
    width?: number | null,
    height?: number | null,
    debug: boolean = false
  ) {
    this.canvas = canvas;
    const context = this.canvas.getContext('webgl', { antialias: true });
    if (!context) {
      console.error('WebGL not supported');
      return;
    }
    this.gl = context;

    const _miniGl = this;
    const debug_output =
      -1 !== document.location.search.toLowerCase().indexOf('debug=webgl');
    width && height && this.setSize(width, height);

    this.debug =
      debug && debug_output
        ? function (e) {
            const t = new Date();
            if (t.getTime() - _miniGl.lastDebugMsg > 1000) console.log('---');
            console.log(
              t.toLocaleTimeString() +
                Array(Math.max(0, 32 - e.length)).join(' ') +
                e +
                ': ',
              ...Array.from(arguments).slice(1)
            );
            _miniGl.lastDebugMsg = t.getTime();
          }
        : () => {};

    Object.defineProperties(_miniGl, {
      Material: {
        enumerable: false,
        value: class {
          constructor(vertexShaders, fragments, uniforms = {}) {
            const material = this;
            function getShaderByType(type, source) {
              const shader = context.createShader(type);
              context.shaderSource(shader, source);
              context.compileShader(shader);
              if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
                console.error(context.getShaderInfoLog(shader));
              }
              _miniGl.debug('Material.compileShaderSource', { source: source });
              return shader;
            }
            function getUniformVariableDeclarations(uniforms, type) {
              return Object.entries(uniforms)
                .map(([uniform, value]) =>
                  (value as any).getDeclaration(uniform, type)
                )
                .join('\n');
            }
            material.uniforms = uniforms;
            material.uniformInstances = [];

            const prefix =
              '\n              precision highp float;\n            ';
            material.vertexSource = `\n              ${prefix}\n              attribute vec4 position;\n              attribute vec2 uv;\n              attribute vec2 uvNorm;\n              ${getUniformVariableDeclarations(
              _miniGl.commonUniforms,
              'vertex'
            )}\n              ${getUniformVariableDeclarations(
              uniforms,
              'vertex'
            )}\n              ${vertexShaders}\n            `;
            material.Source = `\n              ${prefix}\n              ${getUniformVariableDeclarations(
              _miniGl.commonUniforms,
              'fragment'
            )}\n              ${getUniformVariableDeclarations(
              uniforms,
              'fragment'
            )}\n              ${fragments}\n            `;
            material.vertexShader = getShaderByType(
              context.VERTEX_SHADER,
              material.vertexSource
            );
            material.fragmentShader = getShaderByType(
              context.FRAGMENT_SHADER,
              material.Source
            );
            material.program = context.createProgram();
            context.attachShader(material.program, material.vertexShader);
            context.attachShader(material.program, material.fragmentShader);
            context.linkProgram(material.program);
            if (
              !context.getProgramParameter(
                material.program,
                context.LINK_STATUS
              )
            ) {
              console.error(context.getProgramInfoLog(material.program));
            }
            context.useProgram(material.program);
            material.attachUniforms(undefined, _miniGl.commonUniforms);
            material.attachUniforms(undefined, material.uniforms);
          }
          attachUniforms(name, uniforms) {
            const material = this;
            if (name === undefined) {
              Object.entries(uniforms).forEach(([name, uniform]) => {
                material.attachUniforms(name, uniform);
              });
            } else if ('array' == uniforms.type) {
              uniforms.value.forEach((uniform, i) =>
                material.attachUniforms(`${name}[${i}]`, uniform)
              );
            } else if ('struct' == uniforms.type) {
              Object.entries(uniforms.value).forEach(([uniform, i]) =>
                material.attachUniforms(`${name}.${uniform}`, i)
              );
            } else {
              _miniGl.debug('Material.attachUniforms', {
                name: name,
                uniform: uniforms,
              });
              material.uniformInstances.push({
                uniform: uniforms,
                location: context.getUniformLocation(material.program, name),
              });
            }
          }
        },
      },
      Uniform: {
        enumerable: false,
        value: class {
          constructor(e) {
            this.type = 'float';
            Object.assign(this, e);
            this.typeFn =
              {
                float: '1f',
                int: '1i',
                vec2: '2fv',
                vec3: '3fv',
                vec4: '4fv',
                mat4: 'Matrix4fv',
              }[this.type] || '1f';
            this.update();
          }
          update(value) {
            if (this.value !== undefined) {
              context[`uniform${this.typeFn}`](
                value,
                0 === this.typeFn.indexOf('Matrix')
                  ? this.transpose
                  : this.value,
                0 === this.typeFn.indexOf('Matrix') ? this.value : null
              );
            }
          }
          getDeclaration(name, type, length?) {
            const uniform = this;
            if (uniform.excludeFrom !== type) {
              if ('array' === uniform.type) {
                return (
                  uniform.value[0].getDeclaration(
                    name,
                    type,
                    uniform.value.length
                  ) + `\nconst int ${name}_length = ${uniform.value.length};`
                );
              }
              if ('struct' === uniform.type) {
                let name_no_prefix = name.replace('u_', '');
                name_no_prefix =
                  name_no_prefix.charAt(0).toUpperCase() +
                  name_no_prefix.slice(1);
                return (
                  `uniform struct ${name_no_prefix} {\n` +
                  Object.entries(uniform.value)
                    .map(([name, uniform]) =>
                      (uniform as any)
                        .getDeclaration(name, type)
                        .replace(/^uniform/, '')
                    )
                    .join('') +
                  `\n} ${name}${length > 0 ? `[${length}]` : ''};`
                );
              }
              return `uniform ${uniform.type} ${name}${
                length > 0 ? `[${length}]` : ''
              };`;
            }
            return '';
          }
        },
      },
      PlaneGeometry: {
        enumerable: false,
        value: class {
          constructor(width, height, n, i, orientation) {
            context.createBuffer();
            this.attributes = {
              position: new _miniGl.Attribute({
                target: context.ARRAY_BUFFER,
                size: 3,
              }),
              uv: new _miniGl.Attribute({
                target: context.ARRAY_BUFFER,
                size: 2,
              }),
              uvNorm: new _miniGl.Attribute({
                target: context.ARRAY_BUFFER,
                size: 2,
              }),
              index: new _miniGl.Attribute({
                target: context.ELEMENT_ARRAY_BUFFER,
                size: 3,
                type: context.UNSIGNED_SHORT,
              }),
            };
            this.setTopology(n, i);
            this.setSize(width, height, orientation);
          }
          setTopology(e = 1, t = 1) {
            const n = this;
            n.xSegCount = e;
            n.ySegCount = t;
            n.vertexCount = (n.xSegCount + 1) * (n.ySegCount + 1);
            n.quadCount = n.xSegCount * n.ySegCount * 2;
            n.attributes.uv.values = new Float32Array(2 * n.vertexCount);
            n.attributes.uvNorm.values = new Float32Array(2 * n.vertexCount);
            n.attributes.index.values = new Uint16Array(3 * n.quadCount);
            for (let e = 0; e <= n.ySegCount; e++) {
              for (let t = 0; t <= n.xSegCount; t++) {
                const i = e * (n.xSegCount + 1) + t;
                n.attributes.uv.values[2 * i] = t / n.xSegCount;
                n.attributes.uv.values[2 * i + 1] = 1 - e / n.ySegCount;
                n.attributes.uvNorm.values[2 * i] = (t / n.xSegCount) * 2 - 1;
                n.attributes.uvNorm.values[2 * i + 1] =
                  1 - (e / n.ySegCount) * 2;
                if (t < n.xSegCount && e < n.ySegCount) {
                  const s = e * n.xSegCount + t;
                  n.attributes.index.values[6 * s] = i;
                  n.attributes.index.values[6 * s + 1] = i + 1 + n.xSegCount;
                  n.attributes.index.values[6 * s + 2] = i + 1;
                  n.attributes.index.values[6 * s + 3] = i + 1;
                  n.attributes.index.values[6 * s + 4] = i + 1 + n.xSegCount;
                  n.attributes.index.values[6 * s + 5] = i + 2 + n.xSegCount;
                }
              }
            }
            n.attributes.uv.update();
            n.attributes.uvNorm.update();
            n.attributes.index.update();
            _miniGl.debug('Geometry.setTopology', {
              uv: n.attributes.uv,
              uvNorm: n.attributes.uvNorm,
              index: n.attributes.index,
            });
          }
          setSize(width = 1, height = 1, orientation = 'xz') {
            const geometry = this;
            geometry.width = width;
            geometry.height = height;
            geometry.orientation = orientation;
            if (
              !geometry.attributes.position.values ||
              geometry.attributes.position.values.length !==
                3 * geometry.vertexCount
            ) {
              geometry.attributes.position.values = new Float32Array(
                3 * geometry.vertexCount
              );
            }
            const o = width / -2;
            const r = height / -2;
            const segment_width = width / geometry.xSegCount;
            const segment_height = height / geometry.ySegCount;
            for (let yIndex = 0; yIndex <= geometry.ySegCount; yIndex++) {
              const t = r + yIndex * segment_height;
              for (let xIndex = 0; xIndex <= geometry.xSegCount; xIndex++) {
                const r_pos = o + xIndex * segment_width;
                const l = yIndex * (geometry.xSegCount + 1) + xIndex;
                geometry.attributes.position.values[
                  3 * l + 'xyz'.indexOf(orientation[0])
                ] = r_pos;
                geometry.attributes.position.values[
                  3 * l + 'xyz'.indexOf(orientation[1])
                ] = -t;
              }
            }
            geometry.attributes.position.update();
            _miniGl.debug('Geometry.setSize', {
              position: geometry.attributes.position,
            });
          }
        },
      },
      Mesh: {
        enumerable: false,
        value: class {
          constructor(geometry, material) {
            const mesh = this;
            mesh.geometry = geometry;
            mesh.material = material;
            mesh.wireframe = false;
            mesh.attributeInstances = [];
            Object.entries(mesh.geometry.attributes).forEach(
              ([e, attribute]) => {
                mesh.attributeInstances.push({
                  attribute: attribute,
                  location: (attribute as any).attach(e, mesh.material.program),
                });
              }
            );
            _miniGl.meshes.push(mesh);
            _miniGl.debug('Mesh.constructor', { mesh: mesh });
          }
          draw() {
            context.useProgram(this.material.program);
            this.material.uniformInstances.forEach(
              ({ uniform: e, location: t }) => e.update(t)
            );
            this.attributeInstances.forEach(({ attribute: e, location: t }) =>
              e.use(t)
            );
            context.drawElements(
              this.wireframe ? context.LINES : context.TRIANGLES,
              this.geometry.attributes.index.values.length,
              context.UNSIGNED_SHORT,
              0
            );
          }
          remove() {
            _miniGl.meshes = _miniGl.meshes.filter((e) => e != this);
          }
        },
      },
      Attribute: {
        enumerable: false,
        value: class {
          constructor(e) {
            this.type = context.FLOAT;
            this.normalized = false;
            this.buffer = context.createBuffer();
            Object.assign(this, e);
            this.update();
          }
          update() {
            if (this.values !== undefined) {
              context.bindBuffer(this.target, this.buffer);
              context.bufferData(this.target, this.values, context.STATIC_DRAW);
            }
          }
          attach(e, t) {
            const n = context.getAttribLocation(t, e);
            if (this.target === context.ARRAY_BUFFER) {
              context.enableVertexAttribArray(n);
              context.vertexAttribPointer(
                n,
                this.size,
                this.type,
                this.normalized,
                0,
                0
              );
            }
            return n;
          }
          use(e) {
            context.bindBuffer(this.target, this.buffer);
            if (this.target === context.ARRAY_BUFFER) {
              context.enableVertexAttribArray(e);
              context.vertexAttribPointer(
                e,
                this.size,
                this.type,
                this.normalized,
                0,
                0
              );
            }
          }
        },
      },
    });

    const a = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
    _miniGl.commonUniforms = {
      projectionMatrix: new _miniGl.Uniform({ type: 'mat4', value: a }),
      modelViewMatrix: new _miniGl.Uniform({ type: 'mat4', value: a }),
      resolution: new _miniGl.Uniform({ type: 'vec2', value: [1, 1] }),
      aspectRatio: new _miniGl.Uniform({ type: 'float', value: 1 }),
    };
  }

  setSize(e = 640, t = 480) {
    this.width = e;
    this.height = t;
    this.canvas.width = e;
    this.canvas.height = t;
    this.gl.viewport(0, 0, e, t);
    this.commonUniforms.resolution.value = [e, t];
    this.commonUniforms.aspectRatio.value = e / t;
    this.debug('MiniGL.setSize', { width: e, height: t });
  }

  setOrthographicCamera(e = 0, t = 0, n = 0, i = -2e3, s = 2e3) {
    this.commonUniforms.projectionMatrix.value = [
      2 / this.width,
      0,
      0,
      0,
      0,
      2 / this.height,
      0,
      0,
      0,
      0,
      2 / (i - s),
      0,
      e,
      t,
      n,
      1,
    ];
    this.debug(
      'setOrthographicCamera',
      this.commonUniforms.projectionMatrix.value
    );
  }

  render() {
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clearDepth(1);
    this.meshes.forEach((e) => e.draw());
  }
}

export class Gradient {
  el: HTMLElement | undefined;
  cssVarRetries: number = 0;
  maxCssVarRetries: number = 200;
  angle: number = 0;
  isLoadedClass: boolean = false;
  isScrolling: boolean = false;
  scrollingTimeout: any = undefined;
  scrollingRefreshDelay: number = 200;
  isIntersecting: boolean = true;
  shaderFiles: any = undefined;
  vertexShader: any = undefined;
  sectionColors: any = undefined;
  computedCanvasStyle: CSSStyleDeclaration | undefined;
  conf: any = undefined;
  uniforms: any = undefined;
  t: number = 1253106;
  last: number = 0;
  width: number = 0;
  minWidth: number = 1111;
  height: number = 600;
  xSegCount: number = undefined;
  ySegCount: number = undefined;
  mesh: any = undefined;
  material: any = undefined;
  geometry: any = undefined;
  minigl: MiniGl = undefined;
  scrollObserver: any = undefined;
  amp: number = 320;
  seed: number = 5;
  freqX: number = 14e-5;
  freqY: number = 29e-5;
  freqDelta: number = 1e-5;
  activeColors: number[] = [1, 1, 1, 1];
  isMetaKey: boolean = false;
  isGradientLegendVisible: boolean = false;
  isMouseDown: boolean = false;

  handleScroll = () => {
    clearTimeout(this.scrollingTimeout);
    this.scrollingTimeout = setTimeout(
      this.handleScrollEnd,
      this.scrollingRefreshDelay
    );
    if (this.isGradientLegendVisible) this.hideGradientLegend();
    if (this.conf.playing) {
      this.isScrolling = true;
      this.pause();
    }
  };

  handleScrollEnd = () => {
    this.isScrolling = false;
    if (this.isIntersecting) this.play();
  };

  resize = () => {
    this.width = window.innerWidth;
    this.minigl.setSize(this.width, this.height);
    this.minigl.setOrthographicCamera();
    this.xSegCount = Math.ceil(this.width * this.conf.density[0]);
    this.ySegCount = Math.ceil(this.height * this.conf.density[1]);
    this.mesh.geometry.setTopology(this.xSegCount, this.ySegCount);
    this.mesh.geometry.setSize(this.width, this.height);
    this.mesh.material.uniforms.u_shadow_power.value = this.width < 600 ? 5 : 6;
  };

  handleMouseDown = (e: MouseEvent) => {
    if (this.isGradientLegendVisible) {
      this.isMetaKey = e.metaKey;
      this.isMouseDown = true;
      if (this.conf.playing === false) requestAnimationFrame(this.animate);
    }
  };

  handleMouseUp = () => {
    this.isMouseDown = false;
  };

  animate = (e: number) => {
    if (!this.shouldSkipFrame(e) || this.isMouseDown) {
      this.t += Math.min(e - this.last, 1e3 / 15);
      this.last = e;
      if (this.isMouseDown) {
        let e_step = 160;
        if (this.isMetaKey) e_step = -160;
        this.t += e_step;
      }
      this.mesh.material.uniforms.u_time.value = this.t;
      this.minigl.render();
    }
    if (0 !== this.last && false) {
      this.minigl.render();
      return this.disconnect();
    }
    if ((this.isIntersecting && this.conf.playing) || this.isMouseDown) {
      requestAnimationFrame(this.animate);
    }
  };

  addIsLoadedClass = () => {
    if (this.isIntersecting && !this.isLoadedClass) {
      this.isLoadedClass = true;
      this.el.classList.add('isLoaded');
      setTimeout(() => {
        this.el.parentElement.classList.add('isLoaded');
      }, 3000);
    }
  };

  pause = () => {
    this.conf.playing = false;
  };

  play = () => {
    requestAnimationFrame(this.animate);
    this.conf.playing = true;
  };

  initGradient = (canvasElement: HTMLCanvasElement) => {
    this.el = canvasElement;
    if (!this.el) {
      console.error('Canvas element not found');
      return;
    }
    this.connect();
    return this;
  };

  async connect() {
    this.shaderFiles = {
      vertex:
        'varying vec3 v_color;\n\nvoid main() {\n  float time = u_time * u_global.noiseSpeed;\n\n  vec2 noiseCoord = resolution * uvNorm * u_global.noiseFreq;\n\n  vec2 st = 1. - uvNorm.xy;\n\n  //\n  // Tilting the plane\n  //\n\n  // Front-to-back tilt\n  float tilt = resolution.y / 2.0 * uvNorm.y;\n\n  // Left-to-right angle\n  float incline = resolution.x * uvNorm.x / 2.0 * u_vertDeform.incline;\n\n  // Up-down shift to offset incline\n  float offset = resolution.x / 2.0 * u_vertDeform.incline * mix(u_vertDeform.offsetBottom, u_vertDeform.offsetTop, uv.y);\n\n  //\n  // Vertex noise\n  //\n\n  float noise = snoise(vec3(\n    noiseCoord.x * u_vertDeform.noiseFreq.x + time * u_vertDeform.noiseFlow,\n    noiseCoord.y * u_vertDeform.noiseFreq.y,\n    time * u_vertDeform.noiseSpeed + u_vertDeform.noiseSeed\n  )) * u_vertDeform.noiseAmp;\n\n  // Fade noise to zero at edges\n  noise *= 1.0 - pow(abs(uvNorm.y), 2.0);\n\n  // Clamp to 0\n  noise = max(0.0, noise);\n\n  vec3 pos = vec3(\n    position.x,\n    position.y + tilt + incline + noise - offset,\n    position.z\n  );\n\n  //\n  // Vertex color, to be passed to fragment shader\n  //\n\n  if (u_active_colors[0] == 1.) {\n    v_color = u_baseColor;\n  }\n\n  for (int i = 0; i < u_waveLayers_length; i++) {\n    if (u_active_colors[i + 1] == 1.) {\n      WaveLayers layer = u_waveLayers[i];\n\n      float noise = smoothstep(\n        layer.noiseFloor,\n        layer.noiseCeil,\n        snoise(vec3(\n          noiseCoord.x * layer.noiseFreq.x + time * layer.noiseFlow,\n          noiseCoord.y * layer.noiseFreq.y,\n          time * layer.noiseSpeed + layer.noiseSeed\n        )) / 2.0 + 0.5\n      );\n\n      v_color = blendNormal(v_color, layer.color, pow(noise, 4.));\n    }\n  }\n\n  //\n  // Finish\n  //\n\n  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);\n}',
      noise:
        'vec3 mod289(vec3 x) {\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec4 mod289(vec4 x) {\n  return x - floor(x * (1.0 / 289.0)) * 289.0;\n}\n\nvec4 permute(vec4 x) {\n    return mod289(((x*34.0)+1.0)*x);\n}\n\nvec4 taylorInvSqrt(vec4 r)\n{\n  return 1.79284291400159 - 0.85373472095314 * r;\n}\n\nfloat snoise(vec3 v)\n{\n  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;\n  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);\n\n// First corner\n  vec3 i  = floor(v + dot(v, C.yyy) );\n  vec3 x0 =    v - i + dot(i, C.xxx) ;\n\n// Other corners\n  vec3 g = step(x0.yzx, x0.xyz);\n  vec3 l = 1.0 - g;\n  vec3 i1 = min( g.xyz, l.zxy );\n  vec3 i2 = max( g.xyz, l.zxy );\n\n  vec3 x1 = x0 - i1 + C.xxx;\n  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y\n  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y\n\n// Permutations\n  i = mod289(i);\n  vec4 p = permute( permute( permute(\n             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))\n           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))\n           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));\n\n// Gradients: 7x7 points over a square, mapped onto an octahedron.\n  float n_ = 0.142857142857; // 1.0/7.0\n  vec3  ns = n_ * D.wyz - D.xzx;\n\n  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)\n\n  vec4 x_ = floor(j * ns.z);\n  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)\n\n  vec4 x = x_ *ns.x + ns.yyyy;\n  vec4 y = y_ *ns.x + ns.yyyy;\n  vec4 h = 1.0 - abs(x) - abs(y);\n\n  vec4 b0 = vec4( x.xy, y.xy );\n  vec4 b1 = vec4( x.zw, y.zw );\n\n  vec4 s0 = floor(b0)*2.0 + 1.0;\n  vec4 s1 = floor(b1)*2.0 + 1.0;\n  vec4 sh = -step(h, vec4(0.0));\n\n  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;\n  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;\n\n  vec3 p0 = vec3(a0.xy,h.x);\n  vec3 p1 = vec3(a0.zw,h.y);\n  vec3 p2 = vec3(a1.xy,h.z);\n  vec3 p3 = vec3(a1.zw,h.w);\n\n//Normalise gradients\n  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));\n  p0 *= norm.x;\n  p1 *= norm.y;\n  p2 *= norm.z;\n  p3 *= norm.w;\n\n// Mix final noise value\n  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);\n  m = m * m;\n  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),\n                                dot(p2,x2), dot(p3,x3) ) );\n}',
      blend:
        'vec3 blendNormal(vec3 base, vec3 blend) {\n\treturn blend;\n}\n\nvec3 blendNormal(vec3 base, vec3 blend, float opacity) {\n\treturn (blendNormal(base, blend) * opacity + base * (1.0 - opacity));\n}\n',
      fragment:
        'varying vec3 v_color;\n\nvoid main() {\n  vec3 color = v_color;\n  if (u_darken_top == 1.0) {\n    vec2 st = gl_FragCoord.xy/resolution.xy;\n    color.g -= pow(st.y + sin(-12.0) * st.x, u_shadow_power) * 0.4;\n  }\n  gl_FragColor = vec4(color, 1.0);\n}',
    };
    this.conf = {
      presetName: '',
      wireframe: false,
      density: [0.06, 0.16],
      zoom: 1,
      rotation: 0,
      playing: true,
    };
    if (this.el) {
      this.minigl = new MiniGl(this.el, null, null, true);
      requestAnimationFrame(() => {
        if (this.el) {
          this.computedCanvasStyle = getComputedStyle(this.el);
          this.waitForCssVars();
        }
      });
      window.addEventListener('scroll', this.handleScroll);
      window.addEventListener('mousedown', this.handleMouseDown);
      window.addEventListener('mouseup', this.handleMouseUp);
      this.addIsLoadedClass();
      this.play();
    } else {
      console.log('DID NOT LOAD HERO STRIPE CANVAS');
    }
  }

  disconnect() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mouseup', this.handleMouseUp);
    window.removeEventListener('resize', this.resize);
    this.pause();
  }

  initMaterial() {
    this.uniforms = {
      u_time: new this.minigl.Uniform({ value: 0 }),
      u_shadow_power: new this.minigl.Uniform({ value: 10 }),
      u_darken_top: new this.minigl.Uniform({
        value: '' === this.el.dataset.jsDarkenTop ? 1 : 0,
      }),
      u_active_colors: new this.minigl.Uniform({
        value: this.activeColors,
        type: 'vec4',
      }),
      u_global: new this.minigl.Uniform({
        value: {
          noiseFreq: new this.minigl.Uniform({
            value: [this.freqX, this.freqY],
            type: 'vec2',
          }),
          noiseSpeed: new this.minigl.Uniform({ value: 5e-6 }),
        },
        type: 'struct',
      }),
      u_vertDeform: new this.minigl.Uniform({
        value: {
          incline: new this.minigl.Uniform({
            value: Math.sin(this.angle) / Math.cos(this.angle),
          }),
          offsetTop: new this.minigl.Uniform({ value: -0.5 }),
          offsetBottom: new this.minigl.Uniform({ value: -0.5 }),
          noiseFreq: new this.minigl.Uniform({ value: [3, 4], type: 'vec2' }),
          noiseAmp: new this.minigl.Uniform({ value: this.amp }),
          noiseSpeed: new this.minigl.Uniform({ value: 10 }),
          noiseFlow: new this.minigl.Uniform({ value: 3 }),
          noiseSeed: new this.minigl.Uniform({ value: this.seed }),
        },
        type: 'struct',
        excludeFrom: 'fragment',
      }),
      u_baseColor: new this.minigl.Uniform({
        value: this.sectionColors[0],
        type: 'vec3',
        excludeFrom: 'fragment',
      }),
      u_waveLayers: new this.minigl.Uniform({
        value: [],
        excludeFrom: 'fragment',
        type: 'array',
      }),
    };
    for (let e = 1; e < this.sectionColors.length; e += 1) {
      this.uniforms.u_waveLayers.value.push(
        new this.minigl.Uniform({
          value: {
            color: new this.minigl.Uniform({
              value: this.sectionColors[e],
              type: 'vec3',
            }),
            noiseFreq: new this.minigl.Uniform({
              value: [
                2 + e / this.sectionColors.length,
                3 + e / this.sectionColors.length,
              ],
              type: 'vec2',
            }),
            noiseSpeed: new this.minigl.Uniform({ value: 11 + 0.3 * e }),
            noiseFlow: new this.minigl.Uniform({ value: 6.5 + 0.3 * e }),
            noiseSeed: new this.minigl.Uniform({ value: this.seed + 10 * e }),
            noiseFloor: new this.minigl.Uniform({ value: 0.1 }),
            noiseCeil: new this.minigl.Uniform({ value: 0.63 + 0.07 * e }),
          },
          type: 'struct',
        })
      );
    }
    return (
      (this.vertexShader = [
        this.shaderFiles.noise,
        this.shaderFiles.blend,
        this.shaderFiles.vertex,
      ].join('\n\n')),
      new this.minigl.Material(
        this.vertexShader,
        this.shaderFiles.fragment,
        this.uniforms
      )
    );
  }

  initMesh() {
    this.material = this.initMaterial();
    this.geometry = new this.minigl.PlaneGeometry();
    this.mesh = new this.minigl.Mesh(this.geometry, this.material);
  }

  shouldSkipFrame(e: number) {
    return (
      !!window.document.hidden ||
      !this.conf.playing ||
      parseInt(e as any, 10) % 2 == 0 ||
      undefined === e
    );
  }

  updateFrequency(e: number) {
    this.freqX += e;
    this.freqY += e;
  }

  toggleColor(index: number) {
    this.activeColors[index] = 0 === this.activeColors[index] ? 1 : 0;
  }

  showGradientLegend() {
    if (this.width > this.minWidth) {
      this.isGradientLegendVisible = true;
      document.body.classList.add('isGradientLegendVisible');
    }
  }

  hideGradientLegend() {
    this.isGradientLegendVisible = false;
    document.body.classList.remove('isGradientLegendVisible');
  }

  init() {
    this.initGradientColors();
    this.initMesh();
    this.resize();
    requestAnimationFrame(this.animate);
    window.addEventListener('resize', this.resize);
  }

  waitForCssVars() {
    if (
      this.computedCanvasStyle &&
      -1 !==
        this.computedCanvasStyle
          .getPropertyValue('--gradient-color-1')
          .indexOf('#')
    ) {
      this.init();
      this.addIsLoadedClass();
    } else {
      if (
        ((this.cssVarRetries += 1), this.cssVarRetries > this.maxCssVarRetries)
      ) {
        this.sectionColors = [16711680, 16711680, 16711935, 65280, 255];
        return void this.init();
      }
      requestAnimationFrame(() => this.waitForCssVars());
    }
  }

  initGradientColors() {
    this.sectionColors = [
      '--gradient-color-1',
      '--gradient-color-2',
      '--gradient-color-3',
      '--gradient-color-4',
    ]
      .map((cssPropertyName) => {
        let hex = this.computedCanvasStyle
          .getPropertyValue(cssPropertyName)
          .trim();
        if (4 === hex.length) {
          const hexTemp = hex
            .substr(1)
            .split('')
            .map((hexTemp) => hexTemp + hexTemp)
            .join('');
          hex = `#${hexTemp}`;
        }
        return hex && `0x${hex.substr(1)}`;
      })
      .filter(Boolean)
      .map((hex) => normalizeColor(Number(hex)));
  }
}
