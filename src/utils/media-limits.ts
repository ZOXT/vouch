/**
 * Hard cap for testimonial videos. The media worker rejects anything longer
 * than this during ffprobe validation, so every layer that accepts a reported
 * duration (upload confirmation, campaign submissions, validators, client
 * UI) must agree on the same ceiling.
 */
export const MAX_TESTIMONIAL_DURATION_SECONDS = 120;
export const MAX_TESTIMONIAL_DURATION_LABEL = "2 minutes";