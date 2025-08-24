/**
 * Matter.js Physics Engine Integration
 * Enhanced with modern JavaScript practices and error handling
 */

(function() {
    'use strict';
    
    // Configuration object
    const CONFIG = {
        PARTICLE_COUNT: 60,
        ATTRACTOR_STRENGTH: 1e-6,
        GRAVITY_SCALE: 0.1,
        MOUSE_SMOOTHING: 0.12,
        RESIZE_DEBOUNCE: 250
    };
    
    // State management
    let matterInstance = null;
    let isInitialized = false;
    
    /**
     * Get canvas element with error handling
     */
    function getCanvas() {
        const canvas = document.querySelector("#wrapper-canvas");
        if (!canvas) {
            console.warn("Canvas element not found");
            return null;
        }
        return canvas;
    }
    
    /**
     * Get window dimensions with fallbacks
     */
    function getWindowDimensions() {
        return {
            width: window.innerWidth || document.documentElement.clientWidth || 800,
            height: window.innerHeight || document.documentElement.clientHeight || 600
        };
    }
    
    /**
     * Create particle with consistent styling
     */
    function createParticle(x, y, size, sides, mass, friction, frictionAir, fillStyle, strokeStyle, lineWidth) {
        try {
            const body = Matter.Bodies.polygon(x, y, sides, size, {
                mass: mass,
                friction: friction,
                frictionAir: frictionAir,
                angle: Math.round(Math.random() * 360),
                render: {
                    fillStyle: fillStyle,
                    strokeStyle: strokeStyle,
                    lineWidth: lineWidth
                }
            });
            return body;
        } catch (error) {
            console.warn("Failed to create particle:", error);
            return null;
        }
    }
    
    /**
     * Create circle particle
     */
    function createCircleParticle(x, y, radius, mass, friction, frictionAir, fillStyle, strokeStyle, lineWidth) {
        try {
            const body = Matter.Bodies.circle(x, y, radius, {
                mass: mass,
                friction: friction,
                frictionAir: frictionAir,
                render: {
                    fillStyle: fillStyle,
                    strokeStyle: strokeStyle,
                    lineWidth: lineWidth
                }
            });
            return body;
        } catch (error) {
            console.warn("Failed to create circle particle:", error);
            return null;
        }
    }
    
    /**
     * Initialize Matter.js physics engine
     */
    function runMatter() {
        try {
            // Check if Matter.js is available
            if (typeof Matter === 'undefined') {
                console.error("Matter.js library not loaded");
                return null;
            }
            
            // Use Matter.js plugins
            Matter.use("matter-attractors");
            Matter.use("matter-wrap");
            
            // Module aliases
            const { Engine, Events, Runner, Render, World, Body, Mouse, Common, Bodies } = Matter;
            
            // Get canvas
            const canvas = getCanvas();
            if (!canvas) return null;
            
            // Get dimensions
            const dimensions = getWindowDimensions();
            
            // Create engine
            const engine = Engine.create();
            engine.world.gravity.y = 0;
            engine.world.gravity.x = 0;
            engine.world.gravity.scale = CONFIG.GRAVITY_SCALE;
            
            // Create renderer
            const render = Render.create({
                element: canvas,
                engine: engine,
                options: {
                    showVelocity: false,
                    width: dimensions.width,
                    height: dimensions.height,
                    wireframes: false,
                    background: "transparent",
                },
            });
            
            // Create runner
            const runner = Runner.create();
            
            // Create world
            const world = engine.world;
            world.gravity.scale = 0;
            
            // Create attractive body
            const attractiveBody = Bodies.circle(
                render.options.width / 2,
                render.options.height / 2,
                Math.max(dimensions.width / 25, dimensions.height / 25) / 2,
                {
                    render: {
                        fillStyle: `#000`,
                        strokeStyle: `#000`,
                        lineWidth: 0,
                    },
                    isStatic: true,
                    plugin: {
                        attractors: [
                            function (bodyA, bodyB) {
                                return {
                                    x: (bodyA.position.x - bodyB.position.x) * CONFIG.ATTRACTOR_STRENGTH,
                                    y: (bodyA.position.y - bodyB.position.y) * CONFIG.ATTRACTOR_STRENGTH,
                                };
                            },
                        ],
                    },
                }
            );
            
            World.add(world, attractiveBody);
            
            // Add particles
            for (let i = 0; i < CONFIG.PARTICLE_COUNT; i += 1) {
                const x = Common.random(0, render.options.width);
                const y = Common.random(0, render.options.height);
                const size = Common.random() > 0.6 ? Common.random(10, 80) : Common.random(4, 60);
                const polygonSides = Common.random(3, 6);
                const randomValue = Common.random(0, 1);
                
                // Create polygon particle
                const polygonBody = createParticle(
                    x, y, size, polygonSides, size / 20, 0, 0.02,
                    "#222222", "#000000", 2
                );
                if (polygonBody) World.add(world, polygonBody);
                
                // Create small circle
                const smallCircle = createCircleParticle(
                    x, y, Common.random(2, 8), 0.1, 0, 0.01,
                    randomValue > 0.3 ? `#27292d` : `#444444`, "#000000", 2
                );
                if (smallCircle) World.add(world, smallCircle);
                
                // Create medium circle
                const mediumCircle = createCircleParticle(
                    x, y, Common.random(2, 20), 6, 0, 0,
                    randomValue > 0.3 ? `#334443` : `#222222`, "#111111", 4
                );
                if (mediumCircle) World.add(world, mediumCircle);
                
                // Create large circle
                const largeCircle = createCircleParticle(
                    x, y, Common.random(2, 30), 0.2, 0.6, 0.8,
                    `#191919`, "#111111", 3
                );
                if (largeCircle) World.add(world, largeCircle);
            }
            
            // Add mouse control
            const mouse = Mouse.create(render.canvas);
            
            Events.on(engine, "afterUpdate", function () {
                if (!mouse.position.x) return;
                
                // Smoothly move the attractor body towards the mouse
                Body.translate(attractiveBody, {
                    x: (mouse.position.x - attractiveBody.position.x) * CONFIG.MOUSE_SMOOTHING,
                    y: (mouse.position.y - attractiveBody.position.y) * CONFIG.MOUSE_SMOOTHING,
                });
            });
            
            // Start the engine
            Runner.run(runner, engine);
            Render.run(render);
            
            // Return control interface
            return {
                engine: engine,
                runner: runner,
                render: render,
                canvas: render.canvas,
                stop: function () {
                    Matter.Render.stop(render);
                    Matter.Runner.stop(runner);
                },
                play: function () {
                    Matter.Runner.run(runner, engine);
                    Matter.Render.run(render);
                },
            };
            
        } catch (error) {
            console.error("Failed to initialize Matter.js:", error);
            return null;
        }
    }
    
    /**
     * Debounce function for performance optimization
     */
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Handle window resize with proper error handling
     */
    function handleResize() {
        try {
            if (!matterInstance || !matterInstance.render) return;
            
            const dimensions = getWindowDimensions();
            
            // Update canvas dimensions
            matterInstance.render.canvas.width = dimensions.width;
            matterInstance.render.canvas.height = dimensions.height;
            
            return dimensions;
        } catch (error) {
            console.warn("Failed to handle resize:", error);
        }
    }
    
    /**
     * Initialize the physics engine
     */
    function initialize() {
        if (isInitialized) return;
        
        try {
            matterInstance = runMatter();
            if (matterInstance) {
                isInitialized = true;
                
                // Set up resize handler
                const debouncedResize = debounce(handleResize, CONFIG.RESIZE_DEBOUNCE);
                window.addEventListener('resize', debouncedResize);
                
                // Initial size setup
                handleResize();
                
                console.log("Matter.js physics engine initialized successfully");
            }
        } catch (error) {
            console.error("Failed to initialize physics engine:", error);
        }
    }
    
    /**
     * Public API
     */
    window.MatterPhysics = {
        initialize: initialize,
        getInstance: () => matterInstance,
        isInitialized: () => isInitialized
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
})();
