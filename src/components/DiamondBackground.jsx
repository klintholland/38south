import React, { useEffect, useRef } from "react";

function usePrefersReducedMotion() {
    const [prefers, setPrefers] = React.useState(false);
    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        const onChange = () => setPrefers(!!mq.matches);
        onChange();
        mq.addEventListener?.("change", onChange);
        return () => mq.removeEventListener?.("change", onChange);
    }, []);
    return prefers;
}

/**
 * 45° diamond background with alternating row motion along the rotated X axis.
 * - Keeps constant row spacing (no collisions).
 * - Uses robust coverage calc so the canvas fills the viewport (incl. corners).
 * - Seamless modulo loop.
 */
export default function DiamondBackground({
    diamondSize = 20,           // tip-to-tip size in px
    gap = 24,                   // edge-to-edge gap; center spacing = diamondSize + gap
    speed = 10,                 // px/sec along rotated X axis (U)
    diamondColor = "#121212",
    accentColor = "#ff7a00",
    highlightCount = 6,
    highlightEveryMs = 10000,
    opacity = 1.0,
    targetFps = 0,              // 0 = uncapped; set 30/45 to cap on mobile
    direction = "NE_SW",        // "NE_SW" (even ↗︎ / odd ↙︎) or "SW_NE" to flip
}) {
    const canvasRef = useRef(null);
    const rafRef = useRef(0);

    const highlightsRef = useRef(new Set());
    const lastShuffleRef = useRef(0);
    const colsVisibleRef = useRef(0);
    const rowsVisibleRef = useRef(0);

    const reduced = usePrefersReducedMotion();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });

        // Geometry
        const spacing = diamondSize + gap; // center-to-center (square lattice)
        const rowStride = spacing;
        const half = diamondSize / 2;

        // Prebuild diamond path (square rotated 45°)
        const diamondPath = new Path2D();
        diamondPath.moveTo(0, -half);
        diamondPath.lineTo(half, 0);
        diamondPath.lineTo(0, half);
        diamondPath.lineTo(-half, 0);
        diamondPath.closePath();

        // Rotation basis (45°)
        const theta = Math.PI / 4;
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);

        // Resize + coverage calculation
        let w = 0, h = 0, dpr = 1;

        function reshuffleHighlights(cols, rows) {
            const picks = new Set();
            const max = Math.min(highlightCount, cols * rows);
            let attempts = 0;
            while (picks.size < max && attempts < cols * rows * 3) {
                const r = Math.floor(Math.random() * rows);
                const c = Math.floor(Math.random() * cols);
                picks.add(`${r}:${c}`);
                attempts++;
            }
            highlightsRef.current = picks;
        }

        function computeCoverageCounts(width, height) {
            // Project the 4 corners into (U,V) using the inverse of:
            // x = u*cos - v*sin; y = u*sin + v*cos
            // => u = x*cos + y*sin; v = -x*sin + y*cos
            const corners = [
                [0, 0],
                [width, 0],
                [0, height],
                [width, height],
            ];

            let umin = Infinity, umax = -Infinity, vmin = Infinity, vmax = -Infinity;
            for (const [x, y] of corners) {
                const u = x * cos + y * sin;
                const v = -x * sin + y * cos;
                if (u < umin) umin = u;
                if (u > umax) umax = u;
                if (v < vmin) vmin = v;
                if (v > vmax) vmax = v;
            }

            // Padding: full U shift (spacing), + stagger (spacing/2), + half diamond, + tiny safety
            const uPad = spacing * 1.5 + half + 2;
            // No motion along V; just half diamond + tiny safety
            const vPad = half + 2;

            const cols = Math.ceil(((umax - umin) + 2 * uPad) / spacing) + 2;
            const rows = Math.ceil(((vmax - vmin) + 2 * vPad) / rowStride) + 2;

            colsVisibleRef.current = cols;
            rowsVisibleRef.current = rows;

            // Seed highlights with valid indices
            const picks = new Set();
            const max = Math.min(highlightCount, cols * rows);
            let attempts = 0;
            while (picks.size < max && attempts < cols * rows * 3) {
                const r = Math.floor(Math.random() * rows);
                const c = Math.floor(Math.random() * cols);
                picks.add(`${r}:${c}`);
                attempts++;
            }
            highlightsRef.current = picks;
        }

        function reshuffleHighlightsVisible(cols, rows, off, w, h, evenSign, oddSign) {
            const candidates = [];
            // We mirror the same drawing math to test visibility quickly.
            const colStart = -Math.ceil(cols / 2) - 1;
            const colEnd = Math.ceil(cols / 2) + 1;
            const rowStart = -Math.ceil(rows / 2) - 1;
            const rowEnd = Math.ceil(rows / 2) + 1;

            for (let r = rowStart; r < rowEnd; r++) {
                const isEven = (r & 1) === 0;
                const vRow = r * rowStride + rowStride * 0.5;
                const stagger = isEven ? 0 : spacing * 0.5;
                const uShift = (isEven ? evenSign : oddSign) * off;

                for (let c = colStart; c < colEnd; c++) {
                    const uCol = c * spacing + spacing * 0.5;
                    const u = uCol + stagger + uShift;

                    const x = u * cos - vRow * sin;
                    const y = u * sin + vRow * cos;

                    // Visible with a small pad so near-edge highlights don't flicker off
                    const pad = half;
                    if (x > -pad && x < w + pad && y > -pad && y < h + pad) {
                        candidates.push(`${r - rowStart}:${c - colStart}`);
                    }
                }
            }

            // Pick up to highlightCount distinct visible keys
            const picks = new Set();
            for (let i = 0; i < candidates.length && picks.size < highlightCount; i++) {
                const j = Math.floor(Math.random() * candidates.length);
                picks.add(candidates[j]);
            }
            highlightsRef.current = picks;
        }

        function resize() {
            dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
            const parent = canvas.parentElement || canvas;
            const { clientWidth, clientHeight } = parent;

            if (clientWidth !== w || clientHeight !== h) {
                w = clientWidth;
                h = clientHeight;
                canvas.width = Math.ceil(w * dpr);
                canvas.height = Math.ceil(h * dpr);
                canvas.style.width = `${w}px`;
                canvas.style.height = `${h}px`;
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

                // Recompute how many cells we need to draw to fully cover viewport
                computeCoverageCounts(w, h);
            }
        }

        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas.parentElement || canvas);

        // Animation state
        let last = performance.now();
        let acc = 0;
        let off = 0; // even rows move +off along U, odd rows -off (or flipped via direction)

        const evenSign = direction === "NE_SW" ? +1 : -1;
        const oddSign = -evenSign;

        function drawDiamondScreen(x, y, highlighted) {
            ctx.fillStyle = highlighted ? accentColor : diamondColor;
            ctx.save();
            ctx.translate(x, y);
            ctx.fill(diamondPath);
            ctx.restore();
        }

        function frame(now) {
            let dt = Math.min(64, now - last) / 1000;
            last = now;

            // FPS cap (optional)
            if (targetFps > 0) {
                acc += dt;
                const step = 1 / targetFps;
                if (acc < step) {
                    rafRef.current = requestAnimationFrame(frame);
                    return;
                }
                dt = step;
                acc = acc % step || 0;
            }

            ctx.clearRect(0, 0, w, h);
            ctx.globalAlpha = opacity;

            const v = reduced ? 0 : speed;
            off = (off + v * dt) % spacing; // seamless wrap along U

            const cols = colsVisibleRef.current || 0;
            const rows = rowsVisibleRef.current || 0;

            if (now - lastShuffleRef.current > highlightEveryMs) {
              reshuffleHighlightsVisible(
                cols, rows, off, w, h, evenSign, oddSign
              );
              lastShuffleRef.current = now;
            }

            // We’ll draw a centered grid around (0,0) in (U,V) space to ensure
            // we cover both parities (stagger) and the full rotated rectangle.
            const colStart = -Math.ceil(cols / 2) - 1;
            const colEnd = Math.ceil(cols / 2) + 1;
            const rowStart = -Math.ceil(rows / 2) - 1;
            const rowEnd = Math.ceil(rows / 2) + 1;

            for (let r = rowStart; r < rowEnd; r++) {
                const isEven = (r & 1) === 0;
                const vRow = r * rowStride + rowStride * 0.5;
                const stagger = isEven ? 0 : spacing * 0.5;
                const uShift = (isEven ? evenSign : oddSign) * off;

                for (let c = colStart; c < colEnd; c++) {
                    const uCol = c * spacing + spacing * 0.5;
                    const u = uCol + stagger + uShift;

                    // Rotate (u,v) -> (x,y)
                    const x = u * cos - vRow * sin;
                    const y = u * sin + vRow * cos;

                    if (x < -diamondSize || x > w + diamondSize || y < -diamondSize || y > h + diamondSize) continue;

                    // Convert to a small positive-ish index for the highlight set
                    const key = `${r - rowStart}:${c - colStart}`;
                    const highlighted = highlightsRef.current.has(key);

                    drawDiamondScreen(x, y, highlighted);
                }
            }

            rafRef.current = requestAnimationFrame(frame);
        }

        // Start
        rafRef.current = requestAnimationFrame(frame);

        return () => {
            cancelAnimationFrame(rafRef.current);
            ro.disconnect();
        };
    }, [
        diamondSize, gap, speed, diamondColor, accentColor,
        highlightCount, highlightEveryMs, opacity, targetFps, direction, reduced
    ]);

    return (
        <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden" }}>
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    userSelect: "none",
                    touchAction: "none",
                    willChange: "transform"
                }}
            />
        </div>
    );
}
