import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs-extra';

/**
 * Store the last opened file, as previews aren't active text editors,
 * so this is an easy fallback to get the relevant filename.
 */
let lastOpenedFile: string | undefined;

function infoPopup(message: string) {
    const showInformationPopups = vscode.workspace.getConfiguration('fileFlow').get('showInformationPopups', false);;

    if (showInformationPopups) {
        vscode.window.showInformationMessage(message);
    }
}

function getFilesInDirectory(directory: string): string[] {
    try {
        const items = fs.readdirSync(directory);
        const files = items.filter(item => fs.statSync(path.join(directory, item)).isFile());
        return files;
    } catch (error) {
        console.error(`Error reading directory ${directory}: ${error}`);
        return [];
    }
}

function getFoldersInDirectory(directory: string): string[] {
    try {
        const items = fs.readdirSync(directory);
        const files = items.filter(item => fs.statSync(path.join(directory, item)).isDirectory());
        return files;
    } catch (error) {
        console.error(`Error reading directory ${directory}: ${error}`);
        return [];
    }
}

function sortFiles(files: string[]): string[] {
    return files.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
}

function openFile(filePath: string): void {
    const previewSetting: string = vscode.workspace.getConfiguration('fileFlow').get('previewFiles', 'none');
    const customFilePreviewSetting: string[] = vscode.workspace.getConfiguration('fileFlow').get('previewCustomFileExtensions', []);
    const shouldPreview = previewSetting === 'all' || (previewSetting === 'custom' && customFilePreviewSetting.length > 0 && customFilePreviewSetting.includes(path.extname(filePath).toLowerCase()));

    // Closing the editor keeps the open tab list clean, but causes a flash between the tab
    // closing and new tab opening. It also interrupts with 'save this file?' prompts.
    // vscode.commands.executeCommand('workbench.action.closeActiveEditor').then(() => {
        vscode.workspace.openTextDocument(filePath).then(document => {
            if (shouldPreview) {
                vscode.commands.executeCommand('markdown.showPreview', vscode.Uri.file(filePath));
            } else {
                vscode.window.showTextDocument(document);
            }

            lastOpenedFile = document.fileName;

            const showNavigationPopups = vscode.workspace.getConfiguration('fileFlow').get('showNavigationPopups', false);

            if (showNavigationPopups) {
                const navButtons: ButtonObject = {};

                if (getAdjacentFilePath(filePath, 'previous')) {
                    navButtons['Previous'] = () => {
                        const nextFilePath = getAdjacentFilePath(filePath, 'previous');
                        if (nextFilePath) {
                            openFile(nextFilePath);
                        }
                    };
                }
                if (getAdjacentFilePath(filePath, 'next')) {
                    navButtons['Next'] = () => {
                        const previousFilePath = getAdjacentFilePath(filePath, 'next');
                        if (previousFilePath) {
                            openFile(previousFilePath);
                        }
                    };
                }
                infoPopupWithButtons('Navigate', navButtons);
            }
        });
    // });
}

interface ButtonObject {
    [key: string]: () => void;
}

function infoPopupWithButtons(message: string, buttons: ButtonObject) {
    vscode.window.showInformationMessage(
        message,
        { modal: false },
        ...Object.keys(buttons)
    ).then((selectedButton) => {
        if (selectedButton) {
            buttons[selectedButton]();
        }
    });
}

function getAdjacentFilePath(currentFilePath: string, direction: 'next' | 'previous'): string | undefined {
    const currentDirectory = path.dirname(currentFilePath);
    const filesInDirectory = getFilesInDirectory(currentDirectory);
    const sortedFiles = sortFiles(filesInDirectory);
    const outOfBoundsBehavior: string = vscode.workspace.getConfiguration('fileFlow').get('outOfBoundsBehavior', 'none');

    const currentFileName = path.basename(currentFilePath)
        .replace(/\.git$/, ''); // For some reason files randomly get `.git` appended to the end in the file path
    const currentIndex = sortedFiles.findIndex(file => path.basename(file) === currentFileName);

    let newIndex: number;

    if (direction === 'next') {
        newIndex = currentIndex + 1;
        if (outOfBoundsBehavior === 'loopCurrent' && newIndex >= sortedFiles.length) {
            newIndex = 0;
        }
    } else {
        newIndex = currentIndex - 1;
        if (outOfBoundsBehavior === 'loopCurrent' && newIndex < 0) {
            newIndex = sortedFiles.length - 1;
        }
    }

    if (outOfBoundsBehavior === 'none' && (newIndex === currentIndex || newIndex < 0 || newIndex >= sortedFiles.length)) {
        return undefined;
    }

    if (outOfBoundsBehavior === 'loopCurrent' && (newIndex === currentIndex)) {
        newIndex = direction === 'next' ? 0 : sortedFiles.length - 1;
    }

    if (outOfBoundsBehavior === 'goToNextFolder' && (newIndex < 0 || newIndex >= sortedFiles.length)) {
        if (direction === 'next') {
            return getFirstFileInNextFolder();
        }

        return getLastFileInPreviousFolder();
    }

    console.log({_message: 'Look Here!!', currentFileName, currentIndex, direction, outOfBoundsBehavior, sortedFiles});

    return path.join(currentDirectory, sortedFiles[newIndex]);
}

function getFirstFileInNextFolder(): string | undefined {
    const currentFilePath = getCurrentFilePath();

    if (currentFilePath) {
        const parentDirectory = path.join(path.dirname(currentFilePath), '..');
        const foldersInParent = getFoldersInDirectory(parentDirectory).filter(item => fs.statSync(path.join(parentDirectory, item)).isDirectory());
        const sortedFolders = sortFiles(foldersInParent);
        const currentFolderName = path.basename(path.dirname(currentFilePath));
        const currentIndex = sortedFolders.findIndex(folder => path.basename(folder) === currentFolderName);

        if (currentIndex !== -1 && currentIndex + 1 < sortedFolders.length) {
            const nextFolder = sortedFolders[currentIndex + 1];

            const nextFolderFiles = getFilesInDirectory(path.join(parentDirectory, nextFolder));
            const sortedNextFolderFiles = sortFiles(nextFolderFiles);

            if (sortedNextFolderFiles.length > 0) {
                const firstFileInNextFolder = path.join(parentDirectory, nextFolder, sortedNextFolderFiles[0]);
                return firstFileInNextFolder;
            }
        }
    }
}

function getLastFileInPreviousFolder(): string | undefined {
    const currentFilePath = getCurrentFilePath();

    if (currentFilePath) {
        const parentDirectory = path.join(path.dirname(currentFilePath), '..');
        const foldersInParent = getFoldersInDirectory(parentDirectory).filter(item => fs.statSync(path.join(parentDirectory, item)).isDirectory());
        const sortedFolders = sortFiles(foldersInParent);
        const currentFolderName = path.basename(path.dirname(currentFilePath));
        const currentIndex = sortedFolders.findIndex(folder => path.basename(folder) === currentFolderName);

        if (currentIndex !== -1 && currentIndex > 0) {
            const previousFolder = sortedFolders[currentIndex - 1];

            const previousFolderFiles = getFilesInDirectory(path.join(parentDirectory, previousFolder));
            const sortedPreviousFolderFiles = sortFiles(previousFolderFiles);

            if (sortedPreviousFolderFiles.length > 0) {
                const lastFileInPreviousFolder = path.join(parentDirectory, previousFolder, sortedPreviousFolderFiles[sortedPreviousFolderFiles.length - 1]);
                return lastFileInPreviousFolder;
            }
        }
    }
}

function getCurrentFilePath(): string | undefined {
    const currentDocument = vscode.window.activeTextEditor?.document;

    if (currentDocument) {
        return currentDocument.fileName;
    }

    if (lastOpenedFile) {
        return lastOpenedFile;
    }

    const lastOpenedEditor = vscode.window.visibleTextEditors[vscode.window.visibleTextEditors.length - 1]?.document;

    if (lastOpenedEditor) {
        return lastOpenedEditor.fileName;
    }
}

export function activate(context: vscode.ExtensionContext) {
    let onOpenDisposable = vscode.workspace.onDidOpenTextDocument((document) => {
        if (!document.isUntitled) {
            lastOpenedFile = document.fileName;
        }
    });

    let disposableNextFile = vscode.commands.registerCommand('fileFlow.goToNextFile', () => {
        const currentFilePath = getCurrentFilePath();
        if (currentFilePath) {
            const nextFile = getAdjacentFilePath(currentFilePath, 'next');
            if (nextFile) {
                openFile(nextFile);
            } else {
                infoPopup('There is no next file to go to.');
            }
        }
    });

    let disposablePreviousFile = vscode.commands.registerCommand('fileFlow.goToPreviousFile', () => {
        const currentFilePath = getCurrentFilePath();
        if (currentFilePath) {
            const previousFile = getAdjacentFilePath(currentFilePath, 'previous');
            if (previousFile) {
                openFile(previousFile);
            } else {
                infoPopup('There is no previous file to go to.');
            }
        }
    });

    let disposableNextFolder = vscode.commands.registerCommand('fileFlow.goToNextFolder', () => {
        const firstFileInNextFolder = getFirstFileInNextFolder();

        if (firstFileInNextFolder) {
            openFile(firstFileInNextFolder);
        } else {
            infoPopup('There is no next folder to go to.');
        }
    });

    let disposablePreviousFolder = vscode.commands.registerCommand('fileFlow.goToPreviousFolder', () => {
        const lastFileInPreviousFolder = getLastFileInPreviousFolder();

        if (lastFileInPreviousFolder) {
            openFile(lastFileInPreviousFolder);
        } else {
            infoPopup('There is no previous folder to go to.');
        }
    });

    let disposableFirstFile = vscode.commands.registerCommand('fileFlow.goToFirstFile', () => {
        const currentFilePath = getCurrentFilePath();
        if (currentFilePath) {
            const currentDirectory = path.dirname(currentFilePath);
            const filesInDirectory = getFilesInDirectory(currentDirectory);
            const sortedFiles = sortFiles(filesInDirectory);
            const firstFilePath = path.join(currentDirectory, sortedFiles[0]);
            openFile(firstFilePath);
        }
    });

    let disposableLastFile = vscode.commands.registerCommand('fileFlow.goToLastFile', () => {
        const currentFilePath = getCurrentFilePath();
        if (currentFilePath) {
            const currentDirectory = path.dirname(currentFilePath);
            const filesInDirectory = getFilesInDirectory(currentDirectory);
            const sortedFiles = sortFiles(filesInDirectory);
            const lastFilePath = path.join(currentDirectory, sortedFiles[sortedFiles.length - 1]);
            openFile(lastFilePath);
        }
    });

    context.subscriptions.push(onOpenDisposable, disposableNextFile, disposablePreviousFile, disposableNextFolder, disposablePreviousFolder, disposableFirstFile, disposableLastFile);
}
