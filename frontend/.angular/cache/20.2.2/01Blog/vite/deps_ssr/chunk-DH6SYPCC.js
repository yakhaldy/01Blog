import { createRequire } from 'module';const require = createRequire(import.meta.url);
import {
  MatRipple
} from "./chunk-CX4W53YJ.js";
import {
  MatCommonModule
} from "./chunk-MJTPPFZO.js";
import {
  NgModule,
  setClassMetadata,
  ɵɵdefineInjector,
  ɵɵdefineNgModule
} from "./chunk-VR4PPWEQ.js";

// node_modules/@angular/material/fesm2022/ripple-module.mjs
var MatRippleModule = class _MatRippleModule {
  static ɵfac = function MatRippleModule_Factory(__ngFactoryType__) {
    return new (__ngFactoryType__ || _MatRippleModule)();
  };
  static ɵmod = ɵɵdefineNgModule({
    type: _MatRippleModule,
    imports: [MatCommonModule, MatRipple],
    exports: [MatRipple, MatCommonModule]
  });
  static ɵinj = ɵɵdefineInjector({
    imports: [MatCommonModule, MatCommonModule]
  });
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(MatRippleModule, [{
    type: NgModule,
    args: [{
      imports: [MatCommonModule, MatRipple],
      exports: [MatRipple, MatCommonModule]
    }]
  }], null, null);
})();

export {
  MatRippleModule
};
//# sourceMappingURL=chunk-DH6SYPCC.js.map
