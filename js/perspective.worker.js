/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "../node_modules/detectie/detectie.js":
/*!********************************************!*\
  !*** ../node_modules/detectie/detectie.js ***!
  \********************************************/
/***/ ((module) => {

/**
 * detect IE
 * returns version of IE or false, if browser is not Internet Explorer
 */
var detectie = function() {
    var ua = window.navigator.userAgent;

    var msie = ua.indexOf('MSIE ');
    if (msie > 0) {
        // IE 10 or older => return version number
        return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
    }

    var trident = ua.indexOf('Trident/');
    if (trident > 0) {
        // IE 11 => return version number
        var rv = ua.indexOf('rv:');
        return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
    }

    var edge = ua.indexOf('Edge/');
    if (edge > 0) {
       // IE 12 => return version number
       return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
    }
    // other browser
    return false;
}

module.exports = detectie;

/***/ }),

/***/ "../packages/perspective/dist/esm/@finos/perspective-cpp/dist/esm/perspective.cpp.js":
/*!*******************************************************************************************!*\
  !*** ../packages/perspective/dist/esm/@finos/perspective-cpp/dist/esm/perspective.cpp.js ***!
  \*******************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => __WEBPACK_DEFAULT_EXPORT__
/* harmony export */ });

var load_perspective = (function() {
  var _scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;
  
  return (
function(load_perspective) {
  load_perspective = load_perspective || {};

var Module=typeof load_perspective!=="undefined"?load_perspective:{};var readyPromiseResolve,readyPromiseReject;Module["ready"]=new Promise(function(resolve,reject){readyPromiseResolve=resolve;readyPromiseReject=reject});var moduleOverrides={};var key;for(key in Module){if(Module.hasOwnProperty(key)){moduleOverrides[key]=Module[key]}}var arguments_=[];var thisProgram="./this.program";var quit_=function(status,toThrow){throw toThrow};var ENVIRONMENT_IS_WEB=false;var ENVIRONMENT_IS_WORKER=true;var scriptDirectory="";function locateFile(path){if(Module["locateFile"]){return Module["locateFile"](path,scriptDirectory)}return scriptDirectory+path}var read_,readAsync,readBinary,setWindowTitle;if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){if(ENVIRONMENT_IS_WORKER){scriptDirectory=self.location.href}else if(document.currentScript){scriptDirectory=document.currentScript.src}if(_scriptDir){scriptDirectory=_scriptDir}if(scriptDirectory.indexOf("blob:")!==0){scriptDirectory=scriptDirectory.substr(0,scriptDirectory.lastIndexOf("/")+1)}else{scriptDirectory=""}{read_=function shell_read(url){var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.send(null);return xhr.responseText};if(ENVIRONMENT_IS_WORKER){readBinary=function readBinary(url){var xhr=new XMLHttpRequest;xhr.open("GET",url,false);xhr.responseType="arraybuffer";xhr.send(null);return new Uint8Array(xhr.response)}}readAsync=function readAsync(url,onload,onerror){var xhr=new XMLHttpRequest;xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=function xhr_onload(){if(xhr.status==200||xhr.status==0&&xhr.response){onload(xhr.response);return}onerror()};xhr.onerror=onerror;xhr.send(null)}}setWindowTitle=function(title){document.title=title}}else{}var out=Module["print"]||console.log.bind(console);var err=Module["printErr"]||console.warn.bind(console);for(key in moduleOverrides){if(moduleOverrides.hasOwnProperty(key)){Module[key]=moduleOverrides[key]}}moduleOverrides=null;if(Module["arguments"])arguments_=Module["arguments"];if(Module["thisProgram"])thisProgram=Module["thisProgram"];if(Module["quit"])quit_=Module["quit"];var STACK_ALIGN=16;function warnOnce(text){if(!warnOnce.shown)warnOnce.shown={};if(!warnOnce.shown[text]){warnOnce.shown[text]=1;err(text)}}function convertJsFunctionToWasm(func,sig){if(typeof WebAssembly.Function==="function"){var typeNames={"i":"i32","j":"i64","f":"f32","d":"f64"};var type={parameters:[],results:sig[0]=="v"?[]:[typeNames[sig[0]]]};for(var i=1;i<sig.length;++i){type.parameters.push(typeNames[sig[i]])}return new WebAssembly.Function(type,func)}var typeSection=[1,0,1,96];var sigRet=sig.slice(0,1);var sigParam=sig.slice(1);var typeCodes={"i":127,"j":126,"f":125,"d":124};typeSection.push(sigParam.length);for(var i=0;i<sigParam.length;++i){typeSection.push(typeCodes[sigParam[i]])}if(sigRet=="v"){typeSection.push(0)}else{typeSection=typeSection.concat([1,typeCodes[sigRet]])}typeSection[1]=typeSection.length-2;var bytes=new Uint8Array([0,97,115,109,1,0,0,0].concat(typeSection,[2,7,1,1,101,1,102,0,0,7,5,1,1,102,0,0]));var module=new WebAssembly.Module(bytes);var instance=new WebAssembly.Instance(module,{"e":{"f":func}});var wrappedFunc=instance.exports["f"];return wrappedFunc}var freeTableIndexes=[];var functionsInTableMap;function addFunctionWasm(func,sig){var table=wasmTable;if(!functionsInTableMap){functionsInTableMap=new WeakMap;for(var i=0;i<table.length;i++){var item=table.get(i);if(item){functionsInTableMap.set(item,i)}}}if(functionsInTableMap.has(func)){return functionsInTableMap.get(func)}var ret;if(freeTableIndexes.length){ret=freeTableIndexes.pop()}else{ret=table.length;try{table.grow(1)}catch(err){if(!(err instanceof RangeError)){throw err}throw"Unable to grow wasm table. Set ALLOW_TABLE_GROWTH."}}try{table.set(ret,func)}catch(err){if(!(err instanceof TypeError)){throw err}var wrapped=convertJsFunctionToWasm(func,sig);table.set(ret,wrapped)}functionsInTableMap.set(func,ret);return ret}function removeFunctionWasm(index){functionsInTableMap.delete(wasmTable.get(index));freeTableIndexes.push(index)}var tempRet0=0;var wasmBinary;if(Module["wasmBinary"])wasmBinary=Module["wasmBinary"];var noExitRuntime;if(Module["noExitRuntime"])noExitRuntime=Module["noExitRuntime"];if(typeof WebAssembly!=="object"){abort("no native wasm support detected")}var wasmMemory;var wasmTable;var ABORT=false;var EXITSTATUS=0;function assert(condition,text){if(!condition){abort("Assertion failed: "+text)}}function getCFunc(ident){var func=Module["_"+ident];assert(func,"Cannot call unknown function "+ident+", make sure it is exported");return func}function ccall(ident,returnType,argTypes,args,opts){var toC={"string":function(str){var ret=0;if(str!==null&&str!==undefined&&str!==0){var len=(str.length<<2)+1;ret=stackAlloc(len);stringToUTF8(str,ret,len)}return ret},"array":function(arr){var ret=stackAlloc(arr.length);writeArrayToMemory(arr,ret);return ret}};function convertReturnValue(ret){if(returnType==="string")return UTF8ToString(ret);if(returnType==="boolean")return Boolean(ret);return ret}var func=getCFunc(ident);var cArgs=[];var stack=0;if(args){for(var i=0;i<args.length;i++){var converter=toC[argTypes[i]];if(converter){if(stack===0)stack=stackSave();cArgs[i]=converter(args[i])}else{cArgs[i]=args[i]}}}var ret=func.apply(null,cArgs);ret=convertReturnValue(ret);if(stack!==0)stackRestore(stack);return ret}var ALLOC_STACK=1;var UTF8Decoder=typeof TextDecoder!=="undefined"?new TextDecoder("utf8"):undefined;function UTF8ArrayToString(heap,idx,maxBytesToRead){idx>>>=0;var endIdx=idx+maxBytesToRead;var endPtr=idx;while(heap[endPtr>>>0]&&!(endPtr>=endIdx))++endPtr;if(endPtr-idx>16&&heap.subarray&&UTF8Decoder){return UTF8Decoder.decode(heap.subarray(idx>>>0,endPtr>>>0))}else{var str="";while(idx<endPtr){var u0=heap[idx++>>>0];if(!(u0&128)){str+=String.fromCharCode(u0);continue}var u1=heap[idx++>>>0]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue}var u2=heap[idx++>>>0]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2}else{u0=(u0&7)<<18|u1<<12|u2<<6|heap[idx++>>>0]&63}if(u0<65536){str+=String.fromCharCode(u0)}else{var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023)}}}return str}function UTF8ToString(ptr,maxBytesToRead){ptr>>>=0;return ptr?UTF8ArrayToString(HEAPU8,ptr,maxBytesToRead):""}function stringToUTF8Array(str,heap,outIdx,maxBytesToWrite){outIdx>>>=0;if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343){var u1=str.charCodeAt(++i);u=65536+((u&1023)<<10)|u1&1023}if(u<=127){if(outIdx>=endIdx)break;heap[outIdx++>>>0]=u}else if(u<=2047){if(outIdx+1>=endIdx)break;heap[outIdx++>>>0]=192|u>>6;heap[outIdx++>>>0]=128|u&63}else if(u<=65535){if(outIdx+2>=endIdx)break;heap[outIdx++>>>0]=224|u>>12;heap[outIdx++>>>0]=128|u>>6&63;heap[outIdx++>>>0]=128|u&63}else{if(outIdx+3>=endIdx)break;heap[outIdx++>>>0]=240|u>>18;heap[outIdx++>>>0]=128|u>>12&63;heap[outIdx++>>>0]=128|u>>6&63;heap[outIdx++>>>0]=128|u&63}}heap[outIdx>>>0]=0;return outIdx-startIdx}function stringToUTF8(str,outPtr,maxBytesToWrite){return stringToUTF8Array(str,HEAPU8,outPtr,maxBytesToWrite)}function lengthBytesUTF8(str){var len=0;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343)u=65536+((u&1023)<<10)|str.charCodeAt(++i)&1023;if(u<=127)++len;else if(u<=2047)len+=2;else if(u<=65535)len+=3;else len+=4}return len}var UTF16Decoder=typeof TextDecoder!=="undefined"?new TextDecoder("utf-16le"):undefined;function UTF16ToString(ptr,maxBytesToRead){var endPtr=ptr;var idx=endPtr>>1;var maxIdx=idx+maxBytesToRead/2;while(!(idx>=maxIdx)&&HEAPU16[idx>>>0])++idx;endPtr=idx<<1;if(endPtr-ptr>32&&UTF16Decoder){return UTF16Decoder.decode(HEAPU8.subarray(ptr>>>0,endPtr>>>0))}else{var i=0;var str="";while(1){var codeUnit=HEAP16[ptr+i*2>>>1];if(codeUnit==0||i==maxBytesToRead/2)return str;++i;str+=String.fromCharCode(codeUnit)}}}function stringToUTF16(str,outPtr,maxBytesToWrite){if(maxBytesToWrite===undefined){maxBytesToWrite=2147483647}if(maxBytesToWrite<2)return 0;maxBytesToWrite-=2;var startPtr=outPtr;var numCharsToWrite=maxBytesToWrite<str.length*2?maxBytesToWrite/2:str.length;for(var i=0;i<numCharsToWrite;++i){var codeUnit=str.charCodeAt(i);HEAP16[outPtr>>>1]=codeUnit;outPtr+=2}HEAP16[outPtr>>>1]=0;return outPtr-startPtr}function lengthBytesUTF16(str){return str.length*2}function UTF32ToString(ptr,maxBytesToRead){var i=0;var str="";while(!(i>=maxBytesToRead/4)){var utf32=HEAP32[ptr+i*4>>>2];if(utf32==0)break;++i;if(utf32>=65536){var ch=utf32-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023)}else{str+=String.fromCharCode(utf32)}}return str}function stringToUTF32(str,outPtr,maxBytesToWrite){outPtr>>>=0;if(maxBytesToWrite===undefined){maxBytesToWrite=2147483647}if(maxBytesToWrite<4)return 0;var startPtr=outPtr;var endPtr=startPtr+maxBytesToWrite-4;for(var i=0;i<str.length;++i){var codeUnit=str.charCodeAt(i);if(codeUnit>=55296&&codeUnit<=57343){var trailSurrogate=str.charCodeAt(++i);codeUnit=65536+((codeUnit&1023)<<10)|trailSurrogate&1023}HEAP32[outPtr>>>2]=codeUnit;outPtr+=4;if(outPtr+4>endPtr)break}HEAP32[outPtr>>>2]=0;return outPtr-startPtr}function lengthBytesUTF32(str){var len=0;for(var i=0;i<str.length;++i){var codeUnit=str.charCodeAt(i);if(codeUnit>=55296&&codeUnit<=57343)++i;len+=4}return len}function allocateUTF8(str){var size=lengthBytesUTF8(str)+1;var ret=_malloc(size);if(ret)stringToUTF8Array(str,HEAP8,ret,size);return ret}function allocateUTF8OnStack(str){var size=lengthBytesUTF8(str)+1;var ret=stackAlloc(size);stringToUTF8Array(str,HEAP8,ret,size);return ret}function writeArrayToMemory(array,buffer){HEAP8.set(array,buffer>>>0)}function writeAsciiToMemory(str,buffer,dontAddNull){for(var i=0;i<str.length;++i){HEAP8[buffer++>>>0]=str.charCodeAt(i)}if(!dontAddNull)HEAP8[buffer>>>0]=0}var WASM_PAGE_SIZE=65536;function alignUp(x,multiple){if(x%multiple>0){x+=multiple-x%multiple}return x}var buffer,HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAPF64;function updateGlobalBufferAndViews(buf){buffer=buf;Module["HEAP8"]=HEAP8=new Int8Array(buf);Module["HEAP16"]=HEAP16=new Int16Array(buf);Module["HEAP32"]=HEAP32=new Int32Array(buf);Module["HEAPU8"]=HEAPU8=new Uint8Array(buf);Module["HEAPU16"]=HEAPU16=new Uint16Array(buf);Module["HEAPU32"]=HEAPU32=new Uint32Array(buf);Module["HEAPF32"]=HEAPF32=new Float32Array(buf);Module["HEAPF64"]=HEAPF64=new Float64Array(buf)}var STACK_BASE=5953168;var INITIAL_INITIAL_MEMORY=Module["INITIAL_MEMORY"]||16777216;if(Module["wasmMemory"]){wasmMemory=Module["wasmMemory"]}else{wasmMemory=new WebAssembly.Memory({"initial":INITIAL_INITIAL_MEMORY/WASM_PAGE_SIZE,"maximum":4294967296/WASM_PAGE_SIZE})}if(wasmMemory){buffer=wasmMemory.buffer}INITIAL_INITIAL_MEMORY=buffer.byteLength;updateGlobalBufferAndViews(buffer);var __ATPRERUN__=[];var __ATINIT__=[];var __ATMAIN__=[];var __ATPOSTRUN__=[];var runtimeInitialized=false;var runtimeExited=false;function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift())}}callRuntimeCallbacks(__ATPRERUN__)}function initRuntime(){runtimeInitialized=true;callRuntimeCallbacks(__ATINIT__)}function preMain(){callRuntimeCallbacks(__ATMAIN__)}function exitRuntime(){runtimeExited=true}function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift())}}callRuntimeCallbacks(__ATPOSTRUN__)}function addOnPreRun(cb){__ATPRERUN__.unshift(cb)}function addOnPostRun(cb){__ATPOSTRUN__.unshift(cb)}var runDependencies=0;var runDependencyWatcher=null;var dependenciesFulfilled=null;function addRunDependency(id){runDependencies++;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}}function removeRunDependency(id){runDependencies--;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies)}if(runDependencies==0){if(runDependencyWatcher!==null){clearInterval(runDependencyWatcher);runDependencyWatcher=null}if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback()}}}Module["preloadedImages"]={};Module["preloadedAudios"]={};function abort(what){if(Module["onAbort"]){Module["onAbort"](what)}what+="";err(what);ABORT=true;EXITSTATUS=1;what="abort("+what+"). Build with -s ASSERTIONS=1 for more info.";var e=new WebAssembly.RuntimeError(what);readyPromiseReject(e);throw e}function hasPrefix(str,prefix){return String.prototype.startsWith?str.startsWith(prefix):str.indexOf(prefix)===0}var dataURIPrefix="data:application/octet-stream;base64,";function isDataURI(filename){return hasPrefix(filename,dataURIPrefix)}var fileURIPrefix="file://";var wasmBinaryFile="perspective.cpp.wasm";if(!isDataURI(wasmBinaryFile)){wasmBinaryFile=locateFile(wasmBinaryFile)}function getBinary(){try{if(wasmBinary){return new Uint8Array(wasmBinary)}if(readBinary){return readBinary(wasmBinaryFile)}else{throw"both async and sync fetching of the wasm failed"}}catch(err){abort(err)}}function getBinaryPromise(){if(!wasmBinary&&(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER)&&typeof fetch==="function"){return fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){if(!response["ok"]){throw"failed to load wasm binary file at '"+wasmBinaryFile+"'"}return response["arrayBuffer"]()}).catch(function(){return getBinary()})}return Promise.resolve().then(getBinary)}function createWasm(){var info={"env":asmLibraryArg,"wasi_snapshot_preview1":asmLibraryArg};function receiveInstance(instance,module){var exports=instance.exports;Module["asm"]=exports;wasmTable=Module["asm"]["__indirect_function_table"];removeRunDependency("wasm-instantiate")}addRunDependency("wasm-instantiate");function receiveInstantiatedSource(output){receiveInstance(output["instance"])}function instantiateArrayBuffer(receiver){return getBinaryPromise().then(function(binary){return WebAssembly.instantiate(binary,info)}).then(receiver,function(reason){err("failed to asynchronously prepare wasm: "+reason);abort(reason)})}function instantiateAsync(){if(!wasmBinary&&typeof WebAssembly.instantiateStreaming==="function"&&!isDataURI(wasmBinaryFile)&&typeof fetch==="function"){fetch(wasmBinaryFile,{credentials:"same-origin"}).then(function(response){var result=WebAssembly.instantiateStreaming(response,info);return result.then(receiveInstantiatedSource,function(reason){err("wasm streaming compile failed: "+reason);err("falling back to ArrayBuffer instantiation");return instantiateArrayBuffer(receiveInstantiatedSource)})})}else{return instantiateArrayBuffer(receiveInstantiatedSource)}}if(Module["instantiateWasm"]){try{var exports=Module["instantiateWasm"](info,receiveInstance);return exports}catch(e){err("Module.instantiateWasm callback failed with error: "+e);return false}}instantiateAsync();return{}}var tempDouble;var tempI64;var ASM_CONSTS={2511:function(){if(typeof self!=="undefined"){try{if(self.dispatchEvent&&!self._perspective_initialized&&self.document!==null){self._perspective_initialized=true;var event=self.document.createEvent("Event");event.initEvent("perspective-ready",false,true);self.dispatchEvent(event)}else if(!self.document&&self.postMessage){self.postMessage({})}}catch(e){}}},29912:function($0){throw new Error(UTF8ToString($0))}};function callRuntimeCallbacks(callbacks){while(callbacks.length>0){var callback=callbacks.shift();if(typeof callback=="function"){callback(Module);continue}var func=callback.func;if(typeof func==="number"){if(callback.arg===undefined){wasmTable.get(func)()}else{wasmTable.get(func)(callback.arg)}}else{func(callback.arg===undefined?null:callback.arg)}}}function demangle(func){return func}function demangleAll(text){var regex=/\b_Z[\w\d_]+/g;return text.replace(regex,function(x){var y=demangle(x);return x===y?x:y+" ["+x+"]"})}function jsStackTrace(){var error=new Error;if(!error.stack){try{throw new Error}catch(e){error=e}if(!error.stack){return"(no stack trace available)"}}return error.stack.toString()}var ExceptionInfoAttrs={DESTRUCTOR_OFFSET:0,REFCOUNT_OFFSET:4,TYPE_OFFSET:8,CAUGHT_OFFSET:12,RETHROWN_OFFSET:13,SIZE:16};function ___cxa_allocate_exception(size){return _malloc(size+ExceptionInfoAttrs.SIZE)+ExceptionInfoAttrs.SIZE}function _atexit(func,arg){}function ___cxa_atexit(a0,a1){return _atexit(a0,a1)}function ExceptionInfo(excPtr){this.excPtr=excPtr;this.ptr=excPtr-ExceptionInfoAttrs.SIZE;this.set_type=function(type){HEAP32[this.ptr+ExceptionInfoAttrs.TYPE_OFFSET>>>2]=type};this.get_type=function(){return HEAP32[this.ptr+ExceptionInfoAttrs.TYPE_OFFSET>>>2]};this.set_destructor=function(destructor){HEAP32[this.ptr+ExceptionInfoAttrs.DESTRUCTOR_OFFSET>>>2]=destructor};this.get_destructor=function(){return HEAP32[this.ptr+ExceptionInfoAttrs.DESTRUCTOR_OFFSET>>>2]};this.set_refcount=function(refcount){HEAP32[this.ptr+ExceptionInfoAttrs.REFCOUNT_OFFSET>>>2]=refcount};this.set_caught=function(caught){caught=caught?1:0;HEAP8[this.ptr+ExceptionInfoAttrs.CAUGHT_OFFSET>>>0]=caught};this.get_caught=function(){return HEAP8[this.ptr+ExceptionInfoAttrs.CAUGHT_OFFSET>>>0]!=0};this.set_rethrown=function(rethrown){rethrown=rethrown?1:0;HEAP8[this.ptr+ExceptionInfoAttrs.RETHROWN_OFFSET>>>0]=rethrown};this.get_rethrown=function(){return HEAP8[this.ptr+ExceptionInfoAttrs.RETHROWN_OFFSET>>>0]!=0};this.init=function(type,destructor){this.set_type(type);this.set_destructor(destructor);this.set_refcount(0);this.set_caught(false);this.set_rethrown(false)};this.add_ref=function(){var value=HEAP32[this.ptr+ExceptionInfoAttrs.REFCOUNT_OFFSET>>>2];HEAP32[this.ptr+ExceptionInfoAttrs.REFCOUNT_OFFSET>>>2]=value+1};this.release_ref=function(){var prev=HEAP32[this.ptr+ExceptionInfoAttrs.REFCOUNT_OFFSET>>>2];HEAP32[this.ptr+ExceptionInfoAttrs.REFCOUNT_OFFSET>>>2]=prev-1;return prev===1}}var exceptionLast=0;function __ZSt18uncaught_exceptionv(){return __ZSt18uncaught_exceptionv.uncaught_exceptions>0}function ___cxa_throw(ptr,type,destructor){var info=new ExceptionInfo(ptr);info.init(type,destructor);exceptionLast=ptr;if(!("uncaught_exception"in __ZSt18uncaught_exceptionv)){__ZSt18uncaught_exceptionv.uncaught_exceptions=1}else{__ZSt18uncaught_exceptionv.uncaught_exceptions++}throw ptr}function _tzset(){if(_tzset.called)return;_tzset.called=true;HEAP32[__get_timezone()>>>2]=(new Date).getTimezoneOffset()*60;var currentYear=(new Date).getFullYear();var winter=new Date(currentYear,0,1);var summer=new Date(currentYear,6,1);HEAP32[__get_daylight()>>>2]=Number(winter.getTimezoneOffset()!=summer.getTimezoneOffset());function extractZone(date){var match=date.toTimeString().match(/\(([A-Za-z ]+)\)$/);return match?match[1]:"GMT"}var winterName=extractZone(winter);var summerName=extractZone(summer);var winterNamePtr=allocateUTF8(winterName);var summerNamePtr=allocateUTF8(summerName);if(summer.getTimezoneOffset()<winter.getTimezoneOffset()){HEAP32[__get_tzname()>>>2]=winterNamePtr;HEAP32[__get_tzname()+4>>>2]=summerNamePtr}else{HEAP32[__get_tzname()>>>2]=summerNamePtr;HEAP32[__get_tzname()+4>>>2]=winterNamePtr}}function _localtime_r(time,tmPtr){_tzset();var date=new Date(HEAP32[time>>>2]*1e3);HEAP32[tmPtr>>>2]=date.getSeconds();HEAP32[tmPtr+4>>>2]=date.getMinutes();HEAP32[tmPtr+8>>>2]=date.getHours();HEAP32[tmPtr+12>>>2]=date.getDate();HEAP32[tmPtr+16>>>2]=date.getMonth();HEAP32[tmPtr+20>>>2]=date.getFullYear()-1900;HEAP32[tmPtr+24>>>2]=date.getDay();var start=new Date(date.getFullYear(),0,1);var yday=(date.getTime()-start.getTime())/(1e3*60*60*24)|0;HEAP32[tmPtr+28>>>2]=yday;HEAP32[tmPtr+36>>>2]=-(date.getTimezoneOffset()*60);var summerOffset=new Date(date.getFullYear(),6,1).getTimezoneOffset();var winterOffset=start.getTimezoneOffset();var dst=(summerOffset!=winterOffset&&date.getTimezoneOffset()==Math.min(winterOffset,summerOffset))|0;HEAP32[tmPtr+32>>>2]=dst;var zonePtr=HEAP32[__get_tzname()+(dst?4:0)>>>2];HEAP32[tmPtr+40>>>2]=zonePtr;return tmPtr}function ___localtime_r(a0,a1){return _localtime_r(a0,a1)}var PATH={splitPath:function(filename){var splitPathRe=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;return splitPathRe.exec(filename).slice(1)},normalizeArray:function(parts,allowAboveRoot){var up=0;for(var i=parts.length-1;i>=0;i--){var last=parts[i];if(last==="."){parts.splice(i,1)}else if(last===".."){parts.splice(i,1);up++}else if(up){parts.splice(i,1);up--}}if(allowAboveRoot){for(;up;up--){parts.unshift("..")}}return parts},normalize:function(path){var isAbsolute=path.charAt(0)==="/",trailingSlash=path.substr(-1)==="/";path=PATH.normalizeArray(path.split("/").filter(function(p){return!!p}),!isAbsolute).join("/");if(!path&&!isAbsolute){path="."}if(path&&trailingSlash){path+="/"}return(isAbsolute?"/":"")+path},dirname:function(path){var result=PATH.splitPath(path),root=result[0],dir=result[1];if(!root&&!dir){return"."}if(dir){dir=dir.substr(0,dir.length-1)}return root+dir},basename:function(path){if(path==="/")return"/";path=PATH.normalize(path);path=path.replace(/\/$/,"");var lastSlash=path.lastIndexOf("/");if(lastSlash===-1)return path;return path.substr(lastSlash+1)},extname:function(path){return PATH.splitPath(path)[3]},join:function(){var paths=Array.prototype.slice.call(arguments,0);return PATH.normalize(paths.join("/"))},join2:function(l,r){return PATH.normalize(l+"/"+r)}};var SYSCALLS={mappings:{},buffers:[null,[],[]],printChar:function(stream,curr){var buffer=SYSCALLS.buffers[stream];if(curr===0||curr===10){(stream===1?out:err)(UTF8ArrayToString(buffer,0));buffer.length=0}else{buffer.push(curr)}},varargs:undefined,get:function(){SYSCALLS.varargs+=4;var ret=HEAP32[SYSCALLS.varargs-4>>>2];return ret},getStr:function(ptr){var ret=UTF8ToString(ptr);return ret},get64:function(low,high){return low}};function ___sys_ftruncate64(fd,zero,low,high){}function ___sys_getpid(){return 42}function ___sys_madvise1(addr,length,advice){return 0}function syscallMmap2(addr,len,prot,flags,fd,off){off<<=12;var ptr;var allocated=false;if((flags&16)!==0&&addr%16384!==0){return-28}if((flags&32)!==0){ptr=_memalign(16384,len);if(!ptr)return-48;_memset(ptr,0,len);allocated=true}else{return-52}ptr>>>=0;SYSCALLS.mappings[ptr]={malloc:ptr,len:len,allocated:allocated,fd:fd,prot:prot,flags:flags,offset:off};return ptr}function ___sys_mmap2(addr,len,prot,flags,fd,off){return syscallMmap2(addr,len,prot,flags,fd,off)}function ___sys_mremap(old_addr,old_size,new_size,flags){return-48}function syscallMunmap(addr,len){addr>>>=0;if((addr|0)===-1||len===0){return-28}var info=SYSCALLS.mappings[addr];if(!info)return 0;if(len===info.len){SYSCALLS.mappings[addr]=null;if(info.allocated){_free(info.malloc)}}return 0}function ___sys_munmap(addr,len){return syscallMunmap(addr,len)}function ___sys_open(path,flags,varargs){SYSCALLS.varargs=varargs}function ___sys_unlink(path){}var structRegistrations={};function runDestructors(destructors){while(destructors.length){var ptr=destructors.pop();var del=destructors.pop();del(ptr)}}function simpleReadValueFromPointer(pointer){return this["fromWireType"](HEAPU32[pointer>>>2])}var awaitingDependencies={};var registeredTypes={};var typeDependencies={};var char_0=48;var char_9=57;function makeLegalFunctionName(name){if(undefined===name){return"_unknown"}name=name.replace(/[^a-zA-Z0-9_]/g,"$");var f=name.charCodeAt(0);if(f>=char_0&&f<=char_9){return"_"+name}else{return name}}function createNamedFunction(name,body){name=makeLegalFunctionName(name);return new Function("body","return function "+name+"() {\n"+'    "use strict";'+"    return body.apply(this, arguments);\n"+"};\n")(body)}function extendError(baseErrorType,errorName){var errorClass=createNamedFunction(errorName,function(message){this.name=errorName;this.message=message;var stack=new Error(message).stack;if(stack!==undefined){this.stack=this.toString()+"\n"+stack.replace(/^Error(:[^\n]*)?\n/,"")}});errorClass.prototype=Object.create(baseErrorType.prototype);errorClass.prototype.constructor=errorClass;errorClass.prototype.toString=function(){if(this.message===undefined){return this.name}else{return this.name+": "+this.message}};return errorClass}var InternalError=undefined;function throwInternalError(message){throw new InternalError(message)}function whenDependentTypesAreResolved(myTypes,dependentTypes,getTypeConverters){myTypes.forEach(function(type){typeDependencies[type]=dependentTypes});function onComplete(typeConverters){var myTypeConverters=getTypeConverters(typeConverters);if(myTypeConverters.length!==myTypes.length){throwInternalError("Mismatched type converter count")}for(var i=0;i<myTypes.length;++i){registerType(myTypes[i],myTypeConverters[i])}}var typeConverters=new Array(dependentTypes.length);var unregisteredTypes=[];var registered=0;dependentTypes.forEach(function(dt,i){if(registeredTypes.hasOwnProperty(dt)){typeConverters[i]=registeredTypes[dt]}else{unregisteredTypes.push(dt);if(!awaitingDependencies.hasOwnProperty(dt)){awaitingDependencies[dt]=[]}awaitingDependencies[dt].push(function(){typeConverters[i]=registeredTypes[dt];++registered;if(registered===unregisteredTypes.length){onComplete(typeConverters)}})}});if(0===unregisteredTypes.length){onComplete(typeConverters)}}function __embind_finalize_value_object(structType){var reg=structRegistrations[structType];delete structRegistrations[structType];var rawConstructor=reg.rawConstructor;var rawDestructor=reg.rawDestructor;var fieldRecords=reg.fields;var fieldTypes=fieldRecords.map(function(field){return field.getterReturnType}).concat(fieldRecords.map(function(field){return field.setterArgumentType}));whenDependentTypesAreResolved([structType],fieldTypes,function(fieldTypes){var fields={};fieldRecords.forEach(function(field,i){var fieldName=field.fieldName;var getterReturnType=fieldTypes[i];var getter=field.getter;var getterContext=field.getterContext;var setterArgumentType=fieldTypes[i+fieldRecords.length];var setter=field.setter;var setterContext=field.setterContext;fields[fieldName]={read:function(ptr){return getterReturnType["fromWireType"](getter(getterContext,ptr))},write:function(ptr,o){var destructors=[];setter(setterContext,ptr,setterArgumentType["toWireType"](destructors,o));runDestructors(destructors)}}});return[{name:reg.name,"fromWireType":function(ptr){var rv={};for(var i in fields){rv[i]=fields[i].read(ptr)}rawDestructor(ptr);return rv},"toWireType":function(destructors,o){for(var fieldName in fields){if(!(fieldName in o)){throw new TypeError('Missing field:  "'+fieldName+'"')}}var ptr=rawConstructor();for(fieldName in fields){fields[fieldName].write(ptr,o[fieldName])}if(destructors!==null){destructors.push(rawDestructor,ptr)}return ptr},"argPackAdvance":8,"readValueFromPointer":simpleReadValueFromPointer,destructorFunction:rawDestructor}]})}function getShiftFromSize(size){switch(size){case 1:return 0;case 2:return 1;case 4:return 2;case 8:return 3;default:throw new TypeError("Unknown type size: "+size)}}function embind_init_charCodes(){var codes=new Array(256);for(var i=0;i<256;++i){codes[i]=String.fromCharCode(i)}embind_charCodes=codes}var embind_charCodes=undefined;function readLatin1String(ptr){var ret="";var c=ptr;while(HEAPU8[c>>>0]){ret+=embind_charCodes[HEAPU8[c++>>>0]]}return ret}var BindingError=undefined;function throwBindingError(message){throw new BindingError(message)}function registerType(rawType,registeredInstance,options){options=options||{};if(!("argPackAdvance"in registeredInstance)){throw new TypeError("registerType registeredInstance requires argPackAdvance")}var name=registeredInstance.name;if(!rawType){throwBindingError('type "'+name+'" must have a positive integer typeid pointer')}if(registeredTypes.hasOwnProperty(rawType)){if(options.ignoreDuplicateRegistrations){return}else{throwBindingError("Cannot register type '"+name+"' twice")}}registeredTypes[rawType]=registeredInstance;delete typeDependencies[rawType];if(awaitingDependencies.hasOwnProperty(rawType)){var callbacks=awaitingDependencies[rawType];delete awaitingDependencies[rawType];callbacks.forEach(function(cb){cb()})}}function __embind_register_bool(rawType,name,size,trueValue,falseValue){var shift=getShiftFromSize(size);name=readLatin1String(name);registerType(rawType,{name:name,"fromWireType":function(wt){return!!wt},"toWireType":function(destructors,o){return o?trueValue:falseValue},"argPackAdvance":8,"readValueFromPointer":function(pointer){var heap;if(size===1){heap=HEAP8}else if(size===2){heap=HEAP16}else if(size===4){heap=HEAP32}else{throw new TypeError("Unknown boolean type size: "+name)}return this["fromWireType"](heap[pointer>>>shift])},destructorFunction:null})}function ClassHandle_isAliasOf(other){if(!(this instanceof ClassHandle)){return false}if(!(other instanceof ClassHandle)){return false}var leftClass=this.$$.ptrType.registeredClass;var left=this.$$.ptr;var rightClass=other.$$.ptrType.registeredClass;var right=other.$$.ptr;while(leftClass.baseClass){left=leftClass.upcast(left);leftClass=leftClass.baseClass}while(rightClass.baseClass){right=rightClass.upcast(right);rightClass=rightClass.baseClass}return leftClass===rightClass&&left===right}function shallowCopyInternalPointer(o){return{count:o.count,deleteScheduled:o.deleteScheduled,preservePointerOnDelete:o.preservePointerOnDelete,ptr:o.ptr,ptrType:o.ptrType,smartPtr:o.smartPtr,smartPtrType:o.smartPtrType}}function throwInstanceAlreadyDeleted(obj){function getInstanceTypeName(handle){return handle.$$.ptrType.registeredClass.name}throwBindingError(getInstanceTypeName(obj)+" instance already deleted")}var finalizationGroup=false;function detachFinalizer(handle){}function runDestructor($$){if($$.smartPtr){$$.smartPtrType.rawDestructor($$.smartPtr)}else{$$.ptrType.registeredClass.rawDestructor($$.ptr)}}function releaseClassHandle($$){$$.count.value-=1;var toDelete=0===$$.count.value;if(toDelete){runDestructor($$)}}function attachFinalizer(handle){if("undefined"===typeof FinalizationGroup){attachFinalizer=function(handle){return handle};return handle}finalizationGroup=new FinalizationGroup(function(iter){for(var result=iter.next();!result.done;result=iter.next()){var $$=result.value;if(!$$.ptr){console.warn("object already deleted: "+$$.ptr)}else{releaseClassHandle($$)}}});attachFinalizer=function(handle){finalizationGroup.register(handle,handle.$$,handle.$$);return handle};detachFinalizer=function(handle){finalizationGroup.unregister(handle.$$)};return attachFinalizer(handle)}function ClassHandle_clone(){if(!this.$$.ptr){throwInstanceAlreadyDeleted(this)}if(this.$$.preservePointerOnDelete){this.$$.count.value+=1;return this}else{var clone=attachFinalizer(Object.create(Object.getPrototypeOf(this),{$$:{value:shallowCopyInternalPointer(this.$$)}}));clone.$$.count.value+=1;clone.$$.deleteScheduled=false;return clone}}function ClassHandle_delete(){if(!this.$$.ptr){throwInstanceAlreadyDeleted(this)}if(this.$$.deleteScheduled&&!this.$$.preservePointerOnDelete){throwBindingError("Object already scheduled for deletion")}detachFinalizer(this);releaseClassHandle(this.$$);if(!this.$$.preservePointerOnDelete){this.$$.smartPtr=undefined;this.$$.ptr=undefined}}function ClassHandle_isDeleted(){return!this.$$.ptr}var delayFunction=undefined;var deletionQueue=[];function flushPendingDeletes(){while(deletionQueue.length){var obj=deletionQueue.pop();obj.$$.deleteScheduled=false;obj["delete"]()}}function ClassHandle_deleteLater(){if(!this.$$.ptr){throwInstanceAlreadyDeleted(this)}if(this.$$.deleteScheduled&&!this.$$.preservePointerOnDelete){throwBindingError("Object already scheduled for deletion")}deletionQueue.push(this);if(deletionQueue.length===1&&delayFunction){delayFunction(flushPendingDeletes)}this.$$.deleteScheduled=true;return this}function init_ClassHandle(){ClassHandle.prototype["isAliasOf"]=ClassHandle_isAliasOf;ClassHandle.prototype["clone"]=ClassHandle_clone;ClassHandle.prototype["delete"]=ClassHandle_delete;ClassHandle.prototype["isDeleted"]=ClassHandle_isDeleted;ClassHandle.prototype["deleteLater"]=ClassHandle_deleteLater}function ClassHandle(){}var registeredPointers={};function ensureOverloadTable(proto,methodName,humanName){if(undefined===proto[methodName].overloadTable){var prevFunc=proto[methodName];proto[methodName]=function(){if(!proto[methodName].overloadTable.hasOwnProperty(arguments.length)){throwBindingError("Function '"+humanName+"' called with an invalid number of arguments ("+arguments.length+") - expects one of ("+proto[methodName].overloadTable+")!")}return proto[methodName].overloadTable[arguments.length].apply(this,arguments)};proto[methodName].overloadTable=[];proto[methodName].overloadTable[prevFunc.argCount]=prevFunc}}function exposePublicSymbol(name,value,numArguments){if(Module.hasOwnProperty(name)){if(undefined===numArguments||undefined!==Module[name].overloadTable&&undefined!==Module[name].overloadTable[numArguments]){throwBindingError("Cannot register public name '"+name+"' twice")}ensureOverloadTable(Module,name,name);if(Module.hasOwnProperty(numArguments)){throwBindingError("Cannot register multiple overloads of a function with the same number of arguments ("+numArguments+")!")}Module[name].overloadTable[numArguments]=value}else{Module[name]=value;if(undefined!==numArguments){Module[name].numArguments=numArguments}}}function RegisteredClass(name,constructor,instancePrototype,rawDestructor,baseClass,getActualType,upcast,downcast){this.name=name;this.constructor=constructor;this.instancePrototype=instancePrototype;this.rawDestructor=rawDestructor;this.baseClass=baseClass;this.getActualType=getActualType;this.upcast=upcast;this.downcast=downcast;this.pureVirtualFunctions=[]}function upcastPointer(ptr,ptrClass,desiredClass){while(ptrClass!==desiredClass){if(!ptrClass.upcast){throwBindingError("Expected null or instance of "+desiredClass.name+", got an instance of "+ptrClass.name)}ptr=ptrClass.upcast(ptr);ptrClass=ptrClass.baseClass}return ptr}function constNoSmartPtrRawPointerToWireType(destructors,handle){if(handle===null){if(this.isReference){throwBindingError("null is not a valid "+this.name)}return 0}if(!handle.$$){throwBindingError('Cannot pass "'+_embind_repr(handle)+'" as a '+this.name)}if(!handle.$$.ptr){throwBindingError("Cannot pass deleted object as a pointer of type "+this.name)}var handleClass=handle.$$.ptrType.registeredClass;var ptr=upcastPointer(handle.$$.ptr,handleClass,this.registeredClass);return ptr}function genericPointerToWireType(destructors,handle){var ptr;if(handle===null){if(this.isReference){throwBindingError("null is not a valid "+this.name)}if(this.isSmartPointer){ptr=this.rawConstructor();if(destructors!==null){destructors.push(this.rawDestructor,ptr)}return ptr}else{return 0}}if(!handle.$$){throwBindingError('Cannot pass "'+_embind_repr(handle)+'" as a '+this.name)}if(!handle.$$.ptr){throwBindingError("Cannot pass deleted object as a pointer of type "+this.name)}if(!this.isConst&&handle.$$.ptrType.isConst){throwBindingError("Cannot convert argument of type "+(handle.$$.smartPtrType?handle.$$.smartPtrType.name:handle.$$.ptrType.name)+" to parameter type "+this.name)}var handleClass=handle.$$.ptrType.registeredClass;ptr=upcastPointer(handle.$$.ptr,handleClass,this.registeredClass);if(this.isSmartPointer){if(undefined===handle.$$.smartPtr){throwBindingError("Passing raw pointer to smart pointer is illegal")}switch(this.sharingPolicy){case 0:if(handle.$$.smartPtrType===this){ptr=handle.$$.smartPtr}else{throwBindingError("Cannot convert argument of type "+(handle.$$.smartPtrType?handle.$$.smartPtrType.name:handle.$$.ptrType.name)+" to parameter type "+this.name)}break;case 1:ptr=handle.$$.smartPtr;break;case 2:if(handle.$$.smartPtrType===this){ptr=handle.$$.smartPtr}else{var clonedHandle=handle["clone"]();ptr=this.rawShare(ptr,__emval_register(function(){clonedHandle["delete"]()}));if(destructors!==null){destructors.push(this.rawDestructor,ptr)}}break;default:throwBindingError("Unsupporting sharing policy")}}return ptr}function nonConstNoSmartPtrRawPointerToWireType(destructors,handle){if(handle===null){if(this.isReference){throwBindingError("null is not a valid "+this.name)}return 0}if(!handle.$$){throwBindingError('Cannot pass "'+_embind_repr(handle)+'" as a '+this.name)}if(!handle.$$.ptr){throwBindingError("Cannot pass deleted object as a pointer of type "+this.name)}if(handle.$$.ptrType.isConst){throwBindingError("Cannot convert argument of type "+handle.$$.ptrType.name+" to parameter type "+this.name)}var handleClass=handle.$$.ptrType.registeredClass;var ptr=upcastPointer(handle.$$.ptr,handleClass,this.registeredClass);return ptr}function RegisteredPointer_getPointee(ptr){if(this.rawGetPointee){ptr=this.rawGetPointee(ptr)}return ptr}function RegisteredPointer_destructor(ptr){if(this.rawDestructor){this.rawDestructor(ptr)}}function RegisteredPointer_deleteObject(handle){if(handle!==null){handle["delete"]()}}function downcastPointer(ptr,ptrClass,desiredClass){if(ptrClass===desiredClass){return ptr}if(undefined===desiredClass.baseClass){return null}var rv=downcastPointer(ptr,ptrClass,desiredClass.baseClass);if(rv===null){return null}return desiredClass.downcast(rv)}function getInheritedInstanceCount(){return Object.keys(registeredInstances).length}function getLiveInheritedInstances(){var rv=[];for(var k in registeredInstances){if(registeredInstances.hasOwnProperty(k)){rv.push(registeredInstances[k])}}return rv}function setDelayFunction(fn){delayFunction=fn;if(deletionQueue.length&&delayFunction){delayFunction(flushPendingDeletes)}}function init_embind(){Module["getInheritedInstanceCount"]=getInheritedInstanceCount;Module["getLiveInheritedInstances"]=getLiveInheritedInstances;Module["flushPendingDeletes"]=flushPendingDeletes;Module["setDelayFunction"]=setDelayFunction}var registeredInstances={};function getBasestPointer(class_,ptr){if(ptr===undefined){throwBindingError("ptr should not be undefined")}while(class_.baseClass){ptr=class_.upcast(ptr);class_=class_.baseClass}return ptr}function getInheritedInstance(class_,ptr){ptr=getBasestPointer(class_,ptr);return registeredInstances[ptr]}function makeClassHandle(prototype,record){if(!record.ptrType||!record.ptr){throwInternalError("makeClassHandle requires ptr and ptrType")}var hasSmartPtrType=!!record.smartPtrType;var hasSmartPtr=!!record.smartPtr;if(hasSmartPtrType!==hasSmartPtr){throwInternalError("Both smartPtrType and smartPtr must be specified")}record.count={value:1};return attachFinalizer(Object.create(prototype,{$$:{value:record}}))}function RegisteredPointer_fromWireType(ptr){var rawPointer=this.getPointee(ptr);if(!rawPointer){this.destructor(ptr);return null}var registeredInstance=getInheritedInstance(this.registeredClass,rawPointer);if(undefined!==registeredInstance){if(0===registeredInstance.$$.count.value){registeredInstance.$$.ptr=rawPointer;registeredInstance.$$.smartPtr=ptr;return registeredInstance["clone"]()}else{var rv=registeredInstance["clone"]();this.destructor(ptr);return rv}}function makeDefaultHandle(){if(this.isSmartPointer){return makeClassHandle(this.registeredClass.instancePrototype,{ptrType:this.pointeeType,ptr:rawPointer,smartPtrType:this,smartPtr:ptr})}else{return makeClassHandle(this.registeredClass.instancePrototype,{ptrType:this,ptr:ptr})}}var actualType=this.registeredClass.getActualType(rawPointer);var registeredPointerRecord=registeredPointers[actualType];if(!registeredPointerRecord){return makeDefaultHandle.call(this)}var toType;if(this.isConst){toType=registeredPointerRecord.constPointerType}else{toType=registeredPointerRecord.pointerType}var dp=downcastPointer(rawPointer,this.registeredClass,toType.registeredClass);if(dp===null){return makeDefaultHandle.call(this)}if(this.isSmartPointer){return makeClassHandle(toType.registeredClass.instancePrototype,{ptrType:toType,ptr:dp,smartPtrType:this,smartPtr:ptr})}else{return makeClassHandle(toType.registeredClass.instancePrototype,{ptrType:toType,ptr:dp})}}function init_RegisteredPointer(){RegisteredPointer.prototype.getPointee=RegisteredPointer_getPointee;RegisteredPointer.prototype.destructor=RegisteredPointer_destructor;RegisteredPointer.prototype["argPackAdvance"]=8;RegisteredPointer.prototype["readValueFromPointer"]=simpleReadValueFromPointer;RegisteredPointer.prototype["deleteObject"]=RegisteredPointer_deleteObject;RegisteredPointer.prototype["fromWireType"]=RegisteredPointer_fromWireType}function RegisteredPointer(name,registeredClass,isReference,isConst,isSmartPointer,pointeeType,sharingPolicy,rawGetPointee,rawConstructor,rawShare,rawDestructor){this.name=name;this.registeredClass=registeredClass;this.isReference=isReference;this.isConst=isConst;this.isSmartPointer=isSmartPointer;this.pointeeType=pointeeType;this.sharingPolicy=sharingPolicy;this.rawGetPointee=rawGetPointee;this.rawConstructor=rawConstructor;this.rawShare=rawShare;this.rawDestructor=rawDestructor;if(!isSmartPointer&&registeredClass.baseClass===undefined){if(isConst){this["toWireType"]=constNoSmartPtrRawPointerToWireType;this.destructorFunction=null}else{this["toWireType"]=nonConstNoSmartPtrRawPointerToWireType;this.destructorFunction=null}}else{this["toWireType"]=genericPointerToWireType}}function replacePublicSymbol(name,value,numArguments){if(!Module.hasOwnProperty(name)){throwInternalError("Replacing nonexistant public symbol")}if(undefined!==Module[name].overloadTable&&undefined!==numArguments){Module[name].overloadTable[numArguments]=value}else{Module[name]=value;Module[name].argCount=numArguments}}function embind__requireFunction(signature,rawFunction){signature=readLatin1String(signature);function makeDynCaller(){return wasmTable.get(rawFunction)}var fp=makeDynCaller();if(typeof fp!=="function"){throwBindingError("unknown function pointer with signature "+signature+": "+rawFunction)}return fp}var UnboundTypeError=undefined;function getTypeName(type){var ptr=___getTypeName(type);var rv=readLatin1String(ptr);_free(ptr);return rv}function throwUnboundTypeError(message,types){var unboundTypes=[];var seen={};function visit(type){if(seen[type]){return}if(registeredTypes[type]){return}if(typeDependencies[type]){typeDependencies[type].forEach(visit);return}unboundTypes.push(type);seen[type]=true}types.forEach(visit);throw new UnboundTypeError(message+": "+unboundTypes.map(getTypeName).join([", "]))}function __embind_register_class(rawType,rawPointerType,rawConstPointerType,baseClassRawType,getActualTypeSignature,getActualType,upcastSignature,upcast,downcastSignature,downcast,name,destructorSignature,rawDestructor){name=readLatin1String(name);getActualType=embind__requireFunction(getActualTypeSignature,getActualType);if(upcast){upcast=embind__requireFunction(upcastSignature,upcast)}if(downcast){downcast=embind__requireFunction(downcastSignature,downcast)}rawDestructor=embind__requireFunction(destructorSignature,rawDestructor);var legalFunctionName=makeLegalFunctionName(name);exposePublicSymbol(legalFunctionName,function(){throwUnboundTypeError("Cannot construct "+name+" due to unbound types",[baseClassRawType])});whenDependentTypesAreResolved([rawType,rawPointerType,rawConstPointerType],baseClassRawType?[baseClassRawType]:[],function(base){base=base[0];var baseClass;var basePrototype;if(baseClassRawType){baseClass=base.registeredClass;basePrototype=baseClass.instancePrototype}else{basePrototype=ClassHandle.prototype}var constructor=createNamedFunction(legalFunctionName,function(){if(Object.getPrototypeOf(this)!==instancePrototype){throw new BindingError("Use 'new' to construct "+name)}if(undefined===registeredClass.constructor_body){throw new BindingError(name+" has no accessible constructor")}var body=registeredClass.constructor_body[arguments.length];if(undefined===body){throw new BindingError("Tried to invoke ctor of "+name+" with invalid number of parameters ("+arguments.length+") - expected ("+Object.keys(registeredClass.constructor_body).toString()+") parameters instead!")}return body.apply(this,arguments)});var instancePrototype=Object.create(basePrototype,{constructor:{value:constructor}});constructor.prototype=instancePrototype;var registeredClass=new RegisteredClass(name,constructor,instancePrototype,rawDestructor,baseClass,getActualType,upcast,downcast);var referenceConverter=new RegisteredPointer(name,registeredClass,true,false,false);var pointerConverter=new RegisteredPointer(name+"*",registeredClass,false,false,false);var constPointerConverter=new RegisteredPointer(name+" const*",registeredClass,false,true,false);registeredPointers[rawType]={pointerType:pointerConverter,constPointerType:constPointerConverter};replacePublicSymbol(legalFunctionName,constructor);return[referenceConverter,pointerConverter,constPointerConverter]})}function heap32VectorToArray(count,firstElement){var array=[];for(var i=0;i<count;i++){array.push(HEAP32[(firstElement>>2)+i>>>0])}return array}function __embind_register_class_constructor(rawClassType,argCount,rawArgTypesAddr,invokerSignature,invoker,rawConstructor){assert(argCount>0);var rawArgTypes=heap32VectorToArray(argCount,rawArgTypesAddr);invoker=embind__requireFunction(invokerSignature,invoker);var args=[rawConstructor];var destructors=[];whenDependentTypesAreResolved([],[rawClassType],function(classType){classType=classType[0];var humanName="constructor "+classType.name;if(undefined===classType.registeredClass.constructor_body){classType.registeredClass.constructor_body=[]}if(undefined!==classType.registeredClass.constructor_body[argCount-1]){throw new BindingError("Cannot register multiple constructors with identical number of parameters ("+(argCount-1)+") for class '"+classType.name+"'! Overload resolution is currently only performed using the parameter count, not actual type info!")}classType.registeredClass.constructor_body[argCount-1]=function unboundTypeHandler(){throwUnboundTypeError("Cannot construct "+classType.name+" due to unbound types",rawArgTypes)};whenDependentTypesAreResolved([],rawArgTypes,function(argTypes){classType.registeredClass.constructor_body[argCount-1]=function constructor_body(){if(arguments.length!==argCount-1){throwBindingError(humanName+" called with "+arguments.length+" arguments, expected "+(argCount-1))}destructors.length=0;args.length=argCount;for(var i=1;i<argCount;++i){args[i]=argTypes[i]["toWireType"](destructors,arguments[i-1])}var ptr=invoker.apply(null,args);runDestructors(destructors);return argTypes[0]["fromWireType"](ptr)};return[]});return[]})}function new_(constructor,argumentList){if(!(constructor instanceof Function)){throw new TypeError("new_ called with constructor type "+typeof constructor+" which is not a function")}var dummy=createNamedFunction(constructor.name||"unknownFunctionName",function(){});dummy.prototype=constructor.prototype;var obj=new dummy;var r=constructor.apply(obj,argumentList);return r instanceof Object?r:obj}function craftInvokerFunction(humanName,argTypes,classType,cppInvokerFunc,cppTargetFunc){var argCount=argTypes.length;if(argCount<2){throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!")}var isClassMethodFunc=argTypes[1]!==null&&classType!==null;var needsDestructorStack=false;for(var i=1;i<argTypes.length;++i){if(argTypes[i]!==null&&argTypes[i].destructorFunction===undefined){needsDestructorStack=true;break}}var returns=argTypes[0].name!=="void";var argsList="";var argsListWired="";for(var i=0;i<argCount-2;++i){argsList+=(i!==0?", ":"")+"arg"+i;argsListWired+=(i!==0?", ":"")+"arg"+i+"Wired"}var invokerFnBody="return function "+makeLegalFunctionName(humanName)+"("+argsList+") {\n"+"if (arguments.length !== "+(argCount-2)+") {\n"+"throwBindingError('function "+humanName+" called with ' + arguments.length + ' arguments, expected "+(argCount-2)+" args!');\n"+"}\n";if(needsDestructorStack){invokerFnBody+="var destructors = [];\n"}var dtorStack=needsDestructorStack?"destructors":"null";var args1=["throwBindingError","invoker","fn","runDestructors","retType","classParam"];var args2=[throwBindingError,cppInvokerFunc,cppTargetFunc,runDestructors,argTypes[0],argTypes[1]];if(isClassMethodFunc){invokerFnBody+="var thisWired = classParam.toWireType("+dtorStack+", this);\n"}for(var i=0;i<argCount-2;++i){invokerFnBody+="var arg"+i+"Wired = argType"+i+".toWireType("+dtorStack+", arg"+i+"); // "+argTypes[i+2].name+"\n";args1.push("argType"+i);args2.push(argTypes[i+2])}if(isClassMethodFunc){argsListWired="thisWired"+(argsListWired.length>0?", ":"")+argsListWired}invokerFnBody+=(returns?"var rv = ":"")+"invoker(fn"+(argsListWired.length>0?", ":"")+argsListWired+");\n";if(needsDestructorStack){invokerFnBody+="runDestructors(destructors);\n"}else{for(var i=isClassMethodFunc?1:2;i<argTypes.length;++i){var paramName=i===1?"thisWired":"arg"+(i-2)+"Wired";if(argTypes[i].destructorFunction!==null){invokerFnBody+=paramName+"_dtor("+paramName+"); // "+argTypes[i].name+"\n";args1.push(paramName+"_dtor");args2.push(argTypes[i].destructorFunction)}}}if(returns){invokerFnBody+="var ret = retType.fromWireType(rv);\n"+"return ret;\n"}else{}invokerFnBody+="}\n";args1.push(invokerFnBody);var invokerFunction=new_(Function,args1).apply(null,args2);return invokerFunction}function __embind_register_class_function(rawClassType,methodName,argCount,rawArgTypesAddr,invokerSignature,rawInvoker,context,isPureVirtual){var rawArgTypes=heap32VectorToArray(argCount,rawArgTypesAddr);methodName=readLatin1String(methodName);rawInvoker=embind__requireFunction(invokerSignature,rawInvoker);whenDependentTypesAreResolved([],[rawClassType],function(classType){classType=classType[0];var humanName=classType.name+"."+methodName;if(isPureVirtual){classType.registeredClass.pureVirtualFunctions.push(methodName)}function unboundTypesHandler(){throwUnboundTypeError("Cannot call "+humanName+" due to unbound types",rawArgTypes)}var proto=classType.registeredClass.instancePrototype;var method=proto[methodName];if(undefined===method||undefined===method.overloadTable&&method.className!==classType.name&&method.argCount===argCount-2){unboundTypesHandler.argCount=argCount-2;unboundTypesHandler.className=classType.name;proto[methodName]=unboundTypesHandler}else{ensureOverloadTable(proto,methodName,humanName);proto[methodName].overloadTable[argCount-2]=unboundTypesHandler}whenDependentTypesAreResolved([],rawArgTypes,function(argTypes){var memberFunction=craftInvokerFunction(humanName,argTypes,classType,rawInvoker,context);if(undefined===proto[methodName].overloadTable){memberFunction.argCount=argCount-2;proto[methodName]=memberFunction}else{proto[methodName].overloadTable[argCount-2]=memberFunction}return[]});return[]})}var emval_free_list=[];var emval_handle_array=[{},{value:undefined},{value:null},{value:true},{value:false}];function __emval_decref(handle){if(handle>4&&0===--emval_handle_array[handle].refcount){emval_handle_array[handle]=undefined;emval_free_list.push(handle)}}function count_emval_handles(){var count=0;for(var i=5;i<emval_handle_array.length;++i){if(emval_handle_array[i]!==undefined){++count}}return count}function get_first_emval(){for(var i=5;i<emval_handle_array.length;++i){if(emval_handle_array[i]!==undefined){return emval_handle_array[i]}}return null}function init_emval(){Module["count_emval_handles"]=count_emval_handles;Module["get_first_emval"]=get_first_emval}function __emval_register(value){switch(value){case undefined:{return 1}case null:{return 2}case true:{return 3}case false:{return 4}default:{var handle=emval_free_list.length?emval_free_list.pop():emval_handle_array.length;emval_handle_array[handle]={refcount:1,value:value};return handle}}}function __embind_register_emval(rawType,name){name=readLatin1String(name);registerType(rawType,{name:name,"fromWireType":function(handle){var rv=emval_handle_array[handle].value;__emval_decref(handle);return rv},"toWireType":function(destructors,value){return __emval_register(value)},"argPackAdvance":8,"readValueFromPointer":simpleReadValueFromPointer,destructorFunction:null})}function enumReadValueFromPointer(name,shift,signed){switch(shift){case 0:return function(pointer){var heap=signed?HEAP8:HEAPU8;return this["fromWireType"](heap[pointer>>>0])};case 1:return function(pointer){var heap=signed?HEAP16:HEAPU16;return this["fromWireType"](heap[pointer>>>1])};case 2:return function(pointer){var heap=signed?HEAP32:HEAPU32;return this["fromWireType"](heap[pointer>>>2])};default:throw new TypeError("Unknown integer type: "+name)}}function __embind_register_enum(rawType,name,size,isSigned){var shift=getShiftFromSize(size);name=readLatin1String(name);function ctor(){}ctor.values={};registerType(rawType,{name:name,constructor:ctor,"fromWireType":function(c){return this.constructor.values[c]},"toWireType":function(destructors,c){return c.value},"argPackAdvance":8,"readValueFromPointer":enumReadValueFromPointer(name,shift,isSigned),destructorFunction:null});exposePublicSymbol(name,ctor)}function requireRegisteredType(rawType,humanName){var impl=registeredTypes[rawType];if(undefined===impl){throwBindingError(humanName+" has unknown type "+getTypeName(rawType))}return impl}function __embind_register_enum_value(rawEnumType,name,enumValue){var enumType=requireRegisteredType(rawEnumType,"enum");name=readLatin1String(name);var Enum=enumType.constructor;var Value=Object.create(enumType.constructor.prototype,{value:{value:enumValue},constructor:{value:createNamedFunction(enumType.name+"_"+name,function(){})}});Enum.values[enumValue]=Value;Enum[name]=Value}function _embind_repr(v){if(v===null){return"null"}var t=typeof v;if(t==="object"||t==="array"||t==="function"){return v.toString()}else{return""+v}}function floatReadValueFromPointer(name,shift){switch(shift){case 2:return function(pointer){return this["fromWireType"](HEAPF32[pointer>>>2])};case 3:return function(pointer){return this["fromWireType"](HEAPF64[pointer>>>3])};default:throw new TypeError("Unknown float type: "+name)}}function __embind_register_float(rawType,name,size){var shift=getShiftFromSize(size);name=readLatin1String(name);registerType(rawType,{name:name,"fromWireType":function(value){return value},"toWireType":function(destructors,value){if(typeof value!=="number"&&typeof value!=="boolean"){throw new TypeError('Cannot convert "'+_embind_repr(value)+'" to '+this.name)}return value},"argPackAdvance":8,"readValueFromPointer":floatReadValueFromPointer(name,shift),destructorFunction:null})}function __embind_register_function(name,argCount,rawArgTypesAddr,signature,rawInvoker,fn){var argTypes=heap32VectorToArray(argCount,rawArgTypesAddr);name=readLatin1String(name);rawInvoker=embind__requireFunction(signature,rawInvoker);exposePublicSymbol(name,function(){throwUnboundTypeError("Cannot call "+name+" due to unbound types",argTypes)},argCount-1);whenDependentTypesAreResolved([],argTypes,function(argTypes){var invokerArgsArray=[argTypes[0],null].concat(argTypes.slice(1));replacePublicSymbol(name,craftInvokerFunction(name,invokerArgsArray,null,rawInvoker,fn),argCount-1);return[]})}function integerReadValueFromPointer(name,shift,signed){switch(shift){case 0:return signed?function readS8FromPointer(pointer){return HEAP8[pointer>>>0]}:function readU8FromPointer(pointer){return HEAPU8[pointer>>>0]};case 1:return signed?function readS16FromPointer(pointer){return HEAP16[pointer>>>1]}:function readU16FromPointer(pointer){return HEAPU16[pointer>>>1]};case 2:return signed?function readS32FromPointer(pointer){return HEAP32[pointer>>>2]}:function readU32FromPointer(pointer){return HEAPU32[pointer>>>2]};default:throw new TypeError("Unknown integer type: "+name)}}function __embind_register_integer(primitiveType,name,size,minRange,maxRange){name=readLatin1String(name);if(maxRange===-1){maxRange=4294967295}var shift=getShiftFromSize(size);var fromWireType=function(value){return value};if(minRange===0){var bitshift=32-8*size;fromWireType=function(value){return value<<bitshift>>>bitshift}}var isUnsignedType=name.indexOf("unsigned")!=-1;registerType(primitiveType,{name:name,"fromWireType":fromWireType,"toWireType":function(destructors,value){if(typeof value!=="number"&&typeof value!=="boolean"){throw new TypeError('Cannot convert "'+_embind_repr(value)+'" to '+this.name)}if(value<minRange||value>maxRange){throw new TypeError('Passing a number "'+_embind_repr(value)+'" from JS side to C/C++ side to an argument of type "'+name+'", which is outside the valid range ['+minRange+", "+maxRange+"]!")}return isUnsignedType?value>>>0:value|0},"argPackAdvance":8,"readValueFromPointer":integerReadValueFromPointer(name,shift,minRange!==0),destructorFunction:null})}function __embind_register_memory_view(rawType,dataTypeIndex,name){var typeMapping=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array];var TA=typeMapping[dataTypeIndex];function decodeMemoryView(handle){handle=handle>>2;var heap=HEAPU32;var size=heap[handle>>>0];var data=heap[handle+1>>>0];return new TA(buffer,data,size)}name=readLatin1String(name);registerType(rawType,{name:name,"fromWireType":decodeMemoryView,"argPackAdvance":8,"readValueFromPointer":decodeMemoryView},{ignoreDuplicateRegistrations:true})}function __embind_register_smart_ptr(rawType,rawPointeeType,name,sharingPolicy,getPointeeSignature,rawGetPointee,constructorSignature,rawConstructor,shareSignature,rawShare,destructorSignature,rawDestructor){name=readLatin1String(name);rawGetPointee=embind__requireFunction(getPointeeSignature,rawGetPointee);rawConstructor=embind__requireFunction(constructorSignature,rawConstructor);rawShare=embind__requireFunction(shareSignature,rawShare);rawDestructor=embind__requireFunction(destructorSignature,rawDestructor);whenDependentTypesAreResolved([rawType],[rawPointeeType],function(pointeeType){pointeeType=pointeeType[0];var registeredPointer=new RegisteredPointer(name,pointeeType.registeredClass,false,false,true,pointeeType,sharingPolicy,rawGetPointee,rawConstructor,rawShare,rawDestructor);return[registeredPointer]})}function __embind_register_std_string(rawType,name){name=readLatin1String(name);var stdStringIsUTF8=name==="std::string";registerType(rawType,{name:name,"fromWireType":function(value){var length=HEAPU32[value>>>2];var str;if(stdStringIsUTF8){var decodeStartPtr=value+4;for(var i=0;i<=length;++i){var currentBytePtr=value+4+i;if(i==length||HEAPU8[currentBytePtr>>>0]==0){var maxRead=currentBytePtr-decodeStartPtr;var stringSegment=UTF8ToString(decodeStartPtr,maxRead);if(str===undefined){str=stringSegment}else{str+=String.fromCharCode(0);str+=stringSegment}decodeStartPtr=currentBytePtr+1}}}else{var a=new Array(length);for(var i=0;i<length;++i){a[i]=String.fromCharCode(HEAPU8[value+4+i>>>0])}str=a.join("")}_free(value);return str},"toWireType":function(destructors,value){if(value instanceof ArrayBuffer){value=new Uint8Array(value)}var getLength;var valueIsOfTypeString=typeof value==="string";if(!(valueIsOfTypeString||value instanceof Uint8Array||value instanceof Uint8ClampedArray||value instanceof Int8Array)){throwBindingError("Cannot pass non-string to std::string")}if(stdStringIsUTF8&&valueIsOfTypeString){getLength=function(){return lengthBytesUTF8(value)}}else{getLength=function(){return value.length}}var length=getLength();var ptr=_malloc(4+length+1);ptr>>>=0;HEAPU32[ptr>>>2]=length;if(stdStringIsUTF8&&valueIsOfTypeString){stringToUTF8(value,ptr+4,length+1)}else{if(valueIsOfTypeString){for(var i=0;i<length;++i){var charCode=value.charCodeAt(i);if(charCode>255){_free(ptr);throwBindingError("String has UTF-16 code units that do not fit in 8 bits")}HEAPU8[ptr+4+i>>>0]=charCode}}else{for(var i=0;i<length;++i){HEAPU8[ptr+4+i>>>0]=value[i]}}}if(destructors!==null){destructors.push(_free,ptr)}return ptr},"argPackAdvance":8,"readValueFromPointer":simpleReadValueFromPointer,destructorFunction:function(ptr){_free(ptr)}})}function __embind_register_std_wstring(rawType,charSize,name){name=readLatin1String(name);var decodeString,encodeString,getHeap,lengthBytesUTF,shift;if(charSize===2){decodeString=UTF16ToString;encodeString=stringToUTF16;lengthBytesUTF=lengthBytesUTF16;getHeap=function(){return HEAPU16};shift=1}else if(charSize===4){decodeString=UTF32ToString;encodeString=stringToUTF32;lengthBytesUTF=lengthBytesUTF32;getHeap=function(){return HEAPU32};shift=2}registerType(rawType,{name:name,"fromWireType":function(value){var length=HEAPU32[value>>>2];var HEAP=getHeap();var str;var decodeStartPtr=value+4;for(var i=0;i<=length;++i){var currentBytePtr=value+4+i*charSize;if(i==length||HEAP[currentBytePtr>>>shift]==0){var maxReadBytes=currentBytePtr-decodeStartPtr;var stringSegment=decodeString(decodeStartPtr,maxReadBytes);if(str===undefined){str=stringSegment}else{str+=String.fromCharCode(0);str+=stringSegment}decodeStartPtr=currentBytePtr+charSize}}_free(value);return str},"toWireType":function(destructors,value){if(!(typeof value==="string")){throwBindingError("Cannot pass non-string to C++ string type "+name)}var length=lengthBytesUTF(value);var ptr=_malloc(4+length+charSize);ptr>>>=0;HEAPU32[ptr>>>2]=length>>shift;encodeString(value,ptr+4,length+charSize);if(destructors!==null){destructors.push(_free,ptr)}return ptr},"argPackAdvance":8,"readValueFromPointer":simpleReadValueFromPointer,destructorFunction:function(ptr){_free(ptr)}})}function __embind_register_value_object(rawType,name,constructorSignature,rawConstructor,destructorSignature,rawDestructor){structRegistrations[rawType]={name:readLatin1String(name),rawConstructor:embind__requireFunction(constructorSignature,rawConstructor),rawDestructor:embind__requireFunction(destructorSignature,rawDestructor),fields:[]}}function __embind_register_value_object_field(structType,fieldName,getterReturnType,getterSignature,getter,getterContext,setterArgumentType,setterSignature,setter,setterContext){structRegistrations[structType].fields.push({fieldName:readLatin1String(fieldName),getterReturnType:getterReturnType,getter:embind__requireFunction(getterSignature,getter),getterContext:getterContext,setterArgumentType:setterArgumentType,setter:embind__requireFunction(setterSignature,setter),setterContext:setterContext})}function __embind_register_void(rawType,name){name=readLatin1String(name);registerType(rawType,{isVoid:true,name:name,"argPackAdvance":0,"fromWireType":function(){return undefined},"toWireType":function(destructors,o){return undefined}})}function requireHandle(handle){if(!handle){throwBindingError("Cannot use deleted val. handle = "+handle)}return emval_handle_array[handle].value}function __emval_as(handle,returnType,destructorsRef){handle=requireHandle(handle);returnType=requireRegisteredType(returnType,"emval::as");var destructors=[];var rd=__emval_register(destructors);HEAP32[destructorsRef>>>2]=rd;return returnType["toWireType"](destructors,handle)}function __emval_lookupTypes(argCount,argTypes){var a=new Array(argCount);for(var i=0;i<argCount;++i){a[i]=requireRegisteredType(HEAP32[(argTypes>>2)+i>>>0],"parameter "+i)}return a}function __emval_call(handle,argCount,argTypes,argv){handle=requireHandle(handle);var types=__emval_lookupTypes(argCount,argTypes);var args=new Array(argCount);for(var i=0;i<argCount;++i){var type=types[i];args[i]=type["readValueFromPointer"](argv);argv+=type["argPackAdvance"]}var rv=handle.apply(undefined,args);return __emval_register(rv)}function __emval_allocateDestructors(destructorsRef){var destructors=[];HEAP32[destructorsRef>>>2]=__emval_register(destructors);return destructors}var emval_symbols={};function getStringOrSymbol(address){var symbol=emval_symbols[address];if(symbol===undefined){return readLatin1String(address)}else{return symbol}}var emval_methodCallers=[];function __emval_call_method(caller,handle,methodName,destructorsRef,args){caller=emval_methodCallers[caller];handle=requireHandle(handle);methodName=getStringOrSymbol(methodName);return caller(handle,methodName,__emval_allocateDestructors(destructorsRef),args)}function __emval_call_void_method(caller,handle,methodName,args){caller=emval_methodCallers[caller];handle=requireHandle(handle);methodName=getStringOrSymbol(methodName);caller(handle,methodName,null,args)}function emval_get_global(){if(typeof globalThis==="object"){return globalThis}return function(){return Function}()("return this")()}function __emval_get_global(name){if(name===0){return __emval_register(emval_get_global())}else{name=getStringOrSymbol(name);return __emval_register(emval_get_global()[name])}}function __emval_addMethodCaller(caller){var id=emval_methodCallers.length;emval_methodCallers.push(caller);return id}function __emval_get_method_caller(argCount,argTypes){var types=__emval_lookupTypes(argCount,argTypes);var retType=types[0];var signatureName=retType.name+"_$"+types.slice(1).map(function(t){return t.name}).join("_")+"$";var params=["retType"];var args=[retType];var argsList="";for(var i=0;i<argCount-1;++i){argsList+=(i!==0?", ":"")+"arg"+i;params.push("argType"+i);args.push(types[1+i])}var functionName=makeLegalFunctionName("methodCaller_"+signatureName);var functionBody="return function "+functionName+"(handle, name, destructors, args) {\n";var offset=0;for(var i=0;i<argCount-1;++i){functionBody+="    var arg"+i+" = argType"+i+".readValueFromPointer(args"+(offset?"+"+offset:"")+");\n";offset+=types[i+1]["argPackAdvance"]}functionBody+="    var rv = handle[name]("+argsList+");\n";for(var i=0;i<argCount-1;++i){if(types[i+1]["deleteObject"]){functionBody+="    argType"+i+".deleteObject(arg"+i+");\n"}}if(!retType.isVoid){functionBody+="    return retType.toWireType(destructors, rv);\n"}functionBody+="};\n";params.push(functionBody);var invokerFunction=new_(Function,params).apply(null,args);return __emval_addMethodCaller(invokerFunction)}function __emval_get_module_property(name){name=getStringOrSymbol(name);return __emval_register(Module[name])}function __emval_get_property(handle,key){handle=requireHandle(handle);key=requireHandle(key);return __emval_register(handle[key])}function __emval_incref(handle){if(handle>4){emval_handle_array[handle].refcount+=1}}function __emval_instanceof(object,constructor){object=requireHandle(object);constructor=requireHandle(constructor);return object instanceof constructor}function craftEmvalAllocator(argCount){var argsList="";for(var i=0;i<argCount;++i){argsList+=(i!==0?", ":"")+"arg"+i}var functionBody="return function emval_allocator_"+argCount+"(constructor, argTypes, args) {\n";for(var i=0;i<argCount;++i){functionBody+="var argType"+i+" = requireRegisteredType(Module['HEAP32'][(argTypes >>> 2) + "+i+'], "parameter '+i+'");\n'+"var arg"+i+" = argType"+i+".readValueFromPointer(args);\n"+"args += argType"+i+"['argPackAdvance'];\n"}functionBody+="var obj = new constructor("+argsList+");\n"+"return __emval_register(obj);\n"+"}\n";return new Function("requireRegisteredType","Module","__emval_register",functionBody)(requireRegisteredType,Module,__emval_register)}var emval_newers={};function __emval_new(handle,argCount,argTypes,args){handle=requireHandle(handle);var newer=emval_newers[argCount];if(!newer){newer=craftEmvalAllocator(argCount);emval_newers[argCount]=newer}return newer(handle,argTypes,args)}function __emval_new_array(){return __emval_register([])}function __emval_new_cstring(v){return __emval_register(getStringOrSymbol(v))}function __emval_new_object(){return __emval_register({})}function __emval_run_destructors(handle){var destructors=emval_handle_array[handle].value;runDestructors(destructors);__emval_decref(handle)}function __emval_set_property(handle,key,value){handle=requireHandle(handle);key=requireHandle(key);value=requireHandle(value);handle[key]=value}function __emval_take_value(type,argv){type=requireRegisteredType(type,"_emval_take_value");var v=type["readValueFromPointer"](argv);return __emval_register(v)}function __emval_typeof(handle){handle=requireHandle(handle);return __emval_register(typeof handle)}function _abort(){abort()}var _emscripten_get_now;_emscripten_get_now=function(){return performance.now()};var _emscripten_get_now_is_monotonic=true;function setErrNo(value){HEAP32[___errno_location()>>>2]=value;return value}function _clock_gettime(clk_id,tp){var now;if(clk_id===0){now=Date.now()}else if((clk_id===1||clk_id===4)&&_emscripten_get_now_is_monotonic){now=_emscripten_get_now()}else{setErrNo(28);return-1}HEAP32[tp>>>2]=now/1e3|0;HEAP32[tp+4>>>2]=now%1e3*1e3*1e3|0;return 0}function _emscripten_asm_const_int(code,sigPtr,argbuf){var args=readAsmConstArgs(sigPtr,argbuf);return ASM_CONSTS[code].apply(null,args)}function _emscripten_memcpy_big(dest,src,num){HEAPU8.copyWithin(dest>>>0,src>>>0,src+num>>>0)}function _emscripten_get_heap_size(){return HEAPU8.length}function emscripten_realloc_buffer(size){try{wasmMemory.grow(size-buffer.byteLength+65535>>>16);updateGlobalBufferAndViews(wasmMemory.buffer);return 1}catch(e){}}function _emscripten_resize_heap(requestedSize){requestedSize=requestedSize>>>0;var oldSize=_emscripten_get_heap_size();var maxHeapSize=4294967296;if(requestedSize>maxHeapSize){return false}var minHeapSize=16777216;for(var cutDown=1;cutDown<=4;cutDown*=2){var overGrownHeapSize=oldSize*(1+.2/cutDown);overGrownHeapSize=Math.min(overGrownHeapSize,requestedSize+100663296);var newSize=Math.min(maxHeapSize,alignUp(Math.max(minHeapSize,requestedSize,overGrownHeapSize),65536));var replacement=emscripten_realloc_buffer(newSize);if(replacement){return true}}return false}var ENV={};function getExecutableName(){return thisProgram||"./this.program"}function getEnvStrings(){if(!getEnvStrings.strings){var lang=(typeof navigator==="object"&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8";var env={"USER":"web_user","LOGNAME":"web_user","PATH":"/","PWD":"/","HOME":"/home/web_user","LANG":lang,"_":getExecutableName()};for(var x in ENV){env[x]=ENV[x]}var strings=[];for(var x in env){strings.push(x+"="+env[x])}getEnvStrings.strings=strings}return getEnvStrings.strings}function _environ_get(__environ,environ_buf){var bufSize=0;getEnvStrings().forEach(function(string,i){var ptr=environ_buf+bufSize;HEAP32[__environ+i*4>>>2]=ptr;writeAsciiToMemory(string,ptr);bufSize+=string.length+1});return 0}function _environ_sizes_get(penviron_count,penviron_buf_size){var strings=getEnvStrings();HEAP32[penviron_count>>>2]=strings.length;var bufSize=0;strings.forEach(function(string){bufSize+=string.length+1});HEAP32[penviron_buf_size>>>2]=bufSize;return 0}function _fd_close(fd){return 0}function _fd_read(fd,iov,iovcnt,pnum){var stream=SYSCALLS.getStreamFromFD(fd);var num=SYSCALLS.doReadv(stream,iov,iovcnt);HEAP32[pnum>>>2]=num;return 0}function _fd_seek(fd,offset_bigint,whence,newOffset){}function _fd_write(fd,iov,iovcnt,pnum){var num=0;for(var i=0;i<iovcnt;i++){var ptr=HEAP32[iov+i*8>>>2];var len=HEAP32[iov+(i*8+4)>>>2];for(var j=0;j<len;j++){SYSCALLS.printChar(fd,HEAPU8[ptr+j>>>0])}num+=len}HEAP32[pnum>>>2]=num;return 0}function _pthread_create(){return 6}function _pthread_join(){}function __isLeapYear(year){return year%4===0&&(year%100!==0||year%400===0)}function __arraySum(array,index){var sum=0;for(var i=0;i<=index;sum+=array[i++]){}return sum}var __MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];var __MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];function __addDays(date,days){var newDate=new Date(date.getTime());while(days>0){var leap=__isLeapYear(newDate.getFullYear());var currentMonth=newDate.getMonth();var daysInCurrentMonth=(leap?__MONTH_DAYS_LEAP:__MONTH_DAYS_REGULAR)[currentMonth];if(days>daysInCurrentMonth-newDate.getDate()){days-=daysInCurrentMonth-newDate.getDate()+1;newDate.setDate(1);if(currentMonth<11){newDate.setMonth(currentMonth+1)}else{newDate.setMonth(0);newDate.setFullYear(newDate.getFullYear()+1)}}else{newDate.setDate(newDate.getDate()+days);return newDate}}return newDate}function _strftime(s,maxsize,format,tm){var tm_zone=HEAP32[tm+40>>>2];var date={tm_sec:HEAP32[tm>>>2],tm_min:HEAP32[tm+4>>>2],tm_hour:HEAP32[tm+8>>>2],tm_mday:HEAP32[tm+12>>>2],tm_mon:HEAP32[tm+16>>>2],tm_year:HEAP32[tm+20>>>2],tm_wday:HEAP32[tm+24>>>2],tm_yday:HEAP32[tm+28>>>2],tm_isdst:HEAP32[tm+32>>>2],tm_gmtoff:HEAP32[tm+36>>>2],tm_zone:tm_zone?UTF8ToString(tm_zone):""};var pattern=UTF8ToString(format);var EXPANSION_RULES_1={"%c":"%a %b %d %H:%M:%S %Y","%D":"%m/%d/%y","%F":"%Y-%m-%d","%h":"%b","%r":"%I:%M:%S %p","%R":"%H:%M","%T":"%H:%M:%S","%x":"%m/%d/%y","%X":"%H:%M:%S","%Ec":"%c","%EC":"%C","%Ex":"%m/%d/%y","%EX":"%H:%M:%S","%Ey":"%y","%EY":"%Y","%Od":"%d","%Oe":"%e","%OH":"%H","%OI":"%I","%Om":"%m","%OM":"%M","%OS":"%S","%Ou":"%u","%OU":"%U","%OV":"%V","%Ow":"%w","%OW":"%W","%Oy":"%y"};for(var rule in EXPANSION_RULES_1){pattern=pattern.replace(new RegExp(rule,"g"),EXPANSION_RULES_1[rule])}var WEEKDAYS=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];var MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];function leadingSomething(value,digits,character){var str=typeof value==="number"?value.toString():value||"";while(str.length<digits){str=character[0]+str}return str}function leadingNulls(value,digits){return leadingSomething(value,digits,"0")}function compareByDay(date1,date2){function sgn(value){return value<0?-1:value>0?1:0}var compare;if((compare=sgn(date1.getFullYear()-date2.getFullYear()))===0){if((compare=sgn(date1.getMonth()-date2.getMonth()))===0){compare=sgn(date1.getDate()-date2.getDate())}}return compare}function getFirstWeekStartDate(janFourth){switch(janFourth.getDay()){case 0:return new Date(janFourth.getFullYear()-1,11,29);case 1:return janFourth;case 2:return new Date(janFourth.getFullYear(),0,3);case 3:return new Date(janFourth.getFullYear(),0,2);case 4:return new Date(janFourth.getFullYear(),0,1);case 5:return new Date(janFourth.getFullYear()-1,11,31);case 6:return new Date(janFourth.getFullYear()-1,11,30)}}function getWeekBasedYear(date){var thisDate=__addDays(new Date(date.tm_year+1900,0,1),date.tm_yday);var janFourthThisYear=new Date(thisDate.getFullYear(),0,4);var janFourthNextYear=new Date(thisDate.getFullYear()+1,0,4);var firstWeekStartThisYear=getFirstWeekStartDate(janFourthThisYear);var firstWeekStartNextYear=getFirstWeekStartDate(janFourthNextYear);if(compareByDay(firstWeekStartThisYear,thisDate)<=0){if(compareByDay(firstWeekStartNextYear,thisDate)<=0){return thisDate.getFullYear()+1}else{return thisDate.getFullYear()}}else{return thisDate.getFullYear()-1}}var EXPANSION_RULES_2={"%a":function(date){return WEEKDAYS[date.tm_wday].substring(0,3)},"%A":function(date){return WEEKDAYS[date.tm_wday]},"%b":function(date){return MONTHS[date.tm_mon].substring(0,3)},"%B":function(date){return MONTHS[date.tm_mon]},"%C":function(date){var year=date.tm_year+1900;return leadingNulls(year/100|0,2)},"%d":function(date){return leadingNulls(date.tm_mday,2)},"%e":function(date){return leadingSomething(date.tm_mday,2," ")},"%g":function(date){return getWeekBasedYear(date).toString().substring(2)},"%G":function(date){return getWeekBasedYear(date)},"%H":function(date){return leadingNulls(date.tm_hour,2)},"%I":function(date){var twelveHour=date.tm_hour;if(twelveHour==0)twelveHour=12;else if(twelveHour>12)twelveHour-=12;return leadingNulls(twelveHour,2)},"%j":function(date){return leadingNulls(date.tm_mday+__arraySum(__isLeapYear(date.tm_year+1900)?__MONTH_DAYS_LEAP:__MONTH_DAYS_REGULAR,date.tm_mon-1),3)},"%m":function(date){return leadingNulls(date.tm_mon+1,2)},"%M":function(date){return leadingNulls(date.tm_min,2)},"%n":function(){return"\n"},"%p":function(date){if(date.tm_hour>=0&&date.tm_hour<12){return"AM"}else{return"PM"}},"%S":function(date){return leadingNulls(date.tm_sec,2)},"%t":function(){return"\t"},"%u":function(date){return date.tm_wday||7},"%U":function(date){var janFirst=new Date(date.tm_year+1900,0,1);var firstSunday=janFirst.getDay()===0?janFirst:__addDays(janFirst,7-janFirst.getDay());var endDate=new Date(date.tm_year+1900,date.tm_mon,date.tm_mday);if(compareByDay(firstSunday,endDate)<0){var februaryFirstUntilEndMonth=__arraySum(__isLeapYear(endDate.getFullYear())?__MONTH_DAYS_LEAP:__MONTH_DAYS_REGULAR,endDate.getMonth()-1)-31;var firstSundayUntilEndJanuary=31-firstSunday.getDate();var days=firstSundayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();return leadingNulls(Math.ceil(days/7),2)}return compareByDay(firstSunday,janFirst)===0?"01":"00"},"%V":function(date){var janFourthThisYear=new Date(date.tm_year+1900,0,4);var janFourthNextYear=new Date(date.tm_year+1901,0,4);var firstWeekStartThisYear=getFirstWeekStartDate(janFourthThisYear);var firstWeekStartNextYear=getFirstWeekStartDate(janFourthNextYear);var endDate=__addDays(new Date(date.tm_year+1900,0,1),date.tm_yday);if(compareByDay(endDate,firstWeekStartThisYear)<0){return"53"}if(compareByDay(firstWeekStartNextYear,endDate)<=0){return"01"}var daysDifference;if(firstWeekStartThisYear.getFullYear()<date.tm_year+1900){daysDifference=date.tm_yday+32-firstWeekStartThisYear.getDate()}else{daysDifference=date.tm_yday+1-firstWeekStartThisYear.getDate()}return leadingNulls(Math.ceil(daysDifference/7),2)},"%w":function(date){return date.tm_wday},"%W":function(date){var janFirst=new Date(date.tm_year,0,1);var firstMonday=janFirst.getDay()===1?janFirst:__addDays(janFirst,janFirst.getDay()===0?1:7-janFirst.getDay()+1);var endDate=new Date(date.tm_year+1900,date.tm_mon,date.tm_mday);if(compareByDay(firstMonday,endDate)<0){var februaryFirstUntilEndMonth=__arraySum(__isLeapYear(endDate.getFullYear())?__MONTH_DAYS_LEAP:__MONTH_DAYS_REGULAR,endDate.getMonth()-1)-31;var firstMondayUntilEndJanuary=31-firstMonday.getDate();var days=firstMondayUntilEndJanuary+februaryFirstUntilEndMonth+endDate.getDate();return leadingNulls(Math.ceil(days/7),2)}return compareByDay(firstMonday,janFirst)===0?"01":"00"},"%y":function(date){return(date.tm_year+1900).toString().substring(2)},"%Y":function(date){return date.tm_year+1900},"%z":function(date){var off=date.tm_gmtoff;var ahead=off>=0;off=Math.abs(off)/60;off=off/60*100+off%60;return(ahead?"+":"-")+String("0000"+off).slice(-4)},"%Z":function(date){return date.tm_zone},"%%":function(){return"%"}};for(var rule in EXPANSION_RULES_2){if(pattern.indexOf(rule)>=0){pattern=pattern.replace(new RegExp(rule,"g"),EXPANSION_RULES_2[rule](date))}}var bytes=intArrayFromString(pattern,false);if(bytes.length>maxsize){return 0}writeArrayToMemory(bytes,s);return bytes.length-1}function _strftime_l(s,maxsize,format,tm){return _strftime(s,maxsize,format,tm)}function jstoi_q(str){return parseInt(str)}function _strptime(buf,format,tm){var pattern=UTF8ToString(format);var SPECIAL_CHARS="\\!@#$^&*()+=-[]/{}|:<>?,.";for(var i=0,ii=SPECIAL_CHARS.length;i<ii;++i){pattern=pattern.replace(new RegExp("\\"+SPECIAL_CHARS[i],"g"),"\\"+SPECIAL_CHARS[i])}var EQUIVALENT_MATCHERS={"%A":"%a","%B":"%b","%c":"%a %b %d %H:%M:%S %Y","%D":"%m\\/%d\\/%y","%e":"%d","%F":"%Y-%m-%d","%h":"%b","%R":"%H\\:%M","%r":"%I\\:%M\\:%S\\s%p","%T":"%H\\:%M\\:%S","%x":"%m\\/%d\\/(?:%y|%Y)","%X":"%H\\:%M\\:%S"};for(var matcher in EQUIVALENT_MATCHERS){pattern=pattern.replace(matcher,EQUIVALENT_MATCHERS[matcher])}var DATE_PATTERNS={"%a":"(?:Sun(?:day)?)|(?:Mon(?:day)?)|(?:Tue(?:sday)?)|(?:Wed(?:nesday)?)|(?:Thu(?:rsday)?)|(?:Fri(?:day)?)|(?:Sat(?:urday)?)","%b":"(?:Jan(?:uary)?)|(?:Feb(?:ruary)?)|(?:Mar(?:ch)?)|(?:Apr(?:il)?)|May|(?:Jun(?:e)?)|(?:Jul(?:y)?)|(?:Aug(?:ust)?)|(?:Sep(?:tember)?)|(?:Oct(?:ober)?)|(?:Nov(?:ember)?)|(?:Dec(?:ember)?)","%C":"\\d\\d","%d":"0[1-9]|[1-9](?!\\d)|1\\d|2\\d|30|31","%H":"\\d(?!\\d)|[0,1]\\d|20|21|22|23","%I":"\\d(?!\\d)|0\\d|10|11|12","%j":"00[1-9]|0?[1-9](?!\\d)|0?[1-9]\\d(?!\\d)|[1,2]\\d\\d|3[0-6]\\d","%m":"0[1-9]|[1-9](?!\\d)|10|11|12","%M":"0\\d|\\d(?!\\d)|[1-5]\\d","%n":"\\s","%p":"AM|am|PM|pm|A\\.M\\.|a\\.m\\.|P\\.M\\.|p\\.m\\.","%S":"0\\d|\\d(?!\\d)|[1-5]\\d|60","%U":"0\\d|\\d(?!\\d)|[1-4]\\d|50|51|52|53","%W":"0\\d|\\d(?!\\d)|[1-4]\\d|50|51|52|53","%w":"[0-6]","%y":"\\d\\d","%Y":"\\d\\d\\d\\d","%%":"%","%t":"\\s"};var MONTH_NUMBERS={JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11};var DAY_NUMBERS_SUN_FIRST={SUN:0,MON:1,TUE:2,WED:3,THU:4,FRI:5,SAT:6};var DAY_NUMBERS_MON_FIRST={MON:0,TUE:1,WED:2,THU:3,FRI:4,SAT:5,SUN:6};for(var datePattern in DATE_PATTERNS){pattern=pattern.replace(datePattern,"("+datePattern+DATE_PATTERNS[datePattern]+")")}var capture=[];for(var i=pattern.indexOf("%");i>=0;i=pattern.indexOf("%")){capture.push(pattern[i+1]);pattern=pattern.replace(new RegExp("\\%"+pattern[i+1],"g"),"")}var matches=new RegExp("^"+pattern,"i").exec(UTF8ToString(buf));function initDate(){function fixup(value,min,max){return typeof value!=="number"||isNaN(value)?min:value>=min?value<=max?value:max:min}return{year:fixup(HEAP32[tm+20>>>2]+1900,1970,9999),month:fixup(HEAP32[tm+16>>>2],0,11),day:fixup(HEAP32[tm+12>>>2],1,31),hour:fixup(HEAP32[tm+8>>>2],0,23),min:fixup(HEAP32[tm+4>>>2],0,59),sec:fixup(HEAP32[tm>>>2],0,59)}}if(matches){var date=initDate();var value;var getMatch=function(symbol){var pos=capture.indexOf(symbol);if(pos>=0){return matches[pos+1]}return};if(value=getMatch("S")){date.sec=jstoi_q(value)}if(value=getMatch("M")){date.min=jstoi_q(value)}if(value=getMatch("H")){date.hour=jstoi_q(value)}else if(value=getMatch("I")){var hour=jstoi_q(value);if(value=getMatch("p")){hour+=value.toUpperCase()[0]==="P"?12:0}date.hour=hour}if(value=getMatch("Y")){date.year=jstoi_q(value)}else if(value=getMatch("y")){var year=jstoi_q(value);if(value=getMatch("C")){year+=jstoi_q(value)*100}else{year+=year<69?2e3:1900}date.year=year}if(value=getMatch("m")){date.month=jstoi_q(value)-1}else if(value=getMatch("b")){date.month=MONTH_NUMBERS[value.substring(0,3).toUpperCase()]||0}if(value=getMatch("d")){date.day=jstoi_q(value)}else if(value=getMatch("j")){var day=jstoi_q(value);var leapYear=__isLeapYear(date.year);for(var month=0;month<12;++month){var daysUntilMonth=__arraySum(leapYear?__MONTH_DAYS_LEAP:__MONTH_DAYS_REGULAR,month-1);if(day<=daysUntilMonth+(leapYear?__MONTH_DAYS_LEAP:__MONTH_DAYS_REGULAR)[month]){date.day=day-daysUntilMonth}}}else if(value=getMatch("a")){var weekDay=value.substring(0,3).toUpperCase();if(value=getMatch("U")){var weekDayNumber=DAY_NUMBERS_SUN_FIRST[weekDay];var weekNumber=jstoi_q(value);var janFirst=new Date(date.year,0,1);var endDate;if(janFirst.getDay()===0){endDate=__addDays(janFirst,weekDayNumber+7*(weekNumber-1))}else{endDate=__addDays(janFirst,7-janFirst.getDay()+weekDayNumber+7*(weekNumber-1))}date.day=endDate.getDate();date.month=endDate.getMonth()}else if(value=getMatch("W")){var weekDayNumber=DAY_NUMBERS_MON_FIRST[weekDay];var weekNumber=jstoi_q(value);var janFirst=new Date(date.year,0,1);var endDate;if(janFirst.getDay()===1){endDate=__addDays(janFirst,weekDayNumber+7*(weekNumber-1))}else{endDate=__addDays(janFirst,7-janFirst.getDay()+1+weekDayNumber+7*(weekNumber-1))}date.day=endDate.getDate();date.month=endDate.getMonth()}}var fullDate=new Date(date.year,date.month,date.day,date.hour,date.min,date.sec,0);HEAP32[tm>>>2]=fullDate.getSeconds();HEAP32[tm+4>>>2]=fullDate.getMinutes();HEAP32[tm+8>>>2]=fullDate.getHours();HEAP32[tm+12>>>2]=fullDate.getDate();HEAP32[tm+16>>>2]=fullDate.getMonth();HEAP32[tm+20>>>2]=fullDate.getFullYear()-1900;HEAP32[tm+24>>>2]=fullDate.getDay();HEAP32[tm+28>>>2]=__arraySum(__isLeapYear(fullDate.getFullYear())?__MONTH_DAYS_LEAP:__MONTH_DAYS_REGULAR,fullDate.getMonth()-1)+fullDate.getDate()-1;HEAP32[tm+32>>>2]=0;return buf+intArrayFromString(matches[0]).length-1}return 0}function _sysconf(name){switch(name){case 30:return 16384;case 85:var maxHeapSize=4294967296;return maxHeapSize/16384;case 132:case 133:case 12:case 137:case 138:case 15:case 235:case 16:case 17:case 18:case 19:case 20:case 149:case 13:case 10:case 236:case 153:case 9:case 21:case 22:case 159:case 154:case 14:case 77:case 78:case 139:case 80:case 81:case 82:case 68:case 67:case 164:case 11:case 29:case 47:case 48:case 95:case 52:case 51:case 46:case 79:return 200809;case 27:case 246:case 127:case 128:case 23:case 24:case 160:case 161:case 181:case 182:case 242:case 183:case 184:case 243:case 244:case 245:case 165:case 178:case 179:case 49:case 50:case 168:case 169:case 175:case 170:case 171:case 172:case 97:case 76:case 32:case 173:case 35:return-1;case 176:case 177:case 7:case 155:case 8:case 157:case 125:case 126:case 92:case 93:case 129:case 130:case 131:case 94:case 91:return 1;case 74:case 60:case 69:case 70:case 4:return 1024;case 31:case 42:case 72:return 32;case 87:case 26:case 33:return 2147483647;case 34:case 1:return 47839;case 38:case 36:return 99;case 43:case 37:return 2048;case 0:return 2097152;case 3:return 65536;case 28:return 32768;case 44:return 32767;case 75:return 16384;case 39:return 1e3;case 89:return 700;case 71:return 256;case 40:return 255;case 2:return 100;case 180:return 64;case 25:return 20;case 5:return 16;case 6:return 6;case 73:return 4;case 84:{if(typeof navigator==="object")return navigator["hardwareConcurrency"]||1;return 1}}setErrNo(28);return-1}var readAsmConstArgsArray=[];function readAsmConstArgs(sigPtr,buf){readAsmConstArgsArray.length=0;var ch;buf>>=2;while(ch=HEAPU8[sigPtr++>>>0]){var double=ch<105;if(double&&buf&1)buf++;readAsmConstArgsArray.push(double?HEAPF64[buf++>>>1]:HEAP32[buf>>>0]);++buf}return readAsmConstArgsArray}InternalError=Module["InternalError"]=extendError(Error,"InternalError");embind_init_charCodes();BindingError=Module["BindingError"]=extendError(Error,"BindingError");init_ClassHandle();init_RegisteredPointer();init_embind();UnboundTypeError=Module["UnboundTypeError"]=extendError(Error,"UnboundTypeError");init_emval();var ASSERTIONS=false;function intArrayFromString(stringy,dontAddNull,length){var len=length>0?length:lengthBytesUTF8(stringy)+1;var u8array=new Array(len);var numBytesWritten=stringToUTF8Array(stringy,u8array,0,u8array.length);if(dontAddNull)u8array.length=numBytesWritten;return u8array}__ATINIT__.push({func:function(){___wasm_call_ctors()}});var asmLibraryArg={"__cxa_allocate_exception":___cxa_allocate_exception,"__cxa_atexit":___cxa_atexit,"__cxa_throw":___cxa_throw,"__localtime_r":___localtime_r,"__sys_ftruncate64":___sys_ftruncate64,"__sys_getpid":___sys_getpid,"__sys_madvise1":___sys_madvise1,"__sys_mmap2":___sys_mmap2,"__sys_mremap":___sys_mremap,"__sys_munmap":___sys_munmap,"__sys_open":___sys_open,"__sys_unlink":___sys_unlink,"_embind_finalize_value_object":__embind_finalize_value_object,"_embind_register_bool":__embind_register_bool,"_embind_register_class":__embind_register_class,"_embind_register_class_constructor":__embind_register_class_constructor,"_embind_register_class_function":__embind_register_class_function,"_embind_register_emval":__embind_register_emval,"_embind_register_enum":__embind_register_enum,"_embind_register_enum_value":__embind_register_enum_value,"_embind_register_float":__embind_register_float,"_embind_register_function":__embind_register_function,"_embind_register_integer":__embind_register_integer,"_embind_register_memory_view":__embind_register_memory_view,"_embind_register_smart_ptr":__embind_register_smart_ptr,"_embind_register_std_string":__embind_register_std_string,"_embind_register_std_wstring":__embind_register_std_wstring,"_embind_register_value_object":__embind_register_value_object,"_embind_register_value_object_field":__embind_register_value_object_field,"_embind_register_void":__embind_register_void,"_emval_as":__emval_as,"_emval_call":__emval_call,"_emval_call_method":__emval_call_method,"_emval_call_void_method":__emval_call_void_method,"_emval_decref":__emval_decref,"_emval_get_global":__emval_get_global,"_emval_get_method_caller":__emval_get_method_caller,"_emval_get_module_property":__emval_get_module_property,"_emval_get_property":__emval_get_property,"_emval_incref":__emval_incref,"_emval_instanceof":__emval_instanceof,"_emval_new":__emval_new,"_emval_new_array":__emval_new_array,"_emval_new_cstring":__emval_new_cstring,"_emval_new_object":__emval_new_object,"_emval_run_destructors":__emval_run_destructors,"_emval_set_property":__emval_set_property,"_emval_take_value":__emval_take_value,"_emval_typeof":__emval_typeof,"abort":_abort,"clock_gettime":_clock_gettime,"emscripten_asm_const_int":_emscripten_asm_const_int,"emscripten_memcpy_big":_emscripten_memcpy_big,"emscripten_resize_heap":_emscripten_resize_heap,"environ_get":_environ_get,"environ_sizes_get":_environ_sizes_get,"fd_close":_fd_close,"fd_read":_fd_read,"fd_seek":_fd_seek,"fd_write":_fd_write,"memory":wasmMemory,"pthread_create":_pthread_create,"pthread_join":_pthread_join,"strftime":_strftime,"strftime_l":_strftime_l,"strptime":_strptime,"sysconf":_sysconf};var asm=createWasm();var ___wasm_call_ctors=Module["___wasm_call_ctors"]=function(){return(___wasm_call_ctors=Module["___wasm_call_ctors"]=Module["asm"]["__wasm_call_ctors"]).apply(null,arguments)};var _malloc=Module["_malloc"]=function(){return(_malloc=Module["_malloc"]=Module["asm"]["malloc"]).apply(null,arguments)};var _free=Module["_free"]=function(){return(_free=Module["_free"]=Module["asm"]["free"]).apply(null,arguments)};var _main=Module["_main"]=function(){return(_main=Module["_main"]=Module["asm"]["main"]).apply(null,arguments)};var _memset=Module["_memset"]=function(){return(_memset=Module["_memset"]=Module["asm"]["memset"]).apply(null,arguments)};var ___errno_location=Module["___errno_location"]=function(){return(___errno_location=Module["___errno_location"]=Module["asm"]["__errno_location"]).apply(null,arguments)};var ___getTypeName=Module["___getTypeName"]=function(){return(___getTypeName=Module["___getTypeName"]=Module["asm"]["__getTypeName"]).apply(null,arguments)};var ___embind_register_native_and_builtin_types=Module["___embind_register_native_and_builtin_types"]=function(){return(___embind_register_native_and_builtin_types=Module["___embind_register_native_and_builtin_types"]=Module["asm"]["__embind_register_native_and_builtin_types"]).apply(null,arguments)};var _htonl=Module["_htonl"]=function(){return(_htonl=Module["_htonl"]=Module["asm"]["htonl"]).apply(null,arguments)};var _htons=Module["_htons"]=function(){return(_htons=Module["_htons"]=Module["asm"]["htons"]).apply(null,arguments)};var _ntohs=Module["_ntohs"]=function(){return(_ntohs=Module["_ntohs"]=Module["asm"]["ntohs"]).apply(null,arguments)};var __get_tzname=Module["__get_tzname"]=function(){return(__get_tzname=Module["__get_tzname"]=Module["asm"]["_get_tzname"]).apply(null,arguments)};var __get_daylight=Module["__get_daylight"]=function(){return(__get_daylight=Module["__get_daylight"]=Module["asm"]["_get_daylight"]).apply(null,arguments)};var __get_timezone=Module["__get_timezone"]=function(){return(__get_timezone=Module["__get_timezone"]=Module["asm"]["_get_timezone"]).apply(null,arguments)};var stackSave=Module["stackSave"]=function(){return(stackSave=Module["stackSave"]=Module["asm"]["stackSave"]).apply(null,arguments)};var stackRestore=Module["stackRestore"]=function(){return(stackRestore=Module["stackRestore"]=Module["asm"]["stackRestore"]).apply(null,arguments)};var stackAlloc=Module["stackAlloc"]=function(){return(stackAlloc=Module["stackAlloc"]=Module["asm"]["stackAlloc"]).apply(null,arguments)};var _setThrew=Module["_setThrew"]=function(){return(_setThrew=Module["_setThrew"]=Module["asm"]["setThrew"]).apply(null,arguments)};var _memalign=Module["_memalign"]=function(){return(_memalign=Module["_memalign"]=Module["asm"]["memalign"]).apply(null,arguments)};var _emscripten_main_thread_process_queued_calls=Module["_emscripten_main_thread_process_queued_calls"]=function(){return(_emscripten_main_thread_process_queued_calls=Module["_emscripten_main_thread_process_queued_calls"]=Module["asm"]["emscripten_main_thread_process_queued_calls"]).apply(null,arguments)};var calledRun;function ExitStatus(status){this.name="ExitStatus";this.message="Program terminated with exit("+status+")";this.status=status}var calledMain=false;dependenciesFulfilled=function runCaller(){if(!calledRun)run();if(!calledRun)dependenciesFulfilled=runCaller};function callMain(args){var entryFunction=Module["_main"];args=args||[];var argc=args.length+1;var argv=stackAlloc((argc+1)*4);HEAP32[argv>>>2]=allocateUTF8OnStack(thisProgram);for(var i=1;i<argc;i++){HEAP32[(argv>>2)+i>>>0]=allocateUTF8OnStack(args[i-1])}HEAP32[(argv>>2)+argc>>>0]=0;try{var ret=entryFunction(argc,argv);exit(ret,true)}catch(e){if(e instanceof ExitStatus){return}else if(e=="unwind"){noExitRuntime=true;return}else{var toLog=e;if(e&&typeof e==="object"&&e.stack){toLog=[e,e.stack]}err("exception thrown: "+toLog);quit_(1,e)}}finally{calledMain=true}}function run(args){args=args||arguments_;if(runDependencies>0){return}preRun();if(runDependencies>0)return;function doRun(){if(calledRun)return;calledRun=true;Module["calledRun"]=true;if(ABORT)return;initRuntime();preMain();readyPromiseResolve(Module);if(Module["onRuntimeInitialized"])Module["onRuntimeInitialized"]();if(shouldRunNow)callMain(args);postRun()}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout(function(){setTimeout(function(){Module["setStatus"]("")},1);doRun()},1)}else{doRun()}}Module["run"]=run;function exit(status,implicit){if(implicit&&noExitRuntime&&status===0){return}if(noExitRuntime){}else{EXITSTATUS=status;exitRuntime();if(Module["onExit"])Module["onExit"](status);ABORT=true}quit_(status,new ExitStatus(status))}if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].pop()()}}var shouldRunNow=true;if(Module["noInitialRun"])shouldRunNow=false;noExitRuntime=true;run();


  return load_perspective.ready
}
);
})();
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (load_perspective);

/***/ }),

/***/ "../packages/perspective/dist/esm/api/server.js":
/*!******************************************************!*\
  !*** ../packages/perspective/dist/esm/api/server.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Server": () => /* binding */ Server
/* harmony export */ });
/* harmony import */ var _config__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../config */ "../packages/perspective/dist/esm/config/index.js");
/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */


function error_to_json(error) {
  const obj = {};

  if (typeof error !== "string") {
    Object.getOwnPropertyNames(error).forEach(key => {
      obj[key] = error[key];
    }, error);
  } else {
    obj["message"] = error;
  }

  return obj;
}
/**
 * The base class for Perspective's async API. It initializes and keeps track of
 * tables, views, and processes messages from the user into the Perspective
 * engine.
 *
 * Child classes must implement the `post()` interface, which defines how the
 * server sends messages to the client. The implementation of `Server` for
 * Web Workers can be found in `perspective.js`, and an implementation for
 * Node.JS can be found in `perspective.node.js`.
 */


class Server {
  constructor(perspective) {
    this.perspective = perspective;
    this._tables = {};
    this._views = {};
    this._callback_cache = new Map();
  }
  /**
   * Return an initialization message to the client for confirmation.
   * `Server` must be extended and the `post` method implemented before the
   * server can successfully be initialized.
   */


  init(msg) {
    if (msg.config) {
      (0,_config__WEBPACK_IMPORTED_MODULE_0__.override_config)(msg.config);
    } // The client will wait for a response message on table() and
    // view(). If this flag is not set, the table() and view()
    // constructors will resolve automatically and errors from the
    // server will not be caught in those constructors. This allows
    // for backwards compatibility between newer frontends (those
    // with async table/view constructors) and older servers (which
    // do not send the response message to the client).


    msg.data = ["wait_for_response"];
    this.post(msg);
  }
  /**
   * Send a message from the Perspective server to the Perspective client -
   * this method must be implemented before the server can be used.
   *
   * @param {Object} msg a message to be sent to the client.
   */


  post(msg) {
    throw new Error(`Posting ${msg} failed - post() not implemented!`);
  }
  /**
   * Given a message, execute its instructions. This method is the dispatcher
   * for all Perspective actions, including table/view creation, deletion, and
   * all method calls to/from the table and view.
   *
   * @param {*} msg an Object containing `cmd` (a String instruction) and
   * associated data for that instruction
   * @param {*} client_id
   */


  process(msg, client_id) {
    switch (msg.cmd) {
      case "init_profile_thread":
        this.perspective.initialize_profile_thread();
        break;

      case "memory_usage":
        this.post({
          id: msg.id,
          data: this.perspective.memory_usage()
        });
        break;

      case "init":
        this.init(msg);
        break;

      case "table":
        if (typeof msg.args[0] === "undefined") {
          // Cache messages for when a table is created but not fully
          // initialized, i.e. in the case when a table is created
          // from a view, as the view needs to be serialized to an
          // arrow before the table will be ready.
          this._tables[msg.name] = [];
        } else {
          try {
            const msgs = this._tables[msg.name];
            const table = this.perspective.table(msg.args[0], msg.options); // When using the Node server, the `table()` constructor
            // returns a Promise, but in the Web Worker version,
            // table() synchronously returns an instance of a Table.

            if (table && table.then) {
              table.then(table => {
                this._tables[msg.name] = table; // Process cached messages for this table.

                if (msgs) {
                  for (const msg of msgs) {
                    this.process(msg);
                  }
                } // Resolve the promise to return a Table.


                this.post({
                  id: msg.id,
                  data: msg.name
                });
              }).catch(error => this.process_error(msg, error));
            } else {
              this._tables[msg.name] = table; // Process cached messages for this table.

              if (msgs) {
                for (const msg of msgs) {
                  this.process(msg);
                }
              } // Resolve the promise to return a Table.


              this.post({
                id: msg.id,
                data: msg.name
              });
            }
          } catch (error) {
            this.process_error(msg, error);
            return;
          }
        }

        break;

      case "table_generate":
        let g;
        eval("g = " + msg.args);
        g(function (tbl) {
          this._tables[msg.name] = tbl;
          this.post({
            id: msg.id,
            data: "created!"
          });
        });
        break;

      case "table_execute":
        let f;
        eval("f = " + msg.f);
        f(this._tables[msg.name]);
        break;

      case "table_method":
      case "view_method":
        this.process_method_call(msg);
        break;

      case "view":
        const tableMsgQueue = this._tables[msg.table_name];

        if (tableMsgQueue && Array.isArray(tableMsgQueue)) {
          // If the table is not initialized, defer this message for
          // until after the table is initialized, and create a new
          // message queue for the uninitialized view.
          tableMsgQueue.push(msg);
          this._views[msg.view_name] = [];
        } else {
          // Create a new view and resolve the Promise on the client
          // with the name of the view, which the client will use to
          // construct a new view proxy.
          try {
            const msgs = this._views[msg.view_name]; // When using the Node server, the `view()` constructor
            // returns a Promise, but in the Web Worker version,
            // view() synchronously returns an instance of a View.

            const view = this._tables[msg.table_name].view(msg.config);

            if (view && view.then) {
              view.then(view => {
                this._views[msg.view_name] = view;
                this._views[msg.view_name].client_id = client_id; // Process cached messages for the view.

                if (msgs) {
                  for (const msg of msgs) {
                    this.process(msg);
                  }
                }

                this.post({
                  id: msg.id,
                  data: msg.view_name
                });
              }).catch(error => this.process_error(msg, error));
            } else {
              this._views[msg.view_name] = view;
              this._views[msg.view_name].client_id = client_id; // Process cached messages for the view.

              if (msgs) {
                for (const msg of msgs) {
                  this.process(msg);
                }
              }

              this.post({
                id: msg.id,
                data: msg.view_name
              });
            }
          } catch (error) {
            this.process_error(msg, error);
            return;
          }
        }

        break;
    }
  }
  /**
   * Execute a subscription to a Perspective event, such as `on_update` or
   * `on_delete`.
   */


  process_subscribe(msg, obj) {
    try {
      let callback;

      if (msg.method.slice(0, 2) === "on") {
        callback = ev => {
          let result = {
            id: msg.id,
            data: ev
          };

          try {
            // post transferable data for arrow
            if (msg.args && msg.args[0]) {
              if (msg.method === "on_update" && msg.args[0]["mode"] === "row") {
                // actual arrow is in the `delta`
                this.post(result, [ev.delta]);
                return;
              }
            }

            this.post(result);
          } catch (e) {
            console.error(`Removing failed callback to \`${msg.method}()\` (presumably due to failed connection)`);
            const remove_method = msg.method.substring(3);
            obj[`remove_${remove_method}`](callback);
          }
        };

        if (msg.callback_id) {
          this._callback_cache.set(msg.callback_id, callback);
        }
      } else if (msg.callback_id) {
        callback = this._callback_cache.get(msg.callback_id);

        this._callback_cache.delete(msg.callback_id);
      }

      if (callback) {
        obj[msg.method](callback, ...msg.args);
      } else {
        console.error(`Callback not found for remote call "${JSON.stringify(msg)}"`);
      }
    } catch (error) {
      this.process_error(msg, error);
      return;
    }
  }
  /**
   * Given a message that calls a table or view method, call the method and
   * return the result to the client, or return an error message to the
   * client.
   *
   * @param {Object} msg
   */


  process_method_call(msg) {
    let obj, result;
    const name = msg.view_name || msg.name;
    msg.cmd === "table_method" ? obj = this._tables[name] : obj = this._views[name];

    if (!obj && msg.cmd === "view_method") {
      // cannot have a host without a table, but can have a host without a
      // view
      this.process_error(msg, {
        message: "View method cancelled"
      });
      return;
    }

    if (obj && obj.push) {
      obj.push(msg);
      return;
    }

    try {
      if (msg.subscribe) {
        this.process_subscribe(msg, obj);
        return;
      } else {
        result = obj[msg.method].apply(obj, msg.args);

        if (result instanceof Promise) {
          result.then(result => this.process_method_call_response(msg, result)).catch(error => this.process_error(msg, error));
        } else {
          this.process_method_call_response(msg, result);
        }
      }
    } catch (error) {
      this.process_error(msg, error);
      return;
    }
  }
  /**
   * Send the response from a method call back to the client, using
   * transferables if the response is an Arrow binary.
   * @param {Object} msg
   * @param {*} result
   */


  process_method_call_response(msg, result) {
    if (msg.method === "delete") {
      delete this._views[msg.name];
    }

    if (msg.method === "to_arrow") {
      this.post({
        id: msg.id,
        data: result
      }, [result]);
    } else {
      this.post({
        id: msg.id,
        data: result
      });
    }
  }
  /**
   * Send an error to the client.
   */


  process_error(msg, error) {
    this.post({
      id: msg.id,
      error: error_to_json(error)
    });
  }
  /**
   * Garbage collect un-needed views.
   */


  clear_views(client_id) {
    for (let key of Object.keys(this._views)) {
      if (this._views[key].client_id === client_id) {
        try {
          this._views[key].delete();
        } catch (e) {
          console.error(e);
        }

        delete this._views[key];
      }
    }

    console.debug(`GC ${Object.keys(this._views).length} views in memory`);
  }

}


/***/ }),

/***/ "../packages/perspective/dist/esm/config/constants.js":
/*!************************************************************!*\
  !*** ../packages/perspective/dist/esm/config/constants.js ***!
  \************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DATA_TYPES": () => /* binding */ DATA_TYPES,
/* harmony export */   "CONFIG_ALIASES": () => /* binding */ CONFIG_ALIASES,
/* harmony export */   "CONFIG_VALID_KEYS": () => /* binding */ CONFIG_VALID_KEYS,
/* harmony export */   "SORT_ORDERS": () => /* binding */ SORT_ORDERS,
/* harmony export */   "SORT_ORDER_IDS": () => /* binding */ SORT_ORDER_IDS,
/* harmony export */   "TYPE_AGGREGATES": () => /* binding */ TYPE_AGGREGATES,
/* harmony export */   "FILTER_OPERATORS": () => /* binding */ FILTER_OPERATORS,
/* harmony export */   "COLUMN_SEPARATOR_STRING": () => /* binding */ COLUMN_SEPARATOR_STRING,
/* harmony export */   "TYPE_FILTERS": () => /* binding */ TYPE_FILTERS
/* harmony export */ });
/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const DATA_TYPES = {
  integer: "integer",
  float: "float",
  string: "string",
  boolean: "boolean",
  date: "date",
  datetime: "datetime",
  object: "object"
};
const CONFIG_ALIASES = {
  row_pivot: "row_pivots",
  "row-pivot": "row_pivots",
  "row-pivots": "row_pivots",
  col_pivot: "column_pivots",
  col_pivots: "column_pivots",
  column_pivot: "column_pivots",
  "column-pivot": "column_pivots",
  "column-pivots": "column_pivots",
  filters: "filter",
  sorts: "sort"
};
const CONFIG_VALID_KEYS = ["viewport", "row_pivots", "column_pivots", "aggregates", "columns", "filter", "sort", "computed_columns", "expressions", "row_pivot_depth", "filter_op"];
const NUMBER_AGGREGATES = ["any", "avg", "abs sum", "count", "distinct count", "dominant", "first by index", "last by index", "last", "high", "join", "low", "mean", "median", "pct sum parent", "pct sum grand total", "sum", "sum abs", "sum not null", "unique"];
const STRING_AGGREGATES = ["any", "count", "distinct count", "distinct leaf", "dominant", "first by index", "join", "last by index", "last", "unique"];
const BOOLEAN_AGGREGATES = ["any", "count", "distinct count", "distinct leaf", "dominant", "first by index", "last by index", "last", "unique"];
const SORT_ORDERS = ["none", "asc", "desc", "col asc", "col desc", "asc abs", "desc abs", "col asc abs", "col desc abs"];
const SORT_ORDER_IDS = [2, 0, 1, 0, 1, 3, 4, 3, 4];
const TYPE_AGGREGATES = {
  string: STRING_AGGREGATES,
  float: NUMBER_AGGREGATES,
  integer: NUMBER_AGGREGATES,
  boolean: BOOLEAN_AGGREGATES,
  datetime: STRING_AGGREGATES,
  date: STRING_AGGREGATES
};
const FILTER_OPERATORS = {
  lessThan: "<",
  greaterThan: ">",
  equals: "==",
  lessThanOrEquals: "<=",
  greaterThanOrEquals: ">=",
  doesNotEqual: "!=",
  isNull: "is null",
  isNotNull: "is not null",
  isIn: "in",
  isNotIn: "not in",
  contains: "contains",
  bitwiseAnd: "&",
  bitwiseOr: "|",
  and: "and",
  or: "or",
  beginsWith: "begins with",
  endsWith: "ends with"
};
const BOOLEAN_FILTERS = [FILTER_OPERATORS.bitwiseAnd, FILTER_OPERATORS.bitwiseOr, FILTER_OPERATORS.equals, FILTER_OPERATORS.doesNotEqual, FILTER_OPERATORS.or, FILTER_OPERATORS.and, FILTER_OPERATORS.isNull, FILTER_OPERATORS.isNotNull];
const NUMBER_FILTERS = [FILTER_OPERATORS.lessThan, FILTER_OPERATORS.greaterThan, FILTER_OPERATORS.equals, FILTER_OPERATORS.lessThanOrEquals, FILTER_OPERATORS.greaterThanOrEquals, FILTER_OPERATORS.doesNotEqual, FILTER_OPERATORS.isNull, FILTER_OPERATORS.isNotNull];
const STRING_FILTERS = [FILTER_OPERATORS.equals, FILTER_OPERATORS.contains, FILTER_OPERATORS.doesNotEqual, FILTER_OPERATORS.isIn, FILTER_OPERATORS.isNotIn, FILTER_OPERATORS.beginsWith, FILTER_OPERATORS.endsWith, FILTER_OPERATORS.isNull, FILTER_OPERATORS.isNotNull];
const DATETIME_FILTERS = [FILTER_OPERATORS.lessThan, FILTER_OPERATORS.greaterThan, FILTER_OPERATORS.equals, FILTER_OPERATORS.lessThanOrEquals, FILTER_OPERATORS.greaterThanOrEquals, FILTER_OPERATORS.doesNotEqual, FILTER_OPERATORS.isNull, FILTER_OPERATORS.isNotNull];
const COLUMN_SEPARATOR_STRING = "|";
const TYPE_FILTERS = {
  string: STRING_FILTERS,
  float: NUMBER_FILTERS,
  integer: NUMBER_FILTERS,
  boolean: BOOLEAN_FILTERS,
  datetime: DATETIME_FILTERS,
  date: DATETIME_FILTERS
};


/***/ }),

/***/ "../packages/perspective/dist/esm/config/settings.js":
/*!***********************************************************!*\
  !*** ../packages/perspective/dist/esm/config/settings.js ***!
  \***********************************************************/
/***/ ((module) => {

/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/**
 * The default settings which populate `perspective.config.js`.
 */
module.exports.default = {
  /**
   * `types` are the type-specific configuration options.  Each key is the
   * name of a perspective type; their values are configuration objects for
   * that type.
   */
  types: {
    float: {
      /**
       * Which filter operator should be the default when a column of this
       * type is pivotted.
       */
      filter_operator: "==",

      /**
       * Which aggregate should be the default when a column of this type
       * is pivotted.
       */
      aggregate: "sum",

      /**
       * The format object for this type.  Can be either an
       * `toLocaleString()` `options` object for this type (or supertype),
       * or a function which returns the formatted string for this type.
       */
      format: {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }
    },
    string: {
      filter_operator: "==",
      aggregate: "count"
    },
    integer: {
      filter_operator: "==",
      aggregate: "sum",
      format: {}
    },
    boolean: {
      filter_operator: "==",
      aggregate: "count"
    },
    datetime: {
      filter_operator: "==",
      aggregate: "count",
      format: {
        week: "numeric",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric"
      },
      null_value: -1
    },
    date: {
      filter_operator: "==",
      aggregate: "count",
      format: {
        week: "numeric",
        year: "numeric",
        month: "numeric",
        day: "numeric"
      },
      null_value: -1
    }
  }
};


/***/ }),

/***/ "../packages/perspective/dist/esm/data_accessor/index.js":
/*!***************************************************************!*\
  !*** ../packages/perspective/dist/esm/data_accessor/index.js ***!
  \***************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DataAccessor": () => /* binding */ DataAccessor,
/* harmony export */   "clean_data": () => /* binding */ clean_data
/* harmony export */ });
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils.js */ "../packages/perspective/dist/esm/utils.js");
/* harmony import */ var _config_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../config/index.js */ "../packages/perspective/dist/esm/config/index.js");
/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */


class DataAccessor {
  constructor() {
    this.data_formats = {
      row: 0,
      column: 1,
      schema: 2
    };
    this.format = undefined;
    this.data = undefined;
    this.names = undefined;
    this.types = undefined;
    this.row_count = undefined;
  }

  is_format(data) {
    if (Array.isArray(data)) {
      return this.data_formats.row;
    } else if (Array.isArray(data[Object.keys(data)[0]])) {
      return this.data_formats.column;
    } else if (typeof data[Object.keys(data)[0]] === "string" || typeof data[Object.keys(data)[0]] === "function") {
      return this.data_formats.schema;
    } else {
      throw `Could not determine data format for ${JSON.stringify(data)}, with JS typeof ${typeof data}`;
    }
  }

  count_rows(data) {
    if (this.format === this.data_formats.row) {
      return data.length;
    } else if (this.format === this.data_formats.column) {
      return data[Object.keys(data)[0]].length;
    } else {
      return 0;
    }
  }

  get_format() {
    return this.format;
  }

  get(column_name, row_index) {
    let value = undefined;

    if (this.format === this.data_formats.row) {
      let d = this.data[row_index];

      if (d.hasOwnProperty(column_name)) {
        value = d[column_name];
      }
    } else if (this.format === this.data_formats.column) {
      if (this.data.hasOwnProperty(column_name)) {
        value = this.data[column_name][row_index];
      }
    } else if (this.format === this.data_formats.schema) {
      value = undefined;
    } else {
      throw `Could not get() from dataset - ${this.data} is poorly formatted.`;
    }

    return value;
  }

  marshal(column_index, row_index, type) {
    const column_name = this.names[column_index];
    let val = clean_data(this.get(column_name, row_index));

    if (val === null) {
      return null;
    }

    if (typeof val === "undefined") {
      return undefined;
    }

    switch ((0,_utils_js__WEBPACK_IMPORTED_MODULE_0__.get_column_type)(type.value)) {
      case "float":
      case "integer":
        {
          val = Number(val);
          break;
        }

      case "boolean":
        {
          if (typeof val === "string") {
            val.toLowerCase() === "true" ? val = true : val = false;
          } else {
            val = !!val;
          }

          break;
        }

      case "datetime":
      case "date":
        {
          break;
        }

      default:
        {
          val += ""; // TODO this is not right - might not be a string.  Need a data cleaner
        }
    }

    return val;
  }
  /**
   * Resets the internal state of the accessor, preventing collisions with
   * previously set data.
   *
   * @private
   */


  clean() {
    this.names = undefined;
    this.types = undefined;
  }
  /**
   * Links the accessor to a package of data for processing, calculating its
   * format and size.
   *
   * @private
   * @param {object} data
   *
   * @returns An object with 5 properties:
   *    cdata - an array of columnar data.
   *    names - the column names.
   *    types - the column t_dtypes.
   *    row_count - the number of rows per column.
   *    is_arrow - an internal flag marking arrow-formatted data
   */


  init(data) {
    this.data = data;
    this.format = this.is_format(this.data);
    this.row_count = this.count_rows(this.data);
    const overridden_types = {};

    if (this.format === this.data_formats.row) {
      if (data.length > 0) {
        this.names = Object.keys(data[0]);
      } else {
        this.clean.names = [];
      }
    } else if (this.format === this.data_formats.column) {
      this.names = Object.keys(data);
    } else if (this.format === this.data_formats.schema) {
      this.names = Object.keys(data);

      for (const name of this.names) {
        const new_type = (0,_config_index_js__WEBPACK_IMPORTED_MODULE_1__.get_type_config)(data[name]);

        if (new_type.type) {
          console.debug(`Converting "${data[name]}" to "${new_type.type}"`);
          overridden_types[name] = data[name];
          data[name] = new_type.type;
        }
      }
    } else {
      throw `Could not initialize - failed to determine format for ${data}`;
    }

    return overridden_types;
  }

}
/**
 * Coerce string null into value null.
 * @private
 * @param {*} value
 */

function clean_data(value) {
  if (value === null || value === "null") {
    return null;
  } else if (value === undefined || value === "undefined") {
    return undefined;
  } else {
    return value;
  }
}


/***/ }),

/***/ "../packages/perspective/dist/esm/emscripten.js":
/*!******************************************************!*\
  !*** ../packages/perspective/dist/esm/emscripten.js ***!
  \******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "extract_vector": () => /* binding */ extract_vector,
/* harmony export */   "extract_map": () => /* binding */ extract_map,
/* harmony export */   "fill_vector": () => /* binding */ fill_vector
/* harmony export */ });
/******************************************************************************
 *
 * Copyright (c) 2019, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/** Translation layer Interface between C++ and JS to handle conversions/data
 * structures that were previously handled in non-portable perspective.js
 */
const extract_vector = function (vector) {
  // handles deletion already - do not call delete() on the input vector again
  let extracted = [];

  for (let i = 0; i < vector.size(); i++) {
    let item = vector.get(i);
    extracted.push(item);
  }

  vector.delete();
  return extracted;
};
const extract_map = function (map) {
  // handles deletion already - do not call delete() on the input map again
  let extracted = {};
  let keys = map.keys();

  for (let i = 0; i < keys.size(); i++) {
    let key = keys.get(i);
    extracted[key] = map.get(key);
  }

  map.delete();
  keys.delete();
  return extracted;
};
/**
 * Given a C++ vector constructed in Emscripten, fill it with data. Assume that
 * data types are already validated, thus Emscripten will throw an error if the
 * vector is filled with the wrong type of data.
 *
 * @param {*} vector the `std::vector` to be filled
 * @param {Array} arr the `Array` from which to draw data
 *
 * @private
 */

const fill_vector = function (vector, arr) {
  for (const elem of arr) {
    vector.push_back(elem);
  }

  return vector;
};


/***/ }),

/***/ "../packages/perspective/dist/esm/perspective.js":
/*!*******************************************************!*\
  !*** ../packages/perspective/dist/esm/perspective.js ***!
  \*******************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => /* export default binding */ __WEBPACK_DEFAULT_EXPORT__
/* harmony export */ });
/* harmony import */ var _config_constants_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./config/constants.js */ "../packages/perspective/dist/esm/config/constants.js");
/* harmony import */ var _config_index_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./config/index.js */ "../packages/perspective/dist/esm/config/index.js");
/* harmony import */ var _data_accessor__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./data_accessor */ "../packages/perspective/dist/esm/data_accessor/index.js");
/* harmony import */ var _emscripten_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./emscripten.js */ "../packages/perspective/dist/esm/emscripten.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utils.js */ "../packages/perspective/dist/esm/utils.js");
/* harmony import */ var _api_server_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./api/server.js */ "../packages/perspective/dist/esm/api/server.js");
/* harmony import */ var _view_formatters__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./view_formatters */ "../packages/perspective/dist/esm/view_formatters.js");
/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */






 // IE fix - chrono::steady_clock depends on performance.now() which does not
// exist in IE workers

if (__webpack_require__.g.performance === undefined) {
  __webpack_require__.g.performance = {
    now: Date.now
  };
}

if (typeof self !== "undefined" && self.performance === undefined) {
  self.performance = {
    now: Date.now
  };
}

const WARNED_KEYS = new Set();
/**
 * The main API module for `@finos/perspective`.
 *
 * For more information, see the
 * [Javascript user guide](https://perspective.finos.org/docs/md/js.html).
 *
 * @module perspective
 */

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(Module) {
  let __MODULE__ = Module;
  let accessor = new _data_accessor__WEBPACK_IMPORTED_MODULE_2__.DataAccessor();
  const SIDES = ["zero", "one", "two"];
  /***************************************************************************
   *
   * Private
   *
   */

  let _POOL_DEBOUNCES = {};

  function _set_process(pool, table_id) {
    if (!_POOL_DEBOUNCES[table_id]) {
      _POOL_DEBOUNCES[table_id] = pool;
      setTimeout(() => _call_process(table_id));
    }
  }

  function _call_process(table_id) {
    const pool = _POOL_DEBOUNCES[table_id];

    if (pool) {
      pool._process();

      _remove_process(table_id);
    }
  }

  function _remove_process(table_id) {
    delete _POOL_DEBOUNCES[table_id];
  }

  function memory_usage() {
    const mem = performance.memory ? JSON.parse(JSON.stringify(performance.memory, ["totalJSHeapSize", "usedJSHeapSize", "jsHeapSizeLimit"])) : process.memoryUsage();
    mem.wasmHeap = __MODULE__.HEAP8.length;
    return mem;
  }
  /**
   * Common logic for creating and registering a Table.
   *
   * @param {DataAccessor|Object[]} accessor - the data we provide to the
   * Table
   * @param {Object} _Table - `undefined` if a new table will be created, or
   * an `std::shared_ptr<Table>` if updating.
   * @param {String} index - A column name to be used as a primary key.
   * @param {Number} limit - an upper bound on the number of rows in the
   * table. If set, new rows that exceed the limit start overwriting old ones
   * from row 0.
   * @param {t_op} op - either `OP_INSERT` or `OP_DELETE`
   * @param {boolean} is_update - true if we are updating an already-created
   * table
   * @param {boolean} is_arrow - true if the dataset is in the Arrow format
   * @param {Number} port_id - an integer indicating the internal `t_port`
   * which should receive this update.
   *
   * @private
   * @returns {Table} An `std::shared_ptr<Table>` to a `Table` inside C++.
   */


  function make_table(accessor, _Table, index, limit, op, is_update, is_arrow, is_csv, port_id) {
    // C++ constructor cannot take null values - use default values if
    // index or limit are null.
    if (!index) {
      index = "";
    }

    if (!limit) {
      limit = 4294967295;
    }

    _Table = __MODULE__.make_table(_Table, accessor, limit, index, op, is_update, is_arrow, is_csv, port_id);

    const pool = _Table.get_pool();

    const table_id = _Table.get_id();

    if (is_update || op == __MODULE__.t_op.OP_DELETE) {
      _set_process(pool, table_id);
    } else {
      pool._process();
    }

    return _Table;
  }
  /***************************************************************************
   *
   * View
   *
   */

  /**
   * A View object represents a specific transform (configuration or pivot,
   * filter, sort, etc) configuration on an underlying
   * {@link module:perspective~table}. A View receives all updates from the
   * {@link module:perspective~table} from which it is derived, and can be
   * serialized to JSON or trigger a callback when it is updated.  View
   * objects are immutable, and will remain in memory and actively process
   * updates until its {@link module:perspective~view#delete} method is
   * called.
   *
   * <strong>Note</strong> This constructor is not public - Views are created
   * by invoking the {@link module:perspective~table#view} method.
   *
   * @example
   * // Returns a new View, pivoted in the row space by the "name" column.
   * await table.view({row_pivots: ["name"]});
   *
   * @class
   * @hideconstructor
   */


  function view(table, sides, config, view_config, name) {
    this.name = name;
    this._View = undefined;
    this.table = table;
    this.config = config || {};
    this.view_config = view_config || new view_config();
    this.is_unit_context = this.table.index === "" && sides === 0 && this.view_config.row_pivots.length === 0 && this.view_config.column_pivots.length === 0 && this.view_config.filter.length === 0 && this.view_config.sort.length === 0 && this.view_config.expressions.length === 0;

    if (this.is_unit_context) {
      this._View = __MODULE__.make_view_unit(table._Table, name, _config_constants_js__WEBPACK_IMPORTED_MODULE_0__.COLUMN_SEPARATOR_STRING, this.view_config, null);
    } else if (sides === 0) {
      this._View = __MODULE__.make_view_zero(table._Table, name, _config_constants_js__WEBPACK_IMPORTED_MODULE_0__.COLUMN_SEPARATOR_STRING, this.view_config, null);
    } else if (sides === 1) {
      this._View = __MODULE__.make_view_one(table._Table, name, _config_constants_js__WEBPACK_IMPORTED_MODULE_0__.COLUMN_SEPARATOR_STRING, this.view_config, null);
    } else if (sides === 2) {
      this._View = __MODULE__.make_view_two(table._Table, name, _config_constants_js__WEBPACK_IMPORTED_MODULE_0__.COLUMN_SEPARATOR_STRING, this.view_config, null);
    }

    this.ctx = this._View.get_context();
    this.column_only = this._View.is_column_only();
    this.update_callbacks = this.table.update_callbacks;
    this.overridden_types = this.table.overridden_types;
    this._delete_callbacks = [];
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.bindall)(this);
  }
  /**
   * A copy of the config object passed to the {@link table#view} method which
   * created this {@link module:perspective~view}.
   *
   * @returns {Promise<object>} Shared the same key/values properties as
   * {@link module:perspective~view}
   */


  view.prototype.get_config = function () {
    return JSON.parse(JSON.stringify(this.config));
  };
  /**
   * Delete this {@link module:perspective~view} and clean up all resources
   * associated with it. View objects do not stop consuming resources or
   * processing updates when they are garbage collected - you must call this
   * method to reclaim these.
   *
   * @async
   */


  view.prototype.delete = function () {
    _remove_process(this.table.get_id());

    this._View.delete();

    this.ctx.delete();
    this.table.views.splice(this.table.views.indexOf(this), 1);
    this.table = undefined;
    let i = 0,
        j = 0; // Remove old update callbacks from the Table.

    while (i < this.update_callbacks.length) {
      let val = this.update_callbacks[i];
      if (val.view !== this) this.update_callbacks[j++] = val;
      i++;
    }

    this.update_callbacks.length = j;

    this._delete_callbacks.forEach(cb => cb());
  };
  /**
   * How many pivoted sides does this {@link module:perspective~view} have?
   *
   * @private
   * @returns {number} sides The number of sides of this
   * {@link module:perspective~view}.
   */


  view.prototype.sides = function () {
    return this._View.sides();
  };
  /**
   * Counts hidden columns in the {@link module:perspective~view}. A hidden
   * column is a column used as a sort column, but not shown in the view.
   *
   * @private
   * @returns {number} sides The number of hidden columns in this
   * {@link module:perspective~view}.
   */


  view.prototype._num_hidden = function () {
    // Count hidden columns.
    let hidden = 0;

    for (const sort of this.config.sort) {
      if (this.config.columns.indexOf(sort[0]) === -1) {
        hidden++;
      }
    }

    return hidden;
  };

  function col_path_vector_to_string(vector) {
    let extracted = [];

    for (let i = 0; i < vector.size(); i++) {
      let s = vector.get(i);
      extracted.push(__MODULE__.scalar_to_val(s, false, true));
      s.delete();
    }

    vector.delete();
    return extracted;
  }

  const extract_vector_scalar = function (vector) {
    // handles deletion already - do not call delete() on the input vector
    // again
    let extracted = [];

    for (let i = 0; i < vector.size(); i++) {
      let item = vector.get(i);
      extracted.push(col_path_vector_to_string(item));
    }

    vector.delete();
    return extracted;
  };
  /**
   * The schema of this {@link module:perspective~view}.
   *
   * A schema is an Object, the keys of which are the columns of this
   * {@link module:perspective~view}, and the values are their string type
   * names. If this {@link module:perspective~view} is aggregated, theses will
   * be the aggregated types; otherwise these types will be the same as the
   * columns in the underlying {@link module:perspective~table}.
   *
   * @example
   * // Create a view
   * const view = await table.view({
   *      columns: ["a", "b"]
   * });
   * const schema = await view.schema(); // {a: "float", b: "string"}
   *
   * @async
   *
   * @returns {Promise<Object>} A Promise of this
   * {@link module:perspective~view}'s schema.
   */


  view.prototype.schema = function (override = true) {
    const schema = (0,_emscripten_js__WEBPACK_IMPORTED_MODULE_3__.extract_map)(this._View.schema());

    if (override) {
      for (const key of Object.keys(schema)) {
        let colname = key.split(_config_constants_js__WEBPACK_IMPORTED_MODULE_0__.COLUMN_SEPARATOR_STRING);
        colname = colname[colname.length - 1];

        if (this.overridden_types[colname] && (0,_config_index_js__WEBPACK_IMPORTED_MODULE_1__.get_type_config)(this.overridden_types[colname]).type === schema[key]) {
          schema[key] = this.overridden_types[colname];
        }
      }
    }

    return schema;
  };
  /**
   * The expression schema of this {@link module:perspective~view},
   * which contains only the expressions created on this view.
   *
   * A schema is an Object, the keys of which are the columns of this
   * {@link module:perspective~view}, and the values are their string type
   * names. If this {@link module:perspective~view} is aggregated, these will
   * be the aggregated types; otherwise these types will be the same as the
   * columns in the underlying {@link module:perspective~table}.
   *
   * @example
   * // Create a view with expressions
   * const view = table.view({
   *      expressions: ['"x" + "y" - 100']
   * });
   *
   * await view.expression_schema(); // {'"x" + "y" - 100': "float"}
   *
   * @async
   *
   * @returns {Promise<Object>} A Promise of this
   * {@link module:perspective~view}'s expression schema.
   */


  view.prototype.expression_schema = function (override = true) {
    const schema = (0,_emscripten_js__WEBPACK_IMPORTED_MODULE_3__.extract_map)(this._View.expression_schema());

    if (override) {
      for (const key of Object.keys(schema)) {
        let colname = key.split(_config_constants_js__WEBPACK_IMPORTED_MODULE_0__.COLUMN_SEPARATOR_STRING);
        colname = colname[colname.length - 1];

        if (this.overridden_types[colname] && (0,_config_index_js__WEBPACK_IMPORTED_MODULE_1__.get_type_config)(this.overridden_types[colname]).type === schema[key]) {
          schema[key] = this.overridden_types[colname];
        }
      }
    }

    return schema;
  };

  view.prototype._column_names = function (skip = false, depth = 0) {
    return extract_vector_scalar(this._View.column_names(skip, depth)).map(x => x.join(_config_constants_js__WEBPACK_IMPORTED_MODULE_0__.COLUMN_SEPARATOR_STRING));
  };
  /**
   * Returns an array of strings containing the column paths of the View
   * without any of the source columns.
   *
   * A column path shows the columns that a given cell belongs to after pivots
   * are applied.
   *
   * @returns {Array<String>} an Array of Strings containing the column paths.
   */


  view.prototype.column_paths = function () {
    return extract_vector_scalar(this._View.column_paths()).map(x => x.join(_config_constants_js__WEBPACK_IMPORTED_MODULE_0__.COLUMN_SEPARATOR_STRING));
  };

  view.prototype.get_data_slice = function (start_row, end_row, start_col, end_col) {
    if (this.is_unit_context) {
      return __MODULE__.get_data_slice_unit(this._View, start_row, end_row, start_col, end_col);
    } else {
      const num_sides = this.sides();
      const nidx = SIDES[num_sides];
      return __MODULE__[`get_data_slice_${nidx}`](this._View, start_row, end_row, start_col, end_col);
    }
  };
  /**
   * Given an `options` Object, calculate the correct start/end rows and
   * columns, as well as other metadata required by the data formatter.
   *
   * @private
   * @param {Object} options User-provided options for `to_format`.
   * @returns {Object} an Object containing the parsed options.
   */


  const _parse_format_options = function (options) {
    options = options || {};
    const max_cols = this._View.num_columns() + (this.sides() === 0 ? 0 : 1);

    const max_rows = this._View.num_rows();

    const hidden = this._num_hidden();

    const psp_offset = this.sides() > 0 || this.column_only ? 1 : 0;
    const viewport = this.config.viewport ? this.config.viewport : {};
    const start_row = options.start_row || (viewport.top ? viewport.top : 0);
    const end_row = Math.min(max_rows, options.end_row !== undefined ? options.end_row : viewport.height ? start_row + viewport.height : max_rows);
    const start_col = options.start_col || (viewport.left ? viewport.left : 0);
    const end_col = Math.min(max_cols, (options.end_col !== undefined ? options.end_col + psp_offset : viewport.width ? start_col + viewport.width : max_cols) * (hidden + 1)); // Return the calculated values

    options.start_row = Math.floor(start_row);
    options.end_row = Math.ceil(end_row);
    options.start_col = Math.floor(start_col);
    options.end_col = Math.ceil(end_col);
    return options;
  };
  /**
   * Calculates the [min, max] of the leaf nodes of a column `colname`.
   *
   * @param {String} colname A column name in this `View`.
   * @returns {Array<Object>} A tuple of [min, max], whose types are column
   * and aggregate dependent.
   */


  view.prototype.get_min_max = function (colname) {
    if (this.is_unit_context) {
      return __MODULE__.get_min_max_unit(this._View, colname);
    } else {
      const num_sides = this.sides();
      const nidx = SIDES[num_sides];
      return __MODULE__[`get_min_max_${nidx}`](this._View, colname);
    }
  };
  /**
   * Generic base function from which `to_json`, `to_columns` etc. derives.
   *
   * @private
   */


  const to_format = function (options, formatter) {
    _call_process(this.table.get_id());

    options = _parse_format_options.bind(this)(options);
    const start_row = options.start_row;
    const end_row = options.end_row;
    const start_col = options.start_col;
    const end_col = options.end_col;

    const hidden = this._num_hidden();

    const is_formatted = options.formatted;
    const get_pkeys = !!options.index;
    const get_ids = !!options.id;
    const leaves_only = !!options.leaves_only;
    const num_sides = this.sides();
    const has_row_path = num_sides !== 0 && !this.column_only;
    const nidx = SIDES[num_sides];
    let get_from_data_slice;

    if (this.is_unit_context) {
      get_from_data_slice = __MODULE__.get_from_data_slice_unit;
    } else {
      get_from_data_slice = __MODULE__[`get_from_data_slice_${nidx}`];
    }

    const slice = this.get_data_slice(start_row, end_row, start_col, end_col);
    const ns = slice.get_column_names();
    const col_names = extract_vector_scalar(ns).map(x => x.join(_config_constants_js__WEBPACK_IMPORTED_MODULE_0__.COLUMN_SEPARATOR_STRING));
    const schema = this.schema();
    let data = formatter.initDataValue();

    for (let ridx = start_row; ridx < end_row; ridx++) {
      let row_path = has_row_path ? slice.get_row_path(ridx) : undefined;

      if (has_row_path && leaves_only && row_path.size() < this.config.row_pivots.length) {
        row_path.delete();
        continue;
      }

      let row = formatter.initRowValue();

      if (get_ids) {
        formatter.initColumnValue(data, row, "__ID__");
      }

      for (let cidx = start_col; cidx < end_col; cidx++) {
        const col_name = col_names[cidx];
        const col_type = schema[col_name];
        const type_config = (0,_config_index_js__WEBPACK_IMPORTED_MODULE_1__.get_type_config)(col_type);

        if (cidx === start_col && num_sides !== 0) {
          if (!this.column_only) {
            formatter.initColumnValue(data, row, "__ROW_PATH__");

            for (let i = 0; i < row_path.size(); i++) {
              const s = row_path.get(i);

              const value = __MODULE__.scalar_to_val(s, false, false);

              s.delete();
              formatter.addColumnValue(data, row, "__ROW_PATH__", value);

              if (get_ids) {
                formatter.addColumnValue(data, row, "__ID__", value);
              }
            }
          }
        } else if ((cidx - (num_sides > 0 ? 1 : 0)) % (this.config.columns.length + hidden) >= this.config.columns.length) {
          // Hidden columns are always at the end, so don't emit
          // these.
          continue;
        } else {
          let value = get_from_data_slice(slice, ridx, cidx);

          if (is_formatted && value !== null && value !== undefined) {
            if (col_type === "datetime" || col_type === "date") {
              // TODO Annoyingly, CSV occupies the gray area of
              // needing formatting _just_ for Date and Datetime -
              // e.g., 10000 will format as CSV `"10,000.00"
              // Otherwise, this would not need to be conditional.
              value = new Date(value);
              value = value.toLocaleString("en-us", type_config.format);
            }
          }

          formatter.setColumnValue(data, row, col_name, value);
        }
      }

      if (get_pkeys) {
        const keys = slice.get_pkeys(ridx, 0);
        formatter.initColumnValue(data, row, "__INDEX__");

        for (let i = 0; i < keys.size(); i++) {
          // TODO: if __INDEX__ and set index have the same value,
          // don't we need to make sure that it only emits one?
          const s = keys.get(i);

          const value = __MODULE__.scalar_to_val(s, false, false);

          s.delete();
          formatter.addColumnValue(data, row, "__INDEX__", value);
        }

        keys.delete();
      } // we could add an api to just clone the index column if
      // it's already calculated


      if (get_ids && num_sides === 0) {
        const keys = slice.get_pkeys(ridx, 0);

        for (let i = 0; i < keys.size(); i++) {
          const s = keys.get(i);

          const value = __MODULE__.scalar_to_val(s, false, false);

          s.delete();
          formatter.addColumnValue(data, row, "__ID__", value);
        }

        keys.delete();
      }

      if (row_path) {
        row_path.delete();
      }

      formatter.addRow(data, row);
    }

    slice.delete();
    return formatter.formatData(data, options.config);
  };
  /**
   * Generic base function for returning serialized data for a single column.
   *
   * @private
   */


  const column_to_format = function (col_name, options, format_function) {
    const num_rows = this.num_rows();
    const start_row = options.start_row || 0;
    const end_row = options.end_row || num_rows;

    const names = this._column_names();

    let idx = names.indexOf(col_name);

    if (idx === -1) {
      return undefined;
    } // mutate the column index if necessary: in pivoted views, columns start
    // at 1


    const num_sides = this.sides();

    if (num_sides > 0) {
      idx++;
    } // use a specified data slice, if provided


    let slice, data_slice;

    if (!options.data_slice) {
      data_slice = this.get_data_slice(start_row, end_row, idx, idx + 1);
      slice = data_slice.get_slice();
    } else {
      slice = options.data_slice.get_column_slice(idx);
    }

    const dtype = this._View.get_column_dtype(idx);

    const rst = format_function(slice, dtype, idx);
    slice.delete();

    if (data_slice) {
      data_slice.delete();
    }

    return rst;
  };
  /**
   * Serializes this view to JSON data in a column-oriented format.
   *
   * @async
   *
   * @param {Object} [options] An optional configuration object.
   * @param {number} options.start_row The starting row index from which to
   * serialize.
   * @param {number} options.end_row The ending row index from which to
   * serialize.
   * @param {number} options.start_col The starting column index from which to
   * serialize.
   * @param {number} options.end_col The ending column index from which to
   * serialize.
   * @param {boolean} [config.index=false] Should the index from the
   * underlying {@link module:perspective~table} be in the output (as
   * `"__INDEX__"`).
   *
   * @returns {Promise<Array>} A Promise resolving to An array of Objects
   * representing the rows of this {@link module:perspective~view}.  If this
   * {@link module:perspective~view} had a "row_pivots" config parameter
   * supplied when constructed, each row Object will have a "__ROW_PATH__"
   * key, whose value specifies this row's aggregated path.  If this
   * {@link module:perspective~view} had a "column_pivots" config parameter
   * supplied, the keys of this object will be comma-prepended with their
   * comma-separated column paths.
   */


  view.prototype.to_columns = function (options) {
    return to_format.call(this, options, _view_formatters__WEBPACK_IMPORTED_MODULE_6__.default.jsonTableFormatter);
  };
  /**
   * Serializes this view to JSON data in a row-oriented format.
   *
   * @async
   *
   * @param {Object} [options] An optional configuration object.
   * @param {number} options.start_row The starting row index from which to
   * serialize.
   * @param {number} options.end_row The ending row index from which to
   * serialize.
   * @param {number} options.start_col The starting column index from which to
   * serialize.
   * @param {number} options.end_col The ending column index from which to
   * serialize.
   *
   * @returns {Promise<Array>} A Promise resolving to An array of Objects
   * representing the rows of this {@link module:perspective~view}.  If this
   * {@link module:perspective~view} had a "row_pivots" config parameter
   * supplied when constructed, each row Object will have a "__ROW_PATH__"
   * key, whose value specifies this row's aggregated path.  If this
   * {@link module:perspective~view} had a "column_pivots" config parameter
   * supplied, the keys of this object will be comma-prepended with their
   * comma-separated column paths.
   */


  view.prototype.to_json = function (options) {
    return to_format.call(this, options, _view_formatters__WEBPACK_IMPORTED_MODULE_6__.default.jsonFormatter);
  };
  /**
   * Serializes this view to CSV data in a standard format.
   *
   * @async
   *
   * @param {Object} [options] An optional configuration object.
   * @param {number} options.start_row The starting row index from which to
   * serialize.
   * @param {number} options.end_row The ending row index from which to
   * serialize.
   * @param {number} options.start_col The starting column index from which to
   * serialize.
   * @param {number} options.end_col The ending column index from which to
   * serialize.
   * @returns {Promise<string>} A Promise resolving to a string in CSV format
   * representing the rows of this {@link module:perspective~view}.  If this
   * {@link module:perspective~view} had a "row_pivots" config parameter
   * supplied when constructed, each row will have prepended those values
   * specified by this row's aggregated path.  If this
   * {@link module:perspective~view} had a "column_pivots" config parameter
   * supplied, the keys of this object will be comma-prepended with their
   * comma-separated column paths.
   */


  view.prototype.to_csv = function (options) {
    return to_format.call(this, options, _view_formatters__WEBPACK_IMPORTED_MODULE_6__.default.csvFormatter);
  };
  /**
   * Serializes a view column into a TypedArray.
   *
   * @async
   *
   * @param {string} column_name The name of the column to serialize.
   *
   * @param {Object} options An optional configuration object.
   *
   * @param {*} options.data_slice A data slice object from which to
   * serialize.
   *
   * @param {number} options.start_row The starting row index from which to
   * serialize.
   * @param {number} options.end_row The ending row index from which to
   * serialize.
   *
   * @returns {Promise<TypedArray>} A promise resolving to a TypedArray
   * representing the data of the column as retrieved from the
   * {@link module:perspective~view} - all pivots, aggregates, sorts, and
   * filters have been applied onto the values inside the TypedArray. The
   * TypedArray will be constructed based on data type - integers will resolve
   * to Int8Array, Int16Array, or Int32Array. Floats resolve to Float32Array
   * or Float64Array. If the column cannot be found, or is not of an
   * integer/float type, the Promise returns undefined.
   */


  view.prototype.col_to_js_typed_array = function (col_name, options = {}) {
    const format_function = __MODULE__[`col_to_js_typed_array`];
    return column_to_format.call(this, col_name, options, format_function);
  };
  /**
   * Serializes a view to the Apache Arrow data format.
   *
   * @async
   *
   * @param {Object} [options] An optional configuration object.
   *
   * @param {number} options.start_row The starting row index from which to
   * serialize.
   * @param {number} options.end_row The ending row index from which to
   * serialize.
   * @param {number} options.start_col The starting column index from which to
   * serialize.
   * @param {number} options.end_col The ending column index from which to
   * serialize.
   *
   * @returns {Promise<ArrayBuffer>} An `ArrayBuffer` in the Apache Arrow
   * format containing data from the view.
   */


  view.prototype.to_arrow = function (options = {}) {
    _call_process(this.table.get_id());

    options = _parse_format_options.bind(this)(options);
    const start_row = options.start_row;
    const end_row = options.end_row;
    const start_col = options.start_col;
    const end_col = options.end_col;
    const sides = this.sides();

    if (this.is_unit_context) {
      return __MODULE__.to_arrow_unit(this._View, start_row, end_row, start_col, end_col);
    } else if (sides === 0) {
      return __MODULE__.to_arrow_zero(this._View, start_row, end_row, start_col, end_col);
    } else if (sides === 1) {
      return __MODULE__.to_arrow_one(this._View, start_row, end_row, start_col, end_col);
    } else if (sides === 2) {
      return __MODULE__.to_arrow_two(this._View, start_row, end_row, start_col, end_col);
    }
  };
  /**
   * The number of aggregated rows in this {@link module:perspective~view}.
   * This is affected by the "row_pivots" configuration parameter supplied to
   * this {@link module:perspective~view}'s contructor.
   *
   * @async
   *
   * @returns {Promise<number>} The number of aggregated rows.
   */


  view.prototype.num_rows = function () {
    return this._View.num_rows();
  };
  /**
   * The number of aggregated columns in this {@link view}.  This is affected
   * by the "column_pivots" configuration parameter supplied to this
   * {@link view}'s contructor.
   *
   * @async
   *
   * @returns {Promise<number>} The number of aggregated columns.
   */


  view.prototype.num_columns = function () {
    const ncols = this._View.num_columns();

    const nhidden = this._num_hidden();

    return ncols - ncols / (this.config.columns.length + nhidden) * nhidden;
  };
  /**
   * Whether this row at index `idx` is in an expanded or collapsed state.
   *
   * @async
   *
   * @returns {Promise<bool>} Whether this row is expanded.
   */


  view.prototype.get_row_expanded = function (idx) {
    return this._View.get_row_expanded(idx);
  };
  /**
   * Expands the row at index `idx`.
   *
   * @async
   *
   * @returns {Promise<void>}
   */


  view.prototype.expand = function (idx) {
    return this._View.expand(idx, this.config.row_pivots.length);
  };
  /**
   * Collapses the row at index `idx`.
   *
   * @async
   *
   * @returns {Promise<void>}
   */


  view.prototype.collapse = function (idx) {
    return this._View.collapse(idx);
  };
  /**
   * Set expansion `depth` of the pivot tree.
   *
   */


  view.prototype.set_depth = function (depth) {
    return this._View.set_depth(depth, this.config.row_pivots.length);
  };
  /**
   * Returns the data of all changed rows in JSON format, or for 1+ sided
   * contexts the entire dataset of the view.
   * @private
   */


  view.prototype._get_step_delta = async function () {
    let delta = this._View.get_step_delta(0, 2147483647);

    let data;

    if (delta.cells.size() === 0) {
      // FIXME This is currently not implemented for 1+ sided contexts.
      data = this.to_json();
    } else {
      let rows = {};

      for (let x = 0; x < delta.cells.size(); x++) {
        rows[delta.cells.get(x).row] = true;
      }

      rows = Object.keys(rows);
      const results = rows.map(row => this.to_json({
        start_row: Number.parseInt(row),
        end_row: Number.parseInt(row) + 1
      }));
      data = [].concat.apply([], results);
    }

    delta.cells.delete();
    return data;
  };
  /**
   * Returns an Arrow-serialized dataset that contains the data from updated
   * rows. Do not call this function directly, instead use the
   * {@link module:perspective~view}'s `on_update` method with `{mode: "row"}`
   * in order to access the row deltas.
   *
   * @private
   */


  view.prototype._get_row_delta = async function () {
    if (this.is_unit_context) {
      return __MODULE__.get_row_delta_unit(this._View);
    } else {
      const sides = this.sides();
      const nidx = SIDES[sides];
      return __MODULE__[`get_row_delta_${nidx}`](this._View);
    }
  };
  /**
   * Register a callback with this {@link module:perspective~view}. Whenever
   * the {@link module:perspective~view}'s underlying table emits an update,
   * this callback will be invoked with an object containing `port_id`,
   * indicating which port the update fired on, and optionally `delta`, which
   * is the new data that was updated for each cell or each row.
   *
   * @example
   * // Attach an `on_update` callback
   * view.on_update(updated => console.log(updated.port_id));
   *
   * @example
   * // `on_update` with row deltas
   * view.on_update(updated => console.log(updated.delta), {mode: "row"});
   *
   * @param {function} callback A callback function invoked on update, which
   * receives an object with two keys: `port_id`, indicating which port the
   * update was triggered on, and `delta`, whose value is dependent on the
   * `mode` parameter:
   *     - "none" (default): `delta` is `undefined`.
   *     - "row": `delta` is an Arrow of the updated rows.
   */


  view.prototype.on_update = function (callback, {
    mode = "none"
  } = {}) {
    _call_process(this.table.get_id());

    if (["none", "row"].indexOf(mode) === -1) {
      throw new Error(`Invalid update mode "${mode}" - valid modes are "none" and "row".`);
    }

    if (mode === "row") {
      // Enable deltas only if needed by callback
      if (!this._View._get_deltas_enabled()) {
        this._View._set_deltas_enabled(true);
      }
    }

    this.update_callbacks.push({
      view: this,
      orig_callback: callback,
      callback: async (port_id, cache) => {
        // Cache prevents repeated calls to expensive delta functions
        // for on_update callbacks triggered sequentially from the same
        // update delta.
        if (cache[port_id] === undefined) {
          cache[port_id] = {};
        }

        let updated = {
          port_id
        };

        if (mode === "row") {
          if (cache[port_id]["row_delta"] === undefined) {
            cache[port_id]["row_delta"] = await this._get_row_delta();
          }

          updated.delta = cache[port_id]["row_delta"];
        } // Call the callback with the updated object containing
        // `port_id` and `delta`.


        callback(updated);
      }
    });
  };

  function filterInPlace(a, condition) {
    let i = 0,
        j = 0;

    while (i < a.length) {
      const val = a[i];
      if (condition(val, i, a)) a[j++] = val;
      i++;
    }

    a.length = j;
    return a;
  }
  /*
   * Unregister a previously registered update callback with this
   * {@link module:perspective~view}.
   *
   * @example
   * // remove an `on_update` callback
   * const callback = updated => console.log(updated);
   * view.remove_update(callback);
   *
   * @param {function} callback A update callback function to be removed
   */


  view.prototype.remove_update = function (callback) {
    _call_process(this.table.get_id());

    const total = this.update_callbacks.length;
    filterInPlace(this.update_callbacks, x => x.orig_callback !== callback);
    console.assert(total > this.update_callbacks.length, `"callback" does not match a registered updater`);
  };
  /**
   * Register a callback with this {@link module:perspective~view}.  Whenever
   * the {@link module:perspective~view} is deleted, this callback will be
   * invoked.
   *
   * @example
   * // attach an `on_delete` callback
   * view.on_delete(() => console.log("Deleted!"));
   *
   * @param {function} callback A callback function invoked on delete.
   */


  view.prototype.on_delete = function (callback) {
    this._delete_callbacks.push(callback);
  };
  /**
   * Unregister a previously registered delete callback with this
   * {@link module:perspective~view}.
   *
   * @example
   * // remove an `on_delete` callback
   * const callback = () => console.log("Deleted!")
   * view.remove_delete(callback);
   *
   * @param {function} callback A delete callback function to be removed
   */


  view.prototype.remove_delete = function (callback) {
    const initial_length = this._delete_callbacks.length;
    filterInPlace(this._delete_callbacks, cb => cb !== callback);
    console.assert(initial_length > this._delete_callbacks.length, `"callback" does not match a registered delete callbacks`);
  };
  /**
   * A view config is a set of options that configures the underlying
   * {@link module:perspective~view}, specifying its pivots, columns to show,
   * aggregates, filters, and sorts.
   *
   * The view config receives an `Object` containing configuration options,
   * and the `view_config` transforms it into a canonical format for
   * interfacing with the core engine.
   *
   * <strong>Note</strong> This constructor is not public - view config
   * objects should be created using standard Javascript `Object`s in the
   * {@link module:perspective~table#view} method, which has an `options`
   * parameter.
   *
   * @param {Object} config the configuration `Object` passed by the user to
   * the {@link module:perspective~table#view} method.
   * @private
   * @class
   * @hideconstructor
   */


  function view_config(config) {
    this.row_pivots = config.row_pivots || [];
    this.column_pivots = config.column_pivots || [];
    this.aggregates = config.aggregates || {};
    this.columns = config.columns;
    this.filter = config.filter || [];
    this.sort = config.sort || [];
    this.expressions = config.expressions || [];
    this.filter_op = config.filter_op || "and";
    this.row_pivot_depth = config.row_pivot_depth;
    this.column_pivot_depth = config.column_pivot_depth;
  }
  /**
   * Transform configuration items into `std::vector` objects for interface
   * with C++. `this.aggregates` is not transformed into a C++ map, as the use
   * of `ordered_map` in the engine makes binding more difficult.
   *
   * @private
   */


  view_config.prototype.get_row_pivots = function () {
    let vector = __MODULE__.make_string_vector();

    return (0,_emscripten_js__WEBPACK_IMPORTED_MODULE_3__.fill_vector)(vector, this.row_pivots);
  };

  view_config.prototype.get_column_pivots = function () {
    let vector = __MODULE__.make_string_vector();

    return (0,_emscripten_js__WEBPACK_IMPORTED_MODULE_3__.fill_vector)(vector, this.column_pivots);
  };

  view_config.prototype.get_columns = function () {
    let vector = __MODULE__.make_string_vector();

    return (0,_emscripten_js__WEBPACK_IMPORTED_MODULE_3__.fill_vector)(vector, this.columns);
  };

  view_config.prototype.get_filter = function () {
    let vector = __MODULE__.make_2d_val_vector();

    for (let filter of this.filter) {
      let filter_vector = __MODULE__.make_val_vector();

      let filled = (0,_emscripten_js__WEBPACK_IMPORTED_MODULE_3__.fill_vector)(filter_vector, filter);
      vector.push_back(filled);
    }

    return vector;
  };

  view_config.prototype.get_sort = function () {
    let vector = __MODULE__.make_2d_string_vector();

    for (let sort of this.sort) {
      let sort_vector = __MODULE__.make_string_vector();

      let filled = (0,_emscripten_js__WEBPACK_IMPORTED_MODULE_3__.fill_vector)(sort_vector, sort);
      vector.push_back(filled);
    }

    return vector;
  };

  view_config.prototype.get_expressions = function () {
    let vector = __MODULE__.make_2d_val_vector();

    for (let expression of this.expressions) {
      let inner = __MODULE__.make_val_vector();

      for (let val of expression) {
        inner.push_back(val);
      }

      vector.push_back(inner);
    }

    return vector;
  };
  /***************************************************************************
   *
   * Table
   *
   */

  /**
   * A Table object is the basic data container in Perspective.  Tables are
   * typed - they have an immutable set of column names, and a known type for
   * each.
   *
   * <strong>Note</strong> This constructor is not public - Tables are created
   * by invoking the {@link module:perspective~table} factory method, either
   * on the perspective module object, or an a
   * {@link module:perspective~worker} instance.
   *
   * @class
   * @hideconstructor
   */


  function table(_Table, index, limit, overridden_types) {
    this._Table = _Table;
    this.gnode_id = this._Table.get_gnode().get_id();

    this._Table.get_pool().set_update_delegate(this);

    this.name = Math.random() + "";
    this.initialized = false;
    this.index = index;
    this.limit = limit;
    this.update_callbacks = [];
    this._delete_callbacks = [];
    this.views = [];
    this.overridden_types = overridden_types;
    (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.bindall)(this);
  }

  table.prototype.get_id = function () {
    return this._Table.get_id();
  };

  table.prototype.get_pool = function () {
    return this._Table.get_pool();
  };

  table.prototype.make_port = function () {
    return this._Table.make_port();
  };

  table.prototype.remove_port = function () {
    this._Table.remove_port();
  };

  table.prototype._update_callback = function (port_id) {
    let cache = {};

    for (let e in this.update_callbacks) {
      this.update_callbacks[e].callback(port_id, cache);
    }
  };
  /**
   * Returns the user-specified index column for this
   * {@link module:perspective~table} or null if an index is not set.
   */


  table.prototype.get_index = function () {
    return this.index;
  };
  /**
   * Returns the user-specified limit column for this
   * {@link module:perspective~table} or null if an limit is not set.
   */


  table.prototype.get_limit = function () {
    return this.limit;
  };
  /**
   * Remove all rows in this {@link module:perspective~table} while preserving
   * the schema and construction options.
   */


  table.prototype.clear = function () {
    _remove_process(this.get_id());

    this._Table.reset_gnode(this.gnode_id);
  };
  /**
   * Replace all rows in this {@link module:perspective~table} the input data.
   */


  table.prototype.replace = function (data) {
    _remove_process(this.get_id());

    this._Table.reset_gnode(this.gnode_id);

    this.update(data);

    _call_process(this.get_id());
  };
  /**
   * Delete this {@link module:perspective~table} and clean up all resources
   * associated with it. Table objects do not stop consuming resources or
   * processing updates when they are garbage collected - you must call this
   * method to reclaim these.
   */


  table.prototype.delete = function () {
    if (this.views.length > 0) {
      throw `Cannot delete Table as it still has ${this.views.length} registered View(s).`;
    }

    _remove_process(this.get_id());

    this._Table.unregister_gnode(this.gnode_id);

    this._Table.delete(); // Call delete callbacks


    for (const callback of this._delete_callbacks) {
      callback();
    }
  };
  /**
   * Register a callback with this {@link module:perspective~table}.  Whenever
   * the {@link module:perspective~table} is deleted, this callback will be
   * invoked.
   *
   * @param {function} callback A callback function with no parameters
   *      that will be invoked on `delete()`.
   */


  table.prototype.on_delete = function (callback) {
    this._delete_callbacks.push(callback);
  };
  /**
   * Unregister a previously registered delete callback with this
   * {@link module:perspective~table}.
   *
   * @param {function} callback A delete callback function to be removed
   */


  table.prototype.remove_delete = function (callback) {
    const initial_length = this._delete_callbacks.length;
    filterInPlace(this._delete_callbacks, cb => cb !== callback);
    console.assert(initial_length > this._delete_callbacks.length, `"callback" does not match a registered delete callbacks`);
  };
  /**
   * The number of accumulated rows in this {@link module:perspective~table}.
   * This is affected by the "index" configuration parameter supplied to this
   * {@link module:perspective~view}'s contructor - as rows will be
   * overwritten when they share an idnex column.
   *
   * @async
   *
   * @returns {Promise<number>} The number of accumulated rows.
   */


  table.prototype.size = function () {
    _call_process(this._Table.get_id());

    return this._Table.size();
  };
  /**
   * The schema of this {@link module:perspective~table}.  A schema is an
   * Object whose keys are the columns of this
   * {@link module:perspective~table}, and whose values are their string type
   * names.
   *
   * @async
   * @returns {Promise<Object>} A Promise of this
   * {@link module:perspective~table}'s schema.
   */


  table.prototype.schema = function (override = true) {
    let schema = this._Table.get_schema();

    let columns = schema.columns();
    let types = schema.types();
    let new_schema = {};

    for (let key = 0; key < columns.size(); key++) {
      const name = columns.get(key);

      if (name === "psp_okey") {
        continue;
      }

      if (override && this.overridden_types[name]) {
        new_schema[name] = this.overridden_types[name];
      } else {
        new_schema[name] = (0,_utils_js__WEBPACK_IMPORTED_MODULE_4__.get_column_type)(types.get(key).value);
      }
    }

    schema.delete();
    columns.delete();
    types.delete();
    return new_schema;
  };
  /**
   * Transform an expression string into a vector that internally provides
   * the engine with more metadata in order to efficiently compute the
   * expression:
   *
   * v[0]: the expression string as typed by the user
   * v[1]: the expression string with "column" replaced with col0, col1,
   *  etc., which allows for faster lookup of column values.
   * v[2]: a map of column keys (col0, col1) to actual column names,
   *  which will be used in the engine to look up column values.
   *
   * @private
   * @param {Array<String>} expressions
   */


  function parse_expression_strings(expressions) {
    let validated_expressions = [];
    const expression_idx_map = {};

    for (let expression_string of expressions) {
      if (expression_string.includes('""')) {
        console.error(`Skipping expression '${expression_string}', as it cannot reference an empty column!`);
        continue;
      } // Map of column names to column IDs, so that we generate
      // column IDs correctly without collision.


      let column_name_map = {}; // Map of column IDs to column names, so the engine can look
      // up the right column internally without more transforms.

      let column_id_map = {};
      let running_cidx = 0; // First, look for a column alias, which is a // style comment
      // on the first line of the expression.

      let expression_alias;
      let parsed_expression_string = expression_string.replace(/\/\/(.+?)$/m, (_, alias) => {
        expression_alias = alias.trim();
        return "";
      }); // If an alias does not exist, the alias is the expression itself.

      if (!expression_alias || expression_alias.length == 0) {
        expression_alias = expression_string;
      }

      parsed_expression_string = parsed_expression_string.replace(/\"(.*?[^\\])\"/g, (_, cname) => {
        // If the column name contains escaped double quotes, replace
        // them and assume that they escape one double quote. If there
        // are multiple double quotes being escaped, i.e. \""...well?
        cname = cname.replace(/\\"/g, '"');

        if (column_name_map[cname] === undefined) {
          let column_id = `COLUMN${running_cidx}`;
          column_name_map[cname] = column_id;
          column_id_map[column_id] = cname;
        }

        running_cidx++;
        return column_name_map[cname];
      }); // Replace single quote string literals and wrap them in a call to
      // intern() which makes sure they don't leak

      parsed_expression_string = parsed_expression_string.replace(/'(.*?[^\\])'/g, match => `intern(${match})`); // Replace intern() for bucket, as it takes a string literal
      // parameter and does not work if that param is interned. TODO:
      // this is clumsy and we should have a better way of handling it.

      parsed_expression_string = parsed_expression_string.replace(/bucket\(.*?, (intern\(\'([smhDWMY])\'\))\)/g, (match, full, value) => {
        return `${match.substr(0, match.indexOf(full))}'${value}')`;
      });
      const validated = [expression_alias, expression_string, parsed_expression_string, column_id_map]; // Check if this expression is already in the array, if so then
      // we need to replace the expression so the last expression tagged
      // with the alias is the one that is applied to the engine.

      if (expression_idx_map[expression_alias] !== undefined) {
        const idx = expression_idx_map[expression_alias];
        validated_expressions[idx] = validated;
      } else {
        validated_expressions.push(validated);
        expression_idx_map[expression_alias] = validated_expressions.length - 1;
      }
    }

    return validated_expressions;
  }
  /**
   * Given an array of expressions, return an object containing `expressions`,
   * which map expression aliases to data types, and `errors`, which
   * maps expression aliases to error messages. If an expression that was
   * passed in is not in `expressions`, it is guaranteed to be in `errors`.
   *
   * @async
   * @param {Array<String>} expressions An array of string expressions to
   * be validated.
   *
   * @returns {Promise<Object>}
   *
   * @example
   * const results = await table.validate_expressions([
   *  '"Sales" + "Profit"', "invalid", "1 + 'string'"
   * ]);
   *
   * // {'"Sales" + "Profit"': "float"}
   * console.log(results.expression_schema);
   *
   * // {"invalid": "unknown token!", "1 + 'string'": "TypeError"}
   * console.log(results.errors);
   */


  table.prototype.validate_expressions = function (expressions, override = true) {
    const validated = {
      expression_schema: {},
      errors: {}
    };
    if (!expressions || expressions.length === 0) return validated;
    expressions = parse_expression_strings(expressions); // Transform Array into a C++ vector that can be passed through
    // Emscripten.

    let vector = __MODULE__.make_2d_val_vector();

    for (let expression of expressions) {
      let inner = __MODULE__.make_val_vector();

      for (let val of expression) {
        inner.push_back(val);
      }

      vector.push_back(inner);
    }

    const validation_results = __MODULE__.validate_expressions(this._Table, vector);

    const expression_schema = validation_results.get_expression_schema();
    const expression_errors = validation_results.get_expression_errors();
    const expression_aliases = expression_schema.keys();

    for (let i = 0; i < expression_aliases.size(); i++) {
      const alias = expression_aliases.get(i);
      let dtype = expression_schema.get(alias);

      if (override && this.overridden_types[alias]) {
        dtype = this.overridden_types[alias];
      }

      validated.expression_schema[alias] = dtype;
    }

    const error_aliases = expression_errors.keys();

    for (let i = 0; i < error_aliases.size(); i++) {
      const alias = error_aliases.get(i); // bound using `value_object` in embind so no need to manually
      // convert to Object, or call delete() as memory is auto-managed.

      const error_object = expression_errors.get(alias);
      validated.errors[alias] = error_object;
    }

    error_aliases.delete();
    expression_aliases.delete();
    expression_errors.delete();
    expression_schema.delete();
    validation_results.delete();
    return validated;
  };
  /**
   * Validates a filter configuration, i.e. that the value to filter by is not
   * null or undefined.
   *
   * @async
   * @param {Array<string>} [filter] a filter configuration to test.
   */


  table.prototype.is_valid_filter = function (filter) {
    // isNull and isNotNull filter operators are always valid and apply to
    // all schema types
    if (filter[1] === perspective.FILTER_OPERATORS.isNull || filter[1] === perspective.FILTER_OPERATORS.isNotNull) {
      return true;
    }

    let value = filter[2];

    if (value === null) {
      return false;
    }

    const schema = this.schema();
    const exists = schema[filter[0]];

    if (exists && (schema[filter[0]] === "date" || schema[filter[0]] === "datetime")) {
      return __MODULE__.is_valid_datetime(filter[2]);
    }

    return typeof value !== "undefined" && value !== null;
  };
  /* eslint-disable max-len */

  /**
   * Create a new {@link module:perspective~view} from this table with a
   * specified configuration. For a better understanding of the View
   * configuration options, see the
   * [Documentation](https://perspective.finos.org/docs/md/view.html).
   *
   * @param {Object} [config] The configuration object for this
   * {@link module:perspective~view}.
   * @param {Array<string>} [config.row_pivots] An array of column names to
   * use as {@link https://en.wikipedia.org/wiki/Pivot_table#Row_labels Row Pivots}.
   * @param {Array<string>} [config.column_pivots] An array of column names to
   * use as {@link https://en.wikipedia.org/wiki/Pivot_table#Column_labels Column Pivots}.
   * @param {Array<Object>} [config.columns] An array of column names for the
   * output columns. If none are provided, all columns are output.
   * @param {Object} [config.aggregates] An object, the keys of which are
   * column names, and their respective values are the aggregates calculations
   * to use when this view has `row_pivots`. A column provided to
   * `config.columns` without an aggregate in this object, will use the
   * default aggregate calculation for its type.
   * @param {Array<Array<string>>} [config.filter] An Array of Filter
   * configurations to apply. A filter configuration is an array of 3
   * elements: A column name, a supported filter comparison string (e.g.
   * '===', '>'), and a value to compare.
   * @param {Array<string>} [config.sort] An Array of Sort configurations to
   * apply. A sort configuration is an array of 2 elements: A column name, and
   * a sort direction, which are: "none", "asc", "desc", "col asc", "col
   * desc", "asc abs", "desc abs", "col asc abs", "col desc abs".
   *
   * @example
   * const view = await table.view({
   *      row_pivots: ["region"],
   *      columns: ["region"],
   *      aggregates: {"region": "dominant"},
   *      filter: [["client", "contains", "fred"]],
   *      sort: [["value", "asc"]]
   * });
   *
   * @returns {Promise<view>} A Promise that resolves to a new
   * {@link module:perspective~view} object for the supplied configuration,
   * bound to this table.
   */


  table.prototype.view = function (_config = {}) {
    _call_process(this._Table.get_id());

    let config = {};

    for (const key of Object.keys(_config)) {
      if (_config_constants_js__WEBPACK_IMPORTED_MODULE_0__.CONFIG_ALIASES[key]) {
        if (!config[_config_constants_js__WEBPACK_IMPORTED_MODULE_0__.CONFIG_ALIASES[key]]) {
          if (!WARNED_KEYS.has(key)) {
            console.warn(`Deprecated: "${key}" config parameter, please use "${_config_constants_js__WEBPACK_IMPORTED_MODULE_0__.CONFIG_ALIASES[key]}" instead`);
            WARNED_KEYS.add(key);
          }

          config[_config_constants_js__WEBPACK_IMPORTED_MODULE_0__.CONFIG_ALIASES[key]] = _config[key];
        } else {
          throw new Error(`Duplicate configuration parameter "${key}"`);
        }
      } else if (key === "aggregate") {
        if (!WARNED_KEYS.has("aggregate")) {
          console.warn(`Deprecated: "aggregate" config parameter has been replaced by "aggregates" and "columns"`);
          WARNED_KEYS.add("aggregate");
        } // backwards compatibility: deconstruct `aggregate` into
        // `aggregates` and `columns`


        config["aggregates"] = {};
        config["columns"] = [];

        for (const agg of _config["aggregate"]) {
          config["aggregates"][agg["column"]] = agg["op"];
          config["columns"].push(agg["column"]);
        }
      } else if (_config_constants_js__WEBPACK_IMPORTED_MODULE_0__.CONFIG_VALID_KEYS.indexOf(key) > -1) {
        config[key] = _config[key];
      } else {
        throw new Error(`Unrecognized config parameter "${key}"`);
      }
    }

    config.row_pivots = config.row_pivots || [];
    config.column_pivots = config.column_pivots || [];
    config.aggregates = config.aggregates || {};
    config.filter = config.filter || [];
    config.sort = config.sort || [];
    config.expressions = config.expressions || [];
    const table_schema = this.schema();

    if (config.expressions.length > 0) {
      config.expressions = parse_expression_strings(config.expressions);
    }

    if (config.columns === undefined) {
      // If columns are not provided, use all columns
      config.columns = this.columns();

      if (config.expressions.length > 0) {
        for (const expr of config.expressions) {
          config.columns.push(expr[0]);
        }
      }
    } // convert date/datetime filters to Date() objects, so they are parsed
    // as local time


    if (config.filter.length > 0) {
      for (let filter of config.filter) {
        // TODO: this does not work for expressions
        const dtype = table_schema[filter[0]];
        const is_compare = filter[1] !== perspective.FILTER_OPERATORS.isNull && filter[1] !== perspective.FILTER_OPERATORS.isNotNull;

        if (is_compare && (dtype === "date" || dtype === "datetime")) {
          // new Date() accepts strings and new Date() objects, so no
          // need to type check here.
          filter[2] = new Date(filter[2]);
        }
      }
    }

    let name = Math.random() + "";
    let sides;

    if (config.row_pivots.length > 0 || config.column_pivots.length > 0) {
      if (config.column_pivots && config.column_pivots.length > 0) {
        sides = 2;
      } else {
        sides = 1;
      }
    } else {
      sides = 0;
    }

    let vc = new view_config(config);
    let v = new view(this, sides, config, vc, name);
    this.views.push(v);
    return v;
  };
  /* eslint-enable max-len */


  let meter;

  function initialize_profile_thread() {
    if (meter === undefined) {
      let _msgs = 0;
      let start = performance.now();
      setTimeout(function poll() {
        let now = performance.now();
        console.log(`${(1000 * _msgs / (now - start)).toFixed(2)} msgs/sec`);
        _msgs = 0;
        start = now;
        setTimeout(poll, 5000);
      }, 5000);

      meter = function update(x) {
        _msgs += x;
      };

      console.log("Profiling initialized");
    }
  }
  /**
   * Updates the rows of a {@link module:perspective~table}. Updated rows are
   * pushed down to any derived {@link module:perspective~view} objects.
   *
   * @param {Object<string, Array>|Array<Object>|string} data The input data
   * for this table. {@link module:perspective~table}s are immutable after
   * creation, so this method cannot be called with a schema.
   *
   * Otherwise, the supported input types are the same as the
   * {@link module:perspective~table} constructor.
   *
   * @see {@link module:perspective~table}
   */


  table.prototype.update = function (data, options) {
    options = options || {};
    options.port_id = options.port_id || 0;
    let pdata;
    let cols = this.columns();

    let schema = this._Table.get_schema();

    let types = schema.types();
    let is_arrow = false;
    let is_csv = false;
    pdata = accessor;

    if (data instanceof ArrayBuffer) {
      pdata = new Uint8Array(data);
      is_arrow = true;
    } else if (typeof data === "string") {
      if (data[0] === ",") {
        data = "_" + data;
      }

      is_csv = true;
      is_arrow = true;
      pdata = data;
    } else {
      accessor.init(data);
      accessor.names = cols.concat(accessor.names.filter(x => x === "__INDEX__"));
      accessor.types = (0,_emscripten_js__WEBPACK_IMPORTED_MODULE_3__.extract_vector)(types).slice(0, cols.length);

      if (meter) {
        meter(accessor.row_count);
      }
    }

    if (!is_arrow) {
      if (pdata.row_count === 0) {
        console.warn("table.update called with no data - ignoring");
        return;
      } // process implicit index column


      const has_index = accessor.names.indexOf("__INDEX__");

      if (has_index != -1) {
        const explicit_index = !!this.index;

        if (explicit_index) {
          // find the type of the index column
          accessor.types.push(accessor.types[accessor.names.indexOf(this.index)]);
        } else {
          // default index is an integer
          accessor.types.push(__MODULE__.t_dtype.DTYPE_INT32);
        }
      }
    }

    try {
      const op = __MODULE__.t_op.OP_INSERT; // update the Table in C++, but don't keep the returned C++ Table
      // reference as it is identical

      make_table(pdata, this._Table, this.index, this.limit, op, true, is_arrow, is_csv, options.port_id);
      this.initialized = true;
    } catch (e) {
      console.error(`Update failed: ${e}`);
    } finally {
      schema.delete();
    }
  };
  /**
   * Removes the rows of a {@link module:perspective~table}. Removed rows are
   * pushed down to any derived {@link module:perspective~view} objects.
   *
   * @param {Array<Object>} data An array of primary keys to remove.
   *
   * @see {@link module:perspective~table}
   */


  table.prototype.remove = function (data, options) {
    if (!this.index) {
      console.error("Cannot call `remove()` on a Table without a user-specified index.");
      return;
    }

    options = options || {};
    options.port_id = options.port_id || 0;
    let pdata;
    let cols = this.columns();

    let schema = this._Table.get_schema();

    let types = schema.types();
    let is_arrow = false;
    data = data.map(idx => ({
      [this.index]: idx
    }));

    if (data instanceof ArrayBuffer) {
      pdata = new Uint8Array(data);
      is_arrow = true;
    } else {
      accessor.init(data);
      accessor.names = [this.index];
      accessor.types = [(0,_emscripten_js__WEBPACK_IMPORTED_MODULE_3__.extract_vector)(types)[cols.indexOf(this.index)]];
      pdata = accessor;
    }

    try {
      const op = __MODULE__.t_op.OP_DELETE; // update the Table in C++, but don't keep the returned Table
      // reference as it is identical

      make_table(pdata, this._Table, this.index, this.limit, op, false, is_arrow, false, options.port_id);
      this.initialized = true;
    } catch (e) {
      console.error(`Remove failed`, e);
    } finally {
      schema.delete();
    }
  };
  /**
   * The column names of this table.
   *
   * @async
   * @returns {Promise<Array<string>>} An array of column names for this
   * table.
   */


  table.prototype.columns = function () {
    let schema = this._Table.get_schema();

    let cols = schema.columns();
    let names = [];

    for (let cidx = 0; cidx < cols.size(); cidx++) {
      let name = cols.get(cidx);

      if (name !== "psp_okey") {
        names.push(name);
      }
    }

    schema.delete();
    cols.delete();
    return names;
  };

  table.prototype.execute = function (f) {
    f(this);
  };
  /***************************************************************************
   *
   * Perspective
   *
   */


  const perspective = {
    __module__: __MODULE__,
    Server: _api_server_js__WEBPACK_IMPORTED_MODULE_5__.Server,
    worker: function () {
      return this;
    },
    initialize_profile_thread,
    memory_usage,

    /**
     * A factory method for constructing {@link module:perspective~table}s.
     *
     * @example
     * // Creating a table directly from node
     * const table = await perspective.table([{x: 1}, {x: 2}]);
     *
     * @example
     * // Creating a table from a Web Worker (instantiated via the worker()
     * method).
     * const table = await worker.table([{x: 1}, {x: 2}]);
     *
     * @param {Object<string, Array>|Object<string,
     *     string>|Array<Object>|string} data The input data for this table.
     *     When supplied an Object with string values, an empty table is
     *     returned using this Object as a schema. When an Object with
     *     Array values is supplied, a table is returned using this object's
     *     key/value pairs as name/columns respectively. When an Array is
     *     supplied, a table is constructed using this Array's objects as
     *     rows. When a string is supplied, the parameter as parsed as a
     *     CSV.
     * @param {Object} [options] An optional options dictionary.
     * @param {string} options.index The name of the column in the resulting
     *     table to treat as an index. When updating this table, rows
     *     sharing an index of a new row will be overwritten. `index`
     *     cannot be applied at the same time as `limit`.
     * @param {integer} options.limit The maximum number of rows that can be
     *     added to this table. When exceeded, old rows will be overwritten
     *     in the order they were inserted. `limit` cannot be applied at
     *     the same time as `index`.
     *
     * @returns {Promise<table>} A Promise that will resolve to a new
     * {@link module:perspective~table} object, or be rejected if an error
     * happens during Table construction.
     */
    table: function (data, options) {
      options = options || {}; // Always store index and limit as user-provided values or `null`.

      options.index = options.index || null;
      options.limit = options.limit || null;
      let data_accessor;
      let is_arrow = false;
      let overridden_types = {};
      let is_csv = false;

      if (data instanceof ArrayBuffer || typeof Buffer !== "undefined" && data instanceof Buffer) {
        data_accessor = new Uint8Array(data);
        is_arrow = true;
      } else if (typeof data === "string") {
        if (data[0] === ",") {
          data = "_" + data;
        }

        is_csv = true;
        is_arrow = true;
        data_accessor = data;
      } else {
        accessor.clean();
        overridden_types = accessor.init(data);
        data_accessor = accessor;
      }

      if (options.index && options.limit) {
        throw `Cannot specify both index '${options.index}' and limit '${options.limit}'.`;
      }

      let _Table;

      try {
        const op = __MODULE__.t_op.OP_INSERT; // C++ Table constructor cannot take null values for index
        // and limit, so `make_table` will convert null to default
        // values of "" for index and 4294967295 for limit. Tables
        // must be created on port 0.

        _Table = make_table(data_accessor, undefined, options.index, options.limit, op, false, is_arrow, is_csv, 0); // Pass through user-provided values or `null` to the
        // Javascript Table constructor.

        return new table(_Table, options.index, options.limit, overridden_types);
      } catch (e) {
        if (_Table) {
          _Table.delete();
        }

        console.error(`Table initialization failed: ${e}`);
        throw e;
      }
    }
  };

  for (let prop of Object.keys(_config_constants_js__WEBPACK_IMPORTED_MODULE_0__)) {
    perspective[prop] = _config_constants_js__WEBPACK_IMPORTED_MODULE_0__[prop];
  }
  /**
   * Hosting Perspective
   *
   * Create a WebWorker API that loads perspective in `init` and extends
   * `post` using the worker's `postMessage` method.
   *
   * If Perspective is running inside a Web Worker, use the WebSorkerServer as
   * default.
   *
   * @extends Server
   * @private
   */


  class WebWorkerServer extends _api_server_js__WEBPACK_IMPORTED_MODULE_5__.Server {
    /**
     * On initialization, listen for messages posted from the client and
     * send it to `Server.process()`.
     *
     * @param perspective a reference to the Perspective module, allowing
     * the `Server` to access Perspective methods.
     */
    constructor(perspective) {
      super(perspective);
      self.addEventListener("message", e => this.process(e.data), false);
    }
    /**
     * Implements the `Server`'s `post()` method using the Web Worker
     * `postMessage()` API.
     *
     * @param {Object} msg a message to pass to the client
     * @param {*} transfer a transferable object to pass to the client, if
     * needed
     */


    post(msg, transfer) {
      self.postMessage(msg, transfer);
    }
    /**
     * When initialized, replace Perspective's internal `__MODULE` variable
     * with the WASM binary.
     *
     * @param {ArrayBuffer} buffer an ArrayBuffer or Buffer containing the
     * Perspective WASM code
     */


    init(msg) {
      if (typeof WebAssembly === "undefined") {
        throw new Error("WebAssembly not supported");
      } else {
        __MODULE__({
          wasmBinary: msg.buffer,
          wasmJSMethod: "native-wasm"
        }).then(mod => {
          __MODULE__ = mod;
          super.init(msg);
        });
      }
    }

  }
  /**
   * Use WebSorkerServer as default inside a Web Worker, where `window` is
   * replaced with `self`.
   */


  if (typeof self !== "undefined" && self.addEventListener) {
    new WebWorkerServer(perspective);
  }

  return perspective;
}


/***/ }),

/***/ "../node_modules/source-map-loader/index.js!../packages/perspective/dist/esm/perspective.worker.js":
/*!*********************************************************************************************************!*\
  !*** ../node_modules/source-map-loader/index.js!../packages/perspective/dist/esm/perspective.worker.js ***!
  \*********************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => __WEBPACK_DEFAULT_EXPORT__
/* harmony export */ });
/* harmony import */ var _finos_perspective_cpp__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./@finos/perspective-cpp */ "../packages/perspective/dist/esm/@finos/perspective-cpp/dist/esm/perspective.cpp.js");
/* harmony import */ var _perspective_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./perspective.js */ "../packages/perspective/dist/esm/perspective.js");
/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */



let _perspective_instance;

if (__webpack_require__.g.document !== undefined && typeof WebAssembly !== "undefined") {
  _perspective_instance = __webpack_require__.g.perspective = (0,_perspective_js__WEBPACK_IMPORTED_MODULE_1__.default)((0,_finos_perspective_cpp__WEBPACK_IMPORTED_MODULE_0__.default)({
    wasmJSMethod: "native-wasm",
    printErr: x => console.error(x),
    print: x => console.log(x)
  }));
} else {
  _perspective_instance = __webpack_require__.g.perspective = (0,_perspective_js__WEBPACK_IMPORTED_MODULE_1__.default)(_finos_perspective_cpp__WEBPACK_IMPORTED_MODULE_0__.default);
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (_perspective_instance);


/***/ }),

/***/ "../packages/perspective/dist/esm/utils.js":
/*!*************************************************!*\
  !*** ../packages/perspective/dist/esm/utils.js ***!
  \*************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "get_column_type": () => /* binding */ get_column_type,
/* harmony export */   "bindall": () => /* binding */ bindall,
/* harmony export */   "detectNode": () => /* binding */ detectNode,
/* harmony export */   "detectIE": () => /* binding */ detectIE,
/* harmony export */   "detectChrome": () => /* binding */ detectChrome,
/* harmony export */   "detect_iphone": () => /* binding */ detect_iphone
/* harmony export */ });
/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */

/**
 * Gets human-readable types for a column
 * @private
 * @returns {string}
 */
function get_column_type(val) {
  if (val >= 1 && val <= 8) {
    return "integer";
  } else if (val === 19) {
    return "string";
  } else if (val === 10 || val === 9) {
    return "float";
  } else if (val === 11) {
    return "boolean";
  } else if (val === 12) {
    return "datetime";
  } else if (val === 13) {
    return "date";
  } else {
    console.warn(`Unknown type for value ${val} with JS type ${typeof val}`);
  }
}
/**
 * Bind all methods in a class to the class instance.  It is sad that this is
 * necessary.
 *
 * @export
 * @param {*} self
 */

function bindall(self) {
  let obj = self;

  do {
    for (const key of Object.getOwnPropertyNames(obj)) {
      const value = self[key];

      if (key !== "constructor" && typeof value === "function") {
        self[key] = value.bind(self);
      }
    }
  } while (obj = obj !== Object && Object.getPrototypeOf(obj));
}
/**
 * Detect Node.js.
 *
 * Returns
 * -------
 * True if the current script is running in Node.js.
 */

function detectNode() {
  return typeof window === "undefined";
}
/**
 * Detect Internet Explorer.
 *
 * Returns
 * -------
 * True if the current script is running in Internet Explorer.
 */

const detectIE = __webpack_require__(/*! detectie */ "../node_modules/detectie/detectie.js");
/**
 * Detect Chrome.
 *
 * Returns
 * -------
 * Detect if the current script is running in Chrome.
 */

function detectChrome() {
  var isChromium = window.chrome,
      winNav = window.navigator,
      vendorName = winNav.vendor,
      isOpera = winNav.userAgent.indexOf("OPR") > -1,
      isIEedge = winNav.userAgent.indexOf("Edge") > -1,
      isIOSChrome = winNav.userAgent.match("CriOS");

  if (isIOSChrome) {
    return true;
  } else if (isChromium !== null && typeof isChromium !== "undefined" && vendorName === "Google Inc." && isOpera === false && isIEedge === false) {
    return true;
  } else {
    return false;
  }
} // https://github.com/kripken/emscripten/issues/6042

function detect_iphone() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}
/**
 * String.includes() polyfill
 */

if (!String.prototype.includes) {
  String.prototype.includes = function (search, start) {
    if (typeof start !== "number") {
      start = 0;
    }

    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}
/* eslint-disable-next-line max-len */
// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes


if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, "includes", {
    value: function (searchElement, fromIndex) {
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      } // 1. Let O be ? ToObject(this value).


      var o = Object(this); // 2. Let len be ? ToLength(? Get(O, "length")).

      var len = o.length >>> 0; // 3. If len is 0, return false.

      if (len === 0) {
        return false;
      } // 4. Let n be ? ToInteger(fromIndex). (If fromIndex is undefined,
      //    this step produces the value 0.)


      var n = fromIndex | 0; // 5. If n ≥ 0, then a. Let k be n.
      // 6. Else n < 0, a. Let k be len + n. b. If k < 0, let k be 0.

      var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      function sameValueZero(x, y) {
        return x === y || typeof x === "number" && typeof y === "number" && isNaN(x) && isNaN(y);
      } // 7. Repeat, while k < len


      while (k < len) {
        // a. Let elementK be the result of ? Get(O, ! ToString(k)). b.
        // If SameValueZero(searchElement, elementK) is true, return
        // true.
        if (sameValueZero(o[k], searchElement)) {
          return true;
        } // c. Increase k by 1.


        k++;
      } // 8. Return false


      return false;
    }
  });
}


/***/ }),

/***/ "../packages/perspective/dist/esm/view_formatters.js":
/*!***********************************************************!*\
  !*** ../packages/perspective/dist/esm/view_formatters.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => __WEBPACK_DEFAULT_EXPORT__
/* harmony export */ });
/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const jsonFormatter = {
  initDataValue: () => [],
  initRowValue: () => ({}),
  initColumnValue: (data, row, colName) => row[colName] = [],
  setColumnValue: (data, row, colName, value) => row[colName] = value,
  addColumnValue: (data, row, colName, value) => row[colName].unshift(value),
  addRow: (data, row) => data.push(row),
  formatData: data => data,
  slice: (data, start) => data.slice(start)
};
const csvFormatter = Object.assign({}, jsonFormatter, {
  addColumnValue: (data, row, colName, value) => row[colName.split("|").join(",")].unshift(value),
  setColumnValue: (data, row, colName, value) => row[colName.split("|").join(",")] = value,
  formatData: function (data, {
    delimiter = ","
  } = {}) {
    if (data.length === 0) {
      return "";
    }

    const format = function (x) {
      if (x === null) {
        return "";
      }

      switch (typeof x) {
        case "object":
        case "string":
          // CSV escapes with double double quotes, for real.
          // Section 2.7 of the fake
          // [CSV spec](https://tools.ietf.org/html/rfc4180)
          return x.indexOf(delimiter) > -1 ? `"${x.replace(/\"/g, '""')}"` : x.toString();

        case "number":
          return x;

        case "boolean":
          return x.toString();
      }
    };

    const columns = Object.keys(data[0]);
    let csv = columns.map(format).join(delimiter);

    for (let x = 0; x < data.length; x++) {
      csv += "\r\n" + columns.map(column => format(data[x][column])).join(delimiter);
    }

    return csv;
  }
});
const jsonTableFormatter = {
  initDataValue: () => new Object(),
  initRowValue: () => {},
  setColumnValue: (data, row, colName, value) => {
    data[colName] = data[colName] || [];
    data[colName].push(value);
  },
  addColumnValue: (data, row, colName, value) => {
    data[colName] = data[colName] || [];
    data[colName][data[colName].length - 1].unshift(value);
  },
  initColumnValue: (data, row, colName) => {
    data[colName] = data[colName] || [];
    data[colName].push([]);
  },
  addRow: () => {},
  formatData: data => data,
  slice: (data, start) => {
    let new_data = {};

    for (let x in data) {
      new_data[x] = data[x].slice(start);
    }

    return new_data;
  }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  jsonFormatter,
  jsonTableFormatter,
  csvFormatter
});


/***/ }),

/***/ "../packages/perspective/dist/esm/config/index.js":
/*!********************************************************!*\
  !*** ../packages/perspective/dist/esm/config/index.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/******************************************************************************
 *
 * Copyright (c) 2017, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms of
 * the Apache License 2.0.  The full license can be found in the LICENSE file.
 *
 */
const DEFAULT_CONFIG = __webpack_require__(/*! ./settings.js */ "../packages/perspective/dist/esm/config/settings.js").default;

module.exports.get_types = function () {
  return Object.keys(module.exports.get_config().types);
};

module.exports.get_type_config = function (type) {
  const config = {};

  if (module.exports.get_config().types[type]) {
    Object.assign(config, module.exports.get_config().types[type]);
  }

  if (config.type) {
    const props = module.exports.get_type_config(config.type);
    Object.assign(props, config);
    return props;
  } else {
    return config;
  }
};

function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}

function mergeDeep(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, {
          [key]: {}
        });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, {
          [key]: source[key]
        });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

__webpack_require__.g.__PERSPECTIVE_CONFIG__ = undefined;

module.exports.override_config = function (config) {
  if (__webpack_require__.g.__PERSPECTIVE_CONFIG__) {
    console.warn("Config already initialized!");
  }

  __webpack_require__.g.__PERSPECTIVE_CONFIG__ = mergeDeep(DEFAULT_CONFIG, config);
};

module.exports.get_config = function get_config() {
  if (!__webpack_require__.g.__PERSPECTIVE_CONFIG__) {
    __webpack_require__.g.__PERSPECTIVE_CONFIG__ = mergeDeep(DEFAULT_CONFIG, {
    "types": {
        "float": {
            "filter_operator": "==",
            "aggregate": "sum",
            "format": {
                "style": "decimal",
                "minimumFractionDigits": 2,
                "maximumFractionDigits": 2
            }
        },
        "string": {
            "filter_operator": "==",
            "aggregate": "count"
        },
        "integer": {
            "filter_operator": "==",
            "aggregate": "sum",
            "format": {}
        },
        "boolean": {
            "filter_operator": "==",
            "aggregate": "count"
        },
        "datetime": {
            "filter_operator": "==",
            "aggregate": "count",
            "format": {
                "week": "numeric",
                "year": "numeric",
                "month": "numeric",
                "day": "numeric",
                "hour": "numeric",
                "minute": "numeric",
                "second": "numeric"
            },
            "null_value": -1
        },
        "date": {
            "filter_operator": "==",
            "aggregate": "count",
            "format": {
                "week": "numeric",
                "year": "numeric",
                "month": "numeric",
                "day": "numeric"
            },
            "null_value": -1
        }
    }
} || {});
  }

  return __webpack_require__.g.__PERSPECTIVE_CONFIG__;
};


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	// startup
/******/ 	// Load entry module
/******/ 	__webpack_require__("../node_modules/source-map-loader/index.js!../packages/perspective/dist/esm/perspective.worker.js");
/******/ 	// This entry module used 'exports' so it can't be inlined
/******/ })()
;
//# sourceMappingURL=perspective.worker.js.map