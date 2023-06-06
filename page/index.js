(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // ../lib/AppGesture.js
  var _AppGesture = class {
    /**
     * Register this instance. Must be called in onInit
     */
    static init() {
      hmApp.registerGestureEvent((e) => {
        return _AppGesture._events[e] ? _AppGesture._events[e]() : false;
      });
    }
    /**
     * Add event listener, ex. AppGesture.on("left", () => {...})
     */
    static on(event, action) {
      this._events[this._evMapping[event]] = action;
    }
    /**
     * Reload page after two swipes in selected direction
     */
    static withYellowWorkaround(event, startReq) {
      let lastSwipe = 0;
      let count = 0;
      _AppGesture.on(event, () => {
        if (Date.now() - lastSwipe > 1e3)
          count = 1;
        if (count == 3) {
          hmApp.startApp(startReq);
          return;
        }
        count++;
        lastSwipe = Date.now();
        return true;
      });
    }
  };
  var AppGesture = _AppGesture;
  __publicField(AppGesture, "_events", {});
  __publicField(AppGesture, "_evMapping", {
    "up": hmApp.gesture.UP,
    "left": hmApp.gesture.LEFT,
    "right": hmApp.gesture.RIGHT,
    "down": hmApp.gesture.DOWN
  });

  // page/index.js
  var MetroMap = class {
    contents = [];
    constructor(path) {
      this.path = path;
      this.current = 0;
      this.view = null;
    }
    getSelfPath() {
      const pkg = hmApp.packageInfo();
      const idn = pkg.appId.toString(16).padStart(8, "0").toUpperCase();
      return "/storage/js_" + pkg.type + "s/" + idn;
    }
    start() {
      const absPath = this.getSelfPath() + "/assets/" + this.path;
      const [filenames, e] = hmFS.readdir(absPath);
      this.contents = filenames;
      if (this.contents.length < 1) {
        return;
      }
      this.view = hmUI.createWidget(hmUI.widget.IMG, {
        x: 0,
        y: 0,
        w: 192,
        h: 490,
        src: this.path + "/" + this.contents[0]
      });
      hmUI.createWidget(hmUI.widget.IMG, {
        x: 0,
        y: 64,
        w: 192,
        h: (490 - 64) / 2,
        src: ""
      }).addEventListener(hmUI.event.CLICK_UP, () => {
        this.switch(-1);
      });
      hmUI.createWidget(hmUI.widget.IMG, {
        x: 0,
        y: 64 + (490 - 64) / 2,
        w: 192,
        h: (490 - 64) / 2,
        src: ""
      }).addEventListener(hmUI.event.CLICK_UP, () => {
        this.switch(1);
      });
    }
    switch(delta) {
      const val = this.current + delta;
      if (!this.contents[val])
        return;
      this.view.setProperty(hmUI.prop.MORE, {
        src: this.path + "/" + this.contents[val]
      });
      this.current = val;
    }
  };
  var __$$app$$__ = __$$hmAppManager$$__.currentApp;
  var __$$module$$__ = __$$app$$__.current;
  __$$module$$__.module = DeviceRuntimeCore.Page({
    onInit() {
      AppGesture.on("left", () => {
        hmApp.gotoPage({
          url: "page/AboutScreen"
        });
      });
      AppGesture.init();
      const mtmp = new MetroMap("images");
      mtmp.start();
    }
  });
})();
