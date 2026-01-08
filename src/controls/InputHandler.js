/**
 * InputHandler - Manages keyboard input for the application
 */
export class InputHandler {
  constructor() {
    this.keys = {};
    this.callbacks = {};
    
    this.setupListeners();
  }
  
  /**
   * Setup keyboard event listeners
   */
  setupListeners() {
    window.addEventListener('keydown', (event) => {
      // Prevent default for spacebar to avoid page scroll
      if (event.code === 'Space') {
        event.preventDefault();
      }
      
      // Only trigger on initial press, not repeat
      if (!this.keys[event.code]) {
        this.keys[event.code] = true;
        this.triggerCallback(event.code, 'down');
      }
    });
    
    window.addEventListener('keyup', (event) => {
      this.keys[event.code] = false;
      this.triggerCallback(event.code, 'up');
    });
    
    // Reset keys when window loses focus
    window.addEventListener('blur', () => {
      this.keys = {};
    });
  }
  
  /**
   * Register a callback for a specific key
   * @param {string} keyCode - The key code (e.g., 'Space', 'KeyW')
   * @param {string} eventType - 'down' or 'up'
   * @param {Function} callback - Function to call
   */
  on(keyCode, eventType, callback) {
    const key = `${keyCode}_${eventType}`;
    if (!this.callbacks[key]) {
      this.callbacks[key] = [];
    }
    this.callbacks[key].push(callback);
  }
  
  /**
   * Remove a callback for a specific key
   * @param {string} keyCode
   * @param {string} eventType
   * @param {Function} callback
   */
  off(keyCode, eventType, callback) {
    const key = `${keyCode}_${eventType}`;
    if (this.callbacks[key]) {
      this.callbacks[key] = this.callbacks[key].filter(cb => cb !== callback);
    }
  }
  
  /**
   * Trigger callbacks for a key event
   * @param {string} keyCode
   * @param {string} eventType
   */
  triggerCallback(keyCode, eventType) {
    const key = `${keyCode}_${eventType}`;
    if (this.callbacks[key]) {
      this.callbacks[key].forEach(callback => callback());
    }
  }
  
  /**
   * Check if a key is currently pressed
   * @param {string} keyCode
   * @returns {boolean}
   */
  isPressed(keyCode) {
    return !!this.keys[keyCode];
  }
  
  /**
   * Shorthand for registering a keydown callback
   * @param {string} keyCode
   * @param {Function} callback
   */
  onKeyDown(keyCode, callback) {
    this.on(keyCode, 'down', callback);
  }
  
  /**
   * Shorthand for registering a keyup callback
   * @param {string} keyCode
   * @param {Function} callback
   */
  onKeyUp(keyCode, callback) {
    this.on(keyCode, 'up', callback);
  }
  
  /**
   * Dispose of input handler
   */
  dispose() {
    this.callbacks = {};
    this.keys = {};
  }
}

/**
 * Common key codes for reference
 */
export const KeyCodes = {
  SPACE: 'Space',
  ESCAPE: 'Escape',
  ENTER: 'Enter',
  
  // Arrow keys
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  
  // WASD
  W: 'KeyW',
  A: 'KeyA',
  S: 'KeyS',
  D: 'KeyD',
  
  // Other useful keys
  SHIFT: 'ShiftLeft',
  CTRL: 'ControlLeft',
  ALT: 'AltLeft',
  
  // Numbers
  NUM_1: 'Digit1',
  NUM_2: 'Digit2',
  NUM_3: 'Digit3',
};

