// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getUserGestureAudioContext } from '../lib/audio';

describe('getUserGestureAudioContext', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('waits for a user gesture before creating the audio context', async () => {
    const AudioContextMock = vi.fn().mockImplementation(function (this: { state: string; resume: ReturnType<typeof vi.fn> }) {
      this.state = 'suspended';
      this.resume = vi.fn().mockResolvedValue(undefined);
    });

    vi.stubGlobal('AudioContext', AudioContextMock as unknown as typeof AudioContext);

    const contextPromise = getUserGestureAudioContext();

    expect(AudioContextMock).not.toHaveBeenCalled();

    document.dispatchEvent(new Event('pointerdown'));

    const context = await contextPromise;

    expect(AudioContextMock).toHaveBeenCalledTimes(1);
    expect(context).toBeDefined();
  });
});
