var UISVG = "<div class=\"gl-box\">\n  <svg viewBox=\"0 0 55 60\">\n    <text x=\"27\" y=\"56\" class=\"gl-fps\">00 FPS</text>\n    <text x=\"28\" y=\"8\" class=\"gl-mem\"></text>\n    <rect x=\"0\" y=\"14\" rx=\"4\" ry=\"4\" width=\"55\" height=\"32\"></rect>\n    <polyline class=\"gl-chart\"></polyline>\n  </svg>\n  <svg viewBox=\"0 0 14 60\" class=\"gl-cpu-svg\">\n    <line x1=\"7\" y1=\"38\" x2=\"7\" y2=\"11\" class=\"opacity\"/>\n    <line x1=\"7\" y1=\"38\" x2=\"7\" y2=\"11\" class=\"gl-cpu\" stroke-dasharray=\"0 27\"/>\n    <path d=\"M5.35 43c-.464 0-.812.377-.812.812v1.16c-.783.1972-1.421.812-1.595 1.624h-1.16c-.435 0-.812.348-.812.812s.348.812.812.812h1.102v1.653H1.812c-.464 0-.812.377-.812.812 0 .464.377.812.812.812h1.131c.1943.783.812 1.392 1.595 1.595v1.131c0 .464.377.812.812.812.464 0 .812-.377.812-.812V53.15h1.653v1.073c0 .464.377.812.812.812.464 0 .812-.377.812-.812v-1.131c.783-.1943 1.392-.812 1.595-1.595h1.131c.464 0 .812-.377.812-.812 0-.464-.377-.812-.812-.812h-1.073V48.22h1.102c.435 0 .812-.348.812-.812s-.348-.812-.812-.812h-1.16c-.1885-.783-.812-1.421-1.595-1.624v-1.131c0-.464-.377-.812-.812-.812-.464 0-.812.377-.812.812v1.073H6.162v-1.073c0-.464-.377-.812-.812-.812zm.58 3.48h2.088c.754 0 1.363.609 1.363 1.363v2.088c0 .754-.609 1.363-1.363 1.363H5.93c-.754 0-1.363-.609-1.363-1.363v-2.088c0-.754.609-1.363 1.363-1.363z\"/>\n  </svg>\n  <svg viewBox=\"0 0 14 60\" class=\"gl-gpu-svg\">\n    <line x1=\"7\" y1=\"38\" x2=\"7\" y2=\"11\" class=\"opacity\"/>\n    <line x1=\"7\" y1=\"38\" x2=\"7\" y2=\"11\" class=\"gl-gpu\" stroke-dasharray=\"0 27\"/>\n    <path d=\"M1.94775 43.3772a.736.736 0 10-.00416 1.472c.58535.00231.56465.1288.6348.3197.07015.18975.04933.43585.04933.43585l-.00653.05405v8.671a.736.736 0 101.472 0v-1.4145c.253.09522.52785.1495.81765.1495h5.267c1.2535 0 2.254-.9752 2.254-2.185v-3.105c0-1.2075-1.00625-2.185-2.254-2.185h-5.267c-.28865 0-.5635.05405-.8165.1495.01806-.16445.04209-.598-.1357-1.0787-.22425-.6072-.9499-1.2765-2.0125-1.2765zm2.9095 3.6455c.42435 0 .7659.36225.7659.8119v2.9785c0 .44965-.34155.8119-.7659.8119s-.7659-.36225-.7659-.8119v-2.9785c0-.44965.34155-.8119.7659-.8119zm4.117 0a2.3 2.3 0 012.3 2.3 2.3 2.3 0 01-2.3 2.3 2.3 2.3 0 01-2.3-2.3 2.3 2.3 0 012.3-2.3z\"/>\n  </svg>\n</div>";

var UICSS = "#gl-bench {\n  position:absolute;\n  left:0;\n  top:0;\n  z-index:1000;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  user-select: none;\n}\n\n#gl-bench div {\n  position: relative;\n  display: block;\n  margin: 4px;\n  padding: 0 7px 0 10px;\n  background: #6c6;\n  border-radius: 15px;\n  cursor: pointer;\n  opacity: 0.9;\n}\n\n#gl-bench svg {\n  height: 60px;\n  margin: 0 -1px;\n}\n\n#gl-bench text {\n  font-size: 12px;\n  font-family: Helvetica,Arial,sans-serif;\n  font-weight: 700;\n  dominant-baseline: middle;\n  text-anchor: middle;\n}\n\n#gl-bench .gl-mem {\n  font-size: 9px;\n}\n\n#gl-bench line {\n  stroke-width: 5;\n  stroke: #112211;\n  stroke-linecap: round;\n}\n\n#gl-bench polyline {\n  fill: none;\n  stroke: #112211;\n  stroke-linecap: round;\n  stroke-linejoin: round;\n  stroke-width: 3.5;\n}\n\n#gl-bench rect {\n  fill: #448844;\n}\n\n#gl-bench .opacity {\n  stroke: #448844;\n}\n";

class GLBench {

  /** GLBench constructor
   * @param { WebGLRenderingContext | WebGL2RenderingContext } gl context
   * @param { Object | undefined } settings additional settings
   */
  constructor(gl, settings = {}) {
    this.css = UICSS;
    this.svg = UISVG;
    this.paramLogger = () => {};
    this.chartLogger = () => {};
    this.chartLen = 20;
    this.chartHz = 20;

    this.names = [];
    this.cpuAccums = [];
    this.gpuAccums = [];  
    this.activeAccums = [];
    this.chart = new Array(this.chartLen);
    this.now = () => (performance && performance.now) ? performance.now() : Date.now();
    this.updateUI = () => {
      [].forEach.call(this.nodes['gl-gpu-svg'], node => {
        node.style.display = this.trackGPU ? 'inline' : 'none';
      });
    };

    Object.assign(this, settings);
    this.detected = 0;
    this.frameId = 0;

    // 120hz device detection
    let rafId, n = 0, t0;
    let loop = (t) => {
      if (++n < 10) {
        rafId = requestAnimationFrame(loop);
      } else {
        this.detected = Math.ceil(1e3 * n / (t - t0) / 70);
        cancelAnimationFrame(rafId);
      }
      if (!t0) t0 = t;
    };
    requestAnimationFrame(loop);

    // attach gpu profilers
    if (gl) {
      const addProfiler = (fn, self, target) => function() {
        const t = self.now();
        fn.apply(target, arguments);
        if (self.trackGPU) {
          gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4));
          const dt = self.now() - t;
          self.activeAccums.forEach((active, i) => {
            if (active) {
              self.gpuAccums[i] += dt;
              self.cpuAccums[i] -= dt;
            }
          });
        }
      };
      ['drawArrays', 'drawElements', 'drawArraysInstanced',
        'drawBuffers', 'drawElementsInstanced', 'drawRangeElements']
        .forEach(fn => { if (gl[fn]) gl[fn] = addProfiler(gl[fn], this, gl); });

      const extProfiler = (fn, self) => function() {
        let ext = fn.apply(gl, arguments);
        ['drawElementsInstancedANGLE', 'drawBuffersWEBGL']
          .forEach(fn => { if (ext[fn]) ext[fn] = addProfiler(ext[fn], self, ext); });
        return ext;
      };
      gl.getExtension = extProfiler(gl.getExtension, this);
    }

    // init ui and ui loggers
    if (!this.withoutUI) {
      if (!this.dom) this.dom = document.body;
      let elm = document.createElement('div');
      elm.id = 'gl-bench';
      this.dom.appendChild(elm);
      this.dom.insertAdjacentHTML('afterbegin', '<style id="gl-bench-style">' + this.css + '</style>');
      this.dom = elm;
      this.dom.addEventListener('click', () => {
        this.trackGPU = !this.trackGPU;
        setTimeout(() => { this.updateUI();}, 500);
      });

      this.paramLogger = ((logger, dom, names) => {
        const classes = ['gl-cpu', 'gl-gpu', 'gl-mem', 'gl-fps', 'gl-gpu-svg', 'gl-chart'];
        const nodes = Object.assign({}, classes);
        classes.forEach(c => nodes[c] = dom.getElementsByClassName(c));
        this.nodes = nodes;
        return (i, cpu, gpu, mem, fps, totalTime, frameId) => {
          nodes['gl-cpu'][i].style.strokeDasharray = (cpu * 0.27).toFixed(0) + ' 100';
          nodes['gl-gpu'][i].style.strokeDasharray = (gpu * 0.27).toFixed(0) + ' 100';
          nodes['gl-mem'][i].innerHTML = names[i] ? names[i] : (mem ? 'mem: ' + mem.toFixed(0) + 'mb' : '');
          nodes['gl-fps'][i].innerHTML = fps.toFixed(0) + ' FPS';
          logger(names[i], cpu, gpu, mem, fps, totalTime, frameId);
        }
      })(this.paramLogger, this.dom, this.names);

      this.chartLogger = ((logger, dom) => {
        let nodes = { 'gl-chart': dom.getElementsByClassName('gl-chart') };
        return (i, chart, circularId) => {
          let points = '';
          let len = chart.length;
          for (let i = 0; i < len; i++) {
            let id = (circularId + i + 1) % len;
            if (chart[id] != undefined) {
              points = points + ' ' + (55 * i / (len - 1)).toFixed(1) + ','
                + (45 - chart[id] * 22 / 60 / this.detected).toFixed(1);
            }
          }
          nodes['gl-chart'][i].setAttribute('points', points);
          logger(this.names[i], chart, circularId);
        }
      })(this.chartLogger, this.dom);
    }
  }

  /**
   * Explicit UI add
   * @param { string | undefined } name 
   */
  addUI(name) {
    if (this.names.indexOf(name) == -1) {
      this.names.push(name);
      if (this.dom) {
        this.dom.insertAdjacentHTML('beforeend', this.svg);
        this.updateUI();
      }
      this.cpuAccums.push(0);
      this.gpuAccums.push(0);
      this.activeAccums.push(false);
    }
  }

  /**
   * Increase frameID
   * @param { number | undefined } now
   */
  nextFrame(now) {
    this.frameId++;
    const t = now ? now : this.now();

    // params
    if (this.frameId <= 1) {
      this.paramFrame = this.frameId;
      this.paramTime = t;
    } else {
      let duration = t - this.paramTime;
      if (duration >= 1e3) {
        const frameCount = this.frameId - this.paramFrame;
        const fps = frameCount / duration * 1e3;
        for (let i = 0; i < this.names.length; i++) {
          const cpu = this.cpuAccums[i] / duration * 100,
            gpu = this.gpuAccums[i] / duration * 100,
            mem = (performance && performance.memory) ? performance.memory.usedJSHeapSize / (1 << 20) : 0;
          this.paramLogger(i, cpu, gpu, mem, fps, duration, frameCount);
          this.cpuAccums[i] = 0;
          this.gpuAccums[i] = 0;
        }
        this.paramFrame = this.frameId;
        this.paramTime = t;
      }
    }

    // chart
    if (!this.detected) {
      this.chartFrame = this.frameId;
      this.chartTime = t;
      this.circularId = 0;
    } else {
      let timespan = t - this.chartTime;
      let hz = this.chartHz * timespan / 1e3;
      while (--hz > 0 && this.detected) {
        const frameCount = this.frameId - this.chartFrame;
        const fps = frameCount / timespan * 1e3;
        this.chart[this.circularId % this.chartLen] = fps;
        for (let i = 0; i < this.names.length; i++) {
          this.chartLogger(i, this.chart, this.circularId);
        }
        this.circularId++;
        this.chartFrame = this.frameId;
        this.chartTime = t;
      }
    }
  }

  /**
   * Begin named measurement
   * @param { string | undefined } name
   */
  begin(name) {
    this.updateAccums(name);
  }

  /**
   * End named measure
   * @param { string | undefined } name
   */
  end(name) {
    this.updateAccums(name);
  }

  updateAccums(name) {
    let nameId = this.names.indexOf(name);
    if (nameId == -1) {
      nameId = this.names.length;
      this.addUI(name);
    }

    const t = this.now();
    const dt = t - this.t0;
    for (let i = 0; i < nameId + 1; i++) {
      if (this.activeAccums[i]) {
        this.cpuAccums[i] += dt;
      }
    }    this.activeAccums[nameId] = !this.activeAccums[nameId];
    this.t0 = t;
  }

}

export default GLBench;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2wtYmVuY2gubW9kdWxlLmpzIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXguanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFVJU1ZHIGZyb20gJy4vdWkuc3ZnJztcbmltcG9ydCBVSUNTUyBmcm9tICcuL3VpLmNzcyc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEdMQmVuY2gge1xuXG4gIC8qKiBHTEJlbmNoIGNvbnN0cnVjdG9yXG4gICAqIEBwYXJhbSB7IFdlYkdMUmVuZGVyaW5nQ29udGV4dCB8IFdlYkdMMlJlbmRlcmluZ0NvbnRleHQgfSBnbCBjb250ZXh0XG4gICAqIEBwYXJhbSB7IE9iamVjdCB8IHVuZGVmaW5lZCB9IHNldHRpbmdzIGFkZGl0aW9uYWwgc2V0dGluZ3NcbiAgICovXG4gIGNvbnN0cnVjdG9yKGdsLCBzZXR0aW5ncyA9IHt9KSB7XG4gICAgdGhpcy5jc3MgPSBVSUNTUztcbiAgICB0aGlzLnN2ZyA9IFVJU1ZHO1xuICAgIHRoaXMucGFyYW1Mb2dnZXIgPSAoKSA9PiB7fTtcbiAgICB0aGlzLmNoYXJ0TG9nZ2VyID0gKCkgPT4ge307XG4gICAgdGhpcy5jaGFydExlbiA9IDIwO1xuICAgIHRoaXMuY2hhcnRIeiA9IDIwO1xuXG4gICAgdGhpcy5uYW1lcyA9IFtdO1xuICAgIHRoaXMuY3B1QWNjdW1zID0gW107XG4gICAgdGhpcy5ncHVBY2N1bXMgPSBbXTsgIFxuICAgIHRoaXMuYWN0aXZlQWNjdW1zID0gW107XG4gICAgdGhpcy5jaGFydCA9IG5ldyBBcnJheSh0aGlzLmNoYXJ0TGVuKTtcbiAgICB0aGlzLm5vdyA9ICgpID0+IChwZXJmb3JtYW5jZSAmJiBwZXJmb3JtYW5jZS5ub3cpID8gcGVyZm9ybWFuY2Uubm93KCkgOiBEYXRlLm5vdygpO1xuICAgIHRoaXMudXBkYXRlVUkgPSAoKSA9PiB7XG4gICAgICBbXS5mb3JFYWNoLmNhbGwodGhpcy5ub2Rlc1snZ2wtZ3B1LXN2ZyddLCBub2RlID0+IHtcbiAgICAgICAgbm9kZS5zdHlsZS5kaXNwbGF5ID0gdGhpcy50cmFja0dQVSA/ICdpbmxpbmUnIDogJ25vbmUnO1xuICAgICAgfSlcbiAgICB9XG5cbiAgICBPYmplY3QuYXNzaWduKHRoaXMsIHNldHRpbmdzKTtcbiAgICB0aGlzLmRldGVjdGVkID0gMDtcbiAgICB0aGlzLmZyYW1lSWQgPSAwO1xuXG4gICAgLy8gMTIwaHogZGV2aWNlIGRldGVjdGlvblxuICAgIGxldCByYWZJZCwgbiA9IDAsIHQwO1xuICAgIGxldCBsb29wID0gKHQpID0+IHtcbiAgICAgIGlmICgrK24gPCAxMCkge1xuICAgICAgICByYWZJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuZGV0ZWN0ZWQgPSBNYXRoLmNlaWwoMWUzICogbiAvICh0IC0gdDApIC8gNzApO1xuICAgICAgICBjYW5jZWxBbmltYXRpb25GcmFtZShyYWZJZCk7XG4gICAgICB9XG4gICAgICBpZiAoIXQwKSB0MCA9IHQ7XG4gICAgfVxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShsb29wKTtcblxuICAgIC8vIGF0dGFjaCBncHUgcHJvZmlsZXJzXG4gICAgaWYgKGdsKSB7XG4gICAgICBjb25zdCBhZGRQcm9maWxlciA9IChmbiwgc2VsZiwgdGFyZ2V0KSA9PiBmdW5jdGlvbigpIHtcbiAgICAgICAgY29uc3QgdCA9IHNlbGYubm93KCk7XG4gICAgICAgIGZuLmFwcGx5KHRhcmdldCwgYXJndW1lbnRzKTtcbiAgICAgICAgaWYgKHNlbGYudHJhY2tHUFUpIHtcbiAgICAgICAgICBnbC5yZWFkUGl4ZWxzKDAsIDAsIDEsIDEsIGdsLlJHQkEsIGdsLlVOU0lHTkVEX0JZVEUsIG5ldyBVaW50OEFycmF5KDQpKTtcbiAgICAgICAgICBjb25zdCBkdCA9IHNlbGYubm93KCkgLSB0O1xuICAgICAgICAgIHNlbGYuYWN0aXZlQWNjdW1zLmZvckVhY2goKGFjdGl2ZSwgaSkgPT4ge1xuICAgICAgICAgICAgaWYgKGFjdGl2ZSkge1xuICAgICAgICAgICAgICBzZWxmLmdwdUFjY3Vtc1tpXSArPSBkdDtcbiAgICAgICAgICAgICAgc2VsZi5jcHVBY2N1bXNbaV0gLT0gZHQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBbJ2RyYXdBcnJheXMnLCAnZHJhd0VsZW1lbnRzJywgJ2RyYXdBcnJheXNJbnN0YW5jZWQnLFxuICAgICAgICAnZHJhd0J1ZmZlcnMnLCAnZHJhd0VsZW1lbnRzSW5zdGFuY2VkJywgJ2RyYXdSYW5nZUVsZW1lbnRzJ11cbiAgICAgICAgLmZvckVhY2goZm4gPT4geyBpZiAoZ2xbZm5dKSBnbFtmbl0gPSBhZGRQcm9maWxlcihnbFtmbl0sIHRoaXMsIGdsKSB9KTtcblxuICAgICAgY29uc3QgZXh0UHJvZmlsZXIgPSAoZm4sIHNlbGYpID0+IGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgZXh0ID0gZm4uYXBwbHkoZ2wsIGFyZ3VtZW50cyk7XG4gICAgICAgIFsnZHJhd0VsZW1lbnRzSW5zdGFuY2VkQU5HTEUnLCAnZHJhd0J1ZmZlcnNXRUJHTCddXG4gICAgICAgICAgLmZvckVhY2goZm4gPT4geyBpZiAoZXh0W2ZuXSkgZXh0W2ZuXSA9IGFkZFByb2ZpbGVyKGV4dFtmbl0sIHNlbGYsIGV4dCkgfSk7XG4gICAgICAgIHJldHVybiBleHQ7XG4gICAgICB9O1xuICAgICAgZ2wuZ2V0RXh0ZW5zaW9uID0gZXh0UHJvZmlsZXIoZ2wuZ2V0RXh0ZW5zaW9uLCB0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBpbml0IHVpIGFuZCB1aSBsb2dnZXJzXG4gICAgaWYgKCF0aGlzLndpdGhvdXRVSSkge1xuICAgICAgaWYgKCF0aGlzLmRvbSkgdGhpcy5kb20gPSBkb2N1bWVudC5ib2R5O1xuICAgICAgbGV0IGVsbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgICAgZWxtLmlkID0gJ2dsLWJlbmNoJztcbiAgICAgIHRoaXMuZG9tLmFwcGVuZENoaWxkKGVsbSk7XG4gICAgICB0aGlzLmRvbS5pbnNlcnRBZGphY2VudEhUTUwoJ2FmdGVyYmVnaW4nLCAnPHN0eWxlIGlkPVwiZ2wtYmVuY2gtc3R5bGVcIj4nICsgdGhpcy5jc3MgKyAnPC9zdHlsZT4nKTtcbiAgICAgIHRoaXMuZG9tID0gZWxtO1xuICAgICAgdGhpcy5kb20uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIHRoaXMudHJhY2tHUFUgPSAhdGhpcy50cmFja0dQVTtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7IHRoaXMudXBkYXRlVUkoKX0sIDUwMCk7XG4gICAgICB9KTtcblxuICAgICAgdGhpcy5wYXJhbUxvZ2dlciA9ICgobG9nZ2VyLCBkb20sIG5hbWVzKSA9PiB7XG4gICAgICAgIGNvbnN0IGNsYXNzZXMgPSBbJ2dsLWNwdScsICdnbC1ncHUnLCAnZ2wtbWVtJywgJ2dsLWZwcycsICdnbC1ncHUtc3ZnJywgJ2dsLWNoYXJ0J107XG4gICAgICAgIGNvbnN0IG5vZGVzID0gT2JqZWN0LmFzc2lnbih7fSwgY2xhc3Nlcyk7XG4gICAgICAgIGNsYXNzZXMuZm9yRWFjaChjID0+IG5vZGVzW2NdID0gZG9tLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoYykpO1xuICAgICAgICB0aGlzLm5vZGVzID0gbm9kZXM7XG4gICAgICAgIHJldHVybiAoaSwgY3B1LCBncHUsIG1lbSwgZnBzLCB0b3RhbFRpbWUsIGZyYW1lSWQpID0+IHtcbiAgICAgICAgICBub2Rlc1snZ2wtY3B1J11baV0uc3R5bGUuc3Ryb2tlRGFzaGFycmF5ID0gKGNwdSAqIDAuMjcpLnRvRml4ZWQoMCkgKyAnIDEwMCc7XG4gICAgICAgICAgbm9kZXNbJ2dsLWdwdSddW2ldLnN0eWxlLnN0cm9rZURhc2hhcnJheSA9IChncHUgKiAwLjI3KS50b0ZpeGVkKDApICsgJyAxMDAnO1xuICAgICAgICAgIG5vZGVzWydnbC1tZW0nXVtpXS5pbm5lckhUTUwgPSBuYW1lc1tpXSA/IG5hbWVzW2ldIDogKG1lbSA/ICdtZW06ICcgKyBtZW0udG9GaXhlZCgwKSArICdtYicgOiAnJyk7XG4gICAgICAgICAgbm9kZXNbJ2dsLWZwcyddW2ldLmlubmVySFRNTCA9IGZwcy50b0ZpeGVkKDApICsgJyBGUFMnO1xuICAgICAgICAgIGxvZ2dlcihuYW1lc1tpXSwgY3B1LCBncHUsIG1lbSwgZnBzLCB0b3RhbFRpbWUsIGZyYW1lSWQpO1xuICAgICAgICB9XG4gICAgICB9KSh0aGlzLnBhcmFtTG9nZ2VyLCB0aGlzLmRvbSwgdGhpcy5uYW1lcyk7XG5cbiAgICAgIHRoaXMuY2hhcnRMb2dnZXIgPSAoKGxvZ2dlciwgZG9tKSA9PiB7XG4gICAgICAgIGxldCBub2RlcyA9IHsgJ2dsLWNoYXJ0JzogZG9tLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2dsLWNoYXJ0JykgfTtcbiAgICAgICAgcmV0dXJuIChpLCBjaGFydCwgY2lyY3VsYXJJZCkgPT4ge1xuICAgICAgICAgIGxldCBwb2ludHMgPSAnJztcbiAgICAgICAgICBsZXQgbGVuID0gY2hhcnQubGVuZ3RoO1xuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGxldCBpZCA9IChjaXJjdWxhcklkICsgaSArIDEpICUgbGVuO1xuICAgICAgICAgICAgaWYgKGNoYXJ0W2lkXSAhPSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgcG9pbnRzID0gcG9pbnRzICsgJyAnICsgKDU1ICogaSAvIChsZW4gLSAxKSkudG9GaXhlZCgxKSArICcsJ1xuICAgICAgICAgICAgICAgICsgKDQ1IC0gY2hhcnRbaWRdICogMjIgLyA2MCAvIHRoaXMuZGV0ZWN0ZWQpLnRvRml4ZWQoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIG5vZGVzWydnbC1jaGFydCddW2ldLnNldEF0dHJpYnV0ZSgncG9pbnRzJywgcG9pbnRzKTtcbiAgICAgICAgICBsb2dnZXIodGhpcy5uYW1lc1tpXSwgY2hhcnQsIGNpcmN1bGFySWQpO1xuICAgICAgICB9XG4gICAgICB9KSh0aGlzLmNoYXJ0TG9nZ2VyLCB0aGlzLmRvbSk7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEV4cGxpY2l0IFVJIGFkZFxuICAgKiBAcGFyYW0geyBzdHJpbmcgfCB1bmRlZmluZWQgfSBuYW1lIFxuICAgKi9cbiAgYWRkVUkobmFtZSkge1xuICAgIGlmICh0aGlzLm5hbWVzLmluZGV4T2YobmFtZSkgPT0gLTEpIHtcbiAgICAgIHRoaXMubmFtZXMucHVzaChuYW1lKTtcbiAgICAgIGlmICh0aGlzLmRvbSkge1xuICAgICAgICB0aGlzLmRvbS5pbnNlcnRBZGphY2VudEhUTUwoJ2JlZm9yZWVuZCcsIHRoaXMuc3ZnKTtcbiAgICAgICAgdGhpcy51cGRhdGVVSSgpO1xuICAgICAgfVxuICAgICAgdGhpcy5jcHVBY2N1bXMucHVzaCgwKTtcbiAgICAgIHRoaXMuZ3B1QWNjdW1zLnB1c2goMCk7XG4gICAgICB0aGlzLmFjdGl2ZUFjY3Vtcy5wdXNoKGZhbHNlKTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogSW5jcmVhc2UgZnJhbWVJRFxuICAgKiBAcGFyYW0geyBudW1iZXIgfCB1bmRlZmluZWQgfSBub3dcbiAgICovXG4gIG5leHRGcmFtZShub3cpIHtcbiAgICB0aGlzLmZyYW1lSWQrKztcbiAgICBjb25zdCB0ID0gbm93ID8gbm93IDogdGhpcy5ub3coKTtcblxuICAgIC8vIHBhcmFtc1xuICAgIGlmICh0aGlzLmZyYW1lSWQgPD0gMSkge1xuICAgICAgdGhpcy5wYXJhbUZyYW1lID0gdGhpcy5mcmFtZUlkO1xuICAgICAgdGhpcy5wYXJhbVRpbWUgPSB0O1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgZHVyYXRpb24gPSB0IC0gdGhpcy5wYXJhbVRpbWU7XG4gICAgICBpZiAoZHVyYXRpb24gPj0gMWUzKSB7XG4gICAgICAgIGNvbnN0IGZyYW1lQ291bnQgPSB0aGlzLmZyYW1lSWQgLSB0aGlzLnBhcmFtRnJhbWU7XG4gICAgICAgIGNvbnN0IGZwcyA9IGZyYW1lQ291bnQgLyBkdXJhdGlvbiAqIDFlMztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgY3B1ID0gdGhpcy5jcHVBY2N1bXNbaV0gLyBkdXJhdGlvbiAqIDEwMCxcbiAgICAgICAgICAgIGdwdSA9IHRoaXMuZ3B1QWNjdW1zW2ldIC8gZHVyYXRpb24gKiAxMDAsXG4gICAgICAgICAgICBtZW0gPSAocGVyZm9ybWFuY2UgJiYgcGVyZm9ybWFuY2UubWVtb3J5KSA/IHBlcmZvcm1hbmNlLm1lbW9yeS51c2VkSlNIZWFwU2l6ZSAvICgxIDw8IDIwKSA6IDA7XG4gICAgICAgICAgdGhpcy5wYXJhbUxvZ2dlcihpLCBjcHUsIGdwdSwgbWVtLCBmcHMsIGR1cmF0aW9uLCBmcmFtZUNvdW50KTtcbiAgICAgICAgICB0aGlzLmNwdUFjY3Vtc1tpXSA9IDA7XG4gICAgICAgICAgdGhpcy5ncHVBY2N1bXNbaV0gPSAwO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucGFyYW1GcmFtZSA9IHRoaXMuZnJhbWVJZDtcbiAgICAgICAgdGhpcy5wYXJhbVRpbWUgPSB0O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGNoYXJ0XG4gICAgaWYgKCF0aGlzLmRldGVjdGVkKSB7XG4gICAgICB0aGlzLmNoYXJ0RnJhbWUgPSB0aGlzLmZyYW1lSWQ7XG4gICAgICB0aGlzLmNoYXJ0VGltZSA9IHQ7XG4gICAgICB0aGlzLmNpcmN1bGFySWQgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgdGltZXNwYW4gPSB0IC0gdGhpcy5jaGFydFRpbWU7XG4gICAgICBsZXQgaHogPSB0aGlzLmNoYXJ0SHogKiB0aW1lc3BhbiAvIDFlMztcbiAgICAgIHdoaWxlICgtLWh6ID4gMCAmJiB0aGlzLmRldGVjdGVkKSB7XG4gICAgICAgIGNvbnN0IGZyYW1lQ291bnQgPSB0aGlzLmZyYW1lSWQgLSB0aGlzLmNoYXJ0RnJhbWU7XG4gICAgICAgIGNvbnN0IGZwcyA9IGZyYW1lQ291bnQgLyB0aW1lc3BhbiAqIDFlMztcbiAgICAgICAgdGhpcy5jaGFydFt0aGlzLmNpcmN1bGFySWQgJSB0aGlzLmNoYXJ0TGVuXSA9IGZwcztcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLm5hbWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdGhpcy5jaGFydExvZ2dlcihpLCB0aGlzLmNoYXJ0LCB0aGlzLmNpcmN1bGFySWQpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuY2lyY3VsYXJJZCsrO1xuICAgICAgICB0aGlzLmNoYXJ0RnJhbWUgPSB0aGlzLmZyYW1lSWQ7XG4gICAgICAgIHRoaXMuY2hhcnRUaW1lID0gdDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQmVnaW4gbmFtZWQgbWVhc3VyZW1lbnRcbiAgICogQHBhcmFtIHsgc3RyaW5nIHwgdW5kZWZpbmVkIH0gbmFtZVxuICAgKi9cbiAgYmVnaW4obmFtZSkge1xuICAgIHRoaXMudXBkYXRlQWNjdW1zKG5hbWUpO1xuICB9XG5cbiAgLyoqXG4gICAqIEVuZCBuYW1lZCBtZWFzdXJlXG4gICAqIEBwYXJhbSB7IHN0cmluZyB8IHVuZGVmaW5lZCB9IG5hbWVcbiAgICovXG4gIGVuZChuYW1lKSB7XG4gICAgdGhpcy51cGRhdGVBY2N1bXMobmFtZSk7XG4gIH1cblxuICB1cGRhdGVBY2N1bXMobmFtZSkge1xuICAgIGxldCBuYW1lSWQgPSB0aGlzLm5hbWVzLmluZGV4T2YobmFtZSk7XG4gICAgaWYgKG5hbWVJZCA9PSAtMSkge1xuICAgICAgbmFtZUlkID0gdGhpcy5uYW1lcy5sZW5ndGg7XG4gICAgICB0aGlzLmFkZFVJKG5hbWUpO1xuICAgIH1cblxuICAgIGNvbnN0IHQgPSB0aGlzLm5vdygpO1xuICAgIGNvbnN0IGR0ID0gdCAtIHRoaXMudDA7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBuYW1lSWQgKyAxOyBpKyspIHtcbiAgICAgIGlmICh0aGlzLmFjdGl2ZUFjY3Vtc1tpXSkge1xuICAgICAgICB0aGlzLmNwdUFjY3Vtc1tpXSArPSBkdDtcbiAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuYWN0aXZlQWNjdW1zW25hbWVJZF0gPSAhdGhpcy5hY3RpdmVBY2N1bXNbbmFtZUlkXTtcbiAgICB0aGlzLnQwID0gdDtcbiAgfVxuXG59Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFHZSxNQUFNLE9BQU8sQ0FBQzs7Ozs7O0VBTTNCLFdBQVcsQ0FBQyxFQUFFLEVBQUUsUUFBUSxHQUFHLEVBQUUsRUFBRTtJQUM3QixJQUFJLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQztJQUNqQixJQUFJLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQztJQUNqQixJQUFJLENBQUMsV0FBVyxHQUFHLE1BQU0sRUFBRSxDQUFDO0lBQzVCLElBQUksQ0FBQyxXQUFXLEdBQUcsTUFBTSxFQUFFLENBQUM7SUFDNUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7SUFDbkIsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7O0lBRWxCLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ2hCLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO0lBQ3BCLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFDO0lBQ3BCLElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDO0lBQ3ZCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3RDLElBQUksQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLFdBQVcsSUFBSSxXQUFXLENBQUMsR0FBRyxJQUFJLFdBQVcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDbkYsSUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNO01BQ3BCLEVBQUUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsWUFBWSxDQUFDLEVBQUUsSUFBSSxJQUFJO1FBQ2hELElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxHQUFHLE1BQU0sQ0FBQztPQUN4RCxFQUFDO01BQ0g7O0lBRUQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDOUIsSUFBSSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUM7SUFDbEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUM7OztJQUdqQixJQUFJLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQztJQUNyQixJQUFJLElBQUksR0FBRyxDQUFDLENBQUMsS0FBSztNQUNoQixJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRTtRQUNaLEtBQUssR0FBRyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztPQUNyQyxNQUFNO1FBQ0wsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1FBQ25ELG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDO09BQzdCO01BQ0QsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO01BQ2pCO0lBQ0QscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7OztJQUc1QixJQUFJLEVBQUUsRUFBRTtNQUNOLE1BQU0sV0FBVyxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRSxNQUFNLEtBQUssV0FBVztRQUNuRCxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFDckIsRUFBRSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDNUIsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1VBQ2pCLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLGFBQWEsRUFBRSxJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1VBQ3hFLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUM7VUFDMUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxLQUFLO1lBQ3ZDLElBQUksTUFBTSxFQUFFO2NBQ1YsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7Y0FDeEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7YUFDekI7V0FDRixDQUFDLENBQUM7U0FDSjtPQUNGLENBQUM7TUFDRixDQUFDLFlBQVksRUFBRSxjQUFjLEVBQUUscUJBQXFCO1FBQ2xELGFBQWEsRUFBRSx1QkFBdUIsRUFBRSxtQkFBbUIsQ0FBQztTQUMzRCxPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBQyxFQUFFLENBQUMsQ0FBQzs7TUFFekUsTUFBTSxXQUFXLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxLQUFLLFdBQVc7UUFDM0MsSUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDbEMsQ0FBQyw0QkFBNEIsRUFBRSxrQkFBa0IsQ0FBQztXQUMvQyxPQUFPLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBQyxFQUFFLENBQUMsQ0FBQztRQUM3RSxPQUFPLEdBQUcsQ0FBQztPQUNaLENBQUM7TUFDRixFQUFFLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQyxFQUFFLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ3REOzs7SUFHRCxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRTtNQUNuQixJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUM7TUFDeEMsSUFBSSxHQUFHLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztNQUN4QyxHQUFHLENBQUMsRUFBRSxHQUFHLFVBQVUsQ0FBQztNQUNwQixJQUFJLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQztNQUMxQixJQUFJLENBQUMsR0FBRyxDQUFDLGtCQUFrQixDQUFDLFlBQVksRUFBRSw2QkFBNkIsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLFVBQVUsQ0FBQyxDQUFDO01BQ2pHLElBQUksQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDO01BQ2YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsTUFBTTtRQUN2QyxJQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQztRQUMvQixVQUFVLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxRQUFRLEdBQUUsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO09BQzNDLENBQUMsQ0FBQzs7TUFFSCxJQUFJLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLEtBQUssS0FBSztRQUMxQyxNQUFNLE9BQU8sR0FBRyxDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDbkYsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDekMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9ELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ25CLE9BQU8sQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxPQUFPLEtBQUs7VUFDcEQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsQ0FBQyxHQUFHLEdBQUcsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUM7VUFDNUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxlQUFlLEdBQUcsQ0FBQyxHQUFHLEdBQUcsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUM7VUFDNUUsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsR0FBRyxPQUFPLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDLENBQUM7VUFDbEcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQztVQUN2RCxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7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
