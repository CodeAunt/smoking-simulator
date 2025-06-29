"use client";
import { useEffect, useRef, useState, useCallback } from "react";

export default function Home() {
  const [burning, setBurning] = useState(false);
  const [cigaretteLength, setCigaretteLength] = useState(230); // 初始长度230px
  const [burnStartTime, setBurnStartTime] = useState<number | null>(null);
  const [totalBurnTime, setTotalBurnTime] = useState(0); // 累计燃烧时间
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastUpdateTime = useRef<number>(0);

  const initialLength = 230;
  const initialBurnDuration = 180000; // 3分钟 = 180秒
  const fastestBurnDuration = 15000; // 最快15秒，更快的燃烧速度
  const updateInterval = 50; // 50ms更新一次，节流优化

  // 合并所有开始燃烧的事件处理
  const handleBurnStart = useCallback(() => {
    if (cigaretteLength <= 0) return; // 烟烧完了不能燃烧
    setBurning(true);
    setBurnStartTime(Date.now());
  }, [cigaretteLength]);

  // 合并所有停止燃烧的事件处理
  const handleBurnStop = useCallback(() => {
    setBurning(false);
    setBurnStartTime(prevStartTime => {
      if (prevStartTime) {
        setTotalBurnTime(prev => prev + (Date.now() - prevStartTime));
      }
      return null;
    });
  }, []);

  // 重新开始 - 再来一根
  const handleRestart = () => {
    setCigaretteLength(initialLength);
    setTotalBurnTime(0);
    setBurning(false);
    setBurnStartTime(null);
    lastUpdateTime.current = 0;
  };

  // 优化的燃烧动画逻辑 - 节流处理
  useEffect(() => {
    if (!burning) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (currentTime: number) => {
      // 节流：每50ms更新一次
      if (currentTime - lastUpdateTime.current < updateInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      lastUpdateTime.current = currentTime;

      const now = Date.now();
      const currentBurnTime = burnStartTime ? now - burnStartTime : 0;
      const totalCurrentBurnTime = totalBurnTime + currentBurnTime;

      // 计算加速燃烧：随着燃烧时间增长，燃烧速度加快
      const accelerationFactor = Math.min(totalCurrentBurnTime / 30000, 10); // 30秒内达到最大10倍加速
      const accelerationCurve = Math.pow(accelerationFactor / 10, 2); // 使用平方曲线，让加速更明显
      const currentBurnDuration = Math.max(
        fastestBurnDuration,
        initialBurnDuration - (initialBurnDuration - fastestBurnDuration) * accelerationCurve
      );

      // 计算当前应该的长度
      const burnProgress = totalCurrentBurnTime / currentBurnDuration;
      const newLength = Math.max(0, initialLength * (1 - burnProgress));

      // 实时更新烟体长度
      setCigaretteLength(newLength);

      if (newLength > 0 && burning) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // 烟烧完了，停止燃烧
        setBurning(false);
        setBurnStartTime(null);
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
  }, [burning, burnStartTime, totalBurnTime]);

  // 事件监听器
  useEffect(() => {
    window.addEventListener("keydown", handleBurnStart);
    window.addEventListener("keyup", handleBurnStop);
    window.addEventListener("touchstart", handleBurnStart);
    window.addEventListener("touchend", handleBurnStop);
    window.addEventListener("mousedown", handleBurnStart);
    window.addEventListener("mouseup", handleBurnStop);

    return () => {
      window.removeEventListener("keydown", handleBurnStart);
      window.removeEventListener("keyup", handleBurnStop);
      window.removeEventListener("touchstart", handleBurnStart);
      window.removeEventListener("touchend", handleBurnStop);
      window.removeEventListener("mousedown", handleBurnStart);
      window.removeEventListener("mouseup", handleBurnStop);
    };
  }, [handleBurnStart, handleBurnStop]);

  return (
    <div ref={containerRef} className="min-h-screen flex flex-col items-center bg-black font-sans">
      <div className="flex-1 flex flex-col items-center justify-end pb-32 min-h-[400px] min-w-[120px]">
        {/* 香烟结构：烟头在上，烟身在中，烟屁股在下 */}
        <div className="relative flex flex-col items-center justify-end w-12 md:w-12 shadow-lg">
          {/* 烟头 - 只有在有烟身时才显示燃烧效果 */}
          <div
            className="w-8 h-8 md:w-8 md:h-8 rounded-t-xl border-2 relative"
            style={{
              background: (burning && cigaretteLength > 0) ? "#ff3c00" : "#a0a0a0",
              borderColor: "#a0a0a0",
              transition: "background 0.2s",
              display: cigaretteLength > 0 ? "block" : "none"
            }}
          >
            {/* 烟雾动画 - 相对烟头定位 */}
            {burning && cigaretteLength > 0 && (
              <div
                className="absolute smoke-animation-vertical"
                style={{
                  bottom: `100px`, // 烟屁股高度16px + 烟头高度8px + 8px间距 = 32px
                  left: '50%',
                  transform: 'translateX(-50%)'
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
            className="w-full bg-gradient-to-b from-[#f5f5f5] to-[#e0e0e0] rounded-xl border-2 border-[#bbb]"
            style={{
              height: `${cigaretteLength}px`,
              display: cigaretteLength > 0 ? "block" : "none",
              transition: "height 0.1s linear" // 平滑的长度变化
            }}
          />
          {/* 烟屁股 */}
          <div
            className="w-full h-16 md:h-16 bg-gradient-to-b from-[#e0a96d] to-[#b97a3a] rounded-b-3xl border-2 border-[#b97a3a]"
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
        ) : (
          <div className="text-gray-400 text-lg tracking-wide select-none">
            Press any key, click mouse or touch the screen to smoke
          </div>
        )}
      </div>
    </div>
  );
}
