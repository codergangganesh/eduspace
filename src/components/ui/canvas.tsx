/**
 * Modernized Canvas Animation Component
 * Refactored from ES5 prototype logic to ES6 classes with TypeScript safety.
 */

interface OscillatorOptions {
    phase?: number;
    offset?: number;
    frequency?: number;
    amplitude?: number;
}

class Oscillator {
    public phase: number;
    public offset: number;
    public frequency: number;
    public amplitude: number;
    private _value: number = 0;

    constructor(options: OscillatorOptions = {}) {
        this.phase = options.phase || 0;
        this.offset = options.offset || 0;
        this.frequency = options.frequency || 0.001;
        this.amplitude = options.amplitude || 1;
    }

    update(): number {
        this.phase += this.frequency;
        this._value = this.offset + Math.sin(this.phase) * this.amplitude;
        return this._value;
    }

    get value(): number {
        return this._value;
    }
}

interface Node {
    x: number;
    y: number;
    vx: number;
    vy: number;
}

interface LineOptions {
    spring: number;
}

class Line {
    public spring: number;
    public friction: number;
    public nodes: Node[];

    constructor(options: LineOptions) {
        this.spring = options.spring + 0.1 * Math.random() - 0.05;
        this.friction = E.friction + 0.01 * Math.random() - 0.005;
        this.nodes = [];

        for (let i = 0; i < E.size; i++) {
            this.nodes.push({
                x: pos.x,
                y: pos.y,
                vx: 0,
                vy: 0
            });
        }
    }

    update() {
        let spring = this.spring;
        const head = this.nodes[0];

        head.vx += (pos.x - head.x) * spring;
        head.vy += (pos.y - head.y) * spring;

        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];

            if (i > 0) {
                const prev = this.nodes[i - 1];
                node.vx += (prev.x - node.x) * spring;
                node.vy += (prev.y - node.y) * spring;
                node.vx += prev.vx * E.dampening;
                node.vy += prev.vy * E.dampening;
            }

            node.vx *= this.friction;
            node.vy *= this.friction;
            node.x += node.vx;
            node.y += node.vy;

            spring *= E.tension;
        }
    }

    draw(context: CanvasRenderingContext2D) {
        if (this.nodes.length < 2) return;

        let n = this.nodes[0].x;
        let i = this.nodes[0].y;

        context.beginPath();
        context.moveTo(n, i);

        let a: number;
        for (a = 1; a < this.nodes.length - 2; a++) {
            const e = this.nodes[a];
            const t = this.nodes[a + 1];
            n = 0.5 * (e.x + t.x);
            i = 0.5 * (e.y + t.y);
            context.quadraticCurveTo(e.x, e.y, n, i);
        }

        const e = this.nodes[a];
        const t = this.nodes[a + 1];
        context.quadraticCurveTo(e.x, e.y, t.x, t.y);
        context.stroke();
        context.closePath();
    }
}

// Global state variables
let ctx: CanvasRenderingContext2D | null = null;
let oscillator: Oscillator | null = null;
const pos = { x: 0, y: 0 };
let lines: Line[] = [];
let isRunning = false;

const E = {
    debug: true,
    friction: 0.5,
    trails: 20,
    size: 30,
    dampening: 0.025,
    tension: 0.99,
};

function onMousemove(e: MouseEvent | TouchEvent) {
    function initLines() {
        lines = [];
        for (let i = 0; i < E.trails; i++) {
            lines.push(new Line({ spring: 0.45 + (i / E.trails) * 0.025 }));
        }
    }

    function updatePos(e: MouseEvent | TouchEvent) {
        if ('touches' in e) {
            pos.x = e.touches[0].pageX;
            pos.y = e.touches[0].pageY;
        } else {
            pos.x = e.clientX;
            pos.y = e.clientY;
        }
    }

    function handleMove(e: MouseEvent | TouchEvent) {
        updatePos(e);
        // e.preventDefault(); // Might interfere with scrolling if not careful
    }

    function handleTouchStart(e: TouchEvent) {
        if (e.touches.length === 1) {
            updatePos(e);
        }
    }

    document.removeEventListener("mousemove", onMousemove);
    document.removeEventListener("touchstart", onMousemove);

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("touchmove", handleMove);
    document.addEventListener("touchstart", handleTouchStart);

    updatePos(e);
    initLines();
    render();
}

function render() {
    if (ctx && isRunning) {
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.globalCompositeOperation = "lighter";

        if (oscillator) {
            ctx.strokeStyle = `hsla(${Math.round(oscillator.update())},100%,50%,0.025)`;
        }

        ctx.lineWidth = 10;

        for (let i = 0; i < E.trails; i++) {
            const line = lines[i];
            if (line) {
                line.update();
                line.draw(ctx);
            }
        }

        window.requestAnimationFrame(render);
    }
}

function resizeCanvas() {
    if (ctx) {
        ctx.canvas.width = window.innerWidth - 20;
        ctx.canvas.height = window.innerHeight;
    }
}

export const renderCanvas = function () {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    if (!canvas) return;

    ctx = canvas.getContext("2d");
    if (!ctx) return;

    isRunning = true;

    // Optimize for mobile
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
        E.trails = 8;
        E.size = 15;
    } else {
        E.trails = 20;
        E.size = 30;
    }

    oscillator = new Oscillator({
        phase: Math.random() * 2 * Math.PI,
        amplitude: 85,
        frequency: 0.0015,
        offset: 285,
    });

    let throttleTimeout: number | null = null;
    const throttledMouseMove = (e: MouseEvent) => {
        if (!throttleTimeout) {
            throttleTimeout = window.setTimeout(() => {
                onMousemove(e);
                throttleTimeout = null;
            }, 16);
        }
    };

    document.addEventListener("mousemove", throttledMouseMove, { passive: true });
    document.addEventListener("touchstart", onMousemove as any, { passive: true });
    document.body.addEventListener("orientationchange", resizeCanvas);
    window.addEventListener("resize", resizeCanvas, { passive: true });

    window.addEventListener("focus", () => {
        if (!isRunning) {
            isRunning = true;
            render();
        }
    });

    window.addEventListener("blur", () => {
        isRunning = false;
    });

    resizeCanvas();
};
