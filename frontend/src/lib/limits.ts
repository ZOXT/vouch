export const MAX_TESTIMONIAL_DURATION_SECONDS = 120;

export const formatMaxDuration = (seconds: number): string =>
  seconds < 60
    ? `${seconds}s`
    : seconds % 60 === 0
      ? `${Math.floor(seconds / 60)} min`
      : `${Math.floor(seconds / 60)} min ${seconds % 60}s`;