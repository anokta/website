import {EngineControlType} from '../external/barelymusician/src/control.js';
import {Engine} from '../external/barelymusician/src/engine.js';

import {Beacon} from './beacon.js';
import {lerp} from './math.js';

const BEACON_COUNT = 16;
const DELAY_TIME_SPEED = 0.06

export class Habutat {
  /**
   * @param {AudioContext} audioContext
   * @param {HTMLCanvasElement} canvas
   * @param {Window} window
   */
  constructor(audioContext, canvas, window) {
    this._audioContext = audioContext;
    this._canvas = canvas;
    this._window = window;

    /** @type {Array<Beacon>} */
    this._beacons = [];
    this._beaconIndex = 0;

    this._delayTime = 0.55;

    const initLoop = () => {
      this._canvas.addEventListener('contextmenu', function(e) {
        e.preventDefault();  // disable right-click menu
      }, {passive: false});
      this._canvas.style.touchAction = 'none';
      this._canvas.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        const rect = this._canvas.getBoundingClientRect();
        this._onPointerDown(event, event.clientX - rect.left, event.clientY - rect.top);
      }, {passive: false});
      this._canvas.addEventListener('pointerup', (event) => {
        const rect = this._canvas.getBoundingClientRect();
        this._onPointerUp(event, event.clientX - rect.left, event.clientY - rect.top);
      });
      this._canvas.addEventListener('pointermove', (event) => {
        event.preventDefault();
        const rect = this._canvas.getBoundingClientRect();
        this._onPointerMove(event, event.clientX - rect.left, event.clientY - rect.top);
      });
      this._canvas.addEventListener('pointerleave', (event) => {
        const rect = this._canvas.getBoundingClientRect();
        this._onPointerUp(event, event.clientX - rect.left, event.clientY - rect.top);
      });
      this._canvas.addEventListener('pointercancel', (event) => {
        const rect = this._canvas.getBoundingClientRect();
        this._onPointerUp(event, event.clientX - rect.left, event.clientY - rect.top);
      });

      const ctx = this._canvas.getContext('2d', {alpha: false});
      ctx.filter = 'blur(1px)';

      this._init();
      let lastTime = performance.now();
      const updateAndRenderLoop = (now) => {
        const dt = Math.min((now - lastTime) / 1000.0, 0.1);
        lastTime = now;
        this._update(dt);
        this._render(ctx, this._canvas.width, this._canvas.height);
        requestAnimationFrame(updateAndRenderLoop);
      };
      requestAnimationFrame(updateAndRenderLoop);
    };
    this._engine = new Engine(audioContext, initLoop);

    this._audioViz = this._audioContext.createAnalyser();
    this._engine.audioNode.connect(this._audioViz);
    this._audioViz.fftSize = 2048;
    this._audioVizBuffer = new Uint8Array(this._audioViz.frequencyBinCount);

    const resize = () => {
      this._canvas.width = this._window.innerWidth;
      this._canvas.height = this._window.innerHeight;
    };
    this._window.addEventListener('resize', resize);
    resize();
  }

  /**
   * @private
   */
  _init() {
    this._engine.setControl(EngineControlType.DELAY_LPF_CUTOFF, 0.25);
    this._engine.setControl(EngineControlType.DELAY_TIME, this._delayTime);
    this._engine.setControl(EngineControlType.DELAY_FEEDBACK, 0.5);
    this._engine.setControl(EngineControlType.DELAY_PING_PONG, 0.75);
    this._engine.setControl(EngineControlType.DELAY_REVERB_SEND, 0.25);
    this._engine.setControl(EngineControlType.REVERB_DAMPING, 0.2);
    this._engine.setControl(EngineControlType.REVERB_ROOM_SIZE, 0.65);
    for (let i = 0; i < BEACON_COUNT; ++i) {
      this._beacons.push(new Beacon(this._engine));
    }
  }

  /**
   * @param {PointerEvent} event
   * @param {number} x
   * @param {number} y
   * @private
   */
  _onPointerMove(event, x, y) {
    for (const beacon of this._beacons) {
      if (beacon.pointerId === event.pointerId) {
        beacon.pointerMove(x, y);
      }
    }
  }

  /**
   * @param {PointerEvent} event
   * @param {number} x
   * @param {number} y
   * @private
   */
  _onPointerDown(event, x, y) {
    this._beacons[this._beaconIndex].pointerDown(event.pointerId, x, y);
    this._beaconIndex = (this._beaconIndex + 1) % BEACON_COUNT;
  }

  /**
   * @param {PointerEvent} event
   * @param {number} x
   * @param {number} y
   * @private
   */
  _onPointerUp(event, x, y) {
    for (const beacon of this._beacons) {
      if (beacon.pointerId === event.pointerId) {
        beacon.pointerUp(x, y);
      }
    }
  }

  /**
   * @param {number} dt
   * @private
   */
  _update(dt) {
    this._audioViz.getByteTimeDomainData(this._audioVizBuffer);

    const targetDelayTime = 0.5 + Math.random();
    this._delayTime = lerp(this._delayTime, targetDelayTime, DELAY_TIME_SPEED * dt);
    this._engine.setControl(EngineControlType.DELAY_TIME, this._delayTime);
    this._engine.update();

    for (const beacon of this._beacons) {
      beacon.update(dt);
    }
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} width
   * @param {number} height
   * @private
   */
  _render(ctx, width, height) {
    ctx.fillStyle = '#070609';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < BEACON_COUNT; ++i) {  // use indices to keep z-ordering
      this._beacons[(this._beaconIndex + i) % BEACON_COUNT].render(ctx, width, height);
    }
  }
}
