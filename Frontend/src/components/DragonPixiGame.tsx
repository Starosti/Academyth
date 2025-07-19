import React, { useRef, useEffect, useState, useCallback } from "react";
import { Application, extend, useApplication, useTick } from "@pixi/react";
import * as PIXI from "pixi.js";
import dragonSpriteImage from "@/assets/dragon-sprite.png";
import dragonAttackingImage from "@/assets/dragon-attacking.png";
import castleBgImage from "@/assets/castle-bg.png";

// Extend PIXI components for use in React
extend({
  Container: PIXI.Container,
  Sprite: PIXI.Sprite,
  Graphics: PIXI.Graphics,
});

interface DragonPixiGameProps {
  dragonHP: number;
  onDamage: boolean;
  onHeal: boolean;
  onAttack: boolean;
}

// Dragon component that handles animations
const DragonSprite: React.FC<{
  dragonHP: number;
  onDamage: boolean;
  onHeal: boolean;
  onAttack: boolean;
  onAttackPeak: (isPeak: boolean) => void;
}> = ({ dragonHP, onDamage, onHeal, onAttack, onAttackPeak }) => {
  const app = useApplication();
  const dragonRef = useRef<PIXI.Sprite | null>(null);
  const [position, setPosition] = useState({ x: 325, y: 275 });
  const [scale, setScale] = useState({ x: 1, y: 1 });
  const [tint, setTint] = useState(0xffffff);
  const [rotation, setRotation] = useState(0);
  const [dragonTexture, setDragonTexture] = useState<PIXI.Texture | null>(null);
  const [dragonAttackingTexture, setDragonAttackingTexture] =
    useState<PIXI.Texture | null>(null);
  const [currentTexture, setCurrentTexture] = useState<PIXI.Texture | null>(
    null
  );

  // Load dragon sprite textures
  useEffect(() => {
    const loadTextures = async () => {
      try {
        const [normalTexture, attackingTexture] = await Promise.all([
          PIXI.Assets.load(dragonSpriteImage),
          PIXI.Assets.load(dragonAttackingImage),
        ]);
        setDragonTexture(normalTexture);
        setDragonAttackingTexture(attackingTexture);
        setCurrentTexture(normalTexture); // Start with normal texture
      } catch (error) {
        console.error("Failed to load dragon sprites:", error);
        // Fallback to a simple colored rectangle
        const graphics = new PIXI.Graphics();
        graphics.setFillStyle({ color: 0x8b4513 });
        graphics.rect(0, 0, 100, 100);
        graphics.fill();
        const fallbackTexture = app.app.renderer.generateTexture(graphics);
        setDragonTexture(fallbackTexture);
        setDragonAttackingTexture(fallbackTexture);
        setCurrentTexture(fallbackTexture);
      }
    };

    loadTextures();
  }, [app]);

  // Idle animation using useTick
  useTick((delta) => {
    const time = Date.now() * 0.002;
    // Only do idle animation if not attacking or taking damage
    if (!onDamage && !onAttack) {
      const targetX = 325; // Center horizontally
      const targetY = 275 + Math.sin(time) * 10; // Gentle floating motion
      setPosition((prev) => ({
        x: prev.x + (targetX - prev.x) * 0.05 * delta.deltaTime, // Smooth interpolation
        y: prev.y + (targetY - prev.y) * 0.05 * delta.deltaTime, // Smooth interpolation
      }));
    }
    setRotation(Math.sin(time * 0.5) * 0.03); // Slight swaying, reduced for sprite
  });

  // Damage animation effect
  useEffect(() => {
    if (onDamage) {
      const totalFrames = 30;
      const scaleDownFrames = Math.floor(totalFrames * 0.15);
      const scaleUpFrames = totalFrames - scaleDownFrames;
      const minScale = 0.7; // Minimum scale during damage
      const frameInterval = 12; // ~60fps

      // Ease in function (slow start, fast end)
      const easeIn = (t: number) => {
        return t * t * t;
      };

      // Ease out function (fast start, slow end)
      const easeOut = (t: number) => {
        return 1 - Math.pow(1 - t, 3);
      };

      let frame = 0;
      setTint(0xff4444); // Red tint for damage

      const damageInterval = setInterval(() => {
        if (frame < totalFrames) {
          if (frame < scaleDownFrames) {
            // Scale down phase (ease in)
            const progress = frame / scaleDownFrames;
            const easedProgress = easeIn(progress);
            const currentScale = 1 - (1 - minScale) * easedProgress;

            setScale({
              x: currentScale,
              y: currentScale,
            });
          } else {
            // Scale up phase (ease out)
            const progress = (frame - scaleDownFrames) / scaleUpFrames;
            const easedProgress = easeOut(progress);
            const currentScale = minScale + (1 - minScale) * easedProgress;

            setScale({
              x: currentScale,
              y: currentScale,
            });
          }
          frame++;
        } else {
          clearInterval(damageInterval);
          setScale({ x: 1, y: 1 });
          setTint(0xffffff); // Reset tint
        }
      }, frameInterval);

      return () => {
        clearInterval(damageInterval);
        setScale({ x: 1, y: 1 });
        setTint(0xffffff); // Reset tint
      };
    }
  }, [onDamage]);

  // Heal animation effect
  useEffect(() => {
    if (onHeal) {
      let pulseCount = 0;
      const pulseInterval = setInterval(() => {
        if (pulseCount < 6) {
          setScale({
            x: 1 + Math.sin(pulseCount) * 0.1, // Reduced pulse intensity
            y: 1 + Math.sin(pulseCount) * 0.1,
          });
          setTint(0x44ff44); // Green tint for healing
          pulseCount++;
        } else {
          clearInterval(pulseInterval);
          setScale({ x: 1, y: 1 });
          setTint(0xffffff); // Reset tint
        }
      }, 100);

      return () => clearInterval(pulseInterval);
    }
  }, [onHeal]);

  // Attack animation effect
  useEffect(() => {
    if (onAttack && dragonAttackingTexture) {
      // Attack animation configuration
      const totalFrames = 60;
      const lungeForwardRatio = 0.1; // 30% of animation for lunge forward
      const lungeDistance = 20; // Distance to move down during lunge
      const scaleIncrease = 0.2; // Scale increase during attack
      const frameInterval = 10; // Milliseconds between frames
      const attackPeakOffset = 5; // Frames before peak to trigger red tint

      // Switch to attacking sprite
      setCurrentTexture(dragonAttackingTexture);

      // Ease out function
      const easeOut = (t: number) => {
        return 1 - Math.pow(1 - t, 3);
      };

      // Calculate phase frames
      const lungeFrames = Math.floor(totalFrames * lungeForwardRatio);
      const returnFrames = totalFrames - lungeFrames;

      const originalY = 275;
      const originalX = 325;
      let attackFrame = 0;

      const attackInterval = setInterval(() => {
        if (attackFrame < totalFrames) {
          if (attackFrame < lungeFrames) {
            // Lunge forward phase (ease out)
            const progress = attackFrame / lungeFrames;
            const easedProgress = easeOut(progress);

            setPosition({
              x: originalX,
              y: originalY + easedProgress * lungeDistance,
            });
            setScale({
              x: 1 + easedProgress * scaleIncrease,
              y: 1 + easedProgress * scaleIncrease,
            });

            if (attackFrame >= lungeFrames - attackPeakOffset) {
              onAttackPeak(true);
            }
          } else {
            // Return to position phase (ease out)
            const returnProgress = (attackFrame - lungeFrames) / returnFrames;
            const easedProgress = easeOut(returnProgress);
            const reverseProgress = 1 - easedProgress;

            setPosition({
              x: originalX,
              y: originalY + reverseProgress * lungeDistance,
            });
            setScale({
              x: 1 + reverseProgress * scaleIncrease,
              y: 1 + reverseProgress * scaleIncrease,
            });
          }
          attackFrame++;
        } else {
          clearInterval(attackInterval);
          // Reset to normal sprite and position
          setCurrentTexture(dragonTexture);
          setPosition({ x: originalX, y: originalY });
          setScale({ x: 1, y: 1 });
          onAttackPeak(false); // Ensure red tint is off
        }
      }, frameInterval);

      return () => {
        clearInterval(attackInterval);
        setCurrentTexture(dragonTexture);
        setPosition({ x: 325, y: 275 });
        setScale({ x: 1, y: 1 });
        onAttackPeak(false); // Ensure red tint is off when cleaning up
      };
    }
  }, [onAttack, dragonAttackingTexture, dragonTexture, onAttackPeak]);

  // Scale down dragon based on HP (smaller scale for actual sprite)
  const hpScale = Math.max(0.3, (dragonHP / 100) * 0.8); // Scale between 0.3 and 0.8

  if (!currentTexture) return null;

  return (
    <pixiSprite
      ref={dragonRef}
      texture={currentTexture}
      x={position.x}
      y={position.y}
      anchor={0.5}
      scale={{
        x: scale.x * 0.5,
        y: scale.y * 0.5,
      }}
      tint={tint}
      rotation={rotation}
    />
  );
};

// Background elements for the game
const GameBackground: React.FC<{ showRedTint?: boolean }> = ({
  showRedTint = false,
}) => {
  const app = useApplication();
  const [castleBgTexture, setCastleBgTexture] = useState<PIXI.Texture | null>(
    null
  );
  const [redOverlayTexture, setRedOverlayTexture] =
    useState<PIXI.Texture | null>(null);
  const [redTintAlpha, setRedTintAlpha] = useState(0);
  const [runningTime, setRunningTime] = useState(0);

  // Animate red tint alpha over time
  useTick((delta) => {
    if (showRedTint) {
      if (runningTime == 0) setRunningTime(Date.now());
      const time = (Date.now() - runningTime) * 0.01;
      // Oscillate between 0.2 and 0.6 for a pulsing effect
      const pulsedAlpha = 0.4 + Math.sin(time) * 0.2;
      setRedTintAlpha(pulsedAlpha);
    } else {
      setRedTintAlpha(0);
      setRunningTime(0);
    }
  });

  // Load castle background texture
  useEffect(() => {
    const loadTextures = async () => {
      try {
        const castle = await PIXI.Assets.load(castleBgImage);
        setCastleBgTexture(castle);

        // Create red overlay texture
        const graphics = new PIXI.Graphics();
        graphics.setFillStyle({ color: 0xff0000, alpha: 0.3 });
        graphics.rect(0, 0, 800, 600);
        graphics.fill();
        const redOverlay = app.app.renderer.generateTexture(graphics);
        setRedOverlayTexture(redOverlay);
      } catch (error) {
        console.error("Failed to load background textures:", error);
        // Fallback to simple background
        const graphics = new PIXI.Graphics();
        graphics.setFillStyle({ color: 0x87ceeb, alpha: 0.3 });
        graphics.rect(0, 0, 800, 600);
        graphics.fill();
        const fallbackBg = app.app.renderer.generateTexture(graphics);
        setCastleBgTexture(fallbackBg);

        // Create red overlay texture for fallback
        const redGraphics = new PIXI.Graphics();
        redGraphics.setFillStyle({ color: 0xff0000, alpha: 0.3 });
        redGraphics.rect(0, 0, 800, 600);
        redGraphics.fill();
        const redOverlay = app.app.renderer.generateTexture(redGraphics);
        setRedOverlayTexture(redOverlay);
      }
    };

    loadTextures();
  }, [app]);

  if (!castleBgTexture || !redOverlayTexture) return null;

  return (
    <pixiContainer>
      {/* Castle background */}
      <pixiSprite
        texture={castleBgTexture}
        width={800}
        height={600}
        x={0}
        y={0}
      />

      {/* Red overlay for attack effect */}
      {showRedTint && (
        <pixiSprite
          texture={redOverlayTexture}
          width={800}
          height={600}
          x={0}
          y={0}
          alpha={redTintAlpha}
        />
      )}
    </pixiContainer>
  );
};

const DragonPixiGame: React.FC<DragonPixiGameProps> = ({
  dragonHP,
  onDamage,
  onHeal,
  onAttack,
}) => {
  const [showRedTint, setShowRedTint] = useState(false);

  const handleAttackPeak = useCallback((isPeak: boolean) => {
    setShowRedTint(isPeak);
  }, []);

  return (
    <div className="w-full h-full border border-border/30 rounded-lg overflow-hidden">
      <Application
        width={800}
        height={600}
        backgroundColor={0x87ceeb}
        antialias={true}
        resolution={window.devicePixelRatio || 1}
      >
        <GameBackground showRedTint={showRedTint} />
        <DragonSprite
          dragonHP={dragonHP}
          onDamage={onDamage}
          onHeal={onHeal}
          onAttack={onAttack}
          onAttackPeak={handleAttackPeak}
        />
      </Application>
    </div>
  );
};

export default DragonPixiGame;
