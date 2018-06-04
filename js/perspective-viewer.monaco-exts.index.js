(self["webpackChunk_finos_docs"] = self["webpackChunk_finos_docs"] || []).push([["perspective-viewer.monaco-exts"],{

/***/ "../packages/perspective-viewer/dist/esm/@finos/perspective-vieux/src/js/monaco.js":
/*!*****************************************************************************************!*\
  !*** ../packages/perspective-viewer/dist/esm/@finos/perspective-vieux/src/js/monaco.js ***!
  \*****************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var monaco_editor_esm_vs_editor_browser_controller_coreCommands_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/browser/controller/coreCommands.js */ "../node_modules/monaco-editor/esm/vs/editor/browser/controller/coreCommands.js");
/* harmony import */ var monaco_editor_esm_vs_editor_browser_widget_codeEditorWidget_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/browser/widget/codeEditorWidget.js */ "../node_modules/monaco-editor/esm/vs/editor/browser/widget/codeEditorWidget.js");
/* harmony import */ var monaco_editor_esm_vs_editor_browser_widget_diffEditorWidget_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/browser/widget/diffEditorWidget.js */ "../node_modules/monaco-editor/esm/vs/editor/browser/widget/diffEditorWidget.js");
/* harmony import */ var monaco_editor_esm_vs_editor_browser_widget_diffNavigator_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/browser/widget/diffNavigator.js */ "../node_modules/monaco-editor/esm/vs/editor/browser/widget/diffNavigator.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_anchorSelect_anchorSelect_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/anchorSelect/anchorSelect.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/anchorSelect/anchorSelect.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_bracketMatching_bracketMatching_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/bracketMatching/bracketMatching.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/bracketMatching/bracketMatching.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_caretOperations_caretOperations_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/caretOperations/caretOperations.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/caretOperations/caretOperations.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_caretOperations_transpose_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/caretOperations/transpose.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/caretOperations/transpose.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_clipboard_clipboard_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/clipboard/clipboard.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/clipboard/clipboard.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_codeAction_codeActionContributions_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/codeAction/codeActionContributions.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/codeAction/codeActionContributions.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_codelens_codelensController_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/codelens/codelensController.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/codelens/codelensController.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_colorPicker_colorContributions_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/colorPicker/colorContributions.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/colorPicker/colorContributions.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_comment_comment_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/comment/comment.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/comment/comment.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_contextmenu_contextmenu_js__WEBPACK_IMPORTED_MODULE_13__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/contextmenu/contextmenu.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/contextmenu/contextmenu.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_cursorUndo_cursorUndo_js__WEBPACK_IMPORTED_MODULE_14__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/cursorUndo/cursorUndo.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/cursorUndo/cursorUndo.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_dnd_dnd_js__WEBPACK_IMPORTED_MODULE_15__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/dnd/dnd.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/dnd/dnd.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_documentSymbols_documentSymbols_js__WEBPACK_IMPORTED_MODULE_16__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/documentSymbols/documentSymbols.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/documentSymbols/documentSymbols.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_find_findController_js__WEBPACK_IMPORTED_MODULE_17__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/find/findController.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/find/findController.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_folding_folding_js__WEBPACK_IMPORTED_MODULE_18__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/folding/folding.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/folding/folding.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_fontZoom_fontZoom_js__WEBPACK_IMPORTED_MODULE_19__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/fontZoom/fontZoom.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/fontZoom/fontZoom.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_format_formatActions_js__WEBPACK_IMPORTED_MODULE_20__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/format/formatActions.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/format/formatActions.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_gotoError_gotoError_js__WEBPACK_IMPORTED_MODULE_21__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/gotoError/gotoError.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/gotoError/gotoError.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_gotoSymbol_goToCommands_js__WEBPACK_IMPORTED_MODULE_22__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/gotoSymbol/goToCommands.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/gotoSymbol/goToCommands.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_gotoSymbol_link_goToDefinitionAtPosition_js__WEBPACK_IMPORTED_MODULE_23__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/gotoSymbol/link/goToDefinitionAtPosition.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/gotoSymbol/link/goToDefinitionAtPosition.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_hover_hover_js__WEBPACK_IMPORTED_MODULE_24__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/hover/hover.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/hover/hover.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_inPlaceReplace_inPlaceReplace_js__WEBPACK_IMPORTED_MODULE_25__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/inPlaceReplace/inPlaceReplace.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/inPlaceReplace/inPlaceReplace.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_indentation_indentation_js__WEBPACK_IMPORTED_MODULE_26__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/indentation/indentation.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/indentation/indentation.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_inlineHints_inlineHintsController_js__WEBPACK_IMPORTED_MODULE_27__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/inlineHints/inlineHintsController.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/inlineHints/inlineHintsController.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_linesOperations_linesOperations_js__WEBPACK_IMPORTED_MODULE_28__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/linesOperations/linesOperations.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/linesOperations/linesOperations.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_linkedEditing_linkedEditing_js__WEBPACK_IMPORTED_MODULE_29__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/linkedEditing/linkedEditing.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/linkedEditing/linkedEditing.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_links_links_js__WEBPACK_IMPORTED_MODULE_30__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/links/links.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/links/links.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_multicursor_multicursor_js__WEBPACK_IMPORTED_MODULE_31__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/multicursor/multicursor.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/multicursor/multicursor.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_parameterHints_parameterHints_js__WEBPACK_IMPORTED_MODULE_32__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/parameterHints/parameterHints.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/parameterHints/parameterHints.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_rename_rename_js__WEBPACK_IMPORTED_MODULE_33__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/rename/rename.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/rename/rename.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_smartSelect_smartSelect_js__WEBPACK_IMPORTED_MODULE_34__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/smartSelect/smartSelect.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/smartSelect/smartSelect.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_snippet_snippetController2_js__WEBPACK_IMPORTED_MODULE_35__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/snippet/snippetController2.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/snippet/snippetController2.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_suggest_suggestController_js__WEBPACK_IMPORTED_MODULE_36__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/suggest/suggestController.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/suggest/suggestController.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_toggleTabFocusMode_toggleTabFocusMode_js__WEBPACK_IMPORTED_MODULE_37__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/toggleTabFocusMode/toggleTabFocusMode.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/toggleTabFocusMode/toggleTabFocusMode.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_unusualLineTerminators_unusualLineTerminators_js__WEBPACK_IMPORTED_MODULE_38__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/unusualLineTerminators/unusualLineTerminators.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/unusualLineTerminators/unusualLineTerminators.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_viewportSemanticTokens_viewportSemanticTokens_js__WEBPACK_IMPORTED_MODULE_39__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/viewportSemanticTokens/viewportSemanticTokens.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/viewportSemanticTokens/viewportSemanticTokens.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_wordHighlighter_wordHighlighter_js__WEBPACK_IMPORTED_MODULE_40__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/wordHighlighter/wordHighlighter.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/wordHighlighter/wordHighlighter.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_wordOperations_wordOperations_js__WEBPACK_IMPORTED_MODULE_41__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/wordOperations/wordOperations.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/wordOperations/wordOperations.js");
/* harmony import */ var monaco_editor_esm_vs_editor_contrib_wordPartOperations_wordPartOperations_js__WEBPACK_IMPORTED_MODULE_42__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/contrib/wordPartOperations/wordPartOperations.js */ "../node_modules/monaco-editor/esm/vs/editor/contrib/wordPartOperations/wordPartOperations.js");
/* harmony import */ var monaco_editor_esm_vs_editor_standalone_browser_accessibilityHelp_accessibilityHelp_js__WEBPACK_IMPORTED_MODULE_43__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp.js */ "../node_modules/monaco-editor/esm/vs/editor/standalone/browser/accessibilityHelp/accessibilityHelp.js");
/* harmony import */ var monaco_editor_esm_vs_editor_standalone_browser_iPadShowKeyboard_iPadShowKeyboard_js__WEBPACK_IMPORTED_MODULE_44__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js */ "../node_modules/monaco-editor/esm/vs/editor/standalone/browser/iPadShowKeyboard/iPadShowKeyboard.js");
/* harmony import */ var monaco_editor_esm_vs_editor_standalone_browser_inspectTokens_inspectTokens_js__WEBPACK_IMPORTED_MODULE_45__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/standalone/browser/inspectTokens/inspectTokens.js */ "../node_modules/monaco-editor/esm/vs/editor/standalone/browser/inspectTokens/inspectTokens.js");
/* harmony import */ var monaco_editor_esm_vs_editor_standalone_browser_quickAccess_standaloneCommandsQuickAccess_js__WEBPACK_IMPORTED_MODULE_46__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js */ "../node_modules/monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneCommandsQuickAccess.js");
/* harmony import */ var monaco_editor_esm_vs_editor_standalone_browser_quickAccess_standaloneGotoLineQuickAccess_js__WEBPACK_IMPORTED_MODULE_47__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess.js */ "../node_modules/monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoLineQuickAccess.js");
/* harmony import */ var monaco_editor_esm_vs_editor_standalone_browser_quickAccess_standaloneGotoSymbolQuickAccess_js__WEBPACK_IMPORTED_MODULE_48__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess.js */ "../node_modules/monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneGotoSymbolQuickAccess.js");
/* harmony import */ var monaco_editor_esm_vs_editor_standalone_browser_quickAccess_standaloneHelpQuickAccess_js__WEBPACK_IMPORTED_MODULE_49__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess.js */ "../node_modules/monaco-editor/esm/vs/editor/standalone/browser/quickAccess/standaloneHelpQuickAccess.js");
/* harmony import */ var monaco_editor_esm_vs_editor_standalone_browser_referenceSearch_standaloneReferenceSearch_js__WEBPACK_IMPORTED_MODULE_50__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch.js */ "../node_modules/monaco-editor/esm/vs/editor/standalone/browser/referenceSearch/standaloneReferenceSearch.js");
/* harmony import */ var monaco_editor_esm_vs_editor_standalone_browser_toggleHighContrast_toggleHighContrast_js__WEBPACK_IMPORTED_MODULE_51__ = __webpack_require__(/*! monaco-editor/esm/vs/editor/standalone/browser/toggleHighContrast/toggleHighContrast.js */ "../node_modules/monaco-editor/esm/vs/editor/standalone/browser/toggleHighContrast/toggleHighContrast.js");
/******************************************************************************
 *
 * Copyright (c) 2018, the Perspective Authors.
 *
 * This file is part of the Perspective library, distributed under the terms
 * of the Apache License 2.0.  The full license can be found in the LICENSE
 * file.
 *
 */























































/***/ })

}]);
//# sourceMappingURL=perspective-viewer.monaco-exts.index.js.map