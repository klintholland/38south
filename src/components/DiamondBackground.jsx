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

    const highlightsRef = useRef(new Map()); // Store diamond info: key -> {row, col, startOffset}
    const lastSpawnRef = useRef(0);
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

        // Rotation basis - you can modify this angle:
        // Math.PI / 4 = 45° (original)
        // Math.PI / 4 + Math.PI / 2 = 135° (90° rotation)
        // -Math.PI / 4 = -45° (horizontal flip)
        // Math.PI / 4 + Math.PI = 225° (180° rotation)
        const theta = Math.PI / 4 + Math.PI / 2; // 90° rotation
        const cos = Math.cos(theta);
        const sin = Math.sin(theta);

        // Resize + coverage calculation
        let w = 0, h = 0, dpr = 1;

        function computeCoverageCounts(width, height) {
            // Much simpler approach: calculate how many diamonds we need in each direction
            // Add substantial padding to ensure full coverage including rotation and animation
            const diagonal = Math.sqrt(width * width + height * height);
            const padding = spacing * 3; // Extra padding for animation and rotation
            
            // Calculate needed diamonds in each direction
            const cols = Math.ceil((diagonal + padding * 2) / spacing) + 10;
            const rows = Math.ceil((diagonal + padding * 2) / spacing) + 10;

            colsVisibleRef.current = cols;
            rowsVisibleRef.current = rows;

            // Seed highlights - start with a few diamonds at screen edge
            const highlights = new Map();
            highlightsRef.current = highlights;
        }

        function manageHighlights(cols, rows, currentOffset, w, h, evenSign, oddSign, now) {
            const highlights = highlightsRef.current;
            const screenWidth = w;
            const screenHeight = h;
            
            // Calculate how far a diamond needs to travel to cross the screen
            // Since diamonds move horizontally in the rotated space, we need the diagonal distance
            const maxDistance = Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight);
            const transitDistance = maxDistance + spacing * 2; // Add buffer
            
            // Remove highlights that have traveled too far
            for (const [key, data] of highlights.entries()) {
                const offsetDiff = Math.abs(currentOffset - data.startOffset);
                if (offsetDiff > transitDistance) {
                    highlights.delete(key);
                }
            }
            
            // Add new highlights periodically - spawn them at screen edge
            if (now - lastSpawnRef.current > highlightEveryMs) {
                const numToSpawn = Math.min(highlightCount - highlights.size, 2);
                
                for (let i = 0; i < numToSpawn; i++) {
                    // Pick a random row
                    const row = Math.floor(Math.random() * rows) - Math.floor(rows / 2);
                    
                    // Calculate which column would place the diamond at the screen edge
                    const isEven = (row & 1) === 0;
                    const vRow = row * rowStride + rowStride * 0.5;
                    const stagger = isEven ? 0 : spacing * 0.5;
                    const uShift = (isEven ? evenSign : oddSign) * currentOffset;
                    
                    // Find column that puts diamond at left edge of screen
                    const targetX = -diamondSize; // Just off left edge
                    const targetY = screenHeight / 2; // Middle of screen
                    
                    // Work backwards from screen position to find the right column
                    // x = u * cos - vRow * sin + centerX
                    // u = (x - centerX + vRow * sin) / cos
                    const u = (targetX - screenWidth/2 + vRow * sin) / cos;
                    const col = Math.round((u - stagger - uShift - spacing * 0.5) / spacing);
                    
                    const key = `${row}:${col}`;
                    if (!highlights.has(key)) {
                        highlights.set(key, {
                            row: row,
                            col: col,
                            startOffset: currentOffset
                        });
                    }
                }
                
                lastSpawnRef.current = now;
            }
        }

        function resize() {
            // Get device pixel ratio but cap it to avoid performance issues
            dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
            
            // Use window dimensions for full screen coverage
            const width = window.innerWidth;
            const height = window.innerHeight;

            if (width !== w || height !== h) {
                w = width;
                h = height;
                
                // Set canvas size
                canvas.width = Math.ceil(w * dpr);
                canvas.height = Math.ceil(h * dpr);
                canvas.style.width = `${w}px`;
                canvas.style.height = `${h}px`;
                
                // Scale context for device pixel ratio
                ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

                // Recompute how many cells we need to draw to fully cover viewport
                computeCoverageCounts(w, h);
            }
        }

        // Initial resize
        resize();
        
        // Listen for window resize
        const handleResize = () => resize();
        window.addEventListener('resize', handleResize);

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

            if (now - lastSpawnRef.current > highlightEveryMs) {
                manageHighlights(
                    cols, rows, off, w, h, evenSign, oddSign, now
                );
            }

            // Draw a much larger grid centered around the screen center
            const centerX = w / 2;
            const centerY = h / 2;
            
            // Start from much further out to ensure complete coverage
            const colStart = -Math.ceil(cols / 2) - 5;
            const colEnd = Math.ceil(cols / 2) + 5;
            const rowStart = -Math.ceil(rows / 2) - 5;
            const rowEnd = Math.ceil(rows / 2) + 5;

            for (let r = rowStart; r < rowEnd; r++) {
                const isEven = (r & 1) === 0;
                const vRow = r * rowStride + rowStride * 0.5;
                const stagger = isEven ? 0 : spacing * 0.5;
                const uShift = (isEven ? evenSign : oddSign) * off;

                for (let c = colStart; c < colEnd; c++) {
                    const uCol = c * spacing + spacing * 0.5;
                    const u = uCol + stagger + uShift;

                    // Rotate (u,v) -> (x,y) and translate to screen center
                    const x = u * cos - vRow * sin + centerX;
                    const y = u * sin + vRow * cos + centerY;

                    // Draw all diamonds without culling to ensure full coverage
                    // Check if this diamond should be highlighted
                    const absoluteKey = `${r}:${c}`;
                    const highlighted = highlightsRef.current.has(absoluteKey);

                    drawDiamondScreen(x, y, highlighted);
                }
            }

            rafRef.current = requestAnimationFrame(frame);
        }

        // Start animation
        rafRef.current = requestAnimationFrame(frame);

        return () => {
            cancelAnimationFrame(rafRef.current);
            window.removeEventListener('resize', handleResize);
        };
    }, [
        diamondSize, gap, speed, diamondColor, accentColor,
        highlightCount, highlightEveryMs, opacity, targetFps, direction, reduced
    ]);

    return (
        <div 
            aria-hidden="true" 
            style={{ 
                position: "fixed", 
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: 0, 
                overflow: "hidden",
                pointerEvents: "none"
            }}
        >
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