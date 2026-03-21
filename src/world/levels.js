const TS = 64; // base unit (tile-ish size)

const rect = (x, y, w, h) => ({ x, y, w, h });

export const Levels = [
  {
    id: "l1",
    name: "First Shift",
    bounds: { w: 28 * TS, h: 10 * TS },
    spawn: { x: 2 * TS, y: 6 * TS },
    goal: rect(25.2 * TS, 6.1 * TS, 0.9 * TS, 1.2 * TS),
    shared: {
      solids: [
        rect(0, 7.5 * TS, 28 * TS, 2.5 * TS), // ground
        rect(0, 0, 0.5 * TS, 10 * TS), // left wall
        rect(27.5 * TS, 0, 0.5 * TS, 10 * TS), // right wall
        rect(0, -0.5 * TS, 28 * TS, 0.5 * TS), // ceiling
      ],
    },
    past: {
      solids: [
        rect(3.0 * TS, 6.2 * TS, 4.0 * TS, 1.0 * TS), // ledge
        rect(8.2 * TS, 6.2 * TS, 3.0 * TS, 1.0 * TS), // pre-bridge
        // broken bridge gap (no solids)
        rect(15.0 * TS, 6.2 * TS, 2.8 * TS, 1.0 * TS), // post-gap
        rect(19.0 * TS, 5.4 * TS, 2.5 * TS, 1.0 * TS), // step up
      ],
      deco: [
        { type: "ruin", x: 11.2 * TS, y: 6.0 * TS, scale: 1.0 },
        { type: "sapling", x: 5.5 * TS, y: 6.1 * TS, scale: 0.9 },
        { type: "sapling", x: 17.2 * TS, y: 6.1 * TS, scale: 0.9 },
      ],
    },
    future: {
      solids: [
        rect(3.0 * TS, 6.2 * TS, 4.0 * TS, 1.0 * TS),
        rect(8.2 * TS, 6.2 * TS, 3.0 * TS, 1.0 * TS),
        rect(11.3 * TS, 6.2 * TS, 3.7 * TS, 0.7 * TS), // repaired bridge
        rect(15.0 * TS, 6.2 * TS, 2.8 * TS, 1.0 * TS),
        rect(19.0 * TS, 5.4 * TS, 2.5 * TS, 1.0 * TS),
        rect(21.7 * TS, 4.6 * TS, 2.8 * TS, 1.0 * TS), // final ledge
      ],
      deco: [
        { type: "bridge", x: 11.3 * TS, y: 6.2 * TS, scale: 1.0 },
        { type: "tree", x: 5.6 * TS, y: 6.0 * TS, scale: 1.0 },
        { type: "tree", x: 17.4 * TS, y: 6.0 * TS, scale: 1.0 },
      ],
    },
    boxes: [],
    switches: [],
    gates: {},
  },
  {
    id: "l2",
    name: "Rubble & Lever",
    bounds: { w: 30 * TS, h: 11 * TS },
    spawn: { x: 2.0 * TS, y: 6.2 * TS },
    goal: rect(27.7 * TS, 5.4 * TS, 0.9 * TS, 1.2 * TS),
    shared: {
      solids: [
        rect(0, 8.0 * TS, 30 * TS, 3.0 * TS),
        rect(0, 0, 0.5 * TS, 11 * TS),
        rect(29.5 * TS, 0, 0.5 * TS, 11 * TS),
        rect(0, -0.5 * TS, 30 * TS, 0.5 * TS),
        rect(4.0 * TS, 6.6 * TS, 5.2 * TS, 0.9 * TS),
        rect(10.0 * TS, 6.0 * TS, 3.2 * TS, 0.8 * TS),
        rect(14.0 * TS, 6.3 * TS, 3.8 * TS, 0.7 * TS),
        rect(20.0 * TS, 5.7 * TS, 5.5 * TS, 0.9 * TS),
      ],
    },
    past: {
      solids: [
        rect(9.2 * TS, 5.2 * TS, 1.0 * TS, 1.6 * TS), // rubble pillar blocks a shortcut
      ],
      deco: [
        { type: "ruin", x: 12.2 * TS, y: 6.1 * TS, scale: 1.0 },
        { type: "sapling", x: 6.1 * TS, y: 6.4 * TS, scale: 1.0 },
      ],
    },
    future: {
      solids: [
        // rubble cleared; but gate exists unless switch is pressed
      ],
      deco: [
        { type: "tree", x: 6.2 * TS, y: 6.3 * TS, scale: 1.1 },
        { type: "structure", x: 12.4 * TS, y: 6.1 * TS, scale: 1.0 },
      ],
    },
    boxes: [{ id: "b1", x: 12.0 * TS, y: 5.1 * TS, w: 0.85 * TS, h: 0.85 * TS, shared: true }],
    switches: [{ id: "s1", x: 17.4 * TS, y: 7.2 * TS, w: 1.0 * TS, h: 0.35 * TS, gates: ["g1"] }],
    gates: {
      g1: { x: 25.0 * TS, y: 6.2 * TS, w: 0.9 * TS, h: 1.8 * TS },
    },
  },
  {
    id: "l3",
    name: "Grown Canopy",
    bounds: { w: 34 * TS, h: 13 * TS },
    spawn: { x: 2.0 * TS, y: 7.0 * TS },
    goal: rect(31.5 * TS, 3.4 * TS, 0.9 * TS, 1.2 * TS),
    shared: {
      solids: [
        rect(0, 9.2 * TS, 34 * TS, 3.8 * TS),
        rect(0, 0, 0.5 * TS, 13 * TS),
        rect(33.5 * TS, 0, 0.5 * TS, 13 * TS),
        rect(0, -0.5 * TS, 34 * TS, 0.5 * TS),
        rect(4.0 * TS, 7.4 * TS, 5.0 * TS, 0.9 * TS),
        rect(11.0 * TS, 6.8 * TS, 4.5 * TS, 0.9 * TS),
        rect(18.0 * TS, 6.2 * TS, 3.5 * TS, 0.9 * TS),
        rect(22.5 * TS, 5.5 * TS, 3.0 * TS, 0.9 * TS),
      ],
    },
    past: {
      solids: [
        rect(26.0 * TS, 5.5 * TS, 2.6 * TS, 0.6 * TS), // lower ledge
        // incomplete structure (missing upper steps)
      ],
      deco: [
        { type: "sapling", x: 8.2 * TS, y: 7.2 * TS, scale: 1.0 },
        { type: "ruin", x: 24.5 * TS, y: 6.0 * TS, scale: 1.1 },
      ],
    },
    future: {
      solids: [
        rect(26.0 * TS, 5.5 * TS, 2.6 * TS, 0.6 * TS),
        rect(28.4 * TS, 4.6 * TS, 2.1 * TS, 0.6 * TS),
        rect(30.3 * TS, 3.7 * TS, 2.2 * TS, 0.6 * TS),
        // “tree canopy” platforms
        rect(9.0 * TS, 4.4 * TS, 3.2 * TS, 0.55 * TS),
        rect(13.0 * TS, 3.5 * TS, 3.2 * TS, 0.55 * TS),
        rect(17.0 * TS, 2.7 * TS, 3.2 * TS, 0.55 * TS),
      ],
      deco: [
        { type: "tree", x: 8.0 * TS, y: 7.2 * TS, scale: 1.45 },
        { type: "tree", x: 14.5 * TS, y: 7.2 * TS, scale: 1.3 },
        { type: "structure", x: 24.4 * TS, y: 5.9 * TS, scale: 1.2 },
      ],
    },
    boxes: [{ id: "b1", x: 6.2 * TS, y: 6.4 * TS, w: 0.85 * TS, h: 0.85 * TS, shared: true }],
    switches: [],
    gates: {},
  },
  {
    id: "l4",
    name: "Falling Ruins",
    bounds: { w: 34 * TS, h: 13 * TS },
    spawn: { x: 3.0 * TS, y: 7.0 * TS },
    goal: rect(30.4 * TS, 3.4 * TS, 0.9 * TS, 1.2 * TS),
    shared: {
      solids: [
        rect(0, 9.0 * TS, 34 * TS, 4.0 * TS),
        rect(0, 0, 0.5 * TS, 13 * TS),
        rect(33.5 * TS, 0, 0.5 * TS, 13 * TS),
        rect(0, -0.5 * TS, 34 * TS, 0.5 * TS),
        rect(6.0 * TS, 7.4 * TS, 5.0 * TS, 0.9 * TS),
        rect(14.0 * TS, 6.8 * TS, 3.5 * TS, 0.9 * TS),
        rect(19.0 * TS, 6.2 * TS, 3.5 * TS, 0.9 * TS),
      ],
    },
    past: {
      solids: [
        rect(23.2 * TS, 5.6 * TS, 2.2 * TS, 0.7 * TS),
        rect(25.8 * TS, 4.8 * TS, 2.2 * TS, 0.7 * TS),
      ],
      deco: [
        { type: "ruin", x: 11.0 * TS, y: 6.8 * TS, scale: 1.0 },
        { type: "sapling", x: 7.0 * TS, y: 7.4 * TS, scale: 1.0 },
      ],
    },
    future: {
      solids: [
        rect(23.2 * TS, 5.6 * TS, 2.2 * TS, 0.7 * TS),
        rect(25.8 * TS, 4.8 * TS, 2.2 * TS, 0.7 * TS),
        rect(28.2 * TS, 3.9 * TS, 2.0 * TS, 0.7 * TS),
      ],
      deco: [
        { type: "structure", x: 11.2 * TS, y: 6.7 * TS, scale: 1.1 },
        { type: "tree", x: 7.0 * TS, y: 7.4 * TS, scale: 1.3 },
      ],
    },
    boxes: [
      { id: "b1", x: 10.2 * TS, y: 5.3 * TS, w: 0.85 * TS, h: 0.85 * TS, shared: true },
      { id: "b2", x: 16.2 * TS, y: 5.7 * TS, w: 0.85 * TS, h: 0.85 * TS, shared: true },
    ],
    switches: [],
    gates: {},
  },
  {
    id: "l5",
    name: "Twin Gates",
    bounds: { w: 36 * TS, h: 13 * TS },
    spawn: { x: 2.4 * TS, y: 7.0 * TS },
    goal: rect(33.2 * TS, 4.6 * TS, 0.9 * TS, 1.2 * TS),
    shared: {
      solids: [
        rect(0, 9.0 * TS, 36 * TS, 4.0 * TS),
        rect(0, 0, 0.5 * TS, 13 * TS),
        rect(35.5 * TS, 0, 0.5 * TS, 13 * TS),
        rect(0, -0.5 * TS, 36 * TS, 0.5 * TS),
        rect(4.0 * TS, 7.4 * TS, 4.8 * TS, 0.9 * TS),
        rect(10.0 * TS, 6.8 * TS, 4.8 * TS, 0.9 * TS),
        rect(18.2 * TS, 6.0 * TS, 4.2 * TS, 0.9 * TS),
        rect(23.8 * TS, 5.4 * TS, 3.2 * TS, 0.9 * TS),
      ],
    },
    past: {
      solids: [
        rect(28.2 * TS, 5.4 * TS, 1.0 * TS, 1.8 * TS), // rubble column blocks gate A
      ],
      deco: [
        { type: "ruin", x: 21.2 * TS, y: 6.0 * TS, scale: 1.1 },
        { type: "sapling", x: 12.0 * TS, y: 7.0 * TS, scale: 1.0 },
      ],
    },
    future: {
      solids: [],
      deco: [
        { type: "structure", x: 21.2 * TS, y: 6.0 * TS, scale: 1.1 },
        { type: "tree", x: 12.0 * TS, y: 7.0 * TS, scale: 1.2 },
      ],
    },
    boxes: [
      { id: "b1", x: 9.0 * TS, y: 6.2 * TS, w: 0.85 * TS, h: 0.85 * TS, shared: true },
      { id: "b2", x: 15.4 * TS, y: 5.4 * TS, w: 0.85 * TS, h: 0.85 * TS, shared: true },
    ],
    switches: [
      { id: "s1", x: 17.8 * TS, y: 7.2 * TS, w: 1.0 * TS, h: 0.35 * TS, gates: ["g1"] },
      { id: "s2", x: 24.2 * TS, y: 7.2 * TS, w: 1.0 * TS, h: 0.35 * TS, gates: ["g2"] },
    ],
    gates: {
      g1: { x: 25.8 * TS, y: 5.4 * TS, w: 0.9 * TS, h: 1.8 * TS },
      g2: { x: 30.0 * TS, y: 4.8 * TS, w: 0.9 * TS, h: 2.0 * TS },
    },
  },
];