import {Habutat} from './habutat.js';

const onLoad = async () => {
  const audioContext = new window.AudioContext();
  await audioContext.audioWorklet.addModule('../external/barelymusician/src/processor.js');
  document.body.addEventListener('click', () => audioContext.resume());

  const canvas = document.createElement('canvas');
  document.body.appendChild(canvas);

  new Habutat(audioContext, canvas, window);
};
window.addEventListener('load', onLoad);
