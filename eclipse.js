// 日蚀动画控制器 - 采用苹果设计风格
class EclipseAnimation {
    constructor() {
        this.container = document.querySelector('.eclipse-container');
        this.moon = document.querySelector('.moon');
        this.corona = document.querySelector('.corona');
        this.stars = document.querySelector('.stars');
        this.playBtn = document.getElementById('playBtn');
        this.progressFill = document.getElementById('progressFill');
        this.phaseIndicator = document.getElementById('phaseIndicator');
        
        this.isPlaying = false;
        this.animationProgress = 0;
        this.animationFrame = null;
        this.lastTimestamp = 0;
        
        // 动画配置
        this.ANIMATION_DURATION = 8000; // 8秒完成一次日蚀
        this.ECLIPSE_PHASES = [
            { name: '初亏', progress: 0 },
            { name: '食既', progress: 0.3 },
            { name: '食甚', progress: 0.5 },
            { name: '生光', progress: 0.7 },
            { name: '复圆', progress: 1.0 }
        ];
        
        this.init();
    }
    
    // 初始化
    init() {
        this.setupEventListeners();
        this.createStars();
        this.updateAnimation(0);
    }
    
    // 设置事件监听器
    setupEventListeners() {
        this.playBtn.addEventListener('click', () => this.toggleAnimation());
        
        // 支持键盘控制
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.toggleAnimation();
            }
        });
    }
    
    // 创建星星背景
    createStars() {
        const starCount = 50;
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDelay = `${Math.random() * 3}s`;
            star.style.opacity = Math.random() * 0.8 + 0.2;
            this.stars.appendChild(star);
        }
    }
    
    // 切换动画播放状态
    toggleAnimation() {
        if (this.isPlaying) {
            this.pauseAnimation();
        } else {
            this.playAnimation();
        }
    }
    
    // 播放动画
    playAnimation() {
        this.isPlaying = true;
        this.playBtn.classList.add('playing');
        this.lastTimestamp = performance.now();
        this.animate();
    }
    
    // 暂停动画
    pauseAnimation() {
        this.isPlaying = false;
        this.playBtn.classList.remove('playing');
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
    
    // 动画循环
    animate() {
        if (!this.isPlaying) return;
        
        const currentTimestamp = performance.now();
        const deltaTime = currentTimestamp - this.lastTimestamp;
        
        // 更新动画进度
        this.animationProgress += deltaTime / this.ANIMATION_DURATION;
        
        // 循环动画
        if (this.animationProgress >= 1) {
            this.animationProgress = 0;
        }
        
        this.updateAnimation(this.animationProgress);
        this.lastTimestamp = currentTimestamp;
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
    
    // 更新动画状态
    updateAnimation(progress) {
        // 计算月亮位置
        const moonX = (progress - 0.5) * 200; // -100px 到 100px
        
        // 更新月亮位置
        this.moon.style.transform = `translateX(${moonX}px)`;
        
        // 更新日冕效果
        this.updateCorona(progress);
        
        // 更新星星可见度
        this.updateStars(progress);
        
        // 更新进度条
        this.progressFill.style.width = `${progress * 100}%`;
        
        // 更新阶段指示器
        this.updatePhaseIndicator(progress);
        
        // 更新信息面板
        this.updateInfoPanel(progress);
    }
    
    // 更新日冕效果
    updateCorona(progress) {
        const eclipseIntensity = this.calculateEclipseIntensity(progress);
        const coronaOpacity = Math.max(0, eclipseIntensity * 0.8);
        const coronaScale = 1 + eclipseIntensity * 0.3;
        
        this.corona.style.opacity = coronaOpacity.toString();
        this.corona.style.transform = `scale(${coronaScale})`;
    }
    
    // 更新星星可见度
    updateStars(progress) {
        const eclipseIntensity = this.calculateEclipseIntensity(progress);
        const starsOpacity = Math.max(0, eclipseIntensity * 0.6);
        
        this.stars.style.opacity = starsOpacity.toString();
    }
    
    // 计算日蚀强度
    calculateEclipseIntensity(progress) {
        // 使用正弦函数模拟日蚀强度变化
        const angle = progress * Math.PI;
        return Math.sin(angle);
    }
    
    // 更新阶段指示器
    updatePhaseIndicator(progress) {
        const currentPhase = this.getCurrentPhase(progress);
        this.phaseIndicator.textContent = currentPhase.name;
    }
    
    // 获取当前阶段
    getCurrentPhase(progress) {
        for (let i = this.ECLIPSE_PHASES.length - 1; i >= 0; i--) {
            if (progress >= this.ECLIPSE_PHASES[i].progress) {
                return this.ECLIPSE_PHASES[i];
            }
        }
        return this.ECLIPSE_PHASES[0];
    }
    
    // 更新信息面板
    updateInfoPanel(progress) {
        const phaseItems = document.querySelectorAll('.phase-item');
        const currentPhase = this.getCurrentPhase(progress);
        const currentPhaseIndex = this.ECLIPSE_PHASES.findIndex(
            phase => phase.name === currentPhase.name
        );
        
        phaseItems.forEach((item, index) => {
            if (index < currentPhaseIndex) {
                item.classList.add('completed');
            } else if (index === currentPhaseIndex) {
                item.classList.add('active');
                item.classList.remove('completed');
            } else {
                item.classList.remove('active', 'completed');
            }
        });
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    new EclipseAnimation();
});