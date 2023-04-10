"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var ts_morph_1 = require("ts-morph");
var fs = require("fs");
var jsonlines = require("jsonlines");
function generateArtifacts() {
    var _a;
    return __awaiter(this, void 0, void 0, function () {
        var project, ignoreFields, sourceFiles, artifacts, _i, sourceFiles_1, sourceFile, apiDefs, reactComponents, _loop_1, _b, apiDefs_1, apiDef, _c, reactComponents_1, reactComponent, defaultExportName, hooks, childComponents, prompt_1, result, writeStream, stringifyStream, _d, artifacts_1, artifact;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    project = new ts_morph_1.Project({
                        tsConfigFilePath: './tsconfig.json',
                    });
                    return [4 /*yield*/, fs.promises.readFile('ignore_fields', 'utf-8')];
                case 1: return [4 /*yield*/, (_e.sent()).split('\n')];
                case 2:
                    ignoreFields = (_e.sent());
                    sourceFiles = project.getSourceFiles();
                    artifacts = [];
                    for (_i = 0, sourceFiles_1 = sourceFiles; _i < sourceFiles_1.length; _i++) {
                        sourceFile = sourceFiles_1[_i];
                        apiDefs = sourceFile.getVariableDeclarations().filter(function (declaration) { return declaration.getName().endsWith('Api'); });
                        reactComponents = sourceFile.getFunctions().filter(function (func) { return func.getReturnType().getText().includes('JSX.Element'); });
                        _loop_1 = function (apiDef) {
                            if (apiDef) {
                                var endpoints = (_a = apiDef.getInitializer()) === null || _a === void 0 ? void 0 : _a.getDescendantsOfKind(ts_morph_1.SyntaxKind.PropertyAssignment).filter(function (e) {
                                    return !ignoreFields.includes(e.getName());
                                }).map(function (endpoint) {
                                    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                                    var endpointName = endpoint.getName();
                                    var endpointArgs = (_c = (_b = (_a = endpoint.getType().getProperty('queryArg')) === null || _a === void 0 ? void 0 : _a.getValueDeclaration()) === null || _b === void 0 ? void 0 : _b.getText()) !== null && _c !== void 0 ? _c : '';
                                    var endpointPath = (_f = (_e = (_d = endpoint.getType().getProperty('url')) === null || _d === void 0 ? void 0 : _d.getValueDeclaration()) === null || _e === void 0 ? void 0 : _e.getText()) !== null && _f !== void 0 ? _f : '';
                                    var endpointResult = (_j = (_h = (_g = endpoint.getType().getProperty('resultType')) === null || _g === void 0 ? void 0 : _g.getValueDeclaration()) === null || _h === void 0 ? void 0 : _h.getText()) !== null && _j !== void 0 ? _j : '';
                                    return { endpointName: endpointName, endpointArgs: endpointArgs, endpointPath: endpointPath, endpointResult: endpointResult };
                                });
                                var types = sourceFile.getInterfaces().map(function (type) { return type.getText(); });
                                var exportedDeclarationsMap = sourceFile.getExportedDeclarations();
                                var exportedTypes_1 = [];
                                var iterator = Array.from(exportedDeclarationsMap.entries());
                                iterator.forEach(function (_a) {
                                    var exportName = _a[0], declarations = _a[1];
                                    var typeDeclarations = declarations.filter(function (declaration) { return declaration.getKind() === ts_morph_1.SyntaxKind.TypeAliasDeclaration ||
                                        declaration.getKind() === ts_morph_1.SyntaxKind.ClassDeclaration ||
                                        declaration.getKind() === ts_morph_1.SyntaxKind.EnumDeclaration ||
                                        declaration.getKind() === ts_morph_1.SyntaxKind.InterfaceDeclaration; });
                                    exportedTypes_1.push.apply(exportedTypes_1, typeDeclarations);
                                });
                                types.concat(exportedTypes_1.map(function (type) { return type.getText(); }));
                                var prompt_2 = {
                                    fileName: sourceFile.getBaseName(),
                                    endpoints: endpoints,
                                    types: types,
                                };
                                var result = apiDef.getText();
                                artifacts.push({ prompt: prompt_2, result: result });
                            }
                        };
                        for (_b = 0, apiDefs_1 = apiDefs; _b < apiDefs_1.length; _b++) {
                            apiDef = apiDefs_1[_b];
                            _loop_1(apiDef);
                        }
                        for (_c = 0, reactComponents_1 = reactComponents; _c < reactComponents_1.length; _c++) {
                            reactComponent = reactComponents_1[_c];
                            defaultExportName = reactComponent.getName();
                            hooks = sourceFile.getImportDeclarations()
                                .filter(function (imp) { return imp.getModuleSpecifierValue().endsWith('/hooks'); })
                                .flatMap(function (imp) { return imp.getNamedImports().map(function (spec) { return spec.getName(); }); });
                            childComponents = sourceFile.getVariableDeclarations()
                                .filter(function (declaration) { var _a; return (_a = declaration.getInitializer()) === null || _a === void 0 ? void 0 : _a.getText().includes('useComponents'); })
                                .flatMap(function (declaration) {
                                var initializer = declaration.getInitializer();
                                if (ts_morph_1.Node.isCallExpression(initializer)) {
                                    return initializer.getArguments().map(function (arg) { return arg.getText(); });
                                }
                                else {
                                    return [];
                                }
                            });
                            prompt_1 = {
                                fileName: sourceFile.getBaseName(),
                                defaultExportName: defaultExportName,
                                hooks: hooks,
                                childComponents: childComponents,
                            };
                            result = reactComponent.getText();
                            artifacts.push({ prompt: prompt_1, result: result });
                        }
                    }
                    return [4 /*yield*/, fs.promises.writeFile('artifacts.jsonl', '')];
                case 3:
                    _e.sent();
                    writeStream = fs.createWriteStream('artifacts.jsonl');
                    stringifyStream = jsonlines.stringify();
                    stringifyStream.pipe(writeStream);
                    for (_d = 0, artifacts_1 = artifacts; _d < artifacts_1.length; _d++) {
                        artifact = artifacts_1[_d];
                        stringifyStream.write(artifact);
                    }
                    stringifyStream.end();
                    return [2 /*return*/];
            }
        });
    });
}
generateArtifacts().catch(console.error);
