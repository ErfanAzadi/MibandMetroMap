/**
 * Build with ZMake tool
 */

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
          console.log("Reloading with params", startReq);
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

  // ../lib/FsUtils.js
  var FsUtils = class {
    static writeText(fn, data) {
      if (!fn.startsWith("/storage"))
        fn = FsUtils.fullPath(fn);
      try {
        hmFS.remove(fn);
      } catch (e) {
      }
      const buffer = FsUtils.strToUtf8(data);
      const f = FsUtils.open(fn, hmFS.O_WRONLY | hmFS.O_CREAT);
      hmFS.write(f, buffer, 0, buffer.byteLength);
      hmFS.close(f);
    }
    static read(fn, limit = false) {
      if (!fn.startsWith("/storage"))
        fn = FsUtils.fullPath(fn);
      const [st, e] = FsUtils.stat(fn);
      const f = FsUtils.open(fn, hmFS.O_RDONLY);
      const size = limit ? limit : st.size;
      const data = new ArrayBuffer(size);
      hmFS.read(f, data, 0, size);
      hmFS.close(f);
      return data;
    }
    static fetchTextFile(fn, limit = false) {
      const data = FsUtils.read(fn, limit);
      const view = new Uint8Array(data);
      let str = "";
      return FsUtils.Utf8ArrayToStr(view);
    }
    static stat(path) {
      path = FsUtils.fixPath(path);
      return hmFS.stat_asset(path);
    }
    static fixPath(path) {
      if (path.startsWith("/storage")) {
        const statPath = "../../../" + path.substring(9);
        return statPath;
      }
      return path;
    }
    static open(path, m) {
      if (path.startsWith("/storage")) {
        const statPath = "../../../" + path.substring(9);
        return hmFS.open_asset(statPath, m);
      }
      return hmFS.open(path, m);
    }
    static fetchJSON(fn) {
      const text = FsUtils.fetchTextFile(fn);
      return JSON.parse(text);
    }
    static copy(source, dest) {
      try {
        hmFS.remove(dest);
      } catch (e) {
      }
      const buffer = FsUtils.read(source);
      const f = FsUtils.open(dest, hmFS.O_WRONLY | hmFS.O_CREAT);
      hmFS.write(f, buffer, 0, buffer.byteLength);
      hmFS.close(f);
    }
    static isFolder(path) {
      const [st, e] = FsUtils.stat(path);
      return (st.mode & 32768) == 0;
    }
    static getSelfPath() {
      if (!FsUtils.selfPath) {
        const pkg = hmApp.packageInfo();
        const idn = pkg.appId.toString(16).padStart(8, "0").toUpperCase();
        return "/storage/js_" + pkg.type + "s/" + idn;
      }
      return FsUtils.selfPath;
    }
    static fullPath(path) {
      return FsUtils.getSelfPath() + "/assets/" + path;
    }
    static rmTree(path) {
      if (!path.startsWith("/storage"))
        path = FsUtils.fullPath(path);
      const [files, e] = hmFS.readdir(path);
      for (let i in files) {
        FsUtils.rmTree(path + "/" + files[i]);
      }
      hmFS.remove(path);
    }
    static copyTree(source, dest, removeSource) {
      if (!source.startsWith("/storage"))
        source = FsUtils.fullPath(source);
      if (!dest.startsWith("/storage"))
        dest = FsUtils.fullPath(dest);
      if (!FsUtils.isFolder(source)) {
        console.log("copy", source, "->", dest);
        FsUtils.copy(source, dest);
      } else {
        const [files, e] = hmFS.readdir(source);
        hmFS.mkdir(dest);
        for (let i in files) {
          FsUtils.copyTree(source + "/" + files[i], dest + "/" + files[i], removeSource);
        }
      }
      if (removeSource) {
        console.log("Delete", source);
        hmFS.remove(source);
      }
    }
    static sizeTree(path) {
      if (!path.startsWith("/storage"))
        path = FsUtils.fullPath(path);
      const [files, e] = hmFS.readdir(path);
      let value = 0;
      for (let fn in files) {
        const file = path + "/" + files[fn];
        const statPath = "../../../" + file.substring(9);
        const [st, e2] = hmFS.stat_asset(statPath);
        value += st.size ? st.size : FsUtils.sizeTree(file);
      }
      return value;
    }
    // https://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
    static strToUtf8(str) {
      var utf8 = [];
      for (var i = 0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 128)
          utf8.push(charcode);
        else if (charcode < 2048) {
          utf8.push(
            192 | charcode >> 6,
            128 | charcode & 63
          );
        } else if (charcode < 55296 || charcode >= 57344) {
          utf8.push(
            224 | charcode >> 12,
            128 | charcode >> 6 & 63,
            128 | charcode & 63
          );
        } else {
          i++;
          charcode = 65536 + ((charcode & 1023) << 10 | str.charCodeAt(i) & 1023);
          utf8.push(
            240 | charcode >> 18,
            128 | charcode >> 12 & 63,
            128 | charcode >> 6 & 63,
            128 | charcode & 63
          );
        }
      }
      return new Uint8Array(utf8).buffer;
    }
    // source: https://stackoverflow.com/questions/13356493/decode-utf-8-with-javascript
    static decodeUtf8(array, outLimit = Infinity, startPosition = 0) {
      let out = "";
      let length = array.length;
      let i = startPosition, c, char2, char3;
      while (i < length && out.length < outLimit) {
        c = array[i++];
        switch (c >> 4) {
          case 0:
          case 1:
          case 2:
          case 3:
          case 4:
          case 5:
          case 6:
          case 7:
            out += String.fromCharCode(c);
            break;
          case 12:
          case 13:
            char2 = array[i++];
            out += String.fromCharCode(
              (c & 31) << 6 | char2 & 63
            );
            break;
          case 14:
            char2 = array[i++];
            char3 = array[i++];
            out += String.fromCharCode(
              (c & 15) << 12 | (char2 & 63) << 6 | (char3 & 63) << 0
            );
            break;
        }
      }
      return [out, i - startPosition];
    }
    static Utf8ArrayToStr(array) {
      return FsUtils.decodeUtf8(array)[0];
    }
    static printBytes(val) {
      if (this.fsUnitCfg === void 0)
        this.fsUnitCfg = hmFS.SysProGetBool("mmk_tb_fs_unit");
      const options = this.fsUnitCfg ? ["B", "KiB", "MiB"] : ["B", "KB", "MB"];
      const base = this.fsUnitCfg ? 1024 : 1e3;
      let curr = 0;
      while (val > 800 && curr < options.length) {
        val = val / base;
        curr++;
      }
      return Math.round(val * 100) / 100 + " " + options[curr];
    }
  };

  // ../lib/BaseAboutScreen.js
  var BaseAboutScreen = class {
    appId = 0;
    appName = "AppName";
    version = "1.0";
    infoRows = [
      ["ErfanAzadi", "Developer"]
    ];
    donateText = "Donate";
    donateUrl = null;
    uninstallText = "Uninstall";
    uninstallConfirm = "Tap again to confirm";
    uninstallResult = "Ready, please reboot your device. Click to open settings";
    posY = 240;
    drawBasement() {
      hmUI.createWidget(hmUI.widget.IMG, {
        x: (192 - 100) / 2,
        y: 48,
        src: "icon.png"
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 158,
        w: 192,
        h: 48,
        text: this.appName,
        text_size: 28,
        color: 16777215,
        align_h: hmUI.align.CENTER_H
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 194,
        w: 192,
        h: 32,
        text: this.version,
        text_size: 18,
        color: 11184810,
        align_h: hmUI.align.CENTER_H
      });
      if (this.donateUrl) {
        hmUI.createWidget(hmUI.widget.BUTTON, {
          x: 16,
          y: this.posY,
          w: 192 - 32,
          h: 48,
          text: this.donateText,
          radius: 24,
          color: 16027569,
          normal_color: 1508110,
          press_color: 3671585,
          click_func: () => this.openDonate()
        });
        this.posY += 64;
      }
      if (this.appId) {
        hmUI.createWidget(hmUI.widget.BUTTON, {
          x: 16,
          y: this.posY,
          w: 192 - 32,
          h: 48,
          text: this.uninstallText,
          radius: 24,
          color: 16777215,
          normal_color: 3355443,
          press_color: 5592405,
          click_func: () => this.uninstall()
        });
        this.posY += 64;
      }
    }
    uninstall() {
      if (!this.confirmed) {
        hmUI.showToast({
          text: this.uninstallConfirm
        });
        this.confirmed = true;
        return;
      }
      const dirname = this.appId.toString(16).padStart(8, "0").toUpperCase();
      this.onUninstall();
      FsUtils.rmTree("/storage/js_apps/" + dirname);
      FsUtils.rmTree("/storage/js_apps/data" + dirname);
      hmApp.setLayerY(0);
      hmUI.setLayerScrolling(false);
      hmUI.createWidget(hmUI.widget.FILL_RECT, {
        x: 0,
        y: 0,
        w: 192,
        h: 482,
        color: 0
      });
      hmUI.createWidget(hmUI.widget.TEXT, {
        x: 0,
        y: 200,
        w: 192,
        h: 290,
        text: this.uninstallResult,
        text_style: hmUI.text_style.WRAP,
        align_h: hmUI.align.CENTER_H,
        color: 16777215
      });
      hmUI.createWidget(hmUI.widget.IMG, {
        x: 0,
        y: 0,
        w: 192,
        h: 490,
        src: ""
      }).addEventListener(hmUI.event.CLICK_UP, () => {
        hmApp.startApp({
          url: "Settings_systemScreen",
          native: true
        });
      });
    }
    onUninstall() {
    }
    openDonate() {
      hmApp.gotoPage({
        url: this.donateUrl
      });
    }
    drawInfo() {
      for (let [name, info] of this.infoRows) {
        const metrics = hmUI.getTextLayout(name, {
          text_width: 192,
          text_size: 18
        });
        hmUI.createWidget(hmUI.widget.TEXT, {
          x: 0,
          y: this.posY,
          w: 192,
          h: 24,
          text_size: 16,
          color: 11184810,
          text: info,
          align_h: hmUI.align.CENTER_H
        });
        hmUI.createWidget(hmUI.widget.TEXT, {
          x: 0,
          y: this.posY + 24,
          w: 192,
          h: metrics.height + 24,
          text_size: 18,
          color: 16777215,
          text: name,
          text_style: hmUI.text_style.WRAP,
          align_h: hmUI.align.CENTER_H
        });
        this.posY += metrics.height + 32;
      }
      hmUI.createWidget(hmUI.widget.IMG, {
        x: 0,
        y: this.posY + 64,
        w: 192,
        h: 2,
        src: ""
      });
    }
    start() {
      this.drawBasement();
      this.drawInfo();
    }
  };

  // ../lib/i18n.js
  var preferedLang = [
    hmFS.SysProGetChars("mmk_tb_lang"),
    DeviceRuntimeCore.HmUtils.getLanguage(),
    "en-US"
  ];
  var strings = {};
  function extendLocale(data) {
    for (let key in data) {
      strings[key] = data[key];
    }
  }
  function t(key) {
    if (!strings[key])
      return key;
    for (let ln of preferedLang) {
      if (!strings[key][ln])
        continue;
      return strings[key][ln];
    }
    return key;
  }

  // page/AboutScreen.js
  extendLocale({
    app_name: {
      "en-US": "نقشه مترو",
      "ru-RU": "\u0413\u0430\u043B\u0435\u0440\u0435\u044F"
    },
    action_uninstall: {
      "en-US": "Uninstall",
      "ru-RU": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C"
    },
    tap_to_confirm: {
      "en-US": "Tap again to confirm",
      "ru-RU": "\u041D\u0430\u0436\u043C\u0438\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437 \u0434\u043B\u044F \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F"
    },
    uninstall_complete: {
      "en-US": "Uninstalled.\nPlease reboot device to finish",
      "ru-RU": "\u0423\u0434\u0430\u043B\u0435\u043D\u043E.\n\u041F\u0435\u0440\u0435\u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E \u0434\u043B\u044F \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u044F"
    }
  });
  var AboutScreen = class extends BaseAboutScreen {
    appId = 20047;
    appName = t("app_name");
    version = "v2023-04-14";
    infoRows = [
      ["ErfanAzadi", "Developer"]
    ];
    uninstallText = t("action_uninstall");
    uninstallConfirm = t("tap_to_confirm");
    uninstallResult = t("uninstall_complete");
  };
  var __$$app$$__ = __$$hmAppManager$$__.currentApp;
  var __$$module$$__ = __$$app$$__.current;
  __$$module$$__.module = DeviceRuntimeCore.Page({
    onInit(p) {
      AppGesture.withYellowWorkaround("left", {
        appid: 20047,
        url: "page/AboutScreen"
      });
      AppGesture.init();
      new AboutScreen().start();
    }
  });
})();
