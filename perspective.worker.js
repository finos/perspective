/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 373:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "6ba0941cd59572b0.wasm";

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
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
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
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
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
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
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		__webpack_require__.p = "/";
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/importScripts chunk loading */
/******/ 	(() => {
/******/ 		__webpack_require__.b = self.location + "";
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "already loaded"
/******/ 		var installedChunks = {
/******/ 			397: 1
/******/ 		};
/******/ 		
/******/ 		// no chunk install function needed
/******/ 		// no chunk loading
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {

// UNUSED EXPORTS: default

// NAMESPACE OBJECT: ../packages/perspective/src/js/config/constants.js
var constants_namespaceObject = {};
__webpack_require__.r(constants_namespaceObject);
__webpack_require__.d(constants_namespaceObject, {
  "COLUMN_SEPARATOR_STRING": () => (COLUMN_SEPARATOR_STRING),
  "CONFIG_ALIASES": () => (CONFIG_ALIASES),
  "CONFIG_VALID_KEYS": () => (CONFIG_VALID_KEYS),
  "DATA_TYPES": () => (DATA_TYPES),
  "FILTER_OPERATORS": () => (FILTER_OPERATORS),
  "SORT_ORDERS": () => (SORT_ORDERS),
  "SORT_ORDER_IDS": () => (SORT_ORDER_IDS),
  "TYPE_AGGREGATES": () => (TYPE_AGGREGATES),
  "TYPE_FILTERS": () => (TYPE_FILTERS)
});

;// CONCATENATED MODULE: ../packages/perspective/dist/pkg/web/perspective.cpp.js
var load_perspective=(()=>{var _scriptDir="file:///Users/texodus/work/perspective/packages/perspective/dist/pkg/web/perspective.cpp.js";return function(moduleArg={}){var Module=moduleArg;var readyPromiseResolve,readyPromiseReject;Module["ready"]=new Promise((resolve,reject)=>{readyPromiseResolve=resolve;readyPromiseReject=reject;});var moduleOverrides=Object.assign({},Module);var arguments_=[];var thisProgram="./this.program";var quit_=(status,toThrow)=>{throw toThrow;};var ENVIRONMENT_IS_WEB=true;var ENVIRONMENT_IS_WORKER=false;var scriptDirectory="";function locateFile(path){if(Module["locateFile"]){return Module["locateFile"](path,scriptDirectory);}return scriptDirectory+path;}var read_,readAsync,readBinary;if(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER){if(ENVIRONMENT_IS_WORKER){scriptDirectory=self.location.href;}else if(typeof document!="undefined"&&document.currentScript){scriptDirectory=document.currentScript.src;}if(_scriptDir){scriptDirectory=_scriptDir;}if(scriptDirectory.indexOf("blob:")!==0){scriptDirectory=scriptDirectory.substr(0,scriptDirectory.replace(/[?#].*/,"").lastIndexOf("/")+1);}else{scriptDirectory="";}{read_=url=>{var xhr=new XMLHttpRequest();xhr.open("GET",url,false);xhr.send(null);return xhr.responseText;};if(ENVIRONMENT_IS_WORKER){readBinary=url=>{var xhr=new XMLHttpRequest();xhr.open("GET",url,false);xhr.responseType="arraybuffer";xhr.send(null);return new Uint8Array(xhr.response);};}readAsync=(url,onload,onerror)=>{var xhr=new XMLHttpRequest();xhr.open("GET",url,true);xhr.responseType="arraybuffer";xhr.onload=()=>{if(xhr.status==200||xhr.status==0&&xhr.response){onload(xhr.response);return;}onerror();};xhr.onerror=onerror;xhr.send(null);};}}else{}var out=Module["print"]||console.log.bind(console);var err=Module["printErr"]||console.error.bind(console);Object.assign(Module,moduleOverrides);moduleOverrides=null;if(Module["arguments"])arguments_=Module["arguments"];if(Module["thisProgram"])thisProgram=Module["thisProgram"];if(Module["quit"])quit_=Module["quit"];var wasmBinary;if(Module["wasmBinary"])wasmBinary=Module["wasmBinary"];if(typeof WebAssembly!="object"){abort("no native wasm support detected");}var wasmMemory;var ABORT=false;var EXITSTATUS;var HEAP8,HEAPU8,HEAP16,HEAPU16,HEAP32,HEAPU32,HEAPF32,HEAP64,HEAPU64,HEAPF64;function updateMemoryViews(){var b=wasmMemory.buffer;Module["HEAP8"]=HEAP8=new Int8Array(b);Module["HEAP16"]=HEAP16=new Int16Array(b);Module["HEAPU8"]=HEAPU8=new Uint8Array(b);Module["HEAPU16"]=HEAPU16=new Uint16Array(b);Module["HEAP32"]=HEAP32=new Int32Array(b);Module["HEAPU32"]=HEAPU32=new Uint32Array(b);Module["HEAPF32"]=HEAPF32=new Float32Array(b);Module["HEAPF64"]=HEAPF64=new Float64Array(b);Module["HEAP64"]=HEAP64=new BigInt64Array(b);Module["HEAPU64"]=HEAPU64=new BigUint64Array(b);}var __ATPRERUN__=[];var __ATINIT__=[];var __ATMAIN__=[];var __ATPOSTRUN__=[];var runtimeInitialized=false;function preRun(){if(Module["preRun"]){if(typeof Module["preRun"]=="function")Module["preRun"]=[Module["preRun"]];while(Module["preRun"].length){addOnPreRun(Module["preRun"].shift());}}callRuntimeCallbacks(__ATPRERUN__);}function initRuntime(){runtimeInitialized=true;callRuntimeCallbacks(__ATINIT__);}function preMain(){callRuntimeCallbacks(__ATMAIN__);}function postRun(){if(Module["postRun"]){if(typeof Module["postRun"]=="function")Module["postRun"]=[Module["postRun"]];while(Module["postRun"].length){addOnPostRun(Module["postRun"].shift());}}callRuntimeCallbacks(__ATPOSTRUN__);}function addOnPreRun(cb){__ATPRERUN__.unshift(cb);}function addOnPostRun(cb){__ATPOSTRUN__.unshift(cb);}var runDependencies=0;var runDependencyWatcher=null;var dependenciesFulfilled=null;function addRunDependency(id){runDependencies++;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies);}}function removeRunDependency(id){runDependencies--;if(Module["monitorRunDependencies"]){Module["monitorRunDependencies"](runDependencies);}if(runDependencies==0){if(runDependencyWatcher!==null){clearInterval(runDependencyWatcher);runDependencyWatcher=null;}if(dependenciesFulfilled){var callback=dependenciesFulfilled;dependenciesFulfilled=null;callback();}}}function abort(what){if(Module["onAbort"]){Module["onAbort"](what);}what="Aborted("+what+")";err(what);ABORT=true;EXITSTATUS=1;what+=". Build with -sASSERTIONS for more info.";var e=new WebAssembly.RuntimeError(what);readyPromiseReject(e);throw e;}var dataURIPrefix="data:application/octet-stream;base64,";var isDataURI=filename=>filename.startsWith(dataURIPrefix);var wasmBinaryFile;if(Module["locateFile"]){wasmBinaryFile="perspective.cpp.wasm";if(!isDataURI(wasmBinaryFile)){wasmBinaryFile=locateFile(wasmBinaryFile);}}else{wasmBinaryFile=new URL(/* asset import */ __webpack_require__(373), __webpack_require__.b).href;}function getBinarySync(file){if(file==wasmBinaryFile&&wasmBinary){return new Uint8Array(wasmBinary);}if(readBinary){return readBinary(file);}throw"both async and sync fetching of the wasm failed";}function getBinaryPromise(binaryFile){if(!wasmBinary&&(ENVIRONMENT_IS_WEB||ENVIRONMENT_IS_WORKER)){if(typeof fetch=="function"){return fetch(binaryFile,{credentials:"same-origin"}).then(response=>{if(!response["ok"]){throw"failed to load wasm binary file at '"+binaryFile+"'";}return response["arrayBuffer"]();}).catch(()=>getBinarySync(binaryFile));}}return Promise.resolve().then(()=>getBinarySync(binaryFile));}function instantiateArrayBuffer(binaryFile,imports,receiver){return getBinaryPromise(binaryFile).then(binary=>WebAssembly.instantiate(binary,imports)).then(instance=>instance).then(receiver,reason=>{err(`failed to asynchronously prepare wasm: ${reason}`);abort(reason);});}function instantiateAsync(binary,binaryFile,imports,callback){if(!binary&&typeof WebAssembly.instantiateStreaming=="function"&&!isDataURI(binaryFile)&&typeof fetch=="function"){return fetch(binaryFile,{credentials:"same-origin"}).then(response=>{var result=WebAssembly.instantiateStreaming(response,imports);return result.then(callback,function(reason){err(`wasm streaming compile failed: ${reason}`);err("falling back to ArrayBuffer instantiation");return instantiateArrayBuffer(binaryFile,imports,callback);});});}return instantiateArrayBuffer(binaryFile,imports,callback);}function createWasm(){var info={"env":wasmImports,"wasi_snapshot_preview1":wasmImports};function receiveInstance(instance,module){wasmExports=instance.exports;wasmExports=applySignatureConversions(wasmExports);wasmMemory=wasmExports["memory"];updateMemoryViews();wasmTable=wasmExports["__indirect_function_table"];removeRunDependency("wasm-instantiate");return wasmExports;}addRunDependency("wasm-instantiate");function receiveInstantiationResult(result){receiveInstance(result["instance"]);}if(Module["instantiateWasm"]){try{return Module["instantiateWasm"](info,receiveInstance);}catch(e){err(`Module.instantiateWasm callback failed with error: ${e}`);readyPromiseReject(e);}}instantiateAsync(wasmBinary,wasmBinaryFile,info,receiveInstantiationResult).catch(readyPromiseReject);return{};}var ASM_CONSTS={847348:$0=>{throw new Error(UTF8ToString($0));}};function ExitStatus(status){this.name="ExitStatus";this.message=`Program terminated with exit(${status})`;this.status=status;}var callRuntimeCallbacks=callbacks=>{while(callbacks.length>0){callbacks.shift()(Module);}};var noExitRuntime=Module["noExitRuntime"]||true;var UTF8Decoder=typeof TextDecoder!="undefined"?new TextDecoder("utf8"):undefined;var UTF8ArrayToString=(heapOrArray,idx,maxBytesToRead)=>{idx>>>=0;var endIdx=idx+maxBytesToRead;var endPtr=idx;while(heapOrArray[endPtr]&&!(endPtr>=endIdx))++endPtr;if(endPtr-idx>16&&heapOrArray.buffer&&UTF8Decoder){return UTF8Decoder.decode(heapOrArray.subarray(idx,endPtr));}var str="";while(idx<endPtr){var u0=heapOrArray[idx++];if(!(u0&128)){str+=String.fromCharCode(u0);continue;}var u1=heapOrArray[idx++]&63;if((u0&224)==192){str+=String.fromCharCode((u0&31)<<6|u1);continue;}var u2=heapOrArray[idx++]&63;if((u0&240)==224){u0=(u0&15)<<12|u1<<6|u2;}else{u0=(u0&7)<<18|u1<<12|u2<<6|heapOrArray[idx++]&63;}if(u0<65536){str+=String.fromCharCode(u0);}else{var ch=u0-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023);}}return str;};var UTF8ToString=(ptr,maxBytesToRead)=>{ptr>>>=0;return ptr?UTF8ArrayToString(HEAPU8,ptr,maxBytesToRead):"";};var SYSCALLS={varargs:undefined,get(){var ret=HEAP32[+SYSCALLS.varargs>>>2>>>0];SYSCALLS.varargs+=4;return ret;},getp(){return SYSCALLS.get();},getStr(ptr){var ret=UTF8ToString(ptr);return ret;}};var MAX_INT53=9007199254740992;var MIN_INT53=-9007199254740992;var bigintToI53Checked=num=>num<MIN_INT53||num>MAX_INT53?NaN:Number(num);function ___syscall_ftruncate64(fd,length){length=bigintToI53Checked(length);}var stringToUTF8Array=(str,heap,outIdx,maxBytesToWrite)=>{outIdx>>>=0;if(!(maxBytesToWrite>0))return 0;var startIdx=outIdx;var endIdx=outIdx+maxBytesToWrite-1;for(var i=0;i<str.length;++i){var u=str.charCodeAt(i);if(u>=55296&&u<=57343){var u1=str.charCodeAt(++i);u=65536+((u&1023)<<10)|u1&1023;}if(u<=127){if(outIdx>=endIdx)break;heap[outIdx++>>>0]=u;}else if(u<=2047){if(outIdx+1>=endIdx)break;heap[outIdx++>>>0]=192|u>>6;heap[outIdx++>>>0]=128|u&63;}else if(u<=65535){if(outIdx+2>=endIdx)break;heap[outIdx++>>>0]=224|u>>12;heap[outIdx++>>>0]=128|u>>6&63;heap[outIdx++>>>0]=128|u&63;}else{if(outIdx+3>=endIdx)break;heap[outIdx++>>>0]=240|u>>18;heap[outIdx++>>>0]=128|u>>12&63;heap[outIdx++>>>0]=128|u>>6&63;heap[outIdx++>>>0]=128|u&63;}}heap[outIdx>>>0]=0;return outIdx-startIdx;};var stringToUTF8=(str,outPtr,maxBytesToWrite)=>stringToUTF8Array(str,HEAPU8,outPtr,maxBytesToWrite);function ___syscall_getdents64(fd,dirp,count){dirp>>>=0;count>>>=0;}var structRegistrations={};var runDestructors=destructors=>{while(destructors.length){var ptr=destructors.pop();var del=destructors.pop();del(ptr);}};function simpleReadValueFromPointer(pointer){return this["fromWireType"](HEAP32[pointer>>>2>>>0]);}var awaitingDependencies={};var registeredTypes={};var typeDependencies={};var InternalError;var throwInternalError=message=>{throw new InternalError(message);};var whenDependentTypesAreResolved=(myTypes,dependentTypes,getTypeConverters)=>{myTypes.forEach(function(type){typeDependencies[type]=dependentTypes;});function onComplete(typeConverters){var myTypeConverters=getTypeConverters(typeConverters);if(myTypeConverters.length!==myTypes.length){throwInternalError("Mismatched type converter count");}for(var i=0;i<myTypes.length;++i){registerType(myTypes[i],myTypeConverters[i]);}}var typeConverters=new Array(dependentTypes.length);var unregisteredTypes=[];var registered=0;dependentTypes.forEach((dt,i)=>{if(registeredTypes.hasOwnProperty(dt)){typeConverters[i]=registeredTypes[dt];}else{unregisteredTypes.push(dt);if(!awaitingDependencies.hasOwnProperty(dt)){awaitingDependencies[dt]=[];}awaitingDependencies[dt].push(()=>{typeConverters[i]=registeredTypes[dt];++registered;if(registered===unregisteredTypes.length){onComplete(typeConverters);}});}});if(0===unregisteredTypes.length){onComplete(typeConverters);}};var __embind_finalize_value_object=function(structType){structType>>>=0;var reg=structRegistrations[structType];delete structRegistrations[structType];var rawConstructor=reg.rawConstructor;var rawDestructor=reg.rawDestructor;var fieldRecords=reg.fields;var fieldTypes=fieldRecords.map(field=>field.getterReturnType).concat(fieldRecords.map(field=>field.setterArgumentType));whenDependentTypesAreResolved([structType],fieldTypes,fieldTypes=>{var fields={};fieldRecords.forEach((field,i)=>{var fieldName=field.fieldName;var getterReturnType=fieldTypes[i];var getter=field.getter;var getterContext=field.getterContext;var setterArgumentType=fieldTypes[i+fieldRecords.length];var setter=field.setter;var setterContext=field.setterContext;fields[fieldName]={read:ptr=>getterReturnType["fromWireType"](getter(getterContext,ptr)),write:(ptr,o)=>{var destructors=[];setter(setterContext,ptr,setterArgumentType["toWireType"](destructors,o));runDestructors(destructors);}};});return[{name:reg.name,"fromWireType":ptr=>{var rv={};for(var i in fields){rv[i]=fields[i].read(ptr);}rawDestructor(ptr);return rv;},"toWireType":(destructors,o)=>{for(var fieldName in fields){if(!(fieldName in o)){throw new TypeError(`Missing field: "${fieldName}"`);}}var ptr=rawConstructor();for(fieldName in fields){fields[fieldName].write(ptr,o[fieldName]);}if(destructors!==null){destructors.push(rawDestructor,ptr);}return ptr;},"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":simpleReadValueFromPointer,destructorFunction:rawDestructor}];});};var embindRepr=v=>{if(v===null){return"null";}var t=typeof v;if(t==="object"||t==="array"||t==="function"){return v.toString();}else{return""+v;}};var embind_init_charCodes=()=>{var codes=new Array(256);for(var i=0;i<256;++i){codes[i]=String.fromCharCode(i);}embind_charCodes=codes;};var embind_charCodes;var readLatin1String=ptr=>{var ret="";var c=ptr;while(HEAPU8[c>>>0]){ret+=embind_charCodes[HEAPU8[c++>>>0]];}return ret;};var BindingError;var throwBindingError=message=>{throw new BindingError(message);};function sharedRegisterType(rawType,registeredInstance,options={}){var name=registeredInstance.name;if(!rawType){throwBindingError(`type "${name}" must have a positive integer typeid pointer`);}if(registeredTypes.hasOwnProperty(rawType)){if(options.ignoreDuplicateRegistrations){return;}else{throwBindingError(`Cannot register type '${name}' twice`);}}registeredTypes[rawType]=registeredInstance;delete typeDependencies[rawType];if(awaitingDependencies.hasOwnProperty(rawType)){var callbacks=awaitingDependencies[rawType];delete awaitingDependencies[rawType];callbacks.forEach(cb=>cb());}}function registerType(rawType,registeredInstance,options={}){if(!("argPackAdvance"in registeredInstance)){throw new TypeError("registerType registeredInstance requires argPackAdvance");}return sharedRegisterType(rawType,registeredInstance,options);}var integerReadValueFromPointer=(name,width,signed)=>{switch(width){case 1:return signed?pointer=>HEAP8[pointer>>>0>>>0]:pointer=>HEAPU8[pointer>>>0>>>0];case 2:return signed?pointer=>HEAP16[pointer>>>1>>>0]:pointer=>HEAPU16[pointer>>>1>>>0];case 4:return signed?pointer=>HEAP32[pointer>>>2>>>0]:pointer=>HEAPU32[pointer>>>2>>>0];case 8:return signed?pointer=>HEAP64[pointer>>>3]:pointer=>HEAPU64[pointer>>>3];default:throw new TypeError(`invalid integer width (${width}): ${name}`);}};function __embind_register_bigint(primitiveType,name,size,minRange,maxRange){primitiveType>>>=0;name>>>=0;size>>>=0;name=readLatin1String(name);var isUnsignedType=name.indexOf("u")!=-1;if(isUnsignedType){maxRange=(1n<<64n)-1n;}registerType(primitiveType,{name:name,"fromWireType":value=>value,"toWireType":function(destructors,value){if(typeof value!="bigint"&&typeof value!="number"){throw new TypeError(`Cannot convert "${embindRepr(value)}" to ${this.name}`);}if(value<minRange||value>maxRange){throw new TypeError(`Passing a number "${embindRepr(value)}" from JS side to C/C++ side to an argument of type "${name}", which is outside the valid range [${minRange}, ${maxRange}]!`);}return value;},"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":integerReadValueFromPointer(name,size,!isUnsignedType),destructorFunction:null});}var GenericWireTypeSize=8;function __embind_register_bool(rawType,name,trueValue,falseValue){rawType>>>=0;name>>>=0;name=readLatin1String(name);registerType(rawType,{name:name,"fromWireType":function(wt){return!!wt;},"toWireType":function(destructors,o){return o?trueValue:falseValue;},"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":function(pointer){return this["fromWireType"](HEAPU8[pointer>>>0]);},destructorFunction:null});}var shallowCopyInternalPointer=o=>({count:o.count,deleteScheduled:o.deleteScheduled,preservePointerOnDelete:o.preservePointerOnDelete,ptr:o.ptr,ptrType:o.ptrType,smartPtr:o.smartPtr,smartPtrType:o.smartPtrType});var throwInstanceAlreadyDeleted=obj=>{function getInstanceTypeName(handle){return handle.$$.ptrType.registeredClass.name;}throwBindingError(getInstanceTypeName(obj)+" instance already deleted");};var finalizationRegistry=false;var detachFinalizer=handle=>{};var runDestructor=$$=>{if($$.smartPtr){$$.smartPtrType.rawDestructor($$.smartPtr);}else{$$.ptrType.registeredClass.rawDestructor($$.ptr);}};var releaseClassHandle=$$=>{$$.count.value-=1;var toDelete=0===$$.count.value;if(toDelete){runDestructor($$);}};var downcastPointer=(ptr,ptrClass,desiredClass)=>{if(ptrClass===desiredClass){return ptr;}if(undefined===desiredClass.baseClass){return null;}var rv=downcastPointer(ptr,ptrClass,desiredClass.baseClass);if(rv===null){return null;}return desiredClass.downcast(rv);};var registeredPointers={};var getInheritedInstanceCount=()=>Object.keys(registeredInstances).length;var getLiveInheritedInstances=()=>{var rv=[];for(var k in registeredInstances){if(registeredInstances.hasOwnProperty(k)){rv.push(registeredInstances[k]);}}return rv;};var deletionQueue=[];var flushPendingDeletes=()=>{while(deletionQueue.length){var obj=deletionQueue.pop();obj.$$.deleteScheduled=false;obj["delete"]();}};var delayFunction;var setDelayFunction=fn=>{delayFunction=fn;if(deletionQueue.length&&delayFunction){delayFunction(flushPendingDeletes);}};var init_embind=()=>{Module["getInheritedInstanceCount"]=getInheritedInstanceCount;Module["getLiveInheritedInstances"]=getLiveInheritedInstances;Module["flushPendingDeletes"]=flushPendingDeletes;Module["setDelayFunction"]=setDelayFunction;};var registeredInstances={};var getBasestPointer=(class_,ptr)=>{if(ptr===undefined){throwBindingError("ptr should not be undefined");}while(class_.baseClass){ptr=class_.upcast(ptr);class_=class_.baseClass;}return ptr;};var getInheritedInstance=(class_,ptr)=>{ptr=getBasestPointer(class_,ptr);return registeredInstances[ptr];};var makeClassHandle=(prototype,record)=>{if(!record.ptrType||!record.ptr){throwInternalError("makeClassHandle requires ptr and ptrType");}var hasSmartPtrType=!!record.smartPtrType;var hasSmartPtr=!!record.smartPtr;if(hasSmartPtrType!==hasSmartPtr){throwInternalError("Both smartPtrType and smartPtr must be specified");}record.count={value:1};return attachFinalizer(Object.create(prototype,{$$:{value:record}}));};function RegisteredPointer_fromWireType(ptr){var rawPointer=this.getPointee(ptr);if(!rawPointer){this.destructor(ptr);return null;}var registeredInstance=getInheritedInstance(this.registeredClass,rawPointer);if(undefined!==registeredInstance){if(0===registeredInstance.$$.count.value){registeredInstance.$$.ptr=rawPointer;registeredInstance.$$.smartPtr=ptr;return registeredInstance["clone"]();}else{var rv=registeredInstance["clone"]();this.destructor(ptr);return rv;}}function makeDefaultHandle(){if(this.isSmartPointer){return makeClassHandle(this.registeredClass.instancePrototype,{ptrType:this.pointeeType,ptr:rawPointer,smartPtrType:this,smartPtr:ptr});}else{return makeClassHandle(this.registeredClass.instancePrototype,{ptrType:this,ptr:ptr});}}var actualType=this.registeredClass.getActualType(rawPointer);var registeredPointerRecord=registeredPointers[actualType];if(!registeredPointerRecord){return makeDefaultHandle.call(this);}var toType;if(this.isConst){toType=registeredPointerRecord.constPointerType;}else{toType=registeredPointerRecord.pointerType;}var dp=downcastPointer(rawPointer,this.registeredClass,toType.registeredClass);if(dp===null){return makeDefaultHandle.call(this);}if(this.isSmartPointer){return makeClassHandle(toType.registeredClass.instancePrototype,{ptrType:toType,ptr:dp,smartPtrType:this,smartPtr:ptr});}else{return makeClassHandle(toType.registeredClass.instancePrototype,{ptrType:toType,ptr:dp});}}var attachFinalizer=handle=>{if("undefined"===typeof FinalizationRegistry){attachFinalizer=handle=>handle;return handle;}finalizationRegistry=new FinalizationRegistry(info=>{releaseClassHandle(info.$$);});attachFinalizer=handle=>{var $$=handle.$$;var hasSmartPtr=!!$$.smartPtr;if(hasSmartPtr){var info={$$:$$};finalizationRegistry.register(handle,info,handle);}return handle;};detachFinalizer=handle=>finalizationRegistry.unregister(handle);return attachFinalizer(handle);};var init_ClassHandle=()=>{Object.assign(ClassHandle.prototype,{"isAliasOf"(other){if(!(this instanceof ClassHandle)){return false;}if(!(other instanceof ClassHandle)){return false;}var leftClass=this.$$.ptrType.registeredClass;var left=this.$$.ptr;other.$$=other.$$;var rightClass=other.$$.ptrType.registeredClass;var right=other.$$.ptr;while(leftClass.baseClass){left=leftClass.upcast(left);leftClass=leftClass.baseClass;}while(rightClass.baseClass){right=rightClass.upcast(right);rightClass=rightClass.baseClass;}return leftClass===rightClass&&left===right;},"clone"(){if(!this.$$.ptr){throwInstanceAlreadyDeleted(this);}if(this.$$.preservePointerOnDelete){this.$$.count.value+=1;return this;}else{var clone=attachFinalizer(Object.create(Object.getPrototypeOf(this),{$$:{value:shallowCopyInternalPointer(this.$$)}}));clone.$$.count.value+=1;clone.$$.deleteScheduled=false;return clone;}},"delete"(){if(!this.$$.ptr){throwInstanceAlreadyDeleted(this);}if(this.$$.deleteScheduled&&!this.$$.preservePointerOnDelete){throwBindingError("Object already scheduled for deletion");}detachFinalizer(this);releaseClassHandle(this.$$);if(!this.$$.preservePointerOnDelete){this.$$.smartPtr=undefined;this.$$.ptr=undefined;}},"isDeleted"(){return!this.$$.ptr;},"deleteLater"(){if(!this.$$.ptr){throwInstanceAlreadyDeleted(this);}if(this.$$.deleteScheduled&&!this.$$.preservePointerOnDelete){throwBindingError("Object already scheduled for deletion");}deletionQueue.push(this);if(deletionQueue.length===1&&delayFunction){delayFunction(flushPendingDeletes);}this.$$.deleteScheduled=true;return this;}});};function ClassHandle(){}var createNamedFunction=(name,body)=>Object.defineProperty(body,"name",{value:name});var ensureOverloadTable=(proto,methodName,humanName)=>{if(undefined===proto[methodName].overloadTable){var prevFunc=proto[methodName];proto[methodName]=function(){if(!proto[methodName].overloadTable.hasOwnProperty(arguments.length)){throwBindingError(`Function '${humanName}' called with an invalid number of arguments (${arguments.length}) - expects one of (${proto[methodName].overloadTable})!`);}return proto[methodName].overloadTable[arguments.length].apply(this,arguments);};proto[methodName].overloadTable=[];proto[methodName].overloadTable[prevFunc.argCount]=prevFunc;}};var exposePublicSymbol=(name,value,numArguments)=>{if(Module.hasOwnProperty(name)){if(undefined===numArguments||undefined!==Module[name].overloadTable&&undefined!==Module[name].overloadTable[numArguments]){throwBindingError(`Cannot register public name '${name}' twice`);}ensureOverloadTable(Module,name,name);if(Module.hasOwnProperty(numArguments)){throwBindingError(`Cannot register multiple overloads of a function with the same number of arguments (${numArguments})!`);}Module[name].overloadTable[numArguments]=value;}else{Module[name]=value;if(undefined!==numArguments){Module[name].numArguments=numArguments;}}};var char_0=48;var char_9=57;var makeLegalFunctionName=name=>{if(undefined===name){return"_unknown";}name=name.replace(/[^a-zA-Z0-9_]/g,"$");var f=name.charCodeAt(0);if(f>=char_0&&f<=char_9){return`_${name}`;}return name;};function RegisteredClass(name,constructor,instancePrototype,rawDestructor,baseClass,getActualType,upcast,downcast){this.name=name;this.constructor=constructor;this.instancePrototype=instancePrototype;this.rawDestructor=rawDestructor;this.baseClass=baseClass;this.getActualType=getActualType;this.upcast=upcast;this.downcast=downcast;this.pureVirtualFunctions=[];}var upcastPointer=(ptr,ptrClass,desiredClass)=>{while(ptrClass!==desiredClass){if(!ptrClass.upcast){throwBindingError(`Expected null or instance of ${desiredClass.name}, got an instance of ${ptrClass.name}`);}ptr=ptrClass.upcast(ptr);ptrClass=ptrClass.baseClass;}return ptr;};function constNoSmartPtrRawPointerToWireType(destructors,handle){if(handle===null){if(this.isReference){throwBindingError(`null is not a valid ${this.name}`);}return 0;}if(!handle.$$){throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);}if(!handle.$$.ptr){throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);}var handleClass=handle.$$.ptrType.registeredClass;var ptr=upcastPointer(handle.$$.ptr,handleClass,this.registeredClass);return ptr;}function genericPointerToWireType(destructors,handle){var ptr;if(handle===null){if(this.isReference){throwBindingError(`null is not a valid ${this.name}`);}if(this.isSmartPointer){ptr=this.rawConstructor();if(destructors!==null){destructors.push(this.rawDestructor,ptr);}return ptr;}else{return 0;}}if(!handle.$$){throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);}if(!handle.$$.ptr){throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);}if(!this.isConst&&handle.$$.ptrType.isConst){throwBindingError(`Cannot convert argument of type ${handle.$$.smartPtrType?handle.$$.smartPtrType.name:handle.$$.ptrType.name} to parameter type ${this.name}`);}var handleClass=handle.$$.ptrType.registeredClass;ptr=upcastPointer(handle.$$.ptr,handleClass,this.registeredClass);if(this.isSmartPointer){if(undefined===handle.$$.smartPtr){throwBindingError("Passing raw pointer to smart pointer is illegal");}switch(this.sharingPolicy){case 0:if(handle.$$.smartPtrType===this){ptr=handle.$$.smartPtr;}else{throwBindingError(`Cannot convert argument of type ${handle.$$.smartPtrType?handle.$$.smartPtrType.name:handle.$$.ptrType.name} to parameter type ${this.name}`);}break;case 1:ptr=handle.$$.smartPtr;break;case 2:if(handle.$$.smartPtrType===this){ptr=handle.$$.smartPtr;}else{var clonedHandle=handle["clone"]();ptr=this.rawShare(ptr,Emval.toHandle(()=>clonedHandle["delete"]()));if(destructors!==null){destructors.push(this.rawDestructor,ptr);}}break;default:throwBindingError("Unsupporting sharing policy");}}return ptr;}function nonConstNoSmartPtrRawPointerToWireType(destructors,handle){if(handle===null){if(this.isReference){throwBindingError(`null is not a valid ${this.name}`);}return 0;}if(!handle.$$){throwBindingError(`Cannot pass "${embindRepr(handle)}" as a ${this.name}`);}if(!handle.$$.ptr){throwBindingError(`Cannot pass deleted object as a pointer of type ${this.name}`);}if(handle.$$.ptrType.isConst){throwBindingError(`Cannot convert argument of type ${handle.$$.ptrType.name} to parameter type ${this.name}`);}var handleClass=handle.$$.ptrType.registeredClass;var ptr=upcastPointer(handle.$$.ptr,handleClass,this.registeredClass);return ptr;}function readPointer(pointer){return this["fromWireType"](HEAPU32[pointer>>>2>>>0]);}var init_RegisteredPointer=()=>{Object.assign(RegisteredPointer.prototype,{getPointee(ptr){if(this.rawGetPointee){ptr=this.rawGetPointee(ptr);}return ptr;},destructor(ptr){if(this.rawDestructor){this.rawDestructor(ptr);}},"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":readPointer,"deleteObject"(handle){if(handle!==null){handle["delete"]();}},"fromWireType":RegisteredPointer_fromWireType});};function RegisteredPointer(name,registeredClass,isReference,isConst,isSmartPointer,pointeeType,sharingPolicy,rawGetPointee,rawConstructor,rawShare,rawDestructor){this.name=name;this.registeredClass=registeredClass;this.isReference=isReference;this.isConst=isConst;this.isSmartPointer=isSmartPointer;this.pointeeType=pointeeType;this.sharingPolicy=sharingPolicy;this.rawGetPointee=rawGetPointee;this.rawConstructor=rawConstructor;this.rawShare=rawShare;this.rawDestructor=rawDestructor;if(!isSmartPointer&&registeredClass.baseClass===undefined){if(isConst){this["toWireType"]=constNoSmartPtrRawPointerToWireType;this.destructorFunction=null;}else{this["toWireType"]=nonConstNoSmartPtrRawPointerToWireType;this.destructorFunction=null;}}else{this["toWireType"]=genericPointerToWireType;}}var replacePublicSymbol=(name,value,numArguments)=>{if(!Module.hasOwnProperty(name)){throwInternalError("Replacing nonexistant public symbol");}if(undefined!==Module[name].overloadTable&&undefined!==numArguments){Module[name].overloadTable[numArguments]=value;}else{Module[name]=value;Module[name].argCount=numArguments;}};var wasmTableMirror=[];var wasmTable;var getWasmTableEntry=funcPtr=>{var func=wasmTableMirror[funcPtr];if(!func){if(funcPtr>=wasmTableMirror.length)wasmTableMirror.length=funcPtr+1;wasmTableMirror[funcPtr]=func=wasmTable.get(funcPtr);}return func;};var embind__requireFunction=(signature,rawFunction)=>{signature=readLatin1String(signature);function makeDynCaller(){return getWasmTableEntry(rawFunction);}var fp=makeDynCaller();if(typeof fp!="function"){throwBindingError(`unknown function pointer with signature ${signature}: ${rawFunction}`);}return fp;};var extendError=(baseErrorType,errorName)=>{var errorClass=createNamedFunction(errorName,function(message){this.name=errorName;this.message=message;var stack=new Error(message).stack;if(stack!==undefined){this.stack=this.toString()+"\n"+stack.replace(/^Error(:[^\n]*)?\n/,"");}});errorClass.prototype=Object.create(baseErrorType.prototype);errorClass.prototype.constructor=errorClass;errorClass.prototype.toString=function(){if(this.message===undefined){return this.name;}else{return`${this.name}: ${this.message}`;}};return errorClass;};var UnboundTypeError;var getTypeName=type=>{var ptr=___getTypeName(type);var rv=readLatin1String(ptr);_free(ptr);return rv;};var throwUnboundTypeError=(message,types)=>{var unboundTypes=[];var seen={};function visit(type){if(seen[type]){return;}if(registeredTypes[type]){return;}if(typeDependencies[type]){typeDependencies[type].forEach(visit);return;}unboundTypes.push(type);seen[type]=true;}types.forEach(visit);throw new UnboundTypeError(`${message}: `+unboundTypes.map(getTypeName).join([", "]));};function __embind_register_class(rawType,rawPointerType,rawConstPointerType,baseClassRawType,getActualTypeSignature,getActualType,upcastSignature,upcast,downcastSignature,downcast,name,destructorSignature,rawDestructor){rawType>>>=0;rawPointerType>>>=0;rawConstPointerType>>>=0;baseClassRawType>>>=0;getActualTypeSignature>>>=0;getActualType>>>=0;upcastSignature>>>=0;upcast>>>=0;downcastSignature>>>=0;downcast>>>=0;name>>>=0;destructorSignature>>>=0;rawDestructor>>>=0;name=readLatin1String(name);getActualType=embind__requireFunction(getActualTypeSignature,getActualType);if(upcast){upcast=embind__requireFunction(upcastSignature,upcast);}if(downcast){downcast=embind__requireFunction(downcastSignature,downcast);}rawDestructor=embind__requireFunction(destructorSignature,rawDestructor);var legalFunctionName=makeLegalFunctionName(name);exposePublicSymbol(legalFunctionName,function(){throwUnboundTypeError(`Cannot construct ${name} due to unbound types`,[baseClassRawType]);});whenDependentTypesAreResolved([rawType,rawPointerType,rawConstPointerType],baseClassRawType?[baseClassRawType]:[],function(base){base=base[0];var baseClass;var basePrototype;if(baseClassRawType){baseClass=base.registeredClass;basePrototype=baseClass.instancePrototype;}else{basePrototype=ClassHandle.prototype;}var constructor=createNamedFunction(name,function(){if(Object.getPrototypeOf(this)!==instancePrototype){throw new BindingError("Use 'new' to construct "+name);}if(undefined===registeredClass.constructor_body){throw new BindingError(name+" has no accessible constructor");}var body=registeredClass.constructor_body[arguments.length];if(undefined===body){throw new BindingError(`Tried to invoke ctor of ${name} with invalid number of parameters (${arguments.length}) - expected (${Object.keys(registeredClass.constructor_body).toString()}) parameters instead!`);}return body.apply(this,arguments);});var instancePrototype=Object.create(basePrototype,{constructor:{value:constructor}});constructor.prototype=instancePrototype;var registeredClass=new RegisteredClass(name,constructor,instancePrototype,rawDestructor,baseClass,getActualType,upcast,downcast);if(registeredClass.baseClass){if(registeredClass.baseClass.__derivedClasses===undefined){registeredClass.baseClass.__derivedClasses=[];}registeredClass.baseClass.__derivedClasses.push(registeredClass);}var referenceConverter=new RegisteredPointer(name,registeredClass,true,false,false);var pointerConverter=new RegisteredPointer(name+"*",registeredClass,false,false,false);var constPointerConverter=new RegisteredPointer(name+" const*",registeredClass,false,true,false);registeredPointers[rawType]={pointerType:pointerConverter,constPointerType:constPointerConverter};replacePublicSymbol(legalFunctionName,constructor);return[referenceConverter,pointerConverter,constPointerConverter];});}var heap32VectorToArray=(count,firstElement)=>{var array=[];for(var i=0;i<count;i++){array.push(HEAPU32[firstElement+i*4>>>2>>>0]);}return array;};function newFunc(constructor,argumentList){if(!(constructor instanceof Function)){throw new TypeError(`new_ called with constructor type ${typeof constructor} which is not a function`);}var dummy=createNamedFunction(constructor.name||"unknownFunctionName",function(){});dummy.prototype=constructor.prototype;var obj=new dummy();var r=constructor.apply(obj,argumentList);return r instanceof Object?r:obj;}function craftInvokerFunction(humanName,argTypes,classType,cppInvokerFunc,cppTargetFunc,isAsync){var argCount=argTypes.length;if(argCount<2){throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");}var isClassMethodFunc=argTypes[1]!==null&&classType!==null;var needsDestructorStack=false;for(var i=1;i<argTypes.length;++i){if(argTypes[i]!==null&&argTypes[i].destructorFunction===undefined){needsDestructorStack=true;break;}}var returns=argTypes[0].name!=="void";var argsList="";var argsListWired="";for(var i=0;i<argCount-2;++i){argsList+=(i!==0?", ":"")+"arg"+i;argsListWired+=(i!==0?", ":"")+"arg"+i+"Wired";}var invokerFnBody=`\n        return function (${argsList}) {\n        if (arguments.length !== ${argCount-2}) {\n          throwBindingError('function ${humanName} called with ' + arguments.length + ' arguments, expected ${argCount-2}');\n        }`;if(needsDestructorStack){invokerFnBody+="var destructors = [];\n";}var dtorStack=needsDestructorStack?"destructors":"null";var args1=["throwBindingError","invoker","fn","runDestructors","retType","classParam"];var args2=[throwBindingError,cppInvokerFunc,cppTargetFunc,runDestructors,argTypes[0],argTypes[1]];if(isClassMethodFunc){invokerFnBody+="var thisWired = classParam.toWireType("+dtorStack+", this);\n";}for(var i=0;i<argCount-2;++i){invokerFnBody+="var arg"+i+"Wired = argType"+i+".toWireType("+dtorStack+", arg"+i+"); // "+argTypes[i+2].name+"\n";args1.push("argType"+i);args2.push(argTypes[i+2]);}if(isClassMethodFunc){argsListWired="thisWired"+(argsListWired.length>0?", ":"")+argsListWired;}invokerFnBody+=(returns||isAsync?"var rv = ":"")+"invoker(fn"+(argsListWired.length>0?", ":"")+argsListWired+");\n";if(needsDestructorStack){invokerFnBody+="runDestructors(destructors);\n";}else{for(var i=isClassMethodFunc?1:2;i<argTypes.length;++i){var paramName=i===1?"thisWired":"arg"+(i-2)+"Wired";if(argTypes[i].destructorFunction!==null){invokerFnBody+=paramName+"_dtor("+paramName+"); // "+argTypes[i].name+"\n";args1.push(paramName+"_dtor");args2.push(argTypes[i].destructorFunction);}}}if(returns){invokerFnBody+="var ret = retType.fromWireType(rv);\n"+"return ret;\n";}else{}invokerFnBody+="}\n";args1.push(invokerFnBody);var invokerFn=newFunc(Function,args1).apply(null,args2);return createNamedFunction(humanName,invokerFn);}function __embind_register_class_constructor(rawClassType,argCount,rawArgTypesAddr,invokerSignature,invoker,rawConstructor){rawClassType>>>=0;rawArgTypesAddr>>>=0;invokerSignature>>>=0;invoker>>>=0;rawConstructor>>>=0;var rawArgTypes=heap32VectorToArray(argCount,rawArgTypesAddr);invoker=embind__requireFunction(invokerSignature,invoker);whenDependentTypesAreResolved([],[rawClassType],function(classType){classType=classType[0];var humanName=`constructor ${classType.name}`;if(undefined===classType.registeredClass.constructor_body){classType.registeredClass.constructor_body=[];}if(undefined!==classType.registeredClass.constructor_body[argCount-1]){throw new BindingError(`Cannot register multiple constructors with identical number of parameters (${argCount-1}) for class '${classType.name}'! Overload resolution is currently only performed using the parameter count, not actual type info!`);}classType.registeredClass.constructor_body[argCount-1]=()=>{throwUnboundTypeError(`Cannot construct ${classType.name} due to unbound types`,rawArgTypes);};whenDependentTypesAreResolved([],rawArgTypes,argTypes=>{argTypes.splice(1,0,null);classType.registeredClass.constructor_body[argCount-1]=craftInvokerFunction(humanName,argTypes,null,invoker,rawConstructor);return[];});return[];});}var getFunctionName=signature=>{signature=signature.trim();const argsIndex=signature.indexOf("(");if(argsIndex!==-1){return signature.substr(0,argsIndex);}else{return signature;}};function __embind_register_class_function(rawClassType,methodName,argCount,rawArgTypesAddr,invokerSignature,rawInvoker,context,isPureVirtual,isAsync){rawClassType>>>=0;methodName>>>=0;rawArgTypesAddr>>>=0;invokerSignature>>>=0;rawInvoker>>>=0;context>>>=0;var rawArgTypes=heap32VectorToArray(argCount,rawArgTypesAddr);methodName=readLatin1String(methodName);methodName=getFunctionName(methodName);rawInvoker=embind__requireFunction(invokerSignature,rawInvoker);whenDependentTypesAreResolved([],[rawClassType],function(classType){classType=classType[0];var humanName=`${classType.name}.${methodName}`;if(methodName.startsWith("@@")){methodName=Symbol[methodName.substring(2)];}if(isPureVirtual){classType.registeredClass.pureVirtualFunctions.push(methodName);}function unboundTypesHandler(){throwUnboundTypeError(`Cannot call ${humanName} due to unbound types`,rawArgTypes);}var proto=classType.registeredClass.instancePrototype;var method=proto[methodName];if(undefined===method||undefined===method.overloadTable&&method.className!==classType.name&&method.argCount===argCount-2){unboundTypesHandler.argCount=argCount-2;unboundTypesHandler.className=classType.name;proto[methodName]=unboundTypesHandler;}else{ensureOverloadTable(proto,methodName,humanName);proto[methodName].overloadTable[argCount-2]=unboundTypesHandler;}whenDependentTypesAreResolved([],rawArgTypes,function(argTypes){var memberFunction=craftInvokerFunction(humanName,argTypes,classType,rawInvoker,context,isAsync);if(undefined===proto[methodName].overloadTable){memberFunction.argCount=argCount-2;proto[methodName]=memberFunction;}else{proto[methodName].overloadTable[argCount-2]=memberFunction;}return[];});return[];});}function handleAllocatorInit(){Object.assign(HandleAllocator.prototype,{get(id){return this.allocated[id];},has(id){return this.allocated[id]!==undefined;},allocate(handle){var id=this.freelist.pop()||this.allocated.length;this.allocated[id]=handle;return id;},free(id){this.allocated[id]=undefined;this.freelist.push(id);}});}function HandleAllocator(){this.allocated=[undefined];this.freelist=[];}var emval_handles=new HandleAllocator();function __emval_decref(handle){handle>>>=0;if(handle>=emval_handles.reserved&&0===--emval_handles.get(handle).refcount){emval_handles.free(handle);}}var count_emval_handles=()=>{var count=0;for(var i=emval_handles.reserved;i<emval_handles.allocated.length;++i){if(emval_handles.allocated[i]!==undefined){++count;}}return count;};var init_emval=()=>{emval_handles.allocated.push({value:undefined},{value:null},{value:true},{value:false});emval_handles.reserved=emval_handles.allocated.length;Module["count_emval_handles"]=count_emval_handles;};var Emval={toValue:handle=>{if(!handle){throwBindingError("Cannot use deleted val. handle = "+handle);}return emval_handles.get(handle).value;},toHandle:value=>{switch(value){case undefined:return 1;case null:return 2;case true:return 3;case false:return 4;default:{return emval_handles.allocate({refcount:1,value:value});}}}};var __embind_register_emval=function(rawType,name){rawType>>>=0;name>>>=0;name=readLatin1String(name);registerType(rawType,{name:name,"fromWireType":handle=>{var rv=Emval.toValue(handle);__emval_decref(handle);return rv;},"toWireType":(destructors,value)=>Emval.toHandle(value),"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":simpleReadValueFromPointer,destructorFunction:null});};var enumReadValueFromPointer=(name,width,signed)=>{switch(width){case 1:return signed?function(pointer){return this["fromWireType"](HEAP8[pointer>>>0>>>0]);}:function(pointer){return this["fromWireType"](HEAPU8[pointer>>>0>>>0]);};case 2:return signed?function(pointer){return this["fromWireType"](HEAP16[pointer>>>1>>>0]);}:function(pointer){return this["fromWireType"](HEAPU16[pointer>>>1>>>0]);};case 4:return signed?function(pointer){return this["fromWireType"](HEAP32[pointer>>>2>>>0]);}:function(pointer){return this["fromWireType"](HEAPU32[pointer>>>2>>>0]);};default:throw new TypeError(`invalid integer width (${width}): ${name}`);}};function __embind_register_enum(rawType,name,size,isSigned){rawType>>>=0;name>>>=0;size>>>=0;name=readLatin1String(name);function ctor(){}ctor.values={};registerType(rawType,{name:name,constructor:ctor,"fromWireType":function(c){return this.constructor.values[c];},"toWireType":(destructors,c)=>c.value,"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":enumReadValueFromPointer(name,size,isSigned),destructorFunction:null});exposePublicSymbol(name,ctor);}var requireRegisteredType=(rawType,humanName)=>{var impl=registeredTypes[rawType];if(undefined===impl){throwBindingError(humanName+" has unknown type "+getTypeName(rawType));}return impl;};function __embind_register_enum_value(rawEnumType,name,enumValue){rawEnumType>>>=0;name>>>=0;enumValue>>>=0;var enumType=requireRegisteredType(rawEnumType,"enum");name=readLatin1String(name);var Enum=enumType.constructor;var Value=Object.create(enumType.constructor.prototype,{value:{value:enumValue},constructor:{value:createNamedFunction(`${enumType.name}_${name}`,function(){})}});Enum.values[enumValue]=Value;Enum[name]=Value;}var floatReadValueFromPointer=(name,width)=>{switch(width){case 4:return function(pointer){return this["fromWireType"](HEAPF32[pointer>>>2>>>0]);};case 8:return function(pointer){return this["fromWireType"](HEAPF64[pointer>>>3>>>0]);};default:throw new TypeError(`invalid float width (${width}): ${name}`);}};var __embind_register_float=function(rawType,name,size){rawType>>>=0;name>>>=0;size>>>=0;name=readLatin1String(name);registerType(rawType,{name:name,"fromWireType":value=>value,"toWireType":(destructors,value)=>value,"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":floatReadValueFromPointer(name,size),destructorFunction:null});};function __embind_register_function(name,argCount,rawArgTypesAddr,signature,rawInvoker,fn,isAsync){name>>>=0;rawArgTypesAddr>>>=0;signature>>>=0;rawInvoker>>>=0;fn>>>=0;var argTypes=heap32VectorToArray(argCount,rawArgTypesAddr);name=readLatin1String(name);name=getFunctionName(name);rawInvoker=embind__requireFunction(signature,rawInvoker);exposePublicSymbol(name,function(){throwUnboundTypeError(`Cannot call ${name} due to unbound types`,argTypes);},argCount-1);whenDependentTypesAreResolved([],argTypes,function(argTypes){var invokerArgsArray=[argTypes[0],null].concat(argTypes.slice(1));replacePublicSymbol(name,craftInvokerFunction(name,invokerArgsArray,null,rawInvoker,fn,isAsync),argCount-1);return[];});}function __embind_register_integer(primitiveType,name,size,minRange,maxRange){primitiveType>>>=0;name>>>=0;size>>>=0;name=readLatin1String(name);if(maxRange===-1){maxRange=4294967295;}var fromWireType=value=>value;if(minRange===0){var bitshift=32-8*size;fromWireType=value=>value<<bitshift>>>bitshift;}var isUnsignedType=name.includes("unsigned");var checkAssertions=(value,toTypeName)=>{};var toWireType;if(isUnsignedType){toWireType=function(destructors,value){checkAssertions(value,this.name);return value>>>0;};}else{toWireType=function(destructors,value){checkAssertions(value,this.name);return value;};}registerType(primitiveType,{name:name,"fromWireType":fromWireType,"toWireType":toWireType,"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":integerReadValueFromPointer(name,size,minRange!==0),destructorFunction:null});}function __embind_register_memory_view(rawType,dataTypeIndex,name){rawType>>>=0;name>>>=0;var typeMapping=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array,BigInt64Array,BigUint64Array];var TA=typeMapping[dataTypeIndex];function decodeMemoryView(handle){var size=HEAPU32[handle>>>2>>>0];var data=HEAPU32[handle+4>>>2>>>0];return new TA(HEAP8.buffer,data,size);}name=readLatin1String(name);registerType(rawType,{name:name,"fromWireType":decodeMemoryView,"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":decodeMemoryView},{ignoreDuplicateRegistrations:true});}function __embind_register_smart_ptr(rawType,rawPointeeType,name,sharingPolicy,getPointeeSignature,rawGetPointee,constructorSignature,rawConstructor,shareSignature,rawShare,destructorSignature,rawDestructor){rawType>>>=0;rawPointeeType>>>=0;name>>>=0;getPointeeSignature>>>=0;rawGetPointee>>>=0;constructorSignature>>>=0;rawConstructor>>>=0;shareSignature>>>=0;rawShare>>>=0;destructorSignature>>>=0;rawDestructor>>>=0;name=readLatin1String(name);rawGetPointee=embind__requireFunction(getPointeeSignature,rawGetPointee);rawConstructor=embind__requireFunction(constructorSignature,rawConstructor);rawShare=embind__requireFunction(shareSignature,rawShare);rawDestructor=embind__requireFunction(destructorSignature,rawDestructor);whenDependentTypesAreResolved([rawType],[rawPointeeType],function(pointeeType){pointeeType=pointeeType[0];var registeredPointer=new RegisteredPointer(name,pointeeType.registeredClass,false,false,true,pointeeType,sharingPolicy,rawGetPointee,rawConstructor,rawShare,rawDestructor);return[registeredPointer];});}var lengthBytesUTF8=str=>{var len=0;for(var i=0;i<str.length;++i){var c=str.charCodeAt(i);if(c<=127){len++;}else if(c<=2047){len+=2;}else if(c>=55296&&c<=57343){len+=4;++i;}else{len+=3;}}return len;};function __embind_register_std_string(rawType,name){rawType>>>=0;name>>>=0;name=readLatin1String(name);var stdStringIsUTF8=name==="std::string";registerType(rawType,{name:name,"fromWireType"(value){var length=HEAPU32[value>>>2>>>0];var payload=value+4;var str;if(stdStringIsUTF8){var decodeStartPtr=payload;for(var i=0;i<=length;++i){var currentBytePtr=payload+i;if(i==length||HEAPU8[currentBytePtr>>>0]==0){var maxRead=currentBytePtr-decodeStartPtr;var stringSegment=UTF8ToString(decodeStartPtr,maxRead);if(str===undefined){str=stringSegment;}else{str+=String.fromCharCode(0);str+=stringSegment;}decodeStartPtr=currentBytePtr+1;}}}else{var a=new Array(length);for(var i=0;i<length;++i){a[i]=String.fromCharCode(HEAPU8[payload+i>>>0]);}str=a.join("");}_free(value);return str;},"toWireType"(destructors,value){if(value instanceof ArrayBuffer){value=new Uint8Array(value);}var length;var valueIsOfTypeString=typeof value=="string";if(!(valueIsOfTypeString||value instanceof Uint8Array||value instanceof Uint8ClampedArray||value instanceof Int8Array)){throwBindingError("Cannot pass non-string to std::string");}if(stdStringIsUTF8&&valueIsOfTypeString){length=lengthBytesUTF8(value);}else{length=value.length;}var base=_malloc(4+length+1);var ptr=base+4;HEAPU32[base>>>2>>>0]=length;if(stdStringIsUTF8&&valueIsOfTypeString){stringToUTF8(value,ptr,length+1);}else{if(valueIsOfTypeString){for(var i=0;i<length;++i){var charCode=value.charCodeAt(i);if(charCode>255){_free(ptr);throwBindingError("String has UTF-16 code units that do not fit in 8 bits");}HEAPU8[ptr+i>>>0]=charCode;}}else{for(var i=0;i<length;++i){HEAPU8[ptr+i>>>0]=value[i];}}}if(destructors!==null){destructors.push(_free,base);}return base;},"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":readPointer,destructorFunction(ptr){_free(ptr);}});}var UTF16Decoder=typeof TextDecoder!="undefined"?new TextDecoder("utf-16le"):undefined;var UTF16ToString=(ptr,maxBytesToRead)=>{var endPtr=ptr;var idx=endPtr>>1;var maxIdx=idx+maxBytesToRead/2;while(!(idx>=maxIdx)&&HEAPU16[idx>>>0])++idx;endPtr=idx<<1;if(endPtr-ptr>32&&UTF16Decoder)return UTF16Decoder.decode(HEAPU8.subarray(ptr>>>0,endPtr>>>0));var str="";for(var i=0;!(i>=maxBytesToRead/2);++i){var codeUnit=HEAP16[ptr+i*2>>>1>>>0];if(codeUnit==0)break;str+=String.fromCharCode(codeUnit);}return str;};var stringToUTF16=(str,outPtr,maxBytesToWrite)=>{if(maxBytesToWrite===undefined){maxBytesToWrite=2147483647;}if(maxBytesToWrite<2)return 0;maxBytesToWrite-=2;var startPtr=outPtr;var numCharsToWrite=maxBytesToWrite<str.length*2?maxBytesToWrite/2:str.length;for(var i=0;i<numCharsToWrite;++i){var codeUnit=str.charCodeAt(i);HEAP16[outPtr>>>1>>>0]=codeUnit;outPtr+=2;}HEAP16[outPtr>>>1>>>0]=0;return outPtr-startPtr;};var lengthBytesUTF16=str=>str.length*2;var UTF32ToString=(ptr,maxBytesToRead)=>{var i=0;var str="";while(!(i>=maxBytesToRead/4)){var utf32=HEAP32[ptr+i*4>>>2>>>0];if(utf32==0)break;++i;if(utf32>=65536){var ch=utf32-65536;str+=String.fromCharCode(55296|ch>>10,56320|ch&1023);}else{str+=String.fromCharCode(utf32);}}return str;};var stringToUTF32=(str,outPtr,maxBytesToWrite)=>{outPtr>>>=0;if(maxBytesToWrite===undefined){maxBytesToWrite=2147483647;}if(maxBytesToWrite<4)return 0;var startPtr=outPtr;var endPtr=startPtr+maxBytesToWrite-4;for(var i=0;i<str.length;++i){var codeUnit=str.charCodeAt(i);if(codeUnit>=55296&&codeUnit<=57343){var trailSurrogate=str.charCodeAt(++i);codeUnit=65536+((codeUnit&1023)<<10)|trailSurrogate&1023;}HEAP32[outPtr>>>2>>>0]=codeUnit;outPtr+=4;if(outPtr+4>endPtr)break;}HEAP32[outPtr>>>2>>>0]=0;return outPtr-startPtr;};var lengthBytesUTF32=str=>{var len=0;for(var i=0;i<str.length;++i){var codeUnit=str.charCodeAt(i);if(codeUnit>=55296&&codeUnit<=57343)++i;len+=4;}return len;};var __embind_register_std_wstring=function(rawType,charSize,name){rawType>>>=0;charSize>>>=0;name>>>=0;name=readLatin1String(name);var decodeString,encodeString,getHeap,lengthBytesUTF,shift;if(charSize===2){decodeString=UTF16ToString;encodeString=stringToUTF16;lengthBytesUTF=lengthBytesUTF16;getHeap=()=>HEAPU16;shift=1;}else if(charSize===4){decodeString=UTF32ToString;encodeString=stringToUTF32;lengthBytesUTF=lengthBytesUTF32;getHeap=()=>HEAPU32;shift=2;}registerType(rawType,{name:name,"fromWireType":value=>{var length=HEAPU32[value>>>2>>>0];var HEAP=getHeap();var str;var decodeStartPtr=value+4;for(var i=0;i<=length;++i){var currentBytePtr=value+4+i*charSize;if(i==length||HEAP[currentBytePtr>>>shift]==0){var maxReadBytes=currentBytePtr-decodeStartPtr;var stringSegment=decodeString(decodeStartPtr,maxReadBytes);if(str===undefined){str=stringSegment;}else{str+=String.fromCharCode(0);str+=stringSegment;}decodeStartPtr=currentBytePtr+charSize;}}_free(value);return str;},"toWireType":(destructors,value)=>{if(!(typeof value=="string")){throwBindingError(`Cannot pass non-string to C++ string type ${name}`);}var length=lengthBytesUTF(value);var ptr=_malloc(4+length+charSize);HEAPU32[ptr>>>2]=length>>shift;encodeString(value,ptr+4,length+charSize);if(destructors!==null){destructors.push(_free,ptr);}return ptr;},"argPackAdvance":GenericWireTypeSize,"readValueFromPointer":simpleReadValueFromPointer,destructorFunction(ptr){_free(ptr);}});};function __embind_register_value_object(rawType,name,constructorSignature,rawConstructor,destructorSignature,rawDestructor){rawType>>>=0;name>>>=0;constructorSignature>>>=0;rawConstructor>>>=0;destructorSignature>>>=0;rawDestructor>>>=0;structRegistrations[rawType]={name:readLatin1String(name),rawConstructor:embind__requireFunction(constructorSignature,rawConstructor),rawDestructor:embind__requireFunction(destructorSignature,rawDestructor),fields:[]};}function __embind_register_value_object_field(structType,fieldName,getterReturnType,getterSignature,getter,getterContext,setterArgumentType,setterSignature,setter,setterContext){structType>>>=0;fieldName>>>=0;getterReturnType>>>=0;getterSignature>>>=0;getter>>>=0;getterContext>>>=0;setterArgumentType>>>=0;setterSignature>>>=0;setter>>>=0;setterContext>>>=0;structRegistrations[structType].fields.push({fieldName:readLatin1String(fieldName),getterReturnType:getterReturnType,getter:embind__requireFunction(getterSignature,getter),getterContext:getterContext,setterArgumentType:setterArgumentType,setter:embind__requireFunction(setterSignature,setter),setterContext:setterContext});}var __embind_register_void=function(rawType,name){rawType>>>=0;name>>>=0;name=readLatin1String(name);registerType(rawType,{isVoid:true,name:name,"argPackAdvance":0,"fromWireType":()=>undefined,"toWireType":(destructors,o)=>undefined});};var emval_returnValue=(returnType,destructorsRef,handle)=>{var destructors=[];var result=returnType["toWireType"](destructors,handle);if(destructors.length){HEAPU32[destructorsRef>>>2>>>0]=Emval.toHandle(destructors);}return result;};function __emval_as(handle,returnType,destructorsRef){handle>>>=0;returnType>>>=0;destructorsRef>>>=0;handle=Emval.toValue(handle);returnType=requireRegisteredType(returnType,"emval::as");return emval_returnValue(returnType,destructorsRef,handle);}var emval_methodCallers=[];function __emval_call(caller,handle,destructorsRef,args){caller>>>=0;handle>>>=0;destructorsRef>>>=0;args>>>=0;caller=emval_methodCallers[caller];handle=Emval.toValue(handle);return caller(null,handle,destructorsRef,args);}var emval_symbols={};var getStringOrSymbol=address=>{var symbol=emval_symbols[address];if(symbol===undefined){return readLatin1String(address);}return symbol;};function __emval_call_method(caller,objHandle,methodName,destructorsRef,args){caller>>>=0;objHandle>>>=0;methodName>>>=0;destructorsRef>>>=0;args>>>=0;caller=emval_methodCallers[caller];objHandle=Emval.toValue(objHandle);methodName=getStringOrSymbol(methodName);return caller(objHandle,objHandle[methodName],destructorsRef,args);}var emval_get_global=()=>{if(typeof globalThis=="object"){return globalThis;}return function(){return Function;}()("return this")();};function __emval_get_global(name){name>>>=0;if(name===0){return Emval.toHandle(emval_get_global());}else{name=getStringOrSymbol(name);return Emval.toHandle(emval_get_global()[name]);}}var emval_addMethodCaller=caller=>{var id=emval_methodCallers.length;emval_methodCallers.push(caller);return id;};var emval_lookupTypes=(argCount,argTypes)=>{var a=new Array(argCount);for(var i=0;i<argCount;++i){a[i]=requireRegisteredType(HEAPU32[argTypes+i*4>>>2>>>0],"parameter "+i);}return a;};var reflectConstruct=Reflect.construct;function __emval_get_method_caller(argCount,argTypes,kind){argTypes>>>=0;var types=emval_lookupTypes(argCount,argTypes);var retType=types.shift();argCount--;var functionBody=`return function (obj, func, destructorsRef, args) {\n`;var offset=0;var argsList=[];if(kind===0){argsList.push("obj");}var params=["retType"];var args=[retType];for(var i=0;i<argCount;++i){argsList.push("arg"+i);params.push("argType"+i);args.push(types[i]);functionBody+=`  var arg${i} = argType${i}.readValueFromPointer(args${offset?"+"+offset:""});\n`;offset+=types[i]["argPackAdvance"];}var invoker=kind===1?"new func":"func.call";functionBody+=`  var rv = ${invoker}(${argsList.join(", ")});\n`;for(var i=0;i<argCount;++i){if(types[i]["deleteObject"]){functionBody+=`  argType${i}.deleteObject(arg${i});\n`;}}if(!retType.isVoid){params.push("emval_returnValue");args.push(emval_returnValue);functionBody+="  return emval_returnValue(retType, destructorsRef, rv);\n";}functionBody+="};\n";params.push(functionBody);var invokerFunction=newFunc(Function,params).apply(null,args);var functionName=`methodCaller<(${types.map(t=>t.name).join(", ")}) => ${retType.name}>`;return emval_addMethodCaller(createNamedFunction(functionName,invokerFunction));}function __emval_get_module_property(name){name>>>=0;name=getStringOrSymbol(name);return Emval.toHandle(Module[name]);}function __emval_get_property(handle,key){handle>>>=0;key>>>=0;handle=Emval.toValue(handle);key=Emval.toValue(key);return Emval.toHandle(handle[key]);}function __emval_incref(handle){handle>>>=0;if(handle>4){emval_handles.get(handle).refcount+=1;}}function __emval_instanceof(object,constructor){object>>>=0;constructor>>>=0;object=Emval.toValue(object);constructor=Emval.toValue(constructor);return object instanceof constructor;}function __emval_new_array(){return Emval.toHandle([]);}function __emval_new_cstring(v){v>>>=0;return Emval.toHandle(getStringOrSymbol(v));}function __emval_new_object(){return Emval.toHandle({});}function __emval_run_destructors(handle){handle>>>=0;var destructors=Emval.toValue(handle);runDestructors(destructors);__emval_decref(handle);}function __emval_set_property(handle,key,value){handle>>>=0;key>>>=0;value>>>=0;handle=Emval.toValue(handle);key=Emval.toValue(key);value=Emval.toValue(value);handle[key]=value;}function __emval_take_value(type,arg){type>>>=0;arg>>>=0;type=requireRegisteredType(type,"_emval_take_value");var v=type["readValueFromPointer"](arg);return Emval.toHandle(v);}function __emval_typeof(handle){handle>>>=0;handle=Emval.toValue(handle);return Emval.toHandle(typeof handle);}var _emscripten_get_now;_emscripten_get_now=()=>performance.now();var nowIsMonotonic=true;var checkWasiClock=clock_id=>clock_id==0||clock_id==1||clock_id==2||clock_id==3;function _clock_time_get(clk_id,ignored_precision,ptime){ignored_precision=bigintToI53Checked(ignored_precision);ptime>>>=0;if(!checkWasiClock(clk_id)){return 28;}var now;if(clk_id===0){now=Date.now();}else if(nowIsMonotonic){now=_emscripten_get_now();}else{return 52;}var nsec=Math.round(now*1e3*1e3);HEAP32[ptime>>>2>>>0]=nsec>>>0;HEAP32[ptime+4>>>2>>>0]=nsec/Math.pow(2,32)>>>0;return 0;}var readEmAsmArgsArray=[];var readEmAsmArgs=(sigPtr,buf)=>{readEmAsmArgsArray.length=0;var ch;while(ch=HEAPU8[sigPtr++>>>0]){var wide=ch!=105;wide&=ch!=112;buf+=wide&&buf%8?4:0;readEmAsmArgsArray.push(ch==112?HEAPU32[buf>>>2>>>0]:ch==106?HEAP64[buf>>>3]:ch==105?HEAP32[buf>>>2>>>0]:HEAPF64[buf>>>3>>>0]);buf+=wide?8:4;}return readEmAsmArgsArray;};var runEmAsmFunction=(code,sigPtr,argbuf)=>{var args=readEmAsmArgs(sigPtr,argbuf);return ASM_CONSTS[code].apply(null,args);};function _emscripten_asm_const_int(code,sigPtr,argbuf){code>>>=0;sigPtr>>>=0;argbuf>>>=0;return runEmAsmFunction(code,sigPtr,argbuf);}function _emscripten_notify_memory_growth(memoryIndex){memoryIndex>>>=0;updateMemoryViews();}var ENV={};var getExecutableName=()=>thisProgram||"./this.program";var getEnvStrings=()=>{if(!getEnvStrings.strings){var lang=(typeof navigator=="object"&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8";var env={"USER":"web_user","LOGNAME":"web_user","PATH":"/","PWD":"/","HOME":"/home/web_user","LANG":lang,"_":getExecutableName()};for(var x in ENV){if(ENV[x]===undefined)delete env[x];else env[x]=ENV[x];}var strings=[];for(var x in env){strings.push(`${x}=${env[x]}`);}getEnvStrings.strings=strings;}return getEnvStrings.strings;};var stringToAscii=(str,buffer)=>{for(var i=0;i<str.length;++i){HEAP8[buffer++>>>0>>>0]=str.charCodeAt(i);}HEAP8[buffer>>>0>>>0]=0;};var _environ_get=function(__environ,environ_buf){__environ>>>=0;environ_buf>>>=0;var bufSize=0;getEnvStrings().forEach((string,i)=>{var ptr=environ_buf+bufSize;HEAPU32[__environ+i*4>>>2>>>0]=ptr;stringToAscii(string,ptr);bufSize+=string.length+1;});return 0;};var _environ_sizes_get=function(penviron_count,penviron_buf_size){penviron_count>>>=0;penviron_buf_size>>>=0;var strings=getEnvStrings();HEAPU32[penviron_count>>>2>>>0]=strings.length;var bufSize=0;strings.forEach(string=>bufSize+=string.length+1);HEAPU32[penviron_buf_size>>>2>>>0]=bufSize;return 0;};var _fd_close=fd=>52;function _fd_read(fd,iov,iovcnt,pnum){iov>>>=0;iovcnt>>>=0;pnum>>>=0;return 52;}function _fd_seek(fd,offset,whence,newOffset){offset=bigintToI53Checked(offset);newOffset>>>=0;return 70;}var printCharBuffers=[null,[],[]];var printChar=(stream,curr)=>{var buffer=printCharBuffers[stream];if(curr===0||curr===10){(stream===1?out:err)(UTF8ArrayToString(buffer,0));buffer.length=0;}else{buffer.push(curr);}};function _fd_write(fd,iov,iovcnt,pnum){iov>>>=0;iovcnt>>>=0;pnum>>>=0;var num=0;for(var i=0;i<iovcnt;i++){var ptr=HEAPU32[iov>>>2>>>0];var len=HEAPU32[iov+4>>>2>>>0];iov+=8;for(var j=0;j<len;j++){printChar(fd,HEAPU8[ptr+j>>>0]);}num+=len;}HEAPU32[pnum>>>2>>>0]=num;return 0;}var runtimeKeepaliveCounter=0;var keepRuntimeAlive=()=>noExitRuntime||runtimeKeepaliveCounter>0;var _proc_exit=code=>{EXITSTATUS=code;if(!keepRuntimeAlive()){if(Module["onExit"])Module["onExit"](code);ABORT=true;}quit_(code,new ExitStatus(code));};var isLeapYear=year=>year%4===0&&(year%100!==0||year%400===0);var arraySum=(array,index)=>{var sum=0;for(var i=0;i<=index;sum+=array[i++]){}return sum;};var MONTH_DAYS_LEAP=[31,29,31,30,31,30,31,31,30,31,30,31];var MONTH_DAYS_REGULAR=[31,28,31,30,31,30,31,31,30,31,30,31];var addDays=(date,days)=>{var newDate=new Date(date.getTime());while(days>0){var leap=isLeapYear(newDate.getFullYear());var currentMonth=newDate.getMonth();var daysInCurrentMonth=(leap?MONTH_DAYS_LEAP:MONTH_DAYS_REGULAR)[currentMonth];if(days>daysInCurrentMonth-newDate.getDate()){days-=daysInCurrentMonth-newDate.getDate()+1;newDate.setDate(1);if(currentMonth<11){newDate.setMonth(currentMonth+1);}else{newDate.setMonth(0);newDate.setFullYear(newDate.getFullYear()+1);}}else{newDate.setDate(newDate.getDate()+days);return newDate;}}return newDate;};var jstoi_q=str=>parseInt(str);function intArrayFromString(stringy,dontAddNull,length){var len=length>0?length:lengthBytesUTF8(stringy)+1;var u8array=new Array(len);var numBytesWritten=stringToUTF8Array(stringy,u8array,0,u8array.length);if(dontAddNull)u8array.length=numBytesWritten;return u8array;}function _strptime(buf,format,tm){buf>>>=0;format>>>=0;tm>>>=0;var pattern=UTF8ToString(format);var SPECIAL_CHARS="\\!@#$^&*()+=-[]/{}|:<>?,.";for(var i=0,ii=SPECIAL_CHARS.length;i<ii;++i){pattern=pattern.replace(new RegExp("\\"+SPECIAL_CHARS[i],"g"),"\\"+SPECIAL_CHARS[i]);}var EQUIVALENT_MATCHERS={"%A":"%a","%B":"%b","%c":"%a %b %d %H:%M:%S %Y","%D":"%m\\/%d\\/%y","%e":"%d","%F":"%Y-%m-%d","%h":"%b","%R":"%H\\:%M","%r":"%I\\:%M\\:%S\\s%p","%T":"%H\\:%M\\:%S","%x":"%m\\/%d\\/(?:%y|%Y)","%X":"%H\\:%M\\:%S"};for(var matcher in EQUIVALENT_MATCHERS){pattern=pattern.replace(matcher,EQUIVALENT_MATCHERS[matcher]);}var DATE_PATTERNS={"%a":"(?:Sun(?:day)?)|(?:Mon(?:day)?)|(?:Tue(?:sday)?)|(?:Wed(?:nesday)?)|(?:Thu(?:rsday)?)|(?:Fri(?:day)?)|(?:Sat(?:urday)?)","%b":"(?:Jan(?:uary)?)|(?:Feb(?:ruary)?)|(?:Mar(?:ch)?)|(?:Apr(?:il)?)|May|(?:Jun(?:e)?)|(?:Jul(?:y)?)|(?:Aug(?:ust)?)|(?:Sep(?:tember)?)|(?:Oct(?:ober)?)|(?:Nov(?:ember)?)|(?:Dec(?:ember)?)","%C":"\\d\\d","%d":"0[1-9]|[1-9](?!\\d)|1\\d|2\\d|30|31","%H":"\\d(?!\\d)|[0,1]\\d|20|21|22|23","%I":"\\d(?!\\d)|0\\d|10|11|12","%j":"00[1-9]|0?[1-9](?!\\d)|0?[1-9]\\d(?!\\d)|[1,2]\\d\\d|3[0-6]\\d","%m":"0[1-9]|[1-9](?!\\d)|10|11|12","%M":"0\\d|\\d(?!\\d)|[1-5]\\d","%n":"\\s","%p":"AM|am|PM|pm|A\\.M\\.|a\\.m\\.|P\\.M\\.|p\\.m\\.","%S":"0\\d|\\d(?!\\d)|[1-5]\\d|60","%U":"0\\d|\\d(?!\\d)|[1-4]\\d|50|51|52|53","%W":"0\\d|\\d(?!\\d)|[1-4]\\d|50|51|52|53","%w":"[0-6]","%y":"\\d\\d","%Y":"\\d\\d\\d\\d","%%":"%","%t":"\\s"};var MONTH_NUMBERS={JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11};var DAY_NUMBERS_SUN_FIRST={SUN:0,MON:1,TUE:2,WED:3,THU:4,FRI:5,SAT:6};var DAY_NUMBERS_MON_FIRST={MON:0,TUE:1,WED:2,THU:3,FRI:4,SAT:5,SUN:6};for(var datePattern in DATE_PATTERNS){pattern=pattern.replace(datePattern,"("+datePattern+DATE_PATTERNS[datePattern]+")");}var capture=[];for(var i=pattern.indexOf("%");i>=0;i=pattern.indexOf("%")){capture.push(pattern[i+1]);pattern=pattern.replace(new RegExp("\\%"+pattern[i+1],"g"),"");}var matches=new RegExp("^"+pattern,"i").exec(UTF8ToString(buf));function initDate(){function fixup(value,min,max){return typeof value!="number"||isNaN(value)?min:value>=min?value<=max?value:max:min;}return{year:fixup(HEAP32[tm+20>>>2>>>0]+1900,1970,9999),month:fixup(HEAP32[tm+16>>>2>>>0],0,11),day:fixup(HEAP32[tm+12>>>2>>>0],1,31),hour:fixup(HEAP32[tm+8>>>2>>>0],0,23),min:fixup(HEAP32[tm+4>>>2>>>0],0,59),sec:fixup(HEAP32[tm>>>2>>>0],0,59)};}if(matches){var date=initDate();var value;var getMatch=symbol=>{var pos=capture.indexOf(symbol);if(pos>=0){return matches[pos+1];}return;};if(value=getMatch("S")){date.sec=jstoi_q(value);}if(value=getMatch("M")){date.min=jstoi_q(value);}if(value=getMatch("H")){date.hour=jstoi_q(value);}else if(value=getMatch("I")){var hour=jstoi_q(value);if(value=getMatch("p")){hour+=value.toUpperCase()[0]==="P"?12:0;}date.hour=hour;}if(value=getMatch("Y")){date.year=jstoi_q(value);}else if(value=getMatch("y")){var year=jstoi_q(value);if(value=getMatch("C")){year+=jstoi_q(value)*100;}else{year+=year<69?2e3:1900;}date.year=year;}if(value=getMatch("m")){date.month=jstoi_q(value)-1;}else if(value=getMatch("b")){date.month=MONTH_NUMBERS[value.substring(0,3).toUpperCase()]||0;}if(value=getMatch("d")){date.day=jstoi_q(value);}else if(value=getMatch("j")){var day=jstoi_q(value);var leapYear=isLeapYear(date.year);for(var month=0;month<12;++month){var daysUntilMonth=arraySum(leapYear?MONTH_DAYS_LEAP:MONTH_DAYS_REGULAR,month-1);if(day<=daysUntilMonth+(leapYear?MONTH_DAYS_LEAP:MONTH_DAYS_REGULAR)[month]){date.day=day-daysUntilMonth;}}}else if(value=getMatch("a")){var weekDay=value.substring(0,3).toUpperCase();if(value=getMatch("U")){var weekDayNumber=DAY_NUMBERS_SUN_FIRST[weekDay];var weekNumber=jstoi_q(value);var janFirst=new Date(date.year,0,1);var endDate;if(janFirst.getDay()===0){endDate=addDays(janFirst,weekDayNumber+7*(weekNumber-1));}else{endDate=addDays(janFirst,7-janFirst.getDay()+weekDayNumber+7*(weekNumber-1));}date.day=endDate.getDate();date.month=endDate.getMonth();}else if(value=getMatch("W")){var weekDayNumber=DAY_NUMBERS_MON_FIRST[weekDay];var weekNumber=jstoi_q(value);var janFirst=new Date(date.year,0,1);var endDate;if(janFirst.getDay()===1){endDate=addDays(janFirst,weekDayNumber+7*(weekNumber-1));}else{endDate=addDays(janFirst,7-janFirst.getDay()+1+weekDayNumber+7*(weekNumber-1));}date.day=endDate.getDate();date.month=endDate.getMonth();}}var fullDate=new Date(date.year,date.month,date.day,date.hour,date.min,date.sec,0);HEAP32[tm>>>2>>>0]=fullDate.getSeconds();HEAP32[tm+4>>>2>>>0]=fullDate.getMinutes();HEAP32[tm+8>>>2>>>0]=fullDate.getHours();HEAP32[tm+12>>>2>>>0]=fullDate.getDate();HEAP32[tm+16>>>2>>>0]=fullDate.getMonth();HEAP32[tm+20>>>2>>>0]=fullDate.getFullYear()-1900;HEAP32[tm+24>>>2>>>0]=fullDate.getDay();HEAP32[tm+28>>>2>>>0]=arraySum(isLeapYear(fullDate.getFullYear())?MONTH_DAYS_LEAP:MONTH_DAYS_REGULAR,fullDate.getMonth()-1)+fullDate.getDate()-1;HEAP32[tm+32>>>2>>>0]=0;return buf+intArrayFromString(matches[0]).length-1;}return 0;}var exitJS=(status,implicit)=>{EXITSTATUS=status;_proc_exit(status);};var handleException=e=>{if(e instanceof ExitStatus||e=="unwind"){return EXITSTATUS;}quit_(1,e);};InternalError=Module["InternalError"]=class InternalError extends Error{constructor(message){super(message);this.name="InternalError";}};embind_init_charCodes();BindingError=Module["BindingError"]=class BindingError extends Error{constructor(message){super(message);this.name="BindingError";}};init_ClassHandle();init_embind();init_RegisteredPointer();UnboundTypeError=Module["UnboundTypeError"]=extendError(Error,"UnboundTypeError");handleAllocatorInit();init_emval();var wasmImports={__syscall_ftruncate64:___syscall_ftruncate64,__syscall_getdents64:___syscall_getdents64,_embind_finalize_value_object:__embind_finalize_value_object,_embind_register_bigint:__embind_register_bigint,_embind_register_bool:__embind_register_bool,_embind_register_class:__embind_register_class,_embind_register_class_constructor:__embind_register_class_constructor,_embind_register_class_function:__embind_register_class_function,_embind_register_emval:__embind_register_emval,_embind_register_enum:__embind_register_enum,_embind_register_enum_value:__embind_register_enum_value,_embind_register_float:__embind_register_float,_embind_register_function:__embind_register_function,_embind_register_integer:__embind_register_integer,_embind_register_memory_view:__embind_register_memory_view,_embind_register_smart_ptr:__embind_register_smart_ptr,_embind_register_std_string:__embind_register_std_string,_embind_register_std_wstring:__embind_register_std_wstring,_embind_register_value_object:__embind_register_value_object,_embind_register_value_object_field:__embind_register_value_object_field,_embind_register_void:__embind_register_void,_emval_as:__emval_as,_emval_call:__emval_call,_emval_call_method:__emval_call_method,_emval_decref:__emval_decref,_emval_get_global:__emval_get_global,_emval_get_method_caller:__emval_get_method_caller,_emval_get_module_property:__emval_get_module_property,_emval_get_property:__emval_get_property,_emval_incref:__emval_incref,_emval_instanceof:__emval_instanceof,_emval_new_array:__emval_new_array,_emval_new_cstring:__emval_new_cstring,_emval_new_object:__emval_new_object,_emval_run_destructors:__emval_run_destructors,_emval_set_property:__emval_set_property,_emval_take_value:__emval_take_value,_emval_typeof:__emval_typeof,clock_time_get:_clock_time_get,emscripten_asm_const_int:_emscripten_asm_const_int,emscripten_notify_memory_growth:_emscripten_notify_memory_growth,environ_get:_environ_get,environ_sizes_get:_environ_sizes_get,fd_close:_fd_close,fd_read:_fd_read,fd_seek:_fd_seek,fd_write:_fd_write,proc_exit:_proc_exit,strptime:_strptime};var wasmExports=createWasm();var _malloc=a0=>(_malloc=wasmExports["malloc"])(a0);var _free=a0=>(_free=wasmExports["free"])(a0);var ___errno_location=()=>(___errno_location=wasmExports["__errno_location"])();var __initialize=Module["__initialize"]=()=>(__initialize=Module["__initialize"]=wasmExports["_initialize"])();var ___getTypeName=a0=>(___getTypeName=wasmExports["__getTypeName"])(a0);var ___cxa_increment_exception_refcount=a0=>(___cxa_increment_exception_refcount=wasmExports["__cxa_increment_exception_refcount"])(a0);var ___cxa_is_pointer_type=a0=>(___cxa_is_pointer_type=wasmExports["__cxa_is_pointer_type"])(a0);function applySignatureConversions(wasmExports){wasmExports=Object.assign({},wasmExports);var makeWrapper_pp=f=>a0=>f(a0)>>>0;var makeWrapper_p=f=>()=>f()>>>0;wasmExports["malloc"]=makeWrapper_pp(wasmExports["malloc"]);wasmExports["__errno_location"]=makeWrapper_p(wasmExports["__errno_location"]);wasmExports["__getTypeName"]=makeWrapper_pp(wasmExports["__getTypeName"]);wasmExports["stackSave"]=makeWrapper_p(wasmExports["stackSave"]);wasmExports["stackAlloc"]=makeWrapper_pp(wasmExports["stackAlloc"]);return wasmExports;}var calledRun;var mainArgs=undefined;dependenciesFulfilled=function runCaller(){if(!calledRun)run();if(!calledRun)dependenciesFulfilled=runCaller;};function callMain(args=[]){var entryFunction=__initialize;mainArgs=[thisProgram].concat(args);try{entryFunction();var ret=0;exitJS(ret,true);return ret;}catch(e){return handleException(e);}}function run(args=arguments_){if(runDependencies>0){return;}preRun();if(runDependencies>0){return;}function doRun(){if(calledRun)return;calledRun=true;Module["calledRun"]=true;if(ABORT)return;initRuntime();preMain();readyPromiseResolve(Module);if(Module["onRuntimeInitialized"])Module["onRuntimeInitialized"]();if(shouldRunNow)callMain(args);postRun();}if(Module["setStatus"]){Module["setStatus"]("Running...");setTimeout(function(){setTimeout(function(){Module["setStatus"]("");},1);doRun();},1);}else{doRun();}}if(Module["preInit"]){if(typeof Module["preInit"]=="function")Module["preInit"]=[Module["preInit"]];while(Module["preInit"].length>0){Module["preInit"].pop()();}}var shouldRunNow=true;if(Module["noInitialRun"])shouldRunNow=false;run();return moduleArg.ready;};})();;/* harmony default export */ const perspective_cpp = (load_perspective);
;// CONCATENATED MODULE: ../packages/perspective/src/js/config/constants.js
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
const DATA_TYPES={integer:"integer",float:"float",string:"string",boolean:"boolean",date:"date",datetime:"datetime",object:"object"};const CONFIG_ALIASES={row_pivot:"group_by","row-pivot":"group_by","row-pivots":"group_by",col_pivot:"split_by",col_pivots:"split_by",column_pivot:"split_by","column-pivot":"split_by","column-pivots":"split_by",filters:"filter",sorts:"sort"};const CONFIG_VALID_KEYS=["version","viewport","group_by","split_by","aggregates","columns","filter","sort","computed_columns","expressions","group_by_depth","split_by_depth","filter_op"];const NUMBER_AGGREGATES=["any","avg","abs sum","count","distinct count","dominant","first by index","last by index","last minus first","last","high","join","low","high minus low","max","mean","median","min","pct sum parent","pct sum grand total","stddev","sum","sum abs","sum not null","unique","var"];const STRING_AGGREGATES=["any","count","distinct count","distinct leaf","dominant","first by index","join","last by index","last","unique"];const BOOLEAN_AGGREGATES=["any","count","distinct count","distinct leaf","dominant","first by index","last by index","last","unique"];const SORT_ORDERS=["none","asc","desc","col asc","col desc","asc abs","desc abs","col asc abs","col desc abs"];const SORT_ORDER_IDS=[2,0,1,0,1,3,4,3,4];const TYPE_AGGREGATES={string:STRING_AGGREGATES,float:NUMBER_AGGREGATES,integer:NUMBER_AGGREGATES,boolean:BOOLEAN_AGGREGATES,datetime:STRING_AGGREGATES,date:STRING_AGGREGATES};const FILTER_OPERATORS={lessThan:"<",greaterThan:">",equals:"==",lessThanOrEquals:"<=",greaterThanOrEquals:">=",doesNotEqual:"!=",isNull:"is null",isNotNull:"is not null",isIn:"in",isNotIn:"not in",contains:"contains",bitwiseAnd:"&",bitwiseOr:"|",and:"and",or:"or",beginsWith:"begins with",endsWith:"ends with"};const BOOLEAN_FILTERS=[FILTER_OPERATORS.bitwiseAnd,FILTER_OPERATORS.bitwiseOr,FILTER_OPERATORS.equals,FILTER_OPERATORS.doesNotEqual,FILTER_OPERATORS.or,FILTER_OPERATORS.and,FILTER_OPERATORS.isNull,FILTER_OPERATORS.isNotNull];const NUMBER_FILTERS=[FILTER_OPERATORS.lessThan,FILTER_OPERATORS.greaterThan,FILTER_OPERATORS.equals,FILTER_OPERATORS.lessThanOrEquals,FILTER_OPERATORS.greaterThanOrEquals,FILTER_OPERATORS.doesNotEqual,FILTER_OPERATORS.isNull,FILTER_OPERATORS.isNotNull];const STRING_FILTERS=[FILTER_OPERATORS.equals,FILTER_OPERATORS.contains,FILTER_OPERATORS.doesNotEqual,FILTER_OPERATORS.isIn,FILTER_OPERATORS.isNotIn,FILTER_OPERATORS.beginsWith,FILTER_OPERATORS.endsWith,FILTER_OPERATORS.isNull,FILTER_OPERATORS.isNotNull];const DATETIME_FILTERS=[FILTER_OPERATORS.lessThan,FILTER_OPERATORS.greaterThan,FILTER_OPERATORS.equals,FILTER_OPERATORS.lessThanOrEquals,FILTER_OPERATORS.greaterThanOrEquals,FILTER_OPERATORS.doesNotEqual,FILTER_OPERATORS.isNull,FILTER_OPERATORS.isNotNull];const COLUMN_SEPARATOR_STRING="|";const TYPE_FILTERS={string:STRING_FILTERS,float:NUMBER_FILTERS,integer:NUMBER_FILTERS,boolean:BOOLEAN_FILTERS,datetime:DATETIME_FILTERS,date:DATETIME_FILTERS};
;// CONCATENATED MODULE: ../packages/perspective/src/js/config/settings.js
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
/**
 * The default settings which populate `perspective.config.js`.
 *//* harmony default export */ const settings = ({/**
     * `types` are the type-specific configuration options.  Each key is the
     * name of a perspective type; their values are configuration objects for
     * that type.
     */types:{float:{/**
             * Which filter operator should be the default when a column of this
             * type is pivotted.
             */filter_operator:"==",/**
             * Which aggregate should be the default when a column of this type
             * is pivotted.
             */aggregate:"sum",/**
             * The format object for this type.  Can be either an
             * `toLocaleString()` `options` object for this type (or supertype),
             * or a function which returns the formatted string for this type.
             */format:{style:"decimal",minimumFractionDigits:2,maximumFractionDigits:2}},string:{filter_operator:"==",aggregate:"count"},integer:{filter_operator:"==",aggregate:"sum",format:{}},boolean:{filter_operator:"==",aggregate:"count"},datetime:{filter_operator:"==",aggregate:"count",format:{dateStyle:"short",timeStyle:"medium"},null_value:-1},date:{filter_operator:"==",aggregate:"count",format:{dateStyle:"short"},null_value:-1}}});
;// CONCATENATED MODULE: ../packages/perspective/src/js/config/index.js
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
function get_types(){return Object.keys(get_config().types);}function get_type_config(type){const config={};if(get_config().types[type]){Object.assign(config,get_config().types[type]);}if(config.type){const props=get_type_config(config.type);Object.assign(props,config);return props;}else{return config;}}function isObject(item){return item&&typeof item==="object"&&!Array.isArray(item);}function mergeDeep(target,...sources){if(!sources.length)return target;const source=sources.shift();if(isObject(target)&&isObject(source)){for(const key in source){if(isObject(source[key])){if(!target[key])Object.assign(target,{[key]:{}});mergeDeep(target[key],source[key]);}else{Object.assign(target,{[key]:source[key]});}}}return mergeDeep(target,...sources);}function override_config(config){if(globalThis.__PERSPECTIVE_CONFIG__){console.warn("Config already initialized!");}globalThis.__PERSPECTIVE_CONFIG__=mergeDeep(settings,config);}function get_config(){if(!globalThis.__PERSPECTIVE_CONFIG__){globalThis.__PERSPECTIVE_CONFIG__=mergeDeep(settings,globalThis.__TEMPLATE_CONFIG__||{});}return globalThis.__PERSPECTIVE_CONFIG__;}
;// CONCATENATED MODULE: ../packages/perspective/src/js/utils.js
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
/**
 * Gets human-readable types for a column
 * @private
 * @returns {string}
 */function get_column_type(val){if(val>=1&&val<=8){return"integer";}else if(val===19){return"string";}else if(val===10||val===9){return"float";}else if(val===11){return"boolean";}else if(val===12){return"datetime";}else if(val===13){return"date";}else{console.warn(`Unknown type for value ${val} with JS type ${typeof val}`);}}/**
 * Bind all methods in a class to the class instance.  It is sad that this is
 * necessary.
 *
 * @export
 * @param {*} self
 */function bindall(self){let obj=self;do{for(const key of Object.getOwnPropertyNames(obj)){const value=self[key];if(key!=="constructor"&&typeof value==="function"){self[key]=value.bind(self);}}}while(obj=obj!==Object&&Object.getPrototypeOf(obj));}/**
 * Detect Node.js.
 *
 * Returns
 * -------
 * True if the current script is running in Node.js.
 */function detectNode(){return typeof window==="undefined";}/**
 * Detect Chrome.
 *
 * Returns
 * -------
 * Detect if the current script is running in Chrome.
 */function detectChrome(){var isChromium=window.chrome,winNav=window.navigator,vendorName=winNav.vendor,isOpera=winNav.userAgent.indexOf("OPR")>-1,isIEedge=winNav.userAgent.indexOf("Edge")>-1,isIOSChrome=winNav.userAgent.match("CriOS");if(isIOSChrome){return true;}else if(isChromium!==null&&typeof isChromium!=="undefined"&&vendorName==="Google Inc."&&isOpera===false&&isIEedge===false){return true;}else{return false;}}// https://github.com/kripken/emscripten/issues/6042
function detect_iphone(){return /iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream;}/**
 * String.includes() polyfill
 */if(!String.prototype.includes){String.prototype.includes=function(search,start){if(typeof start!=="number"){start=0;}if(start+search.length>this.length){return false;}else{return this.indexOf(search,start)!==-1;}};}// from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
if(!Array.prototype.includes){Object.defineProperty(Array.prototype,"includes",{value:function(searchElement,fromIndex){if(this==null){throw new TypeError('"this" is null or not defined');}// 1. Let O be ? ToObject(this value).
var o=Object(this);// 2. Let len be ? ToLength(? Get(O, "length")).
var len=o.length>>>0;// 3. If len is 0, return false.
if(len===0){return false;}// 4. Let n be ? ToInteger(fromIndex). (If fromIndex is undefined,
//    this step produces the value 0.)
var n=fromIndex|0;// 5. If n ≥ 0, then a. Let k be n.
// 6. Else n < 0, a. Let k be len + n. b. If k < 0, let k be 0.
var k=Math.max(n>=0?n:len-Math.abs(n),0);function sameValueZero(x,y){return x===y||typeof x==="number"&&typeof y==="number"&&isNaN(x)&&isNaN(y);}// 7. Repeat, while k < len
while(k<len){// a. Let elementK be the result of ? Get(O, ! ToString(k)). b.
// If SameValueZero(searchElement, elementK) is true, return
// true.
if(sameValueZero(o[k],searchElement)){return true;}// c. Increase k by 1.
k++;}// 8. Return false
return false;}});}
;// CONCATENATED MODULE: ../packages/perspective/src/js/data_accessor/index.js
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
class DataAccessor{constructor(){this.data_formats={row:0,column:1,schema:2};this.format=undefined;this.data=undefined;this.names=undefined;this.types=undefined;this.row_count=undefined;}is_format(data){if(Array.isArray(data)){return this.data_formats.row;}else if(Array.isArray(data[Object.keys(data)[0]])){return this.data_formats.column;}else if(typeof data[Object.keys(data)[0]]==="string"||typeof data[Object.keys(data)[0]]==="function"){return this.data_formats.schema;}else{throw`Could not determine data format for ${JSON.stringify(data)}, with JS typeof ${typeof data}`;}}count_rows(data){if(this.format===this.data_formats.row){return data.length;}else if(this.format===this.data_formats.column){return data[Object.keys(data)[0]].length;}else{return 0;}}get_format(){return this.format;}get(column_name,row_index){let value=undefined;if(this.format===this.data_formats.row){let d=this.data[row_index];if(d.hasOwnProperty(column_name)){value=d[column_name];}}else if(this.format===this.data_formats.column){if(this.data.hasOwnProperty(column_name)){value=this.data[column_name][row_index];}}else if(this.format===this.data_formats.schema){value=undefined;}else{throw`Could not get() from dataset - ${this.data} is poorly formatted.`;}return value;}marshal(column_index,row_index,type){const column_name=this.names[column_index];let val=clean_data(this.get(column_name,row_index));if(val===null){return null;}if(typeof val==="undefined"){return undefined;}switch(get_column_type(type.value)){case"float":case"integer":{val=Number(val);break;}case"boolean":{if(typeof val==="string"){val.toLowerCase()==="true"?val=true:val=false;}else{val=!!val;}break;}case"datetime":case"date":{break;}default:{val+="";// TODO this is not right - might not be a string.  Need a data cleaner
}}return val;}/**
     * Resets the internal state of the accessor, preventing collisions with
     * previously set data.
     *
     * @private
     */clean(){this.names=undefined;this.types=undefined;}/**
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
     */init(data){this.data=data;this.format=this.is_format(this.data);this.row_count=this.count_rows(this.data);const overridden_types={};if(this.format===this.data_formats.row){if(data.length>0){this.names=Object.keys(data[0]);}else{this.clean.names=[];}}else if(this.format===this.data_formats.column){this.names=Object.keys(data);}else if(this.format===this.data_formats.schema){this.names=Object.keys(data);for(const name of this.names){const new_type=get_type_config(data[name]);if(new_type.type){console.debug(`Converting "${data[name]}" to "${new_type.type}"`);overridden_types[name]=data[name];data[name]=new_type.type;}}}else{throw`Could not initialize - failed to determine format for ${data}`;}return overridden_types;}}/**
 * Coerce string null into value null.
 * @private
 * @param {*} value
 */function clean_data(value){if(value===null||value==="null"){return null;}else if(value===undefined||value==="undefined"){return undefined;}else{return value;}}
;// CONCATENATED MODULE: ../packages/perspective/src/js/emscripten.js
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
/** Translation layer Interface between C++ and JS to handle conversions/data
 * structures that were previously handled in non-portable perspective.js
 */const extract_vector=function(vector){// handles deletion already - do not call delete() on the input vector again
let extracted=[];for(let i=0;i<vector.size();i++){let item=vector.get(i);extracted.push(item);}vector.delete();return extracted;};const extract_map=function(map){// handles deletion already - do not call delete() on the input map again
let extracted={};let keys=map.keys();for(let i=0;i<keys.size();i++){let key=keys.get(i);extracted[key]=map.get(key);}map.delete();keys.delete();return extracted;};/**
 * Given a C++ vector constructed in Emscripten, fill it with data. Assume that
 * data types are already validated, thus Emscripten will throw an error if the
 * vector is filled with the wrong type of data.
 *
 * @param {*} vector the `std::vector` to be filled
 * @param {Array} arr the `Array` from which to draw data
 *
 * @private
 */const fill_vector=function(vector,arr){for(const elem of arr){vector.push_back(elem);}return vector;};
;// CONCATENATED MODULE: ../packages/perspective/src/js/api/server.js
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
function error_to_json(error){const obj={};if(typeof error!=="string"){Object.getOwnPropertyNames(error).forEach(key=>{obj[key]=error[key];},error);}else{obj["message"]=error;}return obj;}/**
 * The base class for Perspective's async API. It initializes and keeps track of
 * tables, views, and processes messages from the user into the Perspective
 * engine.
 *
 * Child classes must implement the `post()` interface, which defines how the
 * server sends messages to the client. The implementation of `Server` for
 * Web Workers can be found in `perspective.js`, and an implementation for
 * Node.JS can be found in `perspective.node.js`.
 */class Server{constructor(perspective){this.perspective=perspective;this._tables={};this._views={};this._callback_cache=new Map();}/**
     * Return an initialization message to the client for confirmation.
     * `Server` must be extended and the `post` method implemented before the
     * server can successfully be initialized.
     */init(msg){if(msg.config){override_config(msg.config);}// The client will wait for a response message on table() and
// view(). If this flag is not set, the table() and view()
// constructors will resolve automatically and errors from the
// server will not be caught in those constructors. This allows
// for backwards compatibility between newer frontends (those
// with async table/view constructors) and older servers (which
// do not send the response message to the client).
msg.data=["wait_for_response"];this.post(msg);}/**
     * Send a message from the Perspective server to the Perspective client -
     * this method must be implemented before the server can be used.
     *
     * @param {Object} msg a message to be sent to the client.
     */post(msg){throw new Error(`Posting ${msg} failed - post() not implemented!`);}/**
     * Given a message, execute its instructions. This method is the dispatcher
     * for all Perspective actions, including table/view creation, deletion, and
     * all method calls to/from the table and view.
     *
     * @param {*} msg an Object containing `cmd` (a String instruction) and
     * associated data for that instruction
     * @param {*} client_id
     */process(msg,client_id){switch(msg.cmd){case"init_profile_thread":this.perspective.initialize_profile_thread();break;case"get_hosted_table_names":this.post({id:msg.id,data:Object.keys(this._tables)});break;case"memory_usage":this.post({id:msg.id,data:this.perspective.memory_usage()});break;case"init":this.init(msg);break;case"table":if(typeof msg.args[0]==="undefined"){// Cache messages for when a table is created but not fully
// initialized, i.e. in the case when a table is created
// from a view, as the view needs to be serialized to an
// arrow before the table will be ready.
this._tables[msg.name]=[];}else{try{const msgs=this._tables[msg.name];const table=this.perspective.table(msg.args[0],msg.options);// When using the Node server, the `table()` constructor
// returns a Promise, but in the Web Worker version,
// table() synchronously returns an instance of a Table.
if(table&&table.then){table.then(table=>{this._tables[msg.name]=table;// Process cached messages for this table.
if(msgs){for(const msg of msgs){this.process(msg);}}// Resolve the promise to return a Table.
this.post({id:msg.id,data:msg.name});}).catch(error=>this.process_error(msg,error));}else{this._tables[msg.name]=table;// Process cached messages for this table.
if(msgs){for(const msg of msgs){this.process(msg);}}// Resolve the promise to return a Table.
this.post({id:msg.id,data:msg.name});}}catch(error){this.process_error(msg,error);return;}}break;case"table_generate":let g=(0,eval)(msg.args);g(function(tbl){this._tables[msg.name]=tbl;this.post({id:msg.id,data:"created!"});});break;case"table_execute":let f=(0,eval)(msg.f);f(this._tables[msg.name]);break;case"table_method":case"view_method":this.process_method_call(msg);break;case"view":const tableMsgQueue=this._tables[msg.table_name];if(tableMsgQueue&&Array.isArray(tableMsgQueue)){// If the table is not initialized, defer this message for
// until after the table is initialized, and create a new
// message queue for the uninitialized view.
tableMsgQueue.push(msg);this._views[msg.view_name]=[];}else{// Create a new view and resolve the Promise on the client
// with the name of the view, which the client will use to
// construct a new view proxy.
try{const msgs=this._views[msg.view_name];// When using the Node server, the `view()` constructor
// returns a Promise, but in the Web Worker version,
// view() synchronously returns an instance of a View.
const view=this._tables[msg.table_name].view(msg.config);if(view&&view.then){view.then(view=>{this._views[msg.view_name]=view;this._views[msg.view_name].client_id=client_id;// Process cached messages for the view.
if(msgs){for(const msg of msgs){this.process(msg);}}this.post({id:msg.id,data:msg.view_name});}).catch(error=>this.process_error(msg,error));}else{this._views[msg.view_name]=view;this._views[msg.view_name].client_id=client_id;// Process cached messages for the view.
if(msgs){for(const msg of msgs){this.process(msg);}}this.post({id:msg.id,data:msg.view_name});}}catch(error){this.process_error(msg,error);return;}}break;}}/**
     * Execute a subscription to a Perspective event, such as `on_update` or
     * `on_delete`.
     */process_subscribe(msg,obj){try{let callback;if(msg.method.slice(0,2)==="on"){callback=ev=>{let result={id:msg.id,data:ev};try{// post transferable data for arrow
if(msg.args&&msg.args[0]){if(msg.method==="on_update"&&msg.args[0]["mode"]==="row"){// actual arrow is in the `delta`
this.post(result,[ev.delta]);return;}}this.post(result);}catch(e){console.error(`Removing failed callback to \`${msg.method}()\` (presumably due to failed connection)`);const remove_method=msg.method.substring(3);obj[`remove_${remove_method}`](callback);}};if(msg.callback_id){this._callback_cache.set(msg.callback_id,callback);}}else if(msg.callback_id){callback=this._callback_cache.get(msg.callback_id);this._callback_cache.delete(msg.callback_id);}if(callback){obj[msg.method](callback,...msg.args);}else{console.error(`Callback not found for remote call "${JSON.stringify(msg)}"`);}}catch(error){this.process_error(msg,error);return;}}/**
     * Given a message that calls a table or view method, call the method and
     * return the result to the client, or return an error message to the
     * client.
     *
     * @param {Object} msg
     */process_method_call(msg){let obj,result;const name=msg.view_name||msg.name;msg.cmd==="table_method"?obj=this._tables[name]:obj=this._views[name];if(!obj&&msg.cmd==="view_method"){// cannot have a host without a table, but can have a host without a
// view
this.process_error(msg,{message:"View method cancelled"});return;}if(obj&&obj.push){obj.push(msg);return;}try{if(msg.subscribe){this.process_subscribe(msg,obj);return;}else{result=obj[msg.method].apply(obj,msg.args);if(result instanceof Promise){result.then(result=>this.process_method_call_response(msg,result)).catch(error=>this.process_error(msg,error));}else{this.process_method_call_response(msg,result);}}}catch(error){this.process_error(msg,error);return;}}/**
     * Send the response from a method call back to the client, using
     * transferables if the response is an Arrow binary.
     * @param {Object} msg
     * @param {*} result
     */process_method_call_response(msg,result){if(msg.method==="delete"){delete this._views[msg.name];}if(msg.method==="to_arrow"){this.post({id:msg.id,data:result},[result]);}else{this.post({id:msg.id,data:result});}}/**
     * Send an error to the client. If this method fails, we need to consume it
     * as this method is frequently called itself from a `catch` block.
     */process_error(msg,error){try{this.post({id:msg.id,error:error_to_json(error)});}catch(e){console.error("Error handler failed: {}",error);}}/**
     * Garbage collect un-needed views.
     */clear_views(client_id){for(let key of Object.keys(this._views)){if(this._views[key].client_id===client_id){try{this._views[key].delete();}catch(e){console.error(e);}delete this._views[key];}}console.debug(`GC ${Object.keys(this._views).length} views in memory`);}}
;// CONCATENATED MODULE: ../packages/perspective/src/js/perspective.js
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
if(typeof self!=="undefined"&&self.performance===undefined){self.performance={now:Date.now};}const WARNED_KEYS=new Set();/**
 * The main API module for `@finos/perspective`.
 *
 * For more information, see the
 * [Javascript user guide](https://perspective.finos.org/docs/js.html).
 *
 * @module perspective
 *//* harmony default export */ function perspective(Module){let __MODULE__=Module;let accessor=new DataAccessor();const SIDES=["zero","one","two"];/***************************************************************************
     *
     * Private
     *
     */let _POOL_DEBOUNCES={};function _set_process(pool,table_id){if(!_POOL_DEBOUNCES[table_id]){_POOL_DEBOUNCES[table_id]=pool;setTimeout(()=>_call_process(table_id));}else{pool.delete();}}function _call_process(table_id){const pool=_POOL_DEBOUNCES[table_id];if(pool){pool._process();_remove_process(table_id);}}function _remove_process(table_id){_POOL_DEBOUNCES[table_id]?.delete();delete _POOL_DEBOUNCES[table_id];}function memory_usage(){const mem=performance.memory?JSON.parse(JSON.stringify(performance.memory,["totalJSHeapSize","usedJSHeapSize","jsHeapSizeLimit"])):process.memoryUsage();mem.wasmHeap=__MODULE__.HEAP8.length;return mem;}/**
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
     */function make_table(accessor,_Table,index,limit,op,is_update,is_arrow,is_csv,port_id){// C++ constructor cannot take null values - use default values if
// index or limit are null.
if(!index){index="";}if(!limit){limit=4294967295;}_Table=__MODULE__.make_table(_Table,accessor,limit,index,op,is_update,is_arrow,is_csv,port_id);const pool=_Table.get_pool();const table_id=_Table.get_id();if(is_update||op==__MODULE__.t_op.OP_DELETE){_set_process(pool,table_id);}else{pool._process();pool.delete();}return _Table;}/***************************************************************************
     *
     * View
     *
     */ /**
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
     * await table.view({group_by: ["name"]});
     *
     * @class
     * @hideconstructor
     */function view(table,sides,config,view_config,name){this.name=name;this._View=undefined;this.table=table;this.config=config||{};this.view_config=view_config||new view_config();this.is_unit_context=this.table.index===""&&sides===0&&this.view_config.group_by.length===0&&this.view_config.split_by.length===0&&this.view_config.filter.length===0&&this.view_config.sort.length===0&&this.view_config.expressions.length===0;if(this.is_unit_context){this._View=__MODULE__.make_view_unit(table._Table,name,COLUMN_SEPARATOR_STRING,this.view_config,null);}else if(sides===0){this._View=__MODULE__.make_view_zero(table._Table,name,COLUMN_SEPARATOR_STRING,this.view_config,null);}else if(sides===1){this._View=__MODULE__.make_view_one(table._Table,name,COLUMN_SEPARATOR_STRING,this.view_config,null);}else if(sides===2){this._View=__MODULE__.make_view_two(table._Table,name,COLUMN_SEPARATOR_STRING,this.view_config,null);}this.ctx=this._View.get_context();this.column_only=this._View.is_column_only();this.update_callbacks=this.table.update_callbacks;this.overridden_types=this.table.overridden_types;this._delete_callbacks=[];bindall(this);}/**
     * A copy of the config object passed to the {@link table#view} method which
     * created this {@link module:perspective~view}.
     *
     * @returns {Promise<object>} Shared the same key/values properties as
     * {@link module:perspective~view}
     */view.prototype.get_config=function(){return JSON.parse(JSON.stringify(this.config));};/**
     * Delete this {@link module:perspective~view} and clean up all resources
     * associated with it. View objects do not stop consuming resources or
     * processing updates when they are garbage collected - you must call this
     * method to reclaim these.
     *
     * @async
     */view.prototype.delete=function(){_remove_process(this.table.get_id());this._View.delete();this.ctx.delete();this.table.views.splice(this.table.views.indexOf(this),1);this.table=undefined;let i=0,j=0;// Remove old update callbacks from the Table.
while(i<this.update_callbacks.length){let val=this.update_callbacks[i];if(val.view!==this)this.update_callbacks[j++]=val;i++;}this.update_callbacks.length=j;this._delete_callbacks.forEach(cb=>cb());};/**
     * How many pivoted sides does this {@link module:perspective~view} have?
     *
     * @private
     * @returns {number} sides The number of sides of this
     * {@link module:perspective~view}.
     */view.prototype.sides=function(){return this._View.sides();};/**
     * Counts hidden columns in the {@link module:perspective~view}. A hidden
     * column is a column used as a sort column, but not shown in the view.
     *
     * @private
     * @returns {number} sides The number of hidden columns in this
     * {@link module:perspective~view}.
     */view.prototype._num_hidden=function(){// Count hidden columns.
let hidden=0;for(const sort of this.config.sort){if(this.config.columns.indexOf(sort[0])===-1){hidden++;}}return hidden;};function col_path_vector_to_string(vector){let extracted=[];for(let i=0;i<vector.size();i++){let s=vector.get(i);extracted.push(__MODULE__.scalar_to_val(s,false,true));s.delete();}vector.delete();return extracted;}const extract_vector_scalar=function(vector){// handles deletion already - do not call delete() on the input vector
// again
let extracted=[];for(let i=0;i<vector.size();i++){let item=vector.get(i);extracted.push(col_path_vector_to_string(item));}vector.delete();return extracted;};const extract_vector_string=function(vector){// handles deletion already - do not call delete() on the input vector
// again
let extracted=[];for(let i=0;i<vector.size();i++){let item=vector.get(i);let row=[];for(let i=0;i<item.size();i++){let s=item.get(i);row.push(s);}item.delete();extracted.push(row);}vector.delete();return extracted;};/**
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
     */view.prototype.schema=function(override=true){const schema=extract_map(this._View.schema());if(override){for(const key of Object.keys(schema)){let colname=key.split(COLUMN_SEPARATOR_STRING);colname=colname[colname.length-1];if(this.overridden_types[colname]&&get_type_config(this.overridden_types[colname]).type===schema[key]){schema[key]=this.overridden_types[colname];}}}return schema;};/**
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
     *      expressions: {'"x" + "y" - 100': '"x" + "y" - 100'}
     * });
     *
     * await view.expression_schema(); // {'"x" + "y" - 100': "float"}
     *
     * @async
     *
     * @returns {Promise<Object>} A Promise of this
     * {@link module:perspective~view}'s expression schema.
     */view.prototype.expression_schema=function(override=true){const schema=extract_map(this._View.expression_schema());if(override){for(const key of Object.keys(schema)){let colname=key.split(COLUMN_SEPARATOR_STRING);colname=colname[colname.length-1];if(this.overridden_types[colname]&&get_type_config(this.overridden_types[colname]).type===schema[key]){schema[key]=this.overridden_types[colname];}}}return schema;};view.prototype._column_names=function(skip=false,depth=0){return extract_vector_scalar(this._View.column_names(skip,depth)).map(x=>x.join(COLUMN_SEPARATOR_STRING));};/**
     * Returns an array of strings containing the column paths of the View
     * without any of the source columns.
     *
     * A column path shows the columns that a given cell belongs to after pivots
     * are applied.
     *
     * @returns {Array<String>} an Array of Strings containing the column paths.
     */view.prototype.column_paths=function(){return extract_vector_string(this._View.column_paths()).map(x=>x.join(COLUMN_SEPARATOR_STRING));};view.prototype.get_data_slice=function(start_row,end_row,start_col,end_col){if(this.is_unit_context){return __MODULE__.get_data_slice_unit(this._View,start_row,end_row,start_col,end_col);}else{const num_sides=this.sides();const nidx=SIDES[num_sides];return __MODULE__[`get_data_slice_${nidx}`](this._View,start_row,end_row,start_col,end_col);}};/**
     * Given an `options` Object, calculate the correct start/end rows and
     * columns, as well as other metadata required by the data formatter.
     *
     * @private
     * @param {Object} options User-provided options for `to_format`.
     * @returns {Object} an Object containing the parsed options.
     */const _parse_format_options=function(options){options=options||{};const max_cols=this._View.num_columns()+(this.sides()===0?0:1);const max_rows=this._View.num_rows();const hidden=this._num_hidden();const psp_offset=this.sides()>0||this.column_only?1:0;const viewport=this.config.viewport?this.config.viewport:{};const start_row=options.start_row||(viewport.top?viewport.top:0);const end_row=Math.min(max_rows,options.end_row!==undefined?options.end_row:viewport.height?start_row+viewport.height:max_rows);const start_col=options.start_col||(viewport.left?viewport.left:0);const end_col=Math.min(max_cols,(options.end_col!==undefined?options.end_col+psp_offset:viewport.width?start_col+viewport.width:max_cols)*(hidden+1));// Return the calculated values
options.start_row=Math.floor(start_row);options.end_row=Math.ceil(end_row);options.start_col=Math.floor(start_col);options.end_col=Math.ceil(end_col);return options;};/**
     * Calculates the [min, max] of the leaf nodes of a column `colname`.
     *
     * @param {String} colname A column name in this `View`.
     * @returns {Array<Object>} A tuple of [min, max], whose types are column
     * and aggregate dependent.
     */view.prototype.get_min_max=function(colname){if(this.is_unit_context){return __MODULE__.get_min_max_unit(this._View,colname);}else{const num_sides=this.sides();const nidx=SIDES[num_sides];return __MODULE__[`get_min_max_${nidx}`](this._View,colname);}};/**
     * Generic base function for returning serialized data for a single column.
     *
     * @private
     */const column_to_format=function(col_name,options,format_function){const num_rows=this.num_rows();const start_row=options.start_row||0;const end_row=options.end_row||num_rows;const names=this._column_names();let idx=names.indexOf(col_name);if(idx===-1){return undefined;}// mutate the column index if necessary: in pivoted views, columns start
// at 1
const num_sides=this.sides();if(num_sides>0){idx++;}// use a specified data slice, if provided
let slice,data_slice;if(!options.data_slice){data_slice=this.get_data_slice(start_row,end_row,idx,idx+1);slice=data_slice.get_slice();}else{slice=options.data_slice.get_column_slice(idx);}const dtype=this._View.get_column_dtype(idx);const rst=format_function(slice,dtype,idx);slice.delete();if(data_slice){data_slice.delete();}return rst;};/**
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
     * {@link module:perspective~view} had a "group_by" config parameter
     * supplied when constructed, each row Object will have a "__ROW_PATH__"
     * key, whose value specifies this row's aggregated path.  If this
     * {@link module:perspective~view} had a "split_by" config parameter
     * supplied, the keys of this object will be comma-prepended with their
     * comma-separated column paths.
     */view.prototype.to_columns=function(options){return JSON.parse(this.to_columns_string(options));};/**
     *  Serializes this view to a string of JSON data. Useful if you want to
     *  save additional round trip serialize/deserialize cycles.
     */view.prototype.to_columns_string=function(options){_call_process(this.table.get_id());options=_parse_format_options.bind(this)(options);const start_row=options.start_row;const end_row=options.end_row;const start_col=options.start_col;const end_col=options.end_col;const hidden=this._num_hidden();const is_formatted=options.formatted;const get_pkeys=!!options.index;const get_ids=!!options.id;const leaves_only=!!options.leaves_only;const num_sides=this.sides();const has_row_path=num_sides!==0&&!this.column_only;const nidx=SIDES[num_sides];const config=this.get_config();const columns_length=config.columns.length;const group_by_length=config.group_by.length;return this._View.to_columns(start_row,end_row,start_col,end_col,hidden,is_formatted,get_pkeys,get_ids,leaves_only,num_sides,has_row_path,nidx,columns_length,group_by_length);};/**
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
     * {@link module:perspective~view} had a "group_by" config parameter
     * supplied when constructed, each row Object will have a "__ROW_PATH__"
     * key, whose value specifies this row's aggregated path.  If this
     * {@link module:perspective~view} had a "split_by" config parameter
     * supplied, the keys of this object will be comma-prepended with their
     * comma-separated column paths.
     */view.prototype.to_json=function(options){const cols=this.to_columns(options);const colnames=Object.keys(cols);const first_col=cols[colnames[0]]||[];return first_col.map((_,idx)=>{const obj={};for(const key of colnames){obj[key]=cols[key][idx];}return obj;});};/**
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
     * {@link module:perspective~view} had a "group_by" config parameter
     * supplied when constructed, each row will have prepended those values
     * specified by this row's aggregated path.  If this
     * {@link module:perspective~view} had a "split_by" config parameter
     * supplied, the keys of this object will be comma-prepended with their
     * comma-separated column paths.
     */view.prototype.to_csv=function(options){_call_process(this.table.get_id());options=_parse_format_options.bind(this)(options);const start_row=options.start_row;const end_row=options.end_row;const start_col=options.start_col;const end_col=options.end_col;const sides=this.sides();if(this.is_unit_context){return __MODULE__.to_csv_unit(this._View,start_row,end_row,start_col,end_col);}else if(sides===0){return __MODULE__.to_csv_zero(this._View,start_row,end_row,start_col,end_col);}else if(sides===1){return __MODULE__.to_csv_one(this._View,start_row,end_row,start_col,end_col);}else if(sides===2){return __MODULE__.to_csv_two(this._View,start_row,end_row,start_col,end_col);}};/**
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
     */view.prototype.col_to_js_typed_array=function(col_name,options={}){_call_process(this.table.get_id());const format_function=__MODULE__[`col_to_js_typed_array`];return column_to_format.call(this,col_name,options,format_function);};/**
     * Serializes a view to the Apache Arrow data format.
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
     * @param {number} options.compression The compression codec to use. Can be
     * `null` or `"lz4"` (default).
     * @returns {Promise<ArrayBuffer>} An `ArrayBuffer` in the Apache Arrow
     * format containing data from the view.
     */view.prototype.to_arrow=function(options={}){_call_process(this.table.get_id());options=_parse_format_options.bind(this)(options);const start_row=options.start_row;const end_row=options.end_row;const start_col=options.start_col;const end_col=options.end_col;const sides=this.sides();const compression="compression"in options?options.compression==="lz4":true;if(this.is_unit_context){return __MODULE__.to_arrow_unit(this._View,start_row,end_row,start_col,end_col,compression);}else if(sides===0){return __MODULE__.to_arrow_zero(this._View,start_row,end_row,start_col,end_col,compression);}else if(sides===1){return __MODULE__.to_arrow_one(this._View,start_row,end_row,start_col,end_col,compression);}else if(sides===2){return __MODULE__.to_arrow_two(this._View,start_row,end_row,start_col,end_col,compression);}};/**
     * The number of aggregated rows in this {@link module:perspective~view}.
     * This is affected by the "group_by" configuration parameter supplied to
     * this {@link module:perspective~view}'s contructor.
     *
     * @async
     *
     * @returns {Promise<number>} The number of aggregated rows.
     */view.prototype.num_rows=function(){_call_process(this.table.get_id());return this._View.num_rows();};/**
     * The number of aggregated columns in this {@link view}.  This is affected
     * by the "split_by" configuration parameter supplied to this
     * {@link view}'s contructor.
     *
     * @async
     *
     * @returns {Promise<number>} The number of aggregated columns.
     */view.prototype.num_columns=function(){const ncols=this._View.num_columns();const nhidden=this._num_hidden();return ncols-ncols/(this.config.columns.length+nhidden)*nhidden;};view.prototype.dimensions=function(){return{num_table_rows:this.table.num_rows(),num_table_columns:this.table.num_columns(),num_view_rows:this._View.num_rows(),num_view_columns:this.num_columns()};};/**
     * Whether this row at index `idx` is in an expanded or collapsed state.
     *
     * @async
     *
     * @returns {Promise<bool>} Whether this row is expanded.
     */view.prototype.get_row_expanded=function(idx){return this._View.get_row_expanded(idx);};/**
     * Expands the row at index `idx`.
     *
     * @async
     *
     * @returns {Promise<void>}
     */view.prototype.expand=function(idx){return this._View.expand(idx,this.config.group_by.length);};/**
     * Collapses the row at index `idx`.
     *
     * @async
     *
     * @returns {Promise<void>}
     */view.prototype.collapse=function(idx){return this._View.collapse(idx);};/**
     * Set expansion `depth` of the pivot tree.
     *
     */view.prototype.set_depth=function(depth){return this._View.set_depth(depth,this.config.group_by.length);};/**
     * Returns the data of all changed rows in JSON format, or for 1+ sided
     * contexts the entire dataset of the view.
     * @private
     */view.prototype._get_step_delta=async function(){let delta=this._View.get_step_delta(0,2147483647);let data;if(delta.cells.size()===0){// FIXME This is currently not implemented for 1+ sided contexts.
data=this.to_json();}else{let rows={};for(let x=0;x<delta.cells.size();x++){rows[delta.cells.get(x).row]=true;}rows=Object.keys(rows);const results=rows.map(row=>this.to_json({start_row:Number.parseInt(row),end_row:Number.parseInt(row)+1}));data=[].concat.apply([],results);}delta.cells.delete();return data;};/**
     * Returns an Arrow-serialized dataset that contains the data from updated
     * rows. Do not call this function directly, instead use the
     * {@link module:perspective~view}'s `on_update` method with `{mode: "row"}`
     * in order to access the row deltas.
     *
     * @private
     */view.prototype._get_row_delta=async function(){if(this.is_unit_context){return __MODULE__.get_row_delta_unit(this._View);}else{const sides=this.sides();const nidx=SIDES[sides];return __MODULE__[`get_row_delta_${nidx}`](this._View);}};/**
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
     */view.prototype.on_update=function(callback,{mode="none"}={}){_call_process(this.table.get_id());if(["none","row"].indexOf(mode)===-1){throw new Error(`Invalid update mode "${mode}" - valid modes are "none" and "row".`);}if(mode==="row"){// Enable deltas only if needed by callback
if(!this._View._get_deltas_enabled()){this._View._set_deltas_enabled(true);}}this.update_callbacks.push({view:this,orig_callback:callback,callback:async(port_id,cache)=>{// Cache prevents repeated calls to expensive delta functions
// for on_update callbacks triggered sequentially from the same
// update delta.
if(cache[port_id]===undefined){cache[port_id]={};}let updated={port_id};if(mode==="row"){if(cache[port_id]["row_delta"]===undefined){cache[port_id]["row_delta"]=await this._get_row_delta();}updated.delta=cache[port_id]["row_delta"];}// Call the callback with the updated object containing
// `port_id` and `delta`.
callback(updated);}});};function filterInPlace(a,condition){let i=0,j=0;while(i<a.length){const val=a[i];if(condition(val,i,a))a[j++]=val;i++;}a.length=j;return a;}/*
     * Unregister a previously registered update callback with this
     * {@link module:perspective~view}.
     *
     * @example
     * // remove an `on_update` callback
     * const callback = updated => console.log(updated);
     * view.remove_update(callback);
     *
     * @param {function} callback A update callback function to be removed
     */view.prototype.remove_update=function(callback){_call_process(this.table.get_id());const total=this.update_callbacks.length;filterInPlace(this.update_callbacks,x=>x.orig_callback!==callback);console.assert(total>this.update_callbacks.length,`"callback" does not match a registered updater`);};/**
     * Register a callback with this {@link module:perspective~view}.  Whenever
     * the {@link module:perspective~view} is deleted, this callback will be
     * invoked.
     *
     * @example
     * // attach an `on_delete` callback
     * view.on_delete(() => console.log("Deleted!"));
     *
     * @param {function} callback A callback function invoked on delete.
     */view.prototype.on_delete=function(callback){this._delete_callbacks.push(callback);};/**
     * Unregister a previously registered delete callback with this
     * {@link module:perspective~view}.
     *
     * @example
     * // remove an `on_delete` callback
     * const callback = () => console.log("Deleted!")
     * view.remove_delete(callback);
     *
     * @param {function} callback A delete callback function to be removed
     */view.prototype.remove_delete=function(callback){const initial_length=this._delete_callbacks.length;filterInPlace(this._delete_callbacks,cb=>cb!==callback);console.assert(initial_length>this._delete_callbacks.length,`"callback" does not match a registered delete callbacks`);};/**
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
     */function view_config(config){this.group_by=config.group_by||[];this.split_by=config.split_by||[];this.aggregates=config.aggregates||{};this.columns=config.columns;this.filter=config.filter||[];this.sort=config.sort||[];this.expressions=config.expressions||[];this.filter_op=config.filter_op||"and";this.group_by_depth=config.group_by_depth;this.split_by_depth=config.split_by_depth;}/**
     * Transform configuration items into `std::vector` objects for interface
     * with C++. `this.aggregates` is not transformed into a C++ map, as the use
     * of `ordered_map` in the engine makes binding more difficult.
     *
     * @private
     */view_config.prototype.get_group_by=function(){let vector=__MODULE__.make_string_vector();return fill_vector(vector,this.group_by);};view_config.prototype.get_split_by=function(){let vector=__MODULE__.make_string_vector();return fill_vector(vector,this.split_by);};view_config.prototype.get_columns=function(){let vector=__MODULE__.make_string_vector();return fill_vector(vector,this.columns);};view_config.prototype.get_filter=function(){let vector=__MODULE__.make_2d_val_vector();for(let filter of this.filter){let filter_vector=__MODULE__.make_val_vector();let filled=fill_vector(filter_vector,filter);vector.push_back(filled);}return vector;};view_config.prototype.get_sort=function(){let vector=__MODULE__.make_2d_string_vector();for(let sort of this.sort){let sort_vector=__MODULE__.make_string_vector();let filled=fill_vector(sort_vector,sort);vector.push_back(filled);}return vector;};view_config.prototype.get_expressions=function(){let vector=__MODULE__.make_2d_val_vector();for(let expression of this.expressions){let inner=__MODULE__.make_val_vector();for(let val of expression){inner.push_back(val);}vector.push_back(inner);}return vector;};/***************************************************************************
     *
     * Table
     *
     */ /**
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
     */function table(_Table,index,limit,overridden_types){this._Table=_Table;const gnode=this._Table.get_gnode();this.gnode_id=gnode.get_id();gnode.delete();const pool=this._Table.get_pool();pool.set_update_delegate(this);pool.delete();this.name=Math.random()+"";this.initialized=false;this.index=index;this.limit=limit;this.update_callbacks=[];this._delete_callbacks=[];this.views=[];this.overridden_types=overridden_types;bindall(this);}table.prototype.get_id=function(){return this._Table.get_id();};table.prototype.get_pool=function(){return this._Table.get_pool();};table.prototype.make_port=function(){return this._Table.make_port();};table.prototype.remove_port=function(){this._Table.remove_port();};table.prototype._update_callback=function(port_id){let cache={};for(let e in this.update_callbacks){this.update_callbacks[e].callback(port_id,cache);}};/**
     * Returns the user-specified index column for this
     * {@link module:perspective~table} or null if an index is not set.
     */table.prototype.get_index=function(){return this.index;};/**
     * Returns the user-specified limit column for this
     * {@link module:perspective~table} or null if an limit is not set.
     */table.prototype.get_limit=function(){return this.limit;};/**
     * Remove all rows in this {@link module:perspective~table} while preserving
     * the schema and construction options.
     */table.prototype.clear=function(){_call_process(this.get_id());this._Table.reset_gnode(this.gnode_id);};/**
     * @returns The number of views associated to this table.
     *          Note that this may be more than what is visible on a screen.
     *          As views are created to manage various internal
     *          state of the application.
     */table.prototype.get_num_views=function(){return this.views.length;};/**
     * Replace all rows in this {@link module:perspective~table} the input data.
     */table.prototype.replace=function(data){_remove_process(this.get_id());this._Table.reset_gnode(this.gnode_id);this.update(data);_call_process(this.get_id());};/**
     * Delete this {@link module:perspective~table} and clean up all resources
     * associated with it. Table objects do not stop consuming resources or
     * processing updates when they are garbage collected - you must call this
     * method to reclaim these.
     */table.prototype.delete=function(){if(this.views.length>0){throw`Cannot delete Table as it still has ${this.views.length} registered View(s).`;}_remove_process(this.get_id());this._Table.unregister_gnode(this.gnode_id);this._Table.delete();// Call delete callbacks
for(const callback of this._delete_callbacks){callback();}};/**
     * Register a callback with this {@link module:perspective~table}.  Whenever
     * the {@link module:perspective~table} is deleted, this callback will be
     * invoked.
     *
     * @param {function} callback A callback function with no parameters
     *      that will be invoked on `delete()`.
     */table.prototype.on_delete=function(callback){this._delete_callbacks.push(callback);};/**
     * Unregister a previously registered delete callback with this
     * {@link module:perspective~table}.
     *
     * @param {function} callback A delete callback function to be removed
     */table.prototype.remove_delete=function(callback){const initial_length=this._delete_callbacks.length;filterInPlace(this._delete_callbacks,cb=>cb!==callback);console.assert(initial_length>this._delete_callbacks.length,`"callback" does not match a registered delete callbacks`);};/**
     * The number of accumulated rows in this {@link module:perspective~table}.
     * This is affected by the "index" configuration parameter supplied to this
     * {@link module:perspective~view}'s contructor - as rows will be
     * overwritten when they share an idnex column.
     *
     * @async
     *
     * @returns {Promise<number>} The number of accumulated rows.
     */table.prototype.size=function(){_call_process(this._Table.get_id());return this._Table.size();};table.prototype.num_rows=function(){return this.size();};table.prototype.num_columns=function(){let schema=this._Table.get_schema();let columns=schema.columns();const size=columns.size();columns.delete();schema.delete();return size-1;};/**
     * The schema of this {@link module:perspective~table}.  A schema is an
     * Object whose keys are the columns of this
     * {@link module:perspective~table}, and whose values are their string type
     * names.
     *
     * @async
     * @returns {Promise<Object>} A Promise of this
     * {@link module:perspective~table}'s schema.
     */table.prototype.schema=function(override=true){let schema=this._Table.get_schema();let columns=schema.columns();let types=schema.types();let new_schema={};for(let key=0;key<columns.size();key++){const name=columns.get(key);if(name==="psp_okey"){continue;}if(override&&this.overridden_types[name]){new_schema[name]=this.overridden_types[name];}else{new_schema[name]=get_column_type(types.get(key).value);}}schema.delete();columns.delete();types.delete();return new_schema;};/**
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
     * @param {Object | Array<string>} expressions
     */function parse_expression_strings(expressions){let validated_expressions=[];const expression_idx_map={};const is_new_format=!Array.isArray(expressions);for(let expression of is_new_format?Object.keys(expressions):expressions){const name=expression;if(is_new_format){expression=expressions[expression];}// Map of column names to column IDs, so that we generate
// column IDs correctly without collision.
let column_name_map={};// Map of column IDs to column names, so the engine can look
// up the right column internally without more transforms.
let column_id_map={};let running_cidx=0;// First, look for a column alias, which is a // style comment
// on the first line of the expression.
let expression_alias;if(is_new_format){expression_alias=name;}else{let alias_match=expression.match(/^\/\/(?<alias>.+?)\n/);if(alias_match?.groups?.alias){expression_alias=alias_match.groups.alias.trim();}// If an alias does not exist, the alias is the expression itself.
if(!expression_alias||expression_alias.length==0){expression_alias=expression;}}// Replace `true` and `false` reserved words with symbols
let parsed_expression_string=expression.replace(/([a-zA-Z_]+[a-zA-Z0-9_]*)/g,match=>{if(match=="true"){return"True";}else if(match=="false"){return"False";}else{return match;}});parsed_expression_string=parsed_expression_string.replace(/\"(.*?[^\\])\"/g,(_,cname)=>{// If the column name contains escaped double quotes, replace
// them and assume that they escape one double quote. If there
// are multiple double quotes being escaped, i.e. \""...well?
cname=cname.replace(/\\"/g,'"');if(column_name_map[cname]===undefined){let column_id=`COLUMN${running_cidx}`;column_name_map[cname]=column_id;column_id_map[column_id]=cname;}running_cidx++;return column_name_map[cname];});// Replace single quote string literals and wrap them in a call to
// intern() which makes sure they don't leak
parsed_expression_string=parsed_expression_string.replace(/'(.*?[^\\])'/g,match=>`intern(${match})`);const replace_interned_param=(match,_,intern_fn,value)=>{// Takes a string of the form fn(x, intern('y'))
// and removes intern() to create fn(x, 'y')
const intern_idx=match.indexOf(intern_fn);return`${match.substring(0,intern_idx)}'${value}'${match.substring(intern_idx+intern_fn.length)}`;};// Replace intern() for bucket and regex functions that take
// a string literal parameter and does not work if that param is
// interned. TODO: this is clumsy and we should have a better
// way of handling it.
// TODO I concur  -- texodus
parsed_expression_string=parsed_expression_string.replace(/(bucket|match|match_all|search|indexof)\(.*?,\s*(intern\(\'(.+)\'\)).*\)/g,replace_interned_param);// replace and replace_all have multiple string params, only one of
// which needs to be interned - the regex differs from the one
// above as it asserts the middle parameter is the one to be
// replaced.
parsed_expression_string=parsed_expression_string.replace(/(replace_all|replace)\(.*?,\s*(intern\(\'(.*)\'\)),.*\)/g,replace_interned_param);const validated=[expression_alias,expression,parsed_expression_string,column_id_map];// Check if this expression is already in the array, if so then
// we need to replace the expression so the last expression tagged
// with the alias is the one that is applied to the engine.
if(expression_idx_map[expression_alias]!==undefined){const idx=expression_idx_map[expression_alias];validated_expressions[idx]=validated;}else{validated_expressions.push(validated);expression_idx_map[expression_alias]=validated_expressions.length-1;}}return validated_expressions;}/**
     * Given an array of expressions, return an object containing `expressions`,
     * which map expression aliases to data types, and `errors`, which
     * maps expression aliases to error messages. If an expression that was
     * passed in is not in `expressions`, it is guaranteed to be in `errors`.
     *
     * @async
     * @param {Object} expressions A dictionary of name/expressions to
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
     * // {
     * //   "invalid": {column: 0, line: 0, error_message: "unknown token!"},
     * //   "1 + 'string'": {column: 0, line: 0, error_message: "Type Error"}
     * // }
     * console.log(results.errors);
     */table.prototype.validate_expressions=function(expressions,override=true){const validated={expression_schema:{},expression_alias:{},errors:{}};if(!expressions||Object.keys(expressions).length===0){return validated;}expressions=parse_expression_strings(expressions);// Transform Array into a C++ vector that can be passed through
// Emscripten.
let vector=__MODULE__.make_2d_val_vector();for(let expression of expressions){let inner=__MODULE__.make_val_vector();for(let val of expression){inner.push_back(val);}vector.push_back(inner);validated.expression_alias[expression[0]]=expression[1];}const validation_results=__MODULE__.validate_expressions(this._Table,vector);const expression_schema=validation_results.get_expression_schema();const expression_errors=validation_results.get_expression_errors();const expression_aliases=expression_schema.keys();for(let i=0;i<expression_aliases.size();i++){const alias=expression_aliases.get(i);let dtype=expression_schema.get(alias);if(override&&this.overridden_types[alias]){dtype=this.overridden_types[alias];}validated.expression_schema[alias]=dtype;}const error_aliases=expression_errors.keys();for(let i=0;i<error_aliases.size();i++){const alias=error_aliases.get(i);// bound using `value_object` in embind so no need to manually
// convert to Object, or call delete() as memory is auto-managed.
const error_object=expression_errors.get(alias);validated.errors[alias]=error_object;}error_aliases.delete();expression_aliases.delete();expression_errors.delete();expression_schema.delete();validation_results.delete();return validated;};/**
     * Validates a filter configuration, i.e. that the value to filter by is not
     * null or undefined.
     *
     * @async
     * @param {Array<string>} [filter] a filter configuration to test.
     */table.prototype.is_valid_filter=function(filter){// isNull and isNotNull filter operators are always valid and apply to
// all schema types
if(filter[1]===perspective.FILTER_OPERATORS.isNull||filter[1]===perspective.FILTER_OPERATORS.isNotNull){return true;}let value=filter[2];if(value===null){return false;}const schema=this.schema();const exists=schema[filter[0]];if(exists&&(schema[filter[0]]==="date"||schema[filter[0]]==="datetime")){return __MODULE__.is_valid_datetime(filter[2]);}return typeof value!=="undefined"&&value!==null;};/**
     * Create a new {@link module:perspective~view} from this table with a
     * specified configuration. For a better understanding of the View
     * configuration options, see the
     * [Documentation](https://perspective.finos.org/docs/md/view.html).
     *
     * @param {Object} [config] The configuration object for this
     * {@link module:perspective~view}.
     * @param {Array<string>} [config.group_by] An array of column names to
     * use as {@link https://en.wikipedia.org/wiki/Pivot_table#Row_labels Group By}.
     * @param {Array<string>} [config.split_by] An array of column names to
     * use as {@link https://en.wikipedia.org/wiki/Pivot_table#Column_labels Split By}.
     * @param {Array<Object>} [config.columns] An array of column names for the
     * output columns. If none are provided, all columns are output.
     * @param {Object} [config.aggregates] An object, the keys of which are
     * column names, and their respective values are the aggregates calculations
     * to use when this view has `group_by`. A column provided to
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
     *      group_by: ["region"],
     *      columns: ["region"],
     *      aggregates: {"region": "dominant"},
     *      filter: [["client", "contains", "fred"]],
     *      sort: [["value", "asc"]]
     * });
     *
     * @returns {Promise<view>} A Promise that resolves to a new
     * {@link module:perspective~view} object for the supplied configuration,
     * bound to this table.
     */table.prototype.view=function(_config={}){_call_process(this._Table.get_id());let config={};for(const key of Object.keys(_config)){if(CONFIG_ALIASES[key]){if(!config[CONFIG_ALIASES[key]]){if(!WARNED_KEYS.has(key)){console.warn(`Deprecated: "${key}" config parameter, please use "${CONFIG_ALIASES[key]}" instead`);WARNED_KEYS.add(key);}config[CONFIG_ALIASES[key]]=_config[key];}else{throw new Error(`Duplicate configuration parameter "${key}"`);}}else if(key==="aggregate"){if(!WARNED_KEYS.has("aggregate")){console.warn(`Deprecated: "aggregate" config parameter has been replaced by "aggregates" and "columns"`);WARNED_KEYS.add("aggregate");}// backwards compatibility: deconstruct `aggregate` into
// `aggregates` and `columns`
config["aggregates"]={};config["columns"]=[];for(const agg of _config["aggregate"]){config["aggregates"][agg["column"]]=agg["op"];config["columns"].push(agg["column"]);}}else if(CONFIG_VALID_KEYS.indexOf(key)>-1){config[key]=_config[key];}else{throw new Error(`Unrecognized config parameter "${key}"`);}}config.group_by=config.group_by||[];config.split_by=config.split_by||[];config.aggregates=config.aggregates||{};config.filter=config.filter||[];config.sort=config.sort||[];config.expressions=config.expressions||{};const table_schema=this.schema();if(config.expressions!==undefined){if(Array.isArray(config.expressions)){console.warn("Legacy `expressions` format: "+JSON.stringify(config.expressions));}config.expressions=parse_expression_strings(config.expressions);}if(config.columns===undefined){// If columns are not provided, use all columns
config.columns=this.columns();if(config.expressions!=undefined){for(const expr of config.expressions){config.columns.push(expr[0]);}}}// convert date/datetime filters to Date() objects, so they are parsed
// as local time
if(config.filter.length>0){for(let filter of config.filter){// TODO: this does not work for expressions
const dtype=table_schema[filter[0]];const is_compare=filter[1]!==perspective.FILTER_OPERATORS.isNull&&filter[1]!==perspective.FILTER_OPERATORS.isNotNull;if(is_compare&&(dtype==="date"||dtype==="datetime")){// new Date() accepts strings and new Date() objects, so no
// need to type check here.
filter[2]=new Date(filter[2]);}}}let name=Math.random()+"";let sides;if(config.group_by.length>0||config.split_by.length>0){if(config.split_by&&config.split_by.length>0){sides=2;}else{sides=1;}}else{sides=0;}let vc=new view_config(config);let v=new view(this,sides,config,vc,name);this.views.push(v);return v;};let meter;function initialize_profile_thread(){if(meter===undefined){let _msgs=0;let start=performance.now();setTimeout(function poll(){let now=performance.now();console.log(`${(1000*_msgs/(now-start)).toFixed(2)} msgs/sec`);_msgs=0;start=now;setTimeout(poll,5000);},5000);meter=function update(x){_msgs+=x;};console.log("Profiling initialized");}}table.prototype.query_columns=function(config,format){const view=this.view(config);const columns=view.to_columns(format);view.delete();return columns;};/**
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
     */table.prototype.update=function(data,options){options=options||{};options.port_id=options.port_id||0;let pdata;let cols=this.columns();let schema=this._Table.get_schema();let types=schema.types();let is_arrow=false;let is_csv=false;pdata=accessor;if(data instanceof ArrayBuffer){pdata=new Uint8Array(data);is_arrow=true;}else if(typeof data==="string"){if(data[0]===","){data="_"+data;}is_csv=true;is_arrow=true;pdata=data;}else{accessor.init(data);accessor.names=cols.concat(accessor.names.filter(x=>x==="__INDEX__"));accessor.types=extract_vector(types).slice(0,cols.length);if(meter){meter(accessor.row_count);}}if(!is_arrow){if(pdata.row_count===0){console.warn("table.update called with no data - ignoring");return;}// process implicit index column
const has_index=accessor.names.indexOf("__INDEX__");if(has_index!=-1){const explicit_index=!!this.index;if(explicit_index){// find the type of the index column
accessor.types.push(accessor.types[accessor.names.indexOf(this.index)]);}else{// default index is an integer
accessor.types.push(__MODULE__.t_dtype.DTYPE_INT32);}}}try{const op=__MODULE__.t_op.OP_INSERT;// update the Table in C++, but don't keep the returned C++ Table
// reference as it is identical
make_table(pdata,this._Table,this.index,this.limit,op,true,is_arrow,is_csv,options.port_id).delete();this.initialized=true;}catch(e){console.error(`Update failed: ${e}`);}finally{schema.delete();}};/**
     * Removes the rows of a {@link module:perspective~table}. Removed rows are
     * pushed down to any derived {@link module:perspective~view} objects.
     *
     * @param {Array<Object>} data An array of primary keys to remove.
     *
     * @see {@link module:perspective~table}
     */table.prototype.remove=function(data,options){if(!this.index){console.error("Cannot call `remove()` on a Table without a user-specified index.");return;}options=options||{};options.port_id=options.port_id||0;let pdata;let cols=this.columns();let schema=this._Table.get_schema();let types=schema.types();let is_arrow=false;data=data.map(idx=>({[this.index]:idx}));if(data instanceof ArrayBuffer){pdata=new Uint8Array(data);is_arrow=true;}else{accessor.init(data);accessor.names=[this.index];accessor.types=[extract_vector(types)[cols.indexOf(this.index)]];pdata=accessor;}try{const op=__MODULE__.t_op.OP_DELETE;// update the Table in C++, but don't keep the returned Table
// reference as it is identical
make_table(pdata,this._Table,this.index,this.limit,op,false,is_arrow,false,options.port_id).delete();this.initialized=true;}catch(e){console.error(`Remove failed`,e);}finally{schema.delete();}};/**
     * The column names of this table.
     *
     * @async
     * @returns {Promise<Array<string>>} An array of column names for this
     * table.
     */table.prototype.columns=function(){let schema=this._Table.get_schema();let cols=schema.columns();let names=[];for(let cidx=0;cidx<cols.size();cidx++){let name=cols.get(cidx);if(name!=="psp_okey"){names.push(name);}}schema.delete();cols.delete();return names;};table.prototype.execute=function(f){f(this);};/***************************************************************************
     *
     * Perspective
     *
     */const perspective={__module__:__MODULE__,Server: Server,worker:function(){return this;},initialize_profile_thread,memory_usage,/**
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
         */table:function(data,options){options=options||{};// Always store index and limit as user-provided values or `null`.
options.index=options.index||null;options.limit=options.limit||null;let data_accessor;let is_arrow=false;let overridden_types={};let is_csv=false;if(data instanceof ArrayBuffer||typeof Buffer!=="undefined"&&data instanceof Buffer){data_accessor=new Uint8Array(data);is_arrow=true;}else if(typeof data==="string"){if(data[0]===","){data="_"+data;}is_csv=true;is_arrow=true;data_accessor=data;}else{accessor.clean();overridden_types=accessor.init(data);data_accessor=accessor;}if(options.index&&options.limit){throw`Cannot specify both index '${options.index}' and limit '${options.limit}'.`;}let _Table;try{const op=__MODULE__.t_op.OP_INSERT;// C++ Table constructor cannot take null values for index
// and limit, so `make_table` will convert null to default
// values of "" for index and 4294967295 for limit. Tables
// must be created on port 0.
_Table=make_table(data_accessor,undefined,options.index,options.limit,op,false,is_arrow,is_csv,0);// Pass through user-provided values or `null` to the
// Javascript Table constructor.
return new table(_Table,options.index,options.limit,overridden_types);}catch(e){if(_Table){_Table.delete();}console.error(`Table initialization failed: ${e}`);throw e;}}};for(let prop of Object.keys(constants_namespaceObject)){perspective[prop]=constants_namespaceObject[prop];}/**
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
     */class WebWorkerServer extends Server{/**
         * On initialization, listen for messages posted from the client and
         * send it to `Server.process()`.
         *
         * @param perspective a reference to the Perspective module, allowing
         * the `Server` to access Perspective methods.
         */constructor(perspective){super(perspective);self.addEventListener("message",e=>this.process(e.data),false);}/**
         * Implements the `Server`'s `post()` method using the Web Worker
         * `postMessage()` API.
         *
         * @param {Object} msg a message to pass to the client
         * @param {*} transfer a transferable object to pass to the client, if
         * needed
         */post(msg,transfer){self.postMessage(msg,transfer);}/**
         * When initialized, replace Perspective's internal `__MODULE` variable
         * with the WASM binary.
         *
         * @param {ArrayBuffer} buffer an ArrayBuffer or Buffer containing the
         * Perspective WASM code
         */async init(msg){let wasmBinary=msg.buffer;const mod=await WebAssembly.instantiate(wasmBinary);const exports=mod.instance.exports;const size=exports.size();const offset=exports.offset();const array=new Uint8Array(exports.memory.buffer);wasmBinary=array.slice(offset,offset+size);__MODULE__=await __MODULE__({wasmBinary,wasmJSMethod:"native-wasm",locateFile:x=>x});__MODULE__.init();super.init(msg);}}/**
     * Use WebSorkerServer as default inside a Web Worker, where `window` is
     * replaced with `self`.
     */if(typeof self!=="undefined"&&self.addEventListener){new WebWorkerServer(perspective);}return perspective;}
;// CONCATENATED MODULE: ../packages/perspective/src/js/perspective.worker.js
// ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
// ┃ ██████ ██████ ██████       █      █      █      █      █ █▄  ▀███ █       ┃
// ┃ ▄▄▄▄▄█ █▄▄▄▄▄ ▄▄▄▄▄█  ▀▀▀▀▀█▀▀▀▀▀ █ ▀▀▀▀▀█ ████████▌▐███ ███▄  ▀█ █ ▀▀▀▀▀ ┃
// ┃ █▀▀▀▀▀ █▀▀▀▀▀ █▀██▀▀ ▄▄▄▄▄ █ ▄▄▄▄▄█ ▄▄▄▄▄█ ████████▌▐███ █████▄   █ ▄▄▄▄▄ ┃
// ┃ █      ██████ █  ▀█▄       █ ██████      █      ███▌▐███ ███████▄ █       ┃
// ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
// ┃ Copyright (c) 2017, the Perspective Authors.                              ┃
// ┃ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ┃
// ┃ This file is part of the Perspective library, distributed under the terms ┃
// ┃ of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0). ┃
// ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛




/* harmony default export */ const perspective_worker = (globalThis.perspective = perspective(perspective_cpp));

})();

/******/ })()
;