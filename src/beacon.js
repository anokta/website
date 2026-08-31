
import {InstrumentControlType, NoteControlType} from '../external/barelymusician/src/control.js';
import {Engine} from '../external/barelymusician/src/engine.js';

import {lerp} from './math.js';

const MAX_RADIUS = 0.19
const VOLUME = 0.9

const GAIN_LERP_SPEED = 1.18
const POSITION_LERP_SPEED = 12.6
const PITCH_SHIFT_SPEED = 2.0

export class Beacon {
  /**
   * @param {Engine} engine
   */
  constructor(engine) {
    this._isActive = false;

    this._gain = 0.0;
    this._pitchShift = 0.0;

    this._pointerId = null;

    this._x = 0.0;
    this._y = 0.0;

    this._instrument = engine.createInstrument();
    this._instrument.setControl(InstrumentControlType.VOICE_COUNT, 8);
    this._instrument.setControl(InstrumentControlType.DELAY_SEND, 0.1);
    this._instrument.setControl(InstrumentControlType.REVERB_SEND, 0.25);
    this._instrument.setControl(InstrumentControlType.RELEASE, 2.5);
    this._instrument.setControl(InstrumentControlType.OSC_SHAPE, 0.09);
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   */
  pointerMove(x, y) {
    if (!this._isActive) return;
    this._targetX = x;
    this._targetY = y;
    this._pitchShift =
        Math.min(Math.max(this._pitchShift + (Math.random() - 0.5) * 0.01, -0.5), 0.5);
  }

  /**
   *
   * @param {number} pointerId
   * @param {number} x
   * @param {number} y
   */
  pointerDown(pointerId, x, y) {
    if (this._isActive) return;

    this._pointerId = pointerId;
    this._x = x;
    this._y = y;

    this._targetX = x;
    this._targetY = y;

    this._color = `hsl(${Math.random() * 180.0}, 100%, 80%)`;

    this._pitch = this._getRandomPitch();
    this._pitchShift = 0.0;
    this._gain = 0.0;
    this._isActive = true;

    this._instrument.setControl(InstrumentControlType.GAIN, VOLUME * this._gain);
    this._instrument.setNoteOn(this._pitch);
  }

  /**
   *
   * @param {number} x
   * @param {number} y
   */
  pointerUp(x, y) {
    if (!this._isActive) return;

    this._gain = 1.0;
    this._pitchShift = 0.0;
    this._isActive = false;
    this._pointerId = null;

    this._instrument.setControl(InstrumentControlType.GAIN, VOLUME * this._gain);
    this._instrument.setNoteOff(this._pitch);
  }

  update(dt) {
    this._x = lerp(this._x, this._targetX, dt * POSITION_LERP_SPEED);
    this._y = lerp(this._y, this._targetY, dt * POSITION_LERP_SPEED);

    this._gain = lerp(
        this._gain, this._isActive ? 0.5 : 0.0,
        this._isActive ? dt * GAIN_LERP_SPEED : 2.0 * dt * GAIN_LERP_SPEED);
    this._pitchShift = lerp(this._pitchShift, 0.0, dt * PITCH_SHIFT_SPEED);

    this._instrument.setNoteControl(this._pitch, NoteControlType.PITCH_SHIFT, this._pitchShift);
    this._instrument.setControl(InstrumentControlType.GAIN, VOLUME * this._gain);
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} width
   * @param {number} height
   */
  render(ctx, width, height) {
    ctx.fillStyle = this._color;

    ctx.beginPath();
    const radius = this._gain * MAX_RADIUS * Math.min(width, height);
    ctx.arc(this._x, this._y, radius, 0.0, 2.0 * Math.PI);
    ctx.fill();
  }

  get gain() {
    return this._gain;
  }

  get isActive() {
    return this._isActive;
  }

  get pointerId() {
    return this._pointerId;
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  _getRandomPitch() {
    return Math.random();
  }
};
