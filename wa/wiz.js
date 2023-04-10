"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findTypeAliasUsages = void 0;
var ts_morph_1 = require("ts-morph");
var fs = require("fs");
var COMPONENT_CONSTRUCTION_PROMPTS = './wiz/component_construction_example_prompts.jsonl';
var config = process.argv[2];
var purposes = {};
var componentConstructionPrompts = [];
var typeConstructionPrompts = [];
var project = new ts_morph_1.Project({
    tsConfigFilePath: './tsconfig.json',
});
var components = project.getSourceFiles().filter(function (f) { return f.getExtension() === '.tsx'; });
var allTypes = project.getSourceFiles().map(function (f) { return f.getTypeAliases(); }).flat().filter(function (t) {
    var siteType = t.getName();
    if (siteType.startsWith('I')) {
        purposes[siteType] = getPurpose(t);
        return true;
    }
});
var allTypeNames = allTypes.map(function (at) { return at.getName(); });
try {
    fs.unlinkSync('recent_log');
    fs.unlinkSync(COMPONENT_CONSTRUCTION_PROMPTS);
}
catch (error) { }
function logToFile(message, path) {
    fs.appendFileSync(path, message + '\n');
    return true;
}
function getTypeUsageDetails(node) {
    var _a, _b, _c;
    var parent = node.getParent();
    switch (parent.getKind()) {
        case ts_morph_1.SyntaxKind.PropertySignature: {
            var propSignature = parent;
            return "as the property ".concat(propSignature.getName());
        }
        case ts_morph_1.SyntaxKind.ArrayType: {
            var paramDecl = (_a = parent.getFirstAncestorByKind(ts_morph_1.SyntaxKind.PropertySignature)) === null || _a === void 0 ? void 0 : _a.getName();
            var methodProp = (_b = node.getParent().getParentIfKind(ts_morph_1.SyntaxKind.Parameter)) === null || _b === void 0 ? void 0 : _b.getName();
            if (methodProp) {
                return "as the array property ".concat(methodProp, " of the function ").concat(paramDecl);
            }
            else {
                return "as the array property ".concat(paramDecl);
            }
        }
        case ts_morph_1.SyntaxKind.Parameter: {
            var paramDecl = parent;
            var functDecl = paramDecl.getFirstAncestorByKind(ts_morph_1.SyntaxKind.FunctionType);
            var methodDecl = paramDecl.getFirstAncestorByKind(ts_morph_1.SyntaxKind.MethodSignature);
            var functParamName = "".concat(paramDecl.getName(), " of the method ").concat((_c = functDecl === null || functDecl === void 0 ? void 0 : functDecl.getParentIfKind(ts_morph_1.SyntaxKind.PropertySignature)) === null || _c === void 0 ? void 0 : _c.getName());
            var methodDeclName = "".concat(paramDecl.getName(), " of the method ").concat(methodDecl === null || methodDecl === void 0 ? void 0 : methodDecl.getName());
            logToFile(JSON.stringify({ functParamName: functParamName, methodDeclName: methodDeclName }), 'recent_log');
            return "as the parameter ".concat(functDecl ? functParamName : methodDeclName);
        }
        // Add more cases as needed
        default:
            return '';
    }
}
function fileHasShImport(sourceFile) {
    var imports = sourceFile.getImportDeclarations();
    return imports.some(function (imp) { return imp.getModuleSpecifierValue() === 'awayto/hooks' && imp.getNamedImports().some(function (namedImport) { return namedImport.getName() === 'sh'; }); });
}
function findShHookUsages(sourceFile) {
    var shUsages = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.CallExpression)
        .filter(function (callExpr) {
        var _a, _b;
        var shCallee = (_b = (_a = callExpr.getExpression().getFirstChildByKind(ts_morph_1.SyntaxKind.PropertyAccessExpression)) === null || _a === void 0 ? void 0 : _a.getFirstChildByKind(ts_morph_1.SyntaxKind.Identifier)) === null || _b === void 0 ? void 0 : _b.getText();
        logToFile(JSON.stringify({ sfN: sourceFile.getBaseNameWithoutExtension(), shCallee: shCallee }), 'recent_log');
        return shCallee === 'sh';
    });
    shUsages.forEach(function (usage) {
        var variableDeclaration = usage.getFirstAncestorByKind(ts_morph_1.SyntaxKind.VariableDeclaration);
        if (variableDeclaration) {
            var variableName = variableDeclaration.getName();
            console.log("Found variable: ".concat(variableName, " with hook usage: ").concat(usage.getText()));
        }
    });
}
function getPurpose(ancestor) {
    var _a;
    var a = ancestor;
    var hasPurpose = (_a = a.getJsDocs()[0]) === null || _a === void 0 ? void 0 : _a.getTags().find(function (t) { return t.getTagName() === 'purpose'; });
    return hasPurpose ? ": ".concat(hasPurpose.getCommentText()) : '';
}
function getDirection(ancestor, currentType) {
    var _a;
    switch (ancestor.getKind()) {
        case ts_morph_1.SyntaxKind.PropertyDeclaration: {
            return "Create a property named ".concat(ancestor.getName(), " that uses ").concat(currentType, ".");
        }
        case ts_morph_1.SyntaxKind.VariableDeclaration: {
            var initializer = ancestor.getInitializer();
            if (initializer && initializer.getKind() === ts_morph_1.SyntaxKind.ArrowFunction) {
                return "Create a constant function named ".concat(ancestor.getName(), " that takes ").concat(initializer.getParameters().length, " parameter(s) and returns ").concat(currentType, ".");
            }
            else {
                var stateVar = ancestor.getName().startsWith('[');
                return "".concat(stateVar ? 'Implement useState parts' : 'Create a constant variable', " named ").concat(ancestor.getName(), " that uses ").concat(currentType, ".");
            }
        }
        case ts_morph_1.SyntaxKind.FunctionDeclaration: {
            var a = ancestor;
            var hasIProps = ((_a = a.getParameters()[0].getType().getSymbol()) === null || _a === void 0 ? void 0 : _a.getEscapedName().toLowerCase()) === 'iprops';
            return "Create ".concat(hasIProps ? 'react component' : 'function', " named ").concat(a.getName(), " implementing ").concat(currentType, " as a parameter or return type.");
        }
        case ts_morph_1.SyntaxKind.MethodDeclaration: {
            return "Create method ".concat(ancestor.getName(), " implementing ").concat(currentType, " as a parameter, return type, or within its body.");
        }
        case ts_morph_1.SyntaxKind.ClassDeclaration: {
            return "Create class ".concat(ancestor.getName(), " implementing ").concat(currentType, " as a property, method parameter or return type, or within its body.");
        }
        case ts_morph_1.SyntaxKind.InterfaceDeclaration: {
            return "Create interface ".concat(ancestor.getName(), " implementing ").concat(currentType, " as a property type, method parameter or return type.");
        }
        case ts_morph_1.SyntaxKind.TypeAliasDeclaration: {
            var usageDetails = (ancestor === null || ancestor === void 0 ? void 0 : ancestor.getDescendantsOfKind(ts_morph_1.SyntaxKind.TypeReference).filter(function (identifier) { return identifier.getTypeName().getText() === currentType; }).map(function (identifier) { return getTypeUsageDetails(identifier); }).filter(function (detail) { return detail; }).join('; ')) || '';
            if (!usageDetails) {
                return "Create type ".concat(ancestor.getName(), " which implements ").concat(currentType).concat(usageDetails ? ": ".concat(usageDetails, ".") : '.');
            }
        }
        case ts_morph_1.SyntaxKind.EnumDeclaration: {
            return "Create enum ".concat(ancestor.getName(), " that uses ").concat(currentType, " as a member value or type.");
        }
        default: {
            console.log({ wiauhtiwuhiwue: ancestor.getName(), ajwifvw: ancestor.getKindName() });
            throw "".concat(ancestor.getName());
        }
    }
}
function getTopLevelAncestor(node) {
    var ancestorKinds = [
        [
            ts_morph_1.SyntaxKind.PropertyDeclaration,
            ts_morph_1.SyntaxKind.VariableDeclaration,
            ts_morph_1.SyntaxKind.EnumMember,
            ts_morph_1.SyntaxKind.Parameter,
        ],
        [
            ts_morph_1.SyntaxKind.FunctionDeclaration,
            ts_morph_1.SyntaxKind.MethodDeclaration,
            ts_morph_1.SyntaxKind.ClassDeclaration,
            ts_morph_1.SyntaxKind.InterfaceDeclaration,
            ts_morph_1.SyntaxKind.TypeAliasDeclaration,
            ts_morph_1.SyntaxKind.EnumDeclaration,
        ]
    ];
    var topLevelAncestor;
    var _loop_1 = function (ancestorKindGroup) {
        topLevelAncestor = node.getFirstAncestor(function (ancestor) {
            return ancestorKindGroup.includes(ancestor === null || ancestor === void 0 ? void 0 : ancestor.getKind());
        });
        if (topLevelAncestor) {
            return "break";
        }
    };
    for (var _i = 0, ancestorKinds_1 = ancestorKinds; _i < ancestorKinds_1.length; _i++) {
        var ancestorKindGroup = ancestorKinds_1[_i];
        var state_1 = _loop_1(ancestorKindGroup);
        if (state_1 === "break")
            break;
    }
    return topLevelAncestor;
}
function fileHasTypeUsages(sourceFile, allTypes) {
    var _loop_2 = function (type) {
        var typeName = type.getName();
        var usages = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.Identifier)
            .filter(function (identifier) { return identifier.getText() === typeName; });
        if (usages.length > 0) {
            return { value: true };
        }
    };
    for (var _i = 0, allTypes_1 = allTypes; _i < allTypes_1.length; _i++) {
        var type = allTypes_1[_i];
        var state_2 = _loop_2(type);
        if (typeof state_2 === "object")
            return state_2.value;
    }
    return false;
}
function findTypeAliasUsages() {
    for (var _i = 0, components_1 = components; _i < components_1.length; _i++) {
        var sourceFile = components_1[_i];
        var filePath = sourceFile.getFilePath().split('modules/')[1].split('/')[1];
        if (fileHasTypeUsages(sourceFile, allTypes)) {
            var usedTypes = [];
            var directions = [];
            var fileIdentifiers = sourceFile.getDescendantsOfKind(ts_morph_1.SyntaxKind.Identifier);
            var _loop_3 = function (currType) {
                var typeName = currType.getName();
                var relatedIdentifiers = fileIdentifiers.filter(function (i) { return i.getText() === typeName; });
                var topLevelAncestors = relatedIdentifiers.map(function (i) { return getTopLevelAncestor(i); });
                if (topLevelAncestors.length)
                    usedTypes.push(typeName);
                for (var _c = 0, topLevelAncestors_1 = topLevelAncestors; _c < topLevelAncestors_1.length; _c++) {
                    var ancestor = topLevelAncestors_1[_c];
                    if (ancestor && ![ts_morph_1.SyntaxKind.SourceFile, ts_morph_1.SyntaxKind.Parameter].includes(ancestor.getKind())) {
                        var direction = getDirection(ancestor, typeName);
                        if (directions.indexOf(direction) === -1) {
                            directions.push(direction);
                        }
                    }
                }
            };
            for (var _a = 0, allTypes_2 = allTypes; _a < allTypes_2.length; _a++) {
                var currType = allTypes_2[_a];
                _loop_3(currType);
            }
            directions.unshift("Create a react component ".concat(filePath, " implementing application types ").concat(usedTypes.join(', '), "."));
            var prompt_1 = directions.join(' ') + ' ' + "As a reminder, the application types related to this task and their purposes: ".concat(usedTypes.join(''), ".");
            componentConstructionPrompts.push(JSON.stringify({
                prompt: prompt_1,
                completion: sourceFile.getText()
            }));
        }
        if (fileHasShImport(sourceFile)) {
            findShHookUsages(sourceFile);
        }
    }
    fs.writeFileSync('wiz/component_construction_example_prompts.jsonl', componentConstructionPrompts.join('\n'));
    var _loop_4 = function (typeAlias) {
        var typeName = typeAlias.getName();
        var subIds = typeAlias.getDescendantsOfKind(ts_morph_1.SyntaxKind.Identifier).map(function (i) { return i.getText(); }).filter(function (i) { return i !== typeName && allTypeNames.includes(i); }).join(', ');
        var attributes = typeAlias.getDescendantsOfKind(ts_morph_1.SyntaxKind.PropertySignature).map(function (s) { return s.getName(); }).join(', ');
        var prompt_2 = "Create type ".concat(typeName).concat(subIds.length ? " which implements ".concat(subIds) : '').concat(attributes.length ? " with attributes ".concat(attributes) : '', ".\n\n###\n\n");
        typeConstructionPrompts.push(JSON.stringify({
            prompt: prompt_2,
            completion: " ".concat(typeAlias.getText(), "\n\n|||\n\n")
        }));
    };
    for (var _b = 0, allTypes_3 = allTypes; _b < allTypes_3.length; _b++) {
        var typeAlias = allTypes_3[_b];
        _loop_4(typeAlias);
    }
    fs.writeFileSync('wiz/type_creation_prompts.jsonl', typeConstructionPrompts.join('\n'));
}
exports.findTypeAliasUsages = findTypeAliasUsages;
findTypeAliasUsages();
