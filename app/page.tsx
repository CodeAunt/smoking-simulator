"use client";
import { useEffect, useRef, useState, useCallback } from "react";

export default function Home() {
  const [activeSmoking, setActiveSmoking] = useState(false); // 用户主动吸烟
  const [cigaretteLength, setCigaretteLength] = useState(230); // 初始长度230px
  const [isInitialized, setIsInitialized] = useState(false); // 是否已初始化音频
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(0);
  const startTime = useRef<number>(Date.now()); // 应用启动时间
  const lastActiveTime = useRef<number>(0); // 上次主动吸烟时间
  const accumulatedBurnTime = useRef<number>(0); // 累积的等效燃烧时间

  // 音频引用
  const lightAudioRef = useRef<HTMLAudioElement | null>(null);
  const smokeAudioRef = useRef<HTMLAudioElement | null>(null);
  const exhaleAudioRef = useRef<HTMLAudioElement | null>(null);

  const initialLength = 230;
  const passiveBurnDuration = 600000; // 被动燃烧：10分钟烧完
  const activeBurnRate = 8; // 主动燃烧：8倍速度
  const updateInterval = 100; // 100ms更新一次

  // 初始化音频
  useEffect(() => {
    if (typeof window !== 'undefined') {
      lightAudioRef.current = new Audio('/audio/light.mp3');
      smokeAudioRef.current = new Audio('/audio/smoke.mp3');
      exhaleAudioRef.current = new Audio('/audio/exhale.mp3');

      // 设置smoke音频循环播放
      if (smokeAudioRef.current) {
        smokeAudioRef.current.loop = true;
        smokeAudioRef.current.volume = 0.1; // 默认小声
      }

      // 设置其他音频音量
      if (lightAudioRef.current) {
        lightAudioRef.current.volume = 0.7;
      }
      if (exhaleAudioRef.current) {
        exhaleAudioRef.current.volume = 0.6;
      }
    }

    return () => {
      // 清理音频
      if (lightAudioRef.current) {
        lightAudioRef.current.pause();
        lightAudioRef.current = null;
      }
      if (smokeAudioRef.current) {
        smokeAudioRef.current.pause();
        smokeAudioRef.current = null;
      }
      if (exhaleAudioRef.current) {
        exhaleAudioRef.current.pause();
        exhaleAudioRef.current = null;
      }
    };
  }, []);

  // 播放点燃音效并开始持续的烟雾音效
  const startInitialBurning = useCallback(async () => {
    if (isInitialized) return;
    
    try {
      // 播放点燃音效
      if (lightAudioRef.current) {
        await lightAudioRef.current.play();
      }
      
      // 延迟一点后开始播放持续的烟雾音效
      setTimeout(async () => {
        if (smokeAudioRef.current) {
          smokeAudioRef.current.volume = 0.1; // 小声
          await smokeAudioRef.current.play();
        }
      }, 1000);
      
      setIsInitialized(true);
    } catch (error) {
      console.log('Audio play failed:', error);
    }
  }, [isInitialized]);

  // 开始主动吸烟
  const handleActiveSmokingStart = useCallback(async () => {
    if (cigaretteLength <= 0) return;
    
    // 如果还没初始化，先初始化
    if (!isInitialized) {
      await startInitialBurning();
    }
    
    const now = Date.now();
    
    // 记录开始主动吸烟的时间，并累积之前的被动燃烧时间
    if (!activeSmoking) {
      const passiveTime = now - Math.max(startTime.current, lastActiveTime.current);
      accumulatedBurnTime.current += passiveTime; // 被动燃烧时间按1倍计算
      lastActiveTime.current = now;
      
      // 调高烟雾音效音量
      if (smokeAudioRef.current) {
        smokeAudioRef.current.volume = 0.8; // 大声
      }
    }
    
    setActiveSmoking(true);
  }, [cigaretteLength, activeSmoking, isInitialized, startInitialBurning]);

  // 停止主动吸烟
  const handleActiveSmokingStop = useCallback(async () => {
    if (activeSmoking) {
      const now = Date.now();
      const activeTime = now - lastActiveTime.current;
      accumulatedBurnTime.current += activeTime * activeBurnRate; // 主动燃烧时间按8倍计算
      lastActiveTime.current = now;
      
      // 调低烟雾音效音量
      if (smokeAudioRef.current) {
        smokeAudioRef.current.volume = 0.1; // 小声
      }
      
      // 播放呼气音效
      try {
        if (exhaleAudioRef.current) {
          exhaleAudioRef.current.currentTime = 0; // 重置播放位置
          await exhaleAudioRef.current.play();
        }
      } catch (error) {
        console.log('Exhale audio play failed:', error);
      }
    }
    setActiveSmoking(false);
  }, [activeSmoking]);

  // 重新开始 - 再来一根
  const handleRestart = () => {
    setCigaretteLength(initialLength);
    setActiveSmoking(false);
    setIsInitialized(false);
    lastUpdateTime.current = 0;
    startTime.current = Date.now();
    lastActiveTime.current = 0;
    accumulatedBurnTime.current = 0;
    
    // 停止所有音频
    if (smokeAudioRef.current) {
      smokeAudioRef.current.pause();
      smokeAudioRef.current.currentTime = 0;
    }
    if (exhaleAudioRef.current) {
      exhaleAudioRef.current.pause();
      exhaleAudioRef.current.currentTime = 0;
    }
  };

  // 燃烧动画逻辑
  useEffect(() => {
    if (cigaretteLength <= 0) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (currentTime: number) => {
      // 节流：每100ms更新一次
      if (currentTime - lastUpdateTime.current < updateInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      lastUpdateTime.current = currentTime;
      
      const now = Date.now();
      
      // 计算当前的等效燃烧时间
      let currentEffectiveBurnTime = accumulatedBurnTime.current;
      
      if (activeSmoking) {
        // 正在主动吸烟：从上次记录时间到现在的时间按8倍计算
        const currentActiveTime = now - lastActiveTime.current;
        currentEffectiveBurnTime += currentActiveTime * activeBurnRate;
      } else {
        // 被动燃烧：从上次记录时间到现在的时间按1倍计算
        const currentPassiveTime = now - Math.max(startTime.current, lastActiveTime.current);
        currentEffectiveBurnTime += currentPassiveTime;
      }
      
      // 计算燃烧进度
      const burnProgress = currentEffectiveBurnTime / passiveBurnDuration;
      const newLength = Math.max(0, initialLength * (1 - burnProgress));

      setCigaretteLength(newLength);

      if (newLength > 0) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // 烟烧完了
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [cigaretteLength, activeSmoking]);

  // 事件监听器
  useEffect(() => {
    window.addEventListener("keydown", handleActiveSmokingStart);
    window.addEventListener("keyup", handleActiveSmokingStop);
    window.addEventListener("touchstart", handleActiveSmokingStart);
    window.addEventListener("touchend", handleActiveSmokingStop);
    window.addEventListener("mousedown", handleActiveSmokingStart);
    window.addEventListener("mouseup", handleActiveSmokingStop);
    
    return () => {
      window.removeEventListener("keydown", handleActiveSmokingStart);
      window.removeEventListener("keyup", handleActiveSmokingStop);
      window.removeEventListener("touchstart", handleActiveSmokingStart);
      window.removeEventListener("touchend", handleActiveSmokingStop);
      window.removeEventListener("mousedown", handleActiveSmokingStart);
      window.removeEventListener("mouseup", handleActiveSmokingStop);
    };
  }, [handleActiveSmokingStart, handleActiveSmokingStop]);

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col items-center bg-black font-sans select-none">
      <div className="flex-1 flex flex-col items-center justify-end pb-32 min-h-[400px] min-w-[120px]">
        {/* 香烟结构：烟头在上，烟身在中，烟屁股在下 */}
        <div className="relative flex flex-col items-center justify-end w-12 md:w-12 shadow-lg select-none pointer-events-none">
          {/* 烟头 - 始终显示红色燃烧效果 */}
          <div
            className="w-8 h-8 md:w-8 md:h-8 rounded-t-xl border-2 relative select-none"
            style={{
              background: cigaretteLength > 0 ? (activeSmoking ? "#ff1a00" : "#cc3300") : "#a0a0a0",
              borderColor: "#a0a0a0",
              transition: "background 0.3s",
              display: cigaretteLength > 0 ? "block" : "none",
              boxShadow: cigaretteLength > 0 ? (activeSmoking ? "0 0 15px #ff3c00" : "0 0 8px #cc3300") : "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none"
            }}
          >
            {/* 烟雾动画 - 只有主动吸烟时才显示 */}
            {activeSmoking && cigaretteLength > 0 && (
              <div
                className="absolute smoke-animation-vertical select-none pointer-events-none"
                style={{
                  bottom: "100px",
                  left: '50%',
                  transform: 'translateX(-50%)',
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  MozUserSelect: "none",
                  msUserSelect: "none"
                }}
              >
                <div className="smoke puff1" />
                <div className="smoke puff2" />
                <div className="smoke puff3" />
              </div>
            )}
          </div>

          {/* 烟身 - 长度会随燃烧实时减少 */}
          <div
            className="w-full bg-gradient-to-b from-[#f5f5f5] to-[#e0e0e0] rounded-xl border-2 border-[#bbb] select-none"
            style={{
              height: `${cigaretteLength}px`,
              display: cigaretteLength > 0 ? "block" : "none",
              transition: "height 0.2s ease-out",
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none"
            }}
          />
          {/* 烟屁股 */}
          <div
            className="w-full h-16 md:h-16 bg-gradient-to-b from-[#e0a96d] to-[#b97a3a] rounded-b-3xl border-2 border-[#b97a3a] select-none"
            style={{
              userSelect: "none",
              WebkitUserSelect: "none",
              MozUserSelect: "none",
              msUserSelect: "none"
            }}
          />
        </div>
      </div>
      
      {/* 提示文字或重新开始按钮 */}
      <div className="pb-10 text-center">
        {cigaretteLength <= 0 ? (
          <button
            onClick={handleRestart}
            className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-lg font-medium transition-colors duration-200"
          >
            Another one
          </button>
        ) : !isInitialized ? (
          <button
            onClick={startInitialBurning}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg text-lg font-medium transition-colors duration-200"
          >
            🔥 Light the cigarette
          </button>
        ) : (
          <div className="text-gray-400 text-lg tracking-wide select-none">
            {activeSmoking ? "Smoking intensely..." : "Cigarette burning slowly. Press any key, click or touch to smoke actively."}
          </div>
        )}
      </div>
    </div>
  );
}
