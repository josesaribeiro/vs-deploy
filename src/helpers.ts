/// <reference types="node" />

// The MIT License (MIT)
// 
// vs-deploy (https://github.com/mkloubert/vs-deploy)
// Copyright (c) Marcel Joachim Kloubert <marcel.kloubert@gmx.net>
// 
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
// 
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
// 
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.

import * as deploy_contracts from './contracts';
import * as FS from 'fs';
import * as Moment from 'moment';
import * as Path from 'path';
import * as vscode from 'vscode';


/**
 * Creates a quick pick for deploying a single file.
 * 
 * @param {string} file The file to deploy.
 * @param {deploy_contracts.DeployTarget} target The target to deploy to.
 * @param {number} index The zero based index.
 * 
 * @returns {deploy_contracts.DeployFileQuickPickItem} The new item.
 */
export function createFileQuickPick(file: string, target: deploy_contracts.DeployTarget, index: number): deploy_contracts.DeployFileQuickPickItem {
    let qp: any = createTargetQuickPick(target, index);
    qp['file'] = file;

    return qp;
}

/**
 * Creates a quick pick for a package.
 * 
 * @param {deploy_contracts.DeployPackage} pkg The package.
 * @param {number} index The zero based index.
 * 
 * @returns {deploy_contracts.DeployPackageQuickPickItem} The new item.
 */
export function createPackageQuickPick(pkg: deploy_contracts.DeployPackage, index: number): deploy_contracts.DeployPackageQuickPickItem {
    let name = toStringSafe(pkg.name).trim();
    if (!name) {
        name = `(Package #${index + 1})`;
    }

    let description = toStringSafe(pkg.description).trim();

    return {
        description: description,
        label: name,
        package: pkg,
    };
}

/**
 * Creates a quick pick for a target.
 * 
 * @param {deploy_contracts.DeployTarget} target The target.
 * @param {number} index The zero based index.
 * 
 * @returns {deploy_contracts.DeployTargetQuickPickItem} The new item.
 */
export function createTargetQuickPick(target: deploy_contracts.DeployTarget, index: number): deploy_contracts.DeployTargetQuickPickItem {
    let name = toStringSafe(target.name).trim();
    if (!name) {
        name = `(Target #${index + 1})`;
    }

    let description = toStringSafe(target.description).trim();

    return {
        description: description,
        label: name,
        target: target,
    };
}

/**
 * Filters a list of files by a package.
 * 
 * @param {string[]} allFiles All the files to filter.
 * @param {deploy_contracts.DeployPackage} pkg The package.
 * 
 * @returns {string[]} The filtered files.
 */
export function filterFilesByPackage(allFiles: string[], pkg: deploy_contracts.DeployPackage): string[] {
    let fileFilters: string[] = [];
    if (pkg.files) {
        fileFilters = pkg.files
                         .map(x => toStringSafe(x))
                         .filter(x => x);
    }

    let excludeFilters: string[] = [];
    if (pkg.exclude) {
        excludeFilters = pkg.exclude
                            .map(x => toStringSafe(x))
                            .filter(x => x);
    }

    return allFiles.filter(x => {
        if (fileFilters.length < 1) {
            return true;
        }

        if (!Path.isAbsolute(x)) {
            x = Path.join(vscode.workspace.rootPath, x);
        }

        for (let i = 0; i < fileFilters.length; i++) {
            let ff = fileFilters[i];
            if (!Path.isAbsolute(ff)) {
                ff = Path.join(vscode.workspace.rootPath, ff);
            }

            if (x == ff) {
                let doExclude = false;
                for (let j = 0; j < excludeFilters.length; j++) {
                    let ef = excludeFilters[j];

                    if (ef == ff) {
                        doExclude = true;
                        break;
                    }
                }

                return !doExclude;
            }
        }

        return false;
    });
}

/**
 * Logs a message.
 * 
 * @param {any} message The message to log.
 */
export function log(msg) {
    if (msg) {
        let now = Moment();

        console.log(`[vs-deploy :: ${now.format('YYYY-MM-DD HH:mm:ss')}] => ${msg}`);
    }
}

/**
 * Parse a value to use as "target type" value.
 * 
 * @param {string} [str] The input value.
 * 
 * @returns {string} The output value.
 */
export function parseTargetType(str: string): string {
    if (!str) {
        str = '';
    }
    str = ('' + str).toLowerCase().trim();

    return str;
}

/**
 * Replaces all occurrences of a string.
 * 
 * @param {string} str The input string.
 * @param {string} searchValue The value to search for.
 * @param {string} replaceValue The value to replace 'searchValue' with.
 * 
 * @return {string} The output string.
 */
export function replaceAllStrings(str: string, searchValue: string, replaceValue: string) {
    str = toStringSafe(str);
    searchValue = toStringSafe(searchValue);
    replaceValue = toStringSafe(replaceValue);

    return str.split(searchValue)
              .join(replaceValue);
}

/**
 * Tries to convert a file path to a relative path.
 * 
 * @param {string} path The path to convert.
 * 
 * @return {string | false} The relative path or (false) if not possible.
 */
export function toRelativePath(path: string): string | false {
    let result: string | false = false;
    
    try {
        let normalizedPath = path;

        let wsRootPath = vscode.workspace.rootPath;
        if (wsRootPath) {
            if (FS.existsSync(wsRootPath)) {
                if (FS.lstatSync(wsRootPath).isDirectory()) {
                    if (0 == normalizedPath.indexOf(wsRootPath)) {
                        result = normalizedPath.substr(wsRootPath.length);
                        result = result.split(Path.sep).join('/');
                    }
                }
            }
        }
    }
    catch (e) { 
        log('[ERROR] helpers.toRelativePath(): ' + e)
    }

    return result;
}

/**
 * Converts a value to a string that is NOT (null) or (undefined).
 * 
 * @param {any} str The input value.
 * @param {any} defValue The default value.
 * 
 * @return {string} The output value.
 */
export function toStringSafe(str: any, defValue: any = ''): string {
    if (!str) {
        str = '';
    }
    str = '' + str;
    if (!str) {
        str = defValue;
    }

    return str;
}
