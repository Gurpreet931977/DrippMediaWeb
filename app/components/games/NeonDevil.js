export default class NeonDevil {
  constructor(canvas, callbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.ctx = canvas.getContext('2d');
    
    this.callbacks.setScoreRef(0);
    this.callbacks.setScore(0);
    this.callbacks.setGameState("playing");

    this.keys = { left: false, right: false, up: false, down: false };
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);

    // Mobile controls state
    this.touches = [];

    this.currentLevelIdx = 0;
    this.deaths = 0;
    this.particles = [];

    // Tile configuration
    this.cols = 24;
    this.rows = 14;
    this.tileSize = Math.min(this.canvas.width / this.cols, this.canvas.height / this.rows);
    this.offsetX = (this.canvas.width - (this.cols * this.tileSize)) / 2;
    this.offsetY = (this.canvas.height - (this.rows * this.tileSize)) / 2;

    // Constants for Game Feel
    this.SQUASH = { x: 1.4, y: 0.6 };
    this.STRETCH = { x: 0.7, y: 1.3 };
    this.NORMAL_SCALE = { x: 1, y: 1 };
    this.MAX_JUMP_BUFFER = 6;
    this.MAX_COYOTE_TIME = 6;

    this.generateLevels();
    this.loadLevel(this.currentLevelIdx);
  }

  generateLevels() {
    const floor = "########################";
    const empty = "........................";
    
    this.LEVELS = [
      // 1: The crushing ceiling & fake jump
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, "..........######........", "..........######........", "..........######........",
          "S......................G",
          "#######.#######..#######",
          empty, empty
        ],
        triggers: [ 
          { zone: {x: 4, w: 4}, actions: [
            {type: 'move', x: 10, y: 7, dx: 0, dy: 3, speed: 0.2}, {type: 'move', x: 11, y: 7, dx: 0, dy: 3, speed: 0.2}, {type: 'move', x: 12, y: 7, dx: 0, dy: 3, speed: 0.2},
            {type: 'move', x: 13, y: 7, dx: 0, dy: 3, speed: 0.2}, {type: 'move', x: 14, y: 7, dx: 0, dy: 3, speed: 0.2}, {type: 'move', x: 15, y: 7, dx: 0, dy: 3, speed: 0.2},
            {type: 'move', x: 10, y: 8, dx: 0, dy: 3, speed: 0.2}, {type: 'move', x: 11, y: 8, dx: 0, dy: 3, speed: 0.2}, {type: 'move', x: 12, y: 8, dx: 0, dy: 3, speed: 0.2},
            {type: 'move', x: 13, y: 8, dx: 0, dy: 3, speed: 0.2}, {type: 'move', x: 14, y: 8, dx: 0, dy: 3, speed: 0.2}, {type: 'move', x: 15, y: 8, dx: 0, dy: 3, speed: 0.2},
            {type: 'move', x: 10, y: 9, dx: 0, dy: 3, speed: 0.2}, {type: 'move', x: 11, y: 9, dx: 0, dy: 3, speed: 0.2}, {type: 'move', x: 12, y: 9, dx: 0, dy: 3, speed: 0.2},
            {type: 'move', x: 13, y: 9, dx: 0, dy: 3, speed: 0.2}, {type: 'move', x: 14, y: 9, dx: 0, dy: 3, speed: 0.2}, {type: 'move', x: 15, y: 9, dx: 0, dy: 3, speed: 0.2}
          ] },
          { zone: {x: 14, w: 2}, actions: [{type: 'hide', x: 17, y: 11}, {type: 'hide', x: 18, y: 11}] }
        ]
      },
      // 2: Gravity flip + Spike drop
      {
        grid: [
          empty, empty, "...............G........", "###############.########", empty, "...............v........", empty, empty, empty, empty,
          "S.......................", floor, empty, empty
        ],
        triggers: [ 
          { zone: {x: 6, w: 2}, actions: [{type: 'flipGravity'}], once: true },
          { zone: {x: 12, w: 3}, actions: [{type: 'move', x: 15, y: 5, dx: 0, dy: -3, speed: 0.4}] }
        ]
      },
      // 3: The running goal + crumbling floor
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S.....................G.", floor, empty, empty
        ],
        triggers: [ 
          { zone: {x: 5, w: 2}, actions: [{type: 'move', x: 22, y: 10, dx: -18, dy: -6, speed: 0.2}] },
          { zone: {x: 4, w: 2}, actions: [{type: 'hideAllFloor', from: 0, to: 3}] },
          { zone: {x: 8, w: 2}, actions: [{type: 'hideAllFloor', from: 4, to: 7}] },
          { zone: {x: 12, w: 2}, actions: [{type: 'hideAllFloor', from: 8, to: 11}] },
          { zone: {x: 16, w: 2}, actions: [{type: 'hideAllFloor', from: 12, to: 15}] }
        ]
      },
      // 4: The fake wall death trap
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty,
          "..........#.............", "..........#.............", "S.........#............G", floor, empty, empty
        ],
        triggers: [ 
          { zone: {x: 5, w: 2}, actions: [{type: 'hide', x: 10, y: 8}, {type: 'hide', x: 10, y: 9}, {type: 'hide', x: 10, y: 10}] },
          { zone: {x: 8, w: 2}, actions: [{type: 'hide', x: 10, y: 11}, {type: 'showSpike', x: 10, y: 11, dir: '^'}] } 
        ]
      },
      // 5: Invert + Bouncing floor
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [ 
          { zone: {x: 4, w: 8}, actions: [{type: 'invertControls'}], continuous: true },
          { zone: {x: 8, w: 5}, actions: [{type: 'bounce', strength: -12}] },
          { zone: {x: 12, w: 2}, actions: [{type: 'showSpike', x: 15, y: 10, dir: '^'}, {type: 'showSpike', x: 16, y: 10, dir: '^'}] }
        ]
      },
      // 6
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [ { zone: {x: 8, w: 8}, actions: [{type: 'invertControls'}], continuous: true } ]
      },
      // 7
      {
        grid: [
          empty, empty, ".......................G", "##########....##########",
          empty, empty, empty, empty, empty, empty,
          "S.......................", "##########....##########", empty, empty
        ],
        triggers: [ { zone: {x: 7, w: 4}, actions: [{type: 'flipGravity'}], once: true } ]
      },
      // 8
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [ { zone: {x: 12, w: 2}, actions: [ {type: 'hide', x: 14, y: 11}, {type: 'showSpike', x: 14, y: 11, dir: '^'}, {type: 'hide', x: 15, y: 11}, {type: 'showSpike', x: 15, y: 11, dir: '^'} ]} ]
      },
      // 9
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S.......G..............G", floor, empty, empty
        ],
        triggers: [ { zone: {x: 6, w: 2}, actions: [{type: 'hide', x: 8, y: 10}, {type: 'showSpike', x: 8, y: 10, dir: '^'}] } ]
      },
      // 10
      {
        grid: [
          empty, empty, empty, empty, empty, empty, "...............######...", empty, empty, empty,
          "S.......####...........G", "#######......###########", empty, empty
        ],
        triggers: [ { zone: {x: 10, w: 4}, actions: [{type: 'move', x: 15, y: 6, dx: 0, dy: 3, speed: 0.5}, {type: 'move', x: 16, y: 6, dx: 0, dy: 3, speed: 0.5}, {type: 'move', x: 17, y: 6, dx: 0, dy: 3, speed: 0.5}, {type: 'move', x: 18, y: 6, dx: 0, dy: 3, speed: 0.5}, {type: 'move', x: 19, y: 6, dx: 0, dy: 3, speed: 0.5}, {type: 'move', x: 20, y: 6, dx: 0, dy: 3, speed: 0.5}] } ]
      },
      // 11
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [ { zone: {x: 3, w: 15}, actions: [{type: 'hideAllFloor', from: 4, to: 20}] } ]
      },
      // 12
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S..........^...........G", floor, empty, empty
        ],
        triggers: [ { zone: {x: 5, w: 5}, actions: [{type: 'move', x: 11, y: 10, dx: -5, dy: 0, speed: 0.3}] } ]
      },
      // 13
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "G.S....................G", floor, empty, empty
        ],
        triggers: [ { zone: {x: 20, w: 2}, actions: [{type: 'hide', x: 23, y: 10}, {type: 'showSpike', x: 23, y: 10, dir: '^'}] } ]
      },
      // 14
      {
        grid: [
          empty, empty, empty, empty, "............vvv.........", empty, empty, empty, empty, empty,
          "S...........###........G", floor, empty, empty
        ],
        triggers: [ { zone: {x: 10, w: 5}, actions: [{type: 'bounce', strength: -15}] } ]
      },
      // 15
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S.......^........^.....G", floor, empty, empty
        ],
        triggers: [],
        darkness: true
      },
      // 16
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S#.....................G", floor, empty, empty
        ],
        triggers: [ { zone: {x: 3, w: 20}, actions: [{type: 'move', x: 1, y: 10, dx: 22, dy: 0, speed: 0.15}] } ]
      },
      // 17
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [ { zone: {x: 5, w: 10}, actions: [{type: 'disableJump'}], continuous: true } ]
      },
      // 18
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [ { zone: {x: 10, w: 2}, actions: [{type: 'fakeDeath'}], once: true } ]
      },
      // 19
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [ { zone: {x: 20, w: 2}, actions: [{type: 'teleport', tx: 2, ty: 10}] }, { zone: {x: 0, w: 1}, actions: [{type: 'teleport', tx: 21, ty: 10}] } ]
      },
      // 20
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "..................v.....",
          "S.......#...............",
          "###..####..##..###.....G",
          empty, empty
        ],
        triggers: [
          { zone: {x: 4, w: 2}, actions: [{type: 'hide', x: 5, y: 11}, {type: 'hide', x: 6, y: 11}] },
          { zone: {x: 10, w: 2}, actions: [{type: 'move', x: 18, y: 9, dx: -6, dy: 0, speed: 0.3}] },
          { zone: {x: 14, w: 2}, actions: [{type: 'flipGravity'}], once: true }
        ]
      },
      // 21 - The Crusher
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G",
          "###..................###",
          empty, empty
        ],
        triggers: [ 
          { zone: {x: 3, w: 15}, actions: [
            {type: 'move', x: 0, y: 11, dx: 8, dy: 0, speed: 0.15}, 
            {type: 'move', x: 1, y: 11, dx: 8, dy: 0, speed: 0.15},
            {type: 'move', x: 2, y: 11, dx: 8, dy: 0, speed: 0.15},
            {type: 'move', x: 21, y: 11, dx: -8, dy: 0, speed: 0.15},
            {type: 'move', x: 22, y: 11, dx: -8, dy: 0, speed: 0.15},
            {type: 'move', x: 23, y: 11, dx: -8, dy: 0, speed: 0.15}
          ], once: true }
        ]
      },
      // 22 - The Floor is Lava (sequential)
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [
          { zone: {x: 2, w: 20}, actions: [
            {type: 'hide', x: 3, y: 11}, {type: 'showSpike', x: 3, y: 11, dir: '^'},
            {type: 'hide', x: 6, y: 11}, {type: 'showSpike', x: 6, y: 11, dir: '^'},
            {type: 'hide', x: 9, y: 11}, {type: 'showSpike', x: 9, y: 11, dir: '^'},
            {type: 'hide', x: 12, y: 11}, {type: 'showSpike', x: 12, y: 11, dir: '^'},
            {type: 'hide', x: 15, y: 11}, {type: 'showSpike', x: 15, y: 11, dir: '^'},
            {type: 'hide', x: 18, y: 11}, {type: 'showSpike', x: 18, y: 11, dir: '^'}
          ], once: true }
        ]
      },
      // 23 - Gauntlet of Lies
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S.......G...G...G......G", floor, empty, empty
        ],
        triggers: [
          { zone: {x: 6, w: 2}, actions: [{type: 'hide', x: 8, y: 10}, {type: 'showSpike', x: 8, y: 10, dir: '^'}] },
          { zone: {x: 10, w: 2}, actions: [{type: 'teleport', tx: 1, ty: 10}] },
          { zone: {x: 14, w: 2}, actions: [{type: 'bounce', strength: -20}] }
        ]
      },
      // 24 - Pinball
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [
          { zone: {x: 5, w: 2}, actions: [{type: 'bounce', strength: -12}], continuous: true },
          { zone: {x: 10, w: 2}, actions: [{type: 'bounce', strength: -18}], continuous: true },
          { zone: {x: 15, w: 2}, actions: [{type: 'bounce', strength: -8}], continuous: true }
        ]
      },
      // 25 - Gravity Madness
      {
        grid: [
          ".......................G", floor, empty, empty, empty, empty, empty, empty, empty, empty,
          "S.......................", floor, empty, empty
        ],
        triggers: [
          { zone: {x: 5, w: 2}, actions: [{type: 'flipGravity'}], once: true },
          { zone: {x: 12, w: 2}, actions: [{type: 'flipGravity'}], once: true },
          { zone: {x: 18, w: 2}, actions: [{type: 'flipGravity'}], once: true }
        ]
      },
      // 26 - Reverse Troll
      {
        grid: [
          "G.......................", floor, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......G................", "######..################", empty, empty
        ],
        triggers: [
          { zone: {x: -1, w: 2}, actions: [{type: 'teleport', tx: 0, ty: 0}] },
          { zone: {x: 5, w: 3}, actions: [{type: 'hide', x: 7, y: 10}, {type: 'showSpike', x: 7, y: 10, dir: '^'}] }
        ]
      },
      // 27 - Stairway to Hell
      {
        grid: [
          empty, empty, empty, empty, empty, ".......................G", ".....................###", "..................###...", "...............###......", "............###.........",
          "S........###............", "#########...............", empty, empty
        ],
        triggers: [
          { zone: {x: 8, w: 2}, actions: [{type: 'hide', x: 9, y: 10}, {type: 'hide', x: 10, y: 10}, {type: 'hide', x: 11, y: 10}] },
          { zone: {x: 11, w: 2}, actions: [{type: 'hide', x: 12, y: 9}, {type: 'hide', x: 13, y: 9}, {type: 'hide', x: 14, y: 9}] },
          { zone: {x: 14, w: 2}, actions: [{type: 'hide', x: 15, y: 8}, {type: 'hide', x: 16, y: 8}, {type: 'hide', x: 17, y: 8}] },
          { zone: {x: 17, w: 2}, actions: [{type: 'hide', x: 18, y: 7}, {type: 'hide', x: 19, y: 7}, {type: 'hide', x: 20, y: 7}] }
        ]
      },
      // 28 - Total Eclipse
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S.......^.......^......G", floor, empty, empty
        ],
        triggers: [],
        darkness: true
      },
      // 29 - Schrödinger's Jump
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S.......#.......#......G", "#########.......########", empty, empty
        ],
        triggers: [
          { zone: {x: 4, w: 3}, actions: [{type: 'disableJump'}], continuous: true }
        ]
      },
      // 30 - Falling Ceiling
      {
        grid: [
          "########################", empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [
          { zone: {x: 3, w: 15}, actions: [
            {type: 'move', x: 5, y: 0, dx: 0, dy: 10, speed: 0.3},
            {type: 'move', x: 6, y: 0, dx: 0, dy: 10, speed: 0.3},
            {type: 'move', x: 7, y: 0, dx: 0, dy: 10, speed: 0.3},
            {type: 'move', x: 8, y: 0, dx: 0, dy: 10, speed: 0.3},
            {type: 'move', x: 9, y: 0, dx: 0, dy: 10, speed: 0.3},
            {type: 'move', x: 10, y: 0, dx: 0, dy: 10, speed: 0.3}
          ], once: true }
        ]
      },
      // 31 - The Troll Pit
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [
          { zone: {x: 8, w: 4}, actions: [{type: 'hideAllFloor', from: 10, to: 15}, {type: 'bounce', strength: -10}] }
        ]
      },
      // 32 - Teleport Maze
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [
          { zone: {x: 5, w: 2}, actions: [{type: 'teleport', tx: 15, ty: 10}] },
          { zone: {x: 18, w: 2}, actions: [{type: 'teleport', tx: 2, ty: 10}] },
          { zone: {x: 10, w: 2}, actions: [{type: 'teleport', tx: 22, ty: 10}] }
        ]
      },
      // 33 - Rain of Spikes
      {
        grid: [
          ".........v.v.v.v........", empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [
          { zone: {x: 5, w: 10}, actions: [
            {type: 'move', x: 9, y: 0, dx: 0, dy: 10, speed: 0.4},
            {type: 'move', x: 11, y: 0, dx: 0, dy: 10, speed: 0.4},
            {type: 'move', x: 13, y: 0, dx: 0, dy: 10, speed: 0.4},
            {type: 'move', x: 15, y: 0, dx: 0, dy: 10, speed: 0.4}
          ], once: true }
        ]
      },
      // 34 - Running Goal
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S..................G....", floor, empty, empty
        ],
        triggers: [
          { zone: {x: 12, w: 5}, actions: [{type: 'move', x: 19, y: 10, dx: 4, dy: 0, speed: 0.2}], continuous: true }
        ]
      },
      // 35 - Pop-up Spikes
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [
          { zone: {x: 5, w: 2}, actions: [{type: 'showSpike', x: 8, y: 10, dir: '^'}] },
          { zone: {x: 10, w: 2}, actions: [{type: 'showSpike', x: 13, y: 10, dir: '^'}] },
          { zone: {x: 15, w: 2}, actions: [{type: 'showSpike', x: 18, y: 10, dir: '^'}] }
        ]
      },
      // 36 - Squeezed!
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S...#..............#...G", "#####..............#####", empty, empty
        ],
        triggers: [
          { zone: {x: 5, w: 10}, actions: [
            {type: 'move', x: 4, y: 10, dx: 5, dy: 0, speed: 0.1},
            {type: 'move', x: 4, y: 11, dx: 5, dy: 0, speed: 0.1},
            {type: 'move', x: 19, y: 10, dx: -5, dy: 0, speed: 0.1},
            {type: 'move', x: 19, y: 11, dx: -5, dy: 0, speed: 0.1}
          ], once: true }
        ]
      },
      // 37 - Floor Bounce
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [
          { zone: {x: 4, w: 15}, actions: [{type: 'bounce', strength: -15}], continuous: true }
        ]
      },
      // 38 - Inverted Darkness
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [
          { zone: {x: 3, w: 18}, actions: [{type: 'invertControls'}], continuous: true }
        ],
        darkness: true
      },
      // 39 - The Double Fake
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [
          { zone: {x: 8, w: 2}, actions: [{type: 'fakeDeath'}], once: true },
          { zone: {x: 15, w: 2}, actions: [{type: 'fakeDeath'}], once: true }
        ]
      },
      // 40 - Moving Pit
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S.....#..........#.....G", "#######..........#######", empty, empty
        ],
        triggers: [
          { zone: {x: 4, w: 2}, actions: [{type: 'move', x: 6, y: 10, dx: 4, dy: 0, speed: 0.2}, {type: 'move', x: 6, y: 11, dx: 4, dy: 0, speed: 0.2}] }
        ]
      },
      // 41 - Gravity Spikes
      {
        grid: [
          ".......^^^^^^^^.........", empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [
          { zone: {x: 7, w: 8}, actions: [{type: 'flipGravity'}], once: true }
        ]
      },
      // 42 - Drop & Bounce
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [
          { zone: {x: 10, w: 5}, actions: [{type: 'hideAllFloor', from: 8, to: 16}, {type: 'bounce', strength: -15}] }
        ]
      },
      // 43 - Surrounded Goal
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "..................###...",
          "S.................#G#...", "########################", empty, empty
        ],
        triggers: [
          { zone: {x: 15, w: 2}, actions: [{type: 'hide', x: 18, y: 9}, {type: 'hide', x: 19, y: 9}, {type: 'hide', x: 20, y: 9}, {type: 'hide', x: 18, y: 10}] }
        ]
      },
      // 44 - Leap of Faith 2
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S.......^^^^^^^^.......G", "#########......#########", empty, empty
        ],
        triggers: [],
        darkness: true
      },
      // 45 - Invisible Walls
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [
          { zone: {x: 5, w: 2}, actions: [{type: 'bounce', strength: -5}], continuous: true },
          { zone: {x: 10, w: 2}, actions: [{type: 'bounce', strength: -5}], continuous: true },
          { zone: {x: 15, w: 2}, actions: [{type: 'bounce', strength: -5}], continuous: true }
        ]
      },
      // 46 - Giant Pit
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", "#####..............#####", empty, empty
        ],
        triggers: [
          { zone: {x: 4, w: 2}, actions: [{type: 'showSpike', x: 6, y: 11, dir: '^'}, {type: 'showSpike', x: 17, y: 11, dir: '^'}] }
        ]
      },
      // 47 - Slide Spikes
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S..........^...........G", floor, empty, empty
        ],
        triggers: [
          { zone: {x: 4, w: 10}, actions: [{type: 'move', x: 11, y: 10, dx: 6, dy: 0, speed: 0.15}], continuous: true }
        ]
      },
      // 48 - Chaos Combo
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", floor, empty, empty
        ],
        triggers: [
          { zone: {x: 5, w: 2}, actions: [{type: 'invertControls'}], continuous: true },
          { zone: {x: 10, w: 2}, actions: [{type: 'fakeDeath'}], once: true },
          { zone: {x: 15, w: 2}, actions: [{type: 'teleport', tx: 18, ty: 10}] }
        ]
      },
      // 49 - Long Jump
      {
        grid: [
          empty, empty, empty, empty, empty, empty, empty, empty, empty, empty,
          "S......................G", "#####..............#####", empty, empty
        ],
        triggers: [
          { zone: {x: 4, w: 2}, actions: [{type: 'bounce', strength: -12}] }
        ]
      },
      // 50 - The Final Gauntlet
      {
        grid: [
          ".......................G", floor, empty, empty, empty, empty, empty, empty, empty, empty,
          "S.......................", floor, empty, empty
        ],
        triggers: [
          { zone: {x: 5, w: 4}, actions: [{type: 'flipGravity'}], once: true },
          { zone: {x: 10, w: 4}, actions: [{type: 'invertControls'}], continuous: true },
          { zone: {x: 15, w: 4}, actions: [{type: 'hideAllFloor', from: 0, to: 23}] },
          { zone: {x: 20, w: 2}, actions: [{type: 'teleport', tx: 22, ty: 0}] }
        ],
        darkness: true
      }
    ];

    // Procedurally escalate difficulty: Inject chaotic tricks into all levels based on progression
    this.LEVELS.forEach((level, idx) => {
       if (idx < 5) return; // Keep the first 5 handcrafted tutorials exactly as they are
       
       let numTricks = Math.floor(idx / 4); // Scales from 1 trick at level 5 to ~12 tricks at level 50
       
       for (let i = 0; i < numTricks; i++) {
          let trickType = Math.floor(Math.random() * 6);
          let triggerX = Math.floor(Math.random() * 15) + 3; // Random trigger zone x between 3 and 17
          
          if (!level.triggers) level.triggers = [];
          
          if (trickType === 0) {
             // Invisible spike drops from sky
             level.triggers.push({ zone: {x: triggerX, w: 2}, actions: [{type: 'showSpike', x: triggerX + 2, y: 10, dir: '^'}] });
          } else if (trickType === 1) {
             // Invert controls zone
             level.triggers.push({ zone: {x: triggerX, w: 3}, actions: [{type: 'invertControls'}], continuous: true });
          } else if (trickType === 2) {
             // Flip gravity trap
             level.triggers.push({ zone: {x: triggerX, w: 2}, actions: [{type: 'flipGravity'}], once: true });
          } else if (trickType === 3) {
             // Crushing block from above
             level.triggers.push({ zone: {x: triggerX, w: 2}, actions: [{type: 'move', x: triggerX+1, y: 6, dx: 0, dy: 4, speed: 0.4}] });
          } else if (trickType === 4) {
             // Bouncy floor trap
             level.triggers.push({ zone: {x: triggerX, w: 3}, actions: [{type: 'bounce', strength: -14}] });
          } else if (trickType === 5) {
             // Fake Death scare
             level.triggers.push({ zone: {x: triggerX, w: 1}, actions: [{type: 'fakeDeath'}], once: true });
          }
       }
    });
  }

  loadLevel(idx) {
    if (idx >= this.LEVELS.length) {
      this.callbacks.setGameState("level-complete");
      return;
    }
    const levelData = this.LEVELS[idx];
    this.tiles = [];
    this.flatTiles = []; // for easy iteration
    this.triggers = JSON.parse(JSON.stringify(levelData.triggers || []));
    this.darkness = levelData.darkness || false;
    this.gravity = 0.5;
    this.invertedControls = false;
    this.jumpDisabled = false;
    this.fakeDeath = false;
    
    this.player = {
      x: 0, y: 0, vx: 0, vy: 0,
      width: this.tileSize * 0.6,
      height: this.tileSize * 0.8,
      speed: 4.5,
      jumpPower: -10,
      grounded: false,
      color: '#00ffcc',
      scaleX: 1, scaleY: 1,
      jumpBuffer: 0,
      coyoteTime: 0
    };

    for (let r = 0; r < this.rows; r++) {
      this.tiles[r] = [];
      for (let c = 0; c < this.cols; c++) {
        const char = levelData.grid[r] && levelData.grid[r][c] ? levelData.grid[r][c] : '.';
        let tile = { 
           id: `${c},${r}`, char, type: 'empty', solid: false, 
           x: c * this.tileSize, y: r * this.tileSize,
           visualX: c * this.tileSize, visualY: r * this.tileSize,
           visualAlpha: 1, visualScale: 1,
           targetAlpha: 1, targetScale: 1,
           vx: 0, vy: 0,
           targetX: c * this.tileSize, targetY: r * this.tileSize,
           moveSpeed: 0
        };
        
        if (char === '#') { tile.type = 'block'; tile.solid = true; }
        else if (char === 'G') { tile.type = 'goal'; }
        else if (char === 'S') {
          tile.type = 'empty';
          this.player.x = c * this.tileSize + (this.tileSize - this.player.width) / 2;
          this.player.y = r * this.tileSize + this.tileSize - this.player.height;
        }
        else if (['^', 'v', '<', '>'].includes(char)) {
          tile.type = 'spike';
          tile.dir = char;
        }
        
        this.tiles[r][c] = tile;
        this.flatTiles.push(tile);
      }
    }
    
    this.callbacks.setScoreRef(idx + 1);
    this.callbacks.setScore(idx + 1);
  }

  handleKeyDown(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = true;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') {
       if (!this.keys.up) this.player.jumpBuffer = this.MAX_JUMP_BUFFER;
       this.keys.up = true;
    }
    if (e.key === 'ArrowDown' || e.key === 's') this.keys.down = true;
  }

  handleKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = false;
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') {
       this.keys.up = false;
       if (this.player.vy < 0 && this.gravity > 0) this.player.vy *= 0.5; // variable jump height
    }
    if (e.key === 'ArrowDown' || e.key === 's') this.keys.down = false;
  }

  handlePointerDown(e) {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      this.touches.push({ id: e.changedTouches[i].identifier, x: e.changedTouches[i].clientX, y: e.changedTouches[i].clientY });
    }
    if (!e.changedTouches) {
      this.touches.push({ id: 'mouse', x: e.clientX, y: e.clientY });
    }
    this.updateMobileControls(true);
  }

  handlePointerMove(e) {
    e.preventDefault();
    if (e.changedTouches) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = this.touches.find(t => t.id === e.changedTouches[i].identifier);
        if (t) { t.x = e.changedTouches[i].clientX; t.y = e.changedTouches[i].clientY; }
      }
    } else {
      const t = this.touches.find(t => t.id === 'mouse');
      if (t) { t.x = e.clientX; t.y = e.clientY; }
    }
    this.updateMobileControls(false);
  }

  handlePointerUp(e) {
    e.preventDefault();
    if (e.changedTouches) {
      for (let i = 0; i < e.changedTouches.length; i++) {
        this.touches = this.touches.filter(t => t.id !== e.changedTouches[i].identifier);
      }
    } else {
      this.touches = this.touches.filter(t => t.id !== 'mouse');
    }
    this.updateMobileControls(false);
  }

  updateMobileControls(isDown) {
    this.keys.left = false;
    this.keys.right = false;
    if (!isDown) this.keys.up = false;
    
    this.touches.forEach(t => {
      if (t.x < this.canvas.width / 3) this.keys.left = true;
      else if (t.x > (this.canvas.width / 3) * 2) this.keys.right = true;
      else if (isDown) {
         if (!this.keys.up) this.player.jumpBuffer = this.MAX_JUMP_BUFFER;
         this.keys.up = true;
      }
    });
  }

  die() {
    this.deaths++;
    if (this.levelDeaths === undefined) this.levelDeaths = 0;
    this.levelDeaths++;
    this.callbacks.playSound('hurt');
    
    // Death particles
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: this.player.x + this.player.width/2,
        y: this.player.y + this.player.height/2,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 1,
        color: this.player.color
      });
    }
    // Hide player visually during delay
    this.player.scaleX = 0; this.player.scaleY = 0;
    
    setTimeout(() => {
      this.loadLevel(this.currentLevelIdx);
    }, 500);
  }

  winLevel() {
    this.callbacks.triggerGsapMilestone(this.player.x, this.player.y);
    this.callbacks.playSound('coin');
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: this.player.x + this.player.width/2,
        y: this.player.y + this.player.height/2,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 1,
        color: '#00ffcc'
      });
    }
    this.levelDeaths = 0;
    this.currentLevelIdx++;
    this.loadLevel(this.currentLevelIdx);
  }

  executeAction(action) {
    if (action.type === 'hide') {
      if (this.tiles[action.y] && this.tiles[action.y][action.x]) {
        let t = this.tiles[action.y][action.x];
        t.type = 'empty';
        t.solid = false;
        t.targetAlpha = 0;
        t.targetScale = 0.5;
      }
    }
    else if (action.type === 'hideAllFloor') {
      for (let c = action.from; c <= action.to; c++) {
        if (this.tiles[11] && this.tiles[11][c]) {
           let t = this.tiles[11][c];
           t.type = 'empty';
           t.solid = false;
           // Falling animation
           t.targetAlpha = 0;
           t.targetY += this.tileSize * 2;
           t.moveSpeed = 0.1;
        }
      }
    }
    else if (action.type === 'showSpike') {
      if (this.tiles[action.y] && this.tiles[action.y][action.x]) {
        let t = this.tiles[action.y][action.x];
        t.type = 'spike';
        t.dir = action.dir;
        t.solid = false;
        t.visualScale = 0;
        t.targetScale = 1;
      }
    }
    else if (action.type === 'move') {
      if (this.tiles[action.y] && this.tiles[action.y][action.x]) {
         let t = this.tiles[action.y][action.x];
         t.targetX = t.x + action.dx * this.tileSize;
         t.targetY = t.y + action.dy * this.tileSize;
         t.moveSpeed = action.speed;
      }
    }
    else if (action.type === 'bounce') {
      this.player.vy = action.strength;
      this.player.grounded = false;
      this.player.scaleX = this.STRETCH.x;
      this.player.scaleY = this.STRETCH.y;
      this.callbacks.playSound('jump');
    }
    else if (action.type === 'invertControls') {
      this.invertedControls = true;
    }
    else if (action.type === 'flipGravity') {
      this.gravity *= -1;
      this.player.jumpPower *= -1;
      this.player.vy = 0;
    }
    else if (action.type === 'disableJump') {
      this.jumpDisabled = true;
    }
    else if (action.type === 'fakeDeath') {
      this.fakeDeath = true;
      this.callbacks.playSound('hurt');
      setTimeout(() => { this.fakeDeath = false; }, 3000);
    }
    else if (action.type === 'teleport') {
      this.player.x = action.tx * this.tileSize;
      this.player.y = action.ty * this.tileSize;
    }
  }

  checkRectOverlap(r1, r2) {
    return r1.x < r2.x + r2.width &&
           r1.x + r1.width > r2.x &&
           r1.y < r2.y + r2.height &&
           r1.y + r1.height > r2.y;
  }

  update() {
    if (this.player.scaleX === 0) return; // Dead

    // Lerp visuals
    this.player.scaleX += (this.NORMAL_SCALE.x - this.player.scaleX) * 0.15;
    this.player.scaleY += (this.NORMAL_SCALE.y - this.player.scaleY) * 0.15;

    // Triggers
    const pCenter = Math.floor((this.player.x + this.player.width/2) / this.tileSize);
    this.triggers.forEach(trig => {
      if (!trig.done && pCenter >= trig.zone.x && pCenter <= trig.zone.x + trig.zone.w) {
        trig.actions.forEach(a => this.executeAction(a));
        if (!trig.continuous) trig.done = true;
      }
    });

    if (!this.invertedControls) {
      if (this.keys.left) this.player.vx = -this.player.speed;
      else if (this.keys.right) this.player.vx = this.player.speed;
      else this.player.vx = 0;
    } else {
      if (this.keys.right) this.player.vx = -this.player.speed;
      else if (this.keys.left) this.player.vx = this.player.speed;
      else this.player.vx = 0;
    }

    this.player.vy += this.gravity;

    // Jump Buffering & Coyote Time
    if (this.player.jumpBuffer > 0) this.player.jumpBuffer--;
    if (this.player.grounded) this.player.coyoteTime = this.MAX_COYOTE_TIME;
    else if (this.player.coyoteTime > 0) this.player.coyoteTime--;

    if (this.player.jumpBuffer > 0 && this.player.coyoteTime > 0 && !this.jumpDisabled) {
      this.player.vy = this.player.jumpPower;
      this.player.grounded = false;
      this.player.coyoteTime = 0;
      this.player.jumpBuffer = 0;
      this.player.scaleX = this.STRETCH.x;
      this.player.scaleY = this.STRETCH.y;
      this.callbacks.playSound('jump');
    }

    // Moving tiles smoothly update
    this.flatTiles.forEach(t => {
       // Lerp Alpha and Scale
       t.visualAlpha += (t.targetAlpha - t.visualAlpha) * 0.2;
       t.visualScale += (t.targetScale - t.visualScale) * 0.2;
       
       // Lerp Position
       if (t.moveSpeed > 0) {
          const dx = t.targetX - t.x;
          const dy = t.targetY - t.y;
          const dist = Math.hypot(dx, dy);
          if (dist > t.moveSpeed * this.tileSize) {
             t.vx = (dx / dist) * t.moveSpeed * this.tileSize;
             t.vy = (dy / dist) * t.moveSpeed * this.tileSize;
          } else {
             t.x = t.targetX; t.y = t.targetY;
             t.vx = 0; t.vy = 0;
          }
       }
       t.x += t.vx; t.y += t.vy;
       t.visualX = t.x; t.visualY = t.y;
    });

    // Physics Engine: Continuous AABB Collision
    this.player.grounded = false;
    
    // X Axis
    this.player.x += this.player.vx;
    for (const t of this.flatTiles) {
      if (t.solid) {
        if (this.checkRectOverlap(this.player, {x: t.x, y: t.y, width: this.tileSize, height: this.tileSize})) {
          if (this.player.vx > 0) this.player.x = t.x - this.player.width;
          else if (this.player.vx < 0) this.player.x = t.x + this.tileSize;
          this.player.vx = 0;
        }
      }
    }

    // Y Axis
    this.player.y += this.player.vy;
    for (const t of this.flatTiles) {
      if (t.solid) {
        if (this.checkRectOverlap(this.player, {x: t.x, y: t.y, width: this.tileSize, height: this.tileSize})) {
          if (this.player.vy > 0) { // Landing
             const wasFallingFast = this.player.vy > this.gravity * 10;
             this.player.y = t.y - this.player.height;
             this.player.grounded = true;
             // Squish only if gravity is normal
             if (this.gravity > 0 && wasFallingFast) {
                this.player.scaleX = this.SQUASH.x;
                this.player.scaleY = this.SQUASH.y;
             }
          } else if (this.player.vy < 0) {
             const wasFallingFast = this.player.vy < this.gravity * 10;
             this.player.y = t.y + this.tileSize;
             if (this.gravity < 0) {
                this.player.grounded = true;
                if (wasFallingFast) {
                   this.player.scaleX = this.SQUASH.x;
                   this.player.scaleY = this.SQUASH.y;
                }
             }
          }
          this.player.vy = 0;
        }
      }
    }

    // Boundaries
    if (this.player.y > this.rows * this.tileSize || this.player.y < -this.tileSize) {
      this.die();
      return;
    }

    // Deadly/Goal
    for (const t of this.flatTiles) {
      if (t.type === 'goal' && t.visualAlpha > 0.5) {
        if (this.checkRectOverlap(this.player, {x: t.x + 4, y: t.y + 4, width: this.tileSize - 8, height: this.tileSize - 8})) {
          this.winLevel();
          return;
        }
      }
      if (t.type === 'spike' && t.visualScale > 0.5) {
        const padding = 6;
        if (this.checkRectOverlap(this.player, {x: t.x + padding, y: t.y + padding, width: this.tileSize - padding*2, height: this.tileSize - padding*2})) {
          this.die();
          return;
        }
      }
    }

    // Particles
    this.particles.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy; p.life -= 0.05;
      if (p.life <= 0) this.particles.splice(i, 1);
    });
  }

  draw() {
    const ctx = this.ctx;
    ctx.save();
    
    // Scale and center the grid to fit the canvas perfectly
    const scaleX = this.canvas.width / (this.cols * this.tileSize);
    const scaleY = this.canvas.height / (this.rows * this.tileSize);
    const scale = Math.min(scaleX, scaleY);
    
    const tx = (this.canvas.width - (this.cols * this.tileSize * scale)) / 2;
    const ty = (this.canvas.height - (this.rows * this.tileSize * scale)) / 2;
    
    ctx.translate(tx, ty);
    ctx.scale(scale, scale);

    // Deep space background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, this.cols * this.tileSize, this.rows * this.tileSize);

    // Darkness effect
    if (this.darkness) {
      const grad = ctx.createRadialGradient(
        this.player.x + this.player.width/2, this.player.y + this.player.height/2, 0,
        this.player.x + this.player.width/2, this.player.y + this.player.height/2, this.tileSize * 3
      );
      grad.addColorStop(0, 'rgba(10,10,15,0)');
      grad.addColorStop(1, 'rgba(10,10,15,1)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.cols * this.tileSize, this.rows * this.tileSize);
    }

    // Draw tiles smoothly
    for (const t of this.flatTiles) {
      if (t.visualAlpha <= 0 || t.type === 'empty') continue;

      ctx.save();
      // Translate to tile center for scaling
      ctx.translate(t.visualX + this.tileSize/2, t.visualY + this.tileSize/2);
      ctx.scale(t.visualScale, t.visualScale);
      ctx.globalAlpha = t.visualAlpha;
      ctx.translate(-this.tileSize/2, -this.tileSize/2);

      if (t.type === 'block') {
         // Modern Minimalist Vector Block
         ctx.fillStyle = '#222533'; // Soft dark blue-grey
         ctx.beginPath();
         ctx.roundRect(0, 0, this.tileSize, this.tileSize, 4);
         ctx.fill();
         // Soft inset
         ctx.strokeStyle = '#333644';
         ctx.lineWidth = 2;
         ctx.stroke();
         // Floor accent line
         ctx.fillStyle = '#444855';
         ctx.fillRect(2, 2, this.tileSize - 4, 3);
      }
      else if (t.type === 'goal') {
         // Modern Segmented Sci-Fi Portal
         const time = Date.now() / 150;
         ctx.translate(this.tileSize/2, this.tileSize/2);
         
         // Outer glowing ring
         ctx.beginPath();
         ctx.arc(0, 0, this.tileSize/2.2, 0, Math.PI*2);
         ctx.strokeStyle = 'rgba(0, 255, 204, 0.3)';
         ctx.lineWidth = 2;
         ctx.stroke();

         // Rotating segmented portal rings
         ctx.save();
         ctx.rotate(time * 0.5);
         ctx.beginPath();
         ctx.arc(0, 0, this.tileSize/2.5, 0.2, Math.PI - 0.2);
         ctx.arc(0, 0, this.tileSize/2.5, Math.PI + 0.2, Math.PI*2 - 0.2);
         ctx.strokeStyle = '#00ffcc';
         ctx.lineWidth = 3;
         ctx.lineCap = 'round';
         ctx.shadowBlur = 15; ctx.shadowColor = '#00ffcc';
         ctx.stroke();
         ctx.restore();
         
         ctx.save();
         ctx.rotate(-time * 0.8);
         ctx.beginPath();
         ctx.arc(0, 0, this.tileSize/3.5, 0.4, Math.PI - 0.4);
         ctx.arc(0, 0, this.tileSize/3.5, Math.PI + 0.4, Math.PI*2 - 0.4);
         ctx.strokeStyle = '#fff';
         ctx.lineWidth = 2;
         ctx.lineCap = 'round';
         ctx.shadowBlur = 10; ctx.shadowColor = '#fff';
         ctx.stroke();
         ctx.restore();

         // Pulsing core
         const pulse = Math.abs(Math.sin(time * 2));
         ctx.beginPath(); 
         ctx.arc(0,0, 4 + pulse * 4, 0, Math.PI*2);
         ctx.fillStyle = '#fff'; 
         ctx.shadowBlur = 20; ctx.shadowColor = '#00ffcc';
         ctx.fill();
      }
      else if (t.type === 'spike') {
         // Minimalist sharp spike
         ctx.fillStyle = '#ff3366';
         ctx.beginPath();
         if (t.dir === '^') {
            ctx.moveTo(0, this.tileSize);
            ctx.lineTo(this.tileSize/2, 4);
            ctx.lineTo(this.tileSize, this.tileSize);
         } else if (t.dir === 'v') {
            ctx.moveTo(0, 0);
            ctx.lineTo(this.tileSize/2, this.tileSize - 4);
            ctx.lineTo(this.tileSize, 0);
         } else if (t.dir === '<') {
            ctx.moveTo(this.tileSize, 0);
            ctx.lineTo(4, this.tileSize/2);
            ctx.lineTo(this.tileSize, this.tileSize);
         } else if (t.dir === '>') {
            ctx.moveTo(0, 0);
            ctx.lineTo(this.tileSize - 4, this.tileSize/2);
            ctx.lineTo(0, this.tileSize);
         }
         ctx.closePath();
         ctx.fill();
      }

      ctx.restore();
    }

    // Draw Player (with Squash and Stretch)
    if (this.player.scaleX > 0) {
       ctx.save();
       // Translate to bottom-center of player for scale origin
       ctx.translate(this.player.x + this.player.width/2, this.player.y + this.player.height);
       ctx.scale(this.player.scaleX, this.player.scaleY);
       
       // Draw Modern Player Cube
       ctx.fillStyle = this.player.color;
       ctx.shadowBlur = 15; ctx.shadowColor = this.player.color;
       ctx.beginPath();
       ctx.roundRect(-this.player.width/2, -this.player.height, this.player.width, this.player.height, 4);
       ctx.fill();
       ctx.shadowBlur = 0;

       // Cute minimalist eyes that look at velocity
       ctx.fillStyle = '#111'; 
       const eyeOffsetX = this.player.vx > 0 ? 3 : this.player.vx < 0 ? -3 : 0;
       const eyeOffsetY = this.player.vy > 0 ? 2 : this.player.vy < 0 ? -2 : 0;
       ctx.fillRect(-this.player.width/2 + 4 + eyeOffsetX, -this.player.height + 6 + eyeOffsetY, 4, 4);
       ctx.fillRect(this.player.width/2 - 8 + eyeOffsetX, -this.player.height + 6 + eyeOffsetY, 4, 4);

       ctx.restore();
    }

    // Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
    });

    if (this.fakeDeath) {
      ctx.fillStyle = 'rgba(10,10,15,0.9)';
      ctx.fillRect(0, 0, this.cols * this.tileSize, this.rows * this.tileSize);
      ctx.fillStyle = '#ff3366';
      ctx.font = 'bold 40px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText("YOU DIED", (this.cols * this.tileSize) / 2, (this.rows * this.tileSize) / 2);
    }

    ctx.restore();

    // UI Overlay - Top Right HUD Badges
    ctx.save();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 15px sans-serif';
    
    // Level Badge
    const lvlText = `LEVEL ${this.currentLevelIdx + 1} / ???`;
    const lvlW = ctx.measureText(lvlText).width + 30;
    const startX = this.canvas.width - 20;
    
    ctx.fillStyle = 'rgba(10, 15, 20, 0.7)';
    ctx.strokeStyle = 'rgba(0, 255, 204, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(startX - lvlW, 20, lvlW, 36, 18); ctx.fill(); ctx.stroke();
    
    ctx.fillStyle = '#00ffcc';
    ctx.shadowBlur = 10; ctx.shadowColor = '#00ffcc';
    ctx.fillText(lvlText, startX - 15, 38);
    ctx.shadowBlur = 0;

    // Deaths Badge
    const deathText = `DEATHS: ${this.deaths}`;
    const deathW = ctx.measureText(deathText).width + 30;
    
    ctx.fillStyle = 'rgba(10, 15, 20, 0.7)';
    ctx.strokeStyle = 'rgba(255, 51, 102, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(startX - deathW, 66, deathW, 36, 18); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#ff3366';
    ctx.shadowBlur = 10; ctx.shadowColor = '#ff3366';
    ctx.fillText(deathText, startX - 15, 84);
    ctx.shadowBlur = 0;
    
    ctx.restore();
    
    if (this.levelDeaths >= 10) {
       ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
       ctx.font = 'italic 14px sans-serif';
       ctx.textAlign = 'center';
       const hints = [
         "HINT: NOT EVERYTHING IS AS IT SEEMS...",
         "HINT: SOMETIMES THE OBVIOUS PATH IS A TRAP...",
         "HINT: LOOK FOR INVISIBLE CLUES...",
         "HINT: TRUST YOUR INSTINCTS, NOT YOUR EYES..."
       ];
       const hintIdx = this.currentLevelIdx % hints.length;
       ctx.fillText(hints[hintIdx], this.canvas.width / 2, 40);
    }
    
    if (window.innerWidth <= 768) {
       ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
       ctx.fillRect(0, this.canvas.height - 100, this.canvas.width / 3, 100);
       ctx.fillRect(this.canvas.width / 3, this.canvas.height - 100, this.canvas.width / 3, 100);
       ctx.fillRect((this.canvas.width / 3) * 2, this.canvas.height - 100, this.canvas.width / 3, 100);

       ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
       ctx.font = 'bold 20px sans-serif';
       ctx.textAlign = 'center';
       ctx.fillText("<", this.canvas.width / 6, this.canvas.height - 40);
       ctx.fillText("JUMP", this.canvas.width / 2, this.canvas.height - 40);
       ctx.fillText(">", (this.canvas.width / 6) * 5, this.canvas.height - 40);
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }
}
