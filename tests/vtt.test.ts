import assert from "node:assert/strict";
import test from "node:test";
import { formatVttTimestamp, segmentsToVtt } from "../src/utils/captions";

test("formats VTT timestamps as HH:MM:SS.mmm", () => {
  assert.equal(formatVttTimestamp(0), "00:00:00.000");
  assert.equal(formatVttTimestamp(1.5), "00:00:01.500");
  assert.equal(formatVttTimestamp(61.25), "00:01:01.250");
  assert.equal(formatVttTimestamp(3661.001), "01:01:01.001");
});

test("clamps negative timestamps to zero", () => {
  assert.equal(formatVttTimestamp(-5), "00:00:00.000");
});

test("builds a WebVTT document from segments", () => {
  const vtt = segmentsToVtt([
    { start: 0.5, end: 2, text: " Hello there " },
    { start: 2.5, end: 4.75, text: "world" },
  ]);

  assert.equal(
    vtt,
    "WEBVTT\n\n1\n00:00:00.500 --> 00:00:02.000\nHello there\n\n2\n00:00:02.500 --> 00:00:04.750\nworld\n",
  );
});

test("skips empty, malformed, and zero-length segments", () => {
  const vtt = segmentsToVtt([
    { start: 0, end: 1, text: "   " },
    { start: Number.NaN, end: 1, text: "no start" },
    { start: 3, end: 3, text: "zero length" },
    { start: 5, end: 4, text: "backwards" },
    { start: 10, end: 12, text: "valid" },
  ]);

  assert.equal(vtt, "WEBVTT\n\n1\n00:00:10.000 --> 00:00:12.000\nvalid\n");
});

test("escapes cue text that WebVTT would parse as markup", () => {
  const vtt = segmentsToVtt([{ start: 0, end: 1, text: "a <b> & c --> d" }]);

  assert.ok(vtt.includes("a &lt;b&gt; &amp; c --&gt; d"));
});

test("returns a header-only document for no usable segments", () => {
  assert.equal(segmentsToVtt([]), "WEBVTT\n");
});
